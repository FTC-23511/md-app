# Backlog

The queue the morning routine processes. Add items here as one-liners or
links to briefs in `docs/briefs/`. The routine picks the top item from
"Next up," moves it to "In progress," ships a PR, and (where safe)
auto-merges.

You can add items by editing this file directly, or by asking Claude Code:

> _"Add 'fix typo on sign-in page' to the backlog."_

Priority is top-down — drag the most important items to the top of "Next up."

---

## Next up

<!-- Routine pulls from the top of this list. -->

1. **[docs]** Fix `docs/SETUP.md` Step 4 magic-link reference. Step 4 currently says _"Disable 'Confirm email' (we use magic links instead)"_, but per `docs/phase1/04-auth.md` Phase 1 auth is **email + password with sign-up disabled**, not magic link. Rewrite Step 4 to reflect the Phase 1 plan: enable email+password provider, disable sign-up entirely (the critical setting), keep "Confirm email" off, and update redirect URLs to include `/auth/reset-password` (used by forgot-password flow) instead of `/auth/callback`. _Expected tier: auto-merge (docs only)._

2. **[docs]** Update `docs/phase1/00-plan.md` T05–T08 task descriptions to reference the actual migration filenames (`20260521000001_extensions_and_helpers.sql` … `20260521000008_grants.sql`) instead of the fictional ones in the original spec (e.g., `<timestamp>_functions_and_types.sql`). The status banner I added at the top of the Schema batch already notes the divergence; this item makes each individual task description accurate so future Claude readers don't need to read the banner to understand what shipped. _Expected tier: auto-merge (docs only)._

3. **[docs]** Audit `.env.example` against `docs/phase1/01-conventions.md` §9. Missing: `ALLOWED_EMAIL` (single-email allowlist per Phase 1 auth). Also: the comment for `NEXT_PUBLIC_SITE_URL` calls it "the magic-link redirect target," which is stale — per `04-auth.md` Phase 1 sign-in is email+password; the URL is still used by the forgot-password reset link, so update the comment to say that instead. _Expected tier: auto-merge (docs only — touches a `.example` file, not real env handling)._

4. **[code]** Replace `app/auth/callback/route.ts` with `app/auth/reset-password/route.ts` per `docs/phase1/04-auth.md` §6. The current callback file is the magic-link sign-in handler, which Phase 1 doesn't use. The reset-password route handles the _forgot-password_ magic-link path: exchanges the `code` query param for a session, then redirects to `/change-password`. Spec and exact code pattern are in `04-auth.md` §6. Delete the old callback file. _Expected tier: approval-required (touches `app/auth/`)._

## In progress

<!-- Routine moves items here with the PR link when work starts. -->

_(empty)_

## Done

<!-- Auto-archived after merge. Keep the last ~20 for reference; older entries can be pruned. -->

- 2026-05-26 — **[docs]** Fix `README.md` to use `pnpm` consistently. Auto-merged in [#2](https://github.com/FTC-23511/md-app/pull/2). (Also bundled a Windows-friendly Prettier `endOfLine: auto` config fix.)
- 2026-05-26 — **[meta]** Repo-wide Prettier sweep + expand auto-merge tier rule to cover root-level `*.md` and pure formatting sweeps. Auto-merged in [#1](https://github.com/FTC-23511/md-app/pull/1). (Ad-hoc item; emerged when `pnpm verify` failed on pre-existing format drift.)
