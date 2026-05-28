# Routine — automation prompt

**This file is the prompt the scheduled routine executes.** The scheduled
agent is set up to read this doc from the repo each cycle, so edits here
take effect on the next run without re-pasting anything. The standalone
slash commands (`/run-routine`, `/prep-backlog`, `/human-task-list`) also
read this file as their source of truth.

The routine runs **three times per weekday** (see §7). Each cycle is
self-contained: it preps the backlog, then ships one item. Multiple cycles
in a day are normal.

## 1. What the routine does

Each cycle, in order:

1. **Prep** — scan the repo for new candidate items, classify them against the tier rules, add safe items to `docs/BACKLOG.md` autonomously, and surface ambiguous ones in the cycle summary for human triage. See §2.
2. **Run** — clean up in-flight PRs from previous cycles, then start at most one new item from the top of "Next up." See §3.
3. **Report** — emit a short cycle summary covering what was prepped, what was shipped, and anything that needs a human.

If both prep and run find nothing to do, the cycle is a no-op — report
"nothing to do" and stop. Silence is correct.

## 2. Prep behavior

Read `docs/BACKLOG.md` first to know what's already queued. Then scan for
new candidates from these sources:

- **`TODO` / `FIXME` / `HACK` markers** in code (`app/`, `lib/`, `components/`, `scripts/`).
- **Open issues** on the repo (`gh issue list --state open`) that aren't already linked from BACKLOG.
- **Recently merged PRs** (`git log --merges --since="3 days ago"`) for follow-ups noted in commit messages or PR descriptions ("see also," "fix later," "TODO in a follow-up").
- **Stale PR comments** on open PRs (questions or asks that didn't get resolved).
- **Briefs in `docs/briefs/`** that aren't in BACKLOG yet.
- **Pre-existing CI red on `main`** — if main is red, queue a "fix CI red" item at the top.

For each candidate, classify against §4 tier rules:

### Auto-add rules — add to BACKLOG without asking

Add a candidate to "Next up" autonomously **only when all of these hold**:

- The change touches **only auto-merge-tier paths** (§4).
- The acceptance criteria are **unambiguous** — a one-line description tells the next routine cycle exactly what to do.
- Effort is **S or M** (≤ 30 min). L items need a brief; flag them in the cycle summary instead.

When autonomously adding: commit the BACKLOG update directly to `main`
(see §3 for why). One commit per cycle that aggregates all auto-added
items, message like `BACKLOG: add N items (prep cycle)`.

### Escalate rules — surface, do NOT write to BACKLOG

For everything else, list the candidate under
**"Suggested for backlog (needs human OK)"** in the cycle summary, with:

- Title (action-oriented, one line)
- Tier (auto-merge or approval-required, per §4)
- Why it can't auto-add (ambiguous spec / touches approval-required paths / L effort / unclear reversibility)

Do not write these to BACKLOG.md. The user adds them via `/prep-backlog`
if they agree, or ignores them.

### Idempotence

Prep is idempotent. Re-running prep with no new findings is a no-op: no
commit, no BACKLOG change, no comment. Empty summaries are correct.

## 3. Run behavior

You ship **one new item per cycle, max.** Cleanup of in-flight PRs is not
counted against that limit.

### Step 1 — Clean up in-flight PRs first

Read `docs/BACKLOG.md`. For every item under "In progress," check the
linked PR.

For each open or recently-closed PR from a previous routine cycle:

- **PR already merged** (user approved an approval-required PR) → move
  the BACKLOG item from "In progress" to "Done." Commit directly to `main`.
- **CI green + PR in the auto-merge tier** → squash-merge, delete the
  branch, move the BACKLOG item to "Done." Commit directly to `main`.
- **CI green + PR in the approval-required tier** → leave it open.
  **Continue to Step 2 anyway** — approval-required PRs do NOT block new
  work. The user reviews them on their own schedule.
- **CI red** → read the failing log. Push a fix commit. If you've already
  pushed 3 fix attempts on this PR, leave a comment summarizing what's
  failing and continue to Step 2 (don't block on a stuck PR either).
- **No CI yet (still running)** → leave it. Continue to Step 2.

### Step 2 — Start one new item (if Next up has anything)

After cleanup, if "Next up" has at least one item, start work. **It does
not matter how many approval-required PRs are sitting open** — the user
prefers queued work over an idle routine.

1. Take the top item from "Next up." (The user controls priority by
   ordering. Auto-merge items belong at the top so they ship first.)
2. If the item links to a brief in `docs/briefs/`, read the brief — it is
   the spec. If there's no brief, the one-line description is the spec
   (only use this for small fixes).
3. **Commit the BACKLOG move directly to `main` first** — move the item
   from "Next up" to "In progress" with the upcoming branch name, then
   `git push origin main`. See "BACKLOG state tracking" below for why.
4. Create the feature branch: `routine/<short-slug>` off the updated `main`.
5. Implement the change. Track multi-step work with TaskCreate.
6. Run `pnpm verify` locally before pushing. Fix anything red.
7. Push, open a PR. PR description should:
   - Reference the brief filename if one exists
   - Plain-English summary of what changed
   - State the tier (auto-merge or approval-required) and why
8. Wait for CI. Apply the same handling as Step 1.
9. After auto-merge (if auto-merge tier): move the BACKLOG item from
   "In progress" to "Done" directly on `main`.

If "Next up" is empty, post nothing, do nothing. Stop.

### BACKLOG state tracking — commit directly to main

All BACKLOG.md state changes ("Next up" ↔ "In progress" ↔ "Done") commit
**directly to `main`**, not in feature branches. This decouples backlog
tracking from PR review timing and prevents the conflict that happens
when multiple items are in flight and each PR tries to renumber the
list.

Concretely: the feature branch contains only the change for the item
being shipped (the README edit, the migration, the SETUP.md fix, etc.).
The BACKLOG.md commit happens on `main` before the branch is created and
again after the PR closes.

### Concurrency note

If Step 1 finds any in-flight item from a *previous* cycle that you're
still handling (e.g., pushing a CI fix), still proceed to Step 2 unless
the in-flight item blocks the new one. Multiple PRs open simultaneously
is the expected state — the user reviews approval-required PRs in
batches.

## 4. Tier rules

### Auto-merge tier (default)

Auto-merge (squash + delete branch) as soon as CI is green if the PR
**only** touches:

- `app/` excluding `app/auth/` and `app/api/`
- `components/`, `lib/` excluding `lib/supabase/`
- `docs/`, `public/`, `tailwind.config.ts`, `next.config.mjs`,
  `tsconfig.json` (non-strictness-relaxing changes)
- Root-level Markdown files (`README.md`, `CLAUDE.md`, `ONBOARDING.md`,
  and any future `*.md` at repo root) — these are documentation, same
  safety profile as `docs/`
- Pure formatting changes from `prettier --write` or `eslint --fix`,
  even if they sweep many files outside the paths above. A formatting
  sweep is only auto-merge-eligible if the diff contains zero semantic
  changes (whitespace, quote style, trailing commas only)
- Tests under `tests/`
- `package.json` / `pnpm-lock.yaml` for **non-security** dependency bumps
  (UI libraries, dev tooling, type packages)

After auto-merge: move the BACKLOG item from "In progress" to "Done."
Commit the BACKLOG update directly to `main`.

### Approval-required tier — STOP and ask

Do **not** auto-merge. Post the Vercel preview URL plus a plain-English
summary, then stop and leave the PR open, if the PR touches:

- `supabase/migrations/` — schema changes; many are irreversible
- Any RLS policy file or SQL touching `policies` / `auth.*` schemas
- `middleware.ts`
- `lib/supabase/` — auth client setup
- `app/auth/**` — sign-in, callback, session handling
- `app/api/**` — server route handlers (can do anything server-side)
- `.env.example`, env-var handling, or anything reading from `process.env`
- `.github/workflows/**` — CI configuration
- `package.json` security-relevant dependencies: `next`, `react`,
  `react-dom`, `@supabase/*`, `next-auth`, anything with "auth" in the name
- Any deletion of more than 50 lines from a single existing file
- Any change you yourself are uncertain is reversible

When you stop for approval, the PR comment must state:

- **What this changes** in plain English (one paragraph max)
- **What surface it touches** (database schema, auth, public API, CI, etc.)
- **Is it reversible?** — `git revert` works for most things; database
  migrations may not; data deletions may not. Be honest.
- **The Vercel preview URL** so the user can click through

## 5. Hard rules — never do these, ever

- Never `git push --force` to any branch, especially `main`
- Never amend or rebase commits on `main`
- Never merge a PR with red or pending CI
- Never bypass branch protection
- Never run destructive SQL (`DROP`, `TRUNCATE`, `DELETE FROM` without a
  narrow `WHERE`, `ALTER TABLE ... DROP COLUMN`) against any database
- Never commit secrets, API keys, service-role keys, or `.env.local`
- Never modify or delete files under `supabase/migrations/` —
  migrations are append-only; old ones must not be edited
- Never modify `.github/workflows/` to skip, disable, or weaken checks
- Never `git reset --hard` or otherwise discard committed work
- Never delete branches that have unmerged commits

If a backlog item *requires* one of these, stop and post a comment asking
the user how to proceed.

## 6. When something goes sideways

If you hit an error you don't understand, or the repo is in a state you
weren't expecting (uncommitted changes on `main`, missing files,
unexpected branches), stop and post a comment describing what you saw.
Do not try to clean it up automatically — the user's in-progress work
might be there.

If a brief leaves a decision unmade, stop and comment on the PR with the
specific question. Leave the PR open. Do not guess.

## 7. Schedule

Three cycles per weekday, in PT:

| Cron           | Local time       | Why this slot                                                       |
| -------------- | ---------------- | ------------------------------------------------------------------- |
| `15 3 * * 1-5` | 3:15 AM Mon–Fri  | Overnight catch-up — ships work queued late the prior day.          |
| `30 8 * * 1-5` | 8:30 AM Mon–Fri  | Morning catch-up — user reviews approval-required PRs over coffee.  |
| `0 22 * * 1-5` | 10:00 PM Mon–Fri | End-of-day catch-up — picks up anything queued during the workday.  |

Spacing rationale:

- All gaps between cycles are **≥ 5 h 15 m** — keeps each cycle in its
  own Anthropic API rate-limit window (the 5-hour usage cap doesn't
  bleed across cycles).
- 15-minute offsets from clock-round hours dodge cron-rush moments when
  many users have jobs scheduled at exactly `:00`.
- Weekdays only (`1-5`). Anything queued Friday evening waits until
  Monday 3:15 AM. Acceptable for a one-person team.

To change the schedule, edit the cron expressions in the scheduled-tasks
config (use the `/schedule` skill or the `mcp__scheduled-tasks__*`
tools). The scheduled agent reads this doc on each cycle, so changing
the cadence does not require re-pasting the prompt — only the cron
strings change.

## 8. Standalone `/prep-backlog`

`/prep-backlog` runs the prep behavior from §2 **interactively**: it
proposes candidates and asks for human confirmation before each item
lands in `BACKLOG.md`. Use it when you want to queue work without
shipping (e.g., you noticed three TODOs while reading code and want them
captured but don't want a cycle to start).

The classification rules (auto-add vs escalate) are not relevant to the
interactive flow — the human decides item by item.

Same tier rules (§4), same hard rules (§5), same direct-to-`main` commit
rule for BACKLOG state.
