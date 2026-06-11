/**
 * Write path for the Test Log. The generic `insertEntry` writes a single row;
 * a Test Log additionally (a) auto-computes its statistics, (b) writes a
 * `test_series` rollup row for cheap trend/last-run lookups, and (c) records
 * the headline-stat delta vs the most recent prior run of the same label.
 *
 * The compute is the shared, path-independent module (`lib/compute/test-stats.ts`),
 * so this path and the fallback importer produce identical `extras.computed`.
 *
 * Storage (deviates slightly from the §4 doc sketch — kept internally
 * consistent): the raw table lands in `extras.test_data` as the
 * `{raw_rows, custom_columns}` composite (so the detail page reads it back via
 * the field name), `extras.computed` holds the stats object, and
 * `extras.headline` holds `{label, stat, delta, prior_stat}` for the dashboard
 * / Comp Recap companion view.
 *
 * Spec: docs/phase2/03-test-log.md §§3–4, docs/phase2/01-schema.md §4.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { testLogEntry } from '@/entries/test-log';
import type { InsertResult } from '@/lib/insert-entry';
import {
  buildZodSchemaFromDefinition,
  flattenZodErrors,
  parseFormDataWithDefinition,
} from '@/lib/validate-entry';
import type { CustomColumn } from '@/lib/compute/test-stats';
import { computeTestLogExtras, writeTestSeriesRow, type TestType } from '@/lib/test-log-finalize';

type RawTable = {
  raw_rows: Array<Record<string, string>>;
  custom_columns: CustomColumn[];
};

export async function insertTestLog(formData: FormData): Promise<InsertResult> {
  const definition = testLogEntry;

  // 1. Parse + validate (same pipeline as insertEntry).
  const parsed = parseFormDataWithDefinition(definition, formData);
  const schema = buildZodSchemaFromDefinition(definition);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, fieldErrors: flattenZodErrors(result.error) };
  }
  const data = result.data as Record<string, unknown>;

  // 2. Split column vs extras (computed-readonly produced no value — recomputed below).
  const columnValues: Record<string, unknown> = {};
  const extrasValues: Record<string, unknown> = {};
  for (const field of definition.fields) {
    const value = data[field.name];
    if (value === undefined) continue;
    if (field.storage === 'column') columnValues[field.name] = value;
    else extrasValues[field.name] = value;
  }

  // 3. Auth.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, formError: 'Not authenticated.' };

  // 4. Auto-compute statistics + headline (with prior-run delta) via the shared,
  //    path-independent finalize module — identical output to the importer.
  const testType = String(columnValues.test_type ?? 'pass_fail') as TestType;
  const table = (extrasValues.test_data as RawTable | undefined) ?? {
    raw_rows: [],
    custom_columns: [],
  };
  const testLabel = String(columnValues.test_label ?? '');
  const { computed, headline } = await computeTestLogExtras(supabase, {
    testType,
    rawRows: table.raw_rows,
    customColumns: table.custom_columns,
    testLabel,
  });
  extrasValues.computed = computed;
  if (headline) extrasValues.headline = headline;

  // 5. Insert the test_logs row.
  const { data: log, error: logError } = await supabase
    .from('test_logs')
    .insert({
      ...columnValues,
      extras: extrasValues,
      created_by: user.id,
      created_via: 'app',
      entry_state: definition.defaultEntryState ?? 'draft',
    })
    .select('id')
    .single();

  if (logError || !log) {
    return { ok: false, formError: logError?.message ?? 'Could not save test log.' };
  }
  const logId = (log as { id: string }).id;

  // 6. Write the rollup row (best-effort — the log is already saved).
  if (headline) {
    await writeTestSeriesRow(supabase, {
      testLabel,
      testLogId: logId,
      testDate: (columnValues.test_date as string | undefined) ?? null,
      headline,
    });
  }

  return { ok: true, id: logId };
}
