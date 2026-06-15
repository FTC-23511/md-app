---
description: Draft a Software Change Log from a range of commits. Reads the commits (and the chat context that produced them) and writes a fallback-format Software Change Log file into docs/fallback/inbox/ for the programmer to review, edit, and hand to the Documentation Captain. Use when a programmer decides a recent change is worth an SCL — typically after the daily Discord commit-digest nudge. Trigger: "/scl <from>..<to>", "/scl since yesterday", "draft an SCL for these commits", "log this change".
---

# Draft a Software Change Log (`/scl`)

You are drafting one **Software Change Log (SCL)** from a range of commits, in the
programmer's own Claude Code session. The output is a markdown file that the
existing MD-App fallback importer ingests into the `sw_change_logs` table. You are
**not** writing to any database or calling any API — you produce a file the human
reviews and approves.

Spec: `docs/phase2/05-scl-ai.md`. Template: `docs/fallback/templates/software-change-log.md`.
Field semantics: `entries/software-change-log.ts` + Charter SOP-07.

## Why a range, not one commit

AI-assisted coding spreads one coherent feature or bug fix across many commits. The
unit of a Software Change Log is the **change**, so you summarize a **range** of
commits into one SCL — not one SCL per commit.

## Step 1 — Resolve the range

From the user's args, accept either form:

- A SHA range: `abc1234..def5678` → `git log --no-merges abc1234..def5678`
- A relative/date range: "since yesterday", "last 3 days", a date → use
  `git log --no-merges --since="<when>"` (default `--since="24 hours ago"` if the
  user gives nothing).

If the range is ambiguous or empty, ask the user to clarify the endpoints before
proceeding. Confirm the resolved commit list back to the user in one line.

## Step 2 — Read what actually changed

Run `git log -p --no-merges <range>` to see commit messages **and** diffs. Note:

- The concrete code change (what files, what behavior).
- The branch (`git rev-parse --abbrev-ref HEAD`) and the range endpoints (first SHA
  → `commit_range_from`, tip SHA → `commit_hash`).
- The list of changed files (`git diff --name-only <range>`).

## Step 3 — Capture the "why" from chat context

This is the part a diff can't give you and the reason this runs in Claude Code: the
**conversation that produced the code** holds the intent, the alternatives tried,
and what failed. Pull `why`, `before_behavior`/`after_behavior`, `failure_modes`,
and `verification` from that context. If the current session doesn't contain it, ask
the programmer 2–4 short questions rather than guessing. **Never invent** measured
behavior, test results, or failure modes — leave a field blank and flag it for the
human if you don't know.

## Step 4 — Classify the change

Set `change_type` to the closest of: `control-theory`, `sensor-fusion`,
`state-machine`, `algorithm`, `bug-fix`, `refactor` (or another short slug if none
fit — the importer will create the option). Map it from the diff + context.

## Step 5 — Write the file

Copy `docs/fallback/templates/software-change-log.md`, fill every field you can, and
write it to:

```
docs/fallback/inbox/<YYYY-MM-DD>-software-change-log-<short-slug>.md
```

where `<short-slug>` is 2–4 words describing the change (e.g. `kalman-heading-filter`).
If that filename already exists, append `-2`, `-3`, … so you never overwrite a
pending file. Fill `commit_range_from`, `commit_hash`, and `branch` from Step 2.

## Step 6 — Hand off (do NOT import)

Tell the programmer, in a short message:

1. Where you wrote the file.
2. Which fields you left blank or were unsure about, so they fill/fix them.
3. That after they review and edit, the file goes to the Documentation Captain, who
   runs `pnpm import-fallback -- docs/fallback/inbox/<file>.md` to land it as a
   `sw_change_logs` row (linked to the commit range).

You never run the importer yourself and you never mark the change as final — the
human reviews and approves. That review step is the safeguard.
