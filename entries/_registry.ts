import { sessionLogEntry } from './session-log';
import { outreachLogEntry } from './outreach-log';
import { meetingNotesEntry } from './meeting-notes';
import { contactLogEntry } from './contact-log';
import { hardwareChangeLogEntry } from './hardware-change-log';
import { softwareChangeLogEntry } from './software-change-log';
import type { EntryDefinition } from './_types';

/**
 * Every registered entry type. The list view (item 16) enumerates this so
 * adding a Phase 2 entry type only requires creating the definition file +
 * importing it here.
 */
export const ENTRY_REGISTRY: Record<string, EntryDefinition> = {
  session_log: sessionLogEntry,
  outreach_log: outreachLogEntry,
  meeting_notes: meetingNotesEntry,
  contact_log: contactLogEntry,
  hw_change_log: hardwareChangeLogEntry,
  sw_change_log: softwareChangeLogEntry,
};

export const ENTRY_LIST: EntryDefinition[] = Object.values(ENTRY_REGISTRY);
