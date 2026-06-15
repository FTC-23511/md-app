# Feature: 3D — Member management / onboarding UI

<!-- docs/briefs/2026-06-15-3d-member-admin.md — Phase 3 step 3D. Spec: docs/phase3/03-member-admin.md. Depends on 3A (roles) + 3B (requireCaptain/gate). -->

## What we're building

A Captain-only screen at `/admin/members` to grow the team: invite members by email, assign/change their role, assign subsystems to Subsystem Leads, and deactivate/reactivate members. Inviting sends a Supabase magic-link email; because `members.id` is the auth user id and a DB trigger auto-creates the member row, there is no manual account-linking step.

## Why

This replaces the single-email allowlist as the way people get into the app — the Captain (App Lead) can now onboard the whole team self-serve, which is the point of multi-user.

## Acceptance criteria

- `/admin/members` lists every member (display_name, email, role, active, subsystems); a non-Captain visiting it is bounced.
- Captain invites a teammate by email; the row appears (active, `general_member`); the teammate receives the email, clicks it, signs in, and lands on `/dashboard` with access.
- Captain changes a member's role (e.g. to Deputy) and assigns a Subsystem Lead one or more subsystems; the roster reflects it.
- Captain deactivates a member; that member is bounced to `/forbidden` on their next navigation; reactivating restores access.
- Attempting to demote/deactivate the **last active Captain** is refused with a clear message.
- The service-role client lives only in `lib/supabase/admin.ts` and is never bundled client-side.
- `pnpm verify` green.

## Out of scope

- A member self-service profile page (editing your own display_name) — separate, optional.
- Bulk invite / CSV import.
- Email template / SMTP configuration — an App-Lead ops task (Supabase dashboard), surfaced via `/human-task-list`.

## Open questions

- **Initial role at invite time** — let the Captain pick a role in the invite form (recommended) vs always invite as `general_member` and promote afterward. Default: pick at invite.
- **Resend vs revoke** — on a failed/expired invite, "Resend invite" reuses the row (recommended). Do we also need a "revoke/remove" that deletes an unaccepted member row? Default: deactivate is enough; no hard delete UI this batch.
- **SMTP** — confirm whether the App Lead has configured custom SMTP or we rely on Supabase defaults for the acceptance demo.
