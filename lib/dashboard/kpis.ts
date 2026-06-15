/**
 * Dashboard KPI rollups (3F). Pure-ish: one RLS-bound fan-out over the entry
 * tables fetching only the light columns needed (created_by, created_at,
 * entry_state, the event-date, and subsystem_option_id where it exists), then
 * everything is tallied in memory. All reads run under the caller's session
 * (anon client → RLS) — never service-role — so a scoped view only ever sees
 * rows the caller may read.
 *
 * Spec: docs/phase3/04-dashboard-and-flags.md §2.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ENTRY_LIST } from '@/entries/_registry';

/**
 * Event-date column per entry table (§2). All 9 registry entry types have one;
 * the `contacts` person table is not an entry type and is excluded.
 */
const EVENT_DATE_COL: Record<string, string> = {
  session_logs: 'session_date',
  outreach_logs: 'event_date',
  meeting_notes: 'meeting_date',
  comp_recaps: 'comp_start_date',
  contact_logs: 'contact_date',
  hw_change_logs: 'change_date',
  sw_change_logs: 'change_date',
  test_logs: 'test_date',
  decision_logs: 'decision_date',
};

const SUBSYSTEM_TABLES = new Set(['hw_change_logs', 'decision_logs']);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type TypeCount = { type: string; label: string; count: number };
export type NamedCount = { name: string; count: number };

export type DashboardKpis = {
  total: number;
  byType: TypeCount[];
  byTimeframe: { last7d: number; last30d: number; allTime: number };
  draftVsComplete: { draft: number; complete: number };
  topFilers: NamedCount[];
  bySubsystem: NamedCount[];
  captureLatency: { medianDays: number | null; count: number };
};

/** Median of a numeric list, or null if empty. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/** Whole days from an event date (YYYY-MM-DD) to a filed timestamp (ISO), UTC. */
export function daysFromEventToFiled(eventDate: string, createdAt: string): number | null {
  const ev = new Date(`${eventDate}T00:00:00Z`).getTime();
  const filed = new Date(createdAt).getTime();
  if (Number.isNaN(ev) || Number.isNaN(filed)) return null;
  return Math.round((filed - ev) / MS_PER_DAY);
}

type EntryRow = {
  created_by: string | null;
  created_at: string;
  entry_state: string | null;
  eventDate: string | null;
  subsystemId: string | null;
  type: string;
  label: string;
};

/**
 * Load the dashboard KPIs. Pass `memberId` for the reduced self-view (only that
 * member's entries); omit for the full (Captain) view.
 */
export async function loadDashboardKpis(opts?: { memberId?: string }): Promise<DashboardKpis> {
  const supabase = await createSupabaseServerClient();
  const nowMs = Date.now();

  const perType = await Promise.all(
    ENTRY_LIST.map(async (def) => {
      const eventCol = EVENT_DATE_COL[def.table];
      const cols = ['created_by', 'created_at', 'entry_state'];
      if (eventCol) cols.push(eventCol);
      if (SUBSYSTEM_TABLES.has(def.table)) cols.push('subsystem_option_id');

      let query = supabase.from(def.table).select(cols.join(', ')).is('deleted_at', null);
      if (opts?.memberId) query = query.eq('created_by', opts.memberId);

      const { data, error } = await query;
      if (error) {
        console.error(`loadDashboardKpis: ${def.table} failed —`, error.message);
        return [] as EntryRow[];
      }
      return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
        created_by: (r.created_by ?? null) as string | null,
        created_at: String(r.created_at),
        entry_state: (r.entry_state ?? null) as string | null,
        eventDate: eventCol ? ((r[eventCol] ?? null) as string | null) : null,
        subsystemId: (r.subsystem_option_id ?? null) as string | null,
        type: def.type,
        label: def.label,
      }));
    }),
  );

  const rows = perType.flat();

  // Counts by type.
  const byType: TypeCount[] = ENTRY_LIST.map((def, i) => ({
    type: def.type,
    label: def.label,
    count: perType[i]?.length ?? 0,
  }));

  // Timeframe.
  const cut7 = nowMs - 7 * MS_PER_DAY;
  const cut30 = nowMs - 30 * MS_PER_DAY;
  let last7d = 0;
  let last30d = 0;
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    if (t >= cut7) last7d++;
    if (t >= cut30) last30d++;
  }

  // Draft vs complete.
  let draft = 0;
  let complete = 0;
  for (const r of rows) {
    if (r.entry_state === 'draft') draft++;
    else complete++;
  }

  // Per-member (resolve display_name, never null).
  const byCreator = new Map<string, number>();
  for (const r of rows) {
    if (r.created_by) byCreator.set(r.created_by, (byCreator.get(r.created_by) ?? 0) + 1);
  }
  const nameById = new Map<string, string>();
  if (byCreator.size > 0) {
    const { data: members } = await supabase
      .from('members')
      .select('id, display_name')
      .in('id', Array.from(byCreator.keys()));
    for (const m of (members ?? []) as { id: string; display_name: string }[]) {
      nameById.set(m.id, m.display_name);
    }
  }
  const topFilers: NamedCount[] = Array.from(byCreator.entries())
    .map(([id, count]) => ({ name: nameById.get(id) ?? 'Unknown member', count }))
    .sort((a, b) => b.count - a.count);

  // By subsystem (precise — hw + decision logs only).
  const bySubId = new Map<string, number>();
  for (const r of rows) {
    if (r.subsystemId) bySubId.set(r.subsystemId, (bySubId.get(r.subsystemId) ?? 0) + 1);
  }
  const subLabelById = new Map<string, string>();
  if (bySubId.size > 0) {
    const { data: opts2 } = await supabase
      .from('option_lists')
      .select('id, label')
      .in('id', Array.from(bySubId.keys()));
    for (const o of (opts2 ?? []) as { id: string; label: string }[]) {
      subLabelById.set(o.id, o.label);
    }
  }
  const bySubsystem: NamedCount[] = Array.from(bySubId.entries())
    .map(([id, count]) => ({ name: subLabelById.get(id) ?? 'Unknown subsystem', count }))
    .sort((a, b) => b.count - a.count);

  // Capture latency (median days from event to filed).
  const latencies: number[] = [];
  for (const r of rows) {
    if (r.eventDate) {
      const d = daysFromEventToFiled(r.eventDate, r.created_at);
      if (d !== null) latencies.push(d);
    }
  }

  return {
    total: rows.length,
    byType,
    byTimeframe: { last7d, last30d, allTime: rows.length },
    draftVsComplete: { draft, complete },
    topFilers,
    bySubsystem,
    captureLatency: { medianDays: median(latencies), count: latencies.length },
  };
}
