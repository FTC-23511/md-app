/**
 * Server-side helpers for the `option_lists` table.
 *
 * Split between this file (regular helpers, called from server components) and
 * `lib/option-list-actions.ts` (server actions, called from client components).
 *
 * Spec: docs/phase1/03-forms.md §§5–6 + §2.5; docs/phase1/02-schema.md §§4.2–4.3.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OptionCategory, OptionListRow } from '@/entries/_types';

/**
 * Fetch all active options for a category, sorted by sort_order then label.
 * Server-side only — relies on the per-request Supabase client. Called from
 * server components during render (no RPC overhead).
 */
export async function getOptionsByCategory(category: OptionCategory): Promise<OptionListRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('option_lists')
    .select('id, category, value, label, sort_order, is_seed')
    .eq('category', category)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });

  if (error) {
    throw new Error(`Failed to load options for category '${category}': ${error.message}`);
  }
  return (data ?? []) as OptionListRow[];
}

/**
 * Slugify a human label into a kebab-case `value`.
 *
 * "Public Showcase!" → "public-showcase"
 * "  Stem Outreach  " → "stem-outreach"
 *
 * Exported so the server action in lib/option-list-actions.ts can reuse it.
 */
export function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
