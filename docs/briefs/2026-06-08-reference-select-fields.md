# Feature: Reference-select fields (pick-or-create / pick-or-none)

<!-- Filename: docs/briefs/2026-06-08-reference-select-fields.md -->

## What we're building

A new field-block type — `reference-select` — for any form field that points at
another entry or reuses a label shared across entries, so the user **picks from
a list instead of retyping or pasting a UUID**. Two flavors:

- **Label flavor (pick-or-create):** a combobox of existing values plus "+ Add
  new …" so the typed value becomes a new option. Used for series-style labels
  like the Test Log's `test_label`.
- **Reference flavor (pick-or-none):** a dropdown of existing entries of a given
  type, each shown as **date + short title**, plus a **None** option. No free
  entry — the value is always an existing entry's UUID or null. Used for
  cross-entry references like `robot_version_hw_id` and `parent_decision_id`.

## Why

Today these fields are free-text boxes. Users either retype a series name
(typos break trend rollups) or are expected to paste a raw UUID (nobody has it).
The App Lead's directive: "the user should not have to put in work for this."
This also removes the class of bug that just bit us — an optional UUID field
left blank or filled wrong.

## Acceptance criteria

Observable in the browser:

- **Test Log `test_label`** renders as a pick-or-create combobox. Existing
  series labels appear; picking one reuses it exactly (so the trend stacks).
  Typing a new name + "Add new" sets it as the value and it appears in the list
  on the next entry.
- **Test Log `robot_version_hw_id`** renders as a pick-or-none dropdown of
  Hardware Change Logs shown as `YYYY-MM-DD — <short title>`. Selecting one
  stores that entry's UUID; **None** stores null (saves cleanly — no
  `invalid input syntax for type uuid` error).
- **SW Change Log `parent_decision_id`** renders as a pick-or-none dropdown of
  Decision Logs (date + short title) + None.
- Lists are populated from the DB at render (server component / server action),
  not hardcoded.
- Series label options come from distinct `test_label` values across the test
  tables (`test_series` / `test_logs`).
- Submitting still validates: label flavor required-ness behaves like text;
  reference flavor accepts a valid UUID or null.

## Out of scope

- Tooltips / new-user help text everywhere — tracked separately (its own chat/PR),
  including adding a standing tooltip convention to CLAUDE.md.
- The `category` + "condition (group by)" clarity fix in custom raw-data columns
  — fold into the tooltips pass.
- Multi-user / RLS-scoped option lists — Phase 3.
- Editing/migrating already-saved free-text values into references — new entries
  only this round.

## Open questions

Resolved with the App Lead (2026-06-08):

1. **Add-new vs none rule** — labels (series) get pick-or-create; UUID/entry
   references get pick-or-none (never free entry). ✅
2. **Series list source** — distinct `test_label` from the test tables. ✅
3. **Reference option display** — `date + short title`. ✅
4. **New block needed** — yes; existing blocks (`single-select` is
   option-table-backed; `multi-select`; `choice` is literal strings) don't cover
   "pick an existing entry of type X, or none / or create." ✅

Still to decide during build:

- **"Short title" per entry type** — which column(s) form the label for a
  Hardware Change Log and a Decision Log option? (e.g. HCL: `change` summary /
  first delta; Decision Log: decision title.) Confirm per type before wiring.
- **Full field audit** — confirm the complete list of reference/label fields
  across all current forms (Test Log, HW/SW Change Log, Session, Outreach,
  Meeting, Contact) before implementing, so none are missed.
