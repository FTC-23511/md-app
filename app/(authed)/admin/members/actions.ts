'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireCaptain, countActiveCaptains, ROLE_VALUES, type MemberRole } from '@/lib/members';
import { env } from '@/lib/env';

export type ActionState = { ok?: boolean; error?: string; message?: string };

const ADMIN_PATH = '/admin/members';

function asRole(v: FormDataEntryValue | null): MemberRole | null {
  return typeof v === 'string' && (ROLE_VALUES as readonly string[]).includes(v)
    ? (v as MemberRole)
    : null;
}

/**
 * Invite a teammate by email. Supabase creates the auth user → the
 * on_auth_user_created trigger creates the members row (active general_member)
 * → invite email is sent. We then set the chosen display_name / role on the new
 * row via the service-role client (no user JWT → bypasses the members column
 * guard, which is intended for end-user self-edits).
 */
export async function inviteMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCaptain();

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const displayName = String(formData.get('display_name') ?? '').trim();
  const role = asRole(formData.get('role')) ?? 'general_member';

  if (!email || !email.includes('@')) {
    return { error: 'Enter a valid email address.' };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${env.SITE_URL}/dashboard`,
  });

  if (error || !data?.user) {
    return {
      error:
        error?.message?.includes('already been registered') || error?.code === 'email_exists'
          ? 'That email is already a member.'
          : `Could not send the invite: ${error?.message ?? 'unknown error'}.`,
    };
  }

  const patch: Record<string, unknown> = {};
  if (displayName) patch.display_name = displayName;
  if (role !== 'general_member') patch.role = role;
  if (Object.keys(patch).length > 0) {
    await admin.from('members').update(patch).eq('id', data.user.id);
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, message: `Invite sent to ${email}.` };
}

/** Re-send an invite email to an already-created (unaccepted) member. */
export async function resendInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCaptain();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!email) return { error: 'Missing email.' };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${env.SITE_URL}/dashboard`,
  });
  if (error) {
    return { error: `Could not resend the invite: ${error.message}.` };
  }
  return { ok: true, message: `Invite resent to ${email}.` };
}

/** Change a member's role, with a last-active-Captain guard. */
export async function setMemberRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireCaptain();
  const memberId = String(formData.get('member_id') ?? '');
  const role = asRole(formData.get('role'));
  if (!memberId || !role) return { error: 'Invalid role change.' };

  const supabase = await createSupabaseServerClient();
  const { data: target } = await supabase
    .from('members')
    .select('role, is_active')
    .eq('id', memberId)
    .maybeSingle();

  if (
    target?.role === 'documentation_captain' &&
    target?.is_active &&
    role !== 'documentation_captain' &&
    (await countActiveCaptains()) <= 1
  ) {
    return { error: 'Cannot change the role of the last active Captain. Promote another first.' };
  }

  const { data, error } = await supabase
    .from('members')
    .update({ role })
    .eq('id', memberId)
    .select('id')
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "You don't have permission to make this change." };

  revalidatePath(ADMIN_PATH);
  return { ok: true };
}

/** Activate / deactivate a member, with a last-active-Captain guard. */
export async function setMemberActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCaptain();
  const memberId = String(formData.get('member_id') ?? '');
  const active = String(formData.get('active') ?? '') === 'true';
  if (!memberId) return { error: 'Invalid request.' };

  const supabase = await createSupabaseServerClient();
  const { data: target } = await supabase
    .from('members')
    .select('role, is_active')
    .eq('id', memberId)
    .maybeSingle();

  if (
    !active &&
    target?.role === 'documentation_captain' &&
    target?.is_active &&
    (await countActiveCaptains()) <= 1
  ) {
    return { error: 'Cannot deactivate the last active Captain.' };
  }

  const { data, error } = await supabase
    .from('members')
    .update({ is_active: active })
    .eq('id', memberId)
    .select('id')
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "You don't have permission to make this change." };

  revalidatePath(ADMIN_PATH);
  return { ok: true };
}

/** Replace a member's assigned subsystems (for Subsystem Leads). */
export async function assignSubsystems(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCaptain();
  const memberId = String(formData.get('member_id') ?? '');
  if (!memberId) return { error: 'Invalid request.' };
  const subsystemIds = formData.getAll('subsystem_option_id').map(String).filter(Boolean);

  const supabase = await createSupabaseServerClient();

  const { error: delError } = await supabase
    .from('member_subsystems')
    .delete()
    .eq('member_id', memberId);
  if (delError) return { error: delError.message };

  if (subsystemIds.length > 0) {
    const rows = subsystemIds.map((subsystem_option_id) => ({
      member_id: memberId,
      subsystem_option_id,
    }));
    const { error: insError } = await supabase.from('member_subsystems').insert(rows);
    if (insError) return { error: insError.message };
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, message: 'Subsystems updated.' };
}
