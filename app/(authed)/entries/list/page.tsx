import Link from 'next/link';
import { listAllEntries } from '@/lib/queries';

const TYPE_PILL_CLASSES: Record<string, string> = {
  session_log: 'bg-blue-100 text-blue-900',
  outreach_log: 'bg-emerald-100 text-emerald-900',
  meeting_notes: 'bg-amber-100 text-amber-900',
  contact_log: 'bg-violet-100 text-violet-900',
  hw_change_log: 'bg-rose-100 text-rose-900',
  sw_change_log: 'bg-cyan-100 text-cyan-900',
  test_log: 'bg-lime-100 text-lime-900',
};

export default async function EntriesListPage() {
  const entries = await listAllEntries(50);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Recent entries</h1>
        <nav className="flex flex-wrap gap-2 text-sm">
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
        </nav>
      </header>

      {entries.length === 0 ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          No entries yet — file one above.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {entries.map((row) => {
            const pillClass = TYPE_PILL_CLASSES[row.entry_type] ?? 'bg-muted text-foreground';
            const date = row.created_at.slice(0, 10);
            return (
              <li key={`${row.entry_type}:${row.id}`} className="py-3">
                <Link
                  href={`/entries/${row.entry_type}/${row.id}` as never}
                  className="-mx-3 flex flex-col gap-1 rounded px-3 py-2 hover:bg-accent/40"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pillClass}`}
                    >
                      {row.entry_label}
                    </span>
                    <span className="text-xs text-muted-foreground">{date}</span>
                    {row.filer_email ? (
                      <span className="text-xs text-muted-foreground">— {row.filer_email}</span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium">{row.summary}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
