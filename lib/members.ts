/**
 * Member roster helpers + the Captain guard (3D). Reads run under the signed-in
 * user's session (anon client → RLS), so the roster is visible to any active
 * member but only a Captain can reach the admin actions.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { MemberRole } from '@/lib/roles';

export { ROLE_VALUES, ROLE_LABELS, type MemberRole } from '@/lib/roles';

export type Member = {
  id: string;
  email: string;
  display_name: string;
  role: MemberRole;
  is_active: boolean;
  is_outreach_reporter: boolean;
};

export type MemberWithSubsystems = Member & { subsystem_option_ids: string[] };

/** The current signed-in member row, or null if none (e.g. bootstrap-only). */
export async function getCurrentMember(): Promise<Member | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('members')
    .select('id, email, display_name, role, is_active, is_outreach_reporter')
    .eq('id', user.id)
    .maybeSingle();

  return (data ?? null) as Member | null;
}

/**
 * Guard for Captain-only pages/actions. Redirects to /forbidden if the caller
 * is not an active Documentation Captain. The ALLOWED_EMAIL bootstrap account
 * is a Captain after 3A, so it passes.
 */
export async function requireCaptain(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member || !member.is_active || member.role !== 'documentation_captain') {
    redirect('/forbidden');
  }
  return member;
}

/** Full roster (non-deleted) with each member's assigned subsystem ids. */
export async function listMembers(): Promise<MemberWithSubsystems[]> {
  const supabase = await createSupabaseServerClient();

  const { data: members } = await supabase
    .from('members')
    .select('id, email, display_name, role, is_active, is_outreach_reporter')
    .is('deleted_at', null)
    .order('display_name');

  const { data: subs } = await supabase
    .from('member_subsystems')
    .select('member_id, subsystem_option_id');

  const byMember = new Map<string, string[]>();
  for (const s of (subs ?? []) as { member_id: string; subsystem_option_id: string }[]) {
    const list = byMember.get(s.member_id) ?? [];
    list.push(s.subsystem_option_id);
    byMember.set(s.member_id, list);
  }

  return ((members ?? []) as Member[]).map((m) => ({
    ...m,
    subsystem_option_ids: byMember.get(m.id) ?? [],
  }));
}

/** Count of active Documentation Captains — for the last-Captain guard. */
export async function countActiveCaptains(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'documentation_captain')
    .eq('is_active', true)
    .is('deleted_at', null);
  return count ?? 0;
}
