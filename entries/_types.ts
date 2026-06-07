/**
 * Entry definition types — the single source of truth for every Phase 1
 * entry's form, validation, database insert, and list-view rendering.
 *
 * Spec: docs/phase1/03-forms.md §§1–12.
 *
 * One EntryDefinition per entry type lives in this folder
 * (entries/session-log.ts, etc.) and gets registered in entries/_registry.ts.
 *
 * The renderer (components/entry-form/EntryForm.tsx) walks the definition's
 * `fields` array and produces the form. lib/validate-entry.ts builds a Zod
 * schema from the same definition. lib/insert-entry.ts splits values into
 * typed columns vs `extras` JSONB based on each field's `storage` setting.
 */

import type { ColumnKind, CustomColumn } from '@/lib/compute/test-stats';

// ---- Option categories ----------------------------------------------------
// Mirrors the CHECK constraint on option_lists.category in
// supabase/migrations/20260528000002_option_lists.sql.

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

// ---- Visibility conditions ------------------------------------------------
// Declarative (not function-valued) so they can be serialized — see §2.5 spec.
// The renderer evaluates each condition against current form values.

export type VisibilityCondition =
  | { field: string; equals: unknown }
  | { field: string; truthy: true }
  | { field: string; in: unknown[] }
  | { field: string; equalsOptionValue: string; category: OptionCategory }
  | { all: VisibilityCondition[] }
  | { any: VisibilityCondition[] };

// ---- Base block shape (every block extends this) --------------------------

export type BlockBase = {
  /** Field name. For column storage, the DB column; for extras, the JSONB key. */
  name: string;
  /** Human-readable label shown above the input. */
  label: string;
  /** Optional helper text shown below the label. */
  helper?: string;
  /** Whether the field is required. Defaults to false. */
  required?: boolean;
  /** Whether the value lives in a typed column or inside the `extras` blob. */
  storage: 'column' | 'extras';
  /** Optional visibility condition; hidden fields are excluded from submit. */
  visibleWhen?: VisibilityCondition;
};

// ---- The ten block types --------------------------------------------------

export type TextBlock = BlockBase & {
  type: 'text';
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
};

export type LongTextBlock = BlockBase & {
  type: 'long-text';
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  /** Rows in the textarea. Default: 4. */
  rows?: number;
};

export type SingleSelectBlock = BlockBase & {
  type: 'single-select';
  category: OptionCategory;
  /** Whether the user can add a new option via "Add new…". Default: true. */
  allowAddNew?: boolean;
  /** Display style. 'dropdown' for many options, 'radio' for few. Default: 'dropdown'. */
  display?: 'dropdown' | 'radio';
};

export type MultiSelectBlock = BlockBase & {
  type: 'multi-select';
  category: OptionCategory;
  allowAddNew?: boolean;
  /** If true, the field's shape becomes {ids: string[], note: string}. */
  withCustomNote?: boolean;
  /** Minimum number of selections (or, with note, "at least N selected OR note"). */
  minSelected?: number;
};

export type DateBlock = BlockBase & {
  type: 'date';
  /** Minimum allowed date as ISO YYYY-MM-DD. */
  minDate?: string;
  /** Maximum allowed date. Defaults to today (no future entries). */
  maxDate?: string;
  /** Default value. 'today' sets to today on page load. */
  defaultValue?: 'today' | string;
};

export type NumberBlock = BlockBase & {
  type: 'number';
  min?: number;
  max?: number;
  /** Whether decimals are allowed. Default: false. */
  decimals?: boolean;
  /** Step value for the input. Default: 1 (or 0.01 if decimals). */
  step?: number;
  /** Unit label suffix (e.g., "hours", "people"). */
  unit?: string;
};

export type PersonAttributionBlock = BlockBase & {
  type: 'person-attribution';
  /** Minimum number of rows. Default: 0. */
  minRows?: number;
  /** Maximum number of rows. Default: 50. */
  maxRows?: number;
  /** Label for the contribution column. Default: 'Contribution'. */
  contributionLabel?: string;
};

export type StoryBlock = BlockBase & {
  type: 'story-block';
  /** Minimum stories required. Outreach Log requires 3. */
  minStories?: number;
  /** Maximum stories allowed. Default: 10. */
  maxStories?: number;
};

export type ActionItemsBlock = BlockBase & {
  type: 'action-items';
  minItems?: number;
  maxItems?: number;
};

export type SpecialtyTriggersBlock = BlockBase & {
  type: 'specialty-triggers';
};

/** One column of a RepeatingRowsBlock. */
export type RepeatingRowsColumn = {
  /** Object key under each stored row, and the form-wire suffix (name__<key>). */
  name: string;
  /** Column header / input placeholder. */
  label: string;
  /** Input kind. 'number' renders a number input; values are stored as trimmed strings either way. */
  kind?: 'text' | 'number';
};

/**
 * Minimal generic repeating-row block: a small table of free-text columns the
 * filer adds/removes rows to. Stored as `Array<{ [columnName]: string }>` in
 * `extras`. Introduced for the Hardware Change Log `deltas` field
 * (`{metric, was, now}`); reused by the Software Change Log `files_changed`
 * field (single column). Heavier structured tables (matrix / FMEA / raw-data)
 * are their own block types in later batches.
 */
export type RepeatingRowsBlock = BlockBase & {
  type: 'repeating-rows';
  /** Ordered columns; each becomes a key in every stored row object. */
  columns: RepeatingRowsColumn[];
  /** Minimum number of rows. Default: 0. */
  minRows?: number;
  /** Maximum number of rows. Default: 50. */
  maxRows?: number;
  /** Add-button label, e.g. 'Add delta'. Default: 'Add row'. */
  addLabel?: string;
};

/** Which Test Log input mode a raw-data-table captures (mirrors test_type). */
export type RawDataTableMode = 'pass_fail' | 'single_measure' | 'custom';

/**
 * Paste-friendly tabular input for the Test Log (`docs/phase2/03-test-log.md`
 * §2). The tester pastes tab/comma-separated rows (from a phone or sheet) and
 * confirms them in an editable grid. Three modes:
 *
 *  - `pass_fail` — fixed columns: a pass/fail result + an optional note.
 *  - `single_measure` — one fixed numeric column.
 *  - `custom` — the tester defines their own columns (name + kind), the escape
 *    hatch for any shape.
 *
 * Parsed/stored value is a {@link RawDataTableValue}: `raw_rows` (the grid) plus
 * `custom_columns` (custom mode only). That object is exactly the wire format
 * `lib/compute/test-stats.ts` consumes, so the form submit path and the
 * fallback importer feed it the same shape with no reshaping.
 */
export type RawDataTableBlock = BlockBase & {
  type: 'raw-data-table';
  /** Default/fallback mode. Overridden at runtime when `modeField` is set. */
  mode: RawDataTableMode;
  /**
   * Name of a sibling `choice` field whose current value (one of the
   * RawDataTableMode strings) supplies the active mode. Lets the Test Log's
   * `test_type` radio drive the table shape from a single block instead of one
   * block per mode. The form passes the live value; the detail page reads it
   * off the stored row.
   */
  modeField?: string;
  /** Max rows accepted (pasted datasets can be large). Default 500. */
  maxRows?: number;
};

/** One fixed option of a {@link ChoiceBlock}. */
export type ChoiceOption = { value: string; label: string };

/**
 * Single-choice from a small set of **fixed, inline** options (not from
 * `option_lists`). Stored as the literal `value` string in a typed column —
 * used by the Test Log's `test_type` (pass_fail / single_measure / custom),
 * which drives both the compute path and a `modeField`-linked raw-data-table.
 * Unlike `single-select`, the value is a known string, not an option UUID, so
 * it composes directly with `visibleWhen: {field, equals}`.
 */
export type ChoiceBlock = BlockBase & {
  type: 'choice';
  options: ChoiceOption[];
  /** Display style. Default 'radio'. */
  display?: 'radio' | 'dropdown';
  /** Pre-selected value on page load. */
  defaultValue?: string;
};

/** Parsed/stored value of a {@link RawDataTableBlock}. */
export type RawDataTableValue = {
  /** One object per data row, keyed by column name; values kept as strings. */
  raw_rows: Array<Record<string, string>>;
  /** Tester-defined columns; populated only in `custom` mode (else empty). */
  custom_columns: CustomColumn[];
};

/**
 * Display-only block surfacing values produced by `lib/compute/` (Test Log
 * stats today; matrix/FMEA totals later). It never accepts typed input and is
 * **excluded from the submit payload** — the server recomputes and stores the
 * object itself (`extras.computed`), so the form can never disagree with the
 * persisted statistic (`docs/phase2/02-forms-and-detail.md` §1).
 *
 * `name` is the `extras` key the computed object lives under (e.g. `computed`).
 * On a fresh form there is nothing to show yet, so the renderer prints a short
 * "computes on save" placeholder; the real stats render on the detail page.
 */
export type ComputedReadonlyBlock = BlockBase & {
  type: 'computed-readonly';
  /** Which computed shape to render. Only `test-stats` exists in 2C. */
  shape: 'test-stats';
};

// re-export so call sites can `import { ColumnKind } from '@/entries/_types'`
export type { ColumnKind, CustomColumn };

// ---- Discriminated union --------------------------------------------------

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
  | SpecialtyTriggersBlock
  | RepeatingRowsBlock
  | RawDataTableBlock
  | ComputedReadonlyBlock
  | ChoiceBlock;

// ---- Entry definition -----------------------------------------------------

export type EntryDefinition = {
  /** Machine-readable entry type, matches frontmatter and registry key. */
  type: string;
  /** Database table name. */
  table: string;
  /** Human-readable label for navigation, list pills, page titles. */
  label: string;
  /** Optional short description shown above the form. */
  description?: string;
  /** Ordered list of field blocks composing the entry. */
  fields: FieldBlock[];
  /**
   * Optional override for entry_state default. Most entries default to
   * 'complete'; Decision Log, Software Change Log, Test Log, and
   * Subsystem Handoff default to 'draft' per Charter Draft → Complete.
   */
  defaultEntryState?: 'draft' | 'complete';
};

// ---- Option-list row shape ------------------------------------------------
// Server-side helpers (lib/option-list-helpers.ts) return rows in this shape.

export type OptionListRow = {
  id: string;
  category: OptionCategory;
  value: string;
  label: string;
  sort_order: number;
  is_seed: boolean;
};

// Result shape returned by the `createOption` server action. Lives here
// (not in option-list-helpers.ts) so option-list-helpers.ts can be a
// file-level 'use server' module — which Next 15 requires to export only
// async functions.
export type CreateOptionResult =
  | { ok: true; option: OptionListRow; existed: boolean }
  | { ok: false; error: string };
