# Routine Recovery — "Claude lost access to the repository"

When the scheduled routines stop running overnight and the UI says something
like _"Claude lost access to the repository… reconnect and re-enable,"_ one or
both routines will show as disabled (the auto-disabled one has
`ended_reason: auto_disabled_repo_access`). This doc is the 2-minute fix.

## The thing that trips people up

GitHub access for the remote routines has **two independent layers**. Fixing
one without the other leaves you still locked out — that's why this feels like
it "never works."

1. **GitHub App install** — grants the Claude app permission to _the repo_.
   Lives on GitHub's side.
2. **Account connector (OAuth)** — proves _your Claude account_ is allowed to
   act as your GitHub identity. Lives on claude.ai's side.

A lapse usually kills layer 2, but re-installing the app (layer 1) doesn't
restore it. **You almost always need to redo layer 2.** Do both to be safe.

## Steps (in order)

### 1. Re-install / confirm the GitHub App (layer 1)

> The "magic" setup link (`claude.ai/code/onboarding?magic=github-app-setup`)
> opens a **blank window in Claude Desktop — it's broken. Skip it.** Go
> straight to GitHub:

- **If Claude is already installed on the org:**
  https://github.com/organizations/FTC-23511/settings/installations
  → find **Claude** → **Configure** → set **Repository access** to
  **All repositories** (simplest, avoids this recurring) → **Save**.
- **If Claude is NOT in that list:**
  https://github.com/apps/claude → **Install** → org **FTC-23511** →
  **All repositories** → **Install**.

### 2. Reconnect the GitHub connector (layer 2) — the one people miss

- claude.ai: **Settings → Connectors** (https://claude.ai/settings/connectors),
  or in Claude Desktop: **Settings → Connectors / Connected accounts**.
- Find **GitHub** → **Disconnect**, then **Connect** again and complete the
  GitHub authorization.
- **Fallback if there's no reconnect button:** revoke from GitHub's side at
  https://github.com/settings/applications (find **Claude** under Authorized
  OAuth Apps → **Revoke**), then reconnect from claude.ai — it'll re-prompt
  from scratch.

The tell that layer 2 is still broken: a routine run fails with
`github_repo_access_denied — "re-authorize GitHub in settings"`. That message
means layer 1 is fine but layer 2 isn't.

### 3. Verify it actually works (don't trust the green checkmark)

In any Claude Code session, run `/schedule` and trigger a manual run of one
routine. A clean **HTTP 200** is the only real proof the remote agent can reach
the repo. (A 400 with `github_repo_access_denied` means go back to step 2.)

### 4. Re-enable the routines

`/schedule` → for each disabled routine, set it back to **enabled**. There are
three, all pointing at `FTC-23511/md-app`:

| Name                         | Cron (UTC)    | Local time         |
| ---------------------------- | ------------- | ------------------ |
| MD-App routine — 3:15 AM PT  | `15 10 * * *` | 3:15 AM PT, daily  |
| MD-App routine — 8:30 AM PT  | `30 15 * * *` | 8:30 AM PT, daily  |
| MD-App routine — 10:00 PM PT | `0 5 * * *`   | 10:00 PM PT, daily |

## Why this keeps happening

GitHub revokes the install/OAuth tokens when an OAuth grant is revoked, the app
is uninstalled/reinstalled, repo permissions change, or after a long idle
stretch. Once revoked, every cycle fails the access check and the scheduler
auto-disables the routine rather than retrying forever. Setting repo access to
**All repositories** (step 1) removes the most common trigger — per-repo access
silently dropping `md-app`.
