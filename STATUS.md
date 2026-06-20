# Project Status — On Indefinite Hold

> **⏸️ ON INDEFINITE HOLD · since 2026-06 · mothballed & resumable, not deleted**

## TL;DR

As of June 2026 the team paused MD-App indefinitely. Documentation has moved to a
Linear-only workflow: the plan and records now live in Linear, and Claude (via the Linear
connector, in a weekly review pass) performs the compute, completeness-enforcement, and
classification this app was built to do. The implementation is mothballed — nothing is
deleted, and resuming stays cheap.

## Why

The team pivoted to a leaner process it already uses day to day. Records and the working
plan live in **Linear**; a **weekly Claude pass** over that data handles the work MD-App
automated — Test Log statistics, completeness/flag enforcement, and classification.

For a high-school team where the original builder graduates, the ongoing maintenance and
knowledge-transfer risk of a bespoke Next.js + Supabase app outweighed its benefit versus a
process the team already runs. The **documentation standards** MD-App encodes are valuable
and live on (see "Where the live context now lives"); only this particular *implementation*
of them is paused.

## Build state at time of hold

The app was substantially complete through Phase 3. Verified against the migrations and the
phase trackers in `docs/`:

**Built and working**

- **Phase 1 — Capture MVP (done).** All Tier 1 capture (Session Logs, Outreach Logs,
  Meeting Notes); declarative entry definitions + generic form renderer; Zod validation;
  standalone-table-per-entry schema; option lists; email/password auth with allowlist;
  text-file fallback templates + importer.
- **Phase 2 — Tier 2, depth, compute, media (done, 2A–2G).** All 10 entry types live
  (Contact Log, Hardware Change Log, Software Change Log, Test Log, Decision Log,
  Competition Recap added to the Tier 1 three); entry detail pages; draft → complete
  depth/outcome fill (`updateEntry`); Test Log auto-compute in `lib/compute/`; Decision Log
  triggered depth fields (trade-off matrix, FMEA, first-principles, sensitivity); media by
  link + upload to a Google Drive shared drive; SCL AI integration with an **outbound**
  Discord commit-digest.
- **Phase 3 — Multi-user, RBAC, RLS, dashboard (essentially done, 3A–3F).** Role model +
  member management; strict role-based row-level security (replacing the Phase 1 permissive
  policies); 24h edit lock with `edit_reason` audit; Captain/admin dashboard with member
  roster, flag queue + overdue alerts, and KPI rollups; Subsystem Handoff mapping
  (`member_subsystems`) in place.

**What remained**

- **Phase 3 — 3G (deferred, not blocking).** Inbound Discord capture (`/session …`
  slash-command → entry). Deferred pending an App-Lead Discord app + secrets; go/no-go was
  never taken. (Note: *outbound* Discord — the SCL digest — already shipped in Phase 2.)
- **Phase 4 — never started.** Weekly Classification Pass UI + classification index view,
  the `/export` endpoint, mobile responsiveness/polish, and the Subsystem Handoff workflow
  (the data hooks exist; the workflow UI does not).
- **Phase 5+ — never started.** In-season iteration and the entry-type UI builder.

## Resumability

The repo is mothballed, not abandoned — nothing here is deleted. If work resumes:

1. **Re-audit dependencies.** The lockfile will be stale; expect Next.js / Supabase JS /
   tooling to need updates. Run `pnpm install`, then `pnpm verify` (typecheck + lint +
   format + test + build) and fix what has drifted.
2. **Re-verify both Supabase projects (dev + prod)** are still reachable, and that all
   migrations in `supabase/migrations/` are applied to each. Re-verify the Vercel
   deployment and required environment variables.
3. **Pick up at Phase 4.** Build order, scope, and the Phase 3 → Phase 4 hooks are in
   `docs/phase3/00-plan.md` (§ closing notes) and the charters under `docs/charters/`.

## Where the live context now lives

- **Plan + records:** the team's **Linear** workspace.
- **Documentation standards + the pivot decision record:** the team's separate **Claude
  project**. The MD documentation *standards* are maintained there and in Linear, decoupled
  from this codebase. The charters in `docs/charters/` remain a faithful snapshot of those
  standards as of the hold.

## For future agents / humans

**Do not resume feature work or open feature PRs without explicit re-authorization from the
team lead.** Treat this repo as **read-reference**: read it to understand what was built and
how, but make no functional changes until the team decides to un-pause. Documentation-only
clarifications are fine; anything touching application code, schema, or deployment is not.
