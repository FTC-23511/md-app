/**
 * Session Log (T-01) — Zod schemas.
 *
 * One schema serves three roles:
 *   1. Form validation (client) via react-hook-form's zodResolver
 *   2. Server-action input validation (server)
 *   3. TypeScript type derivation (`z.infer<typeof X>`)
 *
 * Pattern: every entry type gets two schemas — Insert (creating a new entry)
 * and Update (editing). Both are derived from a single Base schema where
 * possible to avoid drift.
 */

import { z } from 'zod';

// --- shared field-level validators ------------------------------------------
const nonEmpty = z.string().trim().min(1, 'Required');
const optionalText = z.string().trim().optional();

// --- the schema -------------------------------------------------------------

export const sessionLogBase = z.object({
  // Shared entry-level fields
  title: nonEmpty.max(200, 'Keep titles under 200 characters'),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  subsystem_id: z.string().uuid().nullable().optional(),

  // Session-log-specific fields
  duration_hours: z
    .number()
    .nonnegative('Hours must be zero or positive')
    .max(24, "A single session can't be longer than 24 hours"),
  what_did_we_work_on: optionalText,
  what_worked: optionalText,
  what_did_not_work: optionalText,
  numbers_measured: optionalText,
  next_session: optionalText,
  voice_memo_url: z.string().url().optional().or(z.literal('')),
});

export const sessionLogInsert = sessionLogBase;
export const sessionLogUpdate = sessionLogBase.partial().extend({
  // When editing, an edit_reason is required if the entry is >24h old. The
  // server action validates the age and conditionally requires this field —
  // it can't be expressed cleanly in zod alone.
  edit_reason: z.string().trim().min(1).optional(),
});

export type SessionLogInsert = z.infer<typeof sessionLogInsert>;
export type SessionLogUpdate = z.infer<typeof sessionLogUpdate>;
