# Feature: Phase 2 batch 2B — the three quick forms (Contact / Hardware / Software baseline)

<!--
Filename: docs/briefs/2026-06-04-2b-quick-forms.md
Batch: Phase 2 — 2B per docs/phase2/00-plan.md
Specs: docs/phase2/01-schema.md §§1-3 (tables), docs/phase2/02-forms-and-detail.md §5-§6 (entry defs + routes), docs/phase1/03-forms.md (engine, unchanged)
Depends on: 2A schema live on dev AND prod (the contact_logs/contacts, hw_change_logs, sw_change_logs tables). Cannot start until the 2A migration is approved + deployed (ROUTINE §9).
Status: brief complete; blocked behind 2A.
-->

## What we're building

The three cheapest Tier 2 forms, each reusing the Phase 1 form engine with no new field-block types if avoidable:

1. **Contact Log** — log one interaction with an external contact (mentor, sponsor, partner). The person lives in a separate `contacts` table (privacy, SOP-09); the log references them.
2. **Hardware Change Log** — a versioned hardware change (what changed, why, version bump).
3. **Software Change Log (baseline)** — a software change (what changed, why, commit/branch). The AI deep-dive section is explicitly **2G**, not now.

After this batch, the team can file all three from `/entries/<type>/new`, each appears in the cross-type list, and each opens read-only on the 2A detail page.

## Why

These three are the highest-frequency, lowest-complexity Tier 2 entries and reuse the existing engine almost verbatim — they ship fast and prove the 2A tables end-to-end (write path + list + detail). Spec: `docs/phase2/00-plan.md` step 2B; tables `docs/phase2/01-schema.md` §§1–3; entry defs `docs/phase2/02-forms-and-detail.md` §5.

## Acceptance criteria

Observable in the Vercel preview. One yes/no each.

**Contact Log**

- `entries/contact-log.ts` registered in `entries/_registry.ts`; route `app/(authed)/entries/contact/new/page.tsx` (mirror Phase 1 pattern, `force-dynamic`).
- Form captures: contact (select existing **or** create new — see Open Q1), `contact_date`, `contact_method`, and `extras` text fields `topic`, `outcomes_commitments`, `follow_up_next_action`, `follow_up_date` per `01-schema.md` §1.
- On save: a `contact_logs` row writes with `created_via='app'`, `entry_state='complete'`; a new contact (if created) writes to `contacts` with its typed + `extras` fields.
- New Contact Log appears in `/entries/list` and opens read-only on `/entries/contact/<id>`.

**Hardware Change Log**

- `entries/hardware-change-log.ts` + route `app/(authed)/entries/hardware/new/page.tsx`.
- Captures typed `subsystem_option_id` (reuse seeded `subsystem` category), `change_date`, `version`, `replaces_version`, optional `parent_decision_id`; `extras` `what_changed`, `why`, `deltas` (array of `{metric, was, now}`), `tradeoffs` per `01-schema.md` §2.
- Saves to `hw_change_logs`, appears in list, opens on detail page.

**Software Change Log (baseline)**

- `entries/software-change-log.ts` + route `app/(authed)/entries/software/new/page.tsx`. `defaultEntryState: 'draft'`.
- Captures typed `change_type_option_id` (reuse seeded `change_type`), `change_date`, `commit_hash`, `branch`, optional `parent_decision_id`; `extras` `what_changed`, `why`, `hardware_sensors`, `game_challenge`, `before_behavior`, `after_behavior`, `failure_modes`, `verification`, `files_changed` (array) per `01-schema.md` §3.
- Saves to `sw_change_logs` with `entry_state='draft'`, appears in list, opens on detail page.

**Shared**

- List-view type pills + dashboard quick-action nav updated to include the three new types.
- `pnpm verify` and both CI checks green. Existing Tier 1 entries still file (no regression).

## Out of scope

- **SW Change Log AI deep-dive** (`ai_deep_dive`, `transcript_url`, `prompt_version`) — **2G**.
- **Media attachment** (`media_links`, sponsor `visual_assets`, HW photos) — **2F**. The `media_links` table exists from 2A but nothing writes to it this batch.
- **`updateEntry` / fill-later / outcome update** — lands in 2C/2E where first needed. HW measured-delta "fill in later" is an outcome update → 2E's `updateEntry`.
- **Test Log, Decision Log, Comp Recap** — later batches.
- **New compute logic / unit tests** — none of these three compute anything.

## Open questions

1. **Contact select-or-create UX.** `contact_logs.contact_id` is a required FK to `contacts`. Does the Contact Log form (a) show a searchable dropdown of existing contacts + an "add new contact" inline sub-form, or (b) always create a new contact inline for now and defer dedup to later? Recommend (a) with a simple `display_name` search; Claude Code's call if (a) balloons past the cheap-form budget — fall back to (b) and flag in the PR.
2. **`deltas` / `files_changed` repeating rows.** These are array-of-object (`{metric, was, now}`) and array-of-string shapes. Reuse an existing dynamic-row composite block (e.g. the `action-items` pattern) rather than adding a new block type if it fits; if a minimal new repeating block is cleaner, add it and note it. Avoid pulling in the `matrix`/`fmea` blocks (those are 2E).
3. **PR batching.** Three independent forms → three auto-merge PRs (one per form), or one bundled `phase2: 2B quick forms` PR? Default to one PR per form (each green on CI before merge) per the routine's one-item-per-cycle rhythm, unless the contact select-or-create work makes the Contact Log PR large enough to warrant splitting.
