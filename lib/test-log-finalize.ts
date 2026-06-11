/**
 * Shared, path-independent finalize step for a Test Log write.
 *
 * Both the app submit path (`lib/insert-test-log.ts`) and the fallback importer
 * (`scripts/fallback/import.ts`) call this so a Test Log gets identical
 * `extras.computed` + `extras.headline` and an identical `test_series` rollup
 * row regardless of how it was captured (00-plan.md §3 decision 1: the compute
 * is shared TypeScript, never a DB trigger).
 *
 * Imports are kept relative (`./compute/test-stats`) so this module loads under
 * both Next (server actions) and `tsx` (the importer runs outside the app).
 *
 * Spec: docs/phase2/03-test-log.md §§3–4, docs/phase2/01-schema.md §4.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeTestStats,
  type ComputedStats,
  type CustomColumn,
  type CustomRow,
  type PassFailRow,
  type SingleMeasureRow,
} from './compute/test-stats';

export type TestType = 'pass_fail' | 'single_measure' | 'custom';

/** The headline-stat block stored in `extras.headline`. */
export interface Headline {
  label: string;
  stat: number;
  delta: number | null;
  prior_stat: number | null;
}

/** The single trend stat for this test, by mode. Null when none is derivable. */
export function deriveHeadline(stats: ComputedStats): { label: string; stat: number } | null {
  if (stats.kind === 'pass_fail') return { label: 'Pass rate', stat: stats.passRate };
  if (stats.kind === 'single_measure') return { label: 'Mean', stat: stats.mean };
  // custom: first number column's mean (brief Q3 — default to first number column).
  for (const [name, col] of Object.entries(stats.columns)) {
    if (col.kind === 'number') return { label: name, stat: col.mean };
  }
  return null;
}

/**
 * Compute the stats + headline for a Test Log, querying the most-recent prior
 * run of the same label for a delta. Pure of insert side effects (read-only DB
 * access). Returns the two objects to store in `extras`.
 */
export async function computeTestLogExtras(
  supabase: SupabaseClient,
  input: {
    testType: TestType;
    rawRows: PassFailRow[] | SingleMeasureRow[] | CustomRow[];
    customColumns: CustomColumn[];
    testLabel: string;
  },
): Promise<{ computed: ComputedStats; headline: Headline | null }> {
  const computed = computeTestStats({
    testType: input.testType,
    rawRows: input.rawRows,
    customColumns: input.customColumns,
  });

  const head = deriveHeadline(computed);
  if (!head) return { computed, headline: null };

  let priorStat: number | null = null;
  if (input.testLabel) {
    const { data: prior } = await supabase
      .from('test_series')
      .select('headline_stat, test_date')
      .eq('test_label', input.testLabel)
      .order('test_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    const ps = (prior as { headline_stat: number | null } | null)?.headline_stat;
    if (typeof ps === 'number') priorStat = ps;
  }

  return {
    computed,
    headline: {
      label: head.label,
      stat: head.stat,
      delta: priorStat === null ? null : head.stat - priorStat,
      prior_stat: priorStat,
    },
  };
}

/**
 * Best-effort `test_series` rollup write. The `test_logs` row is the source of
 * truth and the series row can be backfilled, so a failure here is logged, not
 * thrown — the caller's submit/import already succeeded.
 */
export async function writeTestSeriesRow(
  supabase: SupabaseClient,
  input: {
    testLabel: string;
    testLogId: string;
    testDate: string | null;
    headline: { label: string; stat: number };
  },
): Promise<void> {
  const { error } = await supabase.from('test_series').insert({
    test_label: input.testLabel,
    test_log_id: input.testLogId,
    test_date: input.testDate,
    headline_stat: input.headline.stat,
    headline_label: input.headline.label,
  });
  if (error) {
    console.error('writeTestSeriesRow: test_series insert failed —', error.message);
  }
}
