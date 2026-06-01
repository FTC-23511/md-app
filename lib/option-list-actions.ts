'use server';

/**
 * Server actions for the `option_lists` table. Importable from client
 * components. Per Next 15, files with a file-level 'use server' directive
 * may only export async functions — types live in entries/_types.ts.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/option-list-helpers';
import type { CreateOptionResult, OptionCategory, OptionListRow } from '@/entries/_types';

/**
 * Insert a new option_lists row.
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

export async function softDeleteOption(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: 'id is required.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('option_lists')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('is_seed', false); // never delete seed rows
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
