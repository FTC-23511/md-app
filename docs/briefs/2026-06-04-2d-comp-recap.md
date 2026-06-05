# Feature: Phase 2 batch 2D — Competition Recap

<!--
Filename: docs/briefs/2026-06-04-2d-comp-recap.md
Batch: Phase 2 — 2D per docs/phase2/00-plan.md
Specs: docs/phase2/01-schema.md §6 (comp_recaps), docs/phase2/02-forms-and-detail.md §5 (entry def, §1 section-header block), MD_Project_Charter.md T-04 + SOP-04 (grep, do not read whole)
Depends on: 2A schema live (comp_recaps). 2C shipped (the companion view reads test_series / test_logs trends produced by 2C). Build AFTER 2C — that is why 2D follows 2C in the plan.
Status: brief complete; blocked behind 2A + 2C.
-->

## What we're building

The Competition Recap — the heaviest entry, capturing everything a team learns from a competition: outcome, 5-whys root-cause analysis, notable matches, judging debrief, strategic insights, and a self-audit. Plus a **companion view** that auto-generates a Test Log trend (no extra typing — it reads the series the team already filed).

This is the last unbuilt Tier 1 entry; building it here completes the Tier 1 set.

## Why

Competition Recaps are where the season's biggest lessons get captured, and the portfolio leans heavily on them. The companion Test Log trend closes the loop between testing and competition outcomes without manual transcription. Spec: `docs/phase2/00-plan.md` step 2D; table `01-schema.md` §6; charter T-04 / SOP-04.

## Acceptance criteria

Observable in the Vercel preview. One yes/no each.

**Form**

- `entries/competition-recap.ts` registered; route `app/(authed)/entries/recap/new/page.tsx`.
- Typed columns: `competition_name`, `comp_start_date`, `comp_end_date`, `outcome`, `auto_reliability_pct` per `01-schema.md` §6.
- `extras` sections per `01-schema.md` §6: `judging` (interview + pit panels + evidence gaps), `root_cause` (array of up to 3 `{failure, whys[], root_cause, owner_action}` — the 5-whys), `notable_matches` (array), `strategic_insights` (array of `{insight, decision_trigger, owner}`), `alliance_scouting`, `what_worked`, `changes_before_next`, `per_person`, `documentation_self_audit`.
- The form is organized with the new **`section-header`** block (presentational grouping, honors `visibleWhen`) so the large form stays navigable.
- Can run a Comp Recap end-to-end with 5-whys, notable matches, judging, and strategic insights filled. Saves to `comp_recaps`, appears in `/entries/list`, opens read-only on the detail page (arrays rendered as readable tables).

**Companion view**

- On the Comp Recap detail page, a companion section **auto-generates a Test Log trend** for the relevant window — reads `test_series` / `test_logs` (produced by 2C), shows the headline-stat trend. Computed for display, **not stored** on the recap (`01-schema.md` §6).

**Regression**

- `pnpm verify` + both CI checks green. All prior entries (Tier 1 + 2B + 2C) still file.

## Out of scope

- **`updateEntry` / outcome fill-later** — Comp Recap is filed complete; no draft→complete flow needed here. (Decision Log outcome flow is 2E.)
- **Media attachment** to the recap — **2F**.
- **AI summarization** of the recap — not in Phase 2 scope beyond the SCL pass (2G), and SCL is software-change-focused, not recaps. No Claude call here.
- **Decision Log** — 2E.
- **New compute logic / unit tests** — the companion view reads already-computed `test_series` values; it does not compute new statistics. If any reduction is needed, keep it trivial and inline (no `lib/compute/` module required unless it grows).

## Open questions

1. **Companion view window.** Which Test Logs does the trend include — all logs dated within `comp_start_date` minus N weeks, all logs since the prior competition, or a tester-selected label set? Recommend "all `test_series` rows in the 6 weeks before `comp_start_date`", with the window configurable later. Confirm before building if it changes the query shape.
2. **5-whys row cap.** `01-schema.md` §6 says "up to 3" root-cause entries. Hard cap at 3, or soft (warn but allow more)? Recommend hard cap at 3 to keep the entry focused (matches charter SOP-04 intent — grep to confirm).
3. **`section-header` shared with 2E.** The `section-header` block is also needed by Decision Log (2E). If 2E ships first or an engine PR precedes it, reuse that block here rather than redefining. Either order is fine — whichever batch adds it first owns it.
