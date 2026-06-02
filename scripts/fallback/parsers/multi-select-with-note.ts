export type MultiSelectWithNoteResult = {
  checkedLabels: string[];
  note: string;
};

export function parseMultiSelectWithNote(text: string): MultiSelectWithNoteResult {
  const checkedLabels: string[] = [];
  const noteLines: string[] = [];
  let inNote = false;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

    // Start of custom note section
    if (/^\*\*Custom note/i.test(trimmed)) {
      inNote = true;
      // Capture any text on the same line after the marker
      const sameLineContent = trimmed.replace(/^\*\*Custom note[^*]*\*\*:\s*/i, '').trim();
      if (sameLineContent) noteLines.push(sameLineContent);
      continue;
    }

    // Checked checkbox: - [x] Label text
    const checkedMatch = trimmed.match(/^-\s+\[x\]\s+(.+)/i);
    if (checkedMatch) {
      inNote = false;
      checkedLabels.push((checkedMatch[1] ?? '').trim());
      continue;
    }

    // Accumulate note lines (skip unchecked checkboxes and HTML comments)
    if (inNote && trimmed && !trimmed.startsWith('- [') && !trimmed.startsWith('<!--')) {
      noteLines.push(trimmed);
    }
  }

  return { checkedLabels, note: noteLines.join('\n').trim() };
}
