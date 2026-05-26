# Conventions

How code is organized, how patterns work, and why. Read once end-to-end. Reference back when a task touches one of these areas.

The audience is someone newer to this stack. Each section explains _why_ alongside _what_, because patterns that aren't understood get applied wrong.

## 1. Folder structure

```
src/
├── app/                            # Next.js App Router
│   ├── (auth)/                     # auth-related routes (login, forbidden)
│   │   ├── login/page.tsx
│   │   └── forbidden/page.tsx
│   ├── (app)/                      # protected app routes (everything past login)
│   │   ├── layout.tsx              # auth check + nav shell
│   │   ├── sessions/new/page.tsx
│   │   ├── outreach/new/page.tsx
│   │   ├── meetings/new/page.tsx
│   │   └── list/page.tsx
│   ├── auth/callback/route.ts      # magic-link handler (not protected)
│   ├── layout.tsx                  # root layout
│   └── page.tsx                    # root redirect (→ /login or /list)
├── components/
│   ├── ui/                         # shadcn primitives, copy-pasted (Button, Input, etc.)
│   └── entry-form/                 # generic entry form renderer + field block renderers
│       ├── EntryForm.tsx           # the renderer; takes an EntryDefinition, renders fields
│       ├── FieldRenderer.tsx       # switches on block.type, renders the right block
│       └── blocks/                 # one file per field block type
│           ├── TextBlock.tsx
│           ├── LongTextBlock.tsx
│           ├── SingleSelectBlock.tsx
│           ├── MultiSelectBlock.tsx
│           ├── DateBlock.tsx
│           ├── NumberBlock.tsx
│           ├── PersonAttributionBlock.tsx
│           ├── StoryBlock.tsx
│           ├── ActionItemsBlock.tsx
│           └── SpecialtyTriggersBlock.tsx
├── entries/                        # one entry definition per file
│   ├── _types.ts                   # FieldBlock and EntryDefinition TS types
│   ├── _registry.ts                # exports all entry definitions
│   ├── session-log.ts
│   ├── outreach-log.ts
│   └── meeting-notes.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # server-side Supabase client factory
│   │   └── client.ts               # browser-side Supabase client factory
│   ├── insert-entry.ts             # generic server-action helper: definition + data → DB row
│   ├── validate-entry.ts           # builds a Zod schema from a definition; parses form data
│   ├── queries.ts                  # server-side query helpers (list view, etc.)
│   └── utils.ts                    # cn() and other shared helpers
└── middleware.ts                   # email-allowlist enforcement on protected routes
```

**The `(auth)` and `(app)` parentheses** are Next.js _route groups_. Routes inside parens are not part of the URL — `(app)/list/page.tsx` is reachable at `/list`, not `/(app)/list`. They group routes that share a layout. `(app)`'s layout enforces auth; `(auth)`'s does not.

**Files starting with underscore** (`_types.ts`, `_registry.ts`) are convention for "internal to this folder, not a route or component file." They're not magic to Next.js; the prefix is for human readers and grep.

**Why `src/entries/` exists at all.** Because every entry type's definition lives here as a declarative TS file. The form, the validation, the DB insert, and the list-view rendering all read from this file. One source of truth per entry type. See §5.

## 2. Naming

- **Files for React components**: PascalCase, matching the default export's name. `EntryForm.tsx` exports `EntryForm`.
- **Files for non-component TS**: kebab-case. `insert-entry.ts`, `session-log.ts`.
- **Folders**: kebab-case for non-route folders (`entry-form/`), parentheses for Next.js route groups (`(app)/`), and the route segment name otherwise (`sessions/`, `new/`).
- **Type names**: PascalCase. `FieldBlock`, `EntryDefinition`.
- **Functions and variables**: camelCase.
- **Constants**: SCREAMING_SNAKE_CASE only for true module-level constants that never change (e.g., `MAX_STORY_COUNT`). camelCase for everything else, even values that don't get reassigned at runtime.
- **DB table names**: snake_case, plural (`session_logs`, not `SessionLog` or `session_log`).
- **DB column names**: snake_case (`created_at`, `event_type`). Map to camelCase in TS — Supabase client does this automatically when configured.

## 3. Server actions over API routes

Next.js gives you two ways to handle form submissions: API routes (a separate `route.ts` file that handles HTTP requests) and server actions (a function annotated `'use server'` that the form submits to directly). We use server actions.

**Why server actions:**

- The action lives in the same file or folder as the page that uses it. Less file-hopping.
- Type safety from form data to database insert without a JSON serialization boundary in the middle. The action takes a typed payload; TS verifies it.
- Built-in CSRF protection from the Next.js runtime.
- Streaming and progressive enhancement: the form works without JavaScript enabled.
- Less boilerplate. An API route is a full HTTP handler; a server action is just a function.

**Why not API routes (when):**

- Public-facing APIs that other apps consume. Phase 1 has none of these.
- Webhooks (the fallback Google Form's writes go directly to Supabase's REST endpoint, not through an API route).

**Pattern:**

```typescript
// src/app/(app)/sessions/new/actions.ts
'use server';

import { insertEntry } from '@/lib/insert-entry';
import { sessionLogEntry } from '@/entries/session-log';
import { redirect } from 'next/navigation';

export async function createSessionLog(formData: FormData) {
  const result = await insertEntry(sessionLogEntry, formData);
  if (!result.ok) return result; // return field errors to the form
  redirect('/list');
}
```

The action returns either `{ok: true}` (and redirects) or `{ok: false, fieldErrors: {...}}` (and the form shows the errors). The generic `insertEntry` helper does the validation and insert.

## 4. Validation via Zod

Zod is a TypeScript-first schema validation library. You declare a schema as a JS value; Zod gives you (a) a parser that validates incoming data and (b) a type derived from the schema. Same source for runtime validation and compile-time types.

**Why Zod here:**

- The validator and the type stay in sync automatically. Add a field to the Zod schema, the TS type updates.
- Field-level error messages come back from `safeParse()` in a structured form that maps cleanly to per-field UI errors.
- Composable: schemas can be built up from smaller schemas, which is exactly what the field block system does.

**Where schemas live in this project:**

Schemas for entry types are not hand-written. They are _derived_ from the entry definition by `lib/validate-entry.ts`. Each field block declares how it contributes to the Zod schema (a `text` block contributes `z.string().min(1)` if required, `z.string().optional()` if not, etc.). The validator function walks the entry's field list and builds the full schema.

For things that aren't entries (auth form, fallback form payload), schemas are hand-written and live alongside the code that uses them.

## 5. The field block system

This is the architectural heart of Phase 1 and everything after. Read this section carefully even if other sections are skimmable.

**Premise.** The MD system defines ten entry types now and may define more later. Each entry type has a set of fields. Some fields are common across many types (a date, a person attribution). Some are specific to one type (an Outreach Log's engagement-depth multi-select with custom note). If every entry type's form, validation, and DB insert are hand-coded, the marginal cost of adding a new entry type or a new field is high, and the system rots over years.

**Solution.** Decompose every entry into a list of _field blocks_. A field block is a typed primitive with a known renderer, validator, and storage rule. An entry definition is a list of field block instances with configuration. Forms are rendered generically by walking the definition. Validation is generated automatically. Inserts are generated automatically.

**The field block library** (Phase 1).

Ten block types, each implemented once and reused across entry types:

| Block type           | What it captures                                                                                                  | Example use                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `text`               | Single-line text                                                                                                  | Session lead name                                |
| `long-text`          | Multi-line text (textarea)                                                                                        | "What worked today"                              |
| `single-select`      | One choice from a fixed list (radio or dropdown)                                                                  | Outreach Log event type (9 options)              |
| `multi-select`       | Zero or more choices from a fixed list, optionally with a free-text custom note                                   | Outreach Log engagement depth (8 options + note) |
| `date`               | A calendar date                                                                                                   | Meeting date, event date                         |
| `number`             | A numeric value                                                                                                   | Total attendees, hours of duration               |
| `person-attribution` | A list of `{name, contribution}` rows                                                                             | "Per-person contributions"                       |
| `story-block`        | A repeating block of `{person, what happened, quote, permission status, optional photo}`                          | Outreach Log stories (≥3 required)               |
| `action-items`       | A repeating block of `{owner, action, due date}`                                                                  | Meeting Notes action items                       |
| `specialty-triggers` | The universal Tier 1 → Tier 2 flagging UI (checklist of entry types; each check reveals owner and subject inputs) | Bottom of Session/Outreach/Meeting forms         |

**An entry definition** is just a list of these blocks with configuration:

```typescript
export const sessionLogEntry: EntryDefinition = {
  type: 'session_log',
  table: 'session_logs',
  label: 'Session Log',
  fields: [
    { type: 'date', name: 'date', label: 'Date', required: true, storage: 'column' },
    {
      type: 'text',
      name: 'session_lead',
      label: 'Session lead',
      required: true,
      storage: 'column',
    },
    {
      type: 'long-text',
      name: 'what_worked_on',
      label: 'What did we work on today?',
      required: true,
      maxLength: 500,
      storage: 'column',
    },
    // ...
    {
      type: 'specialty-triggers',
      name: 'specialty_entries',
      label: 'Specialty entries triggered',
      storage: 'extras',
    },
  ],
};
```

The renderer reads this and produces the form. The validator reads this and produces the Zod schema. The inserter reads this and produces the `INSERT` payload. The list-view reader uses the type name to label entries.

**Storage decision: `column` vs `extras`.**

Every entry table has a `extras JSONB` column. Every field block declares `storage: 'column'` or `storage: 'extras'`. The decision rule:

- **`column`** when the field is queried, filtered, indexed, joined on, or constrained. SQL is genuinely good at this.
  - Examples: `date`, `event_type`, `total_attendees`, `created_by`, `subsystem`.
- **`extras`** when the field is stored and retrieved as a whole, never the basis of a query.
  - Examples: `engagement_depth` array, story sub-blocks, action items, per-person contributions, specialty triggers, follow-up plan details.

The `extras` column is a single JSONB blob. Adding a new `extras` field is _zero_ SQL changes — just update the entry definition. Adding a new `column` field is one migration.

**Conditional field visibility** is handled by a `visibleWhen` property on the dependent field's block config. It is a **plain object describing a condition**, not a function — same library of blocks is reused everywhere, and the property is serializable (the Phase 5 builder, if it ships, can write these objects directly to a database without generating code).

The condition shapes:

```typescript
// Hidden until the parent field's value matches exactly
{ field: 'follow_up_type', equals: 'individual' }

// Hidden until the parent field has any non-empty / truthy value
{ field: 'has_voice_memo', truthy: true }

// Hidden unless the parent's value is one of several options
{ field: 'event_type', in: ['public-showcase', 'classroom-visit', 'workshop'] }

// Compound — all sub-conditions must be true
{ all: [ {field: 'a', equals: 'x'}, {field: 'b', truthy: true} ] }

// Compound — at least one sub-condition must be true
{ any: [ {field: 'a', equals: 'x'}, {field: 'b', equals: 'y'} ] }
```

Applied to a block:

```typescript
{
  type: 'multi-select',
  name: 'follow_up_individuals',
  label: 'Names for individual follow-up',
  storage: 'extras',
  visibleWhen: { field: 'follow_up_type', equals: 'individual' },
}
```

The renderer hides the field when the condition is false. The validator skips hidden fields — no validation errors on things the user can't see. This avoids needing dedicated "branched-select" or similar composite block types for every place a form branches; the same library of blocks (§5) is reused, with visibility as a per-instance property.

**When to add a new field block type.**

Add a new block type when an existing one can't cleanly capture the field, _and_ the new pattern is reusable across at least two entry types. Don't add a block type for a one-off field — use an existing block with config instead.

Example of when to add: if the Outreach Log v2.4 adds a "geographic reach map" field that's a list of `{lat, lng, label}` markers, that's a new `geo-points` block (Hardware Change Log, Test Log might later use the same pattern). Add it.

Example of when not to add: if Session Log needs a "weather conditions at the build" field for a one-off summer experiment, use a `long-text` block. Don't create a `weather` block.

**Adding a new block type checklist:**

1. Add the block type to the `FieldBlock` union in `src/entries/_types.ts`.
2. Implement the renderer component in `src/components/entry-form/blocks/<Name>Block.tsx`.
3. Add the validator contribution in `src/lib/validate-entry.ts`.
4. Add the insert-payload contribution in `src/lib/insert-entry.ts` (if it has a non-trivial mapping).
5. If `storage: 'column'`, include the column type pattern in `docs/phase1/02-schema.md`.

## 6. Form rendering

The renderer is `src/components/entry-form/EntryForm.tsx`. Usage:

```typescript
'use client';
import { EntryForm } from '@/components/entry-form/EntryForm';
import { sessionLogEntry } from '@/entries/session-log';
import { createSessionLog } from './actions';

export default function NewSessionPage() {
  return <EntryForm definition={sessionLogEntry} action={createSessionLog} />;
}
```

Behind the scenes the form:

1. Walks `definition.fields`. For each field, renders the corresponding `<XxxBlock />` component, passing the block's config.
2. Maintains form state (uncontrolled inputs where possible — the browser holds the state). Some block types (story-block, action-items, specialty-triggers) are repeating composites and need their own internal state; they manage it locally.
3. On submit, gathers all field values into a `FormData`, calls the server action.
4. The server action validates with the Zod schema derived from the definition. On failure, returns `{fieldErrors: {fieldName: errorMessage}}`. The form displays each error under its field.
5. On success, the server action redirects (typically to `/list`).

**Why uncontrolled inputs by default.** Controlled inputs (where React state is the source of truth) trigger re-renders on every keystroke. For a form with 15+ fields this can stutter. The browser's own form-state handling is faster and the only React state we need is for fields with conditional logic (visibility, dynamic rows).

## 7. Server-side data access

Database reads and writes go through the Supabase client. Two factories:

- `src/lib/supabase/server.ts` exports `createServerClient()` for use in server components, server actions, and route handlers. It reads the auth cookie from the request and is bound to the current user's session.
- `src/lib/supabase/client.ts` exports `createBrowserClient()` for use in client components. Currently only the auth flow needs it (for redirecting after sign-in).

**Rule: writes happen server-side.** Forms submit to server actions; server actions call `createServerClient()` and do the insert. The browser client never inserts directly. This is the path Phase 3 RLS will lock down — keeping all writes server-side now means Phase 3 is a policy change, not an app change.

**Rule: reads also happen server-side where possible.** Server components fetch data, render HTML, send to the client. Client-side data fetching is for things the server can't know (e.g., responding to user interaction). The list view is a server component.

## 8. Error handling

**Validation errors** come back from server actions as `{ok: false, fieldErrors: {...}}`. The form renderer displays them inline.

**Unexpected errors** (Supabase is down, network failure, etc.) are caught by the server action and returned as `{ok: false, formError: "Something went wrong. Try again."}`. The form shows a top-level error banner. Detailed error info is logged server-side, not shown to the user.

**Never throw across the server-action boundary.** Throwing produces a Next.js error page; for a form submission you almost never want that. Catch and convert to a structured result.

## 9. Environment variables

| Variable                        | Used in                    | What it is                                                                                   |
| ------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Server + client            | Supabase project URL. Public (it's in client bundles).                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server + client            | Supabase anon key. Public; intended for client use.                                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only — never expose | For privileged inserts (the fallback Google Form path uses this in Apps Script, separately). |
| `ALLOWED_EMAIL`                 | Server (middleware)        | The single email allowed to sign in during Phase 1.                                          |

`.env.local` holds real values locally and is gitignored. `.env.example` documents the variable list with placeholder values and is committed.

**Never put a `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable.** Next.js will inline it into client bundles. This is the kind of mistake that ends in a security incident; if it ever accidentally happens, rotate the key immediately in the Supabase dashboard.

## 10. TypeScript strictness

`tsconfig.json` has `"strict": true`. This enables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and others.

**Avoid `any`.** If a third-party library has missing types, prefer `unknown` over `any` and narrow with type guards. If you must use `any`, leave a comment on the same line explaining why.

**Prefer `unknown` for parsed JSON until you've validated it with Zod.** `JSON.parse()` returns `any` and that any then poisons everything downstream. Wrap parse calls in Zod schemas and you get `unknown → validated typed object`.

## 11. Workflows

### Adding a new entry type

1. Create `src/entries/<type>.ts` exporting an `EntryDefinition`.
2. Add it to `src/entries/_registry.ts`.
3. Write a migration in `supabase/migrations/` for the new table (use the columns from the definition).
4. Run `supabase db push`.
5. Create the route at `src/app/(app)/<type>/new/page.tsx` (a 5-line file that imports the renderer and definition).
6. Add the type to the list view's union query in `src/lib/queries.ts`.

No new form code. No new validation code. No new server-action code beyond a one-line wrapper.

### Adding a new field to an existing entry

1. Edit the entry's definition in `src/entries/<type>.ts` — add the new field block.
2. If `storage: 'column'`, add a migration in `supabase/migrations/` to add the column.
3. Run `supabase db push`.

The form picks up the new field automatically. The validator picks up the new field automatically. The insert picks up the new field automatically.

### Adding a new field block type

See §5, "Adding a new block type checklist."

## 12. Commit and PR conventions

**Branch names:** `phase1/T<n>-<slug>`, e.g., `phase1/T13-entry-form-system`.

**Commit messages:** Imperative mood, short summary on the first line, optional detail below.

```
T13: build EntryForm renderer + field block library

Implements the generic form renderer per docs/phase1/03-forms.md §1.
Block types implemented: text, long-text, single-select, multi-select,
date, number, person-attribution, story-block, action-items,
specialty-triggers.
```

**PR titles:** `phase1: T<n> <task name>`.

**PR body:**

- Link to the task in `docs/phase1/00-plan.md`.
- Bullet list of what changed.
- Confirmation of each acceptance criterion from the task.
- "I checked: …" — anything you manually tested.
- Open questions or things you'd like the reviewer to focus on.

**Smaller PRs are better.** A 100-line PR gets reviewed in five minutes. A 600-line PR gets reviewed in an hour or sits for a week. If a task is producing a PR over ~500 lines of substantive code (not counting generated files like `migrations/`), consider whether the task should be split.

## 13. When something feels off

If you find yourself about to do any of these, stop and ask in the PR:

- Adding a dependency not in the approved list (§CLAUDE.md).
- Writing form code that bypasses the renderer.
- Writing validation code that bypasses Zod.
- Editing a table in the Supabase dashboard instead of via migration.
- Adding a `NEXT_PUBLIC_*` variable that contains a secret.
- Putting business logic in a route group's layout.
- Implementing something on the deferred list in `CLAUDE.md`.
- Disagreeing with a charter and being tempted to "fix" the charter.

These are the failure modes the project's structure is shaped to prevent. The cost of asking is a comment in a PR. The cost of doing them quietly is rework or a security incident.
