# Backlog

The queue the morning routine processes. Add items here as one-liners or
links to briefs in `docs/briefs/`. The routine picks the top item from
"Next up," moves it to "In progress," ships a PR, and (where safe)
auto-merges.

You can add items by editing this file directly, or by asking Claude Code:
> *"Add 'fix typo on sign-in page' to the backlog."*

Priority is top-down — drag the most important items to the top of "Next up."

---

## Next up

<!-- Routine pulls from the top of this list. -->

1. **[docs]** Fix `README.md` to use `pnpm` consistently. It currently says `npm install` (step 2 of "Getting set up locally") and `npm run dev` (step 7), but the rest of the project — `CLAUDE.md`, `docs/SETUP.md`, `package.json` scripts — uses `pnpm`. Update both occurrences to `pnpm install` and `pnpm dev`. *Expected tier: auto-merge (docs only).*

2. **[docs]** Fix `docs/SETUP.md` Step 4 magic-link reference. Step 4 currently says *"Disable 'Confirm email' (we use magic links instead)"*, but per `docs/phase1/04-auth.md` Phase 1 auth is **email + password with sign-up disabled**, not magic link. Rewrite Step 4 to reflect the Phase 1 plan: enable email+password provider, disable sign-up entirely (the critical setting), keep "Confirm email" off, and update redirect URLs to include `/auth/reset-password` (used by forgot-password flow) instead of `/auth/callback`. *Expected tier: auto-merge (docs only).*

3. **[code]** Replace `app/auth/callback/route.ts` with `app/auth/reset-password/route.ts` per `docs/phase1/04-auth.md` §6. The current callback file is the magic-link sign-in handler, which Phase 1 doesn't use. The reset-password route handles the *forgot-password* magic-link path: exchanges the `code` query param for a session, then redirects to `/change-password`. Spec and exact code pattern are in `04-auth.md` §6. Delete the old callback file. *Expected tier: approval-required (touches `app/auth/`).*

## In progress

<!-- Routine moves items here with the PR link when work starts. -->

_(empty)_

## Done

<!-- Auto-archived after merge. Keep the last ~20 for reference; older entries can be pruned. -->

_(empty)_
