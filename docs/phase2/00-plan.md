# Phase 2 plan

| Field              | Value                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phase              | 2 — Tier 2 entries, depth fields, auto-compute, media, detail pages                                                                                                                                                |
| Charters           | `docs/charters/MD_Project_Charter.md` (data semantics), `docs/charters/MD_App_Charter.md` (stack), `docs/charters/MD_SCL_AI_Integration.md` (SCL AI)                                                               |
| Inherits           | All Phase 1 conventions in `docs/phase1/01-conventions.md` and the schema/forms patterns in `docs/phase1/02-schema.md` + `03-forms.md` — still in force, not restated here                                         |
| Definition of done | Team can file all Tier 2 entries + Competition Recap, open any entry on a detail page, fill depth/outcome fields after the initial draft, attach media by link, and get Test Log statistics computed automatically |

This document is the spine. Each build step below becomes a short brief in `docs/briefs/` (see `docs/briefs/_TEMPLATE.md`) once its spec section is settled.

---

## 1. Scope

### In scope

- The five Tier 2 entry forms: **Contact Log, Hardware Change Log, Software Change Log (baseline), Test Log, Decision Log**.
- **Competition Recap** (the last unbuilt Tier 1 entry).
- **Entry detail pages** — `/entries/[type]/[id]` currently a placeholder; make it render any entry read-only.
- **Draft → Complete** support: fill depth fields and outcome fields _after_ the initial 5-minute entry (`updateEntry` + edit/fill flow).
- **Test Log auto-compute** (`docs/phase2/03-test-log.md`).
- **Decision Log triggered depth fields** — matrix, FMEA, first-principles math, sensitivity (`docs/phase2/02-forms-and-detail.md`).
- **Media by link** (`docs/phase2/04-media.md`).
- **SCL AI integration** — planned in its own pass at the end of the phase (`docs/phase2/05-scl-ai.md`).

### Out of scope (later phases, per `CLAUDE.md`)

- Multi-user auth, roles (RBAC), strict row-level security, the 24h-edit restriction, Discord webhooks → **Phase 3**.
- Weekly Classification Pass UI, classification index view, `/export` endpoint, mobile polish, Subsystem Handoff workflow → **Phase 4**.
- Entry-type UI builder → Phase 5+.

Phase 2 builds depth-fill and outcome-update on the **current permissive RLS**. The _restrictions_ (who can edit what, lock after 24h) are deliberately Phase 3. No conflict — Phase 2 adds the capability, Phase 3 adds the guardrails.

---

## 2. Build order

Each step is independently operational and ships as its own PR batch. Each DoD is browser-observable.

| Step   | Name                         | Definition of done (observable)                                                                                                                                              |
| ------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2A** | Schema rebuild + detail page | All Tier 2 tables exist on dev + prod (`docs/phase2/01-schema.md`); `/entries/[type]/[id]` opens any saved entry read-only                                                   |
| **2B** | The three quick forms        | Can file a Contact Log, Hardware Change Log, and Software Change Log (baseline); each appears in the list and opens on its detail page                                       |
| **2C** | Test Log + auto-compute      | Can file a pass/fail, a single-measure, and a custom-table Test Log; statistics populate without the user typing a formula; a second run with the same label shows the delta |
| **2D** | Competition Recap            | Can run a Comp Recap with 5-whys, notable matches, judging, strategic insights; companion view pulls the Test Log trend                                                      |
| **2E** | Decision Log + depth         | Can file a Decision Log; checking a depth trigger reveals that section; the trade-off matrix totals + winner compute automatically; outcome can be filled in later           |
| **2F** | Media to Drive               | Paste a link or upload a file on any entry; team-owned media auto-ingests to the Shared Drive, YouTube/Vimeo stay native; a preview shows and DB storage stays near zero     |
| **2G** | SCL AI integration           | Own planning pass — see `docs/phase2/05-scl-ai.md`. Not started until 2B's SW Change Log baseline ships                                                                      |

Ordering logic: 2A unblocks everything. 2B is cheap (reuses the Phase 1 engine). 2C before 2D because the Comp Recap companion view reads Test Log series. 2E is the hardest form, so it comes after the engine has been extended by the simpler ones. 2F retrofits media onto whatever exists. 2G is biggest and riskiest, last.

---

## 3. Architecture decisions recorded here

These revise or extend earlier assumptions. Where they touch `MD_App_Charter.md`, open an issue per the §9 interface contract so the charter changelog records the change.

1. **Auto-compute lives in TypeScript, not database triggers.** `MD_App_Charter.md` §5's sketch shows "auto-compute on insert" as DB triggers. We instead put compute in pure, unit-tested functions in `lib/compute/` and call them from both the app submit path _and_ the fallback importer (`scripts/fallback/`). Reason: the vitest suite is the team's safety net, and TS math is covered there directly; PL/pgSQL triggers are opaque, untested by CI, and bypassed by no write path only if compute is at a shared chokepoint. Sharing one pure module across both write paths gives path-independence without the trigger. **Record this revision in `MD_App_Charter.md`.**
2. **Standalone tables per entry type continue.** No base `entries` table (the Sprint A base+detail design was dropped in the forms-rev2 reshape). Every Tier 2 table carries the common columns directly, exactly like `session_logs`.
3. **Media lives in Google Drive, ingested automatically.** Team-owned or fragile media (file uploads, Discord attachments, loose links) is downloaded and re-homed in the team **Shared Drive** via a **service account**; the DB stores only the Drive link. YouTube/Vimeo stay as native links. This resolves the `MD_App_Charter.md` §4 photo-storage risk — **record the resolution per §9**. See `04-media.md`.
4. **`updateEntry` is new.** Phase 1 only has `insertEntry`. Draft→complete, depth-fill, and outcome-update all need an update path. Add `lib/update-entry.ts` mirroring `lib/insert-entry.ts`.

---

## 4. PR batching

Same discipline as Phase 1 (`docs/phase1/00-plan.md` §PR batching, `ROUTINE.md`):

- One migration PR per step that needs schema (2A is the big one; later steps add small migrations as needed).
- One PR per entry form, each green on both CI checks before merge.
- Engine extensions (new field blocks) land in the PR of the first form that needs them, or a dedicated engine PR if shared by several (the matrix/FMEA/media blocks are shared — consider an engine PR before 2E).
- Docs-only changes auto-merge tier.

---

## 5. Risks

| Risk                                                               | Mitigation                                                                                                                                                                                    |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision Log depth UI balloons past the 5-min initial-entry budget | The initial form is only the always-required fields; depth sections are hidden until a trigger checkbox is ticked, and filled later via the detail page. Enforce in `02-forms-and-detail.md`. |
| Test Log AI analysis burns tokens on routine tests                 | Code-first rule: AI runs only for custom shapes code can't reduce, or on explicit user request. Daily/entry cap. See `03-test-log.md` §5.                                                     |
| Expiring Discord links rot before portfolio season                 | App ingests Discord bytes into the Shared Drive on add, before the link expires; nightly link-health check flags any dead links at Friday 15. See `04-media.md`.                              |
| Migration applied to wrong environment                             | Confirm `.env.local` + re-link Supabase CLI to dev before migrating (known gotcha). Grants tracked in their own migration (known gotcha).                                                     |
| SCL AI integration scope creep pulls focus from forms              | Hard-gate: 2G does not start until 2B baseline ships, and gets its own brief set.                                                                                                             |

---

## 6. Progress tracker

| Step | Status   | PR(s)   | Notes                                                                                                                                                                                                           |
| ---- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2A   | **done** | #34     | schema on dev + prod; detail page live                                                                                                                                                                          |
| 2B   | **done** | #35–#37 | Contact / HW / SW (baseline) all live                                                                                                                                                                           |
| 2C   | **done** | #38–#43 | auto-compute + `test_series` rollup + fallback importer                                                                                                                                                         |
| 2D   | **done** | #52–#53 | Comp Recap + companion trend view — Tier 1 set complete                                                                                                                                                         |
| 2E   | **done** | #44–#51 | Decision Log + depth + `updateEntry` + outcome flow                                                                                                                                                             |
| 2F   | paused   |         | built design ready (brief `2026-06-15-2f-media.md`); held on App Lead Google Drive setup (service-account share + Vercel secrets)                                                                               |
| 2G   | in PR    |         | **rescoped 2026-06-15** (skill-based, not per-commit AI — see `05-scl-ai.md`): `/scl` Claude Code skill → fallback-format file → existing importer; daily Discord commit digest (GitHub Action). No app-side AI |

---

## 7. Handoff to Phase 3

Phase 3 adds multi-user auth, roles, strict RLS, the 24h-edit lock, and Discord webhooks. Phase 2 leaves these hooks ready: every table already has `created_by` and permissive RLS policies to replace; `updateEntry` is the single edit chokepoint where the 24h rule will attach; `entry_state` already distinguishes draft from complete.
