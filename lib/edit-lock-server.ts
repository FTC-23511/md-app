/**
 * Server-side resolver for the 24h edit-lock decision. Gathers everything the
 * RLS UPDATE predicate keys on — the caller's role (current_role_name()), the
 * row's created_by / created_at, and any table-specific extended-edit right
 * (Outreach Reporter on their own outreach_log; Subsystem Lead on an
 * hw_change_log / decision_log they lead) — and feeds the pure decideEdit()
 * mirror in lib/edit-lock.ts.
 *
 * Used by both lib/update-entry.ts (enforcement + friendly errors) and the
 * detail-page edit flows (to decide whether to show the edit_reason field or a
 * lock message). RLS remains the authoritative backstop.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { decideEdit, withinEditWindow, type EditCapability } from '@/lib/edit-lock';

const SUBSYSTEM_TABLES = new Set(['hw_change_logs', 'decision_logs']);

export type EditContext = {
  capability: EditCapability;
  role: string | null;
  isOwner: boolean;
  withinWindow: boolean;
  /** The row's current `extras`, returned so update-entry need not re-read it. */
  extras: Record<string, unknown>;
  /** False when the row doesn't exist or isn't readable (deleted / RLS). */
  found: boolean;
};

export async function resolveEditContext(
  supabase: SupabaseClient,
  table: string,
  id: string,
  userId: string,
  nowMs: number = Date.now(),
): Promise<EditContext> {
  const selectCols = SUBSYSTEM_TABLES.has(table)
    ? 'created_by, created_at, extras, subsystem_option_id'
    : 'created_by, created_at, extras';

  const { data: row, error } = await supabase
    .from(table)
    .select(selectCols)
    .eq('id', id)
    .maybeSingle();

  if (error || !row) {
    return {
      capability: { kind: 'denied' },
      role: null,
      isOwner: false,
      withinWindow: false,
      extras: {},
      found: false,
    };
  }

  // Cast through unknown: the dynamic (union-typed) select string defeats the
  // PostgREST query-type parser, so `row` is typed as a ParserError.
  const r = row as unknown as Record<string, unknown>;
  const createdBy = (r.created_by ?? null) as string | null;
  const createdAt = (r.created_at ?? null) as string | null;
  const isOwner = createdBy !== null && createdBy === userId;
  const withinWindow = withinEditWindow(createdAt, nowMs);

  const { data: roleData } = await supabase.rpc('current_role_name');
  const role = (roleData ?? null) as string | null;

  let hasExtendedRight = false;
  if (table === 'outreach_logs') {
    if (isOwner) {
      const { data } = await supabase.rpc('is_outreach_reporter');
      hasExtendedRight = data === true;
    }
  } else if (SUBSYSTEM_TABLES.has(table)) {
    const subsystemId = (r.subsystem_option_id ?? null) as string | null;
    if (subsystemId) {
      const { data } = await supabase.rpc('leads_subsystem', {
        p_subsystem_option_id: subsystemId,
      });
      hasExtendedRight = data === true;
    }
  }

  return {
    capability: decideEdit({ role, isOwner, withinWindow, hasExtendedRight }),
    role,
    isOwner,
    withinWindow,
    extras: (r.extras ?? {}) as Record<string, unknown>,
    found: true,
  };
}
