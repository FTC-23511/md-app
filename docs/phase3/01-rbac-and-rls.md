# Phase 3 — RBAC & RLS (specs for 3A + 3B)

Canonical spec for the role model and row-level security. Read `00-plan.md` §0 (schema reconciliation) and §1 (role matrix) first — this doc specifies the SQL shape, not the rationale. Follows `docs/phase1/02-schema.md` conventions (migration numbering, grants-in-own-migration, SECURITY DEFINER helper style mirrored from `20260521000001_extensions_and_helpers.sql`).

---

## 1. Members schema additions (3A — additive only)

`ALTER TABLE public.members`:

| Column                 | Type                 | Default            | Purpose                          |
| ---------------------- | -------------------- | ------------------ | -------------------------------- |
| `role`                 | `public.member_role` | `'general_member'` | base role                        |
| `is_active`            | `boolean NOT NULL`   | `true`             | deactivation without delete      |
| `is_outreach_reporter` | `boolean NOT NULL`   | `false`            | additive Outreach Reporter grant |

Re-create the enum (dropped with the legacy schema — `00-plan.md` §0):

```sql
CREATE TYPE public.member_role AS ENUM (
  'documentation_captain',
  'deputy_documentation_captain',
  'subsystem_documentation_lead',
  'general_member',
  'mentor'
);
```

> **No `outreach_reporter` enum value** — it is the additive boolean above. Adding it as a role would corrupt the single-role matrix (R7).

**`member_subsystems`** (replaces the dropped `subsystem_leads`):

```sql
CREATE TABLE public.member_subsystems (
  member_id           uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  subsystem_option_id uuid NOT NULL REFERENCES public.option_lists(id),
  PRIMARY KEY (member_id, subsystem_option_id)
);
```

The `on_auth_user_created` trigger keeps inserting `(id, email, display_name)`; the new columns take their defaults, so an invited user is auto-created as an active `general_member`. No trigger change needed.

---

## 2. Seed + backfill (3A)

Order matters — must run **before** 3B flips policies (R1).

1. **Backfill `created_by`** on app-authored rows to the App Lead's auth uid, scoped so genuine imports are never clobbered:
   ```sql
   UPDATE public.<each entry table>
   SET    created_by = '<APP_LEAD_AUTH_UID>'
   WHERE  created_by IS NULL AND created_via = 'app';
   ```
   Import/fallback rows keep `created_by = NULL` → Captain-managed (falls out of the RLS pattern, §4).
2. **Promote the App Lead** to Captain:
   ```sql
   UPDATE public.members
   SET    role = 'documentation_captain', is_active = true
   WHERE  email = '<ALLOWED_EMAIL value>';   -- the App Lead row, backfilled at 20260528000001:155
   ```
   Prefer matching by the known email (or auth uid) rather than assuming a single row. Idempotent.

Resolve `<APP_LEAD_AUTH_UID>` / `<ALLOWED_EMAIL value>` at migration-authoring time from the live `auth.users` row (do not hardcode a guess; the implementer reads it from the dev project and the same value is correct on prod since it's the same user).

---

## 3. Helper functions (3A) — `SECURITY DEFINER`, `STABLE`, `SET search_path = public`

All keyed off `auth.uid()`. `SECURITY DEFINER` is mandatory: it lets a helper read `members` while bypassing `members`' own RLS, which is what prevents recursion (R2). Grant `EXECUTE` to `authenticated` (in the grants migration).

| Function                                       | Returns   | Logic                                                                                                                                         |
| ---------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `current_role_name()`                          | `text`    | `members.role::text` for `auth.uid()` where `is_active AND deleted_at IS NULL`, else `NULL`. (New name — not the dead `current_member_role`.) |
| `is_active_member()`                           | `boolean` | true iff `auth.uid()` maps to a member with `is_active AND deleted_at IS NULL`. The read/allowlist gate.                                      |
| `is_captain()`                                 | `boolean` | `current_role_name() = 'documentation_captain'`.                                                                                              |
| `is_captain_or_deputy()`                       | `boolean` | role ∈ {captain, deputy}. The "anytime write / 24h override" class.                                                                           |
| `can_write_entries()`                          | `boolean` | role ∈ {captain, deputy, subsystem_documentation_lead, general_member}. Excludes mentor. Gates INSERT.                                        |
| `is_outreach_reporter()`                       | `boolean` | `members.is_outreach_reporter` for `auth.uid()`.                                                                                              |
| `leads_subsystem(p_subsystem_option_id uuid)`  | `boolean` | `EXISTS(SELECT 1 FROM member_subsystems WHERE member_id = auth.uid() AND subsystem_option_id = p_subsystem_option_id)`; false on NULL input.  |
| `owns_row(p_created_by uuid)`                  | `boolean` | `p_created_by IS NOT NULL AND p_created_by = auth.uid()`. NULL (import rows) → false.                                                         |
| `within_edit_window(p_created_at timestamptz)` | `boolean` | `p_created_at + INTERVAL '24 hours' > now()`. Keyed on `created_at` (not `updated_at`) so re-edits don't extend the window.                   |

---

## 4. RLS policy pattern (3B) — applied once across the 10 entry tables

Use a PL/pgSQL `FOREACH` loop over the 10 table names (the idiom already in `20260521000006`): per table, `DROP POLICY <table>_all_authenticated`, then create the four policies. Two per-table substitution arrays drive the table-specific clauses.

**SELECT** — every active member reads all (non-deleted):

```sql
USING ( is_active_member() AND deleted_at IS NULL )
```

**INSERT** — writers create as themselves; authorship unforgeable:

```sql
WITH CHECK ( can_write_entries() AND created_by = auth.uid() AND created_via = 'app' )
```

**UPDATE** — the composite gate (clauses OR together):

```sql
USING (
  ( deleted_at IS NULL OR is_captain_or_deputy() )       -- captain/deputy may also restore soft-deleted
  AND (
    is_captain_or_deputy()                                       -- (a) override, anytime
    OR ( owns_row(created_by) AND within_edit_window(created_at) )-- (b) author, within 24h
    OR ( <OUTREACH_CLAUSE> )                                     -- (c) reporter, indefinite
    OR ( <SUBSYSTEM_CLAUSE> )                                    -- (d) subsystem lead
  )
)
WITH CHECK ( created_by = auth.uid() OR is_captain_or_deputy() )
```

**DELETE** — Captain-only hard delete (routine deletes are soft via UPDATE→`deleted_at`):

```sql
USING ( is_captain() )
```

**Per-table substitutions:**

| Clause               | Tables where it is the real expression                                     | Elsewhere |
| -------------------- | -------------------------------------------------------------------------- | --------- |
| `<OUTREACH_CLAUSE>`  | `outreach_logs` → `is_outreach_reporter() AND owns_row(created_by)`        | `FALSE`   |
| `<SUBSYSTEM_CLAUSE>` | `hw_change_logs`, `decision_logs` → `leads_subsystem(subsystem_option_id)` | `FALSE`   |

**Service-role / null-`created_by` composition (no special case):** the fallback importer uses the service-role key, which bypasses RLS entirely. Its rows are `created_by = NULL, created_via = 'import'`. Under UPDATE, `owns_row(NULL)` is false → import rows are editable only by Captain/Deputy, matching the backfill decision.

**Subsystem-scoping (ratified, R6):** `<SUBSYSTEM_CLAUSE> = FALSE` on the 8 non-subsystem tables encodes "Subsystem Lead = general member there"; the real clause on hw/decision logs gives them subsystem-scoped write.

---

## 5. `members` table policies (3B) — replace the permissive one

```sql
DROP POLICY members_all_authenticated ON public.members;

-- SELECT: any active member can read the roster (dashboard + admin UI need it)
CREATE POLICY members_select ON public.members FOR SELECT TO authenticated
  USING ( is_active_member() );

-- UPDATE: Captain manages roles/active for anyone; a member may edit their own
-- profile fields (display_name) but NOT role/is_active — enforce the column
-- restriction at the app layer (server action), since RLS can't diff columns cleanly.
CREATE POLICY members_update_captain ON public.members FOR UPDATE TO authenticated
  USING ( is_captain() ) WITH CHECK ( is_captain() );
CREATE POLICY members_update_self ON public.members FOR UPDATE TO authenticated
  USING ( id = auth.uid() ) WITH CHECK ( id = auth.uid() );
```

`member_subsystems`: SELECT for active members; `ALL` for Captain/Deputy (they assign leads). Use direct `id = auth.uid()` / `is_captain()` only — no non-definer self-select on `members` (R2).

---

## 6. Allowlist → membership gate (3B)

Current: `user.email !== env.ALLOWED_EMAIL` in `lib/supabase/middleware.ts:61` + the `!user` redirect in `app/(authed)/layout.tsx`.

**New gate:** "an active member exists for `auth.uid()`". Since `members.id = auth.uid()`, this is a SELECT on `members` for `id = user.id AND is_active AND deleted_at IS NULL`. Middleware uses the anon client with the user's cookies, so this read is subject to the `members_select` policy (§5) — fine, a member can always read their own row.

- 0 rows → `signOut()` + redirect `/forbidden`; 1 row → continue.
- **Bootstrap pass (decision 6 / R1):** additionally allow through any session whose `user.email === env.ALLOWED_EMAIL`, even with no active member row. Keep `ALLOWED_EMAIL` in `lib/env.ts`; document it as bootstrap-only. After 3A the App Lead already has a Captain row, so this is pure belt-and-suspenders.
- Mirror the check in `app/(authed)/layout.tsx` (defense-in-depth).

**Preview verification:** App Lead signs in (passes); set a test member `is_active = false` and confirm the bounce to `/forbidden`.

---

## 7. Migration files (timestamps `202606xx`, dev-first then prod)

| Batch | File                              | Contents                                                                               |
| ----- | --------------------------------- | -------------------------------------------------------------------------------------- |
| 3A    | `…_phase3_roles_and_members.sql`  | enum + members columns + `member_subsystems`                                           |
| 3A    | `…_phase3_seed_app_lead.sql`      | backfill `created_by`; promote App Lead → Captain                                      |
| 3A    | `…_phase3_helpers.sql`            | the §3 helper functions                                                                |
| 3A    | `…_grants_for_phase3_roles.sql`   | `EXECUTE` grants on helpers; table grants for `member_subsystems`                      |
| 3B    | `…_phase3_strict_rls_entries.sql` | the §4 loop + §5 members policies (per-table transactional swap — no deny-all gap, R9) |

**Cutover safety:** 3A is additive — permissive policies still hold, the app works for everyone authenticated, and the App Lead becomes Captain. Only after preview go/no-go does 3B replace policies per-table in single transactions.
