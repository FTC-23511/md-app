# MD App — Maximum Documentation for FTC 23511

The team documentation system for FTC team 23511. Implements the 10 entry
types from the MD Project Charter, plus the flag queue, audit trail, award
classification index, and public showcase.

## Status

Pre-Phase-1 skeleton. Schema is complete; capture forms ship in subsequent
sessions. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design and
[`docs/SETUP.md`](docs/SETUP.md) for one-time bootstrap.

## What's here

- **`supabase/migrations/`** — six SQL files defining the full schema (33 tables,
  enums, triggers, RLS policies, seed reference data). Applied via Supabase CLI.
- **`app/`** — Next.js 15 App Router pages. Right now: sign-in (magic link),
  callback, dashboard, public showcase, health endpoint.
- **`lib/`** — Supabase clients (server / browser / middleware), env access,
  Zod schemas (one example: session log).
- **`tests/`** — Vitest unit tests for schemas; Playwright E2E for the auth
  chain and health endpoint.
- **`.github/workflows/ci.yml`** — typecheck, lint, format check, unit tests,
  build, E2E. Runs on every PR.

## Quick links

- [Setup (first time only)](docs/SETUP.md) — Supabase + Vercel + GitHub click-path
- [Dev workflow](docs/DEV_WORKFLOW.md) — how to make changes day-to-day
- [Architecture](docs/ARCHITECTURE.md) — how the pieces fit together

## Tech

Next.js 15 · TypeScript (strict) · Supabase (Postgres + Auth + Storage) ·
Tailwind · shadcn/ui · React Hook Form · Zod · TanStack Query · Vitest ·
Playwright · pnpm 9 · deployed on Vercel.
