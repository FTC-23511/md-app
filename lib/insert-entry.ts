/**
 * Generic insert helper. Walks an EntryDefinition, splits parsed values into
 * typed-column fields vs `extras` JSONB fields based on each block's
 * `storage` setting, attaches common columns, and inserts.
 *
 * Spec: docs/phase1/03-forms.md §17.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { EntryDefinition } from '@/entries/_types';
import {
  buildZodSchemaFromDefinition,
  flattenZodErrors,
  parseFormDataWithDefinition,
} from '@/lib/validate-entry';

export type InsertResult =
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

export async function insertEntry(
  definition: EntryDefinition,
  formData: FormData,
): Promise<InsertResult> {
  // 1. Parse FormData into the shape the schema expects.
  const parsed = parseFormDataWithDefinition(definition, formData);

  // 2. Validate.
  const schema = buildZodSchemaFromDefinition(definition);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, fieldErrors: flattenZodErrors(result.error) };
  }

  // 3. Split into column values and extras values.
  const columnValues: Record<string, unknown> = {};
  const extrasValues: Record<string, unknown> = {};
  for (const field of definition.fields) {
    const value = (result.data as Record<string, unknown>)[field.name];
    if (value === undefined) continue;
    if (field.storage === 'column') {
      columnValues[field.name] = value;
    } else {
      extrasValues[field.name] = value;
    }
  }

  // 4. Common columns + auth check.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, formError: 'Not authenticated.' };

  const row = {
    ...columnValues,
    extras: extrasValues,
    created_by: user.id,
    created_via: 'app',
    entry_state: definition.defaultEntryState ?? 'complete',
  };

  // 5. Insert.
  const { data, error } = await supabase.from(definition.table).insert(row).select('id').single();

  if (error) {
    return { ok: false, formError: error.message };
  }
  return { ok: true, id: (data as { id: string }).id };
}
