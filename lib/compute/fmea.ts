/**
 * Decision Log auto-compute — FMEA risk priority numbers.
 *
 * Spec: docs/phase2/02-forms-and-detail.md §1 (`fmea` block: rows of
 * `{failure_mode, effect, severity, likelihood, detectability, mitigation}`;
 * RPN = S×L×D auto-computed per row); brief docs/briefs/2026-06-04-2e-decision-log.md.
 *
 * Pure, path-independent, unit-tested (tests/unit/fmea.test.ts) — Phase 2's
 * named safety net (CLAUDE.md rule 6 / 00-plan.md §3): the same function runs on
 * the app submit path and the fallback importer. No DB access, no Claude calls,
 * no I/O. Output is stored verbatim in `decision_logs.extras.fmea` and surfaced
 * read-only via `computed-readonly` — the filer never types an RPN. Full
 * precision here; the display layer rounds.
 */

// Forgiving cell type + numeric parser are single-sourced in test-stats.
import { parseNumber, type Cell } from './test-stats';

// ---- Wire-format input types ----------------------------------------------

export interface FmeaRow {
  failure_mode?: Cell;
  effect?: Cell;
  severity: Cell;
  likelihood: Cell;
  detectability: Cell;
  mitigation?: Cell;
}

// ---- Output types ---------------------------------------------------------

export interface FmeaRowResult {
  failureMode: string;
  effect: string;
  severity: number | null;
  likelihood: number | null;
  detectability: number | null;
  mitigation: string;
  /** S×L×D; null when any of the three factors is blank/non-numeric. */
  rpn: number | null;
}

export interface FmeaStats {
  kind: 'fmea';
  /** Per-row results, in input order. */
  rows: FmeaRowResult[];
  /** Highest RPN among rows with a defined RPN; null when none. */
  maxRpn: number | null;
  /** failure_mode of the highest-RPN row (the worst failure mode); null when none. */
  topRisk: string | null;
}

function asText(cell: Cell): string {
  if (cell === null || cell === undefined) return '';
  return String(cell).trim();
}

// ---- Compute --------------------------------------------------------------

export function computeFmea(rows: FmeaRow[]): FmeaStats {
  const results: FmeaRowResult[] = (rows ?? []).map((row) => {
    const severity = parseNumber(row.severity);
    const likelihood = parseNumber(row.likelihood);
    const detectability = parseNumber(row.detectability);
    const rpn =
      severity !== null && likelihood !== null && detectability !== null
        ? severity * likelihood * detectability
        : null;
    return {
      failureMode: asText(row.failure_mode),
      effect: asText(row.effect),
      severity,
      likelihood,
      detectability,
      mitigation: asText(row.mitigation),
      rpn,
    };
  });

  // The worst failure mode is the highest defined RPN (ties keep the first).
  let maxRpn: number | null = null;
  let topRisk: string | null = null;
  for (const r of results) {
    if (r.rpn !== null && (maxRpn === null || r.rpn > maxRpn)) {
      maxRpn = r.rpn;
      topRisk = r.failureMode;
    }
  }

  return { kind: 'fmea', rows: results, maxRpn, topRisk };
}
