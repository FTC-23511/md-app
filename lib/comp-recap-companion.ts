/**
 * Auto-generated companion view for the Competition Recap (SOP-04;
 * docs/briefs/2026-06-04-2d-comp-recap.md): the Test Log trend for the
 * window around the event, read from the `test_series` rollup produced by
 * 2C. Computed for display on the detail page — never stored on the recap
 * (`01-schema.md` §6), and zero Reporter effort.
 *
 * Window (brief Q1 recommendation): all `test_series` rows dated within the
 * 6 weeks before `comp_start_date`, through `comp_end_date` (or the start
 * date for one-day events) so tests run at the event itself are included.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

/** Days of test history shown before the competition start. */
const WINDOW_DAYS = 42;

export type TestTrendPoint = {
  test_date: string | null;
  headline_stat: number | null;
  test_log_id: string | null;
};

export type TestTrendSeries = {
  test_label: string;
  headline_label: string;
  points: TestTrendPoint[];
};

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Load the Test Log trend for a recap's window, grouped by `test_label` and
 * date-ordered within each series. Returns [] when the dates are missing or
 * nothing was tested in the window — the page renders nothing in that case.
 */
export async function loadCompRecapTrend(
  compStartDate: string | null,
  compEndDate: string | null,
): Promise<TestTrendSeries[]> {
  if (!compStartDate) return [];
  const windowStart = shiftDate(compStartDate, -WINDOW_DAYS);
  const windowEnd = compEndDate ?? compStartDate;

  const supabase = await createSupabaseServerClient();
  // test_series is a derived rollup with no soft-delete column (migration 016).
  const { data, error } = await supabase
    .from('test_series')
    .select('test_label, test_date, headline_stat, headline_label, test_log_id')
    .gte('test_date', windowStart)
    .lte('test_date', windowEnd)
    .order('test_date', { ascending: true });

  if (error) {
    // Companion view is best-effort decoration — never sink the detail page.
    console.error('loadCompRecapTrend: test_series query failed —', error.message);
    return [];
  }

  const byLabel = new Map<string, TestTrendSeries>();
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const label = typeof row.test_label === 'string' ? row.test_label : '';
    if (!label) continue;
    let series = byLabel.get(label);
    if (!series) {
      series = {
        test_label: label,
        headline_label: typeof row.headline_label === 'string' ? row.headline_label : 'result',
        points: [],
      };
      byLabel.set(label, series);
    }
    // Postgres `numeric` may arrive as a number or a string depending on the
    // serializer — coerce defensively.
    const rawStat = row.headline_stat;
    const stat =
      typeof rawStat === 'number'
        ? rawStat
        : typeof rawStat === 'string' && rawStat !== '' && !Number.isNaN(Number(rawStat))
          ? Number(rawStat)
          : null;
    series.points.push({
      test_date: typeof row.test_date === 'string' ? row.test_date : null,
      headline_stat: stat,
      test_log_id: typeof row.test_log_id === 'string' ? row.test_log_id : null,
    });
  }

  return Array.from(byLabel.values()).sort((a, b) => a.test_label.localeCompare(b.test_label));
}
