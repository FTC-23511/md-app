# Feature: 3B — Strict RLS + membership gate

<!-- docs/briefs/2026-06-15-3b-strict-rls.md — Phase 3 step 3B. Spec: docs/phase3/01-rbac-and-rls.md §4–§7. Depends on 3A (roles seeded). The security cutover. -->

## What we're building

Replace the permissive `FOR ALL TO authenticated USING (true)` policy on every entry table (and `members`) with role-based row-level security per the charter §6 matrix, and replace the single-email allowlist with a real membership gate ("an active member exists for this signed-in user"). After this batch, who can read/write/edit/delete is enforced by the database, not by being the one allowed email.

## Why

This is the core Phase 3 security goal: strict RLS as a **replacement** for the Phase 1 permissive policies (CLAUDE.md "Phase 3 replaces, not adds"). It is what makes multi-user safe — a general member can't edit someone else's entry, a mentor is read-only, and only the Captain/Deputy can override.

## Acceptance criteria

- Migration applies on **dev** then **prod**: each of the 10 entry tables has the four role-based policies (SELECT/INSERT/UPDATE/DELETE per `01-rbac-and-rls.md` §4); `members` has the §5 policies; no `*_all_authenticated` policy remains on these tables. The swap is per-table transactional (no deny-all gap).
- App Lead (Captain) retains full read/write/edit on the preview.
- A **deactivated** member, or a signed-in user with no active member row, is bounced to `/forbidden` on navigation.
- A **general member** can create any entry and edit their own entry within 24h, but cannot edit another member's entry (RLS refuses).
- The `ALLOWED_EMAIL` bootstrap pass still lets the App Lead in even with a misconfigured roster.
- The fallback importer (service-role) still inserts rows successfully (bypasses RLS).
- `pnpm verify` green.

## Out of scope

- The friendly 24h-lock error messages + `edit_reason` capture — that's 3C (this batch's RLS *enforces* the lock; the nice errors come next).
- The member admin UI (3D) — this batch ships the gate; inviting teammates comes in 3D.

## Open questions

- **Subsystem-scoping default (ratify).** Only `hw_change_logs` + `decision_logs` carry a subsystem column, so a Subsystem Lead gets extended write only there and behaves as a general member on the other 8. Confirm this is the intended reading of charter §6 "own subsystem's entries."
- **Soft-deleted restore.** Should Captain/Deputy be able to UPDATE a soft-deleted row to restore it? The spec allows it (the UPDATE USING omits the `deleted_at IS NULL` filter for them). Confirm.
- **`members` self-edit scope.** A member may edit their own `display_name` but not `role`/`is_active`; enforced in the 3D server action. Confirm no self-service profile screen is needed this batch.
