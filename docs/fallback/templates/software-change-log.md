---
# REQUIRED. Do not change the lines marked REQUIRED.
type: sw_change_log # REQUIRED — must be 'sw_change_log'
template_version: 1 # REQUIRED — leave as 1
change_date: 2026-MM-DD # REQUIRED — date the change landed
change_type: # Optional — e.g. control-theory, sensor-fusion, state-machine, algorithm, bug-fix, refactor
commit_hash: # Optional — tip commit SHA (the LAST commit of the change)
commit_range_from: # Optional — FIRST commit SHA, if the change spans several commits
branch: # Optional — branch the commits are on
parent_decision_id: # Optional — Decision Log entry UUID this change implements
---

<!--
This is the Software Change Log fallback template. Two ways to fill it:

1. The `/scl` Claude Code skill writes it for you from a commit range — you then
   edit and approve. (See `.claude/commands/scl.md`.)
2. Fill it by hand during an outage, like the other fallback templates.

Either way: hand the finished file to the Documentation Captain, who drops it in
docs/fallback/inbox/ and runs `pnpm import-fallback -- docs/fallback/inbox/<file>.md`.
-->

## What changed

<!-- Plain English, no code — 2–4 sentences on the concrete change. -->

## Why

<!-- Why we changed it — 1–2 sentences. Link a Decision Log via parent_decision_id above if applicable. -->

## Hardware / sensors involved

<!-- Optional. Which hardware or sensors this change touches. -->

## Game challenge addressed

<!-- Optional. The on-field problem or task this change targets. -->

## Before behavior

<!-- Optional. Measurable behavior before the change. -->

## After behavior

<!-- Optional. Measurable behavior after the change. -->

## Known failure modes / edge cases

<!-- Optional. Where this is known to break or behave unexpectedly. -->

## Verification

<!-- Reference a unit test that covers this change, OR explain why unit testing is not feasible plus the integration-test approach used. -->

## Files changed

<!-- Optional. One file per line. -->

- path/to/file.ext
