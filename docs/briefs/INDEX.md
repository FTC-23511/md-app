# Briefs index

Source of truth for what briefs exist, which are pending, and which Phase 1 batches they cover. The App Lead writes briefs in Claude Chat (planning phase), commits the result here, and `/prep-backlog` decomposes the brief into BACKLOG items the routine ships autonomously.

The intent is **focused planning while awake → autonomous execution while asleep**. Briefs are how the user spends their time; routine runs are how Claude spends compute.

## Phase 1 batch status

| Batch               | Tasks   | Brief                                                                                         | Status                                                                                                                                                                                      |
| ------------------- | ------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup               | T01–T04 | n/a                                                                                           | ✅ shipped                                                                                                                                                                                  |
| Schema              | T05–T08 | n/a                                                                                           | ✅ shipped                                                                                                                                                                                  |
| Auth                | T09–T12 | n/a (chat handoff in [#7](https://github.com/FTC-23511/md-app/pull/7))                        | ✅ shipped                                                                                                                                                                                  |
| **Forms + entries** | T13–T17 | [2026-05-28-forms-rev2.md](2026-05-28-forms-rev2.md) (supersedes [rev1](2026-05-28-forms.md)) | ✅ shipped — all 16 BACKLOG items merged, full forms layer + 3 Tier-1 entries + list view live                                                                                              |
| **Fallback**        | T18–T19 | [2026-05-28-fallback.md](2026-05-28-fallback.md)                                              | ✅ shipped — templates + importer live; smoke test ([#33](https://github.com/FTC-23511/md-app/pull/33)) surfaced + fixed a service_role grant gap, a parser bug, and non-idempotent re-runs |
| Deploy              | T20–T21 | n/a (manual ops)                                                                              | ✅ ready                                                                                                                                                                                    |

## Phase 2 batch status

Build order + specs: `docs/phase2/00-plan.md`. One brief per batch (2A–2G).

| Batch                                  | Brief                                                                    | Status                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **2A — schema rebuild + detail page**  | [2026-06-04-2a-schema-and-detail.md](2026-06-04-2a-schema-and-detail.md) | ✅ shipped — [#34](https://github.com/FTC-23511/md-app/pull/34), migrations live on **dev + prod**, detail page live |
| 2B — three quick forms (Contact/HW/SW) | [2026-06-04-2b-quick-forms.md](2026-06-04-2b-quick-forms.md)             | brief written — **unblocked** (2A live); ready for `/prep-backlog`                                                   |
| 2C — Test Log + auto-compute           | [2026-06-04-2c-test-log.md](2026-06-04-2c-test-log.md)                   | brief written — **unblocked** (2A live); ready for `/prep-backlog`                                                   |
| 2D — Competition Recap                 | [2026-06-04-2d-comp-recap.md](2026-06-04-2d-comp-recap.md)               | brief written — **blocked behind 2C** (companion view reads 2C `test_series`)                                        |
| 2E — Decision Log + depth              | [2026-06-04-2e-decision-log.md](2026-06-04-2e-decision-log.md)           | brief written — **unblocked** (2A live); ready for `/prep-backlog`                                                   |
| 2F — Media to Drive                    | owed                                                                     | review media design first                                                                                            |
| 2G — SCL AI integration                | owed (own planning pass)                                                 | not before 2B SW baseline ships                                                                                      |

> **Gating note for the routine:** 2A is live on prod (2026-06-05), so 2B/2C/2E are **clear to decompose** into `docs/BACKLOG.md` — autonomously by the routine (ROUTINE §2 "Brief decomposition") or via `/prep-backlog`. 2D still waits on 2C (`test_series`). Decomposing only **queues** the items; any migration sub-item (e.g. 2C's `test_series`) still stops for human merge approval at run time (§3/§4). Decompose one brief per cycle, in build order; don't dump all three at once.

## Phase 3 batch status

Build order + specs: `docs/phase3/00-plan.md`. Security core (3A–3C) is linear; features (3D–3F) build on it; 3G is final + deferrable. One brief per batch.

| Batch                                  | Brief                                                                            | Status                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **3A — roles + members schema + seed** | [2026-06-15-3a-roles-and-rbac-schema.md](2026-06-15-3a-roles-and-rbac-schema.md) | ✅ **done** (#57) — applied dev + prod; App Lead seeded as Captain    |
| 3B — strict RLS + membership gate      | [2026-06-15-3b-strict-rls.md](2026-06-15-3b-strict-rls.md)                       | ✅ **done** (#58) — applied dev + prod; +members column-guard trigger |
| 3C — 24h edit lock + audit             | [2026-06-15-3c-edit-lock.md](2026-06-15-3c-edit-lock.md)                         | ✅ **done** (#59) — applied dev + prod; entry_edit_audit + RPC        |
| 3D — member management / onboarding UI | [2026-06-15-3d-member-admin.md](2026-06-15-3d-member-admin.md)                   | ✅ **done** (#60) — /admin/members; invite/role/subsystem/activate    |
| 3E — flag overdue alerts               | [2026-06-15-3e-flag-alerts.md](2026-06-15-3e-flag-alerts.md)                     | ✅ **done** (#61) — overdue helper + dashboard badge; digest deferred |
| 3F — Captain/admin dashboard           | [2026-06-15-3f-captain-dashboard.md](2026-06-15-3f-captain-dashboard.md)         | brief written — **blocked behind 3D (roster) + 3E (flag helper)**     |
| 3G — inbound Discord capture           | [2026-06-15-3g-discord-inbound.md](2026-06-15-3g-discord-inbound.md)             | brief written — **deferrable**; depends on 3D; gated on Discord keys  |

> **Gating note:** migration batches (3A schema, 3B RLS swap, 3C audit table, 3G Discord tables) each stop for human merge approval at run time. 3B is the security cutover — verify on the dev preview before the prod push (App Lead must stay able to write; see `00-plan.md` R1). Decompose one brief per cycle, in build order.

## How to write a brief

1. Open the [md-app Claude Project](https://claude.ai) (Opus 4.7 recommended).
2. Plan freely — share mockups, ask questions, iterate on UX.
3. Reference the spec for that batch: `docs/phase1/00-plan.md` (task range) + `docs/phase1/03-forms.md` / `04-auth.md` / `05-fallback.md` (the deep specs).
4. At the end, ask Chat: _"Produce a brief in markdown using the template at `docs/briefs/_TEMPLATE.md`."_
5. Save as `docs/briefs/YYYY-MM-DD-<slug>.md` and commit (direct to `main`).
6. Update this index — move the batch from "owed" to "written" and link the file under "Brief inventory" below.

That's all you do. The next routine cycle (or an on-demand `/prep-backlog`) reads `docs/briefs/` per `docs/ROUTINE.md` §2 and auto-proposes decomposed BACKLOG items. No manual decomposition needed from you.

## Brief inventory

- [`2026-06-04-2a-schema-and-detail.md`](2026-06-04-2a-schema-and-detail.md) — Phase 2 batch 2A: rebuild the Tier 2 tables + build the entry detail page. First Phase 2 brief.
- [`2026-06-04-2b-quick-forms.md`](2026-06-04-2b-quick-forms.md) — Phase 2 batch 2B: the three cheap forms (Contact / Hardware / Software baseline). Blocked behind 2A.
- [`2026-06-04-2c-test-log.md`](2026-06-04-2c-test-log.md) — Phase 2 batch 2C: Test Log (3 input modes) + code-first auto-compute (`lib/compute/test-stats.ts`, unit-tested) + `test_series` trends. Blocked behind 2A.
- [`2026-06-04-2d-comp-recap.md`](2026-06-04-2d-comp-recap.md) — Phase 2 batch 2D: Competition Recap (last Tier 1 entry) + Test Log companion trend view. Blocked behind 2A + 2C.
- [`2026-06-04-2e-decision-log.md`](2026-06-04-2e-decision-log.md) — Phase 2 batch 2E: Decision Log + triggered depth (matrix/FMEA auto-compute) + `updateEntry` outcome/fill-later flow. Hardest form. Blocked behind 2A.
- [`2026-05-28-forms-rev2.md`](2026-05-28-forms-rev2.md) — Forms + entries batch (T13–T17), path B. Sprint C. 16 BACKLOG items, 3 approval-required (schema migrations) + 13 auto-merge. **Supersedes rev1.**
- [`2026-05-28-forms.md`](2026-05-28-forms.md) — Forms + entries rev1. Sprint C. Superseded by rev2 after cycle 2 surfaced a schema-architecture mismatch with the auth-batch migrations.
- [`2026-05-28-fallback.md`](2026-05-28-fallback.md) — Fallback batch (T18–T19). Sprint D. ✅ Shipped across [#31](https://github.com/FTC-23511/md-app/pull/31) (templates), [#32](https://github.com/FTC-23511/md-app/pull/32) (importer), [#33](https://github.com/FTC-23511/md-app/pull/33) (smoke test + fixes).
- [`2026-06-15-3a-roles-and-rbac-schema.md`](2026-06-15-3a-roles-and-rbac-schema.md) — Phase 3 batch 3A: re-create the role model on the live `members` schema (enum + columns + `member_subsystems`), helper functions, seed App Lead as Captain, backfill `created_by`. DB-only, additive. Spec `docs/phase3/01-rbac-and-rls.md`.
- [`2026-06-15-3b-strict-rls.md`](2026-06-15-3b-strict-rls.md) — Phase 3 batch 3B: replace permissive RLS with role-based policies across the 10 entry tables + `members`; swap `ALLOWED_EMAIL` for a membership gate. The security cutover. Blocked behind 3A.
- [`2026-06-15-3c-edit-lock.md`](2026-06-15-3c-edit-lock.md) — Phase 3 batch 3C: friendly 24h-lock messaging + `edit_reason` audit at the `update-entry.ts` chokepoint. Blocked behind 3B.
- [`2026-06-15-3d-member-admin.md`](2026-06-15-3d-member-admin.md) — Phase 3 batch 3D: Captain-only `/admin/members` — invite, role change, deactivate; reuses the auth trigger (no manual linking). Blocked behind 3A+3B.
- [`2026-06-15-3e-flag-alerts.md`](2026-06-15-3e-flag-alerts.md) — Phase 3 batch 3E: derived flag overdue detection (`lib/flags.ts`, 72h) + dashboard pill; optional outbound Discord digest. Self-contained.
- [`2026-06-15-3f-captain-dashboard.md`](2026-06-15-3f-captain-dashboard.md) — Phase 3 batch 3F: combined Captain/admin dashboard (roster + flag queue + KPI rollups incl. capture latency). Blocked behind 3D+3E.
- [`2026-06-15-3g-discord-inbound.md`](2026-06-15-3g-discord-inbound.md) — Phase 3 batch 3G: inbound Discord capture via signed webhook + self-link handshake; reuses the insert pipeline. Final, deferrable. Spec `docs/phase3/05-discord-inbound.md`.

<!-- When a brief lands, add a row like:
- `2026-05-28-auth-brief.md` — Auth batch (T09–T12). Sprint B.
-->

## Decomposition (handled by the routine)

A single brief covers a whole batch (multiple tasks). The routine ships **one BACKLOG item per cycle** — so a brief gets decomposed into 4–8 smaller items before automation can do useful work on the batch. Per `docs/ROUTINE.md` §2, this happens automatically: the prep phase scans `docs/briefs/` for un-decomposed briefs and either auto-adds the items it's confident about or escalates ambiguous ones in the cycle summary for you to review via `/human-task-list`.

Typical decomposition for an auth brief might produce:

- Brief in `docs/briefs/...auth.md` (the one big artifact)
- BACKLOG items: "implement middleware allowlist", "build login form + server action", "build forgot-password page", "build reset-password callback", "build change-password page", "add sign-out action", etc.

Each item is small enough for one routine cycle.

## Sprint-mode PR batching

`docs/phase1/00-plan.md` §"PR batching strategy" says related sprint tasks land as one PR (e.g., the whole auth batch ships as one PR titled `phase1: auth batch`). Reconciling that with the routine's one-PR-per-cycle default is an open routine refinement — for now, each decomposed item ships as its own PR. Chattier review surface, but functional. Worth revisiting once Sprint B is actually in flight and the friction is concrete.
