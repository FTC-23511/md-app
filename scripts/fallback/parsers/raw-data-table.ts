/**
 * Fallback parser for the Test Log `raw-data-table` block.
 *
 * Turns a delimited body section into the { raw_rows, custom_columns } composite
 * that lib/compute/test-stats.ts + lib/validate-entry.ts expect — the exact same
 * shape the live form's hidden-input serialization produces, so the importer and
 * the app submit path feed the shared compute with no reshaping.
 *
 * Cells stay as trimmed strings; the compute module coerces per column kind
 * (parsePassFail / parseNumber are forgiving by design). The first non-empty
 * line is the header row (its names become the row keys); a markdown separator
 * row (|---|---|) immediately after the header is skipped. Tab-, comma-, and
 * pipe-delimited tables are all accepted (paste-friendly).
 *
 * Spec: docs/phase2/03-test-log.md §2, docs/phase1/05-fallback.md §5.
 */

import type { CustomColumn } from '../../../lib/compute/test-stats';

export type RawDataTable = {
  raw_rows: Array<Record<string, string>>;
  custom_columns: CustomColumn[];
};

const VALID_KINDS: ReadonlySet<string> = new Set(['number', 'text', 'pass_fail', 'category']);

/** Remove HTML comment blocks (template instructions) so they aren't parsed as rows. */
function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

/** Strip a single ```fenced``` wrapper if the whole section is one. */
function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return m ? (m[1] ?? '').trim() : t;
}

/** Split one row into cells. Tab > pipe > comma, in that precedence. */
function splitRow(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
  const trimmed = line.trim();
  if (trimmed.startsWith('|')) {
    // | a | b | → drop the empty leading/trailing segments the outer pipes create.
    const parts = trimmed.split('|');
    return parts.slice(1, parts.length - 1).map((c) => c.trim());
  }
  return line.split(',').map((c) => c.trim());
}

/** True for a markdown header-separator row like `|---|:--:|`. */
function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')));
}

/**
 * Coerce a frontmatter `custom_columns` value into typed CustomColumn[]. Accepts
 * either an array of { name, kind, isCondition? } objects or plain strings
 * (treated as text columns). Unknown kinds fall back to 'text'.
 */
export function parseCustomColumns(raw: unknown): CustomColumn[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomColumn[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const name = item.trim();
      if (name) out.push({ name, kind: 'text' });
      continue;
    }
    if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>;
      const name = String(rec.name ?? '').trim();
      if (!name) continue;
      const kindRaw = String(rec.kind ?? 'text').trim();
      const kind = (VALID_KINDS.has(kindRaw) ? kindRaw : 'text') as CustomColumn['kind'];
      const col: CustomColumn = { name, kind };
      if (rec.isCondition === true) col.isCondition = true;
      out.push(col);
    }
  }
  return out;
}

export function parseRawDataTable(
  sectionText: string,
  mode: 'pass_fail' | 'single_measure' | 'custom',
  customColumns: CustomColumn[],
): RawDataTable {
  const custom_columns = mode === 'custom' ? customColumns : [];

  const lines = stripFence(stripComments(sectionText))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { raw_rows: [], custom_columns };

  const header = splitRow(lines[0]!).filter((h) => h.length > 0);
  let dataLines = lines.slice(1);
  if (dataLines.length > 0 && isSeparatorRow(splitRow(dataLines[0]!))) {
    dataLines = dataLines.slice(1);
  }

  const raw_rows = dataLines.map((line) => {
    const cells = splitRow(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim();
    });
    return row;
  });

  return { raw_rows, custom_columns };
}
