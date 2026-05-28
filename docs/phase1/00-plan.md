# Phase 1 plan: Capture MVP

## Scope

Phase 1 delivers the operational core of the MD data layer. Per `MD_App_Charter.md` §7, the Phase 1 row reads:

> **Phase 1 — Capture MVP** | End of June 2026 (compressed to **end of May 2026** for this build) | Schema for all 10 entry types; capture forms for Tier 1 entries (Session, Outreach, Meeting Notes); basic list view; single-user auth | **Operational definition:** Team can file Tier 1 entries on summer activities.

Phase 1 also includes the **text-file fallback** path. Per `MD_App_Charter.md` §8 risk register, the fallback is a Phase 1 deliverable: when the main UI is unavailable, contributors capture entries as filled-out markdown templates, and the Documentation Captain runs an importer script to ingest them once the app is back. Full spec in `docs/phase1/05-fallback.md`.

The architecture has three load-bearing pieces that distinguish this Phase 1 from a "build three forms" project:

1. **Field block system** (per `docs/phase1/03-forms.md`). Every entry's form is rendered by one generic component from a declarative `EntryDefinition`. Ten field block types are implemented in Phase 1; entry types are configurations of those blocks, not hand-coded forms. Adding entry types in Phase 2+ requires zero new form code.
2. **Schema-driven storage** (per `docs/phase1/02-schema.md`). Every entry table has typed columns for queried fields and a JSONB `extras` column for stored-and-retrieved fields. The same `EntryDefinition` declares which fields go where. Migrations are checked into git and applied via the Supabase CLI.
3. **`option_lists` lookup table** (per `docs/phase1/02-schema.md` §4.2). Nine option groups (event_type, engagement_depth, subsystem, etc.) are stored in one shared table with seed rows. Users add new options via an "Add new..." affordance on every single-/multi-select field. No code changes needed when the team's vocabulary grows.

## What "single-user" means in Phase 1

A single email address is allowlisted at the application layer (in `middleware.ts`). Sign-up is disabled in Supabase Auth — the only way an account exists is manual dashboard creation. The App Lead creates their own account once during setup. Phase 1 auth is email + password (not magic link) for daily-use friction reasons; full reasoning in `docs/phase1/04-auth.md` §2.

The schema includes a `created_by` column on every entry table, referencing `auth.users(id)`. This column gets populated by every Phase 1 insert. Phase 3 RLS policies will key off it; no schema migration required at that point.

## Definition of done for Phase 1

Phase 1 is complete when every item below is true.

- All ten entry-type tables (plus `test_trials` child table) exist in Supabase, created via tracked migrations in `supabase/migrations/`. `supabase db reset` from a clean state runs all migrations cleanly.
- All supporting tables exist: `members` (with auth trigger), `option_lists` (with 49 seed rows across 9 categories), `flags`, `classification_index`, `award_criteria_snapshot`.
- Row Level Security is enabled on every table with a permissive Phase 1 policy (any authenticated user can do anything). Phase 3 will replace these policies.
- Email + password authentication works. Sign-in from the allowlisted email succeeds; sign-in attempts with any other email or wrong password are rejected with a generic "Invalid email or password" message. Forgot-password flow works end-to-end.
- The field block system is built. All ten block types (text, long-text, single-select, multi-select, date, number, person-attribution, story-block, action-items, specialty-triggers) have working renderers. The generic `EntryForm` renders any `EntryDefinition` correctly. Validation is generated from the definition via Zod.
- All three Tier 1 entry definitions (Session Log, Outreach Log, Meeting Notes) are defined and their `/new` pages work end-to-end from the App Lead's perspective: log in, navigate to the form, fill out required fields, submit, and immediately see the new entry in the list view.
- Server-side validation rejects invalid submissions with field-level errors visible in the UI.
- Conditional field visibility (`visibleWhen`) works on the Outreach Log's follow-up-detail fields.
- The "Add new..." affordance on single-/multi-select fields creates new `option_lists` rows and selects them in the form.
- A basic list view shows every entry across all types, sorted by date descending, with a type pill on each row.
- The text-file fallback path works: a filled-out template under `docs/fallback/inbox/` is ingested by `npm run import-fallback` and the entry appears in the list view, marked `created_via = 'fallback_form'`.
- The application is deployed to Vercel at a stable URL (production branch is `main`).
- Environment variables are documented in `.env.example`. Real values are not in the repo.
- The README explains how a new contributor can run the app locally in under fifteen minutes.

When all of these are true, Phase 1 is done and the team can begin filing Tier 1 entries on summer activity per the charter's operational definition.

## Operating context

The single contributor for Phase 1 is the App Lead. The Phase 1 sprint target is **end of May 2026** — ten calendar days from build start. This is compressed from the App Charter's end-of-June target.

Realistic time budget: 40–55 hours over the ten days, averaging 5–6 hours per day. Heavier on weekends. Some tasks will compress with aggressive Claude Code use; some will expand due to stack-newness friction. The largest single task (T13, the field block system) is sized to ~5–7 hours and may benefit from being split across two sittings.

Mentor review is near-real-time during this sprint. With twenty-one tasks and async review, even half-day review delays consume the schedule. Batch PRs by group as described in §"PR batching" below.

## PR batching strategy

To compress review cycles, related tasks land as one PR rather than one PR per task:

| Batch                  | Tasks   | Single PR title                                                     |
| ---------------------- | ------- | ------------------------------------------------------------------- |
| Setup                  | T01–T04 | `phase1: setup batch — scaffold, env, supabase, migration workflow` |
| Schema                 | T05–T08 | `phase1: schema batch — all four migrations`                        |
| Auth                   | T09–T12 | `phase1: auth batch — provider, allowlist, login, layout`           |
| Forms system + entries | T13–T17 | `phase1: forms batch — block system, three entries, list view`      |
| Fallback               | T18–T19 | `phase1: fallback batch — templates and importer`                   |
| Deploy                 | T20–T21 | `phase1: deploy batch — vercel + smoke test`                        |

Each PR's commit history preserves task-level granularity (one commit per task), so reviewers can read at task granularity but approve at batch granularity. Six PRs instead of twenty-one. If a batch is taking too long, splitting back to per-task PRs mid-batch is always an option.

## Sprint plan

Calendar dates assuming start of May 22 and target end of May 31:

| Sprint                         | Days      | Tasks   | Hours  | Key deliverable                                                  |
| ------------------------------ | --------- | ------- | ------ | ---------------------------------------------------------------- |
| **A** — Setup + schema         | May 22–24 | T01–T08 | ~12–15 | All 10 entry tables in Supabase, migrations tracked, RLS enabled |
| **B** — Auth                   | May 25–26 | T09–T12 | ~8–10  | Email-password sign-in works end-to-end with allowlist           |
| **C** — Forms system + entries | May 27–29 | T13–T17 | ~14–18 | Three Tier 1 forms working through the renderer; list view       |
| **D** — Fallback + deploy      | May 30–31 | T18–T21 | ~6–9   | Templates + importer working; production live and smoke-tested   |

Day 31 is the buffer. If a sprint slips, the natural target to defer is the fallback (T18–T19) into early June — the main UI is the real capture surface, and the fallback is for outages that aren't actively occurring on day one.

## Task list

Tasks numbered in dependency order. Each task is its own git branch (`phase1/T<n>-<slug>`) and its own commit. Tasks within the same batch land in one PR.

### Setup batch

> **Status as of 2026-05-26: complete via chat-to-repo planning.** T01–T04 landed with the initial scaffold; the local toolchain is `pnpm` (not `npm` as some task descriptions below say — the plan was written before that decision firmed up). Treat the descriptions in this section as reference for future Claude sessions, not as work to redo.

#### T01. Initialize Next.js scaffold

**Description.** Create the project with Next.js (App Router, TypeScript), Tailwind CSS, and shadcn/ui set up. Use `create-next-app` with TypeScript and Tailwind selected. Initialize shadcn/ui via its CLI; install a minimal initial component set (Button, Input, Label, Textarea, Select, Checkbox, RadioGroup, Card, Popover, Form).

**Deliverables.** `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx` (placeholder redirect to `/login`), `src/components/ui/` populated.

**Acceptance.** `npm run dev` starts the dev server with no errors. The placeholder page renders. `tsconfig.json` has `"strict": true`. shadcn primitives import correctly (test by adding a Button to the placeholder page).

**References.** `docs/phase1/01-conventions.md` §1 for folder structure rules.

**Est. time.** 1–2 hours.

#### T02. Configure environment and tooling

**Description.** Set up `.gitignore` (ignore `.env.local`, `node_modules`, `.next`, etc.). Create `.env.example` with placeholder keys for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_EMAIL`. Configure ESLint with the Next.js preset. Add Prettier with a minimal config. Verify `tsconfig.json` strict mode.

**Deliverables.** `.gitignore`, `.env.example`, ESLint config, `.prettierrc`, `.prettierignore`.

**Acceptance.** `npm run lint` passes on the scaffold. `npm run build` succeeds.

**Est. time.** 30 min – 1 hour.

#### T03. Set up Supabase project

**Description.** Create a new project on supabase.com (free tier). Install the Supabase CLI locally. Run `supabase init` in the repo to create `supabase/config.toml`. Run `supabase link --project-ref <project-ref>` to associate the local repo with the remote project. Copy the project URL, anon key, and service role key into `.env.local`.

**Deliverables.** `supabase/config.toml`, `.env.local` populated locally with real keys (not committed), project visible on supabase.com.

**Acceptance.** `supabase status` shows the linked project.

**References.** `docs/phase1/02-schema.md` §1 walks through Supabase CLI setup if unfamiliar.

**Est. time.** 1 hour.

#### T04. Verify migration workflow

**Description.** Create a trivial first migration to verify the workflow end-to-end: `supabase migration new baseline`, leave it empty (or add `-- baseline` as the file's only line), then `supabase db push`. Confirm migration applied via the dashboard.

**Deliverables.** `supabase/migrations/<timestamp>_baseline.sql` (intentionally near-empty).

**Acceptance.** Migration shows as applied in `supabase migration list`. The team is confident `supabase db push` works.

**Est. time.** 30 min.

### Schema batch

> **Status as of 2026-05-26: complete, with a richer final shape than the original specs in T05–T08 describe.** The chat-to-repo planning produced **8 migrations** (`20260521000001`–`20260521000008`) using a base `entries` table + 10 detail tables (1:1, FK cascade) rather than 10 flat entry tables. RLS came in as **full role-based access** (5 roles + 24h edit window + public-showcase mode) — what `04-auth.md` §9 had earmarked for Phase 3. The app layer (middleware, forms) is still single-user per Phase 1; the schema is just future-ready. Read the migration file headers in `supabase/migrations/` for the actual structure. The descriptions in T05–T08 below are preserved as historical context only.

#### T05. Migration 001: shared trigger function

**Description.** Create the `set_updated_at()` trigger function. This is the one function shared across every table for `updated_at` maintenance.

**Deliverables.** `supabase/migrations/20260521000001_extensions_and_helpers.sql` — landed as `pgcrypto` extension + `current_member_id()` helper. The trigger function described above lives in `20260521000005_triggers.sql` (covered by T08 below) rather than this migration; the chat-to-repo planning split functions into their natural file by lifecycle stage.

**Acceptance.** `supabase db reset` runs cleanly. `SELECT proname FROM pg_proc WHERE proname = 'set_updated_at';` returns the function.

**References.** `docs/phase1/02-schema.md` §3.

**Est. time.** 30 min.

#### T06. Migration 002: supporting tables + seed data + auth trigger

**Description.** Create the supporting tables: `members` (with the `handle_new_auth_user` trigger on `auth.users`), `option_lists` (with all 49 seed rows from charter-defined option groups), `flags`, `classification_index`, `award_criteria_snapshot`. Apply the `set_updated_at` trigger to each.

**Deliverables.** `supabase/migrations/20260521000002_core_tables.sql` — landed with `member_role` enum + `teams`, `seasons`, `subsystems`, `members` tables (richer than the original spec's `members` + `option_lists` + `flags` + `classification_index` + `award_criteria_snapshot` flat list). The seed data lives in `20260521000007_seed_reference_data.sql` (T08); cross-cutting tables (flags, classification, awards) live in `20260521000003_entries_and_crosscutting.sql` (T07).

**Acceptance.** Migration applies cleanly. All five tables visible in dashboard. `SELECT category, COUNT(*) FROM option_lists GROUP BY category` returns the expected seed counts per category. The auth trigger is verified by manually creating a user in the Supabase dashboard and confirming a matching `members` row appears.

**References.** `docs/phase1/02-schema.md` §4.

**Est. time.** 2–3 hours.

#### T07. Migration 003: all 10 entry-type tables + `test_trials`

**Description.** Create the ten entry-type tables: `session_logs`, `outreach_logs`, `meeting_notes`, `comp_recaps`, `decision_logs`, `hw_change_logs`, `sw_change_logs`, `test_logs`, `contact_logs`, `subsystem_handoffs`. Plus the `test_trials` child table with `ON DELETE CASCADE` from `test_logs`. Each table follows the conventions in `docs/phase1/02-schema.md` §2 (common columns + entry-specific typed columns + extras JSONB + entry_state). Apply the `set_updated_at` trigger to each.

**Deliverables.** Split across two migrations: `supabase/migrations/20260521000003_entries_and_crosscutting.sql` (base `entries` table + cross-cutting `flags`, `classification_index`, `awards`) and `supabase/migrations/20260521000004_detail_tables.sql` (the 10 detail tables, 1:1 with `entries` via `entry_id` PK+FK with cascade delete, including `test_logs` with raw-data JSONB that powers the auto-compute trigger in T08).

**Acceptance.** Migration applies cleanly. All eleven tables visible. `\d session_logs` (or dashboard equivalent) shows the expected columns and types. `INSERT INTO session_logs (session_date, session_lead, what_worked_on) VALUES (CURRENT_DATE, 'test', 'test')` succeeds.

**References.** `docs/phase1/02-schema.md` §5.

**Est. time.** 3–4 hours. The largest schema task; consider splitting across two sittings.

#### T08. Migration 004: indexes + RLS + permissive Phase 1 policies

**Description.** Add indexes for query patterns: B-tree on every FK, `created_at DESC` on every entry table, partial indexes on `WHERE deleted_at IS NULL`, plus the table-specific indexes (test_label time-series, commit_hash lookup, flags parent lookup, classification award lookup, option_lists category lookup). Enable RLS on every table and add the `phase1_authenticated_all` permissive policy per table.

**Deliverables.** Split across four migrations: `20260521000005_triggers.sql` (audit revisions, test-log auto-compute, `updated_at` touches), `20260521000006_rls_policies.sql` (**full role-based** RLS — 5 roles + 24h author edit window + public showcase, richer than the original spec's permissive Phase 1 policies), `20260521000007_seed_reference_data.sql` (team + season + subsystems + awards), and `20260521000008_grants.sql` (base table/sequence grants for `authenticated` and read-only for `anon`).

**Acceptance.** Migration applies cleanly. `EXPLAIN SELECT * FROM session_logs WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10` shows the partial index being used. `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('session_logs', ...)` shows `relrowsecurity = true` for every table. Supabase advisor shows no "RLS disabled" or "unindexed foreign key" warnings.

**References.** `docs/phase1/02-schema.md` §6.

**Est. time.** 1.5–2 hours.

### Auth batch

#### T09. Configure Supabase Auth (email + password)

**Description.** In the Supabase dashboard, enable email/password auth. Disable signup. Disable email confirmation. Configure site URL and redirect URLs for local and production. Create the App Lead's account manually via "Add user → Create new user" with "Auto Confirm User" checked.

**Deliverables.** Supabase Auth settings configured (cannot be code; document the settings in the PR description with screenshots). One user row exists in `auth.users` (the App Lead's account).

**Acceptance.** Manual sign-in via the Supabase dashboard's auth tool works with the App Lead's email and password.

**References.** `docs/phase1/04-auth.md` §3.

**Est. time.** 30 min – 1 hour.

#### T10. Implement single-email allowlist in middleware

**Description.** Write `middleware.ts` at the project root. On every request to a protected route, check that the authenticated user's email matches `process.env.ALLOWED_EMAIL`. If not authenticated, redirect to `/login`. If authenticated with the wrong email, sign out and redirect to `/forbidden`.

**Deliverables.** `middleware.ts`, `src/app/(auth)/forbidden/page.tsx`, `src/lib/supabase/server.ts` (server-side client factory), `src/lib/supabase/client.ts` (browser client factory if needed).

**Acceptance.** Attempting to access a protected route while unauthenticated lands on `/login`. Attempting while authenticated with a non-allowlisted email (testable via dashboard-created second user) lands on `/forbidden`.

**References.** `docs/phase1/04-auth.md` §4.

**Est. time.** 2–3 hours.

#### T11. Build login page + email/password sign-in + forgot-password flow

**Description.** Build the login page at `/login` with email + password inputs. Submit via server action that calls `signInWithPassword`. Build the forgot-password page at `/forgot-password`, the password-reset callback at `/auth/reset-password`, and the change-password page at `/change-password`. All per `docs/phase1/04-auth.md` §§5–6.

**Deliverables.** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/actions.ts`, `src/app/(auth)/forgot-password/page.tsx` + actions, `src/app/auth/reset-password/route.ts`, `src/app/(auth)/change-password/page.tsx` + actions.

**Acceptance.** Sign-in with the allowlisted email and correct password succeeds and redirects to `/list`. Sign-in with wrong password shows generic error. Forgot-password flow sends reset email; clicking the link lands on `/change-password`; setting a new password works; signing back in with the new password works.

**References.** `docs/phase1/04-auth.md` §§5–6.

**Est. time.** 2–3 hours.

#### T12. Build protected route wrapper

**Description.** Create the `(app)` route group with a layout. The layout confirms authentication server-side (defense in depth beyond middleware), renders a top bar with the user's email and a sign-out button, and renders the child page.

**Deliverables.** `src/app/(app)/layout.tsx`, sign-out server action.

**Acceptance.** The layout renders correctly on `/list`. Sign-out button works (clears session, redirects to `/login`).

**References.** `docs/phase1/04-auth.md` §§7–8.

**Est. time.** 1–2 hours.

### Forms-and-entries batch

#### T13. Build field block system + generic renderer + helpers

**Description.** This is the largest single task in Phase 1 and the architectural foundation for every entry type. Build:

- `src/entries/_types.ts` — `EntryDefinition`, `FieldBlock` discriminated union, all ten block type definitions, `VisibilityCondition` shape.
- `src/components/entry-form/EntryForm.tsx` — the generic renderer.
- `src/components/entry-form/FieldRenderer.tsx` — type-switching block renderer.
- `src/components/entry-form/blocks/` — one file per block type. Ten files total. Each implements a controlled or uncontrolled input per the patterns in `docs/phase1/03-forms.md` §§3–12.
- `src/lib/validate-entry.ts` — builds Zod schemas from definitions.
- `src/lib/insert-entry.ts` — generic insert helper splitting column/extras.
- `src/lib/option-list-helpers.ts` — server-side fetch by category, "Add new..." server action.
- Visibility-condition evaluator inside the renderer.
- Option-list loading wrapper (a server component that fetches all needed categories and passes options to the renderer).

Use a stub `notes` entry definition with one of each block type for development testing. The stub is removed in T14 once Session Log goes live.

**Deliverables.** All the files above. A working stub demo at `/dev/notes/new` (if you keep it; otherwise removed before commit).

**Acceptance.** Each block type renders without errors. The renderer wires submit to a server action; the action validates and inserts; validation errors surface inline. Conditional visibility works. The "Add new..." popover creates a new `option_lists` row and selects it.

**References.** `docs/phase1/03-forms.md` §§1–12, `01-conventions.md` §5.

**Est. time.** 6–8 hours. Strong candidate for splitting across two sittings; the natural break is "blocks + renderer + visibility done" → "validate-entry + insert-entry + option resolution done."

#### T14. Define Session Log entry + page

**Description.** Write the Session Log entry definition in `src/entries/session-log.ts` per `docs/phase1/03-forms.md` §13. Add to `src/entries/_registry.ts`. Build the route page at `src/app/(app)/sessions/new/page.tsx` (a thin file: import the renderer, the definition, the action; render). Export the `sessionLogBodyMapping` for the fallback importer (used in T19; can be a stub for now).

**Deliverables.** `src/entries/session-log.ts`, `src/entries/_registry.ts`, `src/app/(app)/sessions/new/page.tsx`.

**Acceptance.** From `/list`, navigating to "New Session Log" loads the form. Filling it out with valid data inserts a row in `session_logs` and redirects to `/list`. Filling specialty-entry checkboxes with owner/subject works; the data lands in `extras.specialty_entries`. Submitting required fields blank shows red error text under each missing field.

**References.** `docs/phase1/03-forms.md` §13.

**Est. time.** 1.5–2 hours.

#### T15. Define Outreach Log entry + page

**Description.** Write the Outreach Log entry definition per `docs/phase1/03-forms.md` §14. This is the most complex entry — uses `story-block`, `multi-select` with custom note, and `visibleWhen` conditional fields. Add to registry. Build the route page. Export body mapping.

**Deliverables.** `src/entries/outreach-log.ts`, registry update, `src/app/(app)/outreach/new/page.tsx`.

**Acceptance.** Form renders with all 22 fields. Engagement-depth requires either ≥1 checkbox OR a non-empty custom note. Three stories required, all named with permission status. Follow-up-type changes trigger conditional fields. Submitting with all required fields inserts a row in `outreach_logs` with the expected typed columns and `extras` structure.

**References.** `docs/phase1/03-forms.md` §14.

**Est. time.** 2.5–3 hours.

#### T16. Define Meeting Notes entry + page

**Description.** Write the Meeting Notes entry definition per `docs/phase1/03-forms.md` §15. Add to registry. Build the route page. Export body mapping.

**Deliverables.** `src/entries/meeting-notes.ts`, registry update, `src/app/(app)/meetings/new/page.tsx`.

**Acceptance.** Form renders, ≥1 attendee required, action items optional, submitting inserts a row in `meeting_notes`.

**References.** `docs/phase1/03-forms.md` §15.

**Est. time.** 1.5–2 hours.

#### T17. Build list view across entry types

**Description.** Build `/list` (which is also the post-login landing page) showing every active entry across all three Tier 1 types, sorted by `created_at DESC`. Each row shows: a colored type pill, the date, the entry's headline summary (from the definition's `listSummary` function), and the filer's email. Empty state is handled ("No entries yet — file one above").

**Deliverables.** `src/app/(app)/list/page.tsx`, server-side query function in `src/lib/queries.ts`, `listSummary` exports added to each entry definition file.

**Acceptance.** All entries from all three forms appear, sorted by date descending. Each row links to a placeholder `/<type>/<id>` detail page (Phase 2 builds the real detail view; Phase 1 just renders "Detail view: Phase 2"). Empty state renders correctly when no entries exist.

**References.** `docs/phase1/03-forms.md` §18.

**Est. time.** 2 hours.

### Fallback batch

#### T18. Build fallback templates + workflow docs

**Description.** Create the three fallback templates per `docs/phase1/05-fallback.md` §4. Create `docs/fallback/README.md` (user-facing instructions for filing during outage — for contributors who aren't developers; covers the workflow in `05-fallback.md` §6 in plain language). Create `docs/fallback/inbox/.gitkeep` so the inbox directory exists in the repo.

**Deliverables.** `docs/fallback/templates/session-log.md`, `outreach-log.md`, `meeting-notes.md`. `docs/fallback/README.md`. `docs/fallback/inbox/.gitkeep`.

**Acceptance.** Templates copy-paste cleanly into a text editor. Filling one out by hand produces a readable, valid document.

**References.** `docs/phase1/05-fallback.md` §§3–4.

**Est. time.** 1.5–2 hours.

#### T19. Build fallback importer + smoke test

**Description.** Build the importer script at `scripts/fallback/import.ts` per `docs/phase1/05-fallback.md` §5. Implement the body-section parsers in `scripts/fallback/parsers/` (one per composite block type). Add the `<entry>BodyMapping` exports to each entry definition file. Add an `import-fallback` npm script. Smoke test: fill one of each template by hand, run the importer, confirm three entries appear in `/list` marked with `created_via = 'fallback_form'`.

**Deliverables.** `scripts/fallback/import.ts`, `scripts/fallback/parsers/*.ts` (one per composite type), body mappings added to the three entry definitions, `package.json` updated with the script.

**Acceptance.** `npm run import-fallback -- docs/fallback/inbox/*.md` ingests three test files successfully. The three new entries appear in `/list`. Files renamed to `*.imported.md`. Re-running the importer on the renamed files results in zero new inserts (importer skips already-imported files — or, equivalently, the renamed files don't match the `*.md` glob).

**References.** `docs/phase1/05-fallback.md` §§5–7.

**Est. time.** 3–4 hours.

### Deploy batch

#### T20. Connect Vercel to GitHub repo

**Description.** Connect the repo to Vercel. Configure environment variables on Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALLOWED_EMAIL`). Note that `SUPABASE_SERVICE_ROLE_KEY` is _not_ set on Vercel — it lives only in the Captain's local `.env.local` for the fallback importer. Set the production branch to `main`. Update Supabase Auth's site URL and redirect URLs to include the Vercel production URL.

**Deliverables.** Vercel project linked, env vars configured, first production deployment from `main` succeeds.

**Acceptance.** A push to `main` triggers a deployment. The production URL is reachable. Sign-in works in production.

**Est. time.** 1 hour.

#### T21. Production smoke test

**Description.** From a fresh browser, sign in via email/password to the production URL. File one entry of each type (Session, Outreach, Meeting). Confirm each appears in the list view. Sign out. Attempt sign-in with a non-allowlisted email; confirm `/forbidden` redirect. Verify the forgot-password flow on production by triggering it on a test account (then deleting the test account).

**Deliverables.** Comment in the PR documenting each step verified. Three real production entries visible in the database.

**Acceptance.** End-to-end sign-in, capture, and list view work in production. Phase 1 is complete.

**Est. time.** 30 min – 1 hour.

## Risk callouts specific to Phase 1

| Risk                                                                                   | What to watch                                           | Mitigation                                                                                                                                                          |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack-newness slows delivery                                                           | Estimated hours bleed over                              | Ask in PR comments instead of guessing; consult conventions doc before writing patterns from scratch                                                                |
| Field block system is the largest single task; underestimating it derails the schedule | T13 takes longer than the 6–8h estimate                 | Split T13 across two sittings if it's running long: pause after blocks-and-renderer are working with a stub definition, resume on validate/insert/option-resolution |
| Schema drift between migrations and dashboard                                          | Manual dashboard edits                                  | Hard rule: all schema changes via migrations only. T04 verifies the workflow before any real schema lands                                                           |
| Auth tangle                                                                            | Email/password not working in production                | T11 explicitly tests the full flow; T21 retests in production. Separate local and production redirect URLs                                                          |
| Service-role key leaks                                                                 | Importer needs the service key on the Captain's machine | Service key lives only in `.env.local` on the App Lead's machine; never on Vercel; never in the repo. Rotate immediately if accidentally exposed                    |
| Scope creep                                                                            | Adding "small" features outside the plan                | This is the most common Phase 1 failure mode; the absolute rules in `CLAUDE.md` exist precisely for this                                                            |
| Mentor review delay during sprint                                                      | PRs sit, schedule blows up                              | Batched PRs (six total, not twenty-one) reduce review cycles; near-real-time mentor commitment for this sprint                                                      |
| Fallback path is untested under actual outage                                          | Discovered broken when needed                           | T19 smoke test exercises the path end-to-end; Friday 15 reviews any unprocessed files weekly even when nothing is broken                                            |

## Phase 1 → Phase 2 handoff

When Phase 1 closes, what Phase 2 inherits:

- Working schema for all ten entry types plus `test_trials`. No migration needed to add Tier 2 capture forms — the tables already exist.
- Working field block system. Adding new entry types in Phase 2 = create one definition file + create one route page (5 lines) + add to registry. No new form code.
- Working option_lists infrastructure. Adding new option groups in Phase 2 = update the CHECK constraint + seed rows. The "Add new..." affordance already works for any single/multi-select against the table.
- Working email/password auth. Phase 3 extends to multi-user; Phase 2 uses the existing single-user setup.
- Working text-file fallback pattern. Phase 2 adds templates for new Tier 2 entry types using the same template format; the importer extends automatically because it reads entry definitions.
- A deployed, exercised application that the team is using for summer activity.

What Phase 2 adds:

- Tier 2 entry definitions and capture pages (Decision Log, Hardware Change Log, Software Change Log, Test Log with `test_trials` UI, Contact Log)
- Auto-compute on Test Log statistics (mean, std dev, 95% CI, last-run delta)
- Photo upload (UI for the existing schema's photo URL fields)
- AI-driven Software Change Log integration (full spec in `docs/charters/MD_SCL_AI_Integration.md`)
- The `flags` table writes from specialty-trigger UI (with backfill from existing entries' `extras.specialty_entries`)
- Entry detail pages (the `/list` row clicks currently land on a Phase 2 placeholder)
- Edit-own-entry within 24h functionality

Phase 2 is not a rewrite. It is an extension. The Phase 1 architecture is designed so Phase 2 features are additive.

## Progress tracking

Check off each task as it lands in `main`. Add the PR link.

### Sprint A — Setup + schema

- [x] T01. Initialize Next.js scaffold — landed via chat-to-repo planning (commit `545e6c8`)
- [x] T02. Configure environment and tooling — landed via chat-to-repo planning (commit `545e6c8`)
- [x] T03. Set up Supabase project — done manually per `docs/SETUP.md`
- [x] T04. Verify migration workflow — confirmed by Sprint A migrations applying cleanly
- [x] T05. Migration 001: extensions + helpers — `supabase/migrations/20260521000001_extensions_and_helpers.sql`
- [x] T06. Migration 002: core enums + reference tables — `..._000002_core_tables.sql`
- [x] T07. Migration 003 + 004: base entries + 10 detail tables — `..._000003_entries_and_crosscutting.sql`, `..._000004_detail_tables.sql`
- [x] T08. Migration 005 + 006 + 007 + 008: triggers, RLS, seed data, grants — `..._000005`..`_000008`

### Sprint B — Auth

- [x] T09. Configure Supabase Auth (email + password) — manual dashboard step (dev + prod projects)
- [x] T10. Implement single-email allowlist in middleware — PR #7
- [x] T11. Build login + email/password sign-in + forgot-password — PR #7 (replaced the earlier magic-link scaffold)
- [x] T12. Build protected route wrapper — PR #7

### Sprint C — Forms system + entries

- [ ] T13. Build field block system + renderer + helpers — PR: \_\_\_
- [ ] T14. Define Session Log entry + page — PR: \_\_\_
- [ ] T15. Define Outreach Log entry + page — PR: \_\_\_
- [ ] T16. Define Meeting Notes entry + page — PR: \_\_\_
- [ ] T17. Build list view across entry types — PR: \_\_\_

### Sprint D — Fallback + deploy

- [ ] T18. Build fallback templates + workflow docs — PR: \_\_\_
- [ ] T19. Build fallback importer + smoke test — PR: \_\_\_
- [ ] T20. Connect Vercel to GitHub repo — PR: \_\_\_
- [ ] T21. Production smoke test — PR: \_\_\_
