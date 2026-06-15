import type { DashboardKpis } from '@/lib/dashboard/kpis';

/**
 * Dashboard KPI cards (3F). Presentational — numbers + simple tables, no chart
 * library (no new dependency). Takes the rollups computed in lib/dashboard/kpis.ts.
 */
export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const { byTimeframe, draftVsComplete, captureLatency, byType, topFilers, bySubsystem } = kpis;

  return (
    <section className="grid gap-4">
      <h2 className="text-lg font-semibold">Documentation health</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total entries" value={kpis.total} />
        <Stat label="Last 7 days" value={byTimeframe.last7d} />
        <Stat label="Last 30 days" value={byTimeframe.last30d} />
        <Stat
          label="Median capture latency"
          value={captureLatency.medianDays === null ? '—' : `${captureLatency.medianDays}d`}
          sub={captureLatency.count > 0 ? `over ${captureLatency.count} entries` : 'no event dates'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Drafts" value={draftVsComplete.draft} />
        <Stat label="Complete" value={draftVsComplete.complete} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="By entry type">
          <CountList
            rows={byType.map((t) => ({ name: t.label, count: t.count }))}
            emptyLabel="No entries yet"
          />
        </Panel>
        <Panel title="Top filers">
          <CountList rows={topFilers} emptyLabel="No entries yet" />
        </Panel>
        <Panel
          title="By subsystem"
          note="Hardware + Decision logs only (the entry types with a subsystem field)."
        >
          <CountList rows={bySubsystem} emptyLabel="No subsystem-tagged entries" />
        </Panel>
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {sub ? <div className="text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {note ? <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function CountList({
  rows,
  emptyLabel,
}: {
  rows: { name: string; count: number }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-1">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`} className="flex items-center justify-between text-sm">
          <span className="truncate pr-2">{r.name}</span>
          <span className="tabular-nums text-muted-foreground">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}
