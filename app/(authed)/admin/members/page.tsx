import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCaptain, listMembers } from '@/lib/members';
import { MembersTable } from './members-table';

export const dynamic = 'force-dynamic';

/**
 * Captain-only member management (3D). Invite by email, change roles, assign
 * subsystems to leads, activate/deactivate. requireCaptain() bounces anyone
 * who isn't an active Documentation Captain to /forbidden.
 */
export default async function MembersAdminPage() {
  await requireCaptain();

  const members = await listMembers();

  const supabase = await createSupabaseServerClient();
  const { data: subsystemRows } = await supabase
    .from('option_lists')
    .select('id, label')
    .eq('category', 'subsystem')
    .is('deleted_at', null)
    .order('sort_order');
  const subsystems = (subsystemRows ?? []) as { id: string; label: string }[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <Link
          href={'/dashboard' as never}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Dashboard
        </Link>
      </header>

      <p className="mt-4 text-sm text-muted-foreground">
        Invite teammates and manage their roles. Invited members get a sign-in link by email; once
        they accept they appear here as an active general member. Changing a role takes effect
        immediately; deactivating a member bounces them on their next navigation.
      </p>

      <div className="mt-6">
        <MembersTable members={members} subsystems={subsystems} />
      </div>
    </main>
  );
}
