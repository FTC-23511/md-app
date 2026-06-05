# Phase 2 forms + detail pages

Extends the Phase 1 form engine (`entries/_types.ts`, `components/entry-form/`, `lib/validate-entry.ts`, `lib/insert-entry.ts`). Read `docs/phase1/03-forms.md` first — this only specifies what is **new**. The principle is unchanged: one `EntryDefinition` per type in `entries/*.ts` drives the form, the Zod schema, the insert, and the list/detail rendering.

## 1. New field block types

Add each to the `FieldBlock` discriminated union in `entries/_types.ts`, a renderer in `components/entry-form/blocks/`, a parse case in `parseFormDataWithDefinition`, and a `schemaForBlock` case in `validate-entry.ts`. Follow the existing composite-block wire convention (`name__subkey`).

| Block `type`        | Used by                          | What it does                                                                                                                                                                                         |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkbox`          | Decision Log depth triggers      | A single boolean. The filer asserts a depth trigger fired. Gates a section via `visibleWhen: {field, truthy: true}` (the visibility engine already supports `truthy`).                               |
| `section-header`    | grouping                         | Presentational only; renders a heading + optional helper. Honors `visibleWhen` so a whole depth section can hide/show. No stored value.                                                              |
| `alternatives`      | Decision Log                     | Repeating rows of `{label, pros, cons, predicted}`, min 3. Same shape family as `story-block`. Stored in `extras.alternatives`.                                                                      |
| `matrix`            | Decision Log                     | Weighted trade-off matrix: criteria rows `{name, weight}` (weights sum to 1.0) × option columns, score 1–5 per cell. **Weighted totals + winner auto-computed** via `lib/compute/` (not user-typed). |
| `fmea`              | Decision Log                     | Rows of `{failure_mode, effect, severity, likelihood, detectability, mitigation}`; **RPN = S×L×D auto-computed** per row.                                                                            |
| `raw-data-table`    | Test Log                         | User-defined columns + pasted rows. See `docs/phase2/03-test-log.md`.                                                                                                                                |
| `computed-readonly` | Test Log, matrix, FMEA           | Displays values produced by `lib/compute/`. Never accepts typed input; excluded from the submit payload (recomputed server-side).                                                                    |
| `media-links`       | all entries with visual evidence | Paste-a-URL list. See `docs/phase2/04-media.md`.                                                                                                                                                     |

Keep blocks **serializable and declarative** like the existing ten — no function-valued config (the visibility engine and the importer both rely on this).

## 2. Triggered depth sections (Decision Log)

The charter's depth triggers are **self-applied by the filer** (`MD_Project_Charter.md` SOP-05 "Trigger application discipline") — the app does not auto-detect them. So:

- Each depth field gets a `checkbox` block ("This decision needs a weighted trade-off matrix — 3+ options AND >1 build session of rework if wrong") with the trigger text from the charter as the label/helper.
- The depth block(s) for that trigger carry `visibleWhen: {field: '<checkbox name>', truthy: true}` and a `section-header`.
- All depth blocks are `required: false` at the schema level (a Decision Log may legitimately need zero). Requiredness is conditional on the checkbox, enforced by a refine in the built schema or by the renderer only submitting visible fields (Phase 1 already drops hidden fields from submit).

The initial 5-minute entry is the always-required fields only. Depth is filled later on the detail page (§4), preserving the 5/24 budget.

## 3. Entry detail page — `/entries/[type]/[id]`

Currently a placeholder (`app/(authed)/entries/[type]/[id]/page.tsx`). Make it:

1. Resolve `type` → `EntryDefinition` via `entries/_registry.ts`; read `definition.table`.
2. Select the row by `id` `WHERE deleted_at IS NULL`.
3. Render every field read-only, walking `definition.fields` (reuse the renderer in a read mode, or a parallel read renderer). Resolve `*_option_id` columns to their option labels; render `extras` arrays (alternatives, stories, deltas, raw rows) as tables; render `media_links` as previews (`04-media.md`).
4. Show an `entry_state` badge (Draft / Complete) and, for entries with later-fill fields, a **"Complete this entry"** / **"Add outcome"** action that opens the edit/fill flow (§4).
5. Show any `flags` raised from this entry (open Tier 2 to-dos).

## 4. `updateEntry` + fill-later / outcome flow

Phase 1 has only `insertEntry`. Add `lib/update-entry.ts`, mirroring it: parse → validate → split column/extras → `UPDATE ... WHERE id = $1`. Two callers:

- **Complete a draft / fill depth fields** — Decision Log depth, SW Change Log AI deep-dive (2G), Test Log depth. Re-opens the form pre-filled, lets the user add the previously-hidden/empty sections, flips `entry_state` to `complete` when the required-for-complete set is satisfied.
- **Outcome update** — Decision Log (`actual_outcome`, `delta`, `learned`) and Hardware Change Log measured deltas "filled in later". A focused mini-form, not the whole entry.

Runs on the current permissive RLS. Phase 3 attaches the 24h-edit restriction here (single chokepoint).

## 5. Entry definition files to create (`entries/*.ts`)

One per type, registered in `entries/_registry.ts`, each mapping the charter template to blocks:

- `contact-log.ts` → T-09 + SOP-09
- `hardware-change-log.ts` → T-06 + SOP-06
- `software-change-log.ts` → T-07 baseline + SOP-07 (AI deep-dive blocks added in 2G)
- `test-log.ts` → T-08 + `docs/phase2/03-test-log.md`
- `decision-log.ts` → T-05 + §2 above
- `competition-recap.ts` → T-04 + SOP-04 (largest; lean on `section-header` to organize)

Set `defaultEntryState: 'draft'` on Decision Log, Software Change Log, and Test Log per `_types.ts`.

## 6. New-entry routes

Mirror the Phase 1 pattern (`app/(authed)/entries/<type>/new/page.tsx`) for each new type, plus list-view pills and nav. Keep `force-dynamic` on routes that read env at build (known gotcha).
