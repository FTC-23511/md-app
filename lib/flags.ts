/**
 * Flag overdue detection (3E). `flags` has no due-date column, so "overdue" is
 * DERIVED from how long an open flag has sat past a single, centralized
 * threshold. Centralizing the threshold means the dashboard badge, the count,
 * and any future digest all agree. Computed in UTC.
 *
 * Spec: docs/phase3/04-dashboard-and-flags.md §1.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

/** Single source of truth. Start at 72h; one-line change to retune. */
export const OVERDUE_THRESHOLD_HOURS = 72;

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** True iff an open flag has sat longer than the threshold. */
export function isOverdue(
  flag: { status: string; opened_at: string },
  nowMs: number = Date.now(),
): boolean {
  if (flag.status !== 'open') return false;
  const opened = new Date(flag.opened_at).getTime();
  if (Number.isNaN(opened)) return false;
  return nowMs - opened > OVERDUE_THRESHOLD_HOURS * MS_PER_HOUR;
}

/** Whole days since the flag was opened (UTC, floored). */
export function flagAgeDays(openedAt: string, nowMs: number = Date.now()): number {
  const opened = new Date(openedAt).getTime();
  if (Number.isNaN(opened)) return 0;
  return Math.floor((nowMs - opened) / MS_PER_DAY);
}

export type OverdueFlag = {
  id: string;
  subject: string;
  targetEntryType: string;
  ageDays: number;
  ownerName: string | null;
};

/**
 * Open flags past the overdue threshold, oldest first, with owner display_name.
 * Runs under the caller's session (anon client → RLS), so it returns only what
 * the caller may read. Used by the dashboard flag queue.
 */
export async function listOverdueFlags(nowMs: number = Date.now()): Promise<OverdueFlag[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('flags')
    .select('id, subject, status, opened_at, target_entry_type, owner:members(display_name)')
    .eq('status', 'open')
    .is('deleted_at', null)
    .order('opened_at', { ascending: true });

  type Row = {
    id: string;
    subject: string;
    status: string;
    opened_at: string;
    target_entry_type: string;
    owner: { display_name: string | null } | { display_name: string | null }[] | null;
  };

  return ((data ?? []) as Row[])
    .filter((f) => isOverdue(f, nowMs))
    .map((f) => {
      const owner = Array.isArray(f.owner) ? f.owner[0] : f.owner;
      return {
        id: f.id,
        subject: f.subject,
        targetEntryType: f.target_entry_type,
        ageDays: flagAgeDays(f.opened_at, nowMs),
        ownerName: owner?.display_name ?? null,
      };
    });
}
