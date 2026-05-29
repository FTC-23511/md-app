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

From brief [`docs/briefs/2026-05-28-forms-rev2.md`](briefs/2026-05-28-forms-rev2.md) — Forms + entries (T13–T17), path B (migrate to spec's architecture). **Items 1–3 are approval-required (schema migrations) and ship as separate PRs for reversibility.** Items 4+ are auto-merge.

1. **[schema]** Forms rev2 item 1 — Migration A: drop legacy. `supabase/migrations/20260528000001_drop_legacy_schema.sql` drops all auth-batch detail/cross-cutting tables (`entries`, `entry_revisions`, `entry_attendees`, `media_attachments`, `flags`, `action_items`, `awards`, `award_criteria`, `classification_tags`, all three Tier-1 + seven Tier-2 detail tables, `outreach_stories`, `subsystems`, `teams`, `seasons`, `subsystem_leads`) + ENUM types + the `handle_new_auth_user` trigger; alters `members` to drop `name`/`role`/`team_id` and add `display_name`. _**Tier: approval-required** — touches `supabase/migrations/`._
2. **[schema]** Forms rev2 item 2 — Migration B: option*lists. `supabase/migrations/20260528000002_option_lists.sql` per `02-schema.md` §§4.2–4.3 — `option_lists` table + 8 categories of seed data. ***Tier: approval-required.**\_
3. **[schema]** Forms rev2 item 3 — Migration C: Phase 1 detail tables + flags + Phase 4 placeholders. `supabase/migrations/20260528000003_phase1_tables.sql` creates `session_logs`, `outreach_logs`, `meeting_notes` per spec §§5.1–5.3 (with `extras jsonb` and option*lists FKs); plus `flags` per §4.4; plus `classification_index` + `award_criteria_snapshot` per §§4.5–4.6 (Phase 4 use, Phase 1 schema); permissive Phase 1 RLS. ***Tier: approval-required.**\_
4. **[fix]** Forms rev2 item 4 — code unblock: rewrite `app/(authed)/dashboard/page.tsx` to query new `members(email, display_name)` shape; stub `app/showcase/page.tsx` with a Phase-4 placeholder; delete `lib/schemas/session-log.ts`. _Tier: auto-merge._
5. **[docs]** Forms rev2 item 5 — finish the spec-vs-reality sync the rev1 item 1 started (carry remaining `src/` references in `00-plan.md` T03/T09–T12, `01-conventions.md` §§3/5/6, `02-schema.md` §9, `04-auth.md`, `05-fallback.md`). _Tier: auto-merge._
6. **[forms]** Forms rev2 item 6 — foundations: `entries/_types.ts` (full `FieldBlock` union per `03-forms.md` §§1–12, `VisibilityCondition` with `equalsOptionValue`, `OptionCategory` union) + `lib/option-list-helpers.ts` (server-side `getOptionsByCategory` + `createOption` server action). _Tier: auto-merge._
7. **[forms]** Forms rev2 item 7 — primitive blocks: `components/entry-form/blocks/TextBlock.tsx`, `LongTextBlock.tsx`, `DateBlock.tsx`, `NumberBlock.tsx`. _Tier: auto-merge._
8. **[forms]** Forms rev2 item 8 — select blocks: `SingleSelectBlock.tsx` + `MultiSelectBlock.tsx` + "Add new…" popover. _Tier: auto-merge._
9. **[forms]** Forms rev2 item 9 — composite blocks part 1: `PersonAttributionBlock.tsx` + `ActionItemsBlock.tsx`. _Tier: auto-merge._
10. **[forms]** Forms rev2 item 10 — composite blocks part 2: `StoryBlock.tsx` + `SpecialtyTriggersBlock.tsx`. _Tier: auto-merge._
11. **[forms]** Forms rev2 item 11 — renderer: `EntryForm.tsx` + `FieldRenderer.tsx` + `visibleWhen` evaluator. _Tier: auto-merge._
12. **[forms]** Forms rev2 item 12 — validate + insert helpers: `lib/validate-entry.ts` + `lib/insert-entry.ts`. _Tier: auto-merge._
13. **[forms]** Forms rev2 item 13 — T14 Session Log: `entries/session-log.ts` + `entries/_registry.ts` + `app/(authed)/entries/sessions/new/page.tsx`. _Tier: auto-merge._
14. **[forms]** Forms rev2 item 14 — T15 Outreach Log: `entries/outreach-log.ts` + registry update + `app/(authed)/entries/outreach/new/page.tsx`. _Tier: auto-merge._
15. **[forms]** Forms rev2 item 15 — T16 Meeting Notes: `entries/meeting-notes.ts` + registry update + `app/(authed)/entries/meetings/new/page.tsx`. _Tier: auto-merge._
16. **[forms]** Forms rev2 item 16 — T17 list view: `app/(authed)/entries/list/page.tsx`, `lib/queries.ts` with `listAllEntries()`, `listSummary` exports, type-pill component, empty state, placeholder detail route, dashboard wiring. _Tier: auto-merge._
17. **[config]** Add `.gitattributes` with `* text=auto eol=lf` and `*.bat text eol=crlf` to normalize line endings across platforms. More idiomatic than the Prettier `endOfLine: auto` workaround currently in `.prettierrc.json` (which we can leave as a belt-and-suspenders). Prevents the Windows CRLF/LF cycle that broke `pnpm verify` locally yesterday. _Tier: auto-merge (config only)._

## In progress

<!-- Routine moves items here with the PR link when work starts. -->

- **[schema]** Forms rev2 item 1 — Migration A (drop legacy). Branch `routine/forms-migration-a-drop-legacy`. PR: pending. **Approval-required.**

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
