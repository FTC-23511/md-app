# MD-App: Software Change Log AI Integration Spec

| Field | Value |
|---|---|
| Document type | Feature specification (forward-looking) |
| Parent project | MD-App — see `MD_App_Charter.md` |
| Related document | `MD_Project_Charter.md`, SOP-07 (Software Change Log) and Template T-07 |
| Status | Specified, not yet implemented |
| Implementation target | Phase 2 of the MD-App build (end of July 2026) |
| Picked up in | *[future chat, TBD]* |

---

## 1. Purpose of this document

The v2.1 Software Change Log template (in `MD_Project_Charter.md`) drops the explicit per-field trigger logic that earlier drafts used. In its place: an AI integration that parses each commit, classifies the change, generates tailored follow-up questions for the committing programmer, and captures the responses into a structured Software Change Log entry.

This document is the **starting brief for a future chat** (likely with a Claude instance) that will design and implement this integration as part of the MD-App build. It captures the goals, the workflow, the prompting role of the AI, and the open implementation questions — but deliberately leaves implementation specifics open.

## 2. Why this design exists

Two earlier designs were considered and rejected:

**Earlier design A — trigger logic at entry time.** The Software Change Log template had five conditional "depth fields" (closed-loop control, state machine, sensor fusion, tuning record, algorithm documentation), each fired by an objective trigger the programmer self-applied at commit time. Rejected because the trigger logic put a categorization burden on the programmer when their attention was already on the code, *and* because the trigger surface was complex enough that a tired student at 9pm would either skip fields or downgrade their change to avoid them.

**Earlier design B — fully manual narrative.** A single open-ended "describe the change in depth" field. Rejected because it produces shallow entries on average; without structure, programmers default to one-line descriptions.

**Current design — AI-driven prompting.** The AI reads the actual diff, identifies what kind of change it is, and asks only the questions that matter for *this* change. The programmer answers narrative questions, not classification questions. Complexity lives in the system (where it can be improved over time) rather than in the user (where it stays a burden).

## 3. Relationship to the charters

- **`MD_Project_Charter.md`** defines the Software Change Log entry type, its baseline required fields, and the AI-prompted deep-dive section.
- **`MD_App_Charter.md`** defines the app stack (Next.js + Supabase + Vercel + Claude API) and infrastructure that hosts this integration.
- **This document** defines the AI-driven SCL capture workflow specifically. It is an MD-App feature spec, not a charter.

If MD's SCL template changes, this spec must be revised to match. If implementation work reveals limits that force a charter change, the MD charter is updated first per the synchronization rule in `MD_Project_Charter.md` §18.

## 4. Workflow at a glance

```
[Programmer pushes commit to GitHub]
              ↓
[GitHub webhook → MD-App]
              ↓
[MD-App fetches diff + commit metadata]
              ↓
[Claude API: classify the change; generate tailored questions]
              ↓
[Programmer is notified (Discord ping / app notification)]
              ↓
[Programmer engages with the AI in a chat surface]
              ↓
[AI captures responses; assembles draft SCL entry]
              ↓
[Programmer reviews draft, edits, submits]
              ↓
[SCL entry in MD-App, queryable, tagged by classification]
```

## 5. Trigger mechanism — when the integration fires

The integration fires when one of the following is true on a commit landing on a configured branch (default: `main`):

1. The commit message contains an `MD-SCL` trailer (most reliable; programmer explicitly opts in)
2. The commit modifies files in a team-configured "behavior-relevant" path list (e.g., `TeamCode/src/`); pure-doc commits in `docs/` or `README.md` updates are skipped
3. The commit is part of a PR that has a `behavior-change` label

Configuration is per-team. The conservative default is option 1 only. The aggressive setting fires on every commit touching code; the AI then classifies and short-circuits if the commit looks like a pure refactor or formatting change.

Per SOP-07, pure refactors and formatting commits do not require an SCL. The AI's classification step is the gate that enforces this: if it determines the diff has no behavior change, it does not prompt the programmer and does not create a draft entry.

## 6. AI classification step

The AI receives, per commit:

- Commit hash, author handle, timestamp
- Full commit message
- Diff (file paths and line-level changes)
- Optional context: the most recent N (suggested: 3) SCLs that touched the same files, so the AI can see what came before
- Optional context: the open Decision Log queue, in case the change traces to an existing decision

The AI returns a structured classification object:

```
{
  "classification": "control_theory" |
                    "sensor_or_sensor_fusion" |
                    "state_machine_or_architecture" |
                    "algorithm_or_library" |
                    "bug_fix" |
                    "behavior_changing_refactor" |
                    "refactor_only_skip" |
                    "other",
  "confidence": "low" | "medium" | "high",
  "auto_filled_fields": {
    "files_changed": [...],
    "any_obvious_facts_from_diff": "..."
  },
  "questions_for_programmer": [
    { "topic": "...", "question": "..." },
    ...
  ]
}
```

When confidence is low, the AI also surfaces a "best guess + alternatives" so the programmer can correct the classification before proceeding.

## 7. AI prompting step — questions per classification

The AI generates questions tailored to the classification. The lists below are the **starting library** of questions for each category; the implementation chat should evolve them over time as the team's actual commits expose better or worse phrasings.

### For "control theory"
- What is the controlled variable, and what sensor measures it?
- What is the setpoint, and where does it come from (driver input, autonomous routine, sensor reading)?
- What control law is in use (P, PI, PID, motion profile, feed-forward, bang-bang, ML), and why this one rather than a simpler alternative?
- What gains or coefficients did you settle on, and how did you arrive at them?
- What happens if the sensor returns nonsense or disconnects?
- What are the saturation limits, and why those values?

### For "sensor or sensor fusion"
- What sensors are involved, and what does each one measure?
- How are their readings combined into a single decision (averaging, voting, complementary filter, Kalman, etc.)?
- What happens when the sensors disagree?
- How is timing handled — are readings synchronous, asynchronous, or interpolated?
- What's the noise/error profile of each sensor in our environment?

### For "state machine or architecture"
- What states does this code define, and what does each one do?
- What triggers each transition (sensor reading, timeout, button press, external command)?
- What happens on a timeout or error in each state?
- How does the state machine interact with other parts of the codebase?

### For "algorithm or library"
- What is the algorithm doing, in plain English?
- Why this algorithm rather than the alternatives you considered?
- What are the runtime and accuracy characteristics?
- What references (papers, library docs, prior implementations) would help an incoming developer understand it?
- What are its known failure modes or unsupported cases?

### For "bug fix"
- What was the visible symptom of the bug?
- What was the root cause?
- How was the bug caught (test failure, in-the-field observation, code review, log analysis)?
- What new test prevents regression? *(If no test was added, why not?)*

### For "behavior-changing refactor"
- What behavior changed, and why was the refactor the right move (vs. leaving the old code in place)?
- What's the migration path for anything else in the codebase that depended on the old behavior?
- What testing confirmed nothing else broke?

### Always asked, regardless of classification
- (If not obvious from diff) Hardware/sensors involved
- Game challenge addressed
- Before this change: measurable behavior
- After this change: measurable behavior
- Known failure modes / edge cases
- Verification: link to a unit test that covers this change OR a stated reason it can't be unit-tested plus the integration-test approach used

## 8. Response capture and draft assembly

The programmer engages with the AI in a chat surface. The conversation is preserved as a transcript. After the AI has all the answers it needs, it assembles a draft SCL entry:

- The "always required" baseline fields are populated with the programmer's answers
- The AI-prompted deep-dive section is populated with the structured Q&A
- The classification is recorded in the entry's metadata

The programmer reviews the draft in MD-App, can edit any field, and submits. The conversation transcript is retained alongside the entry — it's a useful record of the *reasoning* behind the structured fields and can surface context the structured fields don't capture.

## 9. Failure modes and fallbacks

| Failure | Fallback |
|---|---|
| AI classification is wrong | Programmer overrides classification in the draft; AI re-runs prompting with the correct category |
| AI is unavailable (rate limit, outage, etc.) | Programmer falls back to the bare SCL template; manually fills in baseline fields; flags "AI-prompted section pending" so it can be re-run when the AI is back |
| Programmer doesn't engage with the AI within 24h | Draft SCL appears in the Documentation Captain's flag queue; Captain chases at Friday 15 |
| Diff too large or complex for a single prompt | AI breaks the commit into logical chunks (e.g., per file group) and prompts per chunk; OR asks the programmer "this is a large commit — what's the headline change?" and proceeds from that anchor |
| Multi-classification commit (e.g., adds a sensor AND tunes a controller) | AI proposes multiple classifications; programmer confirms; AI asks the full question set for each |
| Programmer adds another commit before responding to the first | The two commits get chained in the same SCL draft IF they're on the same files within a short window (suggested: 30 min); otherwise treated as separate SCLs |

## 10. Prompt versioning

Every classification prompt and every question template is versioned. The version in use is recorded on the SCL entry's metadata. When prompts are revised, old entries are not retroactively re-prompted (their content was correct *for that prompt version*), but the new prompt version applies to new commits.

The prompt library lives in the MD-App repo, in a `prompts/` directory, with semantic versioning. Changes to prompts require code review the same as any other code change.

## 11. Open implementation questions for the future chat

To be settled when this integration is built:

1. **Chat surface for the programmer.** Embedded chat inside MD-App? Discord DM with a bot? Standalone web chat? Each has different UX and authentication implications.
2. **GitHub webhook authentication.** Standard HMAC signature? GitHub App with installation token? PAT?
3. **Latency target.** Time from commit to AI prompt notification — suggest a target of <2 minutes so the change is still fresh in the programmer's head.
4. **Transcript storage.** Where do conversation transcripts live? Same Supabase database? Separate? How are they made queryable for retrospective review?
5. **Conversation depth.** Should the AI be allowed to ask follow-up questions across multiple turns ("you mentioned a Kalman filter — what's the state vector?"), or is one prompt → one response the limit?
6. **Multi-file commit handling.** A commit that touches both a control loop and a sensor abstraction — chained Q&A or split SCLs?
7. **Concurrency.** Two programmers pushing commits within seconds of each other — how does the integration scale?
8. **Cost budget.** Per-commit Claude API cost; if a team pushes 100 commits a week, what does that cost? Set a daily cap.
9. **Privacy.** The diff goes to the Claude API. For most FTC teams this is fine, but document the data handling explicitly so mentors and parents are informed.
10. **Failure-mode telemetry.** When the integration breaks, the Documentation Captain needs to know. What's the surfacing mechanism — Discord alert, dashboard widget, email?

## 12. Out of scope for this integration

- Generating the *code* in the commit. The AI only prompts about a commit that already exists; it doesn't write code.
- Classifying Decision Logs (a separate workflow in the Weekly Classification Pass).
- Detecting *missing* SCLs — i.e., commits that should have triggered the integration but didn't. The team's coding hygiene catches that, not the AI.
- Replacing the human review step. The programmer always reviews and submits the draft; the AI never submits an SCL autonomously.

---

## Document changelog

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | *[initial date]* | Initial spec — workflow, trigger mechanism, classification schema, prompt library starting point, failure modes, open implementation questions | *[App Lead / Documentation Captain]* |
