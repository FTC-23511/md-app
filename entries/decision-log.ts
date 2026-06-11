import type { EntryDefinition } from './_types';

/**
 * Decision Log (Tier 2, SOP-05). The most complex entry: a fast 5-minute
 * initial entry (always-required fields only) plus four optional depth
 * sections, each gated by its own self-applied trigger checkbox per the
 * charter's objective trigger criteria. Checking a trigger reveals its
 * section via `visibleWhen: {field, truthy: true}`; hidden sections are
 * dropped from submit, so a Decision Log with zero triggers checked is a
 * valid draft.
 *
 * Filed at the moment of decision with a *predicted* outcome (Charter
 * critical rule). The actual outcome (`actual_outcome` / `delta` / `learned`)
 * is deliberately NOT on this form — it's filled in later via the detail
 * page's "Add outcome" mini-form once the decision is tested.
 *
 * The matrix weighted totals + FMEA RPNs are never typed: the write path
 * (`lib/insert-decision-log.ts`) computes them via `lib/compute/` and stores
 * `extras.computed_matrix` / `extras.computed_fmea`, surfaced by the paired
 * `computed-readonly` blocks.
 *
 * Spec: docs/phase2/02-forms-and-detail.md §§1–2, docs/phase2/01-schema.md §5,
 * charter SOP-05.
 */
export const decisionLogEntry: EntryDefinition = {
  type: 'decision_log',
  table: 'decision_logs',
  label: 'Decision Log',
  description:
    'File at the moment of decision, with a predicted outcome. Check a depth ' +
    'trigger only if its objective criterion fires — depth sections can be ' +
    'filled now or within 7 days via the detail page.',
  defaultEntryState: 'draft',
  fields: [
    {
      type: 'single-select',
      name: 'subsystem_option_id',
      label: 'Subsystem',
      required: true,
      storage: 'column',
      category: 'subsystem',
    },
    {
      type: 'date',
      name: 'decision_date',
      label: 'Decision date',
      required: true,
      storage: 'column',
      defaultValue: 'today',
    },
    {
      type: 'choice',
      name: 'parent_entry_type',
      label: 'Flagged from',
      helper: 'Optional. Where this decision was flagged from.',
      required: false,
      storage: 'column',
      display: 'dropdown',
      options: [
        { value: 'session_log', label: 'Session Log' },
        { value: 'meeting_notes', label: 'Meeting Notes' },
      ],
    },
    {
      type: 'text',
      name: 'parent_entry_id',
      label: 'Parent entry ID',
      helper: 'Optional. Paste the entry ID (UUID) of the Session Log / Meeting Notes above.',
      required: false,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'long-text',
      name: 'problem_statement',
      label: 'Problem statement',
      helper: 'What needed deciding, and why now.',
      required: true,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'constraints',
      label: 'Constraints',
      helper: 'Hard limits the choice had to respect — size, budget, rules, time.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'alternatives',
      name: 'alternatives',
      label: 'Alternatives considered',
      helper:
        'At least 3 substantive alternatives, with brief pros, cons, and predicted performance.',
      required: true,
      storage: 'extras',
      minRows: 3,
    },
    {
      type: 'long-text',
      name: 'paths_not_taken',
      label: 'Paths not taken',
      helper:
        'Directions considered and excluded before any matrix, with rationale. Always required.',
      required: true,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'decision',
      label: 'Decision',
      helper: 'The alternative chosen.',
      required: true,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'rationale',
      label: 'Rationale',
      helper: 'Why this alternative won.',
      required: true,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'predicted_outcome',
      label: 'Predicted outcome',
      helper: 'A specific, testable claim — the actual outcome gets filled in after testing.',
      required: true,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },

    // ---- Depth: weighted trade-off matrix ---------------------------------
    {
      type: 'checkbox',
      name: 'trigger_matrix',
      label: 'Weighted trade-off matrix required',
      helper:
        '3+ substantive alternatives are considered AND being wrong about the choice would ' +
        'cost more than one build session (~4 hours) of rework.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'section-header',
      name: 'matrix_section',
      label: 'Weighted trade-off matrix',
      helper: 'Criteria × options, scored 1–5. Totals and the winner compute on save.',
      required: false,
      storage: 'extras',
      visibleWhen: { field: 'trigger_matrix', truthy: true },
    },
    {
      type: 'matrix',
      name: 'matrix',
      label: 'Trade-off matrix',
      required: false,
      storage: 'extras',
      visibleWhen: { field: 'trigger_matrix', truthy: true },
    },
    {
      type: 'computed-readonly',
      name: 'computed_matrix',
      label: 'Weighted totals',
      helper: 'Calculated automatically from the matrix when you save.',
      required: false,
      storage: 'extras',
      shape: 'decision-matrix',
      visibleWhen: { field: 'trigger_matrix', truthy: true },
    },

    // ---- Depth: first-principles math -------------------------------------
    {
      type: 'checkbox',
      name: 'trigger_first_principles',
      label: 'First-principles math required',
      helper:
        'The decision rests on torque, force, current, voltage, geometry, or timing — ' +
        'anywhere physics, math, or measurable quantities determine the right answer.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'section-header',
      name: 'first_principles_section',
      label: 'First-principles math',
      required: false,
      storage: 'extras',
      visibleWhen: { field: 'trigger_first_principles', truthy: true },
    },
    {
      type: 'long-text',
      name: 'first_principles',
      label: 'Work and result',
      helper: 'The governing relationship, the numbers in, and the conclusion out.',
      required: false,
      storage: 'extras',
      maxLength: 4000,
      rows: 5,
      visibleWhen: { field: 'trigger_first_principles', truthy: true },
    },

    // ---- Depth: sensitivity analysis ---------------------------------------
    {
      type: 'checkbox',
      name: 'trigger_sensitivity',
      label: 'Sensitivity analysis required',
      helper:
        'Required whenever first-principles math is required (paired) — vary one or more ' +
        'assumptions to test whether the decision still holds.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'section-header',
      name: 'sensitivity_section',
      label: 'Sensitivity analysis',
      required: false,
      storage: 'extras',
      visibleWhen: { field: 'trigger_sensitivity', truthy: true },
    },
    {
      type: 'long-text',
      name: 'sensitivity',
      label: 'Assumptions varied and outcome',
      helper: 'Which assumptions you varied, by how much, and whether the decision held.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
      visibleWhen: { field: 'trigger_sensitivity', truthy: true },
    },

    // ---- Depth: FMEA --------------------------------------------------------
    {
      type: 'checkbox',
      name: 'trigger_fmea',
      label: 'FMEA table required',
      helper:
        'The failure mode of the chosen option could end a match OR pose a safety/injury risk.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'section-header',
      name: 'fmea_section',
      label: 'FMEA',
      helper: 'Failure modes with severity / likelihood / detectability. RPN computes on save.',
      required: false,
      storage: 'extras',
      visibleWhen: { field: 'trigger_fmea', truthy: true },
    },
    {
      type: 'fmea',
      name: 'fmea',
      label: 'Failure modes',
      required: false,
      storage: 'extras',
      visibleWhen: { field: 'trigger_fmea', truthy: true },
    },
    {
      type: 'computed-readonly',
      name: 'computed_fmea',
      label: 'Risk priority numbers',
      helper: 'Calculated automatically from the FMEA rows when you save.',
      required: false,
      storage: 'extras',
      shape: 'fmea',
      visibleWhen: { field: 'trigger_fmea', truthy: true },
    },
  ],
};

// Used by the list view to format a one-line headline per row.
export function listSummary(row: Record<string, unknown>): string {
  const date = String(row.decision_date ?? '');
  const extras = (row.extras ?? {}) as Record<string, unknown>;
  const decision = extras.decision ? String(extras.decision) : '';
  const problem = extras.problem_statement ? String(extras.problem_statement) : '';
  const head = decision || problem || 'Decision';
  return `${head}${date ? ` (${date})` : ''}`.slice(0, 100);
}
