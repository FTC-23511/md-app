export type RepeatingRowColumn = { name: string; label: string };

/**
 * Parses a `repeating-rows` body section into the same value shape the live
 * form produces: an array of objects keyed by column `name`.
 *
 * - Single-column blocks (e.g. Software Change Log `files_changed`, column
 *   `path`): one bullet per row, the whole line is the value.
 *
 *     - lib/intake/IntakeController.java
 *     - lib/intake/IntakeState.java
 *
 * - Multi-column blocks: pipe-separated `**Label:** value` segments, matched to
 *   columns by their `label` (mirrors the Action Items parser).
 *
 *     - **Metric:** cycle time | **Was:** 4.2s | **Now:** 3.1s
 */
export function parseRepeatingRows(
  text: string,
  columns: RepeatingRowColumn[],
): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  if (columns.length === 0) return rows;
  const single = columns.length === 1;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ')) continue;
    const content = trimmed.slice(2).trim();
    if (!content) continue;

    if (single) {
      rows.push({ [columns[0]!.name]: content });
      continue;
    }

    const parts = content.split('|').map((p) => p.trim());
    const row: Record<string, string> = {};
    let anyFilled = false;
    for (const col of columns) {
      const key = `**${col.label}:**`;
      const part = parts.find((p) => p.toLowerCase().startsWith(key.toLowerCase()));
      const val = part ? part.slice(key.length).trim() : '';
      row[col.name] = val;
      if (val) anyFilled = true;
    }
    if (anyFilled) rows.push(row);
  }

  return rows;
}
