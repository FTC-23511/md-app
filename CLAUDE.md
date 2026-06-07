# CLAUDE.md

Read every session before starting. Short by design.

## What this is

MD-App: data layer for our FTC team's documentation system (Maximum Documentation, MD). Solves capture latency. Code is built so portfolio is curated from complete record, not reconstructed from memory.

## Who you're working with

The App Lead is **not a programmer** and wants to be **as hands-off as physically possible** — they multi-task by delegating work to automation. Behave accordingly:

- **Never make them read code or run bash.** They verify changes by clicking the Vercel preview deployment, not by reading diffs.
- **Don't ask permission for routine commands.** Permissions are broad (`Bash(*)` + a deny list for catastrophic ops in `.claude/settings.local.json`, which is gitignored). Run autonomously. Only stop for genuine product decisions or approval-required PRs (per `docs/ROUTINE.md`).
- **Batch human input.** Anything needing their review goes into one compact list via `/human-task-list`, never scattered questions through a session.
- **Do the work; don't narrate how to do it.** Default to action. Long explanations are friction.

## How to operate

Two tracks:

1. **Maintenance / cleanup** → the automation pipeline. `docs/BACKLOG.md` is the queue; `docs/ROUTINE.md` is the source of truth for routine behavior (prep, run, tier rules, hard rules, schedule). Slash commands: `/prep-backlog` (queue work interactively), `/run-routine` (execute one prep+run cycle on demand), `/human-task-list` (review digest). The scheduled remote routine runs 3×/day, every day (3:15 AM, 8:30 AM, 10 PM PT) and reads `docs/ROUTINE.md` directly each cycle. Read `docs/ROUTINE.md` before any routine work.
2. **Phase features** → plan in Claude Chat, produce a brief in `docs/briefs/` (template at `docs/briefs/_TEMPLATE.md`), hand to Claude Code. Then: branch `phase<N>/<slug>`, one task one commit, batch related tasks into one PR per the plan's PR-batching strategy. See `docs/DEV_WORKFLOW.md`. **Phase 2 is the active phase** — build order and specs in `docs/phase2/` (`00-plan.md` is the spine).

Schema reality: the live schema is **standalone tables per entry type** (each carries its own common columns + `extras` JSONB + `entry_state`, like `session_logs`). The original Sprint A base-`entries`+detail design was dropped in the forms-rev2 reshape; Phase 1 left only the three Tier-1 tables + `flags` + classification placeholders live. **Phase 2 batch 2A rebuilds the Tier 2 tables** per `docs/phase2/01-schema.md`. The app layer stays single-user until Phase 3.

## Read map

Do not read full files. Use grep + `view --view-range`. Jump to sections.

| Need                                                        | File                                     | Section                                                                          |
| ----------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| Pick a task / track progress                                | `docs/phase1/00-plan.md`                 | task list; sprint plan                                                           |
| Code patterns (folder, naming, server actions, Zod, errors) | `docs/phase1/01-conventions.md`          | §1–§4 universal; §5 field blocks; §11 workflows; §13 ask-don't-guess list        |
| Schema, migrations, column-vs-JSONB rule                    | `docs/phase1/02-schema.md`               | §2 conventions; §3–§6 per migration; §8 column rule; §9 workflows                |
| Field block types, entry definitions, renderer              | `docs/phase1/03-forms.md`                | §1–§2 types; §3–§12 block library; §13–§15 entries                               |
| Auth (email/password, allowlist, forgot-password)           | `docs/phase1/04-auth.md`                 | §3 dashboard config; §4 middleware; §5 login; §6 reset                           |
| Text-file fallback templates + importer                     | `docs/phase1/05-fallback.md`             | §3 format; §5 importer                                                           |
| What MD captures (data semantics)                           | `docs/charters/MD_Project_Charter.md`    | **NEVER read whole. Grep for entry name (e.g. SOP-05) or topic.**                |
| Architectural decisions, phased build                       | `docs/charters/MD_App_Charter.md`        | **NEVER read whole. Grep for topic.**                                            |
| SCL AI integration (Phase 2 step 2G)                        | `docs/charters/MD_SCL_AI_Integration.md` | **NEVER read whole. Deferred to its own pass — see `docs/phase2/05-scl-ai.md`.** |
| Phase 2 build order, scope, decisions                       | `docs/phase2/00-plan.md`                 | build order 2A–2G; §3 architecture decisions                                     |
| Phase 2 Tier 2 tables, media table                          | `docs/phase2/01-schema.md`               | per-table specs; §8 migration plan                                               |
| Phase 2 new field blocks, detail page, update flow          | `docs/phase2/02-forms-and-detail.md`     | §1 new blocks; §3 detail page; §4 updateEntry                                    |
| Test Log flexible data + auto-compute                       | `docs/phase2/03-test-log.md`             | §2 input modes; §3 compute; §5 AI fallback                                       |
| Media → Google Drive ingest                                 | `docs/phase2/04-media.md`                | §2 paths; §3 pipeline; §4 auth + setup                                           |

## Phase

**Phase 2 is active.** Phase 1 (Capture MVP) shipped — T01–T21 merged, live on prod (`docs/BACKLOG.md` Done log). The Phase 2 plan and specs are committed in `docs/phase2/`. Build order, scope, and definition of done are in `docs/phase2/00-plan.md` (batches 2A–2G). **2A — Tier 2 schema rebuild + entry detail page — is first.**

## Absolute rules

1. **Phase 2 scope only.** Build only what's in `docs/phase2/00-plan.md` (batches 2A–2G). Phase 3/4/5 items stay deferred (see below). Doing more than asked is this project's most common failure mode.
2. **No new dependencies.** Stack fixed: Next.js, TS, Tailwind, shadcn/ui, Supabase JS, Zod. Want another lib? Ask in PR. Default no.
3. **Migrations as code.** All schema via `supabase/migrations/*.sql`. Never edit tables in Supabase dashboard — silent drift, `db push` fails later.
4. **No secrets in repo.** `.env.local` gitignored. `SUPABASE_SERVICE_ROLE_KEY` never in any `NEXT_PUBLIC_*` var. Leak → rotate immediately.
5. **TypeScript strict.** No `any` unless commented why.
6. **Tests where they're the safety net.** Phase 2 adds unit tests for the pure compute functions in `lib/compute/` (Test Log stats, matrix totals — `docs/phase2/00-plan.md` §3). Everything else is verified by manual smoke test against the acceptance criteria. No tests beyond that unless a brief asks.

## Deferred to later phases (do not implement)

Phase 2: **now active** — see `docs/phase2/00-plan.md` (Tier 2 forms, depth fields, Test Log auto-compute, media-to-Drive, detail pages, SCL AI integration).

Phase 3: multi-user auth, role-based access, strict RLS policies (Phase 1 has permissive `FOR ALL TO authenticated USING (true)` — Phase 3 replaces, not adds), Discord webhooks, edit-within-24h.

Phase 4: classification pass UI, mobile polish, export endpoint, Subsystem Handoff workflow.

Phase 5+: entry-type UI builder.

Rationale lives in `MD_App_Charter.md` §7. Don't read whole charter; grep "Phase 2" / "Phase 3" / etc. if needed.

## Charter sync

Charters in `docs/charters/` are the **source of truth** — the single home for MD's data semantics (`MD_Project_Charter.md`) and architecture decisions (`MD_App_Charter.md`, `MD_SCL_AI_Integration.md`). They are no longer mirrored in the team's Claude project; the project copies were removed in favor of this one location, so there is exactly one canonical version. Edit them here, via PR, like any other file. If code contradicts a charter, flag in PR; the team decides which side updates (charter or code). Claude Chat planning sessions read the charters by fetching the raw files from this public repo — so what Chat sees and what Code sees are always the same committed bytes, and drift is structurally impossible.

## Branches and PRs

Branch: `phase<N>/<slug>` (e.g. `phase2/2a-schema`). PR title: `phase<N>: <task name>`. PR body: link to the relevant brief / plan task, bullet what changed, confirm each acceptance criterion. Smaller PRs review faster; if a single task generates >500 lines of substantive code, that's a signal to ask whether the task needs splitting.

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
- **BACKLOG state changes commit directly to main**, never in feature branches — prevents conflicts when multiple items are in flight. Exception: the scheduled remote routine lacks main's admin-bypass (direct push `403`s), so it folds its BACKLOG commit into the single feature PR — sanctioned fallback, see `docs/ROUTINE.md` §"BACKLOG state tracking".
- **Never chain destructive commands** (e.g. `cd x && rm -rf y`). The deny list catches direct invocations, not compounds.

## When uncertain

Ask in the PR. Cost of asking = one comment. Cost of guessing silently = rework or security incident. Full ask-or-decide list in `01-conventions.md` §13. But default toward autonomous action — see "Who you're working with." Reserve questions for product decisions and approval-required PR reviews.
