/**
 * Companion-view renderer for the Competition Recap detail page: one row per
 * Test Log series active in the event window, the headline stat shown as a
 * date-ordered arrow chain (T-04 "AUTO-GENERATED COMPANION VIEW"), each run
 * linking to its Test Log. Pure / presentational — data comes from
 * `lib/comp-recap-companion.ts`, computed for display, never stored.
 */

import Link from 'next/link';
import type { TestTrendSeries } from '@/lib/comp-recap-companion';

function fmt(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function TestTrendView({ series }: { series: TestTrendSeries[] }) {
  if (series.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No Test Logs in the six weeks before this event — file tests with a consistent label and the
        trend builds itself.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {series.map((s) => (
        <div key={s.test_label} className="rounded-md border border-border p-3">
          <p className="text-sm font-medium">
            {s.test_label}{' '}
            <span className="text-xs font-normal text-muted-foreground">({s.headline_label})</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
            {s.points.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {i > 0 ? <span className="text-muted-foreground">→</span> : null}
                {p.test_log_id ? (
                  <Link
                    href={`/entries/test_log/${p.test_log_id}` as never}
                    className="font-medium tabular-nums text-primary underline-offset-4 hover:underline"
                    title={p.test_date ?? undefined}
                  >
                    {fmt(p.headline_stat)}
                  </Link>
                ) : (
                  <span className="font-medium tabular-nums" title={p.test_date ?? undefined}>
                    {fmt(p.headline_stat)}
                  </span>
                )}
                {p.test_date ? (
                  <span className="text-xs text-muted-foreground">{p.test_date.slice(5)}</span>
                ) : null}
              </span>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}
