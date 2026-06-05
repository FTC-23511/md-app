# Feature: Phase 2 batch 2E — Decision Log + triggered depth + outcome flow

<!--
Filename: docs/briefs/2026-06-04-2e-decision-log.md
Batch: Phase 2 — 2E per docs/phase2/00-plan.md
Specs: docs/phase2/02-forms-and-detail.md §1 (new blocks), §2 (triggered depth), §4 (updateEntry/outcome), docs/phase2/01-schema.md §5 (decision_logs), MD_Project_Charter.md SOP-05 (grep, do not read whole)
Depends on: 2A schema live (decision_logs). The hardest form — built after the simpler ones have extended the engine. An engine-extension PR (the shared matrix/fmea/section-header blocks) may precede the form PR (00-plan §4).
Status: brief complete; blocked behind 2A.
-->

## What we're building

The Decision Log — the most complex Tier 2 entry. A fast 5-minute initial entry (always-required fields only) that can grow **depth sections** the filer opts into via trigger checkboxes, plus an **outcome** that gets filled in later once the decision plays out.

Depth sections (each gated by its own self-applied trigger checkbox, SOP-05):
- **Weighted trade-off matrix** — criteria × options, scores 1–5; **weighted totals + winner auto-computed**.
- **FMEA** — failure modes with severity/likelihood/detectability; **RPN = S×L×D auto-computed per row**.
- **First-principles math** and **sensitivity** depth fields.

This batch also adds **`updateEntry`** — the edit path Phase 1 lacks — used for both depth-fill and outcome-update, and reused by later flows.

## Why

Decision Logs capture the reasoning the portfolio is judged on, but forcing full rigor on every decision kills capture. The triggered-depth design keeps the initial entry inside the 5-minute budget while letting important decisions carry matrix/FMEA rigor, filled later. Spec: `docs/phase2/00-plan.md` step 2E; blocks + depth `02-forms-and-detail.md` §§1,2,4; table `01-schema.md` §5; charter SOP-05.

## Acceptance criteria

Observable in the Vercel preview. One yes/no each.

**New field blocks** (add to `FieldBlock` union, a renderer in `components/entry-form/blocks/`, a `parseFormDataWithDefinition` case, and a `schemaForBlock` case — keep declarative/serializable):

- `checkbox` — single boolean depth trigger; gates a section via `visibleWhen: {field, truthy: true}`.
- `section-header` — presentational heading + helper, honors `visibleWhen`, no stored value. (Shared with 2D — reuse if already added.)
- `alternatives` — repeating `{label, pros, cons, predicted}`, min 3; stored in `extras.alternatives`.
- `matrix` — criteria rows `{name, weight}` (weights sum to 1.0) × option columns, 1–5 per cell.
- `fmea` — rows `{failure_mode, effect, severity, likelihood, detectability, mitigation}`.
- `computed-readonly` — displays `lib/compute/` output; never accepts input; excluded from submit (recomputed server-side).

**Initial entry (5-min budget)**

- `entries/decision-log.ts` registered; route `app/(authed)/entries/decision/new/page.tsx`. `defaultEntryState: 'draft'`.
- Always-required only: typed `subsystem_option_id`, `decision_date`, optional `parent_entry_type`/`parent_entry_id`; `extras` `problem_statement`, `constraints`, `alternatives` (min 3), `paths_not_taken`, `decision`, `rationale`, `predicted_outcome`.
- Each depth trigger is a `checkbox` with the charter's trigger text as label/helper. Depth blocks carry `visibleWhen: {field:'<checkbox>', truthy:true}` + a `section-header`, are `required:false` at the schema level (a Decision Log may need zero depth), and hidden fields are dropped from submit (Phase 1 behavior).
- Filing with no triggers checked saves a valid Decision Log to `decision_logs`, `entry_state='draft'`, appears in list + detail.

**Auto-compute**

- `lib/compute/` pure, **unit-tested** functions (vitest): matrix weighted totals + winner; FMEA RPN per row. Computed server-side on submit (and via the shared importer path). Surfaced via `computed-readonly` — never typed.
- Checking the matrix trigger reveals the matrix section; entering scores shows the weighted totals + winner computed automatically. Same for FMEA → RPN.

**Depth-fill + outcome (the `updateEntry` flow)**

- `lib/update-entry.ts` added, mirroring `lib/insert-entry.ts`: parse → validate → split column/extras → `UPDATE ... WHERE id=$1`. Runs on current permissive RLS (Phase 3 attaches the 24h lock here — single chokepoint).
- On the detail page, a **"Complete this entry"** action re-opens the form pre-filled, lets the filer add previously-hidden depth sections, and flips `entry_state` to `complete` when the required-for-complete set is satisfied.
- An **"Add outcome"** mini-form fills `actual_outcome`, `delta`, `learned` later (`01-schema.md` §5). (Same `updateEntry` also covers the HW Change Log measured-delta fill-later from 2B.)

**Regression**

- `pnpm verify` + both CI checks green. All prior entries still file. Hidden-field-drop and `visibleWhen` truthy behavior unchanged for existing forms.

## Out of scope

- **SW Change Log AI deep-dive, SCL integration** — 2G.
- **Media attachment** — 2F.
- **Test Log AI analysis** — separate follow-up (see 2C brief).
- **Phase 3 edit restrictions** (24h lock, RLS tightening) — `updateEntry` is the chokepoint where they'll attach later, but this batch adds the capability only, on permissive RLS.

## Open questions

1. **Engine-extension PR first?** The `matrix` / `fmea` / `section-header` / `computed-readonly` blocks are shared (2D uses `section-header`; the compute pattern recurs). `00-plan.md` §4 suggests a dedicated engine PR before 2E. Recommend: ship the shared blocks + `lib/compute/` matrix+FMEA functions (with unit tests) as one engine PR, then the Decision Log form as a second PR consuming them. Confirm or collapse into one.
2. **Matrix weight validation.** Weights must sum to 1.0 — enforce strictly (block submit) or warn + normalize? Recommend warn + auto-normalize on compute so a fast filer isn't blocked, surfacing the normalized weights in the `computed-readonly` output.
3. **`required-for-complete` set.** Which fields must be present before `entry_state` flips to `complete`? Recommend: the always-required initial set + any depth section whose trigger is checked must be non-empty. Confirm against SOP-05 (grep) before wiring the flip.
4. **`updateEntry` scope creep.** This is the first edit path in the app. Keep it to the two callers above (complete-a-draft, add-outcome); do not build a general "edit any field anytime" UI — that invites the Phase 3 restriction questions early.
