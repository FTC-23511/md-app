---
description: Populate docs/BACKLOG.md with new items interactively (with human confirmation), without running the routine. Use when the user says "prep the backlog", "queue up work", "set up for the routine", "what should we add to the backlog", "fill the backlog", or otherwise wants to add items but NOT trigger a routine cycle. Do NOT use for executing items — that's /run-routine. Do NOT use for Phase 1 sprint task planning (those go through briefs in docs/briefs/).
---

# Prep BACKLOG interactively

Populate `docs/BACKLOG.md` with items the next routine cycle will process. The user is queuing up work, not executing it. This skill is the **interactive counterpart** to the prep behavior in `docs/ROUTINE.md` §2 — same scan, same tier classification, but with human confirmation in the loop instead of the autonomous add-or-escalate split.

## What to do

1. **Read `docs/ROUTINE.md` §2 (Prep behavior) and §4 (Tier rules).** They are the source of truth for what to scan and how to classify. Re-read every invocation — the doc evolves.

2. **Read current state** (in parallel):
   - `docs/BACKLOG.md` — what's in Next up / In progress / Done
   - `gh pr list --state open` — in-flight PRs
   - `git log --oneline -10` — recent commits

3. **Scan the sources listed in `docs/ROUTINE.md` §2** for real drift. Don't invent work.

4. **Propose 2–5 items.** For each one show:
   - **Title** — one line, action-oriented
   - **Tier** — auto-merge or approval-required (per `docs/ROUTINE.md` §4)
   - **Rationale** — 1–2 sentences on what's wrong and what fixes it
   - **Effort** — S (≤ 10 min), M (10–30 min), L (> 30 min). L items need a brief; flag them and don't queue them as backlog items directly.

5. **Get user confirmation** before writing. Ask whether they want all items, a subset, or different priorities. Unlike the routine's autonomous mode, *nothing* lands in BACKLOG without the user's OK here.

6. **Write to BACKLOG.md** in priority order. Default: auto-merge items at the top so the next cycle ships them first; approval-required items below.

7. **Commit directly to `main`** (per `docs/ROUTINE.md` §3 BACKLOG state tracking rule) with a message like `BACKLOG: add N items (M auto-merge, K approval-required)`. Push.

8. **Report tightly:**
   - Items queued + their tiers
   - Whether to run `/run-routine` now or wait for the next scheduled cycle (3:15 AM / 8:30 AM / 10 PM PT weekdays)
   - Any blockers noticed (open approval-required PRs awaiting review, broken CI on main, etc.)

## Hard nos

- Don't queue Phase 1 sprint tasks (T01–T21) as BACKLOG items. Those need full briefs in `docs/briefs/`.
- Don't queue items that require human dashboard work (Supabase config, Vercel settings). The routine can't do those.
- Don't auto-execute. This skill stops at "queue populated"; `/run-routine` or the scheduled cycle runs it.
- Don't push BACKLOG state in feature branches. Always direct-to-`main` per `docs/ROUTINE.md` §3.

## When you find a blocker

If `main` has red CI, the next routine cycle will spend its run trying to fix that instead of doing new work. Suggest the user either:

- Add a "fix CI red" item at the top of the queue (so the routine handles it), or
- Fix it manually before the next cycle

Either is fine. Just don't let it sit.
