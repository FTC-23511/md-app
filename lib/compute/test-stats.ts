/**
 * Test Log auto-compute — pure, path-independent statistics.
 *
 * Spec: docs/phase2/03-test-log.md §3 (code-first compute), §2 (input modes);
 * docs/phase2/01-schema.md §4 (test_logs.extras shape); brief
 * docs/briefs/2026-06-04-2c-test-log.md (acceptance: "auto-compute, the core").
 *
 * This module is Phase 2's named safety net (CLAUDE.md rule 6 / 00-plan.md §3
 * decision 1): the compute lives in TypeScript — NOT a DB trigger — so the
 * exact same functions run on the app submit path AND in the fallback importer.
 * It is therefore strictly pure: no DB access, no Claude calls, no I/O. Every
 * function here is unit-tested in tests/unit/test-stats.test.ts.
 *
 * The output object is stored verbatim in `test_logs.extras.computed` and
 * surfaced read-only via the `computed-readonly` block (the tester never types
 * a statistic). Values are kept at full precision here; the display layer
 * rounds.
 */

// ---- Z constant -----------------------------------------------------------
// The charter's interval is the 95% Wald form (p ± 1.96·√(p(1−p)/N)), so we
// use the same 1.96 normal-approximation multiplier for the mean CI too.
const Z95 = 1.96;

// ---- Wire-format input types ----------------------------------------------
// These shapes are what the form (entries/test-log.ts) and the fallback
// importer feed in. `raw_rows` / `custom_columns` are stored in extras and
// passed back through here on every (re)compute.

/** A single cell as it arrives from the paste-friendly raw-data-table block. */
export type Cell = string | number | boolean | null | undefined;

/** `pass_fail` mode: one binary outcome per trial, optional note. */
export interface PassFailRow {
  success: Cell;
  note?: Cell;
}

/** `single_measure` mode: one number per trial. */
export interface SingleMeasureRow {
  value: Cell;
}

/** `custom` mode: a row is keyed by the tester-defined column names. */
export type CustomRow = Record<string, Cell>;

export type ColumnKind = 'number' | 'text' | 'pass_fail' | 'category';

/** A tester-defined column in `custom` mode (extras.custom_columns). */
export interface CustomColumn {
  name: string;
  kind: ColumnKind;
  /**
   * When a `category` column is marked a "condition", numeric stats are also
   * computed per group (e.g. cycle time grouped by surface). Only meaningful
   * on a `category` column; ignored otherwise.
   */
  isCondition?: boolean;
}

export interface ComputeInput {
  testType: 'pass_fail' | 'single_measure' | 'custom';
  rawRows: PassFailRow[] | SingleMeasureRow[] | CustomRow[];
  /** Required (and only used) when testType === 'custom'. */
  customColumns?: CustomColumn[];
}

// ---- Output types ---------------------------------------------------------

export interface ConfidenceInterval {
  low: number;
  high: number;
}

export interface PassFailStats {
  kind: 'pass_fail';
  n: number;
  successes: number;
  passRate: number;
  ci95: ConfidenceInterval;
  /** Tally of notes among failed trials; present only when at least one exists. */
  failureModes?: Record<string, number>;
}

export interface SingleMeasureStats {
  kind: 'single_measure';
  n: number;
  mean: number;
  /** Sample standard deviation (n−1 denominator); 0 when n < 2. */
  stddev: number;
  min: number;
  max: number;
  ci95: ConfidenceInterval;
}

export interface NumberColumnStats {
  kind: 'number';
  n: number;
  mean: number;
  stddev: number;
  min: number;
  max: number;
  ci95: ConfidenceInterval;
}

export interface PassFailColumnStats {
  kind: 'pass_fail';
  n: number;
  successes: number;
  passRate: number;
  ci95: ConfidenceInterval;
}

export interface CategoryColumnStats {
  kind: 'category';
  n: number;
  counts: Record<string, number>;
}

/** `text` columns are shown, not summarized (spec §3). */
export interface TextColumnStats {
  kind: 'text';
}

export type ColumnStats =
  | NumberColumnStats
  | PassFailColumnStats
  | CategoryColumnStats
  | TextColumnStats;

export interface CustomStats {
  kind: 'custom';
  /** Per-column stats keyed by column name, in declaration order. */
  columns: Record<string, ColumnStats>;
  /**
   * Per-group numeric stats, present only when a category column is marked a
   * condition. `column` is that condition column; `groups` maps each group
   * value → (number-column name → stats for rows in that group).
   */
  byCondition?: {
    column: string;
    groups: Record<string, Record<string, NumberColumnStats>>;
  };
}

export type ComputedStats = PassFailStats | SingleMeasureStats | CustomStats;

// ---- Parse helpers (forgiving, for paste-friendly input) ------------------

const TRUTHY = new Set(['success', 'pass', 'passed', 'yes', 'y', 'true', '1', 'p', 'ok']);
const FALSY = new Set(['fail', 'failed', 'no', 'n', 'false', '0', 'f', 'x']);

/**
 * Coerce a cell to a boolean outcome, or null if blank/unrecognized so it is
 * excluded from N. Booleans pass through; numbers use !=0; strings normalize.
 */
export function parsePassFail(cell: Cell): boolean | null {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === 'boolean') return cell;
  if (typeof cell === 'number') return Number.isNaN(cell) ? null : cell !== 0;
  const s = cell.trim().toLowerCase();
  if (s === '') return null;
  if (TRUTHY.has(s)) return true;
  if (FALSY.has(s)) return false;
  return null;
}

/** Coerce a cell to a finite number, or null if blank/non-numeric. */
export function parseNumber(cell: Cell): number | null {
  if (cell === null || cell === undefined || cell === '') return null;
  if (typeof cell === 'boolean') return cell ? 1 : 0;
  const n = typeof cell === 'number' ? cell : Number(String(cell).trim());
  return Number.isFinite(n) ? n : null;
}

function asLabel(cell: Cell): string {
  if (cell === null || cell === undefined) return '';
  return String(cell).trim();
}

// ---- Numeric primitives ---------------------------------------------------

function numberStats(values: number[]): {
  n: number;
  mean: number;
  stddev: number;
  min: number;
  max: number;
  ci95: ConfidenceInterval;
} {
  const n = values.length;
  if (n === 0) {
    return { n: 0, mean: 0, stddev: 0, min: 0, max: 0, ci95: { low: 0, high: 0 } };
  }
  const mean = values.reduce((a, b) => a + b, 0) / n;
  // Sample standard deviation (n−1); undefined for n=1, reported as 0.
  const variance = n < 2 ? 0 : values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1);
  const stddev = Math.sqrt(variance);
  const margin = n < 2 ? 0 : (Z95 * stddev) / Math.sqrt(n);
  return {
    n,
    mean,
    stddev,
    min: Math.min(...values),
    max: Math.max(...values),
    ci95: { low: mean - margin, high: mean + margin },
  };
}

/** 95% Wald interval for a proportion, clamped to [0, 1]. */
function waldCI(p: number, n: number): ConfidenceInterval {
  if (n === 0) return { low: 0, high: 0 };
  const margin = Z95 * Math.sqrt((p * (1 - p)) / n);
  return { low: Math.max(0, p - margin), high: Math.min(1, p + margin) };
}

function frequency(labels: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const label of labels) {
    if (label === '') continue;
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return counts;
}

// ---- Mode: pass/fail ------------------------------------------------------

export function computePassFail(rows: PassFailRow[]): PassFailStats {
  const outcomes: boolean[] = [];
  const failureModes: Record<string, number> = {};
  for (const row of rows) {
    const outcome = parsePassFail(row.success);
    if (outcome === null) continue;
    outcomes.push(outcome);
    if (!outcome) {
      const note = asLabel(row.note);
      if (note !== '') failureModes[note] = (failureModes[note] ?? 0) + 1;
    }
  }
  const n = outcomes.length;
  const successes = outcomes.filter(Boolean).length;
  const passRate = n === 0 ? 0 : successes / n;
  const stats: PassFailStats = {
    kind: 'pass_fail',
    n,
    successes,
    passRate,
    ci95: waldCI(passRate, n),
  };
  if (Object.keys(failureModes).length > 0) stats.failureModes = failureModes;
  return stats;
}

// ---- Mode: single measure -------------------------------------------------

export function computeSingleMeasure(rows: SingleMeasureRow[]): SingleMeasureStats {
  const values = rows.map((row) => parseNumber(row.value)).filter((v): v is number => v !== null);
  return { kind: 'single_measure', ...numberStats(values) };
}

// ---- Mode: custom ---------------------------------------------------------

function statsForColumn(column: CustomColumn, rows: CustomRow[]): ColumnStats {
  switch (column.kind) {
    case 'number': {
      const values = rows
        .map((row) => parseNumber(row[column.name]))
        .filter((v): v is number => v !== null);
      return { kind: 'number', ...numberStats(values) };
    }
    case 'pass_fail': {
      const outcomes = rows
        .map((row) => parsePassFail(row[column.name]))
        .filter((v): v is boolean => v !== null);
      const n = outcomes.length;
      const successes = outcomes.filter(Boolean).length;
      const passRate = n === 0 ? 0 : successes / n;
      return { kind: 'pass_fail', n, successes, passRate, ci95: waldCI(passRate, n) };
    }
    case 'category': {
      const labels = rows.map((row) => asLabel(row[column.name])).filter((l) => l !== '');
      return { kind: 'category', n: labels.length, counts: frequency(labels) };
    }
    case 'text':
      return { kind: 'text' };
  }
}

export function computeCustom(rows: CustomRow[], columns: CustomColumn[]): CustomStats {
  const perColumn: Record<string, ColumnStats> = {};
  for (const column of columns) {
    perColumn[column.name] = statsForColumn(column, rows);
  }

  const stats: CustomStats = { kind: 'custom', columns: perColumn };

  // Per-group numeric stats when a category column is marked a condition.
  const conditionColumn = columns.find((c) => c.isCondition && c.kind === 'category');
  const numberColumns = columns.filter((c) => c.kind === 'number');
  if (conditionColumn && numberColumns.length > 0) {
    const groups: Record<string, Record<string, NumberColumnStats>> = {};
    const rowsByGroup = new Map<string, CustomRow[]>();
    for (const row of rows) {
      const group = asLabel(row[conditionColumn.name]);
      if (group === '') continue;
      const bucket = rowsByGroup.get(group);
      if (bucket) bucket.push(row);
      else rowsByGroup.set(group, [row]);
    }
    for (const [group, groupRows] of rowsByGroup) {
      const perNumberColumn: Record<string, NumberColumnStats> = {};
      for (const column of numberColumns) {
        const values = groupRows
          .map((row) => parseNumber(row[column.name]))
          .filter((v): v is number => v !== null);
        perNumberColumn[column.name] = { kind: 'number', ...numberStats(values) };
      }
      groups[group] = perNumberColumn;
    }
    stats.byCondition = { column: conditionColumn.name, groups };
  }

  return stats;
}

// ---- Dispatcher -----------------------------------------------------------

/**
 * Single entry point used by both the app submit path and the fallback
 * importer. Routes to the mode-specific compute and returns the object stored
 * in `extras.computed`.
 */
export function computeTestStats(input: ComputeInput): ComputedStats {
  switch (input.testType) {
    case 'pass_fail':
      return computePassFail(input.rawRows as PassFailRow[]);
    case 'single_measure':
      return computeSingleMeasure(input.rawRows as SingleMeasureRow[]);
    case 'custom':
      return computeCustom(input.rawRows as CustomRow[], input.customColumns ?? []);
  }
}
