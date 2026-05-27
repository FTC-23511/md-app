---
description: Compress all pending human-review tasks into a minimal step-by-step action list. Shows only what the user must personally do, in priority order, with the smallest possible context per item. Use when the user wakes up, sits back down after time away, or asks "what do I need to do".
---

# Your action list

Scan the repo and produce a compact step-by-step list of things only the user can do. Filter aggressively — the routine handles most work autonomously.

## What counts as a "human task"

- Open approval-required PRs awaiting review (`gh pr list` filtered by tier)
- Items requiring dashboard work the routine can't do (Supabase config, Vercel settings, GitHub repo settings, billing)
- One-off setup the routine flagged (token rotation, GitHub App install, env var values, secret provisioning)
- "Stop and ask" decision points logged by previous routine runs (check recent PR comments and routine reports in `git log`)

## What does NOT count — don't list these

- Auto-merge-tier items in `docs/BACKLOG.md` Next up (routine handles automatically)
- `In progress` items where the routine is still working
- Closed/merged PRs (already done)
- Soft suggestions like "you should review the architecture" — only **specific, completable actions**
- Phase 1 plan items (T01–T21) — those go through the brief workflow, not this list

## Output format — strict

Sort by: (1) blockers first, (2) quick wins (≤2 min) second, (3) bigger reviews last.

For each item, exactly this shape, nothing more:

```
N. <Imperative verb> <thing> — <one-line context>
   📍 <URL or file path>
   ⏱  <time estimate, e.g. 30s / 2min / 10min>
   🚧 <what this unblocks, if anything>
```

Keep each item ≤ 4 lines. Skip the 🚧 line if the item doesn't block anything.

If there's nothing to report:
```
✅ Nothing on your plate. Routine is unblocked.
```

Don't add headings, summaries, or commentary above or below the list. The list IS the output. The user is busy and skimming.

## Tone

Direct. Imperative. No hedging. Don't explain *why* something is a blocker unless the context fits in the one-line description.

## How to gather data

In parallel:
1. `gh pr list --state open --json number,title,headRefName,statusCheckRollup`
2. Read `docs/BACKLOG.md` (focus on the "In progress" section)
3. `git log --oneline --since="3 days ago"` — scan for routine-emitted "stop and ask" patterns
4. Cross-reference each open PR with the tier rules in `docs/MORNING_ROUTINE.md` to confirm which need approval vs auto-merge
5. For each approval-required PR, fetch its description to extract the plain-English summary and Vercel preview URL

## Don't fabricate items

If you don't see a real blocker after scanning, the right output is `✅ Nothing on your plate`. Don't manufacture work to seem useful. An empty list is a healthy state.

## Don't execute anything

This skill is read-only. No commits, no PR comments, no merges. Just the summary. The user takes action themselves; `/run-routine` resumes after they're done.
