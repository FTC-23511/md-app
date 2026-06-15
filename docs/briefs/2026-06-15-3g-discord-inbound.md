# Feature: 3G — Inbound Discord capture

<!-- docs/briefs/2026-06-15-3g-discord-inbound.md — Phase 3 step 3G. Spec: docs/phase3/05-discord-inbound.md. FINAL, DEFERRABLE batch. Depends on 3D (members). Gated on DISCORD_PUBLIC_KEY. -->

## What we're building

Let a linked member file a low-friction entry from Discord. A signed slash-command webhook receives a Discord interaction, maps the Discord user to a member, and reuses the existing validate+insert pipeline. Identity is bound by a self-link handshake: the member runs `/link` in Discord to get a one-time code, then enters it in the app under their own session. Ships `/link` + `/session` first; composites stay deferred. The whole feature is inert unless `DISCORD_PUBLIC_KEY` is set.

## Why

Capture latency is the core problem MD solves; some members live in Discord. Filing a Session Log with one slash command removes friction for the fastest, most common entry. This is the **inbound** direction (the outbound SCL digest already shipped in Phase 2).

## Acceptance criteria

- Migrations apply on dev then prod: `members.discord_user_id text UNIQUE`; `discord_link_codes` table; each entry table's `created_via` CHECK allows `'discord'`.
- Member runs `/link` in Discord → gets a one-time code → enters it at `/settings/link-discord` (under their session) → sees "Discord linked" and `members.discord_user_id` is set for the current member.
- A `/session …` command in Discord creates an entry that appears in `/entries/list` with a "via Discord" indicator (`created_via = 'discord'`, `created_by` = the member).
- An **unsigned** POST to `/api/webhooks/discord` returns **401**; a valid `PING` gets `{type:1}`.
- With `DISCORD_PUBLIC_KEY` unset, the app runs normally and the webhook is inert.
- `lib/insert-entry.ts` gains an optional `{ createdBy, createdVia, client }` override; the existing app submit path is unchanged.
- `pnpm verify` green.

## Out of scope

- Composite entry types from Discord (decision/test/comp_recap/contact) — they don't map to slash commands.
- Reading message history / inbound webhooks beyond slash-command interactions.
- A bot that posts conversational replies beyond ephemeral command acks.

## Open questions

- **Which commands ship in v1** — `/link` + `/session` for sure; include `/flag` as a stretch or defer? Default: `/link` + `/session`, `/flag` if cheap.
- **Command registration** — one-time via a script using `DISCORD_BOT_TOKEN` + `DISCORD_APPLICATION_ID`; confirm the App Lead will create the Discord application + provide the keys (a setup task via `/human-task-list`).
- **Deferred responses** — if `/session` validation can exceed Discord's ~3s window, use a deferred interaction response. Confirm at PR once the command shape is known.
- **Whether to build this phase at all** — fully deferrable; can slip to a later pass without affecting 3A–3F. Confirm priority.
