export type SpecialtyTriggerRow = {
  target_type: 'decision_log' | 'hw_change_log' | 'sw_change_log' | 'test_log' | 'contact_log';
  owner_text: string;
  subject: string;
};

const LABEL_TO_TYPE: Record<string, SpecialtyTriggerRow['target_type']> = {
  'decision log': 'decision_log',
  'hardware change log': 'hw_change_log',
  'software change log': 'sw_change_log',
  'test log': 'test_log',
  'contact log': 'contact_log',
};

export function parseSpecialtyTriggers(text: string): SpecialtyTriggerRow[] {
  const rows: SpecialtyTriggerRow[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!/^-\s+\[x\]/i.test(trimmed)) continue;

    // Remove the leading "- [x] " prefix
    const body = trimmed.replace(/^-\s+\[x\]\s+/i, '');

    // Extract the bold type label
    const boldMatch = body.match(/^\*\*(.+?)\*\*/);
    if (!boldMatch) continue;
    const typeLabel = (boldMatch[1] ?? '').trim().toLowerCase();
    const target_type = LABEL_TO_TYPE[typeLabel];
    if (!target_type) continue;

    // Extract owner and subject from the rest
    // Expected: "— owner: NAME — subject: SUBJECT" (em-dash or hyphen)
    const rest = body.slice((boldMatch[0] ?? '').length).trim();
    const ownerMatch = rest.match(/[—–-]+\s*owner:\s*(.+?)\s*[—–-]+\s*subject:\s*(.+)/i);
    const owner_text = (ownerMatch?.[1] ?? '').trim();
    const subject = (ownerMatch?.[2] ?? '').trim();

    rows.push({ target_type, owner_text, subject });
  }

  return rows;
}
