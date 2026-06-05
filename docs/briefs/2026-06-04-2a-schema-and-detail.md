# Feature: Phase 2 batch 2A — Tier 2 schema rebuild + entry detail page

<!--
Filename: docs/briefs/2026-06-04-2a-schema-and-detail.md
Batch: Phase 2 — 2A per docs/phase2/00-plan.md
Specs: docs/phase2/01-schema.md (tables), docs/phase2/02-forms-and-detail.md §3 (detail page)
Status: brief complete; first batch of Phase 2; nothing depends on it shipping first except everything after it.
-->

## What we're building

The foundation for the rest of Phase 2. Two things, no new forms yet:

1. The database tables for the five Tier 2 entry types plus Competition Recap and supporting tables, rebuilt against the current standalone-table architecture (the original Tier 2 tables were dropped in the forms-rev2 reshape).
2. A real entry **detail page** — `/entries/[type]/[id]` is currently a placeholder. Make it open any saved entry of any built type and show its contents read-only.

After this batch, the team can click any entry in the list and read it on its own page, and the schema is ready for the form batches (2B–2E) to write into.

## Why

Every later Phase 2 batch needs these tables and a way to view a saved entry; the Tier 2 tables don't currently exist and the detail page doesn't render. This is the unblocking batch. Spec: `docs/phase2/00-plan.md` step 2A; tables in `docs/phase2/01-schema.md`; detail page in `docs/phase2/02-forms-and-detail.md` §3.

## Acceptance criteria

Observable in the Vercel preview / locally. One yes/no each.

**Schema (approval-required PR — migrations)**

- Migration(s) create these tables per `docs/phase2/01-schema.md`, each with the common columns, `set_updated_at` trigger, `created_at DESC` partial index `WHERE deleted_at IS NULL`, permissive Phase 1-style RLS (`*_all_authenticated`): `contacts`, `contact_logs`, `hw_change_logs`, `sw_change_logs`, `test_logs`, `decision_logs`, `comp_recaps`, `media_links`.
- `defaultEntryState` tables (`decision_logs`, `sw_change_logs`, `test_logs`) accept `entry_state = 'draft'`; others default `'complete'`.
- Grants for the new tables land in their **own** migration (matches `20260530000001` / `20260602000001` — the "expose new tables" setting is off, so grants are manual and tracked).
- Migrations apply cleanly to **dev first** (CLI confirmed linked to dev), then prod. `pnpm verify` and CI both green.
- Existing Tier 1 entries (session / outreach / meeting) still file and appear in `/list` — no regression.

**Detail page**

- `/entries/[type]/[id]` resolves `type` → definition via `entries/_registry.ts`, reads `definition.table`, selects the row by `id` `WHERE deleted_at IS NULL`.
- Opening any existing session / outreach / meeting entry from the list shows its fields read-only: `*_option_id` columns resolved to their option labels; `extras` arrays (stories, per-person contributions, action items, specialty triggers) rendered as readable tables.
- An `entry_state` badge (Draft / Complete) shows on the page.
- Any `flags` raised from the entry are listed on the page (open Tier 2 to-dos).
- A missing or soft-deleted `id` shows a clean "not found", not a crash.

## Out of scope

Per `docs/phase2/00-plan.md` build order and `02-forms-and-detail.md`.

- **The Tier 2 forms themselves** (Contact / HW / SW / Test / Decision) and **Competition Recap form** — batches 2B–2E. This batch creates tables + the read view only; no `entries/*.ts` definitions for the new types yet.
- **`updateEntry` / edit / fill-later / outcome update** (`02-forms-and-detail.md` §4) — lands with the batches that need it (2C/2E).
- **New field block types** (`matrix`, `fmea`, `raw-data-table`, `media-links`, `computed-readonly`, `checkbox`, `section-header`) — added in the batch that first needs each.
- **`test_series` table** — a compute-support table; create it in 2C alongside the auto-compute, not now (avoids an unused table).
- **Media ingestion to Drive** — batch 2F. `media_links` table is created now, but nothing writes to it yet.
- **Test Log auto-compute, Decision Log depth triggers, AI analysis** — later batches.
- **`subsystem_handoffs`** — Phase 4.
- **Tests** beyond the manual smoke check (no compute logic in this batch).
- **Any change to `middleware.ts`, `app/auth/**`, `lib/supabase/`\*\* — not needed here.

## Open questions

_(resolved in planning)_

1. **Read renderer.** Reuse the existing `FieldRenderer` in a read-only mode vs a parallel read component — implementation detail, Claude Code's call; pick whichever keeps the renderer simplest.
2. **Alternatives / deltas storage.** Decision Log `alternatives` and HW `deltas` live in `extras` as JSON arrays (mirrors the `story-block` pattern), not child tables — `jsonb_array_length` covers the dashboard count. Confirmed in `01-schema.md`.
3. **One migration or split.** Fine to split into a couple of migrations for reviewability (e.g. entry tables / contacts+media / grants); keep each `LANGUAGE plpgsql` for any function.
