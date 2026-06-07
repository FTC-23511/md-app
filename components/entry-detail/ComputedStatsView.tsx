/**
 * Read-only renderer for the auto-computed Test Log statistics
 * (`lib/compute/test-stats.ts` → stored verbatim in `extras.computed`).
 *
 * Pure / presentational — no hooks, no client APIs — so it is shared by both
 * the detail page (server component, `EntryDetailView`) and the form-side
 * `computed-readonly` block (client component). The compute layer keeps full
 * precision; this is the only place that rounds for display.
 */

import type {
  ColumnStats,
  ComputedStats,
  ConfidenceInterval,
  NumberColumnStats,
} from '@/lib/compute/test-stats';

/** Trim a number for display: integers stay whole, else up to 2 decimals. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}

function pct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

function ci(c: ConfidenceInterval, asPercent = false): string {
  const lo = asPercent ? pct(c.low) : fmt(c.low);
  const hi = asPercent ? pct(c.high) : fmt(c.high);
  return `${lo} – ${hi}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">{children}</dl>;
}

function FailureModes({ modes }: { modes: Record<string, number> }) {
  const entries = Object.entries(modes).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return (
    <div className="mt-1">
      <p className="text-xs text-muted-foreground">Failure modes</p>
      <ul className="mt-0.5 flex flex-col gap-0.5 text-sm">
        {entries.map(([mode, count]) => (
          <li key={mode}>
            <span className="font-medium tabular-nums">{count}×</span> {mode}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumberStatGrid({ stats }: { stats: NumberColumnStats }) {
  return (
    <StatGrid>
      <Stat label="N" value={fmt(stats.n)} />
      <Stat label="Mean" value={fmt(stats.mean)} />
      <Stat label="Std dev" value={fmt(stats.stddev)} />
      <Stat label="Min" value={fmt(stats.min)} />
      <Stat label="Max" value={fmt(stats.max)} />
      <Stat label="95% CI (mean)" value={ci(stats.ci95)} />
    </StatGrid>
  );
}

function ColumnStatsView({ name, stats }: { name: string; stats: ColumnStats }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="mb-2 text-sm font-medium">
        {name} <span className="text-xs font-normal text-muted-foreground">({stats.kind})</span>
      </p>
      {stats.kind === 'number' ? <NumberStatGrid stats={stats} /> : null}
      {stats.kind === 'pass_fail' ? (
        <StatGrid>
          <Stat label="N" value={fmt(stats.n)} />
          <Stat label="Successes" value={fmt(stats.successes)} />
          <Stat label="Pass rate" value={pct(stats.passRate)} />
          <Stat label="95% CI" value={ci(stats.ci95, true)} />
        </StatGrid>
      ) : null}
      {stats.kind === 'category' ? (
        <ul className="flex flex-col gap-0.5 text-sm">
          {Object.entries(stats.counts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => (
              <li key={label}>
                <span className="font-medium tabular-nums">{count}×</span> {label}
              </li>
            ))}
        </ul>
      ) : null}
      {stats.kind === 'text' ? (
        <p className="text-xs text-muted-foreground">
          Free text — shown in the raw table, not summarized.
        </p>
      ) : null}
    </div>
  );
}

export function ComputedStatsView({ stats }: { stats: ComputedStats }) {
  if (stats.kind === 'pass_fail') {
    return (
      <div className="rounded-md border border-border p-3">
        <StatGrid>
          <Stat label="N" value={fmt(stats.n)} />
          <Stat label="Successes" value={fmt(stats.successes)} />
          <Stat label="Pass rate" value={pct(stats.passRate)} />
          <Stat label="95% CI" value={ci(stats.ci95, true)} />
        </StatGrid>
        {stats.failureModes ? <FailureModes modes={stats.failureModes} /> : null}
      </div>
    );
  }

  if (stats.kind === 'single_measure') {
    return (
      <div className="rounded-md border border-border p-3">
        <NumberStatGrid stats={{ ...stats, kind: 'number' }} />
      </div>
    );
  }

  // custom
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(stats.columns).map(([name, colStats]) => (
        <ColumnStatsView key={name} name={name} stats={colStats} />
      ))}
      {stats.byCondition ? (
        <div className="rounded-md border border-border p-3">
          <p className="mb-2 text-sm font-medium">
            Grouped by <span className="font-semibold">{stats.byCondition.column}</span>
          </p>
          <div className="flex flex-col gap-3">
            {Object.entries(stats.byCondition.groups).map(([group, columns]) => (
              <div key={group}>
                <p className="text-xs font-medium text-muted-foreground">{group}</p>
                <div className="mt-1 flex flex-col gap-2">
                  {Object.entries(columns).map(([colName, colStats]) => (
                    <div key={colName}>
                      <p className="text-xs text-muted-foreground">{colName}</p>
                      <NumberStatGrid stats={colStats} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
