import type { EntryDefinition } from './_types';

/**
 * Contact Log (Tier 2, SOP-09). One interaction with an external contact
 * (mentor, sponsor, partner). The person lives in a separate `contacts` table
 * for privacy; the log references it via `contact_id`.
 *
 * Two-table write: the contact-identity fields below are routed to `contacts`,
 * the rest to `contact_logs`, by `lib/insert-contact-log.ts`. Phase 2 batch 2B
 * fallback (b): always create a new contact inline. Selecting / de-duping an
 * existing contact is deferred (no contacts-table select block yet).
 *
 * Spec: docs/phase2/01-schema.md §1, docs/phase2/02-forms-and-detail.md §5.
 */

/**
 * Field names whose values belong to the `contacts` row rather than the
 * `contact_logs` row. Consumed by the insert action (write split) and the
 * detail loader (read merge) — keep the two in sync via this single list.
 */
export const CONTACT_FIELD_NAMES = [
  'display_name',
  'role_org',
  'relationship_type_option_id',
  'relationship_status_option_id',
  'contact_info',
  'how_we_connected',
] as const;

export const contactLogEntry: EntryDefinition = {
  type: 'contact_log',
  table: 'contact_logs',
  label: 'Contact Log',
  description:
    'One interaction with an external contact — mentor, sponsor, partner. ' +
    'The person’s identity and contact info are stored separately (SOP-09). ' +
    'File within 24 hours.',
  fields: [
    // ---- The contact (written to `contacts`) ----
    {
      type: 'text',
      name: 'display_name',
      label: 'Contact name',
      helper: 'Who you interacted with. Creates a new contact record.',
      required: true,
      storage: 'column',
      maxLength: 200,
    },
    {
      type: 'text',
      name: 'role_org',
      label: 'Role / organization',
      helper: 'e.g. “Lead mentor, Boeing” or “Sponsor, Local Robotics Co.”',
      required: false,
      storage: 'column',
      maxLength: 200,
    },
    {
      type: 'single-select',
      name: 'relationship_type_option_id',
      label: 'Relationship type',
      category: 'relationship_type',
      allowAddNew: true,
      required: false,
      storage: 'column',
      display: 'dropdown',
    },
    {
      type: 'single-select',
      name: 'relationship_status_option_id',
      label: 'Relationship status',
      category: 'relationship_status',
      allowAddNew: true,
      required: false,
      storage: 'column',
      display: 'dropdown',
    },
    {
      type: 'text',
      name: 'contact_info',
      label: 'Contact info',
      helper: 'Email / phone / handle. Stored privately; not shown in general reads.',
      required: false,
      storage: 'extras',
      maxLength: 300,
    },
    {
      type: 'long-text',
      name: 'how_we_connected',
      label: 'How we connected',
      helper: 'Brief context on how this relationship started.',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    // ---- The interaction (written to `contact_logs`) ----
    {
      type: 'date',
      name: 'contact_date',
      label: 'Contact date',
      required: true,
      storage: 'column',
      defaultValue: 'today',
    },
    {
      type: 'text',
      name: 'contact_method',
      label: 'Contact method',
      helper: 'e.g. email, call, in person, Discord.',
      required: false,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'text',
      name: 'topic',
      label: 'Topic',
      helper: 'What the interaction was about.',
      required: false,
      storage: 'extras',
      maxLength: 300,
    },
    {
      type: 'long-text',
      name: 'outcomes_commitments',
      label: 'Outcomes / commitments',
      helper: 'What was agreed or decided.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'follow_up_next_action',
      label: 'Follow-up: next action',
      required: false,
      storage: 'extras',
      maxLength: 1000,
      rows: 2,
    },
    {
      type: 'date',
      name: 'follow_up_date',
      label: 'Follow-up date',
      helper: 'When to circle back. May be in the future.',
      required: false,
      storage: 'extras',
      // Follow-ups are future-dated, so lift the default "no future dates" cap.
      maxDate: '2100-12-31',
    },
  ],
};

// Used by the list view to format a one-line headline per row.
export function listSummary(row: Record<string, unknown>): string {
  const extras = (row.extras ?? {}) as Record<string, unknown>;
  const date = String(row.contact_date ?? '');
  const topic = String(extras.topic ?? '');
  return (topic ? `${date} — ${topic}` : `Contact on ${date}`).slice(0, 100);
}
