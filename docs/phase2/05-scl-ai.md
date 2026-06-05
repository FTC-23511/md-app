# Software Change Log AI integration (step 2G)

**Status: deferred to its own planning pass at the end of Phase 2.** Nothing here is implemented until that pass produces its own briefs.

## Why a separate pass

This is the biggest and riskiest piece of Phase 2: a GitHub webhook reads each behavior-changing commit, Claude classifies the change and generates tailored questions, the programmer answers in natural language, and the system assembles a draft Software Change Log. The full specification already exists — `docs/charters/MD_SCL_AI_Integration.md`. It carries 10 open implementation questions that need deciding before any code.

## Hard prerequisite

The **Software Change Log baseline form (step 2B)** must ship first. The AI deep-dive writes into that entry's `extras.ai_deep_dive` / `transcript_url` / `prompt_version` (`docs/phase2/01-schema.md` §3). No baseline, nothing to attach to.

## Agenda for the pass (from the integration spec §11)

Chat surface for the programmer; GitHub webhook auth; latency target (<2 min); transcript storage + queryability; single-prompt vs multi-turn follow-ups; multi-file commit handling; concurrency; per-commit API cost cap; diff-privacy disclosure; failure-mode telemetry.

When 2B is done and the team is ready, start a dedicated chat, fetch the integration charter, work the agenda, and produce `docs/phase2/` briefs for it.
