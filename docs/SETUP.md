# Setup — first-time bootstrap

This is the one-time setup to go from "freshly cloned repo" to "working dev
loop with CI." You only do this once. After that, you live in [`DEV_WORKFLOW.md`](DEV_WORKFLOW.md).

Time estimate: **45–60 minutes**.

## What you need installed locally

Only two things:

- **Node.js 20 or later** — [nodejs.org](https://nodejs.org). The LTS installer
  is fine. Verify with `node --version`.
- **pnpm 9** — once Node is installed, run `npm install -g pnpm@9.10.0`.

You do **not** need: Docker, a local Postgres, Python, or any IDE in particular.

---

## Step 1 — Create the empty GitHub repo

1. Go to <https://github.com/organizations/FTC-23511/repositories/new>.
2. Repo name: `md-app`. Private. **No README, no license, no gitignore** —
   leave it completely empty. We'll push from local.
3. Click **Create repository** and leave the page open.
4. On your machine, in the directory containing this code:

   ```bash
   git init
   git branch -M main
   git remote add origin git@github.com:FTC-23511/md-app.git
   ```

   Don't commit or push yet — we need `pnpm install` to generate the
   lockfile first, which happens in Step 6.

---

## Step 2 — Create two Supabase projects

Why two? One for development (where you can break things) and one for
production. They have separate databases, separate auth, separate storage —
totally isolated.

For each project (`md-dev` first, then `md-prod`):

1. Go to <https://supabase.com/dashboard/projects> and click **New project**.
2. **Organization**: create one called `FTC 23511` if you don't have it.
3. **Name**: `md-dev` (then later `md-prod`).
4. **Database Password**: generate a strong one and **save it to a password
   manager**. You won't be able to recover this.
5. **Region**: pick the one closest to your team. East US for most of us.
6. **Pricing plan**: Free for both — the free tier is plenty for one team.
7. Click **Create new project**. It takes ~2 minutes.

When each project is ready, collect three pieces of info from each:

- **Project URL** — Settings → API → "Project URL" (looks like `https://abcxyz.supabase.co`)
- **anon key** — Settings → API → "Project API keys → anon public"
- **service_role key** — Settings → API → "Project API keys → service_role"
  ⚠️ Treat this like a password. Never commit it. Never paste it in chat.
- **Project ref** — the slug in your URL. For `https://abcxyz.supabase.co`,
  the ref is `abcxyz`.

Write these down somewhere private (password manager); you'll paste them into
Vercel and GitHub in the next steps.

---

## Step 3 — Apply the schema migrations

You'll do this once per project (dev now, prod later when you're ready to
launch). Two options:

### Option A — Supabase CLI (recommended)

Install the CLI: `npm install -g supabase` (or `brew install supabase/tap/supabase`).
Then in this repo:

```bash
# Log in (opens a browser to authenticate)
supabase login

# Link to dev project — uses SUPABASE_PROJECT_REF_DEV from .env.local
# (or pass --project-ref abcxyz directly)
supabase link --project-ref <your-dev-project-ref>

# Push all migrations
supabase db push --linked
```

If everything is healthy you'll see "Finished supabase db push." and the
Supabase dashboard's Table Editor will show all 33 tables.

### Option B — SQL Editor (no CLI required)

In the dev project dashboard → SQL Editor → New query. Paste each migration
file in order (1 through 7), running them one at a time:

1. `supabase/migrations/20260521000001_extensions_and_helpers.sql`
2. `supabase/migrations/20260521000002_core_tables.sql`
3. `supabase/migrations/20260521000003_entries_and_crosscutting.sql`
4. `supabase/migrations/20260521000004_detail_tables.sql`
5. `supabase/migrations/20260521000005_triggers.sql`
6. `supabase/migrations/20260521000006_rls_policies.sql`
7. `supabase/migrations/20260521000007_seed_reference_data.sql`

Each should end with "Success. No rows returned." (Migrations 1–6) or a row
count (Migration 7).

---

## Step 4 — Configure Supabase Auth

In your dev project dashboard:

1. **Authentication → Providers → Email**: ensure "Enable Email provider" is on.
   Disable "Confirm email" (we use magic links instead).
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (we'll add the production URL after deploy)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`

---

## Step 5 — Create your member record

The schema's RLS policies key off the `members` table, so before you can sign
in usefully you need a member row pointing at your auth user.

For now, do this manually in the SQL Editor:

```sql
-- First, create yourself as an auth user via magic link (run the app, sign in
-- once, then check Authentication → Users in Supabase to find your auth user ID).
-- Then run:

INSERT INTO public.members (team_id, auth_user_id, name, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',  -- the seeded FTC 23511 team
  '<YOUR_AUTH_USER_ID_HERE>',               -- copy from Authentication → Users
  'Your Name',
  'your@email.com',
  'documentation_captain'
);
```

(We'll automate this with a "first user becomes captain" flow in a follow-up.)

---

## Step 6 — Set up local environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=<your-dev-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-dev-service-role-key>
SUPABASE_PROJECT_REF_DEV=<your-dev-project-ref>
SUPABASE_PROJECT_REF_PROD=<your-prod-project-ref>
```

Install dependencies and verify:

```bash
pnpm install
pnpm verify
```

`pnpm verify` runs typecheck + lint + format check + unit tests + build.
If that's green, you're set. Then:

```bash
pnpm dev
```

Open <http://localhost:3000>. You should be redirected to the sign-in page.
Enter your email, click the magic link in your inbox, and you should land on
the dashboard. If you provisioned your member row in Step 5, you'll see your
role; if not, you'll see "No member record found."

**Then commit and push** — `pnpm install` generated `pnpm-lock.yaml`, which
CI needs:

```bash
git add .
git commit -m "Initial commit — schema and skeleton"
git push -u origin main
```

---

## Step 7 — Connect Vercel

1. Sign up at <https://vercel.com/signup> with your GitHub account.
2. **Add New → Project**. Import `FTC-23511/md-app`.
3. **Framework Preset**: Next.js (auto-detected).
4. **Environment Variables**: add these three for **All Environments**:
   - `NEXT_PUBLIC_SUPABASE_URL` = your **prod** project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your **prod** anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your **prod** service role key
5. Click **Deploy**.

Wait ~2 minutes. You'll get a URL like `md-app-xyz.vercel.app`. Visit it; you
should see the sign-in page.

Go back to Supabase **dev** project → Authentication → URL Configuration. Add
the Vercel URL + `/auth/callback` to Redirect URLs. (Repeat once you set up
the prod project the same way.)

---

## Step 8 — Set up GitHub Actions secrets

For CI to work, GitHub needs to know your Supabase **dev** credentials.

Go to <https://github.com/FTC-23511/md-app/settings/secrets/actions> →
**New repository secret**. Add two:

- `NEXT_PUBLIC_SUPABASE_URL_DEV` → your dev project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV` → your dev anon key

These are the only secrets CI needs for Phase 1 (no migration auto-apply yet —
you'll apply each new migration manually via Supabase CLI or SQL Editor).

---

## Step 9 — Protect main

1. Go to repo → Settings → Branches → **Add branch protection rule**.
2. Branch name pattern: `main`.
3. Check:
   - **Require a pull request before merging** (1 approval — yourself counts via GitHub)
   - **Require status checks to pass before merging**
   - In the search box, after pushing once and seeing CI run, find **"static-checks"**
     and **"build-and-e2e"** and select both as required checks
   - **Require branches to be up to date before merging**
4. Save.

Now you can't merge to main without green CI. That's the safety net.

---

## You're done

From here on, every change happens via PR. Open a branch, push, watch CI,
preview on Vercel, merge. See [`DEV_WORKFLOW.md`](DEV_WORKFLOW.md) for the
day-to-day loop.

If anything in this setup didn't work, file an issue in this repo describing
the step number and the exact error message and I'll fix it.
