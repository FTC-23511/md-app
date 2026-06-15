# Feature: 3E — Flag overdue alerts

<!-- docs/briefs/2026-06-15-3e-flag-alerts.md — Phase 3 step 3E. Spec: docs/phase3/04-dashboard-and-flags.md §1. Self-contained; ships before 3F so the dashboard imports the helper. -->

## What we're building

Overdue detection for flags. A small pure helper (`lib/flags.ts`) derives "overdue" from open flags older than a threshold (start 72h — `flags` has no due-date column), surfaced as a red "OVERDUE" pill + count on the dashboard. Optionally, a daily outbound Discord digest of overdue flags (post-only, mirroring the existing SCL digest workflow).

## Why

The charter's Phase 3 deliverable includes "flag tracking with overdue alerts" — flags that sit open too long are the signal the Captain acts on at Friday 15. Deriving overdue from `opened_at` needs no schema change.

## Acceptance criteria

- `lib/flags.ts` exports `OVERDUE_THRESHOLD_HOURS` (72), `isOverdue`, `flagAgeDays`, `listOverdueFlags` (open flags past the threshold, with owner display_name); computed in UTC.
- On `/dashboard`, an open flag older than 72h shows a red "OVERDUE" pill and the header overdue count is correct; a flag opened just now shows neither.
- (If the digest ships) `app/api/internal/overdue-flags/route.ts` returns the digest **only** with a valid `X-Cron-Secret` and **401** otherwise, uses the anon client (no service-role), and exposes only subject + owner name + age; `.github/workflows/flag-overdue-digest.yml` posts it to `DISCORD_FLAG_WEBHOOK_URL` and is verifiable via `gh workflow run`.
- `pnpm verify` green.

## Out of scope

- A `due_at` column / per-flag custom due dates (listed as a possible future; v1 is age-based).
- The full dashboard rebuild — 3F (this batch only ships the flag helper + the flag-queue component it reuses).
- Inbound Discord — the digest is outbound, post-only.

## Open questions

- **Threshold value** — 72h to start; confirm the right number for the team's cadence (Friday 15 weekly rhythm might argue for 96–120h).
- **Ship the Discord digest now or defer** — the dashboard badge is the primary surface; the outbound digest is optional within 3E. Default: ship the badge; gate the digest on the App Lead providing `DISCORD_FLAG_WEBHOOK_URL`.
- **Fold 3E into the 3F dashboard PR?** They're closely related; keeping 3E separate ships the alert logic sooner. Default: separate PR.
