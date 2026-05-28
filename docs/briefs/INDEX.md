# Briefs index

Source of truth for what briefs exist, which are pending, and which Phase 1 batches they cover. The App Lead writes briefs in Claude Chat (planning phase), commits the result here, and `/prep-backlog` decomposes the brief into BACKLOG items the routine ships autonomously.

The intent is **focused planning while awake → autonomous execution while asleep**. Briefs are how the user spends their time; routine runs are how Claude spends compute.

## Phase 1 batch status

| Batch               | Tasks   | Brief             | Status                  |
| ------------------- | ------- | ----------------- | ----------------------- |
| Setup               | T01–T04 | n/a               | ✅ shipped              |
| Schema              | T05–T08 | n/a               | ✅ shipped              |
| **Auth**            | T09–T12 | _not yet written_ | 🟡 **owed by App Lead** |
| **Forms + entries** | T13–T17 | _not yet written_ | 🟡 **owed by App Lead** |
| **Fallback**        | T18–T19 | _not yet written_ | 🟡 **owed by App Lead** |
| Deploy              | T20–T21 | n/a (manual ops)  | ✅ ready                |

## How to write a brief

1. Open the [md-app Claude Project](https://claude.ai) (Opus 4.7 recommended).
2. Plan freely — share mockups, ask questions, iterate on UX.
3. Reference the spec for that batch: `docs/phase1/00-plan.md` (task range) + `docs/phase1/03-forms.md` / `04-auth.md` / `05-fallback.md` (the deep specs).
4. At the end, ask Chat: _"Produce a brief in markdown using the template at `docs/briefs/_TEMPLATE.md`."_
5. Save as `docs/briefs/YYYY-MM-DD-<slug>.md` and commit (direct to `main`).
6. Update this index — move the batch from "owed" to "written" and link the file under "Brief inventory" below.

That's all you do. The next routine cycle (or an on-demand `/prep-backlog`) reads `docs/briefs/` per `docs/ROUTINE.md` §2 and auto-proposes decomposed BACKLOG items. No manual decomposition needed from you.

## Brief inventory

_(none written yet)_

<!-- When a brief lands, add a row like:
- `2026-05-28-auth-brief.md` — Auth batch (T09–T12). Sprint B.
-->

## Decomposition (handled by the routine)

A single brief covers a whole batch (multiple tasks). The routine ships **one BACKLOG item per cycle** — so a brief gets decomposed into 4–8 smaller items before automation can do useful work on the batch. Per `docs/ROUTINE.md` §2, this happens automatically: the prep phase scans `docs/briefs/` for un-decomposed briefs and either auto-adds the items it's confident about or escalates ambiguous ones in the cycle summary for you to review via `/human-task-list`.

Typical decomposition for an auth brief might produce:

- Brief in `docs/briefs/...auth.md` (the one big artifact)
- BACKLOG items: "implement middleware allowlist", "build login form + server action", "build forgot-password page", "build reset-password callback", "build change-password page", "add sign-out action", etc.

Each item is small enough for one routine cycle.

## Sprint-mode PR batching

`docs/phase1/00-plan.md` §"PR batching strategy" says related sprint tasks land as one PR (e.g., the whole auth batch ships as one PR titled `phase1: auth batch`). Reconciling that with the routine's one-PR-per-cycle default is an open routine refinement — for now, each decomposed item ships as its own PR. Chattier review surface, but functional. Worth revisiting once Sprint B is actually in flight and the friction is concrete.
