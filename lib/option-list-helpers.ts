/**
 * Server-side helpers for the `option_lists` table.
 *
 * Two surfaces:
 *   - getOptionsByCategory: fetch active options for a given category. Used by
 *     the form renderer's server-component wrapper to preload options before
 *     rendering each select block.
 *   - createOption (server action): inserts a new option_lists row with a
 *     slugified value. Powers the "Add new…" popover in SingleSelect /
 *     MultiSelect. On slug collision against an active row, returns the
 *     existing row's id so the popover can close cleanly with that option
 *     selected.
 *
 * Spec: docs/phase1/03-forms.md §§5–6 + §2.5; docs/phase1/02-schema.md §§4.2–4.3.
 */

'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OptionCategory, OptionListRow } from '@/entries/_types';

/**
 * Fetch all active options for a category, sorted by sort_order then label.
 * Server-side only — relies on the per-request Supabase client.
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
    // Don't swallow: the renderer needs to know.
    throw new Error(`Failed to load options for category '${category}': ${error.message}`);
  }
  return (data ?? []) as OptionListRow[];
}

/**
 * Slugify a human label into a kebab-case `value`.
 *
 * "Public Showcase!" → "public-showcase"
 * "  Stem Outreach  " → "stem-outreach"
 */
function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export type CreateOptionResult =
  | { ok: true; option: OptionListRow; existed: boolean }
  | { ok: false; error: string };

/**
 * Server action: insert a new option_lists row.
 *
 * Behavior:
 *   - Derives `value` by slugifying `label`.
 *   - If an active row exists for (category, value), returns it (existed: true).
 *   - Otherwise inserts with is_seed=false and returns the new row.
 *   - sort_order is set to (max existing for the category) + 1 so new options
 *     land at the bottom of the dropdown.
 *
 * RLS: option_lists allows FOR ALL TO authenticated in Phase 1, so any
 * signed-in user can create options. Phase 3 may tighten this.
 */
export async function createOption(
  category: OptionCategory,
  label: string,
): Promise<CreateOptionResult> {
  const trimmed = label.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Label is required.' };
  }
  const value = slugify(trimmed);
  if (value.length === 0) {
    return { ok: false, error: 'Label must contain at least one alphanumeric character.' };
  }

  const supabase = await createSupabaseServerClient();

  // Look for an existing active row first — same (category, value) means we
  // reuse rather than fail on the unique index.
  const { data: existing, error: lookupError } = await supabase
    .from('option_lists')
    .select('id, category, value, label, sort_order, is_seed')
    .eq('category', category)
    .eq('value', value)
    .is('deleted_at', null)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, error: `Lookup failed: ${lookupError.message}` };
  }
  if (existing) {
    return { ok: true, option: existing as OptionListRow, existed: true };
  }

  // Compute next sort_order — append to the bottom of the category.
  const { data: maxRow } = await supabase
    .from('option_lists')
    .select('sort_order')
    .eq('category', category)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (maxRow?.sort_order ?? 0) + 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inserted, error: insertError } = await supabase
    .from('option_lists')
    .insert({
      category,
      value,
      label: trimmed,
      sort_order: nextSortOrder,
      is_seed: false,
      created_by: user?.id ?? null,
    })
    .select('id, category, value, label, sort_order, is_seed')
    .single();

  if (insertError) {
    return { ok: false, error: `Insert failed: ${insertError.message}` };
  }

  return { ok: true, option: inserted as OptionListRow, existed: false };
}
