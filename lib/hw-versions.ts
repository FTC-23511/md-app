/**
 * Latest saved Hardware Change Log version per subsystem (2F follow-up, App Lead
 * request). Shown on the HW form so the filer sees the current iteration number
 * for the subsystem they're changing and picks the next one. Read-only, best-
 * effort — never blocks the form.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SubsystemVersion = { label: string; version: number };

export async function loadLatestHwVersions(): Promise<SubsystemVersion[]> {
  const supabase = await createSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from('hw_change_logs')
    .select('subsystem_option_id, version')
    .is('deleted_at', null);
  if (error || !rows || rows.length === 0) return [];

  // Max version per subsystem.
  const maxByOption = new Map<string, number>();
  for (const r of rows as Array<{ subsystem_option_id: string | null; version: number | null }>) {
    if (!r.subsystem_option_id || r.version == null) continue;
    const cur = maxByOption.get(r.subsystem_option_id);
    if (cur == null || r.version > cur) maxByOption.set(r.subsystem_option_id, r.version);
  }
  if (maxByOption.size === 0) return [];

  const ids = [...maxByOption.keys()];
  const { data: opts } = await supabase.from('option_lists').select('id, label').in('id', ids);
  const labelById = new Map<string, string>();
  for (const o of (opts ?? []) as Array<{ id: string; label: string }>) {
    labelById.set(o.id, o.label);
  }

  return ids
    .map((id) => ({
      label: labelById.get(id) ?? 'Unknown subsystem',
      version: maxByOption.get(id)!,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
