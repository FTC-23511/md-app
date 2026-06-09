/**
 * Read-only renderer for the auto-computed decision-matrix result
 * (`lib/compute/decision-matrix.ts` → stored verbatim in `extras.computed`).
 *
 * Pure / presentational — no hooks, no client APIs — so it is shared by the
 * detail page (`EntryDetailView`) and any form-side surface. The compute layer
 * keeps full precision; this is the only place that rounds for display.
 */

import type { MatrixStats } from '@/lib/compute/decision-matrix';

/** Weighted totals carry fractional precision; show up to 2 decimals. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function pct(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}

export function MatrixStatsView({ stats }: { stats: MatrixStats }) {
  const options = stats.options ?? [];
  const weightEntries = Object.entries(stats.normalizedWeights ?? {});

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      {stats.weightsWereNormalized ? (
        <p className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          Weights entered didn&apos;t sum to 1.0 (raw sum {fmt(stats.rawWeightSum)}); they were
          normalized for scoring.
        </p>
      ) : null}

      {options.length > 0 ? (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1 pr-4 font-medium">Option</th>
              <th className="py-1 pr-4 font-medium">Weighted total</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o) => (
              <tr key={o.option} className="border-b border-border/50">
                <td className="py-1 pr-4 align-top">
                  {o.option}
                  {o.isWinner ? (
                    <span className="ml-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Winner
                    </span>
                  ) : null}
                </td>
                <td className="py-1 pr-4 align-top font-medium tabular-nums">
                  {fmt(o.weightedTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted-foreground">No options scored yet.</p>
      )}

      {stats.tie ? (
        <p className="text-xs text-muted-foreground">Top options are tied — no single winner.</p>
      ) : null}

      {weightEntries.length > 0 ? (
        <div>
          <p className="text-xs text-muted-foreground">Normalized weights</p>
          <ul className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
            {weightEntries.map(([name, w]) => (
              <li key={name}>
                <span className="text-muted-foreground">{name}:</span>{' '}
                <span className="font-medium tabular-nums">{pct(w)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
