import type { OverdueFlag } from '@/lib/flags';
import { OVERDUE_THRESHOLD_HOURS } from '@/lib/flags';

/**
 * Dashboard flag queue (3E). Presentational — the page fetches the overdue
 * flags (via lib/flags.ts) and passes them in, so this stays reusable by the
 * 3F dashboard rebuild. Shows a red OVERDUE pill per flag + a header count.
 */
export function FlagQueue({ flags }: { flags: OverdueFlag[] }) {
  return (
    <section className="grid gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Flag queue</h2>
        {flags.length > 0 ? (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
            {flags.length} OVERDUE
          </span>
        ) : null}
      </div>

      {flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No flags open longer than {OVERDUE_THRESHOLD_HOURS} hours. 🎉
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {flags.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{f.subject}</div>
                <div className="text-xs text-muted-foreground">
                  {f.targetEntryType.replace(/_/g, ' ')}
                  {f.ownerName ? ` · ${f.ownerName}` : ' · unassigned'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">{f.ageDays}d open</span>
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                  OVERDUE
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
