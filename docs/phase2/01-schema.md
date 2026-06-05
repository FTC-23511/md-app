# Phase 2 schema

Canonical spec for the tables Phase 2 adds. Follows every convention in `docs/phase1/02-schema.md` — read that first. This document only specifies what is **new**.

## 0. Conventions carried over (do not restate in migrations beyond the pattern)

Every entry table is **standalone** (no base `entries` table) and carries the common columns exactly as `session_logs` does (`docs/phase1/02-schema.md` §2.1):

```
id uuid PK, created_at, updated_at, deleted_at,
created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
created_via text CHECK (created_via IN ('app','fallback_form','import')),
extras jsonb NOT NULL DEFAULT '{}'::jsonb,
entry_state text CHECK (entry_state IN ('draft','complete'))
```

Plus: `set_updated_at` trigger, `created_at DESC` partial index `WHERE deleted_at IS NULL`, permissive Phase 1 RLS policy (`*_all_authenticated`), and **grants in their own migration** (known gotcha — "expose new tables" is off, so `GRANT` is manual and tracked).

**Column vs `extras` rule** (§2.2): a field is a typed column only if it is queried/filtered/sorted/joined/indexed. Everything else lives in `extras`. The list-view and dashboard needs decide this, not the form.

Option-list categories needed by Phase 2 are **already seeded** in `20260528000002_option_lists.sql`: `relationship_type`, `relationship_status`, `change_type`, `subsystem`. Reuse them; do not re-seed.

Table + type naming follows the committed `flags.target_entry_type` CHECK and `validate-entry.ts` specialty-triggers enum: `decision_log`, `hw_change_log`, `sw_change_log`, `test_log`, `contact_log` → tables `decision_logs`, `hw_change_logs`, `sw_change_logs`, `test_logs`, `contact_logs`. Plus `comp_recaps` (shape sketched in `02-schema.md` §5.4) and `media_links`.

---

## 1. `contact_logs` + `contacts`

Charter says contact identity/contact-info is "stored separately for privacy" (SOP-09). Two tables:

**`contacts`** — the person, reusable across many interactions.
- typed: `display_name text NOT NULL`, `role_org text`, `relationship_type_option_id uuid REFERENCES option_lists(id)`, `relationship_status_option_id uuid REFERENCES option_lists(id)`
- `extras`: `contact_info` (email/phone/handle — segregated here, not surfaced in general reads), `how_we_connected`

**`contact_logs`** — one interaction.
- typed: `contact_id uuid NOT NULL REFERENCES contacts(id)`, `contact_date date NOT NULL`, `contact_method text`
- `extras`: `topic`, `outcomes_commitments`, `follow_up_next_action`, `follow_up_date`, sponsor `visual_assets` (media-link refs)

## 2. `hw_change_logs`

- typed: `subsystem_option_id uuid REFERENCES option_lists(id)`, `change_date date NOT NULL`, `version integer NOT NULL`, `replaces_version integer`, `parent_decision_id uuid` (informal FK to `decision_logs`)
- `extras`: `what_changed`, `why`, `deltas` (array of `{metric, was, now}`), `tradeoffs`. Photos via `media_links` (v(n-1), v(n), in-context, hero), not columns.

## 3. `sw_change_logs`

Baseline in 2B; AI deep-dive section in 2G. `defaultEntryState: 'draft'`.
- typed: `change_type_option_id uuid REFERENCES option_lists(id)`, `change_date date NOT NULL`, `commit_hash text`, `branch text`, `parent_decision_id uuid`
- `extras`: `what_changed`, `why`, `hardware_sensors`, `game_challenge`, `before_behavior`, `after_behavior`, `failure_modes`, `verification`, `files_changed` (array), and — added in 2G — `ai_deep_dive` (array of `{topic, question, response}`), `transcript_url`, `prompt_version`.

## 4. `test_logs` + `test_series`

Full design in `docs/phase2/03-test-log.md`. `defaultEntryState: 'draft'`.

**`test_logs`**
- typed: `test_label text NOT NULL` (the time-series key — keep identical across re-runs), `test_date date NOT NULL`, `test_type text NOT NULL CHECK (test_type IN ('pass_fail','single_measure','custom'))`, `robot_version_hw_id uuid` (informal FK to `hw_change_logs`)
- `extras`: `hypothesis`, `field_setup`, `method_steps`, `raw_rows` (array — shape depends on `test_type`, see 03), `custom_columns` (for `custom` type: array of `{name, kind}`), `computed` (the auto-computed stats object), `ai_analysis` (`{summary, stats, caveats, model, prompt_version, edited_by_human}` — present only when run), depth fields (`sample_size_justification`, `controlled_variables`, `what_failed`, `repeatability_check`), `interpretation`, `action_taken`.

**`test_series`** — optional rollup table to make last-run lookup and dashboard trends cheap.
- `test_label text`, `test_log_id uuid REFERENCES test_logs(id)`, `test_date date`, `headline_stat numeric`, `headline_label text`. Written by the same compute step that fills `test_logs.computed`. (Alternative: derive on read by querying `test_logs` by label; use the table only if read performance needs it — decide in 2C.)

## 5. `decision_logs`

Full field/depth design in `docs/phase2/02-forms-and-detail.md`. `defaultEntryState: 'draft'`.
- typed: `subsystem_option_id uuid REFERENCES option_lists(id)`, `decision_date date NOT NULL`, `parent_entry_type text`, `parent_entry_id uuid`
- `extras`: `problem_statement`, `constraints`, `alternatives` (array of `{label, pros, cons, predicted}` — min 3, mirrors the stories pattern), `paths_not_taken`, `decision`, `rationale`, `predicted_outcome`, outcome-later (`actual_outcome`, `delta`, `learned`), and the four optional depth objects keyed by their trigger: `matrix`, `first_principles`, `sensitivity`, `fmea` (each present only if its trigger checkbox is set).

Dashboard "average alternatives per Decision Log" is `jsonb_array_length(extras->'alternatives')` — no separate child table needed.

## 6. `comp_recaps`

Heaviest entry; mostly `extras`. Build in 2D. Reference `02-schema.md` §5.4 for the typed-column sketch.
- typed: `competition_name text NOT NULL`, `comp_start_date date NOT NULL`, `comp_end_date date`, `outcome text`, `auto_reliability_pct numeric`
- `extras`: `judging` (interview + pit panels + evidence gaps), `root_cause` (array of up to 3 `{failure, whys[], root_cause, owner_action}`), `notable_matches` (array), `strategic_insights` (array of `{insight, decision_trigger, owner}`), `alliance_scouting`, `what_worked`, `changes_before_next`, `per_person`, `documentation_self_audit`. Companion view (auto-generated trend from Test Logs) is computed for display, not stored.

## 7. `media_links` (polymorphic, like `flags` / `classification_index`)

One row per attached photo/video link. Full design in `docs/phase2/04-media.md`.
- `id`, `entry_type text NOT NULL`, `entry_id uuid NOT NULL` (polymorphic, not a real FK — matches `flags.parent_entry_id`)
- `url text NOT NULL` (the canonical link — a Drive share link for ingested items; the native URL for YouTube/Vimeo passthrough)
- `provider text NOT NULL CHECK (provider IN ('google_drive','youtube','vimeo','direct','other'))` — where the item lives *now* (ingested items are `google_drive`)
- `source_provider text` — where it came *from* before ingest (`discord`/`upload`/`imgur`/`direct`); null for native passthrough. Audit/debugging.
- `drive_file_id text` — Drive file id for ingested items (lets the app manage permissions/deletes later); null for passthrough
- `ingest_status text CHECK (ingest_status IN ('not_needed','pending','done','failed')) DEFAULT 'not_needed'` — `not_needed` for passthrough; `pending`→`done`/`failed` for ingest
- `media_type text CHECK (media_type IN ('image','video','unknown'))`
- `caption text`, `permission_status text CHECK (permission_status IN ('yes','no','pending','n_a')) DEFAULT 'pending'`
- `thumbnail_url text`, `role text` (e.g. hw: `prev_version`/`new_version`/`in_context`/`hero`)
- `last_checked_ok boolean`, `last_checked_at timestamptz`, common columns
- indexes: `(entry_type, entry_id) WHERE deleted_at IS NULL`; `(last_checked_ok) WHERE deleted_at IS NULL` for the health sweep.

---

## 8. Migration plan

- One migration creates §§1–7 tables (or split contacts/media into their own for reviewability). `LANGUAGE plpgsql` for any function (known gotcha — `LANGUAGE SQL` validates table refs at creation and fails).
- A following migration grants on the new tables (known gotcha — manual + tracked, mirror `20260530000001_grants_for_path_b_tables.sql` and `20260602000001_grants_for_service_role.sql`).
- Apply to **dev first** after confirming the CLI is linked to dev; then prod.
