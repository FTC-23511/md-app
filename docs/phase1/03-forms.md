# Forms

This document specifies the field block system, the generic form renderer, and the three Phase 1 entry definitions (Session Log, Outreach Log, Meeting Notes).

Sections 1–2 establish the type system and renderer behavior. Sections 3–12 define each field block in the Phase 1 library. Sections 13–15 are the three entry definitions.

## 1. The `EntryDefinition` type

An entry definition is a TypeScript value that describes one entry type completely. It is the single source of truth for that entry's form, validation, database insert, and list-view rendering.

```typescript
// src/entries/_types.ts

export type EntryDefinition = {
  /** Machine-readable entry type. Matches the option_lists category style. */
  type: string;
  /** Database table name. */
  table: string;
  /** Human-readable label for navigation, list-view pills, page titles. */
  label: string;
  /** Short description shown above the form. Optional. */
  description?: string;
  /** Ordered list of field blocks that make up this entry. */
  fields: FieldBlock[];
  /**
   * Optional override for entry_state default. Most entries default to
   * 'complete'; Decision Log, Software Change Log, Test Log, and
   * Subsystem Handoff default to 'draft' per Charter Draft→Complete.
   */
  defaultEntryState?: 'draft' | 'complete';
};
```

The `FieldBlock` type is a discriminated union of every block type in the Phase 1 library. Each block variant has a `type` literal discriminator and its own configuration shape.

```typescript
// src/entries/_types.ts (continued)

export type FieldBlock =
  | TextBlock
  | LongTextBlock
  | SingleSelectBlock
  | MultiSelectBlock
  | DateBlock
  | NumberBlock
  | PersonAttributionBlock
  | StoryBlock
  | ActionItemsBlock
  | SpecialtyTriggersBlock;
```

Every block shares a base set of properties:

```typescript
export type BlockBase = {
  /** Field name. For column storage, this is the DB column name. For extras
   *  storage, this is the JSONB key. */
  name: string;
  /** Human-readable label shown above the input. */
  label: string;
  /** Optional helper text shown below the label. */
  helper?: string;
  /** Whether this field is required. Defaults to false. */
  required?: boolean;
  /** Where the value is stored: as a typed column or inside extras. */
  storage: 'column' | 'extras';
  /** Optional visibility condition. See §2.5. */
  visibleWhen?: VisibilityCondition;
};
```

The block-type-specific properties extend `BlockBase` and add type-specific configuration. Each block's full type is defined in its respective section below.

## 2. The renderer

The renderer is one component used by every entry form:

```typescript
// src/components/entry-form/EntryForm.tsx — usage

import { EntryForm } from '@/components/entry-form/EntryForm';
import { sessionLogEntry } from '@/entries/session-log';
import { createEntry } from '@/lib/insert-entry';

export default function NewSessionPage() {
  return <EntryForm definition={sessionLogEntry} action={createEntry} />;
}
```

The renderer walks `definition.fields` and produces the form. It owns:

1. **Layout.** Each field is rendered as a labeled block with helper text and inline errors. Fields render vertically (one per row); Phase 1 is desktop-first so the default layout uses generous width without responsive breakpoints. A future task may add side-by-side layouts via an optional `column` config on field blocks.
2. **State.** Mostly uncontrolled inputs (the browser holds form state). Repeating composite blocks (story-block, action-items, person-attribution, specialty-triggers) maintain their own local React state for dynamic row management.
3. **Validation orchestration.** On submit, gathers form values and posts to the server action. The server action validates with the Zod schema derived from the definition; validation errors come back as `{fieldErrors: {fieldName: errorMessage}}` and the renderer displays each error under its field.
4. **Visibility.** On every render, evaluates each field's `visibleWhen` against the current form values. Hidden fields are not rendered at all (not just `display:none`); their values are excluded from the submit payload.
5. **Option list loading.** Single- and multi-select blocks declare a `category` (matching `option_lists.category`). The server component that wraps the form fetches options for every declared category, passing them as props to the renderer. The renderer passes them to each select block. New options created via the "Add new..." affordance update the prop-passed list and the form's local state in the same round trip.

### 2.1 Submit flow

```
[user clicks submit]
    ↓
[renderer gathers values into FormData]
    ↓
[renderer calls action(formData)]
    ↓
[action runs validateEntry(definition, formData) → Zod schema, parse]
    ↓
[on success: insertEntry(definition, parsedData) → Supabase insert]
    ↓
[on success: redirect('/list')]
[on validation failure: return {ok: false, fieldErrors}]
[on insert failure: return {ok: false, formError}]
    ↓
[renderer shows errors inline or banner]
```

### 2.2 Where each block's value lives

The split between typed columns and JSONB `extras` is captured in `storage` on each block:

- `storage: 'column'` — value goes to the column named in `block.name`.
- `storage: 'extras'` — value goes to `extras[block.name]`.

The insert helper walks the definition once, builds a row object from `'column'` blocks plus an `extras` object from `'extras'` blocks, and inserts in one query.

### 2.3 `column` blocks must reference real columns

Every `storage: 'column'` block must have a `name` that matches a real column on `definition.table`. If you add a new column to an entry's definition, you also need a migration that adds that column. The reverse is not enforced: there can be columns in the table that don't appear in the definition (legacy fields, etc.), but every `'column'` block must point at a real column.

### 2.4 `extras` block names form a flat namespace

Inside the `extras` JSONB blob, every `'extras'` block's `name` is a top-level key. No nested paths in `name` (e.g., `'follow_up.individuals'` is not allowed). For nested structures, use a composite block (story-block, action-items, etc.) that owns its internal shape.

### 2.5 `VisibilityCondition` shape

Visibility conditions are declarative objects, not functions. The renderer interprets them.

```typescript
export type VisibilityCondition =
  | { field: string; equals: unknown }
  | { field: string; truthy: true }
  | { field: string; in: unknown[] }
  | { all: VisibilityCondition[] }
  | { any: VisibilityCondition[] };
```

The renderer evaluates conditions against the current form values. The validator skips hidden fields (no required-field errors on fields the user can't see).

Why declarative (not a function): serializable. The Phase 5+ entry-type UI builder can write these objects to a database row directly. Functions can't be stored that way.

### 2.6 Block-to-Zod mapping

Each block type contributes a Zod schema fragment, assembled by `lib/validate-entry.ts`:

```typescript
// pseudo-code for the validator builder
function buildZodSchemaFromDefinition(def: EntryDefinition) {
  const shape: Record<string, ZodType> = {};
  for (const field of def.fields) {
    shape[field.name] = buildSchemaForBlock(field);
  }
  return z.object(shape);
}
```

Each block's `buildSchemaForBlock` is defined in its block module. Validation rules are described per-block in §§3–12.

## 3. `TextBlock` — single-line text

```typescript
export type TextBlock = BlockBase & {
  type: 'text';
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
};
```

**Renderer.** Renders a `<Input type="text">` (shadcn).
**Validation.** `z.string()`, with `.min(minLength)` if set, `.max(maxLength)` if set. If required, `.min(1)`; if not required, `.optional()`.
**Storage.** Value is a string.

Used for: dates of one person attribution, story person names, contact names, session lead names.

## 4. `LongTextBlock` — multi-line text

```typescript
export type LongTextBlock = BlockBase & {
  type: 'long-text';
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  /** Rows in the textarea. Default: 4. */
  rows?: number;
};
```

**Renderer.** Renders a `<Textarea>` (shadcn).
**Validation.** `z.string()`, same as TextBlock.
**Storage.** Value is a string.

Used for: "what worked today" narratives, decision rationale, story descriptions.

## 5. `SingleSelectBlock` — one choice from `option_lists`

```typescript
export type SingleSelectBlock = BlockBase & {
  type: 'single-select';
  /** option_lists.category — drives which options load. */
  category: OptionCategory;
  /** Whether the user can add a new option via "Add new..." affordance. Default: true. */
  allowAddNew?: boolean;
  /** Display style. 'dropdown' for many options, 'radio' for few. Default: 'dropdown'. */
  display?: 'dropdown' | 'radio';
};

export type OptionCategory =
  | 'event_type'
  | 'engagement_depth'
  | 'follow_up_type'
  | 'our_role'
  | 'meeting_type'
  | 'subsystem'
  | 'relationship_type'
  | 'relationship_status'
  | 'change_type';
```

**Renderer.** Renders a shadcn `<Select>` (dropdown mode) or radio group (radio mode). Options are loaded from `option_lists` filtered by `category`, sorted by `sort_order`. The selected value is the `option_lists.id` UUID. A final "Add new..." item appears at the bottom of the dropdown when `allowAddNew` is true (the Phase 1 default).

**The "Add new..." affordance.** Clicking opens a small inline form (a popover, not a modal) with a single text input ("New option label") and a "Create" button. Submit:
1. Slugifies the label to derive `value`.
2. Posts to a server action that inserts into `option_lists`.
3. If the slug collides with an active row, the server returns the existing row's id and the popover closes with that option selected (no error shown).
4. If insert succeeds, the new option appears in the dropdown, the popover closes, and the new option is selected.

The user does not have to know what a slug is — they type a human label, the server derives the machine value.

**Validation.** `z.string().uuid()`. If required, no `.optional()`; if not, add `.optional().nullable()` (the form may not select anything).

**Storage.** Value is the selected option's UUID. Stored either as a typed column (e.g., `event_type_option_id`) or as a JSONB string.

## 6. `MultiSelectBlock` — zero or more choices from `option_lists`

```typescript
export type MultiSelectBlock = BlockBase & {
  type: 'multi-select';
  category: OptionCategory;
  allowAddNew?: boolean;
  /** Whether to show a free-text "custom note" alongside the checkboxes.
   *  When true, the field's value shape becomes {ids: string[], note: string}. */
  withCustomNote?: boolean;
  /** Optional minimum number of selections. Used for "at least one box OR a note" rules. */
  minSelected?: number;
};
```

**Renderer.** Renders as a checkbox group. When `withCustomNote` is true, an additional `<Textarea>` labeled "Custom note (optional)" appears beneath the checkboxes.

The "Add new..." affordance works the same as `SingleSelectBlock` — clicking opens a popover, the new option appears in the list checked.

**Validation.**
- Without `withCustomNote`: `z.array(z.string().uuid())`. If `minSelected` is set, `.min(minSelected)`.
- With `withCustomNote`: `z.object({ ids: z.array(z.string().uuid()), note: z.string() })`. If `minSelected` is set, the validator additionally requires `ids.length >= minSelected OR note.trim().length > 0` (the "at least one box OR a note" rule from the Outreach Log engagement-depth field). A custom Zod refinement enforces this.

**Storage.**
- Without `withCustomNote`: value is an array of UUIDs. Stored in extras as `[uuid, uuid, ...]`.
- With `withCustomNote`: value is `{ids: [uuid, uuid, ...], note: "..."}`. Stored as a JSONB object in extras.

## 7. `DateBlock` — calendar date

```typescript
export type DateBlock = BlockBase & {
  type: 'date';
  /** Minimum allowed date as ISO string (YYYY-MM-DD). Optional. */
  minDate?: string;
  /** Maximum allowed date. Defaults to today (entries can't be in the future). */
  maxDate?: string;
  /** Default value. 'today' sets it to today's date on page load. */
  defaultValue?: 'today' | string;
};
```

**Renderer.** Renders a shadcn `<Input type="date">` with an attached date picker.
**Validation.** `z.string().date()` (Zod's ISO date validator), with `.refine()` for `minDate`/`maxDate` if set.
**Storage.** Value is an ISO date string `YYYY-MM-DD`. PostgreSQL stores it as a `date` column.

## 8. `NumberBlock` — numeric value

```typescript
export type NumberBlock = BlockBase & {
  type: 'number';
  min?: number;
  max?: number;
  /** Whether decimals are allowed. Default: false (integer). */
  decimals?: boolean;
  /** Step value for the input control. Default: 1 (or 0.01 if decimals). */
  step?: number;
  /** Unit label shown after the input (e.g., "hours", "people"). Optional. */
  unit?: string;
};
```

**Renderer.** Renders a shadcn `<Input type="number">`. If `unit` is set, the unit string appears as a suffix label.
**Validation.** `z.number()` with `.int()` if `decimals` is false, `.min(min)` and `.max(max)` if set.
**Storage.** Value is a number. PostgreSQL stores as `integer` or `numeric` depending on `decimals`.

## 9. `PersonAttributionBlock` — list of `{name, contribution}` rows

A repeating composite for Charter §16 quality bar "per-person contributions named."

```typescript
export type PersonAttributionBlock = BlockBase & {
  type: 'person-attribution';
  /** Minimum number of rows. Default: 0. */
  minRows?: number;
  /** Maximum number of rows. Default: 50. */
  maxRows?: number;
  /** Label for the contribution field. Default: 'Contribution'. */
  contributionLabel?: string;
};
```

**Renderer.** Renders as a list of row groups; each row has a name input and a contribution input. A "+ Add another person" button at the bottom adds a new empty row. Each row has a small "remove" button.

**Validation.**
```typescript
z.array(z.object({
  name: z.string().min(1, 'Name is required'),
  contribution: z.string().min(1, 'Contribution is required')
})).min(minRows).max(maxRows)
```

**Storage.** Value is an array of `{name, contribution}` objects, stored in extras.

## 10. `StoryBlock` — repeating `{person, happened, quote, permission, photo}`

For the Outreach Log's ≥3 stories requirement (Charter T-02).

```typescript
export type StoryBlock = BlockBase & {
  type: 'story-block';
  /** Minimum number of stories. The Outreach Log requires 3. */
  minStories?: number;
  /** Maximum number of stories. Default: 10. */
  maxStories?: number;
};
```

Each story sub-block has the fields per Template T-02:

- `person_name` (text, required) — the person's name
- `person_role_age` (text, optional) — role and age range
- `what_happened` (long-text, required) — 2-4 sentences
- `direct_quote` (long-text, optional) — the quote if any
- `permission` (single-select, required) — `'yes' | 'no' | 'pending'` (NOT an option_lists category — this is a hard-coded enum, since permission states are fixed-by-law-and-policy)
- `photo_url` (text, optional, Phase 2 enables upload UI; Phase 1 accepts a manual URL)

**Renderer.** A vertical stack of story panels. Each panel has the fields above. A "+ Add another story" button at the bottom. Each panel has a "remove" button (disabled if removing would drop below `minStories`).

**Validation.**
```typescript
z.array(z.object({
  person_name: z.string().min(1),
  person_role_age: z.string().optional(),
  what_happened: z.string().min(1),
  direct_quote: z.string().optional(),
  permission: z.enum(['yes', 'no', 'pending']),
  photo_url: z.string().url().optional()
})).min(minStories).max(maxStories)
```

**Storage.** Array of story objects in extras as `stories`.

## 11. `ActionItemsBlock` — repeating `{owner, action, due_date}`

For Meeting Notes action items.

```typescript
export type ActionItemsBlock = BlockBase & {
  type: 'action-items';
  minItems?: number;
  maxItems?: number;
};
```

Each row has:
- `owner` (text, required) — name of the person owning the action
- `action` (long-text, required) — what they're doing
- `due_date` (date, optional) — when it's due

**Renderer.** A list of rows like person-attribution. "+ Add another action item" at the bottom.

**Validation.**
```typescript
z.array(z.object({
  owner: z.string().min(1),
  action: z.string().min(1),
  due_date: z.string().date().optional()
})).min(minItems).max(maxItems)
```

**Storage.** Array in extras as `action_items`.

## 12. `SpecialtyTriggersBlock` — the universal Tier 1 → Tier 2 flagging UI

The bottom-of-every-Tier-1-form flagging block per Charter §11.

```typescript
export type SpecialtyTriggersBlock = BlockBase & {
  type: 'specialty-triggers';
};
```

No additional configuration — the shape is fixed by Charter §11.

**Renderer.** A list of checkbox rows, one per Tier 2 entry type:

```
☐ Decision Log
    Owner: [_______]    Subject: [_____________________]
☐ Hardware Change Log
    Owner: [_______]    Subject: [_____________________]
☐ Software Change Log
    Owner: [_______]    Subject: [_____________________]
☐ Test Log
    Owner: [_______]    Subject: [_____________________]
☐ Contact Log
    Owner: [_______]    Subject: [_____________________]
```

When a checkbox is checked, the row's Owner and Subject inputs become required. Unchecking clears them.

**Validation.**
```typescript
z.array(z.object({
  target_type: z.enum(['decision_log', 'hw_change_log', 'sw_change_log',
                       'test_log', 'contact_log']),
  owner_member_id: z.string().uuid().optional().nullable(),  // resolved from typed name in Phase 2+
  owner_text: z.string().min(1, 'Owner is required'),         // free-text Phase 1; resolved to member_id later
  subject: z.string().min(1, 'Subject is required')
}))
```

**Storage.** Value is an array of trigger objects, stored in extras as `specialty_entries`. The form does **not** create rows in the `flags` table at submit time — that happens in Phase 2 when the flag-tracking UI lands. For Phase 1, the data is preserved in extras and a Phase 2 backfill creates flags rows from existing extras.

**Phase 1 / Phase 2 split.** In Phase 1, the owner is free-text. In Phase 2, the owner field becomes a member-picker (autocomplete against `members.display_name`). The same block type covers both — the renderer's owner input swaps from text to member-picker based on whether the members table has multiple rows (in Phase 1, just one member; the text field is the right UX). No new block type needed.

## 13. Session Log entry definition

```typescript
// src/entries/session-log.ts

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
```

## 14. Outreach Log entry definition

```typescript
// src/entries/outreach-log.ts

import type { EntryDefinition } from './_types';

export const outreachLogEntry: EntryDefinition = {
  type: 'outreach_log',
  table: 'outreach_logs',
  label: 'Outreach Log',
  description:
    'Every outreach event — demo, classroom visit, FLL coaching, community fair. ' +
    'Outreach Reporter does not run the demo; their job is to count, photograph, ' +
    'and capture stories. File within 24 hours.',
  fields: [
    {
      type: 'text',
      name: 'event_name',
      label: 'Event name',
      required: true,
      storage: 'column',
      maxLength: 200,
    },
    {
      type: 'date',
      name: 'event_date',
      label: 'Event date',
      required: true,
      storage: 'column',
      defaultValue: 'today',
    },
    {
      type: 'text',
      name: 'location_city',
      label: 'City',
      required: false,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'text',
      name: 'location_state',
      label: 'State / region',
      required: false,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'text',
      name: 'host_org',
      label: 'Host organization',
      required: false,
      storage: 'column',
      maxLength: 200,
    },
    {
      type: 'single-select',
      name: 'our_role_option_id',
      label: 'Our team’s role',
      category: 'our_role',
      allowAddNew: true,
      required: false,
      storage: 'column',
    },
    {
      type: 'single-select',
      name: 'event_type_option_id',
      label: 'Event type',
      category: 'event_type',
      allowAddNew: true,
      required: true,
      storage: 'column',
    },
    {
      type: 'text',
      name: 'outreach_reporter',
      label: 'Outreach Reporter (you)',
      required: true,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'person-attribution',
      name: 'contributions',
      label: 'Team members present and their roles at the event',
      helper:
        'One line per person — demonstrator, instructor, story capturer, setup, etc.',
      required: false,
      storage: 'extras',
      contributionLabel: 'Role at event',
      minRows: 0,
      maxRows: 30,
    },
    {
      type: 'number',
      name: 'total_attendees',
      label: 'Total attendees',
      unit: 'people',
      min: 0,
      max: 100000,
      required: true,
      storage: 'column',
    },
    {
      type: 'number',
      name: 'zero_first_count',
      label: 'Of those, number with zero prior FIRST experience',
      unit: 'people',
      min: 0,
      max: 100000,
      required: true,
      storage: 'column',
    },
    {
      type: 'text',
      name: 'age_range',
      label: 'Approximate age range',
      helper: 'e.g. "K–5", "middle school + parents", "mixed adult"',
      required: false,
      storage: 'column',
      maxLength: 100,
    },
    {
      type: 'multi-select',
      name: 'engagement_depth',
      label: 'Engagement depth — check all that apply',
      helper: 'At least one box OR a custom note describing the engagement.',
      category: 'engagement_depth',
      allowAddNew: true,
      withCustomNote: true,
      minSelected: 1,        // enforced as "at least 1 box OR a non-empty note"
      required: true,
      storage: 'extras',
    },
    {
      type: 'long-text',
      name: 'new_fll_participants',
      label: 'New FLL participants directly inspired today',
      helper: 'Names if known.',
      required: false,
      storage: 'extras',
      maxLength: 500,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'new_ftc_participants',
      label: 'New FTC participants directly inspired today',
      required: false,
      storage: 'extras',
      maxLength: 500,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'new_mentors',
      label: 'New mentors / coaches / volunteers committed today',
      required: false,
      storage: 'extras',
      maxLength: 500,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'existing_re_engaged',
      label: 'Existing FIRST community members re-engaged today',
      required: false,
      storage: 'extras',
      maxLength: 500,
      rows: 2,
    },
    {
      type: 'story-block',
      name: 'stories',
      label: 'Stories — minimum 3, named and permission-tracked',
      helper:
        'Each story: who, what happened (2–4 sentences), direct quote if any, ' +
        'permission status. Photo optional in Phase 1 (URL only).',
      required: true,
      storage: 'extras',
      minStories: 3,
      maxStories: 10,
    },
    {
      type: 'long-text',
      name: 'what_worked',
      label: 'What worked well',
      required: false,
      storage: 'column',
      maxLength: 1000,
      rows: 3,
    },
    {
      type: 'long-text',
      name: 'what_to_change',
      label: 'What we’d do differently next event',
      required: false,
      storage: 'column',
      maxLength: 1000,
      rows: 3,
    },
    {
      type: 'single-select',
      name: 'follow_up_type_option_id',
      label: 'Follow-up plan',
      helper:
        'How will we follow up with people from this event? Pick one, or leave blank.',
      category: 'follow_up_type',
      allowAddNew: false,
      required: false,
      storage: 'column',
      display: 'radio',
    },
    {
      type: 'long-text',
      name: 'follow_up_individuals',
      label: 'Names for individual follow-up',
      helper:
        'List names. Each will become a Contact Log entry — flag them in the ' +
        '"Specialty entries triggered" section below.',
      required: false,
      storage: 'extras',
      visibleWhen: {
        field: 'follow_up_type_option_id',
        // Resolved to the UUID at runtime; the validator helper resolves
        // option labels/values to their IDs when the form loads.
        equals: 'OPTION_UUID_FOR_individual',  // placeholder; see §15 below
      },
      maxLength: 1000,
      rows: 4,
    },
    {
      type: 'long-text',
      name: 'follow_up_prior_outreach',
      label: 'Link to prior Outreach Log we’re re-engaging',
      helper: 'Paste the Outreach Log URL or ID.',
      required: false,
      storage: 'extras',
      visibleWhen: {
        field: 'follow_up_type_option_id',
        equals: 'OPTION_UUID_FOR_re-engagement',
      },
      maxLength: 500,
      rows: 2,
    },
    {
      type: 'specialty-triggers',
      name: 'specialty_entries',
      label: 'Specialty entries triggered',
      helper:
        'Most commonly a Contact Log for each new mentor / sponsor / individual follow-up.',
      storage: 'extras',
    },
  ],
};
```

### About the `visibleWhen` placeholder values

The two `visibleWhen` conditions on `follow_up_individuals` and `follow_up_prior_outreach` reference option_lists rows by their UUID. We don't know those UUIDs at code-write time — they're generated by `gen_random_uuid()` at migration time.

**Resolution pattern.** A helper at form-render time resolves option-value strings (like `'individual'` or `'re-engagement'`) to the corresponding `option_lists.id` UUIDs in the loaded options. The `visibleWhen` config is written referencing the human-readable `value`; the renderer resolves it against the loaded options:

```typescript
// In _types.ts, add a value-style condition:
| { field: string; equalsOptionValue: string; category: OptionCategory }
```

Then in the renderer's visibility evaluator:

```typescript
function isVisible(cond: VisibilityCondition, values, optionsByCategory) {
  if ('equalsOptionValue' in cond) {
    const options = optionsByCategory[cond.category];
    const targetOption = options.find(o => o.value === cond.equalsOptionValue);
    return values[cond.field] === targetOption?.id;
  }
  // ... other condition shapes
}
```

The Outreach Log definition rewrites the conditions:

```typescript
visibleWhen: {
  field: 'follow_up_type_option_id',
  equalsOptionValue: 'individual',
  category: 'follow_up_type',
}
```

This avoids hard-coding UUIDs in the entry definitions.

## 15. Meeting Notes entry definition

```typescript
// src/entries/meeting-notes.ts

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
        'Phase 1: type your name. Phase 2: this becomes a member picker. ' +
        'Stored in extras for Phase 1; will be promoted to scribe_member_id ' +
        'in Phase 2.',
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
```

## 16. The registry

```typescript
// src/entries/_registry.ts

import { sessionLogEntry } from './session-log';
import { outreachLogEntry } from './outreach-log';
import { meetingNotesEntry } from './meeting-notes';
import type { EntryDefinition } from './_types';

export const ENTRY_REGISTRY: Record<string, EntryDefinition> = {
  session_log: sessionLogEntry,
  outreach_log: outreachLogEntry,
  meeting_notes: meetingNotesEntry,
};

export const ENTRY_LIST: EntryDefinition[] = Object.values(ENTRY_REGISTRY);
```

The registry lets the list view enumerate every known entry type without hard-coding the list. Phase 2 adds the seven other entry types by importing and registering them here.

## 17. The insert helper

```typescript
// src/lib/insert-entry.ts — pseudo-implementation showing the contract

export async function insertEntry(
  definition: EntryDefinition,
  formData: FormData
): Promise<{ ok: true; id: string } | { ok: false; fieldErrors?: Record<string, string>; formError?: string }> {
  // 1. Build the Zod schema from the definition.
  const schema = buildZodSchemaFromDefinition(definition);

  // 2. Parse FormData → object. Convert string values to numbers/dates/arrays
  //    as needed based on block types (handled by a block-aware parser).
  const parsed = parseFormDataWithDefinition(definition, formData);

  // 3. Validate.
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, fieldErrors: flattenZodErrors(result.error) };
  }

  // 4. Split values into column fields and extras fields.
  const columnValues: Record<string, unknown> = {};
  const extrasValues: Record<string, unknown> = {};
  for (const field of definition.fields) {
    if (field.storage === 'column') {
      columnValues[field.name] = result.data[field.name];
    } else {
      extrasValues[field.name] = result.data[field.name];
    }
  }

  // 5. Add common columns.
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, formError: 'Not authenticated.' };

  const row = {
    ...columnValues,
    extras: extrasValues,
    created_by: user.id,
    created_via: 'app',
    entry_state: definition.defaultEntryState ?? 'complete',
  };

  // 6. Insert.
  const { data, error } = await supabase
    .from(definition.table)
    .insert(row)
    .select('id')
    .single();

  if (error) return { ok: false, formError: error.message };
  return { ok: true, id: data.id };
}
```

This is one function that handles every entry type. Adding a new entry type does not require touching this file.

## 18. The list view

The list view at `/list` shows every active entry across every registered entry type, sorted by `created_at DESC`.

```typescript
// src/lib/queries.ts

export async function listAllEntries(limit = 50) {
  const supabase = await createServerClient();
  const queries = ENTRY_LIST.map((def) =>
    supabase
      .from(def.table)
      .select('id, created_at, created_by, entry_state, extras, ...')
      // typed columns selected per definition (see below)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)
  );
  const results = await Promise.all(queries);
  // Merge and re-sort.
  const merged = results.flatMap((r, i) =>
    (r.data ?? []).map((row) => ({ ...row, _type: ENTRY_LIST[i].type, _label: ENTRY_LIST[i].label }))
  );
  merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return merged.slice(0, limit);
}
```

The select-column list per definition is derived from the definition itself — list only `'column'` fields plus common columns. Phase 1 selects a small subset for the list view (date, lead/reporter/scribe, headline summary). Each entry definition exports a `listSummary(row)` function that formats the headline string:

```typescript
// In session-log.ts
export function listSummary(row: Record<string, unknown>): string {
  return `${row.session_lead}: ${row.what_worked_on}`.slice(0, 100);
}
```

Each row in the list view renders as: `[type pill]` `[date]` `[headline]` `[filer email]`. Clicking a row navigates to `/<type>/<id>` (a Phase 2 detail view; Phase 1 renders a placeholder).

## 19. Adding new entry types in Phase 2+

To add (say) Decision Log capture in Phase 2:

1. Create `src/entries/decision-log.ts` exporting a `decisionLogEntry: EntryDefinition`.
2. Add it to `src/entries/_registry.ts`.
3. Create `src/app/(app)/decisions/new/page.tsx` (a 5-line file: import the renderer, the definition, the action).
4. The list view automatically picks up the new type via the registry.
5. The insert helper automatically handles the new type.

No new form code. No new validation code. No new action code. The new entry type's specific behavior is entirely in the definition file.

**The same pattern works for Phase 5+ if the entry-type UI builder lands.** A builder would read and write entry definitions from a database table (`entry_definitions`) instead of from TypeScript files. The renderer, validator, and insert helper don't need to change — they consume the same `EntryDefinition` shape regardless of whether it came from a file or a database row.
