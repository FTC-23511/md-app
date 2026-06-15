import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * The Phase 3 membership gate — replaces the Phase 1 single-email allowlist.
 *
 * Returns true if the signed-in user may reach protected routes:
 *   1. Bootstrap pass (decision 6 / R1): a session whose email equals
 *      ALLOWED_EMAIL is always allowed in, so the first Documentation Captain
 *      can never be locked out even if the `members` roster is misconfigured.
 *   2. Otherwise: an ACTIVE, non-deleted member row must exist for this user.
 *      Since members.id IS auth.users.id, this is a direct lookup by id.
 *
 * The query runs as the user (anon client + their cookies), so it is subject
 * to the `members_select` RLS policy — fine: an active member can always read
 * their own row, and a deactivated user reads zero rows and is bounced.
 *
 * Used by both the middleware (primary gate) and the authed layout (defense in
 * depth). Kept client-agnostic so it works with the SSR middleware client and
 * the server-component client alike.
 */
export async function canAccessApp(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<boolean> {
  // Bootstrap pass — belt-and-suspenders for the App Lead.
  if (user.email && user.email === env.ALLOWED_EMAIL) {
    return true;
  }

  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    // Fail closed: a query error (e.g. transient RLS/permission issue) must not
    // grant access.
    return false;
  }

  return data !== null;
}
