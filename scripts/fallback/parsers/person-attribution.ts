export type PersonRow = { name: string; contribution: string };

export function parsePersonAttribution(text: string): PersonRow[] {
  const rows: PersonRow[] = [];
  for (const line of text.split('\n')) {
    // Accept the colon either inside the bold (`- **Name:** contribution`, the
    // form the fallback templates use) or outside it (`- **Name**: contribution`).
    // The optional `:?` after `**` handles the latter; the trailing-colon strip
    // on the captured name handles the former.
    const match = line.match(/^-\s+\*\*(.+?)\*\*:?\s*(.*)/);
    if (!match) continue;
    const name = (match[1] ?? '').replace(/:\s*$/, '').trim();
    const contribution = (match[2] ?? '').trim();
    if (name) rows.push({ name, contribution });
  }
  return rows;
}
