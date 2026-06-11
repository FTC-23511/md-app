/**
 * The two `updateEntry` callers for the Decision Log (2E item 8; brief
 * docs/briefs/2026-06-04-2e-decision-log.md, charter SOP-05):
 *
 *  - `completeDecisionLog` — the "Complete this entry" flow. Re-submits the
 *    full form (pre-filled by the page), recomputes the depth statistics
 *    server-side, enforces the required-for-complete set (brief Q3: the
 *    always-required initial set, via the schema, plus any checked depth
 *    section non-empty), and flips `entry_state` to 'complete'.
 *
 *  - `addDecisionOutcome` — the "Add outcome" mini-form. Updates only the
 *    SOP-05 outcome-later trio (`actual_outcome` / `delta` / `learned`)
 *    through a partial definition; every other stored key survives untouched.
 *
 * Both run through `lib/update-entry.ts` — the single edit chokepoint where
 * Phase 3 attaches the 24h lock.
 */

import { decisionLogEntry } from '@/entries/decision-log';
import { finalizeDecisionDepth } from '@/lib/insert-decision-log';
import { updateEntry, type UpdateResult } from '@/lib/update-entry';
import { parseFormDataWithDefinition } from '@/lib/validate-entry';
import type { EntryDefinition } from '@/entries/_types';

/**
 * Editable surface of the "Add outcome" mini-form — the SOP-05 outcome-later
 * trio only. Same table/type as the full definition so `updateEntry` hits the
 * same row; fields outside this set are untouched by the update.
 */
export const decisionOutcomeDefinition: EntryDefinition = {
  type: 'decision_log',
  table: 'decision_logs',
  label: 'Add outcome',
  description:
    'Fill in once the decision has been tested — the delta against the ' +
    'prediction is what makes the log credible engineering evidence.',
  fields: [
    {
      type: 'long-text',
      name: 'actual_outcome',
      label: 'Actual outcome',
      helper: 'What actually happened, once tested.',
      required: true,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'delta',
      label: 'Delta from prediction',
      helper: 'How the actual outcome differed from the predicted one.',
      required: true,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'learned',
      label: 'What we learned',
      helper: 'The takeaway for future decisions.',
      required: true,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
  ],
};

const DEPTH_LABELS: Array<{ trigger: string; content: string; label: string }> = [
  { trigger: 'trigger_matrix', content: 'matrix', label: 'Weighted trade-off matrix' },
  {
    trigger: 'trigger_first_principles',
    content: 'first_principles',
    label: 'First-principles math',
  },
  { trigger: 'trigger_sensitivity', content: 'sensitivity', label: 'Sensitivity analysis' },
  { trigger: 'trigger_fmea', content: 'fmea', label: 'FMEA' },
];

export async function completeDecisionLog(id: string, formData: FormData): Promise<UpdateResult> {
  const definition = decisionLogEntry;

  // Recompute depth statistics from the submitted values, exactly as the
  // insert path does (updateEntry re-validates; this parse only feeds compute
  // and the completeness check).
  const parsed = parseFormDataWithDefinition(definition, formData);
  const extrasValues: Record<string, unknown> = {};
  for (const field of definition.fields) {
    if (field.storage !== 'column' && parsed[field.name] !== undefined) {
      extrasValues[field.name] = parsed[field.name];
    }
  }
  finalizeDecisionDepth(extrasValues);

  // Required-for-complete (brief Q3): any checked depth section must be
  // non-empty before the draft → complete flip. finalizeDecisionDepth already
  // dropped empty shells, so "missing after finalize" is the test.
  const missing = DEPTH_LABELS.filter(
    (s) => extrasValues[s.trigger] === true && extrasValues[s.content] === undefined,
  ).map((s) => s.label);
  if (missing.length > 0) {
    return {
      ok: false,
      formError: `Checked depth sections must be filled before completing: ${missing.join(', ')}.`,
    };
  }

  // Computed stats win over stored values; dropped shells are cleared so an
  // untriggered section's empty matrix/rows never land in extras.
  const computedExtras: Record<string, unknown> = {};
  const clearExtras: string[] = [];
  for (const key of ['computed_matrix', 'computed_fmea', 'matrix', 'fmea'] as const) {
    if (extrasValues[key] !== undefined) computedExtras[key] = extrasValues[key];
    else clearExtras.push(key);
  }

  return updateEntry(definition, id, formData, {
    entryState: 'complete',
    computedExtras,
    clearExtras,
  });
}

export async function addDecisionOutcome(id: string, formData: FormData): Promise<UpdateResult> {
  return updateEntry(decisionOutcomeDefinition, id, formData);
}
