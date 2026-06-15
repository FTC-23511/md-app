/**
 * Entry types that support the generic edit flow (single-table, no server-side
 * recompute on save). The other types are intentionally excluded:
 *   - decision_log: has its own Complete / Add-outcome flows + depth recompute.
 *   - test_log: a save recomputes stats AND writes a test_series rollup row;
 *     a naive re-save would duplicate that rollup. Needs a compute-aware edit.
 *   - contact_log: a two-table write (contacts + contact_logs). Needs bespoke
 *     edit handling.
 * These three are a follow-up (own brief). Keeping the generic edit limited to
 * the safe set avoids silently corrupting computed/related data.
 */
export const GENERIC_EDITABLE_TYPES: ReadonlySet<string> = new Set([
  'session_log',
  'outreach_log',
  'meeting_notes',
  'hw_change_log',
  'sw_change_log',
  'comp_recap',
]);

export function isGenericEditable(type: string): boolean {
  return GENERIC_EDITABLE_TYPES.has(type);
}
