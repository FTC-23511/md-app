# Feature: 2G — Software Change Log via `/scl` skill + daily Discord digest

<!-- docs/briefs/2026-06-15-2g-scl-skill-digest.md — Phase 2 step 2G. Spec: docs/phase2/05-scl-ai.md (rescoped 2026-06-15). Charter revision: MD_SCL_AI_Integration.md v2.0. -->

## What we're building

The rescoped 2G (no app-side AI). Three pieces:

1. **Daily Discord digest** — a GitHub Action (cron) lists the day's commits and posts them to a Discord channel via an incoming webhook: "commits landed — any worth a Software Change Log?"
2. **`/scl` Claude Code skill** — a programmer flags a commit **range**, runs `/scl` in their own Claude Code; the skill reads the range (`git log -p`) plus the AI-coding chat context and writes a fallback-format Software Change Log markdown file into `docs/fallback/inbox/`, which the programmer edits and approves.
3. **Importer ingestion** — the existing fallback importer (`scripts/fallback/import.ts`) ingests that file into a `sw_change_logs` row, linked to the commit range.

## Why

Captures Software Change Logs from the real "why" (the AI-coding chat + commit range), human-gated and batched, with **zero app-side AI cost, no Anthropic dependency, no API key, no per-commit webhook**. Reuses the fallback importer rather than building a new ingestion path. Closes the last Phase 2 batch.

## Acceptance criteria

- `docs/fallback/templates/software-change-log.md` exists, mirroring the existing three templates: `type: sw_change_log`, `template_version: 1`, typed frontmatter (`change_type`, `change_date`, `commit_hash`, `branch`, range fields) + body sections for `what_changed`/`why`/`before_behavior`/`after_behavior`/`failure_modes`/`verification`/`files_changed` + a Specialty Entries Triggered block.
- `entries/software-change-log.ts` exports `softwareChangeLogBodyMapping` (header→field map) so `scripts/fallback/import.ts` ingests a `sw_change_log` file end-to-end: `pnpm import-fallback -- docs/fallback/inbox/<file>.md` inserts one `sw_change_logs` row with `created_via='fallback_form'`, `entry_state='draft'`, option references resolved, commit range stored.
- A `/scl` skill (repo skill, e.g. `.claude/skills/scl/`) that, given a commit range, produces a filled template draft. Skill doc explains: input range, what it reads (commits + chat), output path, "edit before handing to the Captain."
- `.github/workflows/scl-digest.yml` posts a daily commit digest to a Discord incoming webhook stored as a GitHub Actions secret (`DISCORD_SCL_WEBHOOK_URL`). Verifiable by a manual workflow-dispatch run posting to the channel.
- Commit-range link visible on the SCL detail page (range start/end + branch).
- `pnpm verify` green.

## Out of scope

- Any app-side Claude call / Anthropic SDK / API key (explicitly removed by the rescope).
- Inbound Discord capture (Phase 3) — this digest is **outbound, post-only**.
- A cheap AI one-line summary in the digest — v1 is a plain commit list; the skill does the real summarization.
- Detecting _missing_ SCLs (team hygiene, per charter §12).

## Open questions

- **Skill location/format.** `.claude/skills/scl/` in-repo so it versions with the template it targets and can read the repo's git log directly. Confirm at PR.
- **Range input UX in the skill.** `<from>..<to>` SHA range vs. a date range → resolve to commits. Default: accept both.
- **Digest branches + cadence.** Default: watch `main` + open PR branches, post once daily. Confirm channel + time at PR (needs the Discord webhook URL from the App Lead).
- **Range storage.** Tip `commit_hash` + `branch` are existing typed columns; range **start** goes in `extras.commit_range_from` (no migration). Confirm vs. adding a typed column.
- **Inbox filename collisions.** `<date>-software-change-log-<slug>.md`; dedupe slug if the range repeats.
