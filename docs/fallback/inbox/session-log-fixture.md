---
type: session_log
template_version: 1
session_date: 2026-05-30
session_lead: Maya Rodriguez
duration_hours: 2.5
subsystems:
  - intake
  - drivetrain
---

## What did we work on today?

Rebuilt the intake roller mount after the previous one cracked, and tuned the drivetrain PID constants for straighter autonomous driving.

## What worked?

The new aluminum mount is far more rigid; intake jams dropped to near zero in testing.

## What didn't work?

Drivetrain still drifts slightly on the long auto path — likely an encoder calibration issue, not the PID.

## Numbers measured today

Intake success rate ~95% over 20 trials. Auto drift ~4 inches over a 10-foot run.

## What's next session?

Re-calibrate the left drive encoder and re-run the auto path test.

## Per-Person Contributions

- **Maya Rodriguez:** Led the intake mount rebuild and ran the test trials.
- **Devin Park:** Tuned the drivetrain PID and logged the drift measurements.

## Specialty Entries Triggered

- [x] **Hardware Change Log** — owner: Maya Rodriguez — subject: New aluminum intake roller mount
- [ ] **Software Change Log** — owner: NAME — subject: BRIEF
