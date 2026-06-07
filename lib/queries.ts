/**
 * Cross-entry-type list query. Walks the registry, fetches recent rows from
 * each detail table in parallel, merges and sorts by created_at DESC.
 *
 * Spec: docs/phase1/03-forms.md §18.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ENTRY_LIST } from '@/entries/_registry';
import { listSummary as sessionLogListSummary } from '@/entries/session-log';
import { listSummary as outreachLogListSummary } from '@/entries/outreach-log';
import { listSummary as meetingNotesListSummary } from '@/entries/meeting-notes';
import { listSummary as contactLogListSummary } from '@/entries/contact-log';
import { listSummary as hardwareChangeLogListSummary } from '@/entries/hardware-change-log';
import { listSummary as softwareChangeLogListSummary } from '@/entries/software-change-log';
import { listSummary as testLogListSummary } from '@/entries/test-log';

const LIST_SUMMARIES: Record<string, (row: Record<string, unknown>) => string> = {
  session_log: sessionLogListSummary,
  outreach_log: outreachLogListSummary,
  meeting_notes: meetingNotesListSummary,
  contact_log: contactLogListSummary,
  hw_change_log: hardwareChangeLogListSummary,
  sw_change_log: softwareChangeLogListSummary,
  test_log: testLogListSummary,
};

export type EntryListRow = {
  id: string;
  created_at: string;
  created_by: string | null;
  filer_email: string | null;
  entry_type: string;
  entry_label: string;
  summary: string;
};

export async function listAllEntries(limit = 50): Promise<EntryListRow[]> {
  const supabase = await createSupabaseServerClient();

  const perTypeResults = await Promise.all(
    ENTRY_LIST.map(async (def) => {
      const { data, error } = await supabase
        .from(def.table)
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        // Log and skip — one failing type shouldn't sink the whole list.
        console.error(`listAllEntries: ${def.table} failed —`, error.message);
        return [] as Array<Record<string, unknown>>;
      }
      return (data ?? []) as Array<Record<string, unknown>>;
    }),
  );

  // Collect every distinct created_by uuid so we can fetch emails in one go.
  const creatorIds = new Set<string>();
  for (const rows of perTypeResults) {
    for (const row of rows) {
      const id = row.created_by;
      if (typeof id === 'string') creatorIds.add(id);
    }
  }

  let emailById = new Map<string, string>();
  if (creatorIds.size > 0) {
    const { data: members } = await supabase
      .from('members')
      .select('id, email')
      .in('id', Array.from(creatorIds));
    emailById = new Map((members ?? []).map((m: { id: string; email: string }) => [m.id, m.email]));
  }

  // Merge + decorate.
  const merged: EntryListRow[] = [];
  ENTRY_LIST.forEach((def, i) => {
    const summarize =
      LIST_SUMMARIES[def.type] ?? ((row: Record<string, unknown>) => String(row.id));
    const rows = perTypeResults[i] ?? [];
    for (const row of rows) {
      const createdBy = typeof row.created_by === 'string' ? row.created_by : null;
      merged.push({
        id: String(row.id),
        created_at: String(row.created_at),
        created_by: createdBy,
        filer_email: createdBy ? (emailById.get(createdBy) ?? null) : null,
        entry_type: def.type,
        entry_label: def.label,
        summary: summarize(row),
      });
    }
  });

  merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return merged.slice(0, limit);
}
