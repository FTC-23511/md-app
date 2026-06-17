import type { EntryDefinition } from './_types';

/**
 * Hardware Change Log (Tier 2, T-06 / SOP-06). A versioned hardware change:
 * what changed on a subsystem, why, the version bump, and the measured deltas.
 *
 * Single-table write to `hw_change_logs` via the generic `insertEntry` pipeline.
 * Photos (v(n-1) / v(n) / in-context / hero) attach via `media_links` in 2F, not
 * here. The "fill in measured deltas later" outcome update lands in 2E.
 *
 * Spec: docs/phase2/01-schema.md §2, docs/phase2/02-forms-and-detail.md §5.
 */
export const hardwareChangeLogEntry: EntryDefinition = {
  type: 'hw_change_log',
  table: 'hw_change_logs',
  label: 'Hardware Change Log',
  description:
    'A versioned hardware change — what changed on a subsystem, why, the ' +
    'version bump, and measured deltas. File within 24 hours.',
  fields: [
    {
      type: 'single-select',
      name: 'subsystem_option_id',
      label: 'Subsystem',
      helper: 'Which subsystem this change is on.',
      category: 'subsystem',
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
      type: 'number',
      name: 'version',
      label: 'Version',
      helper: 'The new version number for this subsystem after the change.',
      required: true,
      storage: 'column',
      min: 0,
    },
    {
      type: 'number',
      name: 'replaces_version',
      label: 'Replaces version',
      helper: 'The previous version this change supersedes, if any.',
      required: false,
      storage: 'column',
      min: 0,
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
      helper: 'The concrete change made to the hardware.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'why',
      label: 'Why',
      helper: 'The problem this change solves or the goal it serves.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'repeating-rows',
      name: 'deltas',
      label: 'Measured deltas',
      helper:
        'Metric-by-metric before/after. Add a row per metric; fill measured values later if not yet known.',
      required: false,
      storage: 'extras',
      addLabel: 'Add delta',
      maxRows: 20,
      columns: [
        { name: 'metric', label: 'Metric' },
        { name: 'was', label: 'Was' },
        { name: 'now', label: 'Now' },
      ],
    },
    {
      type: 'long-text',
      name: 'tradeoffs',
      label: 'Tradeoffs',
      helper: 'What this change costs — weight, complexity, reliability, etc.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'media-links',
      name: 'photos',
      label: 'Photos',
      helper:
        'Before (v(n-1)), after (v(n)), in-context, or a hero shot. Paste a link or upload a file — uploads and loose links are saved to the team Drive automatically; YouTube/Vimeo stay native.',
      required: false,
      storage: 'extras',
      maxRows: 8,
      maxUploadMb: 4,
      roles: [
        { value: 'prev_version', label: 'Previous version' },
        { value: 'new_version', label: 'New version' },
        { value: 'in_context', label: 'In context' },
        { value: 'hero', label: 'Hero shot' },
      ],
    },
  ],
};

// Used by the list view to format a one-line headline per row.
export function listSummary(row: Record<string, unknown>): string {
  const extras = (row.extras ?? {}) as Record<string, unknown>;
  const date = String(row.change_date ?? '');
  const version = row.version != null ? `v${row.version}` : '';
  const what = String(extras.what_changed ?? '');
  const head = [version, what].filter(Boolean).join(' — ');
  return (head ? `${date} — ${head}` : `Hardware change on ${date}`).slice(0, 100);
}
