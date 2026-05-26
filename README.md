# MD-App

A web application implementing the data layer for **Maximum Documentation (MD)**, our FTC team's internal documentation operating system.

If you're a mentor or team member trying to understand what this is for, read on. If you're a developer (human or AI) about to write code in this repo, start with [`CLAUDE.md`](./CLAUDE.md) instead.

## What this does

The team's documentation problem isn't lack of effort or content. It's **capture latency** — the gap between when things happen and when they're written down. By the time someone tries to assemble a portfolio at the end of a season, the people closest to each decision have moved on, and we end up reconstructing history from memory.

MD-App is the surface that closes that gap. It hosts the capture forms, stores entries in a structured database, and feeds downstream artifacts (portfolios, pit displays, presentations) from a queryable single source of truth.

The MD system itself — what gets captured, in what fields, on what triggers, with what time budget — is specified in two charter documents:

- **`docs/charters/MD_Project_Charter.md`** — what the system captures (10 entry types, fields, triggers, quality bars, operating rhythms)
- **`docs/charters/MD_App_Charter.md`** — how the application implements it (stack, phased build, role model, risks)

These charters are mirrored into the repo. The source of truth lives in the team's working notes.

## What phase we're in

**Phase 1: Capture MVP.** Target: end of May 2026. Operational definition: the team can file Tier 1 entries (Session Logs, Outreach Logs, Meeting Notes) on summer activity.

The plan lives in [`docs/phase1/00-plan.md`](./docs/phase1/00-plan.md) — twenty-one numbered tasks in dependency order.

Phase 2 (Tier 2 entries, photo upload, AI-driven Software Change Log) and Phase 3 (multi-user auth + RLS) come later. They are out of scope for now and detailed in `MD_App_Charter.md`.

## Stack

- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** Vercel
- **Validation:** Zod
- **Source control:** GitHub (this repo); migrations checked into `supabase/migrations/`

## Architecture in one paragraph

Every entry type (Session Log, Outreach Log, etc.) is a _declarative definition_ in TypeScript — a list of _field blocks_ with configuration. One generic form renderer reads any definition and produces a working form; one validator generates Zod schemas from the same definition; one insert helper writes to the right table with the right column-vs-JSONB-extras split. Adding new entry types in later phases requires zero new form code. The schema in PostgreSQL uses typed columns for queried fields and a JSONB `extras` column for stored-and-retrieved fields. Option lists (event types, subsystems, meeting types, etc.) live in one shared `option_lists` table; users can add new options via an "Add new..." affordance on any select field. Auth is email + password with sign-up disabled and a single-email allowlist for Phase 1.

The full architecture is documented in `docs/phase1/01-conventions.md` (folder structure, patterns) and `docs/phase1/03-forms.md` (field block system).

## Getting set up locally

You need Node.js 20+, the Supabase CLI, and a Supabase project.

1. Clone the repo and `cd` in.
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in real values:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings
   - `SUPABASE_SERVICE_ROLE_KEY` (also from settings; only needed for the fallback importer)
   - `ALLOWED_EMAIL` set to the App Lead's email
4. Link the local repo to your Supabase project: `supabase link --project-ref <your-project-ref>`
5. Apply migrations: `supabase db push`
6. Create your user account manually in the Supabase dashboard (Authentication → Users → Add user → Create new user; set "Auto Confirm User"). Use the same email you put in `ALLOWED_EMAIL`.
7. `npm run dev`
8. Open `http://localhost:3000`, sign in with the email and password you just created.

Total setup time should be under fifteen minutes if you have the credentials ready.

## Documentation map

```
CLAUDE.md                                  # Operating rules for Claude Code; read this if writing code
README.md                                  # This file
docs/
├── charters/
│   ├── MD_Project_Charter.md              # The data semantics
│   ├── MD_App_Charter.md                  # The application architecture
│   └── MD_SCL_AI_Integration.md           # Phase 2 reference only
├── phase1/
│   ├── 00-plan.md                         # Task breakdown — start here for development work
│   ├── 01-conventions.md                  # Folder structure, patterns, field block system
│   ├── 02-schema.md                       # Full database schema
│   ├── 03-forms.md                        # Field block library and entry definitions
│   ├── 04-auth.md                         # Email/password + allowlist + Phase 3 migration path
│   └── 05-fallback.md                     # Text-file templates and importer for outages
└── fallback/                              # User-facing fallback workflow (during outages)
    ├── README.md
    ├── templates/
    └── inbox/
```

## Project status

This repo is a school-team build. Don't expect production-grade availability; mentor code review is async during the offseason.

Issues and questions: ping the App Lead via the team's Discord, or open a GitHub issue.
