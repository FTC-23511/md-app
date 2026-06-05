# Test Log — flexible data + auto-compute

## 1. The problem this solves

A Test Log must accept **any** test's data, not just the shapes we can imagine now. Pass/fail and one-number-per-trial cover the common cases, but real tests produce multi-column trials, categorical outcomes, counts, grouped conditions, and shapes we haven't met. The design gives the tester full freedom over how data is shaped, computes statistics automatically wherever the shape is a known one, and falls back to an AI analysis pass for shapes code can't reduce — without sacrificing the queryable, trendable data layer the charter depends on.

## 2. Three input modes

A radio at the top of the form (`test_type`) picks the mode and decides which compute path runs.

1. **`pass_fail`** — one binary outcome per trial (success / fail, with optional per-trial note). Built-in compute.
2. **`single_measure`** — one number per trial (cycle time, distance, drain, …). Built-in compute.
3. **`custom`** — the tester **defines their own columns** (name + kind: `number` / `text` / `pass_fail` / `category`) and pastes rows. This is the escape hatch that accepts anything: multiple numbers per trial, a failure-mode category column alongside a time column, whatever the test needs.

`raw_rows` and (for custom) `custom_columns` are stored in `extras` (`docs/phase2/01-schema.md` §4). Data entry uses the new `raw-data-table` block — paste-friendly (accepts tab/comma-separated paste from a phone or sheet).

## 3. Code-first compute (`lib/compute/test-stats.ts`)

Pure, unit-tested functions. Run server-side on submit **and** in the fallback importer (shared module — `00-plan.md` §3 decision 1). Results stored in `extras.computed` and surfaced via `computed-readonly` blocks.

- **pass/fail:** N, successes, pass rate = successes/N, 95% CI = p ± 1.96·√(p(1−p)/N) (Wald, the charter's formula), failure-mode tally if a note/category column is present.
- **single measure:** N, mean, sample standard deviation, min, max, 95% CI of the mean.
- **custom — compute per column by kind:** `number` → mean / stddev / min / max; `pass_fail` → rate + CI; `category` → frequency counts; `text` → left alone (shown, not summarized). Grouping: if the tester marks one category column as a "condition", compute the numeric stats **per group** as well.

This means most custom tables still get real statistics for free — code reduces every column it recognizes. Only genuinely irreducible shapes or interpretation needs go to §5.

## 4. Time-series + last-run delta

`test_label` is the series key — identical label across re-runs stacks them (charter T-08). On submit, look up the most recent prior `test_logs` row with the same label; compute the delta on the headline stat (pass rate, or mean, or a tester-chosen headline column for custom). Store headline + delta for the dashboard and the Comp Recap companion view (`02-schema.md` §4 `test_series`). Recurring **column names** under the same label trend too — another reason custom data stays a table, not prose.

## 5. AI analysis fallback (optional, bounded)

For data code can't reduce to a formula, or when the tester wants interpretation, a **"Analyze this data"** action sends a server-side Claude call (`MD_App_Charter.md` §4 Claude integration; server-side only, never client).

- **Input:** the raw table + `custom_columns`, the `hypothesis`, a free-text "what I want to learn", and the prior runs for this label.
- **Output (stored in `extras.ai_analysis`):** detected structure, the statistics it computed/estimated, comparison to prior runs, a plain-English interpretation, and **caveats** (e.g. "N=6 is too small for a reliable interval"). Record `model` and `prompt_version`; mark `edited_by_human` once the tester edits it. The tester always reviews and can edit — the AI never finalizes an entry (same contract as the SCL integration).

**Efficiency guardrail (the rule you asked for):** code computes whenever the shape is known and cheap; the AI runs **only** for irreducible custom shapes or on explicit request. Pass/fail and single-measure never call it. Add a daily/entry cap and surface cost in `MD_SCL_AI_Integration.md`-style telemetry.

## 6. Why custom data is still a table, not a free-text blob

Freedom lives in **choosing the columns**, not in abandoning structure. A blob of pasted text can't be trended across the season, compared run-to-run, or re-analyzed later — which would break the KPI dashboard and the Comp Recap companion view the charter requires. Storing even "custom" data as named columns + rows keeps every test machine-usable while still letting the tester format it however the test demands. That is the one constraint we hold; everything else is open.

## 7. Required depth fields (unchanged from charter T-08)

`sample_size_justification` (quick-select), `controlled_variables`, `what_failed` (catalogued by mode, separate from the headline), `repeatability_check`, `interpretation`, `action_taken`. These are `extras` text fields, fillable later via the draft→complete flow (`02-forms-and-detail.md` §4).
