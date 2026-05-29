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

From brief [`docs/briefs/2026-05-28-forms.md`](briefs/2026-05-28-forms.md) — Forms + entries (T13–T17). Process in order; spec sync ships first so subsequent items reference correct paths.

1. **[forms]** Forms brief item 3 — primitive blocks: `components/entry-form/blocks/TextBlock.tsx`, `LongTextBlock.tsx`, `DateBlock.tsx`, `NumberBlock.tsx` (thin shadcn wrappers). _Tier: auto-merge._
3. **[forms]** Forms brief item 4 — select blocks: `SingleSelectBlock.tsx` + `MultiSelectBlock.tsx` (with optional `withCustomNote` textarea), both wired to the "Add new…" popover calling `createOption`. _Tier: auto-merge._
4. **[forms]** Forms brief item 5 — composite blocks part 1: `PersonAttributionBlock.tsx` + `ActionItemsBlock.tsx` (dynamic-row pattern, optional shared `RepeatingRows` helper). _Tier: auto-merge._
5. **[forms]** Forms brief item 6 — composite blocks part 2: `StoryBlock.tsx` (≥3 stories, hard-coded `permission` enum, optional `photo_url`) + `SpecialtyTriggersBlock.tsx` (five fixed Tier 2 checkboxes per Charter §11; owner+subject required when checked). _Tier: auto-merge._
6. **[forms]** Forms brief item 7 — renderer: `components/entry-form/EntryForm.tsx` + `FieldRenderer.tsx` + `visibleWhen` evaluator with `equalsOptionValue` resolution. Server-component wrapper that fetches options for every declared category. _Tier: auto-merge._
7. **[forms]** Forms brief item 8 — validate + insert helpers: `lib/validate-entry.ts` (Zod builder from definition, skips hidden fields) + `lib/insert-entry.ts` (splits column/extras, attaches `created_by` + `created_via='app'` + `entry_state`). Delete `lib/schemas/session-log.ts`. _Tier: auto-merge._
8. **[forms]** Forms brief item 9 — T14 Session Log: `entries/session-log.ts` per `03-forms.md` §13, `entries/_registry.ts`, `app/(authed)/entries/sessions/new/page.tsx`. _Tier: auto-merge._
9. **[forms]** Forms brief item 10 — T15 Outreach Log: `entries/outreach-log.ts` per `03-forms.md` §14 (story-block, multi-select with note, two `visibleWhen` fields, 22 fields), registry update, `app/(authed)/entries/outreach/new/page.tsx`. _Tier: auto-merge._
10. **[forms]** Forms brief item 11 — T16 Meeting Notes: `entries/meeting-notes.ts` per `03-forms.md` §15, registry update, `app/(authed)/entries/meetings/new/page.tsx`. _Tier: auto-merge._
11. **[forms]** Forms brief item 12 — T17 list view: `app/(authed)/entries/list/page.tsx`, `lib/queries.ts` with `listAllEntries()`, `listSummary` exports on each entry definition, type-pill component, empty state, placeholder detail route at `app/(authed)/entries/[type]/[id]/page.tsx`, dashboard placeholder copy linking the new pages. _Tier: auto-merge._
12. **[config]** Add `.gitattributes` with `* text=auto eol=lf` and `*.bat text eol=crlf` to normalize line endings across platforms. More idiomatic than the Prettier `endOfLine: auto` workaround currently in `.prettierrc.json` (which we can leave as a belt-and-suspenders). Prevents the Windows CRLF/LF cycle that broke `pnpm verify` locally yesterday. _Tier: auto-merge (config only)._

## In progress

<!-- Routine moves items here with the PR link when work starts. -->

- **[forms]** Forms brief item 2 — foundations: `entries/_types.ts` (full `FieldBlock` discriminated union per `03-forms.md` §§1–12, `VisibilityCondition` with `equalsOptionValue`, `OptionCategory` union) + `lib/option-list-helpers.ts` (server-side `getOptionsByCategory` + `createOption` server action with slug derivation and collision handling). Branch `routine/forms-foundations`. PR: pending.

## Done

<!-- Auto-archived after merge. Keep the last ~20 for reference; older entries can be pruned. -->

- 2026-05-28 — **[docs]** Forms brief item 1 — spec sync: align `00-plan.md` T13–T17, `01-conventions.md` §1, and `03-forms.md` §§1–18 paths to repo reality (root-level paths, `(authed)` route group, `/entries/<type>/new`); drop Phase-2 `voice_memo_url` reference. Auto-merged in [#9](https://github.com/FTC-23511/md-app/pull/9).
- 2026-05-27 — **[chore]** Consolidate the automation routine — rename `MORNING_ROUTINE.md` → `ROUTINE.md`, fold prep+run, document 3×/weekday schedule. Squash-merged in [#8](https://github.com/FTC-23511/md-app/pull/8).
- 2026-05-27 — **[auth]** Phase 1 auth batch (T09–T12): single-email allowlist in middleware + `/forbidden`, email+password sign-in replacing magic-link, forgot/reset/change-password flow, protected layout top bar. Squash-merged in [#7](https://github.com/FTC-23511/md-app/pull/7).
- 2026-05-27 — **[docs]** Audit `.env.example` (add `ALLOWED_EMAIL`, fix stale magic-link comment) — superseded by #7 (which made the same changes as part of the auth batch). Closed: [#5](https://github.com/FTC-23511/md-app/pull/5).
- 2026-05-26 — **[config]** Untrack `.claude/settings.local.json` and `tsconfig.tsbuildinfo` (add to `.gitignore`). Auto-merged in [#6](https://github.com/FTC-23511/md-app/pull/6).
- 2026-05-26 — **[docs]** Update `docs/phase1/00-plan.md` T05–T08 Deliverables to reference actual migration filenames. Auto-merged in [#4](https://github.com/FTC-23511/md-app/pull/4).
- 2026-05-26 — **[docs]** Fix `docs/SETUP.md` Step 4 magic-link reference. Auto-merged in [#3](https://github.com/FTC-23511/md-app/pull/3).
- 2026-05-26 — **[docs]** Fix `README.md` to use `pnpm` consistently. Auto-merged in [#2](https://github.com/FTC-23511/md-app/pull/2). (Also bundled a Windows-friendly Prettier `endOfLine: auto` config fix.)
- 2026-05-26 — **[meta]** Repo-wide Prettier sweep + expand auto-merge tier rule to cover root-level `*.md` and pure formatting sweeps. Auto-merged in [#1](https://github.com/FTC-23511/md-app/pull/1). (Ad-hoc item; emerged when `pnpm verify` failed on pre-existing format drift.)
