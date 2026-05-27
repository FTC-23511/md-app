---
description: Populate docs/BACKLOG.md with new items and prep main for a routine run. Use when the user says "prep the backlog", "queue up work", "set up for the routine", "what should we add to the backlog", "fill the backlog", or otherwise wants to add items before triggering /run-routine. Do NOT use this for executing items — that's /run-routine. Do NOT use for Phase 1 sprint task planning (those go through briefs in docs/briefs/).
---

# Prep BACKLOG for a routine run

You are populating `docs/BACKLOG.md` with items the routine will process. The user is queuing up work, not executing it.

## Workflow

1. **Read current state** (in parallel):
   - `docs/BACKLOG.md` — what's in Next up / In progress / Done
   - `gh pr list --state open` — in-flight PRs
   - `git log --oneline -10` — recent commits
   - `docs/MORNING_ROUTINE.md` — current tier rules (re-read each invocation; rules may have changed)

2. **Scan for real drift.** Don't invent work. Look for:
   - Stale doc references (paths, commands, env vars that don't match reality)
   - Orphan files (deprecated routes, leftover scaffold, unused configs)
   - Missing config (gitignore gaps, missing entries in `.env.example` vs `01-conventions.md` §9)
   - Pre-existing CI failures on main
   - Tooling friction the user has hit recently

3. **Propose 2–5 items.** For each one show:
   - **Title** — one line, action-oriented
   - **Tier** — auto-merge or approval-required (per `docs/MORNING_ROUTINE.md`)
   - **Rationale** — 1–2 sentences on what's wrong and what fixes it
   - **Effort** — S (≤10 min), M (10–30 min), L (>30 min). The routine struggles with L items; flag them for a brief instead.

4. **Get user confirmation** before writing. Ask whether they want all items, a subset, or different priorities.

5. **Write to BACKLOG.md** in priority order. Default: auto-merge items at the top (so the routine ships them first and approval-required items don't block). User can override.

6. **Commit directly to main** with a clear message like `BACKLOG: add N items (M auto-merge, K approval-required)`. Push.

7. **Report tightly:**
   - Items queued + their tiers
   - Whether to run `/run-routine` now or wait for the 8 AM PT scheduled run
   - Any blockers noticed (open approval-required PRs awaiting review, broken CI on main, etc.)

## Hard nos

- Don't queue Phase 1 sprint tasks (T01–T21) as BACKLOG items. Those need full briefs in `docs/briefs/` — point the user at the brief template and Claude Chat planning instead.
- Don't queue items that require human dashboard work (Supabase config, Vercel settings). The routine can't do those.
- Don't auto-execute. This skill stops at "queue populated"; `/run-routine` runs it.
- Don't push BACKLOG state in feature branches. Always direct-to-main per the routine's tracking rule.

## When you find a blocker

If main has red CI, the routine will spend its run trying to fix it instead of doing real work. Suggest the user either:
- Add a "fix CI red" item at the top of the queue (so the routine handles it), or
- Fix it manually before the next routine run

Either is fine. Just don't let it sit.
