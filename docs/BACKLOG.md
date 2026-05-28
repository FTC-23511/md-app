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

1. **[config]** Add `.gitattributes` with `* text=auto eol=lf` and `*.bat text eol=crlf` to normalize line endings across platforms. More idiomatic than the Prettier `endOfLine: auto` workaround currently in `.prettierrc.json` (which we can leave as a belt-and-suspenders). Prevents the Windows CRLF/LF cycle that broke `pnpm verify` locally yesterday. _Expected tier: auto-merge (config only)._

## In progress

<!-- Routine moves items here with the PR link when work starts. -->

_(empty)_

## Done

<!-- Auto-archived after merge. Keep the last ~20 for reference; older entries can be pruned. -->

- 2026-05-27 — **[chore]** Consolidate the automation routine — rename `MORNING_ROUTINE.md` → `ROUTINE.md`, fold prep+run, document 3×/weekday schedule. Squash-merged in [#8](https://github.com/FTC-23511/md-app/pull/8).
- 2026-05-27 — **[auth]** Phase 1 auth batch (T09–T12): single-email allowlist in middleware + `/forbidden`, email+password sign-in replacing magic-link, forgot/reset/change-password flow, protected layout top bar. Squash-merged in [#7](https://github.com/FTC-23511/md-app/pull/7).
- 2026-05-27 — **[docs]** Audit `.env.example` (add `ALLOWED_EMAIL`, fix stale magic-link comment) — superseded by #7 (which made the same changes as part of the auth batch). Closed: [#5](https://github.com/FTC-23511/md-app/pull/5).
- 2026-05-26 — **[config]** Untrack `.claude/settings.local.json` and `tsconfig.tsbuildinfo` (add to `.gitignore`). Auto-merged in [#6](https://github.com/FTC-23511/md-app/pull/6).
- 2026-05-26 — **[docs]** Update `docs/phase1/00-plan.md` T05–T08 Deliverables to reference actual migration filenames. Auto-merged in [#4](https://github.com/FTC-23511/md-app/pull/4).
- 2026-05-26 — **[docs]** Fix `docs/SETUP.md` Step 4 magic-link reference. Auto-merged in [#3](https://github.com/FTC-23511/md-app/pull/3).
- 2026-05-26 — **[docs]** Fix `README.md` to use `pnpm` consistently. Auto-merged in [#2](https://github.com/FTC-23511/md-app/pull/2). (Also bundled a Windows-friendly Prettier `endOfLine: auto` config fix.)
- 2026-05-26 — **[meta]** Repo-wide Prettier sweep + expand auto-merge tier rule to cover root-level `*.md` and pure formatting sweeps. Auto-merged in [#1](https://github.com/FTC-23511/md-app/pull/1). (Ad-hoc item; emerged when `pnpm verify` failed on pre-existing format drift.)
