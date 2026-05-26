# Feature: <name>

<!--
Filename convention: docs/briefs/YYYY-MM-DD-<slug>.md
e.g. 2026-05-22-session-log-form.md

Produced in Claude Chat at the end of a planning session, then committed
alongside the implementation PR so the "why" ships next to the "what."
-->

## What we're building

<1 paragraph — the user-visible change. Plain English, no implementation detail.>

## Why

<1–2 sentences — what problem this solves, who asked for it, what it unblocks.>

## Acceptance criteria

<Observable in the browser. Specific enough that "did we ship it?" has a clear yes/no answer.>

- <e.g. "Form at /sessions/new accepts title, date, notes; saves to the `sessions` table">
- <e.g. "On save, redirects to /sessions and the new row is visible">
- <e.g. "Validation errors show inline; submit button disabled until valid">

## Out of scope

<What NOT to do this round. Keeps the PR focused and prevents scope creep.>

- <e.g. "Editing existing sessions — that's a separate feature">
- <e.g. "Bulk import — later">

## Open questions

<Decisions you haven't made yet. Claude Code will ask about these before diverging.>

- <e.g. "Should the notes field support markdown or plain text?">
- <e.g. "Who can create sessions — any member or only documentation captains?">
