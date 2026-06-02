export type PersonRow = { name: string; contribution: string };

export function parsePersonAttribution(text: string): PersonRow[] {
  const rows: PersonRow[] = [];
  for (const line of text.split('\n')) {
    const match = line.match(/^-\s+\*\*(.+?)\*\*:\s*(.*)/);
    if (!match) continue;
    const name = (match[1] ?? '').trim();
    const contribution = (match[2] ?? '').trim();
    if (name) rows.push({ name, contribution });
  }
  return rows;
}
