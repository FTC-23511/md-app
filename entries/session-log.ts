import type { EntryDefinition } from './_types';

export const sessionLogEntry: EntryDefinition = {
  type: 'session_log',
  table: 'session_logs',
  label: 'Session Log',
  description:
    'End of any working session — build, code, design, planning, training, summer activity. ' +
    'File within 24 hours; aim for same-day. Time budget: 5 minutes.',
  fields: [
    {
      type: 'date',
      name: 'session_date',
      label: 'Date',
      required: true,
      storage: 'column',
      defaultValue: 'today',
    },
    {
      type: 'text',
      name: 'session_lead',
      label: 'Session lead',
      helper: 'Name of the person filing this session log.',
      required: true,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'multi-select',
      name: 'subsystems',
      label: 'Subsystem(s) worked on',
      category: 'subsystem',
      allowAddNew: true,
      required: false,
      storage: 'extras',
    },
    {
      type: 'number',
      name: 'duration_hours',
      label: 'Duration',
      helper: 'In hours. Decimals OK.',
      unit: 'hours',
      decimals: true,
      step: 0.25,
      min: 0,
      max: 24,
      required: false,
      storage: 'column',
    },
    {
      type: 'long-text',
      name: 'what_worked_on',
      label: 'What did we work on today?',
      helper: '1–3 sentences.',
      required: true,
      storage: 'column',
      maxLength: 1000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'what_worked',
      label: 'What worked?',
      helper: '1–3 sentences.',
      required: false,
      storage: 'column',
      maxLength: 1000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'what_didnt_work',
      label: 'What didn’t work?',
      helper: '1–3 sentences.',
      required: false,
      storage: 'column',
      maxLength: 1000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'numbers_measured',
      label: 'Numbers measured today (if any)',
      helper: 'Free text. Quick capture; specifics go in a Test Log if substantial.',
      required: false,
      storage: 'extras',
      maxLength: 500,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'whats_next',
      label: 'What’s next session?',
      helper: '1–2 sentences.',
      required: false,
      storage: 'column',
      maxLength: 500,
      rows: 2,
    },
    {
      type: 'person-attribution',
      name: 'contributions',
      label: 'Per-person contributions',
      helper: 'One line per person — who did what.',
      required: false,
      storage: 'extras',
      minRows: 0,
      maxRows: 30,
    },
    {
      type: 'specialty-triggers',
      name: 'specialty_entries',
      label: 'Specialty entries triggered',
      helper:
        'Check any Tier 2 entries that should result from this session. ' +
        'You name the owner; the owner files the actual entry within 24h.',
      storage: 'extras',
    },
  ],
};

// Used by the list view (item 16) to format a one-line headline per row.
export function listSummary(row: Record<string, unknown>): string {
  const lead = String(row.session_lead ?? 'Unknown');
  const what = String(row.what_worked_on ?? '');
  return `${lead}: ${what}`.slice(0, 100);
}

// Body-mapping export for the fallback importer (used by the Fallback brief).
// Maps fallback-template markdown headers → entry-definition field names.
export const sessionLogBodyMapping: Record<string, string> = {
  'what did we work on today?': 'what_worked_on',
  'what worked?': 'what_worked',
  "what didn't work?": 'what_didnt_work',
  'numbers measured today': 'numbers_measured',
  "what's next session?": 'whats_next',
  'per-person contributions': 'contributions',
  'specialty entries triggered': 'specialty_entries',
};
