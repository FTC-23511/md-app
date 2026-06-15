# Phase 3 — 24h edit lock (spec for 3C)

The 24h lock freezes the contemporaneous record: a member may correct their own entry within 24h of creation, then it locks. Captain/Deputy can edit anything anytime, but an entry older than 24h requires an `edit_reason` (audit trail). Charter §6: _"allows correction-of-fact in the immediate aftermath but freezes the contemporaneous record before memory erodes the original capture."_

**Hybrid enforcement** (`00-plan.md` decision 3): RLS is the hard gate (already designed in `01-rbac-and-rls.md` §4 UPDATE clause `(b)` + `(a)`); this batch adds the **app-layer** friendly errors and `edit_reason` capture. RLS stays the authoritative backstop — if the TS pre-check is ever wrong, the DB still refuses.

---

## 1. The predicate

`within_edit_window(created_at)` = `created_at + INTERVAL '24 hours' > now()` (helper from `01-rbac-and-rls.md` §3). Keyed on **`created_at`**, not `updated_at`, so editing does not extend the window.

---

## 2. `entry_edit_audit` table (3C)

A dedicated audit table — **not** an `extras` key. `lib/update-entry.ts` read-merges `extras` (`:88-101`), so a reason stored there would be silently overwritten (R8). Polymorphic, matching the `flags`/`media_links` shape:

```sql
CREATE TABLE public.entry_edit_audit (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type       text NOT NULL,        -- registry key, e.g. 'session_log'
  entry_id         uuid NOT NULL,
  editor_member_id uuid NOT NULL REFERENCES public.members(id),
  edit_reason      text NOT NULL,
  edited_at        timestamptz NOT NULL DEFAULT now()
);
```

RLS: INSERT only when `is_captain_or_deputy()`; SELECT for active members; no UPDATE/DELETE. Grants in the follow-on grants migration.

---

## 3. Override RPC (3C) — atomic edit + audit

A `SECURITY DEFINER` function so the entry UPDATE and the audit INSERT commit together (no half-states). Signature sketch:

```
record_entry_edit( p_entry_type text, p_entry_id uuid, p_edit_reason text ) RETURNS void
```

It inserts the audit row for `auth.uid()`. The actual column UPDATE continues through the normal Supabase update path in `update-entry.ts`; the RPC is called in the same request when an `edit_reason` was required. (If a single transaction across both is needed, wrap the column update in the RPC too — implementer's call; the simpler split is acceptable since RLS already authorizes the row.)

---

## 4. `lib/update-entry.ts` changes (3C)

Today the chokepoint (`lib/update-entry.ts:1-121`) parses → validates → splits → reads current `extras` → updates by id. A denied UPDATE returns **0 rows**, `.single()` throws PGRST116, and the raw string is surfaced (R3).

Extend the existing pre-update read (`:88`, already fetching `extras`) to also fetch `created_by` + `created_at`; fetch the caller's role via `current_role_name()`. Then compute the **same decision RLS will make** and branch:

| Caller vs row                                                | Behaviour                                                                                                                                                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mentor, or inactive member                                   | `{ ok:false, formError: 'Your role does not permit editing entries.' }` — no DB write                                                                                                                          |
| Author, within 24h                                           | proceed (normal update)                                                                                                                                                                                        |
| Author, **past 24h**, not Captain/Deputy                     | `{ ok:false, formError: 'This entry is locked. Only the Documentation Captain or Deputy can edit it more than 24 hours after it was filed.' }`                                                                 |
| Outreach Reporter, own `outreach_log`                        | proceed (indefinite)                                                                                                                                                                                           |
| Subsystem Lead, own subsystem `hw_change_log`/`decision_log` | proceed                                                                                                                                                                                                        |
| Captain/Deputy, within 24h or own row                        | proceed (no reason required)                                                                                                                                                                                   |
| Captain/Deputy, **past 24h**, not author                     | **require `edit_reason`** in the FormData; if missing → `{ ok:false, formError: 'An edit reason is required to edit an entry more than 24 hours old.' }`; if present → proceed + call `record_entry_edit(...)` |

The `edit_reason` field is added to the edit/fill UI as a conditionally-shown input (visible only when the lock applies and the caller can override). On any unexpected 0-rows result, fall back to a generic `"You don't have permission to make this change."` — RLS is the backstop.

---

## 5. Acceptance (browser, on preview)

- A general member opens their own >24h entry → the edit affordance is disabled/explained with the friendly lock message; a <24h own entry is editable.
- The Captain opens a >24h entry → an `edit_reason` field appears; saving without it shows the reason-required error; saving with it succeeds and writes one `entry_edit_audit` row (verify by reading the row).
- A direct (non-app) UPDATE attempt by a non-owner past 24h is refused by RLS regardless of the app layer.
