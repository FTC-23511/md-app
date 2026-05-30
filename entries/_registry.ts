import { sessionLogEntry } from './session-log';
import { outreachLogEntry } from './outreach-log';
import type { EntryDefinition } from './_types';

/**
 * Every registered entry type. The list view (item 16) enumerates this so
 * adding a Phase 2 entry type only requires creating the definition file +
 * importing it here.
 */
export const ENTRY_REGISTRY: Record<string, EntryDefinition> = {
  session_log: sessionLogEntry,
  outreach_log: outreachLogEntry,
};

export const ENTRY_LIST: EntryDefinition[] = Object.values(ENTRY_REGISTRY);
