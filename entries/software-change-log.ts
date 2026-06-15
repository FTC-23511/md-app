import type { EntryDefinition } from './_types';

/**
 * Software Change Log — baseline (Tier 2, T-07 / SOP-07). A behavior-changing
 * software commit: what changed, why, the commit/branch, and the "always
 * required" baseline fields the committing programmer fills within 24h.
 *
 * Single-table write to `sw_change_logs` via the generic `insertEntry` pipeline.
 * Files in `entry_state='draft'` (Draft → Complete model, Charter §11): the
 * baseline lands now, the AI-prompted deep-dive (`ai_deep_dive`, `transcript_url`,
 * `prompt_version`) is explicitly out of scope here — it arrives in 2G with the
 * SCL AI integration. Git-commit auto-stubbing is also 2G.
 *
 * Spec: docs/phase2/01-schema.md §3, docs/phase2/02-forms-and-detail.md §5,
 * Charter SOP-07 "Required content (always)".
 */
export const softwareChangeLogEntry: EntryDefinition = {
  type: 'sw_change_log',
  table: 'sw_change_logs',
  label: 'Software Change Log',
  description:
    'A behavior-changing software commit — what changed, why, the commit/branch, ' +
    'and the baseline fields. Files as a draft; the AI deep-dive comes later.',
  defaultEntryState: 'draft',
  fields: [
    {
      type: 'single-select',
      name: 'change_type_option_id',
      label: 'Type of change',
      helper:
        'Control theory, sensor/fusion, state machine, algorithm, behavior bug fix, refactor, etc.',
      category: 'change_type',
      allowAddNew: true,
      required: false,
      storage: 'column',
      display: 'dropdown',
    },
    {
      type: 'date',
      name: 'change_date',
      label: 'Change date',
      required: true,
      storage: 'column',
      defaultValue: 'today',
    },
    {
      type: 'text',
      name: 'commit_hash',
      label: 'Commit hash (range end / tip)',
      helper:
        'The tip commit SHA this change landed in. When a change spans several commits, this is the last one.',
      required: false,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'text',
      name: 'commit_range_from',
      label: 'Commit range start',
      helper:
        'Optional. The FIRST commit SHA of the range, when the change spans multiple commits (AI coding often does). The entry then documents commit_range_from..commit_hash.',
      required: false,
      storage: 'extras',
      maxLength: 100,
    },
    {
      type: 'text',
      name: 'branch',
      label: 'Branch',
      helper: 'The branch the commit is on.',
      required: false,
      storage: 'column',
      maxLength: 200,
    },
    {
      type: 'text',
      name: 'parent_decision_id',
      label: 'Parent decision ID',
      helper: 'Optional. Paste the Decision Log entry ID (UUID) this change implements.',
      required: false,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'long-text',
      name: 'what_changed',
      label: 'What changed',
      helper: 'Plain English, no code — 2–4 sentences on the concrete change.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'why',
      label: 'Why',
      helper:
        'Why we changed it — 1–2 sentences. Link a Decision Log via the field above if applicable.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'hardware_sensors',
      label: 'Hardware / sensors involved',
      helper: 'Which hardware or sensors this change touches.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'game_challenge',
      label: 'Game challenge addressed',
      helper: 'The on-field problem or task this change targets.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'before_behavior',
      label: 'Before behavior',
      helper: 'Measurable behavior before the change.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'after_behavior',
      label: 'After behavior',
      helper: 'Measurable behavior after the change.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'failure_modes',
      label: 'Known failure modes / edge cases',
      helper: 'Where this is known to break or behave unexpectedly.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'verification',
      label: 'Verification',
      helper:
        'Reference a unit test that covers this change, OR explain why unit testing is not feasible plus the integration-test approach used.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'repeating-rows',
      name: 'files_changed',
      label: 'Files changed',
      helper: 'Key files this change touches. Add a row per file.',
      required: false,
      storage: 'extras',
      addLabel: 'Add file',
      maxRows: 50,
      columns: [{ name: 'path', label: 'File path' }],
    },
  ],
};

/**
 * Header → field-name map for the fallback importer (docs/phase1/05-fallback.md
 * §5.3). Only body-section fields appear here; frontmatter fields (change_type,
 * change_date, commit_hash, commit_range_from, branch, parent_decision_id) are
 * resolved by name. Keys are matched case-insensitively / whitespace-normalised.
 *
 * This is what lets the `/scl` Claude Code skill's output file (and a hand-filled
 * template) import into `sw_change_logs` through the existing importer — the 2G
 * ingestion path with no new write code. Spec: docs/phase2/05-scl-ai.md.
 */
export const softwareChangeLogBodyMapping: Record<string, string> = {
  'what changed': 'what_changed',
  why: 'why',
  'hardware / sensors involved': 'hardware_sensors',
  'game challenge addressed': 'game_challenge',
  'before behavior': 'before_behavior',
  'after behavior': 'after_behavior',
  'known failure modes / edge cases': 'failure_modes',
  verification: 'verification',
  'files changed': 'files_changed',
};

// Used by the list view to format a one-line headline per row.
export function listSummary(row: Record<string, unknown>): string {
  const extras = (row.extras ?? {}) as Record<string, unknown>;
  const date = String(row.change_date ?? '');
  const branch = row.branch ? String(row.branch) : '';
  const what = String(extras.what_changed ?? '');
  const head = [branch, what].filter(Boolean).join(' — ');
  return (head ? `${date} — ${head}` : `Software change on ${date}`).slice(0, 100);
}
