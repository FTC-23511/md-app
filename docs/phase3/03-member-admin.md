# Phase 3 — Member management / onboarding (spec for 3D)

Captain-only screen to grow the team: invite members by email, assign roles, deactivate. Replaces the single-email allowlist as the way people get into the app. Reuses the existing auth trigger so there is no manual "linking" step (`00-plan.md` §0).

---

## 1. How invite works with the live schema

The trigger `on_auth_user_created` (`20260528000001:134`) already inserts a `members` row `(id, email, display_name)` for every new `auth.users` row, and (after 3A) the new columns default to active `general_member`. So the invite flow is just:

1. Captain enters a name + email + initial role on `/admin/members`.
2. Server action (service-role, `lib/supabase/admin.ts`) calls `auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE_URL}/dashboard` })`.
3. Supabase creates the `auth.users` row → trigger creates the `members` row → invite email sent.
4. When the invitee accepts the magic link and signs in, their `members.id` already equals their `auth.uid()` — **already linked**. The membership gate (`01-rbac-and-rls.md` §6) lets them in.
5. Captain sets the real role + (optionally) `display_name` and subsystem assignments from the roster.

No `auth_user_id` column, no `/auth/link` route, no orphan unlinked rows. If the chosen initial role isn't `general_member`, the action updates `members.role` right after the invite (or the Captain sets it from the roster once the row exists).

---

## 2. First-Captain bootstrap

The first Captain (App Lead) is seeded in **3A** (`01-rbac-and-rls.md` §2). No invite UI needed for them. The `ALLOWED_EMAIL` bootstrap pass (`01` §6) guarantees they can always sign in to fix a broken roster.

---

## 3. UI + files

| Path | Role | Notes |
| ---- | ---- | ----- |
| `app/(authed)/admin/members/page.tsx` | server | `requireCaptain()` guard; shadcn `Table` of members (display_name, email, role, active, subsystems) |
| `app/(authed)/admin/members/members-table.tsx` | client | role `Select`, active toggle, "Resend invite", subsystem multi-select for leads |
| `app/(authed)/admin/members/actions.ts` | server | `inviteMember`, `setMemberRole`, `setMemberActive`, `assignSubsystems`, `resendInvite`; each `requireCaptain()`; `revalidatePath` |
| `lib/supabase/admin.ts` | server-only | the **only** service-role client (lazy, never imported client-side) |
| `lib/members.ts` | shared | `listMembers()`, `getCurrentMember()`, `requireCaptain()`, the role-label constant |

`requireCaptain()` reads the current member (via the anon client / `current_role_name()`), throws/redirects if not `documentation_captain`. Existing admin sub-area precedent: `app/(authed)/admin/manage-tags/page.tsx`.

**Column-restriction note:** `setMemberRole`/`setMemberActive` run with `requireCaptain()` and write via the anon client under the `members_update_captain` policy. A member editing their own `display_name` uses `members_update_self` but the action must reject any attempt to change `role`/`is_active` (RLS allows the row, the server action enforces the column subset).

**Last-Captain guard:** `setMemberRole`/`setMemberActive` must refuse to demote or deactivate the only remaining active `documentation_captain` (count check in the action) — prevents self-lockout.

---

## 4. Acceptance (browser, on preview)

- Captain visits `/admin/members`, sees the roster; a non-Captain visiting `/admin/members` is bounced.
- Captain invites a teammate; the row appears (active, general_member); teammate receives the email, clicks it, signs in, lands on `/dashboard` with access.
- Captain changes the teammate's role to Deputy and assigns a Subsystem Lead a subsystem; reflected in the roster.
- Captain deactivates the teammate; on the teammate's next navigation they are bounced to `/forbidden`.
- Attempting to deactivate the last active Captain is refused with a clear message.

---

## 5. Risks

- **Service-role exposure** — `lib/supabase/admin.ts` is the single home; verify it is never imported into a client component (it reads `SUPABASE_SERVICE_ROLE_KEY` via the `lib/env.ts` lazy getter, which throws if bundled client-side).
- **Email delivery** — Supabase's default SMTP has low caps; production invites need the App Lead to configure SMTP (an App-Lead setup task, surface via `/human-task-list`). Verify the DoD with a second real inbox.
- **Role typo locks features** — the last-Captain guard + the `ALLOWED_EMAIL` bootstrap pass together prevent a dead-ended app.
