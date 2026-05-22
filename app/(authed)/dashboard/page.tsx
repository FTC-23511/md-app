import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Look up the member row for this auth user (may not exist yet for a brand-
  // new sign-up — Captain provisions members manually for Phase 1).
  const { data: member } = await supabase
    .from('members')
    .select('id, name, role, team_id')
    .eq('auth_user_id', user!.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="font-medium">{user!.email}</span>
          </p>
        </div>
        <form action="/auth/sign-out" method="post">
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>

      <section className="bg-card mt-8 rounded-lg border border-border p-6">
        {member ? (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Name:</span>{' '}
              <span className="font-medium">{member.name}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Role:</span>{' '}
              <span className="font-medium">{member.role}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Hello, MD app. Entry capture forms ship in the next phase.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">No member record found.</p>
            <p className="text-sm text-muted-foreground">
              Ask the Documentation Captain to add you to the team roster. Your auth account exists
              but isn&apos;t linked to a team member yet.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
