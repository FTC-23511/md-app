# Dev workflow

Once setup is done, this is the loop for every change. The whole point of
the setup is that you can stay inside this loop and trust CI to catch
problems.

## Day-to-day shape

```
ask Claude → branch → push → review CI → preview on Vercel → merge → done
```

You spend most of your time at "ask Claude" and "preview on Vercel". CI and
the merge are mostly automatic.

## Making a change

1. **Start a branch off main.**

   ```bash
   git checkout main
   git pull
   git checkout -b feature/add-session-log-form
   ```

2. **Get Claude to make the change.** Describe what you want; review the
   diff Claude proposes; apply it. Save the files Claude generates into
   your local working copy. (If you're using the Claude desktop app to edit
   files directly, you can skip the save step.)

3. **Run verify locally.**

   ```bash
   pnpm verify
   ```

   This is the same suite CI runs. If it's green here, it'll be green there.

4. **Commit and push.**

   ```bash
   git add .
   git commit -m "Add Session Log capture form"
   git push -u origin feature/add-session-log-form
   ```

5. **Open a pull request.** GitHub will print a URL after the push; click it
   and open the PR with `main` as the base. Don't merge yet.

6. **Wait for CI.** The Actions tab will show two checks running:
   `static-checks` and `build-and-e2e`. They take ~3–5 minutes total.
   - **Green** → safe to merge.
   - **Red** → click the failing check, read the error, ask Claude to fix it.

7. **Click around the Vercel preview.** Once Vercel posts a "Preview" comment
   on the PR, open the URL and verify the change visually. This is your last
   safety net before merging.

8. **Merge.** "Squash and merge" is the cleanest option — it gives main a
   single tidy commit per feature.

9. **Delete the branch** (GitHub offers a button after merge).

## What if I just need to fix a typo?

Same loop. Even for trivial changes. The cost is ~5 minutes of CI; the
benefit is you never accidentally break main.

## What if CI fails in a confusing way?

1. Click the failed step in Actions and read the last 20 lines of output.
2. Paste those lines back to Claude with "CI is failing with this output —
   what does it mean and how do I fix it?"
3. Apply the fix as a new commit on the same branch. CI re-runs automatically.

## Schema changes

When the schema needs to change (new table, new column, new index):

1. Claude generates a new migration file. Filename format:
   `supabase/migrations/<YYYYMMDDHHMMSS>_<short_description>.sql`
2. Run `supabase db push --linked` against dev to apply it. (You're linked
   to dev from setup; if not, run `pnpm db:link:dev` first.)
3. Regenerate types: `pnpm db:types`. This updates `lib/database.types.ts`.
4. Commit both the migration and the regenerated types together.
5. Push and merge as normal.
6. **After merge to main**, apply the migration to prod:
   ```bash
   pnpm db:link:prod
   supabase db push --linked
   pnpm db:link:dev   # switch back so day-to-day stays on dev
   ```

We can automate the prod push later, but for Phase 1 it's safer to do it by
hand so you see exactly what's happening.

## Daily smoke check

If you only do one thing each evening you spent on robot:

```bash
git pull
pnpm verify
```

If verify is green, the app on main is healthy. If it's red, something
regressed (rare with CI, but possible if env vars changed).
