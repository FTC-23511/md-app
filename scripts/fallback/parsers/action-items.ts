export type ActionItemRow = { owner: string; action: string; due_date?: string };

export function parseActionItems(text: string): ActionItemRow[] {
  const rows: ActionItemRow[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ')) continue;
    const content = trimmed.slice(2);
    const parts = content.split('|').map((p) => p.trim());

    // Extract by prefix; slice instead of regex-replace to avoid escaping issues
    const extract = (key: string): string => {
      const part = parts.find((p) => p.toLowerCase().startsWith(key.toLowerCase()));
      return part ? part.slice(key.length).trim() : '';
    };

    const owner = extract('**Owner:**');
    const action = extract('**Action:**');
    const due = extract('**Due:**');

    if (owner || action) {
      rows.push({ owner, action, due_date: due || undefined });
    }
  }
  return rows;
}
