/**
 * Server-side helper: walk an EntryDefinition, collect every declared
 * OptionCategory across its select blocks, and preload all options in
 * parallel. Used by the entry-page server components before rendering
 * EntryForm.
 */

import type { EntryDefinition, OptionCategory, OptionListRow } from '@/entries/_types';
import { getOptionsByCategory } from '@/lib/option-list-helpers';

export async function preloadOptions(
  definition: EntryDefinition,
): Promise<Partial<Record<OptionCategory, OptionListRow[]>>> {
  const categories = new Set<OptionCategory>();
  for (const field of definition.fields) {
    if (field.type === 'single-select' || field.type === 'multi-select') {
      categories.add(field.category);
    }
  }
  const entries = await Promise.all(
    Array.from(categories).map(async (cat) => [cat, await getOptionsByCategory(cat)] as const),
  );
  return Object.fromEntries(entries) as Partial<Record<OptionCategory, OptionListRow[]>>;
}
