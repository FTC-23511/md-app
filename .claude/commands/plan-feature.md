---
description: Produce the brief that unlocks autonomous routine cycles for a Phase 1 batch — using plan-mode-style structured exploration of the actual repo + spec docs, then writing the brief artifact to docs/briefs/. Use when the user says "plan the next feature", "plan a feature", "what's needed for the next feature", "write a brief", "kick off the next batch", "start planning <batch>", "plan mode for the next feature", or otherwise wants to produce the planning artifact (NOT implement). The skill also embeds the human-task-list scan as its first step — invoking this skill answers "what's owed" while teeing up the next brief. Do NOT implement the feature; stop after the brief lands.
---

# Plan a feature — produce the brief

You are producing the planning artifact for a Phase 1 batch (a *brief*). The user's intent is **focused planning while awake → autonomous shipping while asleep**. The brief you produce here is what unlocks several routine cycles of unattended work.

This skill is the planning step. **Do NOT implement the feature.** Stop after `docs/briefs/<file>.md` and `docs/briefs/INDEX.md` are committed.

## What to do

### Step 1 — Embedded human-task-list scan + target selection

Before planning anything, scan the same sources `/human-task-list` reads so the user sees the full picture, not just the brief queue. Do this in parallel:

1. Read `docs/briefs/INDEX.md` — note every batch marked "owed" or "not yet written."
2. `gh pr list --state open --json number,title,headRefName,statusCheckRollup` — note any approval-required PRs awaiting review.
3. Read `docs/BACKLOG.md` "In progress" — note any item with stuck CI.

Now pick the target for this skill's planning work:

- If the user named a batch in args (e.g. `/plan-feature Forms`), use that.
- Else, if exactly one batch is owed, default to it. State the choice — don't ask.
- Else if multiple owed, use `AskUserQuestion` with the recommended batch as the first option. Recommend in this order: **Auth (T09–T12) > Fallback (T18–T19) > Forms (T13–T17)** if all owed, with the rationale that Auth is the gate to making forms testable, Fallback is the smallest dry-run, and Forms is the biggest brief that benefits from doing the smaller ones first.
- If no batches are owed, stop and tell the user — Phase 1 may be brief-complete. Suggest `/run-routine` or check `/human-task-list`.

Surface (briefly, after picking the target) any other items the user should be aware of from the parallel scan — approval-required PRs awaiting review, stuck CI. These don't block planning; just acknowledge them before diving in.

### Step 2 — Read the spec for the chosen batch

| Batch    | Tasks   | Primary spec                  | Section guide                                                   |
| -------- | ------- | ----------------------------- | --------------------------------------------------------------- |
| Auth     | T09–T12 | `docs/phase1/04-auth.md`      | §3 dashboard config, §4 middleware, §5 login, §6 reset          |
| Forms    | T13–T17 | `docs/phase1/03-forms.md`     | §§1–2 types; §§3–12 block library; §§13–15 entries              |
| Fallback | T18–T19 | `docs/phase1/05-fallback.md`  | §3 format; §5 importer                                          |

Also read:

- `docs/briefs/_TEMPLATE.md` — the brief format (follow it exactly).
- `docs/phase1/00-plan.md` — the task descriptions + acceptance criteria for the T-numbers in this batch (jump to them; don't read whole).
- `docs/phase1/01-conventions.md` §13 — the "ask, don't guess" list. Anything matching this list in the chosen batch becomes an Open Question.

Do not read the charters in `docs/charters/` whole — grep only if needed.

### Step 3 — Plan-mode-style exploration

Even if the harness isn't in plan mode, follow its discipline:

1. **Explore** — for each task in the batch, identify the files that will change (paths from the spec or existing code). Note any conventions to follow (`01-conventions.md` §1–§5, §11).
2. **Identify open decisions** — anything in the spec marked TBD, anything in §13 of conventions, or anything you yourself are uncertain how to resolve. Be specific (file path + decision).
3. **Validate against actual repo state** — check that the paths the spec references still exist; the schema columns called for are in the migrations; existing patterns the brief should match are in place. The user values this skill specifically because it grounds the brief in code, not just the spec doc.

### Step 4 — Ask the open questions in one batch

Use `AskUserQuestion` to resolve everything from Step 3.2 at once. Constraints:

- ≤ 4 questions per batch (cap). If more, pick the most important and note the rest in the brief's Open Questions section.
- Each question gets 2–4 options. Recommend one with "(Recommended)" suffixed to the label.
- Skip questions the spec already answers definitively. Don't ask for confirmation of things already decided.

If there are no real open decisions, skip this step entirely. Asking nothing is correct when the spec is fully nailed down.

### Step 5 — Write the brief

Save as `docs/briefs/<YYYY-MM-DD>-<batch-slug>.md`. Slug = `auth`, `forms`, or `fallback`.

Follow `docs/briefs/_TEMPLATE.md` exactly. Required sections, with batch-specific guidance:

- **What we're building** — one paragraph, user-visible change. Plain English.
- **Why** — 1–2 sentences. What this unblocks operationally per the plan's Definition of Done.
- **Acceptance criteria** — observable in the browser. **One per task** in the batch (so T13 gets ≥1, T14 gets ≥1, etc.). These are what the routine will check against — specific enough that "did we ship it?" has a clear yes/no.
- **Out of scope** — what NOT to do. Anchor on `docs/phase1/00-plan.md` §"Deferred to later phases" + anything the routine should avoid touching in the approval-required tier per `docs/ROUTINE.md` §4.
- **Open questions** — anything still unresolved after Step 4 (should be ~zero if Step 4 was thorough). If empty, write `_(none — Step 4 resolved everything)_`.
- **Decomposition hint** — proposed BACKLOG items, in routine-cycle-sized chunks (≤ 30 min each). The routine's prep phase reads this. Aim for 4–8 items per brief. Each item: title + tier (auto-merge or approval-required) + 1-line description.
- **Tier mix summary** — `<X auto-merge / Y approval-required>` so the user knows roughly how many PRs will need their approval before any code is written.

### Step 6 — Update INDEX.md

In `docs/briefs/INDEX.md`, flip the target batch's row:

- `Brief` column: link to the new file (e.g. `[2026-05-28-auth.md](2026-05-28-auth.md)`).
- `Status` column: `🟢 brief written — routine picks up next cycle`.

Also add a row to the "Brief inventory" section linking the file.

### Step 7 — Commit directly to main

Brief + INDEX update commit directly to `main`, not in a feature branch (same rule as BACKLOG state per `docs/ROUTINE.md` §3). One commit:

```
brief: <batch> — <one-line summary>

<2-3 lines: acceptance-criteria count, decomposition count, tier mix, anything
notable the user should know before the routine picks it up>

Co-Authored-By: <model> <noreply@anthropic.com>
```

Push.

### Step 8 — Report tightly

Format:

```
Brief: docs/briefs/<file>
Batch: <name> (T<n>–T<m>)
Acceptance criteria: <count>
Open questions: <count> (or "none")
Decomposition: <N> BACKLOG items proposed (~<minutes> each, <X auto-merge / Y approval-required>)

Routine pickup: next cycle (3:15 AM / 8:30 AM / 10:00 PM PT, weekdays).

Also on your plate (from the embedded human-task-list scan):
<list approval-required PRs awaiting review, stuck CI items — or "nothing else">
```

## Hard nos

- **Do NOT implement the feature.** Stop after Step 7. The routine ships it.
- **Do NOT write to `docs/BACKLOG.md` directly.** Decomposition lives in the brief's "Decomposition hint" section. The routine's prep phase reads `docs/briefs/` and proposes BACKLOG items on its own cycle.
- **Do NOT skip Step 4.** A brief without resolved open questions becomes a "stop and ask" cascade during routine runs — burns cycles, frustrates the user.
- **Do NOT use this skill outside Phase 1 batches.** Maintenance items go through `/prep-backlog`. Out-of-phase work needs the absolute-rule #1 conversation.
- **Do NOT propose dependencies outside the locked stack** (Next.js, TS, Tailwind, shadcn/ui, Supabase JS, Zod). Per `CLAUDE.md` absolute rule #2.

## Edge cases

- **No owed briefs in INDEX.** Tell the user — Phase 1 may be brief-complete. Suggest `/run-routine` or `/human-task-list`.
- **Spec is silent on a key UX decision.** Add to Open Questions, ask via `AskUserQuestion` at Step 4. Do not guess.
- **User wants to plan something outside Phase 1.** Stop. Per `CLAUDE.md` absolute rule #1, Phase 1 is the active scope. Surface what they wanted and ask if it should be a `docs/briefs/` for a later phase (parked, not deleted) or a backlog item.
- **Batch already has a brief and user wants a revision.** Do not overwrite the original. Save as `docs/briefs/<YYYY-MM-DD>-<batch>-rev2.md` and note in the commit message what changed.
- **User invokes this skill while a brief's BACKLOG items are still in flight.** Acknowledge the in-progress state and ask whether to plan the next batch now or wait. Don't compete for the routine's attention with two open batches.

## Interaction with `/human-task-list`

This skill embeds the same scan `/human-task-list` does (Step 1). When the user wants both effects from one prompt ("what's needed for the next feature?"), this skill triggers and produces a full picture: PRs awaiting review, owed briefs, AND it kicks off the planning for the top owed brief.

`/human-task-list` remains separately useful for the "I just want the status, not the planning" case.
