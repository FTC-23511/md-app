import type { EntryDefinition } from './_types';

/**
 * Test Log (Tier 2, T-08). Captures any test's data and auto-computes its
 * statistics — the tester never types a number summary.
 *
 * A `test_type` choice (pass_fail / single_measure / custom) drives both the
 * compute path (`lib/compute/test-stats.ts`) and the shape of the single
 * `raw-data-table` block via its `modeField` link. The composite raw value is
 * stored in `extras.test_data`; the server write path (`lib/insert-test-log.ts`)
 * computes `extras.computed`, writes a `test_series` rollup row, and records the
 * headline-stat delta vs the most recent prior run of the same `test_label`.
 *
 * Files as a draft (Draft → Complete, Charter §11): the depth fields below are
 * fillable later via the detail page (the `updateEntry` flow lands in 2E). The
 * AI "Analyze this data" fallback is 2G.
 *
 * Spec: docs/phase2/03-test-log.md, docs/phase2/01-schema.md §4.
 */
export const testLogEntry: EntryDefinition = {
  type: 'test_log',
  table: 'test_logs',
  label: 'Test Log',
  description:
    'Log a test and its raw data. Pick how the data is shaped — statistics ' +
    'compute automatically and trend across re-runs of the same test label.',
  defaultEntryState: 'draft',
  fields: [
    {
      type: 'text',
      name: 'test_label',
      label: 'Test label',
      helper:
        'The series key — keep it identical across re-runs so trends stack (e.g. "Intake jam rate").',
      required: true,
      storage: 'column',
      maxLength: 200,
    },
    {
      type: 'date',
      name: 'test_date',
      label: 'Test date',
      required: true,
      storage: 'column',
      defaultValue: 'today',
    },
    {
      type: 'text',
      name: 'robot_version_hw_id',
      label: 'Robot / hardware version',
      helper: 'Optional. Paste the Hardware Change Log entry ID (UUID) this test ran against.',
      required: false,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'choice',
      name: 'test_type',
      label: 'How is your data shaped?',
      helper:
        'Pass/fail: one success-or-fail per trial. Single measure: one number per trial. ' +
        'Custom: define your own columns — the escape hatch for any test.',
      required: true,
      storage: 'column',
      display: 'radio',
      defaultValue: 'pass_fail',
      options: [
        { value: 'pass_fail', label: 'Pass / fail (one outcome per trial)' },
        { value: 'single_measure', label: 'Single measure (one number per trial)' },
        { value: 'custom', label: 'Custom (define your own columns)' },
      ],
    },
    {
      type: 'long-text',
      name: 'hypothesis',
      label: 'Hypothesis',
      helper: 'What you expected to happen, and why.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'field_setup',
      label: 'Field setup',
      helper: 'The physical setup — field elements, robot config, starting conditions.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'method_steps',
      label: 'Method / steps',
      helper: 'How each trial was run, so the test is repeatable.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'raw-data-table',
      name: 'test_data',
      label: 'Raw data',
      helper:
        'Paste rows from a phone or sheet (tab- or comma-separated), or type them in. ' +
        'One trial per row.',
      required: true,
      storage: 'extras',
      mode: 'pass_fail',
      modeField: 'test_type',
      maxRows: 500,
    },
    {
      type: 'computed-readonly',
      name: 'computed',
      label: 'Computed statistics',
      helper: 'Calculated automatically from your data when you save.',
      required: false,
      storage: 'extras',
      shape: 'test-stats',
    },
    {
      type: 'long-text',
      name: 'sample_size_justification',
      label: 'Sample size justification',
      helper: 'Why this N is enough (or an acknowledgement that it is not). Fillable later.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'controlled_variables',
      label: 'Controlled variables',
      helper: 'What you held constant across trials.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'what_failed',
      label: 'What failed',
      helper: 'Failure modes observed, catalogued separately from the headline stat.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'repeatability_check',
      label: 'Repeatability check',
      helper: 'Evidence the result repeats (re-runs, independent setup, etc.).',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'interpretation',
      label: 'Interpretation',
      helper: 'What the data means for the robot / strategy.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'action_taken',
      label: 'Action taken',
      helper: 'What you changed or decided as a result.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
  ],
};

// Used by the list view to format a one-line headline per row.
export function listSummary(row: Record<string, unknown>): string {
  const date = String(row.test_date ?? '');
  const label = row.test_label ? String(row.test_label) : '';
  const extras = (row.extras ?? {}) as Record<string, unknown>;
  const headline = extras.headline as { label?: string; stat?: number } | undefined;
  const stat =
    headline && typeof headline.stat === 'number'
      ? ` — ${headline.label ?? 'result'}: ${headline.stat}`
      : '';
  const head = label || 'Test';
  return `${head}${stat}${date ? ` (${date})` : ''}`.slice(0, 100);
}
