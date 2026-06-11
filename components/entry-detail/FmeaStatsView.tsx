/**
 * Read-only renderer for the auto-computed FMEA result
 * (`lib/compute/fmea.ts` → stored verbatim in `extras.computed_fmea`).
 *
 * Pure / presentational — no hooks, no client APIs — so it is shared by the
 * detail page (`EntryDetailView`) and any form-side surface. The compute layer
 * keeps full precision; RPNs are integer products so no rounding is needed.
 */

import type { FmeaStats } from '@/lib/compute/fmea';

function num(n: number | null): string {
  return n === null ? '—' : String(n);
}

export function FmeaStatsView({ stats }: { stats: FmeaStats }) {
  const rows = stats.rows ?? [];

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No failure modes scored yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1 pr-4 font-medium">Failure mode</th>
              <th className="py-1 pr-4 font-medium">S</th>
              <th className="py-1 pr-4 font-medium">L</th>
              <th className="py-1 pr-4 font-medium">D</th>
              <th className="py-1 pr-4 font-medium">RPN</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1 pr-4 align-top">
                  {r.failureMode || <span className="text-muted-foreground">—</span>}
                  {stats.maxRpn !== null && r.rpn === stats.maxRpn ? (
                    <span className="ml-2 inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Top risk
                    </span>
                  ) : null}
                </td>
                <td className="py-1 pr-4 align-top tabular-nums">{num(r.severity)}</td>
                <td className="py-1 pr-4 align-top tabular-nums">{num(r.likelihood)}</td>
                <td className="py-1 pr-4 align-top tabular-nums">{num(r.detectability)}</td>
                <td className="py-1 pr-4 align-top font-medium tabular-nums">{num(r.rpn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats.topRisk ? (
        <p className="text-xs text-muted-foreground">
          Highest RPN: <span className="font-medium text-foreground">{num(stats.maxRpn)}</span> —{' '}
          {stats.topRisk}
        </p>
      ) : null}
    </div>
  );
}
