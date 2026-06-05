/**
 * Server-side loader for a single entry's detail page.
 *
 * Resolves the URL `type` to its EntryDefinition, selects the row by id
 * (excluding soft-deleted), resolves every option_id referenced by the
 * definition's fields to its human label in one query, and loads any flags
 * raised from this entry.
 *
 * Spec: docs/phase2/02-forms-and-detail.md §3.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ENTRY_REGISTRY } from '@/entries/_registry';
import type { EntryDefinition, FieldBlock } from '@/entries/_types';

export type EntryFlag = {
  id: string;
  subject: string;
  target_entry_type: string;
  status: string;
  owner_member_id: string | null;
};

export type EntryDetail = {
  definition: EntryDefinition;
  row: Record<string, unknown>;
  /** option_id (uuid) → human label, for every single-/multi-select field. */
  optionLabels: Record<string, string>;
  flags: EntryFlag[];
};

/** Read a field's stored value: typed column, or a key inside `extras`. */
export function readFieldValue(block: FieldBlock, row: Record<string, unknown>): unknown {
  if (block.storage === 'column') return row[block.name];
  const extras = (row.extras ?? {}) as Record<string, unknown>;
  return extras[block.name];
}

/** Collect every option_id uuid referenced by the row across the definition. */
function collectOptionIds(definition: EntryDefinition, row: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  for (const block of definition.fields) {
    if (block.type === 'single-select') {
      const v = readFieldValue(block, row);
      if (typeof v === 'string' && v.length > 0) ids.add(v);
    } else if (block.type === 'multi-select') {
      const v = readFieldValue(block, row);
      const list = Array.isArray(v)
        ? v
        : v && typeof v === 'object' && Array.isArray((v as { ids?: unknown }).ids)
          ? (v as { ids: unknown[] }).ids
          : [];
      for (const id of list) if (typeof id === 'string' && id.length > 0) ids.add(id);
    }
  }
  return Array.from(ids);
}

/**
 * Load the entry, or return null if the type is unknown or the row is missing
 * / soft-deleted. The page renders a clean "not found" on null — never crashes.
 */
export async function loadEntryDetail(type: string, id: string): Promise<EntryDetail | null> {
  const definition = ENTRY_REGISTRY[type];
  if (!definition) return null;

  const supabase = await createSupabaseServerClient();

  const { data: row, error } = await supabase
    .from(definition.table)
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !row) return null;

  const rowRecord = row as Record<string, unknown>;

  // Resolve option labels in one query.
  const optionIds = collectOptionIds(definition, rowRecord);
  const optionLabels: Record<string, string> = {};
  if (optionIds.length > 0) {
    const { data: options } = await supabase
      .from('option_lists')
      .select('id, label')
      .in('id', optionIds);
    for (const opt of (options ?? []) as Array<{ id: string; label: string }>) {
      optionLabels[opt.id] = opt.label;
    }
  }

  // Flags raised from this entry (open Tier 2 to-dos).
  const { data: flagRows } = await supabase
    .from('flags')
    .select('id, subject, target_entry_type, status, owner_member_id')
    .eq('parent_entry_type', type)
    .eq('parent_entry_id', id)
    .is('deleted_at', null)
    .order('opened_at', { ascending: false });

  return {
    definition,
    row: rowRecord,
    optionLabels,
    flags: (flagRows ?? []) as EntryFlag[],
  };
}
