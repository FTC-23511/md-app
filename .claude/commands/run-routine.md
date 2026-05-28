---
description: Execute one routine cycle in this Claude Code session — prep the backlog, then ship one item from docs/BACKLOG.md end to end. Same behavior as the scheduled cycle, on demand. Use when the user says "run the routine", "process the backlog", "do the next item", "ship the next task", "run a routine cycle", or wants an unscheduled run. Do NOT use to populate the backlog interactively — that's /prep-backlog.
---

# Run the routine — now

Execute one routine cycle locally in this session, identical to what the scheduled agent does.

## What to do

1. **Read `docs/ROUTINE.md` in full.** It is the single source of truth for the routine's behavior — prep, run, tier rules, hard rules, schedule, all of it. If anything in this skill file conflicts with `docs/ROUTINE.md`, the doc wins.

2. **Follow `docs/ROUTINE.md` end-to-end.** Begin with §2 Prep (autonomously add safe items, escalate ambiguous ones in the summary). Then §3 Run (Step 1 cleanup → Step 2 start one new item). End with the cycle summary specified in §1.

3. **Set up `gh` auth if not already** (the remote agent has it via GitHub App, locally you need):

   ```bash
   export PATH="/c/Program Files/GitHub CLI:$PATH"
   export GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep "^password=" | cut -d= -f2)
   ```

   If `GH_TOKEN` is empty, the user must push something to trigger Git Credential Manager — surface that and stop rather than guessing.

4. **Use TaskCreate** to track multi-step work within an item. Mark in_progress when starting, completed when done.

5. **Report tightly** at the end. Format:

   ```
   Cycle summary
   Prep: <N items added autonomously | nothing new | M candidates escalated for human OK — listed below>
   Run: <Item title> — <tier> — <PR # status: merged | awaiting review | CI fix in progress | no item shipped (queue empty)>
   Time: ~<minutes>
   Notes: <anything unexpected — pre-existing CI red, new routine learning, etc.>

   Suggested for backlog (needs human OK):
   - <title> — <tier> — <why escalated>
   ```

   Omit the "Suggested" section if prep escalated nothing. The whole report is short by design.

## Tools available locally

`git`, `gh` (PATH + GH_TOKEN as above), `pnpm`, `node`. Settings.local.json grants broad `Bash(*)` + a tight deny list, so compound commands don't prompt.

## Quiet cycles are correct

If `docs/BACKLOG.md` "Next up" is empty, prep finds nothing new, and no in-flight PRs need cleanup, do nothing and report "nothing to do." Don't invent work. Silence is a healthy state.

## When to escalate to the user

Only when:

- `docs/ROUTINE.md` §5 hard rules would be violated (item literally requires force-push, destructive SQL, etc.)
- `docs/ROUTINE.md` §6 sideways case fires (unexpected repo state, brief leaves a decision unmade, >3 CI fix attempts on a single PR)
- An item's tier classification is genuinely ambiguous after checking §4

Otherwise, run autonomously. The point of this skill is removing user-in-the-loop friction.

## Iteration notes

If a cycle surfaces a new failure mode or learning, **don't fix `docs/ROUTINE.md` mid-cycle**. Note it in the report. The user updates the routine doc deliberately, not as a side effect. Routine consistency > opportunistic improvements during a cycle.
