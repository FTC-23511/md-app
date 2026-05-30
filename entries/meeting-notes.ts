import type { EntryDefinition } from './_types';

export const meetingNotesEntry: EntryDefinition = {
  type: 'meeting_notes',
  table: 'meeting_notes',
  label: 'Meeting Notes',
  description:
    'Every formal team meeting — kickoff, all-hands, strategy, retro, planning. ' +
    'File same day; 24-hour hard cap.',
  fields: [
    {
      type: 'single-select',
      name: 'meeting_type_option_id',
      label: 'Meeting type',
      category: 'meeting_type',
      allowAddNew: true,
      required: true,
      storage: 'column',
      display: 'dropdown',
    },
    {
      type: 'date',
      name: 'meeting_date',
      label: 'Meeting date',
      required: true,
      storage: 'column',
      defaultValue: 'today',
    },
    {
      type: 'text',
      name: 'scribe',
      label: 'Scribe (you)',
      helper:
        'Phase 1: type your name. Phase 2 promotes this to scribe_member_id ' +
        '(member picker). Stored in extras for Phase 1.',
      required: true,
      storage: 'extras',
      maxLength: 100,
    },
    {
      type: 'person-attribution',
      name: 'attendees',
      label: 'Attendees',
      helper: 'Names of everyone who attended. Contribution field can be skipped.',
      required: true,
      storage: 'extras',
      contributionLabel: 'Role / focus (optional)',
      minRows: 1,
      maxRows: 50,
    },
    {
      type: 'long-text',
      name: 'agenda_outcomes',
      label: 'Agenda items + outcomes',
      helper:
        'For each agenda item, what was discussed and what was decided. ' +
        'Major decisions also get a Decision Log via the specialty triggers below.',
      required: true,
      storage: 'extras',
      maxLength: 5000,
      rows: 6,
    },
    {
      type: 'long-text',
      name: 'decisions',
      label: 'Decisions made (with links to Decision Logs if applicable)',
      helper: 'Optional summary; Decision Log entries are the canonical record.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 4,
    },
    {
      type: 'action-items',
      name: 'action_items',
      label: 'Action items',
      helper: 'Owner, action, due date. Use this even for small commitments.',
      required: false,
      storage: 'extras',
      minItems: 0,
      maxItems: 50,
    },
    {
      type: 'long-text',
      name: 'open_questions',
      label: 'Open questions / parking lot',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 4,
    },
    {
      type: 'date',
      name: 'next_meeting_date',
      label: 'Next meeting',
      required: false,
      storage: 'column',
    },
    {
      type: 'specialty-triggers',
      name: 'specialty_entries',
      label: 'Specialty entries triggered',
      helper:
        'A meeting that produces a substantive decision should also produce a ' +
        'Decision Log. A new external contact should also produce a Contact Log.',
      storage: 'extras',
    },
  ],
};

export function listSummary(row: Record<string, unknown>): string {
  const extras = (row.extras ?? {}) as Record<string, unknown>;
  const scribe = String(extras.scribe ?? 'Scribe');
  const date = String(row.meeting_date ?? '');
  return `${scribe} — ${date}`.slice(0, 100);
}

export const meetingNotesBodyMapping: Record<string, string> = {
  attendees: 'attendees',
  'agenda items + outcomes': 'agenda_outcomes',
  'decisions made': 'decisions',
  'action items': 'action_items',
  'open questions / parking lot': 'open_questions',
  'specialty entries triggered': 'specialty_entries',
};
