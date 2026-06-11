import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">Capture an entry</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={'/entries/sessions/new' as never}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            New Session Log
          </Link>
          <Link
            href={'/entries/outreach/new' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            New Outreach Log
          </Link>
          <Link
            href={'/entries/meetings/new' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            New Meeting Notes
          </Link>
          <Link
            href={'/entries/contact/new' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            New Contact Log
          </Link>
          <Link
            href={'/entries/hardware/new' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            New Hardware Change Log
          </Link>
          <Link
            href={'/entries/software/new' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            New Software Change Log
          </Link>
          <Link
            href={'/entries/test/new' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            New Test Log
          </Link>
          <Link
            href={'/entries/decision/new' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            New Decision Log
          </Link>
          <Link
            href={'/entries/recap/new' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            New Competition Recap
          </Link>
          <Link
            href={'/entries/list' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            View recent entries
          </Link>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">Admin</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={'/admin/manage-tags' as never}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
          >
            Manage tags
          </Link>
        </div>
      </section>
    </main>
  );
}
