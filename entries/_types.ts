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
  | SpecialtyTriggersBlock;

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
