# Dev workflow

Once setup is done, this is the loop for every change. Two modes:

- **Delegate mode** (default) — you describe what you want; Claude Code does the rest. You verify in the browser at the end.
- **Hands-on mode** (rarely needed) — you drive the git/CI steps yourself. Documented in the appendix.

## Delegate mode

Your job is three things:

1. **Plan in Claude Chat** — produce a written brief.
2. **Hand the brief to Claude Code** — paste it in and say "go."
3. **Click around the Vercel preview** — verify it looks/works right.

Everything in between (branch, code, push, PR, CI, preview link) is Claude Code's job.

### Step 1 — Plan in Claude Chat

Open your [md-app Claude Project](https://claude.ai) (Opus 4.7 recommended). Brainstorm freely — share screenshots, mockups, half-formed ideas. When the shape is clear, ask:

> *"Produce a feature brief in markdown using the template in `docs/briefs/_TEMPLATE.md`."*

Copy the result. The brainstorm conversation stays in Chat; only the final brief moves to the repo.

### Step 2 — Hand off to Claude Code

In Claude Code (Sonnet 4.6 is fine; Opus 4.7 only for unusually tricky features):

> *"Save the brief below as `docs/briefs/<slug>.md` and implement it end-to-end. Create a feature branch off main, use TaskCreate to track work, run `pnpm verify` before pushing, open a PR, and post the Vercel preview URL when CI is green. Only stop to ask me if you hit a decision the brief doesn't cover.*
>
> *[paste brief here]*"

Claude Code drives everything from here. Expect ~10–30 min depending on feature size. You can walk away.

### Step 3 — Verify on Vercel

When Claude Code posts the preview URL (or Vercel posts a "Preview" comment on the PR), open it and click through. Check:

- Does the feature work the way the brief said?
- Did anything else break (the obvious pages still load)?

If yes → reply "merge it" and Claude Code squash-merges + deletes the branch.
If no → describe what's wrong; Claude Code fixes it as a new commit on the same branch.

## What only you can do

Three things Claude Code can't do for you:

1. **Write briefs with concrete acceptance criteria.** "Improve the dashboard" is bad — Claude will build *something* and it probably won't be what you wanted. "Add a card on the dashboard showing the next 3 scheduled sessions, linking to `/sessions/<id>`" is good.
2. **Click the Vercel preview.** Every PR. CI catches build/type errors but not "this UX is wrong."
3. **Answer open questions.** If Claude Code stops to ask, it's because the brief left a real decision unmade. Answer it.

## Brief template

Lives at [docs/briefs/_TEMPLATE.md](briefs/_TEMPLATE.md). Copy it into Claude Chat as the format to produce.

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

## Common situations

### Adding a typo fix or tiny change
Still use delegate mode. *"Fix the typo in `app/sign-in/page.tsx` — 'Sing in' should be 'Sign in'. Branch, push, PR, merge when CI is green."* ~3 minutes; you don't have to touch anything.

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

| Task | Tool | Model |
|---|---|---|
| Brainstorming / planning a feature | Claude Chat (Project) | Opus 4.7 |
| Implementing the feature | Claude Code | Sonnet 4.6 |
| Debugging something Sonnet is stuck on | Claude Code | Opus 4.7 (try `/fast`) |
| Big PR review before merge | Claude Code | `/ultrareview` |
| Tiny typo / one-line fix | Claude Code | Sonnet 4.6 |

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
