# Feature: 3F — Captain/admin dashboard (combined)

<!-- docs/briefs/2026-06-15-3f-captain-dashboard.md — Phase 3 step 3F. Spec: docs/phase3/04-dashboard-and-flags.md §2–§5. Depends on 3D (roster) + 3E (flag helper). Captain == admin == one dashboard. -->

## What we're building

The combined Captain/admin dashboard at `/dashboard`, in three sections: a member roster (with roles + a link to `/admin/members`), the flag queue with overdue alerts (reusing 3E), and KPI rollups — entry counts by type and timeframe, draft-vs-complete, entries-per-member, by-subsystem, and capture latency (median days from event to filed). All reads run under the signed-in user's session so RLS is respected.

## Why

The Captain is the admin and the documentation lead — one person, one screen. The charter's Phase 3 deliverable calls for "Captain dashboard + KPI rollups" so system health is visible and multi-user discipline is enforceable at a glance.

## Acceptance criteria

- `/dashboard` renders three sections, each with real non-zero data: roster (display_name, email, role, active + link to `/admin/members`); flag queue (overdue pills + count, via `lib/flags.ts`); KPI cards.
- KPIs show: counts by entry type, by timeframe (7d/30d/season), draft-vs-complete split, top filers **by display_name (never null)**, by-subsystem (exact for hw/decision logs, best-effort labeled for session-log extras), and a **median "days from event to filed"** that matches a hand-check against a couple of known entries.
- KPI functions live in `lib/dashboard/kpis.ts` (pure); the page is a thin composition; reads use the anon client (RLS), never service-role.
- A non-Captain hitting `/dashboard` gets a reduced self-view (their own counts), not a dead end.
- `pnpm verify` green.

## Out of scope

- Charts/graphs library — numbers + simple shadcn cards/tables only (no new dependency).
- Classification-pass status panel and `/export` — Phase 4 (leave a slot).
- Editing flags from the dashboard — read + alert only this batch.

## Open questions

- **Reduced non-Captain view** — exactly which KPIs a general member sees (their own entry counts + their open flags?) vs redirecting them away from `/dashboard` entirely. Confirm the reduced set.
- **"Season" boundary** — derive from an active `seasons` row if one exists, else fall back to a rolling window. Confirm whether `seasons` is populated.
- **Capture-latency presentation** — median only, or median + p90? Default: median, with the count of entries it's computed over.
