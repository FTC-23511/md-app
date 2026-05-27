# CLAUDE.md

Read every session before starting. Short by design.

## What this is

MD-App: data layer for our FTC team's documentation system (Maximum Documentation, MD). Solves capture latency. Code is built so portfolio is curated from complete record, not reconstructed from memory.

## Who you're working with

The App Lead is **not a programmer** and wants to be **as hands-off as physically possible** — they multi-task by delegating work to automation. Behave accordingly:

- **Never make them read code or run bash.** They verify changes by clicking the Vercel preview deployment, not by reading diffs.
- **Don't ask permission for routine commands.** Permissions are broad (`Bash(*)` + a deny list for catastrophic ops in `.claude/settings.local.json`, which is gitignored). Run autonomously. Only stop for genuine product decisions or approval-required PRs (per `docs/MORNING_ROUTINE.md`).
- **Batch human input.** Anything needing their review goes into one compact list via `/human-task-list`, never scattered questions through a session.
- **Do the work; don't narrate how to do it.** Default to action. Long explanations are friction.

## How to operate

Two tracks:

1. **Maintenance / cleanup** → the automation pipeline. `docs/BACKLOG.md` is the queue; `docs/MORNING_ROUTINE.md` is the source of truth for routine behavior (tier rules, hard rules). Slash commands: `/prep-backlog` (queue work), `/run-routine` (process one item), `/human-task-list` (review digest). A scheduled remote routine runs weekday 8 AM PT. Read `docs/MORNING_ROUTINE.md` before any routine work.
2. **Phase 1 sprint features** (auth, forms, fallback — Sprints B/C/D) → plan in Claude Chat, produce a brief in `docs/briefs/` (template at `docs/briefs/_TEMPLATE.md`), hand to Claude Code. Then: branch `phase1/T<n>-<slug>`, one task one commit, batch related tasks into one PR per `00-plan.md` §"PR batching strategy." See `docs/DEV_WORKFLOW.md`.

Sprint A (T01–T08, setup + schema) is **already done** — the existing 8 migrations came in richer than the original plan (full RBAC RLS, base `entries` + 10 detail tables). The app layer stays single-user per Phase 1; the schema is just future-ready.

## Read map

Do not read full files. Use grep + `view --view-range`. Jump to sections.

| Need                                                        | File                                     | Section                                                                   |
| ----------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Pick a task / track progress                                | `docs/phase1/00-plan.md`                 | task list; sprint plan                                                    |
| Code patterns (folder, naming, server actions, Zod, errors) | `docs/phase1/01-conventions.md`          | §1–§4 universal; §5 field blocks; §11 workflows; §13 ask-don't-guess list |
| Schema, migrations, column-vs-JSONB rule                    | `docs/phase1/02-schema.md`               | §2 conventions; §3–§6 per migration; §8 column rule; §9 workflows         |
| Field block types, entry definitions, renderer              | `docs/phase1/03-forms.md`                | §1–§2 types; §3–§12 block library; §13–§15 entries                        |
| Auth (email/password, allowlist, forgot-password)           | `docs/phase1/04-auth.md`                 | §3 dashboard config; §4 middleware; §5 login; §6 reset                    |
| Text-file fallback templates + importer                     | `docs/phase1/05-fallback.md`             | §3 format; §5 importer                                                    |
| What MD captures (data semantics)                           | `docs/charters/MD_Project_Charter.md`    | **NEVER read whole. Grep for entry name (e.g. SOP-05) or topic.**         |
| Architectural decisions, phased build                       | `docs/charters/MD_App_Charter.md`        | **NEVER read whole. Grep for topic.**                                     |
| Phase 2 AI integration                                      | `docs/charters/MD_SCL_AI_Integration.md` | **NEVER read whole. Phase 2 only — do not implement in Phase 1.**         |

## Phase

Phase 1. Capture MVP. Target end of May 2026. Definition of done in `00-plan.md`.

## Absolute rules

1. **Phase 1 scope only.** Do not add features not in the plan. Doing more than asked is this project's most common failure mode.
2. **No new dependencies.** Stack fixed: Next.js, TS, Tailwind, shadcn/ui, Supabase JS, Zod. Want another lib? Ask in PR. Default no.
3. **Migrations as code.** All schema via `supabase/migrations/*.sql`. Never edit tables in Supabase dashboard — silent drift, `db push` fails later.
4. **No secrets in repo.** `.env.local` gitignored. `SUPABASE_SERVICE_ROLE_KEY` never in any `NEXT_PUBLIC_*` var. Leak → rotate immediately.
5. **TypeScript strict.** No `any` unless commented why.
6. **No tests in Phase 1** unless the task asks. Manual smoke tests per task acceptance criteria are enough.

## Deferred to later phases (do not implement)

Phase 2: photo upload, voice memo, AI Software-Change-Log integration, Tier 2 entry forms (Decision/HW/SW/Test/Contact Logs), auto-compute on Test Logs, entry detail pages.

Phase 3: multi-user auth, role-based access, strict RLS policies (Phase 1 has permissive `FOR ALL TO authenticated USING (true)` — Phase 3 replaces, not adds), Discord webhooks, edit-within-24h.

Phase 4: classification pass UI, mobile polish, export endpoint, Subsystem Handoff workflow.

Phase 5+: entry-type UI builder.

Rationale lives in `MD_App_Charter.md` §7. Don't read whole charter; grep "Phase 2" / "Phase 3" / etc. if needed.

## Charter sync

Charters in `docs/charters/` are mirrors. Source of truth lives in team's Claude project. Don't edit them here. If code contradicts a charter, flag in PR; team decides which side updates. Charter version on each file is the sync key.

## Branches and PRs

Branch: `phase1/T<n>-<slug>`. PR title: `phase1: T<n> <task name>`. PR body: link to task in `00-plan.md`, bullet what changed, confirm each acceptance criterion. Smaller PRs review faster; if a single task generates >500 lines of substantive code, that's a signal to ask whether the task needs splitting.

## Environment (non-obvious facts that have bitten us)

- **Windows machine.** `.prettierrc.json` has `endOfLine: auto` so `pnpm verify` passes locally despite Git's CRLF conversion — do not remove it. CI (Linux) and local (Windows) both pass with it.
- **pnpm, not npm.** `pnpm install`, `pnpm dev`, `pnpm verify` (the full gate: typecheck + lint + format + test + build).
- **`gh` CLI** is at `/c/Program Files/GitHub CLI`. Auth via `GH_TOKEN` from Git Credential Manager:
  ```
  export PATH="/c/Program Files/GitHub CLI:$PATH"
  export GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep "^password=" | cut -d= -f2)
  ```
  If `GH_TOKEN` comes back empty, the user must push something to trigger the credential prompt — surface it, don't guess.
- **Repo is public** (for free Vercel). No secrets in briefs, docs, or commits.
- **`main` has branch protection** (PR + 2 status checks required). The routine/owner merges via `gh pr merge --squash --delete-branch --admin`. Direct pushes to main bypass via admin and are fine for the sole owner.
- **BACKLOG state changes commit directly to main**, never in feature branches — prevents conflicts when multiple items are in flight.
- **Never chain destructive commands** (e.g. `cd x && rm -rf y`). The deny list catches direct invocations, not compounds.

## When uncertain

Ask in the PR. Cost of asking = one comment. Cost of guessing silently = rework or security incident. Full ask-or-decide list in `01-conventions.md` §13. But default toward autonomous action — see "Who you're working with." Reserve questions for product decisions and approval-required PR reviews.
