import Link from 'next/link';
import { getCurrentMember, listMembers } from '@/lib/members';
import { listOverdueFlags } from '@/lib/flags';
import { loadDashboardKpis } from '@/lib/dashboard/kpis';
import { FlagQueue } from '@/components/dashboard/flag-queue';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { Roster } from '@/components/dashboard/roster';

export const dynamic = 'force-dynamic';

const CAPTURE_LINKS: { href: string; label: string; primary?: boolean }[] = [
  { href: '/entries/sessions/new', label: 'New Session Log', primary: true },
  { href: '/entries/outreach/new', label: 'New Outreach Log' },
  { href: '/entries/meetings/new', label: 'New Meeting Notes' },
  { href: '/entries/contact/new', label: 'New Contact Log' },
  { href: '/entries/hardware/new', label: 'New Hardware Change Log' },
  { href: '/entries/software/new', label: 'New Software Change Log' },
  { href: '/entries/test/new', label: 'New Test Log' },
  { href: '/entries/decision/new', label: 'New Decision Log' },
  { href: '/entries/recap/new', label: 'New Competition Recap' },
  { href: '/entries/list', label: 'View recent entries' },
];

/**
 * Combined Captain/admin dashboard (3F): roster + roles, flag queue (overdue),
 * and KPI rollups. Captain/Deputy see the full team view; everyone else gets a
 * reduced self-view (their own entry KPIs) — not a dead end. All reads run under
 * the caller's session (RLS).
 */
export default async function DashboardPage() {
  const member = await getCurrentMember();
  const isAdmin =
    member?.role === 'documentation_captain' || member?.role === 'deputy_documentation_captain';

  const [overdueFlags, kpis, members] = await Promise.all([
    listOverdueFlags(),
    loadDashboardKpis(isAdmin || !member ? undefined : { memberId: member.id }),
    isAdmin ? listMembers() : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          {member ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {member.display_name}
              {isAdmin ? ' · team overview' : ' · your documentation'}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-10">
        <FlagQueue flags={overdueFlags} />

        <div className="grid gap-2">
          {!isAdmin ? <p className="text-sm text-muted-foreground">Showing your entries.</p> : null}
          <KpiCards kpis={kpis} />
        </div>

        {isAdmin ? <Roster members={members} /> : null}

        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">Capture an entry</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {CAPTURE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href as never}
                className={
                  l.primary
                    ? 'inline-flex h-9 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground shadow hover:bg-primary/90'
                    : 'inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent'
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>

        {isAdmin ? (
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">Admin</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href={'/admin/members' as never}
                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
              >
                Members
              </Link>
              <Link
                href={'/admin/manage-tags' as never}
                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-medium hover:bg-accent"
              >
                Manage tags
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
