import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The auth trigger `handle_new_auth_user` creates a members row for every
  // signed-up auth user. The backfill in migration 009 covers the App Lead's
  // pre-existing account too. So a row should always exist for any
  // authenticated user — but we render gracefully if it doesn't.
  const { data: member } = await supabase
    .from('members')
    .select('email, display_name')
    .eq('id', user!.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

      <section className="bg-card mt-8 rounded-lg border border-border p-6">
        {member ? (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Signed in as:</span>{' '}
              <span className="font-medium">{member.display_name}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Email:</span>{' '}
              <span className="font-medium">{member.email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Entry capture forms ship soon — Session Logs, Outreach Logs, and Meeting Notes.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">No member record found.</p>
            <p className="text-sm text-muted-foreground">
              Your auth account exists but isn&apos;t linked to a member row. Try signing out and
              back in to trigger the auth-link backfill.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
