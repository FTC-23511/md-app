# Feature: 3A — Roles + members schema + helpers + seed

<!-- docs/briefs/2026-06-15-3a-roles-and-rbac-schema.md — Phase 3 step 3A. Spec: docs/phase3/01-rbac-and-rls.md §1–§3, §7. Plan: docs/phase3/00-plan.md. DB-only, additive — no behaviour change. -->

## What we're building

The foundation for multi-user roles, added to the database **without changing any app behaviour yet**. Re-create the `member_role` enum, add `role` / `is_active` / `is_outreach_reporter` columns to `members`, add a `member_subsystems` mapping table, backfill `created_by` on existing app-authored entries to the App Lead, promote the App Lead to Documentation Captain, and create the `SECURITY DEFINER` helper functions the RLS policies (3B) will use. Permissive RLS still holds, so the app works exactly as before.

## Why

Phase 3 turns MD-App into a multi-user tool. Everything downstream (strict RLS, the 24h lock, the dashboard, Discord) needs a role model. The legacy role schema was dropped (`00-plan.md` §0), so this rebuilds it cleanly and additively, and seeds the App Lead as Captain **before** any policy flips — the lockout-safety step (R1).

## Acceptance criteria

- Migrations apply on **dev** then **prod**: `member_role` enum exists (5 values, no `outreach_reporter`); `members` has `role` (default `general_member`), `is_active` (default true), `is_outreach_reporter` (default false); `member_subsystems(member_id, subsystem_option_id)` exists.
- After the seed migration, the App Lead's `members.role = 'documentation_captain'` and `is_active = true`; existing `created_via='app'` entries have `created_by` = the App Lead's auth uid; `created_via IN ('fallback_form','import')` rows still have `created_by = NULL`.
- Helper functions exist with `EXECUTE` granted to `authenticated`: `current_role_name`, `is_active_member`, `is_captain`, `is_captain_or_deputy`, `can_write_entries`, `is_outreach_reporter`, `leads_subsystem`, `owns_row`, `within_edit_window`.
- **No behaviour change:** the App Lead can still create + read + edit every entry type on the Vercel preview, exactly as before this batch.
- `pnpm verify` green.

## Out of scope

- Any RLS policy change — that is 3B (the permissive `*_all_authenticated` policies stay untouched this batch).
- The 24h-lock app logic (3C), the member admin UI (3D), the dashboard (3F).
- Adding `outreach_reporter` as an enum value (it is the additive boolean).

## Open questions

- **Resolving the App Lead identity in the seed migration** — match the `members`/`auth.users` row by `email = ALLOWED_EMAIL` (recommended, idempotent) vs hardcoding the auth uid. Implementer reads the actual value from the dev project at authoring time; confirm at PR.
- **`member_subsystems` grants** — fold into the 3A grants migration (recommended) vs the 3B RLS migration. Default: 3A grants migration.
