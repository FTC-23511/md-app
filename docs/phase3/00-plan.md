# Phase 3 plan

| Field              | Value                                                                                                                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase              | 3 — Multi-user auth, roles (RBAC), strict RLS, 24h edit lock, Captain/admin dashboard, flag alerts, inbound Discord capture                                                                                                                                                                                                 |
| Charters           | `docs/charters/MD_Project_Charter.md` (roles/operating model), `docs/charters/MD_App_Charter.md` §6 (role + permission model), §7 (phased build)                                                                                                                                                                            |
| Inherits           | All Phase 1 + Phase 2 conventions (`docs/phase1/01-conventions.md`, `02-schema.md`; `docs/phase2/00-plan.md`) — still in force, not restated                                                                                                                                                                                |
| Definition of done | The team uses MD-App as a real multi-user tool: members are invited and hold roles; row-level security enforces who can read/write/edit/delete; entries lock 24h after creation; the Captain has a dashboard with flag overdue alerts + KPI rollups; (final, deferrable) members can file low-friction entries from Discord |

This document is the spine. Each build step below becomes a short brief in `docs/briefs/` (template `docs/briefs/_TEMPLATE.md`) once its spec section is settled. Deep specs live in the numbered docs in this folder.

> **Phase 2 → Phase 3 hooks (from `docs/phase2/00-plan.md` §7):** every entry table already has `created_by` and a permissive RLS policy to replace; `updateEntry` (`lib/update-entry.ts`) is the single edit chokepoint where the 24h rule attaches; `entry_state` already distinguishes draft from complete.

---

## 0. Critical schema reconciliation (verified against migrations — load-bearing)

The legacy auth-batch schema (migrations `20260521000001`–`…008`) was **torn down** by `20260528000001_drop_legacy_schema.sql`. Any Phase 3 design that assumes the old `members`/`member_role`/`subsystem_leads` shapes is wrong. The **live** state:

```
members( id uuid PK REFERENCES auth.users(id) ON DELETE CASCADE,
         email text UNIQUE, display_name text,
         created_at, updated_at, deleted_at )
```

- **No `role`, no `team_id`, no `auth_user_id`, no `is_active`.** The `member_role` enum was **DROPPED**. The role-helper functions + 24h UPDATE policy created in `…006` target the **dropped** base `entries` table and are dead. **Phase 3 rebuilds the role model; it does not reuse those helpers.**
- `members.id` **IS** `auth.users.id`. The trigger `on_auth_user_created` (`20260528000001:134`) auto-inserts a member row (`id, email, display_name`) for every new auth user. **"Account linking" is therefore automatic** — there is nothing to link manually.
- `created_by` on all 10 entry tables references `auth.users.id` = `members.id`. Ownership is the identity test `created_by = auth.uid()`. The existing dashboard + `lib/queries.ts` joins on `members.id = created_by` are **already correct**.
- **Single-tenant:** one team, no `team_id`. Do not reintroduce team-scoping.
- Subsystems are `option_lists` rows (`category='subsystem'`), not a table. The old `subsystem_leads` table is gone — Phase 3 adds a `member_subsystems` mapping table.

**The 10 live entry tables Phase 3 secures** (each: `created_by`, `created_via('app'|'fallback_form'|'import')`, `entry_state('draft'|'complete')`, `extras jsonb`, `deleted_at`):
`session_logs`, `outreach_logs`, `meeting_notes`, `comp_recaps`, `contacts`, `contact_logs`, `hw_change_logs`, `sw_change_logs`, `test_logs`, `decision_logs`.
**Subsystem FK (`subsystem_option_id`) exists on only 2 of 10:** `hw_change_logs` (`20260604000001:117`) and `decision_logs` (`:222`).

---

## 1. Role / permission matrix (charter §6 — adopted verbatim)

| Role                             | Read | Write                                                | Notes                                                                                                                                         |
| -------------------------------- | ---- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Documentation Captain**        | all  | all + manage member roles + flags/classifications    | Admin-equivalent. == the App Lead.                                                                                                            |
| **Deputy Documentation Captain** | all  | all entries + flags                                  | Same as Captain **except** cannot change member roles                                                                                         |
| **Subsystem Documentation Lead** | all  | own subsystem's entries; comment on any              | Extended write **only** on `hw_change_logs` + `decision_logs` (the 2 tables with a subsystem column); general-member behaviour on the other 8 |
| **General member**               | all  | create any; edit **own** within 24h; read-only after | Default for students                                                                                                                          |
| **Mentor**                       | all  | none                                                 | Read-only oversight                                                                                                                           |
| **Outreach Reporter** (additive) | all  | edit the Outreach Log they own **indefinitely**      | A boolean flag layered on a base role, **not** an enum value                                                                                  |

**Subsystem-scoping decision (ratified, see 3B brief open question):** because only 2 of 10 tables carry a subsystem column, a Subsystem Lead's "own subsystem entries" write is defined only on `hw_change_logs` + `decision_logs`. On the other 8 they behave as a general member. This follows directly from the live schema.

---

## 2. Scope

### In scope

- **Multi-user membership + roles** — re-add a role model to `members`; Captain invites by email.
- **Strict RLS** — replace every permissive `*_all_authenticated` policy with role-based policies (the §1 matrix). This is a **replacement, not an addition** (CLAUDE.md "Phase 3 replaces, not adds").
- **24h edit lock** — entries lock 24h after creation; Captain/Deputy override anytime with an `edit_reason`.
- **Captain/admin dashboard** (combined — Captain == admin) — member roster, flag queue with **overdue alerts**, **KPI rollups**.
- **Inbound Discord capture** — self-link handshake + signed webhook reusing the insert pipeline. Final, deferrable batch.

### Out of scope (later phases, per CLAUDE.md)

- Weekly Classification Pass UI, classification index view, `/export` endpoint, mobile polish, **Subsystem Handoff workflow** → **Phase 4**. (Charter §7 groups Handoff in Phase 3; CLAUDE.md defers it to Phase 4 — CLAUDE.md wins, Handoff stays out.)
- Entry-type UI builder → Phase 5+.
- **Inbound** Discord beyond low-friction entry types (composites stay deferred). **Outbound** Discord (SCL digest) already shipped in Phase 2.

---

## 3. Build order

Each step is independently shippable and its DoD is browser-observable on the Vercel preview. Security core (3A–3C) is linear; features (3D–3F) build on it; 3G is last and droppable.

| Step   | Name                                        | Definition of done (observable)                                                                                                                                                                                                                                                          |
| ------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3A** | Roles + members schema + helpers + seed     | DB-only, additive. Role model exists; App Lead is seeded as Captain; `created_by` backfilled. App Lead still reads/writes on preview, no behaviour change yet. (`01-rbac-and-rls.md`)                                                                                                    |
| **3B** | Strict RLS + allowlist→membership gate      | Permissive policies replaced by role-based ones; `ALLOWED_EMAIL` gate replaced by "active member exists". App Lead has full access; a non-/deactivated member is bounced to `/forbidden`; a general member can create + edit own entry within 24h, blocked after. (`01-rbac-and-rls.md`) |
| **3C** | 24h edit lock + edit_reason audit           | A general member editing a >24h entry sees a friendly "locked" message; a Captain editing it is prompted for a reason and an audit row is written. (`02-edit-lock.md`)                                                                                                                   |
| **3D** | Member management / onboarding UI           | Captain invites a teammate at `/admin/members`; teammate accepts the email link and signs in; Captain changes their role and deactivates them; the deactivated member is bounced on next navigation. (`03-member-admin.md`)                                                              |
| **3E** | Flag overdue alerts                         | An open flag older than the threshold shows a red "OVERDUE" pill + correct count on the dashboard; a fresh flag shows none. (`04-dashboard-and-flags.md`)                                                                                                                                |
| **3F** | Captain/admin dashboard (combined)          | `/dashboard` renders three sections — roster + roles, flag queue (overdue), KPI rollups — each with real non-zero data; top filers show by name; capture-latency median matches a hand-check. (`04-dashboard-and-flags.md`)                                                              |
| **3G** | Inbound Discord capture (final, deferrable) | A member links via `/link` + code; a `/session …` command in Discord makes an entry appear with a "via Discord" indicator; an unsigned POST returns 401. (`05-discord-inbound.md`)                                                                                                       |

**Ordering logic.** 3A is purely additive and unblocks the security core without changing behaviour (safe to sit on). 3B is the security cutover. 3C attaches the lock at the existing chokepoint. 3D opens the app to the team (needs roles + `requireCaptain`). 3E is small and self-contained; it ships before 3F so the dashboard imports a finished overdue helper. 3F composes the roster (3D) + flags (3E) + KPIs. 3G is the highest external-risk, fully optional batch — ship last or never.

---

## 4. Architecture decisions recorded here

Where these touch `MD_App_Charter.md`, record per the §9 interface contract so the charter changelog tracks the change.

1. **Rebuild, don't reuse, the role model.** The legacy `member_role` enum + RLS helpers were dropped (§0). Phase 3 re-creates the enum and a **fresh** set of `SECURITY DEFINER` helpers keyed off `auth.uid()`. Do not resurrect migration `…006`'s helpers — they reference dropped tables.
2. **Ownership is identity, not a join.** Because `members.id = auth.users.id`, "is this my row" is `created_by = auth.uid()`. No `auth_user_id` indirection exists or is needed.
3. **24h lock = hybrid (RLS gate + app messaging).** RLS is the authoritative hard gate on every standalone table. `lib/update-entry.ts` mirrors the same decision in TypeScript only to return friendly errors and to require/record `edit_reason` on Captain/Deputy overrides. RLS cannot require a value that isn't a column, so the reason is enforced at the server layer and stored in a dedicated `entry_edit_audit` table (not `extras`, which `updateEntry` read-merges and would clobber).
4. **Outreach Reporter is an additive boolean, not a role.** No enum value; a `members.is_outreach_reporter` flag + helper, referenced only by the `outreach_logs` UPDATE policy.
5. **Service-role stays confined.** A new `lib/supabase/admin.ts` holds the only service-role client, used at exactly two real call sites — member invite (3D) and the Discord webhook (3G). The fallback importer keeps its own service-role usage. The dashboard (3F) and the flag digest endpoint (3E) use the **anon** client so RLS is actually exercised.
6. **Bootstrap survives a bad members table.** `ALLOWED_EMAIL` is demoted to a bootstrap-only pass: a session whose email equals `ALLOWED_EMAIL` is always allowed in, so the first Captain can never be locked out even if `members` is misconfigured.

---

## 5. PR batching

Same discipline as Phase 1/2 (`docs/ROUTINE.md`, `docs/phase1/00-plan.md` §PR batching):

- One migration PR per step that needs schema. **3A is the big additive one** (enum + members columns + helpers + seed); 3B is the RLS swap; 3C adds the audit table; 3G adds the Discord tables.
- App-layer batches (3D, 3F) ship as their own PRs, each green on both CI checks.
- Migrations apply **dev-first, verify on preview, then prod** via `supabase db push`. Never hand-edit prod. Grants land in their own follow-on migration (known gotcha).
- Each PR confirms its batch's browser DoD in the body.

---

## 6. Risks

| #   | Risk                                                        | Mitigation                                                                                                                                                  |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **App Lead lockout** at the strict-RLS cutover              | Promote App Lead → Captain in **3A**, before any policy change; keep the `ALLOWED_EMAIL` bootstrap pass (decision 6); verify on preview before 3B prod push |
| R2  | **RLS recursion** via `members` self-reference              | All helpers are `SECURITY DEFINER` (bypass `members` RLS internally); `members`' own policies use direct `id = auth.uid()`, never a non-definer self-select |
| R3  | Denied UPDATE returns **0 rows**, surfaced as a raw error   | 3C pre-checks role/ownership/window in TS and maps to friendly text; RLS remains the authoritative backstop                                                 |
| R4  | `created_by` **forgery** on INSERT                          | INSERT `WITH CHECK (created_by = auth.uid())` — unforgeable even via direct PostgREST                                                                       |
| R5  | **Service-role bypass** misused                             | Confined to `lib/supabase/admin.ts`; never in any `NEXT_PUBLIC_*`; importer scoped to `created_via='import'`; backfill scoped to `created_via='app'`        |
| R6  | **Subsystem-scope ambiguity** (8/10 tables lack the column) | Ratified default (§1): Subsystem Lead = general member on the 8, extended only on hw/decision logs; `<SUBSYSTEM_CLAUSE>=FALSE` on the 8                     |
| R7  | Outreach Reporter **mis-modeled** as a base role            | Additive `is_outreach_reporter` boolean + helper; only `outreach_logs` references it                                                                        |
| R8  | `edit_reason` **lost** in the `extras` read-merge           | Dedicated `entry_edit_audit` table via a `SECURITY DEFINER` RPC                                                                                             |
| R9  | **Deny-all gap** during the policy swap                     | Per-table transactional `DROP POLICY … ; CREATE POLICY …` in one migration; never a separate drop deploy                                                    |
| R10 | Discord: **unsigned/forged** payloads                       | Ed25519 verify before any DB work; 401 otherwise; service-role minimal + rate-limit by `discord_user_id`                                                    |
| R11 | Migration applied to the **wrong environment**              | Confirm `.env.local` + re-link Supabase CLI to **dev** before migrating; promote to prod only after preview verification                                    |

---

## 7. Progress tracker

| Step | Status  | PR(s) | Notes                                                           |
| ---- | ------- | ----- | --------------------------------------------------------------- |
| 3A   | done    | #57   | merged + applied to dev & prod; App Lead = Captain              |
| 3B   | done    | #58   | strict RLS + membership gate; dev & prod; +column-guard trigger |
| 3C   | done    | #59   | 24h lock messaging + entry_edit_audit; dev & prod               |
| 3D   | planned | —     | brief `2026-06-15-3d-member-admin.md`                           |
| 3E   | planned | —     | brief `2026-06-15-3e-flag-alerts.md`                            |
| 3F   | planned | —     | brief `2026-06-15-3f-captain-dashboard.md`                      |
| 3G   | planned | —     | brief `2026-06-15-3g-discord-inbound.md` — deferrable           |

---

## 8. Handoff to Phase 4

Phase 4 adds the Classification Pass UI + classification index view, the `/export` endpoint, mobile polish, and the Subsystem Handoff workflow. Phase 3 leaves these ready: roles + RLS gate who can run a classification pass; the dashboard + KPI module is the place a classification-status panel slots in; `member_subsystems` already maps leads to subsystems for the Handoff sign-off.
