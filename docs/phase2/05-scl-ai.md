# Software Change Log AI integration (step 2G)

**Status: rescoped 2026-06-14 by the App Lead.** This supersedes the per-commit
webhook + app-side Claude model in `docs/charters/MD_SCL_AI_Integration.md`
(that revision is recorded in the charter changelog). Nothing here is built until
its own brief lands in `docs/briefs/`.

## 1. The model we are building

The original spec wired Claude into MD-App: a GitHub webhook fired on every
behavior-changing commit, the app called Claude to classify it and generate
questions, and the app assembled a draft. We are **not** building that. It is
expensive (a call per commit), noisy (most commits are trivial), and the trigger
is wrong — SCL-worthiness is a human judgment, and the richest "why" context
lives in the **AI-coding chat transcript**, not the diff.

The rescoped flow keeps every benefit and removes the cost, the app-side AI, and
the per-commit noise:

```
1. Daily Discord digest   GitHub Action posts the day's commits to a Discord
   (the nudge)            channel: "commits landed — any worth a Software Change Log?"

2. Human flags a RANGE    A programmer decides "yes, commits abc1..def9 are one
   (the trigger)          coherent change." AI coding spreads one feature/fix across
                          many commits, so the unit is a commit RANGE, not one commit.

3. /scl skill summarizes  In their own Claude Code, the programmer runs the `/scl`
   (the AI, client-side)  skill over that range. It reads the commits (+ the chat
                          context that produced them) and writes a standard
                          fallback-format Software Change Log markdown file.

4. Human edits + approves The programmer edits the draft file (it is just markdown),
   (the safeguard)        then hands it to the Documentation Captain.

5. MD-App ingests         The existing fallback importer (scripts/fallback/import.ts)
   (no new path)          parses the file and inserts a sw_change_logs row, linked to
                          the commit range. created_via = 'fallback_form'.
```

## 2. Why this is the right design for us

- **No app-side AI.** No Anthropic API key in Vercel, no `@anthropic-ai/sdk`
  dependency, no per-commit cost, no diff-privacy surface in the app. The AI runs
  in the programmer's existing Claude Code session — which the team already uses
  to write the code.
- **Reuses the fallback importer.** The `/scl` skill emits exactly the YAML-front-
  matter + body-sections format the importer already understands
  (`docs/phase1/05-fallback.md` §3). 2G adds one template + one body mapping +
  one registry entry — no new ingestion path, no new write code.
- **Human-gated, batched, cheap.** One daily Discord message; the AI only runs on
  ranges a human chose to document. Zero tokens on the routine commits.
- **Commit↔SCL link stays first-class.** `sw_change_logs` already has `commit_hash`
  and `branch` (`01-schema.md` §3); 2G stores the **range** so the entry points at
  the exact commits it documents.

## 3. The pieces

| Piece                           | Where                                                             | Notes                                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Daily Discord digest**        | `.github/workflows/scl-digest.yml` (GitHub Action, cron)          | Lists commits since the previous digest, posts to a Discord **incoming webhook** (URL stored as a GitHub Actions secret — never touches app secrets). v1 is a plain commit list; an optional cheap one-line summary can come later.                                                                                      |
| **`/scl` skill**                | repo skill (e.g. `.claude/skills/scl/`)                           | Input: a commit range (`<from>..<to>`) or a date range. Reads `git log -p` for the range + any chat context the programmer pastes/has open, maps the change onto the SCL field set, writes `docs/fallback/inbox/<date>-software-change-log-<slug>.md` in fallback format. Programmer edits, then it goes to the Captain. |
| **SCL fallback template**       | `docs/fallback/templates/software-change-log.md`                  | The canonical shape the skill targets and a human can also fill by hand. Mirrors the existing three templates.                                                                                                                                                                                                           |
| **SCL body mapping + registry** | `entries/software-change-log.ts` (`softwareChangeLogBodyMapping`) | The header→field map the importer needs (`05-fallback.md` §5.3). `sw_change_log` is already in `entries/_registry.ts` from 2B.                                                                                                                                                                                           |
| **Commit-range linking**        | `sw_change_logs`                                                  | Store the range. `commit_hash` (tip) + `branch` exist; the range start lands in `extras` (e.g. `extras.commit_range_from`) — no migration if it stays in `extras`.                                                                                                                                                       |

## 4. Hard prerequisite (met)

The **Software Change Log baseline form (2B)** shipped (#37) — `sw_change_logs` and
its entry definition exist, so there is a table and a field set to write into.

## 5. The optional AI deep-dive fields

`01-schema.md` §3 reserves `extras.ai_deep_dive` / `transcript_url` /
`prompt_version` on `sw_change_logs`. In this model they are filled by the **skill**
(client-side), not the app: the skill can record which prompt version it used and a
link to the transcript if the programmer chooses to attach one. They remain optional.

## 6. Open items for the brief

- Exact `/scl` skill prompt + how it elicits the "why / what failed" from chat
  context vs. the diff.
- Digest cadence + which branches it watches (default: `main` + open PR branches).
- Whether the digest does a cheap one-line AI summary or stays a plain list (default:
  plain list v1, since the skill does the real summarization).
- Slug/range collision handling in the inbox filename.

## 7. What this does NOT pull forward

Multi-user concerns, RLS, and the 24h-edit lock stay Phase 3. The Discord digest is
a one-way outbound webhook (post-only) — it is **not** the inbound Discord capture
webhook deferred to Phase 3. Only the outbound SCL nudge comes into Phase 2.
