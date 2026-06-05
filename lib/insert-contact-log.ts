/**
 * Two-table insert for the Contact Log. The Phase 1 generic `insertEntry`
 * writes one table; a Contact Log writes two — the `contacts` person record
 * (identity / contact-info segregated for privacy, SOP-09) and the
 * `contact_logs` interaction that references it.
 *
 * Reuses the same parse + validate pipeline as `insertEntry`, then splits the
 * validated values into a contact row and a log row by `CONTACT_FIELD_NAMES`,
 * inserting the contact first to obtain its id for the log's `contact_id` FK.
 *
 * Spec: docs/phase2/01-schema.md §1, docs/phase2/02-forms-and-detail.md §5.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { contactLogEntry, CONTACT_FIELD_NAMES } from '@/entries/contact-log';
import type { InsertResult } from '@/lib/insert-entry';
import {
  buildZodSchemaFromDefinition,
  flattenZodErrors,
  parseFormDataWithDefinition,
} from '@/lib/validate-entry';

const CONTACT_FIELDS = new Set<string>(CONTACT_FIELD_NAMES);

export async function insertContactLog(formData: FormData): Promise<InsertResult> {
  const definition = contactLogEntry;

  // 1. Parse + validate against the full definition (same pipeline as insertEntry).
  const parsed = parseFormDataWithDefinition(definition, formData);
  const schema = buildZodSchemaFromDefinition(definition);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, fieldErrors: flattenZodErrors(result.error) };
  }
  const data = result.data as Record<string, unknown>;

  // 2. Split values into the contact row vs the log row by storage + ownership.
  const contactColumns: Record<string, unknown> = {};
  const contactExtras: Record<string, unknown> = {};
  const logColumns: Record<string, unknown> = {};
  const logExtras: Record<string, unknown> = {};

  for (const field of definition.fields) {
    const value = data[field.name];
    if (value === undefined) continue;
    const onContact = CONTACT_FIELDS.has(field.name);
    const columns = onContact ? contactColumns : logColumns;
    const extras = onContact ? contactExtras : logExtras;
    if (field.storage === 'column') {
      columns[field.name] = value;
    } else {
      extras[field.name] = value;
    }
  }

  // 3. Auth.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, formError: 'Not authenticated.' };

  const common = { created_by: user.id, created_via: 'app' as const };

  // 4. Insert the contact first (need its id for the log's FK).
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert({ ...contactColumns, extras: contactExtras, ...common, entry_state: 'complete' })
    .select('id')
    .single();

  if (contactError || !contact) {
    return { ok: false, formError: contactError?.message ?? 'Could not create contact.' };
  }

  // 5. Insert the log referencing the new contact.
  const { data: log, error: logError } = await supabase
    .from('contact_logs')
    .insert({
      ...logColumns,
      contact_id: (contact as { id: string }).id,
      extras: logExtras,
      ...common,
      entry_state: definition.defaultEntryState ?? 'complete',
    })
    .select('id')
    .single();

  if (logError || !log) {
    return { ok: false, formError: logError?.message ?? 'Could not save contact log.' };
  }
  return { ok: true, id: (log as { id: string }).id };
}
