---
# REQUIRED. Do not change the lines marked REQUIRED.
type: test_log # REQUIRED — must be 'test_log'
template_version: 1 # REQUIRED — leave as 1
test_label:
  Your test name # REQUIRED — the SERIES KEY. Keep it identical across
  # re-runs so trends stack (e.g. "Intake jam rate").
test_date: 2026-MM-DD # REQUIRED — date the test ran
robot_version_hw_id: # Optional — Hardware Change Log entry ID (UUID) tested against
test_type: pass_fail # REQUIRED — one of: pass_fail | single_measure | custom
# custom_columns: ONLY for test_type: custom. Declare your columns + their kind.
#   kind is one of: number | text | pass_fail | category
#   Mark ONE category column isCondition: true to also get per-group number stats.
# custom_columns:
#   - { name: cycle_time, kind: number }
#   - { name: surface, kind: category, isCondition: true }
#   - { name: failure_mode, kind: category }
---

## Hypothesis

<!-- Optional. What you expected to happen, and why. -->

## Field Setup

<!-- Optional. Field elements, robot config, starting conditions. -->

## Method / Steps

<!-- Optional. How each trial was run, so the test is repeatable. -->

## Raw Data

<!-- REQUIRED. One trial per row. Tab-, comma-, or pipe-separated. Keep the
     header row — its names are the column keys. Statistics compute automatically
     from this table; you never type a summary stat.

     pass_fail  → header: success, note   (success = pass/fail/yes/no/1/0/true/false)
     single_measure → header: value       (one number per trial)
     custom     → headers match your custom_columns names above

     Example below is for test_type: pass_fail. Replace it with your data. -->

success, note
pass,
pass,
fail, gear slip
pass,
fail, belt skip

## Sample Size Justification

<!-- Optional. Why this N is enough (or an acknowledgement that it is not). Fillable later. -->

## Controlled Variables

<!-- Optional. What you held constant across trials. -->

## What Failed

<!-- Optional. Failure modes observed, catalogued separately from the headline stat. -->

## Repeatability Check

<!-- Optional. Evidence the result repeats (re-runs, independent setup, etc.). -->

## Interpretation

<!-- Optional. What the data means for the robot / strategy. -->

## Action Taken

<!-- Optional. What you changed or decided as a result. -->
