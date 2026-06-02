export type StoryRow = {
  person_name: string;
  person_role_age?: string;
  what_happened: string;
  direct_quote?: string;
  permission: 'yes' | 'no' | 'pending';
  photo_url?: string;
};

export function parseStories(text: string): StoryRow[] {
  // Split on "### Story N" header lines (captured, so we get everything between them)
  const blocks = text.split(/^###\s+Story\s+\d+\b.*$/im);
  const results: StoryRow[] = [];
  // blocks[0] is content before the first story; skip it
  for (const block of blocks.slice(1)) {
    const story = parseOneStory(block);
    if (story) results.push(story);
  }
  return results;
}

function getBulletField(text: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.*)`, 'im'));
  return (match?.[1] ?? '').trim();
}

function getLabeledParagraph(text: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match "**Label:**" followed by paragraph text, stopping at next bold header or end
  const match = text.match(
    new RegExp(`\\*\\*${escaped}:\\*\\*\\s*\\n+([\\s\\S]*?)(?=\\*\\*[A-Z]|###|$)`, 'im'),
  );
  return (match?.[1] ?? '').trim();
}

function parseOneStory(block: string): StoryRow | null {
  const person_name = getBulletField(block, 'Person');
  if (!person_name) return null;

  const person_role_age = getBulletField(block, 'Role / age') || undefined;

  const permRaw = getBulletField(block, 'Permission').toLowerCase();
  const permission: 'yes' | 'no' | 'pending' =
    permRaw === 'yes' ? 'yes' : permRaw === 'no' ? 'no' : 'pending';

  const rawPhoto = getBulletField(block, 'Photo URL');
  const photo_url =
    rawPhoto && rawPhoto !== '(leave blank in Phase 1)' && rawPhoto.startsWith('http')
      ? rawPhoto
      : undefined;

  const what_happened = getLabeledParagraph(block, 'What happened');
  const direct_quote = getLabeledParagraph(block, 'Quote') || undefined;

  return { person_name, person_role_age, what_happened, direct_quote, permission, photo_url };
}
