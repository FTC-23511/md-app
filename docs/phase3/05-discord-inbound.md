# Phase 3 — Inbound Discord capture (spec for 3G)

The **final, deferrable** batch. Lets a linked member file a low-friction entry from Discord via a signed slash-command webhook, reusing the existing validate+insert pipeline. Identity is bound by a **self-link handshake**. The whole feature is gated on `DISCORD_PUBLIC_KEY` being present, so the app runs fine unconfigured.

> Direction note: the **outbound** SCL commit digest already shipped in Phase 2 (`.github/workflows/scl-digest.yml`). This is the **inbound** capture direction only.

---

## 1. Self-link handshake

Goal: trustworthy `discord_user_id → member` mapping. The bind is confirmed **inside the authenticated app session**, so a Discord user can only link to their own account.

Schema (`…_phase3_discord_link.sql`):

```sql
ALTER TABLE public.members ADD COLUMN discord_user_id text UNIQUE;

CREATE TABLE public.discord_link_codes (
  code            text PRIMARY KEY,          -- short, single-use
  discord_user_id text NOT NULL,
  member_id       uuid REFERENCES public.members(id),  -- set on consume
  expires_at      timestamptz NOT NULL,
  consumed_at     timestamptz
);
```

RLS: member-own + service-role for the webhook. Codes are short-lived and single-use.

**Flow:**

1. Member runs `/link` in Discord → the webhook (which knows the caller's `discord_user_id` from the signed interaction) creates a code row with that id + a short expiry, replies **ephemerally** with the code.
2. Member opens `/settings/link-discord` (authenticated), enters the code → a server action under their session finds an unconsumed/unexpired code, sets `members.discord_user_id` for the **current** member, marks the code consumed.

---

## 2. Webhook + signature verification

`app/api/webhooks/discord/route.ts` (POST). Add this path to the middleware public-path allowlist — it is protected by Ed25519, not by a session.

- Verify the Discord **Ed25519** signature: `X-Signature-Ed25519` + `X-Signature-Timestamp` over `timestamp + rawBody`, against `env.DISCORD_PUBLIC_KEY`, using `node:crypto` / Web Crypto — **no new dependency**. Read the **raw body** (`req.text()`) before parsing; verification is over exact bytes.
- Reply to `PING` (type 1) with `{ type: 1 }`.
- For commands: verify → extract `discord_user_id` → map to a member via `discord_user_id`. No match → reply "Run `/link` in Discord first, then link in the app." → map command options to a `FormData` and call the insert pipeline.
- Respect Discord's ~3s ack window: keep commands flat, or use a deferred response.
- **Never trust unsigned payloads** — return **401** before any DB work if verification fails (R10). Rate-limit by `discord_user_id`.

---

## 3. Reusing the insert pipeline

The webhook has no session, so it sets `created_by` explicitly and uses the service-role client. Add an **optional override** to `lib/insert-entry.ts` — the app path is unchanged:

```
insertEntry(definition, formData, opts?: { createdBy?: string; createdVia?: string; client?: SupabaseClient })
```

Default `createdVia` stays `'app'`; the webhook passes `{ createdBy: member.id, createdVia: 'discord', client: adminClient }`. Extend each entry table's `created_via` CHECK to allow `'discord'` (`…_phase3_created_via_discord.sql`).

---

## 4. Entry-type scope

Favor flat, low-friction commands; **defer composites** (decision/test/comp_recap/contact — nested matrix/FMEA/raw-data/story don't map to slash commands).

- **Ship first:** `/link` (handshake) + `/session` (session_log).
- **Stretch:** `/flag` (open a small flag).
- **Deferred:** everything composite.

---

## 5. Env vars (server-only lazy getters in `lib/env.ts`)

| Var                         | Use                                                    |
| --------------------------- | ------------------------------------------------------ |
| `DISCORD_PUBLIC_KEY`        | Ed25519 verification; presence gates the whole feature |
| `DISCORD_APPLICATION_ID`    | command registration                                   |
| `DISCORD_BOT_TOKEN`         | command registration / follow-up messages              |
| `SUPABASE_SERVICE_ROLE_KEY` | reused (webhook has no session)                        |

---

## 6. Files

Create: `app/api/webhooks/discord/route.ts`, `lib/discord/verify.ts`, `lib/discord/commands.ts`, `app/(authed)/settings/link-discord/page.tsx` + `actions.ts`, `…_phase3_discord_link.sql`, `…_phase3_created_via_discord.sql`.
Modify: `lib/insert-entry.ts` (optional override), `lib/supabase/middleware.ts` (public path), `lib/env.ts` (Discord getters).

---

## 7. Acceptance (browser, on preview)

- Member runs `/link`, gets a code, enters it at `/settings/link-discord`, sees "Discord linked".
- A `/session …` command in Discord makes an entry appear in `/entries/list` with a "via Discord" indicator (`created_via = 'discord'`).
- An unsigned POST to `/api/webhooks/discord` returns **401**.
- With `DISCORD_PUBLIC_KEY` unset, the app runs normally and the feature is inert.
