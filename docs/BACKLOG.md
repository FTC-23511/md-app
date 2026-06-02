# Backlog

The queue the routine processes (3×/weekday — see [`ROUTINE.md`](ROUTINE.md)).
Add items here as one-liners or links to briefs in `docs/briefs/`. Each
cycle, the routine picks the top item from "Next up," moves it to
"In progress," ships a PR, and (where safe) auto-merges.

You can add items by editing this file directly, or by asking Claude Code:

> _"Add 'fix typo on sign-in page' to the backlog."_

Priority is top-down — drag the most important items to the top of "Next up."

---

## Next up

<!-- Routine pulls from the top of this list. -->

From `docs/briefs/2026-05-28-fallback.md`:

- **[fallback]** T19 step 4 — Smoke-test fixtures: three pre-filled fixture files in `docs/fallback/inbox/` (one of each template type) + PR body with copy-paste run instructions for the App Lead. App Lead runs `pnpm run import-fallback`, confirms three rows in `/list` with `created_via='fallback_form'`, then approves + merges. _Tier: approval-required._

## In progress

<!-- Routine moves items here with the PR link when work starts. -->

- **[fallback]** T19 step 3 — Build `scripts/fallback/import.ts` + composite parsers in `scripts/fallback/parsers/` + add `yaml`, `glob`, `tsx` devDeps + `import-fallback` script in `package.json`. _Tier: approval-required._ → branch `routine/fallback-importer`

## Done

<!-- Auto-archived after merge. Keep the last ~20 for reference; older entries can be pruned. -->

- 2026-06-02 — **[fallback]** T19 step 2 — `BodyMapping` exports already present in all three entry files when this item was queued (implemented as part of the T18 sprint). No PR needed; marking done.
- 2026-06-01 — **[feature]** T18 — Fallback templates + workflow docs: `docs/fallback/templates/` (session-log, outreach-log, meeting-notes per `05-fallback.md` §4) + `docs/fallback/README.md` (contributor-facing) + `docs/fallback/inbox/.gitkeep`. Auto-merged in [#31](https://github.com/FTC-23511/md-app/pull/31).
- 2026-06-01 — **[feature]** Manage-tags admin screen: `softDeleteOption` server action + `app/(authed)/admin/manage-tags/page.tsx` (grouped by category, delete buttons) + dashboard Admin section link. Auto-merged in [#30](https://github.com/FTC-23511/md-app/pull/30).
- 2026-06-01 — **[config]** Add `.gitattributes` (LF default, CRLF for .bat) + fix Prettier format drift on ROUTINE.md + ROUTINE_RECOVERY.md. Auto-merged in [#29](https://github.com/FTC-23511/md-app/pull/29).
- 2026-05-29 — **[forms]** Forms rev2 item 16 — T17 list view + placeholder detail route + dashboard wiring: `app/(authed)/entries/list/page.tsx` (cross-type list with type pills + filer email + empty state) + `lib/queries.ts` (parallel fetch + member-email join + merge/sort) + `app/(authed)/entries/[type]/[id]/page.tsx` (Phase-2 placeholder so list rows don't 404) + dashboard quick-action buttons. **Forms batch (T13–T17) complete end-to-end.** Auto-merged in [#25](https://github.com/FTC-23511/md-app/pull/25).
- 2026-05-29 — **[forms]** Forms rev2 item 15 — T16 Meeting Notes: `entries/meeting-notes.ts` + registry update + `app/(authed)/entries/meetings/new/page.tsx`. Auto-merged in [#24](https://github.com/FTC-23511/md-app/pull/24).
- 2026-05-29 — **[forms]** Forms rev2 item 14 — T15 Outreach Log: `entries/outreach-log.ts` (22 fields, story-block, multi-select with note, two `visibleWhen` fields) + registry update + `app/(authed)/entries/outreach/new/page.tsx`. Auto-merged in [#23](https://github.com/FTC-23511/md-app/pull/23).
- 2026-05-29 — **[forms]** Forms rev2 item 13 — T14 Session Log: `entries/session-log.ts` + `entries/_registry.ts` + `lib/preload-options.ts` + `app/(authed)/entries/sessions/new/page.tsx`. Auto-merged in [#22](https://github.com/FTC-23511/md-app/pull/22).
- 2026-05-29 — **[forms]** Forms rev2 item 12 — validate + insert helpers: `lib/validate-entry.ts` (Zod schema builder from definition + FormData parser handling composite-block `__suffix` wire format) + `lib/insert-entry.ts` (generic insert splitting column/extras, attaches `created_by` + `created_via='app'` + `entry_state`). Auto-merged in [#21](https://github.com/FTC-23511/md-app/pull/21).
- 2026-05-29 — **[forms]** Forms rev2 item 11 — renderer: `components/entry-form/EntryForm.tsx` + `FieldRenderer.tsx` + `visibility.ts` (with `equalsOptionValue` resolution). Auto-merged in [#20](https://github.com/FTC-23511/md-app/pull/20).
- 2026-05-29 — **[forms]** Forms rev2 item 10 — composite blocks part 2: `StoryBlock.tsx` (≥3 stories + permission enum) + `SpecialtyTriggersBlock.tsx` (5 fixed Tier 2 checkboxes per Charter §11). Auto-merged in [#19](https://github.com/FTC-23511/md-app/pull/19).
- 2026-05-29 — **[forms]** Forms rev2 item 9 — composite blocks part 1: `PersonAttributionBlock.tsx` + `ActionItemsBlock.tsx` (dynamic-row pattern). Auto-merged in [#18](https://github.com/FTC-23511/md-app/pull/18).
- 2026-05-29 — **[forms]** Forms rev2 item 8 — select blocks: `SingleSelectBlock.tsx` (dropdown + radio) + `MultiSelectBlock.tsx` (with optional custom note) + `AddNewPopover.tsx`. Auto-merged in [#17](https://github.com/FTC-23511/md-app/pull/17).
- 2026-05-29 — **[forms]** Forms rev2 item 7 — primitive blocks: `BlockShell.tsx` + `TextBlock.tsx`, `LongTextBlock.tsx`, `DateBlock.tsx`, `NumberBlock.tsx` (uncontrolled, native HTML + Tailwind). Auto-merged in [#16](https://github.com/FTC-23511/md-app/pull/16).
- 2026-05-29 — **[forms]** Forms rev2 item 6 — foundations: `entries/_types.ts` (FieldBlock discriminated union + VisibilityCondition + OptionCategory + EntryDefinition + OptionListRow) + `lib/option-list-helpers.ts` (`getOptionsByCategory` + `createOption` server action with slug/collision handling). Auto-merged in [#15](https://github.com/FTC-23511/md-app/pull/15).
- 2026-05-29 — **[docs]** Forms rev2 item 5 — docs sync follow-up: remaining `src/` references and route-group references in `00-plan.md`/`01-conventions.md`/`02-schema.md`/`04-auth.md`/`05-fallback.md` aligned to repo reality. Auto-merged in [#14](https://github.com/FTC-23511/md-app/pull/14).
- 2026-05-29 — **[fix]** Forms rev2 item 4 — code unblock: rewrote `app/(authed)/dashboard/page.tsx` to query new `members(email, display_name)` shape; stubbed `app/showcase/page.tsx` as Phase 4 placeholder; deleted `lib/schemas/session-log.ts` + its unit test; added `passWithNoTests: true` to vitest config. Auto-merged in [#13](https://github.com/FTC-23511/md-app/pull/13).
- 2026-05-29 — **[schema]** Forms rev2 item 3 — Migration C: Phase 1 detail tables (`session_logs`, `outreach_logs`, `meeting_notes`) + `flags` + Phase 4 placeholders, all with permissive Phase 1 RLS. Squash-merged in [#12](https://github.com/FTC-23511/md-app/pull/12). Applied to dev DB.
- 2026-05-29 — **[schema]** Forms rev2 item 2 — Migration B: `option_lists` table + 8 categories of seed data per spec §§4.2–4.3. Squash-merged in [#11](https://github.com/FTC-23511/md-app/pull/11). Applied to dev DB.
- 2026-05-29 — **[schema]** Forms rev2 item 1 — Migration A: drop legacy schema (auth-batch tables + ENUMs); reshape `members` per spec §4.1; replace `handle_new_auth_user` trigger; backfill members from auth.users. Squash-merged in [#10](https://github.com/FTC-23511/md-app/pull/10). Applied to dev DB.
- 2026-05-28 — **[docs]** Forms brief item 1 — spec sync: align `00-plan.md` T13–T17, `01-conventions.md` §1, and `03-forms.md` §§1–18 paths to repo reality (root-level paths, `(authed)` route group, `/entries/<type>/new`); drop Phase-2 `voice_memo_url` reference. Auto-merged in [#9](https://github.com/FTC-23511/md-app/pull/9).
- 2026-05-27 — **[chore]** Consolidate the automation routine — rename `MORNING_ROUTINE.md` → `ROUTINE.md`, fold prep+run, document 3×/weekday schedule. Squash-merged in [#8](https://github.com/FTC-23511/md-app/pull/8).
- 2026-05-27 — **[auth]** Phase 1 auth batch (T09–T12): single-email allowlist in middleware + `/forbidden`, email+password sign-in replacing magic-link, forgot/reset/change-password flow, protected layout top bar. Squash-merged in [#7](https://github.com/FTC-23511/md-app/pull/7).
- 2026-05-27 — **[docs]** Audit `.env.example` (add `ALLOWED_EMAIL`, fix stale magic-link comment) — superseded by #7 (which made the same changes as part of the auth batch). Closed: [#5](https://github.com/FTC-23511/md-app/pull/5).
- 2026-05-26 — **[config]** Untrack `.claude/settings.local.json` and `tsconfig.tsbuildinfo` (add to `.gitignore`). Auto-merged in [#6](https://github.com/FTC-23511/md-app/pull/6).
- 2026-05-26 — **[docs]** Update `docs/phase1/00-plan.md` T05–T08 Deliverables to reference actual migration filenames. Auto-merged in [#4](https://github.com/FTC-23511/md-app/pull/4).
- 2026-05-26 — **[docs]** Fix `docs/SETUP.md` Step 4 magic-link reference. Auto-merged in [#3](https://github.com/FTC-23511/md-app/pull/3).
- 2026-05-26 — **[docs]** Fix `README.md` to use `pnpm` consistently. Auto-merged in [#2](https://github.com/FTC-23511/md-app/pull/2). (Also bundled a Windows-friendly Prettier `endOfLine` fix.)
- 2026-05-26 — **[meta]** Repo-wide Prettier sweep + expand auto-merge tier rule to cover root-level `*.md` and pure formatting sweeps. Auto-merged in [#1](https://github.com/FTC-23511/md-app/pull/1). (Ad-hoc item; emerged when `pnpm verify` failed on pre-existing format drift.)
