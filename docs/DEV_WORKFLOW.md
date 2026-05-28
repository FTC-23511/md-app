# Dev workflow

Once setup is done, this is the loop for every change. Three modes, in order of how much you want to be involved:

- **Backlog mode** (most hands-off) — you drop items into [`BACKLOG.md`](BACKLOG.md); a scheduled routine runs 3×/weekday, ships PRs, auto-merges safe ones, stops on anything risky. See [Backlog and the routine](#backlog-and-the-routine).
- **Delegate mode** — you describe what you want in the moment; Claude Code does the rest. You verify in the browser at the end.
- **Hands-on mode** (rarely needed) — you drive the git/CI steps yourself. Documented in the appendix.

## Delegate mode

Your job is three things:

1. **Plan in Claude Chat** — produce a written brief.
2. **Hand the brief to Claude Code** — paste it in and say "go."
3. **Click around the Vercel preview** — verify it looks/works right.

Everything in between (branch, code, push, PR, CI, preview link) is Claude Code's job.

### Step 1 — Plan in Claude Chat

Open your [md-app Claude Project](https://claude.ai) (Opus 4.7 recommended). Brainstorm freely — share screenshots, mockups, half-formed ideas. When the shape is clear, ask:

> _"Produce a feature brief in markdown using the template in `docs/briefs/_TEMPLATE.md`."_

Copy the result. The brainstorm conversation stays in Chat; only the final brief moves to the repo.

### Step 2 — Hand off to Claude Code

In Claude Code (Sonnet 4.6 is fine; Opus 4.7 only for unusually tricky features):

> _"Save the brief below as `docs/briefs/<slug>.md` and implement it end-to-end. Create a feature branch off main, use TaskCreate to track work, run `pnpm verify` before pushing, open a PR, and post the Vercel preview URL when CI is green. Only stop to ask me if you hit a decision the brief doesn't cover._
>
> _[paste brief here]_"

Claude Code drives everything from here. Expect ~10–30 min depending on feature size. You can walk away.

### Step 3 — Verify on Vercel

When Claude Code posts the preview URL (or Vercel posts a "Preview" comment on the PR), open it and click through. Check:

- Does the feature work the way the brief said?
- Did anything else break (the obvious pages still load)?

If yes → reply "merge it" and Claude Code squash-merges + deletes the branch.
If no → describe what's wrong; Claude Code fixes it as a new commit on the same branch.

## What only you can do

Three things Claude Code can't do for you:

1. **Write briefs with concrete acceptance criteria.** "Improve the dashboard" is bad — Claude will build _something_ and it probably won't be what you wanted. "Add a card on the dashboard showing the next 3 scheduled sessions, linking to `/sessions/<id>`" is good.
2. **Click the Vercel preview.** Every PR. CI catches build/type errors but not "this UX is wrong."
3. **Answer open questions.** If Claude Code stops to ask, it's because the brief left a real decision unmade. Answer it.

## Brief template

Lives at [docs/briefs/\_TEMPLATE.md](briefs/_TEMPLATE.md). Copy it into Claude Chat as the format to produce.

```markdown
# Feature: <name>

## What we're building

<1 paragraph — the user-visible change>

## Why

<1–2 sentences — what problem this solves, who asked>

## Acceptance criteria

- <observable in the browser, e.g. "Form at /sessions/new accepts X, Y, Z and redirects to /sessions on save">
- <...>

## Out of scope

- <what NOT to do — keeps the PR focused>

## Open questions

- <decisions you haven't made; Claude Code will ask about these>
```

## Backlog and the routine

The most hands-off way to ship work. You maintain a queue in [`BACKLOG.md`](BACKLOG.md); a scheduled remote agent processes it three times each weekday.

### How it works

1. **You add items to [`BACKLOG.md`](BACKLOG.md)** — one-liners for tiny fixes, or links to briefs in `docs/briefs/` for features. Top of the list = highest priority. (The routine also auto-adds safe candidates it discovers during its prep step — see [`ROUTINE.md`](ROUTINE.md) §2.)
2. **The routine runs three times per weekday** (3:15 AM, 8:30 AM, 10 PM PT). Each cycle: prep the backlog (scan for new safe items, surface ambiguous ones), clean up in-flight PRs from previous cycles, then start at most one new item from the top of "Next up."
3. **You see one of three outcomes per cycle:**
   - A PR was opened, CI went green, and the routine auto-merged it. You'll see a Vercel deploy. Click through if you want; revert with `git revert` if anything looks wrong.
   - A PR is open and the routine stopped, asking for your approval. The PR comment summarizes what changed in plain English, what surface it touched, and whether it's reversible. Click the Vercel preview, reply "approved" (or push back).
   - Nothing happened — backlog was empty and prep found nothing new.

### Auto-merge vs approval-required

See [`ROUTINE.md`](ROUTINE.md) §4 for the canonical tier rules. The short version: UI/components/docs/styling/tests/non-security deps auto-merge when CI is green; anything touching migrations, auth, middleware, API routes, env vars, CI config, security dependencies, or large deletions stops for your approval. Edit [`ROUTINE.md`](ROUTINE.md) to change the rules.

### Starting / changing the routine

The scheduled agent reads [`ROUTINE.md`](ROUTINE.md) on each cycle, so edits to the doc take effect on the next run — no re-pasting. To register or update the three scheduled tasks themselves, use `/schedule` or the `mcp__scheduled-tasks__*` tools; the recommended cron expressions are in [`ROUTINE.md`](ROUTINE.md) §7.

**Wait until you've shipped at least one brief manually via delegate mode** before flipping the scheduled agent on. Confirm the brief → PR → preview flow produces what you want, then automate.

### What only you do

Even in fully-autonomous backlog mode:

- **Write the briefs.** The routine ships whatever the brief says. Vague brief = wrong feature.
- **Click Vercel previews on approval-required PRs.** Reply "approved" or push back.
- **Revert** anything you find broken later — `git revert <sha>` undoes any non-migration change cleanly.

## Common situations

### Adding a typo fix or tiny change

Still use delegate mode. _"Fix the typo in `app/sign-in/page.tsx` — 'Sing in' should be 'Sign in'. Branch, push, PR, merge when CI is green."_ ~3 minutes; you don't have to touch anything.

### CI fails on a PR

Claude Code handles it. It'll read the failed Actions log, push a fix commit, and CI re-runs automatically. You'll only hear about it if the fix needs a product call from you.

### Schema changes (new table / column / index)

Same delegate flow, but mention schema in the brief. Claude Code will:

1. Generate a migration in `supabase/migrations/<timestamp>_<description>.sql`
2. Apply it to dev with `supabase db push --linked`
3. Regenerate types with `pnpm db:types`
4. Commit migration + types together

**After you merge**, Claude Code will remind you to push to prod:

```bash
pnpm db:link:prod
supabase db push --linked
pnpm db:link:dev
```

This step is manual on purpose for Phase 1 — you want to see exactly what's hitting prod. Automate later.

### Daily smoke check

If you only do one thing each evening you spent on robot:

```bash
git pull
pnpm verify
```

Green = main is healthy. Red = something regressed (rare with CI).

## Model + effort cheat sheet

| Task                                   | Tool                  | Model                  |
| -------------------------------------- | --------------------- | ---------------------- |
| Brainstorming / planning a feature     | Claude Chat (Project) | Opus 4.7               |
| Implementing the feature               | Claude Code           | Sonnet 4.6             |
| Debugging something Sonnet is stuck on | Claude Code           | Opus 4.7 (try `/fast`) |
| Big PR review before merge             | Claude Code           | `/ultrareview`         |
| Tiny typo / one-line fix               | Claude Code           | Sonnet 4.6             |

Don't default to Opus for execution — Sonnet is strong enough for ~95% of work and much faster.

---

## Appendix — Hands-on mode

If you ever want to drive a change manually (curiosity, debugging something weird, learning git), here's the full loop:

1. **Branch off main.**

   ```bash
   git checkout main
   git pull
   git checkout -b feature/add-session-log-form
   ```

2. **Make the change** — edit files directly, or have Claude Code propose a diff.

3. **Run verify locally.**

   ```bash
   pnpm verify
   ```

   Same suite CI runs. Green here = green there.

4. **Commit and push.**

   ```bash
   git add .
   git commit -m "Add Session Log capture form"
   git push -u origin feature/add-session-log-form
   ```

5. **Open a PR.** GitHub prints a URL after push; open it with `main` as the base.

6. **Wait for CI.** Two checks run: `Lint, typecheck, unit tests` and `Build + E2E`. ~3–5 minutes total.
   - Green → safe to merge.
   - Red → click the failing check, read the last 20 lines, fix and push again.

7. **Click around the Vercel preview** when the bot comments on the PR.

8. **Squash and merge** — gives main one tidy commit per feature.

9. **Delete the branch** (GitHub button after merge).
