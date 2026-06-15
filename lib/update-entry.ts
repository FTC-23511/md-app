/**
 * Generic update helper — the single edit chokepoint (`docs/phase2/00-plan.md`
 * §3 decision 4; brief docs/briefs/2026-06-04-2e-decision-log.md). Mirrors
 * lib/insert-entry.ts: parse FormData with a definition, validate, split into
 * typed-column vs `extras` values, then UPDATE the row by id.
 *
 * The definition passed in defines the **editable surface**: every field in it
 * is overwritten from the submitted values (a field left empty/hidden clears
 * its old value), and fields *not* in it are untouched — so a partial
 * definition (e.g. the outcome mini-form) updates only its own keys while the
 * full definition re-submits the whole entry. `extras` is read-merged for that
 * reason; Phase 2 is single-user so the read-modify-write race is acceptable.
 *
 * Two callers only (brief Q4): the detail-page "Complete this entry" flow and
 * the "Add outcome" mini-form. No general edit-any-field UI. Runs on the
 * current permissive RLS; Phase 3 attaches the 24h edit lock here.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { EntryDefinition } from '@/entries/_types';
import {
  buildZodSchemaFromDefinition,
  flattenZodErrors,
  parseFormDataWithDefinition,
} from '@/lib/validate-entry';
import { resolveEditContext } from '@/lib/edit-lock-server';
import { EDIT_MESSAGES } from '@/lib/edit-lock';

export type UpdateResult =
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

export async function updateEntry(
  definition: EntryDefinition,
  id: string,
  formData: FormData,
  options?: {
    /** New entry_state, e.g. flip 'draft' → 'complete' once requirements are met. */
    entryState?: 'draft' | 'complete';
    /**
     * Caller-computed extras merged in last (e.g. recomputed matrix/FMEA
     * stats) — these win over both stored and submitted values.
     */
    computedExtras?: Record<string, unknown>;
    /**
     * Extras keys removed after all merging — for composite blocks (matrix /
     * fmea) that parse to empty shells rather than undefined, so an
     * untriggered depth section's shell never lands in storage.
     */
    clearExtras?: string[];
  },
): Promise<UpdateResult> {
  // 1. Parse FormData into the shape the schema expects.
  const parsed = parseFormDataWithDefinition(definition, formData);

  // 2. Validate.
  const schema = buildZodSchemaFromDefinition(definition);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, fieldErrors: flattenZodErrors(result.error) };
  }

  // 3. Split into column values and extras values. Unlike insert, a field in
  //    the definition that parsed to undefined is an explicit clear (column →
  //    NULL, extras key → removed): the filer emptied it or its depth trigger
  //    is unchecked. computed-readonly / section-header never hold user input
  //    and are skipped — computed values arrive via options.computedExtras.
  const columnValues: Record<string, unknown> = {};
  const setExtras: Record<string, unknown> = {};
  const clearExtras: string[] = [];
  for (const field of definition.fields) {
    if (field.type === 'computed-readonly' || field.type === 'section-header') continue;
    const value = (result.data as Record<string, unknown>)[field.name];
    if (field.storage === 'column') {
      columnValues[field.name] = value === undefined ? null : value;
    } else if (value === undefined) {
      clearExtras.push(field.name);
    } else {
      setExtras[field.name] = value;
    }
  }

  // 4. Auth check.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, formError: 'Not authenticated.' };

  // 4b. 24h edit-lock decision (mirrors the RLS UPDATE predicate so we can show
  //     a friendly message instead of a raw 0-rows error — R3). Also returns
  //     the row's current extras so step 5 needn't re-read. RLS stays the
  //     authoritative backstop below.
  const ctx = await resolveEditContext(supabase, definition.table, id, user.id);
  if (!ctx.found) return { ok: false, formError: EDIT_MESSAGES.denied };

  let editReason: string | null = null;
  switch (ctx.capability.kind) {
    case 'role_denied':
      return { ok: false, formError: EDIT_MESSAGES.role_denied };
    case 'locked':
      return { ok: false, formError: EDIT_MESSAGES.locked };
    case 'denied':
      return { ok: false, formError: EDIT_MESSAGES.denied };
    case 'reason_required': {
      const raw = formData.get('edit_reason');
      editReason = typeof raw === 'string' ? raw.trim() : '';
      if (!editReason) return { ok: false, formError: EDIT_MESSAGES.reason_required };
      break;
    }
    case 'allow':
      break;
  }

  // 5. Read-merge extras so keys outside the editable surface survive.
  const currentExtras = ctx.extras;
  const mergedExtras: Record<string, unknown> = { ...currentExtras, ...setExtras };
  for (const key of clearExtras) delete mergedExtras[key];
  if (options?.computedExtras) Object.assign(mergedExtras, options.computedExtras);
  for (const key of options?.clearExtras ?? []) delete mergedExtras[key];

  const row: Record<string, unknown> = {
    ...columnValues,
    extras: mergedExtras,
  };
  if (options?.entryState) row.entry_state = options.entryState;

  // 6. Update. maybeSingle() so an RLS-denied update returns 0 rows as null
  //    data (not a thrown PGRST116) — we map that to a generic permission
  //    message, keeping RLS as the authoritative backstop behind the TS
  //    pre-check above.
  const { data, error } = await supabase
    .from(definition.table)
    .update(row)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    return { ok: false, formError: error.message };
  }
  if (!data) {
    // RLS refused the row despite the pre-check (e.g. a race or a pre-check gap).
    return { ok: false, formError: EDIT_MESSAGES.denied };
  }

  // 7. Record the override audit row (Captain/Deputy editing a >24h entry).
  //    Audit-only RPC (brief Q2): RLS already authorized the update; this just
  //    writes the trail. Best-effort ordering is update-then-audit.
  if (editReason !== null) {
    const { error: auditError } = await supabase.rpc('record_entry_edit', {
      p_entry_type: definition.type,
      p_entry_id: id,
      p_edit_reason: editReason,
    });
    if (auditError) {
      return {
        ok: false,
        formError: 'The change was saved, but recording the edit reason failed. Tell the Captain.',
      };
    }
  }

  return { ok: true, id: (data as { id: string }).id };
}
