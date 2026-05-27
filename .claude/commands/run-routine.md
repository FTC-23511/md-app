---
description: Execute the morning routine right now in this Claude Code session — process one item from docs/BACKLOG.md end to end. Use when the user says "run the routine", "process the backlog", "do the next item", "ship the next task", "run a routine cycle", or wants the same behavior as the 8 AM PT scheduled run but on demand. Do NOT use to populate the backlog — that's /prep-backlog.
---

# Run the morning routine — now

Act as the scheduled morning routine, locally in this session.

## Workflow

1. **Read the source of truth** — `docs/MORNING_ROUTINE.md`. Locate the section between `--- BEGIN PROMPT ---` and `--- END PROMPT ---`. That section is the literal spec for everything below. If it disagrees with this skill file, the routine prompt wins; the user has been editing the routine prompt as the workflow evolves.

2. **Set up auth for `gh` if not already set.** The remote scheduled agent has GitHub App auth handled automatically, but locally you need:

   ```bash
   export PATH="/c/Program Files/GitHub CLI:$PATH"
   export GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep "^password=" | cut -d= -f2)
   ```

   Prepend that to gh commands. If GH_TOKEN is empty, the user needs to push something (anything) to trigger Git Credential Manager — surface that and stop rather than guessing.

3. **Follow the routine prompt literally.** Quick summary of the current shape (but trust the file, not this summary):
   - Step 1: clean up in-flight PRs (auto-merge any green auto-merge-tier PR, leave approval-required PRs open, push fix commits up to 3 attempts on red CI, then **always continue**)
   - Step 2: pick top of `docs/BACKLOG.md` "Next up", commit BACKLOG move directly to main first, then create feature branch and implement
   - Use `pnpm verify` as the local gate before pushing
   - Auto-merge tier → squash-merge when CI green, log to Done on main
   - Approval-required tier → leave PR open with summary + reversibility note + Vercel preview URL
   - Apply hard rules (no force push, no destructive SQL, append-only migrations, no skipping CI, etc.)

4. **Use TaskCreate** to track multi-step work within a single item. Mark in_progress when starting, completed when done.

5. **Report tightly when done.** Format:
   ```
   Item: <title>
   Tier: auto-merge | approval-required
   PR: #<n> — <status: merged / awaiting review / CI fix in progress>
   Time: ~<minutes>
   Notes: <anything unexpected — pre-existing CI red, new routine learning, etc.>
   ```

## Tools available locally

`git`, `gh` (PATH + GH_TOKEN as above), `pnpm`, `node`. Settings.local.json grants broad `Bash(*)` + tight deny list, so compound commands don't prompt.

## Quiet runs are correct

If `docs/BACKLOG.md` "Next up" is empty AND no in-flight PRs need cleanup, do nothing and report "no work". Don't invent tasks. The user runs `/prep-backlog` to queue work; this skill executes it.

## When to escalate to the user

Only when:
- Routine prompt's "stop and ask" cases fire (unexpected repo state, brief leaves a decision unmade, more than 3 CI fix attempts on a single PR)
- Hard rules would be violated (a queued item literally requires force-push, destructive SQL, etc.)
- An approval-required PR's tier classification is genuinely ambiguous

Otherwise, run autonomously. The point of this skill is removing user-in-the-loop friction.

## Iteration notes

If the routine surfaces a new failure mode or learning, **don't fix the skill file mid-run**. Note it in the report. The user updates the routine prompt or this skill file deliberately, not as a side effect. Routine consistency > opportunistic improvements during a run.
