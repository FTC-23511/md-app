/**
 * Thin wrapper used by forms that carry a `media-links` block (2F). Inserts the
 * entry via the generic `insertEntry`, then — only on success — saves each
 * media-links block's items to the polymorphic `media_links` table (the entry id
 * doesn't exist until the row is inserted). Media is best-effort: a failed
 * ingest is logged but never rolls back the saved entry.
 *
 * Forms without media keep calling `insertEntry` directly; this just composes the
 * two so the page's server action stays a one-liner.
 */

import { insertEntry, type InsertResult } from '@/lib/insert-entry';
import { saveEntryMedia } from '@/lib/media/save-entry-media';
import type { EntryDefinition } from '@/entries/_types';

export async function submitEntryWithMedia(
  definition: EntryDefinition,
  formData: FormData,
): Promise<InsertResult> {
  const result = await insertEntry(definition, formData);
  if (!result.ok) return result;

  for (const block of definition.fields) {
    if (block.type !== 'media-links') continue;
    try {
      await saveEntryMedia(definition.type, result.id, formData, block);
    } catch (err) {
      // The entry is already saved; never fail the submit on a media hiccup.
      console.error('saveEntryMedia threw:', err);
    }
  }
  return result;
}
