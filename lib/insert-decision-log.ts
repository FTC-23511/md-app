/**
 * Write path for the Decision Log. The generic `insertEntry` writes a single
 * row; a Decision Log additionally auto-computes its depth-section statistics
 * server-side — the weighted trade-off matrix totals (`extras.computed_matrix`)
 * and the FMEA RPNs (`extras.computed_fmea`) — via the shared,
 * path-independent `lib/compute/` modules, so this path and the fallback
 * importer produce identical output and the filer never types a total.
 *
 * Depth hygiene: a depth section whose trigger checkbox is unchecked is
 * hidden in the form and stripped from submit, but composite blocks still
 * parse to empty shells (empty matrix / empty rows array). Those shells are
 * dropped here so `extras` only carries the depth objects whose trigger is
 * actually set (docs/phase2/01-schema.md §5).
 *
 * Spec: docs/phase2/02-forms-and-detail.md §§1–2, charter SOP-05.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decisionLogEntry } from '@/entries/decision-log';
import type { InsertResult } from '@/lib/insert-entry';
import {
  buildZodSchemaFromDefinition,
  flattenZodErrors,
  parseFormDataWithDefinition,
} from '@/lib/validate-entry';
import { computeDecisionMatrix, type MatrixInput } from '@/lib/compute/decision-matrix';
import { computeFmea, type FmeaRow } from '@/lib/compute/fmea';

/**
 * Resolve the depth sections in place on a split extras object: drop empty
 * shells for untriggered/unfilled sections, compute matrix totals + FMEA RPNs
 * for filled ones. Shared by the insert path below and the 2E update flow.
 */
export function finalizeDecisionDepth(extrasValues: Record<string, unknown>): void {
  const matrix = extrasValues.matrix as MatrixInput | undefined;
  const matrixFilled =
    extrasValues.trigger_matrix === true &&
    matrix != null &&
    (matrix.criteria?.length ?? 0) > 0 &&
    (matrix.options?.length ?? 0) > 0;
  if (matrixFilled) {
    extrasValues.computed_matrix = computeDecisionMatrix(matrix);
  } else {
    delete extrasValues.matrix;
    delete extrasValues.computed_matrix;
  }

  const fmeaRows = extrasValues.fmea as FmeaRow[] | undefined;
  const fmeaFilled =
    extrasValues.trigger_fmea === true && Array.isArray(fmeaRows) && fmeaRows.length > 0;
  if (fmeaFilled) {
    extrasValues.computed_fmea = computeFmea(fmeaRows);
  } else {
    delete extrasValues.fmea;
    delete extrasValues.computed_fmea;
  }

  if (extrasValues.trigger_first_principles !== true) delete extrasValues.first_principles;
  if (extrasValues.trigger_sensitivity !== true) delete extrasValues.sensitivity;
}

export async function insertDecisionLog(formData: FormData): Promise<InsertResult> {
  const definition = decisionLogEntry;

  // 1. Parse + validate (same pipeline as insertEntry).
  const parsed = parseFormDataWithDefinition(definition, formData);
  const schema = buildZodSchemaFromDefinition(definition);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, fieldErrors: flattenZodErrors(result.error) };
  }
  const data = result.data as Record<string, unknown>;

  // 2. Split column vs extras (computed-readonly produced no value — computed below).
  const columnValues: Record<string, unknown> = {};
  const extrasValues: Record<string, unknown> = {};
  for (const field of definition.fields) {
    const value = data[field.name];
    if (value === undefined) continue;
    if (field.storage === 'column') columnValues[field.name] = value;
    else extrasValues[field.name] = value;
  }

  // 3. Depth hygiene + server-side auto-compute.
  finalizeDecisionDepth(extrasValues);

  // 4. Auth.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, formError: 'Not authenticated.' };

  // 5. Insert.
  const { data: log, error } = await supabase
    .from('decision_logs')
    .insert({
      ...columnValues,
      extras: extrasValues,
      created_by: user.id,
      created_via: 'app',
      entry_state: definition.defaultEntryState ?? 'draft',
    })
    .select('id')
    .single();

  if (error || !log) {
    return { ok: false, formError: error?.message ?? 'Could not save decision log.' };
  }
  return { ok: true, id: (log as { id: string }).id };
}
