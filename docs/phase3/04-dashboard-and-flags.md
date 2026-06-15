# Phase 3 — Dashboard & flag alerts (specs for 3E + 3F)

The Captain == admin == documentation lead, so the Captain dashboard **is** the admin dashboard — one combined screen at `/dashboard`. Three sections: member roster, flag queue with overdue alerts, and KPI rollups. 3E (flag alerts) ships first as a self-contained helper the dashboard then imports.

All dashboard reads use the **anon** client (RLS-respecting) — never service-role. At team scale, parallel `head:true` count queries are cheap; mirror the existing fan-out in `lib/queries.ts#listAllEntries`.

---

## 1. Flag overdue (3E)

`flags` (`20260528000003:140`) has `status text CHECK ('open','closed','cancelled')`, `opened_at timestamptz`, `owner_member_id → members(id)`, `subject`. **No `due_at`.** So overdue is **derived**, not stored.

Pure helper module `lib/flags.ts`:

```
OVERDUE_THRESHOLD_HOURS = 72        // start here; single source of truth
isOverdue(flag)   -> status === 'open' && now - opened_at > threshold
flagAgeDays(flag) -> whole days since opened_at (UTC)
listOverdueFlags()-> open flags past the threshold, with owner display_name
```

Compute in UTC; present "age in days". Centralizing the threshold means the badge, the dashboard count, and any digest all agree.

**Optional outbound digest (post-only, mirrors `scl-digest.yml`):** a GH Actions workflow `flag-overdue-digest.yml` curls a **secret-guarded internal endpoint** `app/api/internal/overdue-flags/route.ts` (GET, requires `X-Cron-Secret` == `env.CRON_SECRET`, 401 otherwise, **no service-role**, exposes only subject + owner name + age) for a text digest, then curls `DISCORD_FLAG_WEBHOOK_URL`. Keep it strictly outbound. This piece is optional within 3E — the dashboard badge is the primary surface.

**DoD:** on `/dashboard`, an open flag older than 72h shows a red "OVERDUE" pill and the header count is correct; a fresh flag shows none. (Digest verifiable via `gh workflow run flag-overdue-digest.yml`.)

---

## 2. KPI rollups (3F)

Pure functions in `lib/dashboard/kpis.ts`; the page is a thin composition. Computable from existing columns:

| KPI                  | Source                                                                                  | Notes                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Entry counts by type | per-table `count('*', { head:true })` where `deleted_at IS NULL`                        | no row transfer                                                                       |
| By timeframe         | same + `created_at >= now()-7d/30d/season`                                              | season from the active `seasons` row if present                                       |
| Draft vs complete    | `entry_state` split                                                                     | drafts come from decision/sw/test logs                                                |
| Entries per member   | group `created_by` joined to `members.id` (join already correct — §0)                   | show **by display_name**, never null                                                  |
| By subsystem         | precise for `subsystem_option_id` (hw + decision logs); resolve `option_lists` id→label | **best-effort** for session-log `extras` multi-select — note the limitation in the UI |
| Capture latency      | `created_at::date − <event_date>` per table                                             | the charter's core metric; surface **median days from event to filed**                |

**Event-date columns** (9 of 10 tables have one; `contacts` is a person table, use `contact_logs.contact_date`): `session_logs.session_date`, `outreach_logs.event_date`, `meeting_notes.meeting_date`, `hw_change_logs.change_date`, `sw_change_logs.change_date`, `test_logs.test_date`, `decision_logs.decision_date`, `comp_recaps.comp_start_date`, `contact_logs.contact_date`. Exclude tables without an event date from the latency metric.

---

## 3. Dashboard composition (3F)

Rebuild `app/(authed)/dashboard/page.tsx` (currently a simpler page) into three server-component sections:

- **Roster + roles** — list members (display_name, email, role, active) + a link to `/admin/members` (3D). Reuses `lib/members.ts#listMembers`.
- **Flag queue** — `components/dashboard/flag-queue.tsx`, overdue pills + count, reuses `lib/flags.ts` (3E).
- **KPI cards** — `components/dashboard/kpi-cards.tsx`, reads `lib/dashboard/kpis.ts`.

**Non-Captain behaviour:** a general member hitting `/dashboard` should see a reduced self-view (their own counts), not a dead end — decide the exact reduced set in the 3F brief.

**DoD:** each section renders real non-zero data; "entries per member" shows names (not null); "median days from event to filed" matches a hand-check against a couple of known entries.

---

## 4. Files

| Batch | Create                                                                                                                                        | Modify                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 3E    | `lib/flags.ts`, `components/dashboard/flag-queue.tsx`, `app/api/internal/overdue-flags/route.ts`, `.github/workflows/flag-overdue-digest.yml` | `lib/env.ts` (`CRON_SECRET`, `DISCORD_FLAG_WEBHOOK_URL`) |
| 3F    | `lib/dashboard/kpis.ts`, `components/dashboard/kpi-cards.tsx`, `components/dashboard/roster.tsx`                                              | `app/(authed)/dashboard/page.tsx`                        |

---

## 5. Risks

- Subsystem KPI is **partial** (only the 2 column-backed tables are exact); present honestly, don't imply full coverage.
- All reads must run under the caller's session (RLS), never service-role — otherwise the dashboard would leak rows a role shouldn't see.
- KPI correctness depends on the `created_by ↔ members.id` join, which is already correct in the live schema (§0) — do not "fix" it.
- Threshold (72h) is a judgment call; centralize in `lib/flags.ts` so it's a one-line change.
