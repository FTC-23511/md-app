# Fallback capture

When the main app is down, capture happens through text files. A small importer script ingests them later when the app is back up.

This document specifies the templates, the importer behavior, and the workflow. It is shorter than the schema and forms specs because the scope is intentionally contained — this is the emergency path, not a parallel capture surface.

## 1. Purpose

The risk being mitigated, per `MD_App_Charter.md` §8: a mid-season bug or outage prevents capture during build crunch, and contemporaneous records are lost. The system's entire reason for existing (per `MD_Project_Charter.md` §1) is preventing exactly this loss.

The fallback satisfies three requirements:

1. **Capture stays possible.** A team member with no internet, a broken app, or a Supabase outage can still file a Session Log in roughly the same five minutes the app would have taken.
2. **The data survives until import.** Files on disk are durable. Cloud services are not (during the outage).
3. **The import reconstructs the entry faithfully.** Same Zod validation, same option-list resolution, same database row as the app would have produced — just with `created_via = 'fallback_form'` instead of `'app'`.

The text-file path was selected over a Google Form fallback because the build cost is lower, the failure model is simpler (no external auth or quota dependencies), and the artifacts (templates + importer) live in the repo where future Captains can find them. Trade-off: the Captain has to actively run the importer, which is acceptable because outages are rare events, not daily.

## 2. Architecture

```
docs/fallback/
├── README.md                   # User-facing instructions for filing during outage
├── templates/
│   ├── session-log.md
│   ├── outreach-log.md
│   └── meeting-notes.md
└── inbox/                      # Filled-out files land here pre-import
    └── .gitkeep

scripts/fallback/
└── import.ts                   # The importer script
```

The contributor copies a template, fills it out, hands the file to the Documentation Captain. The Captain drops it into `docs/fallback/inbox/` and runs `npm run import-fallback`. The script parses, validates, resolves option references, and inserts. Files that import successfully are renamed `<name>.imported.md`; files that fail are left in place with errors written to a `<name>.errors.log` sibling file.

## 3. Template format

Each template uses **YAML frontmatter for structured fields** and **markdown body sections for narrative and composite fields**. The two are bridged by a known mapping from markdown header to field name.

### 3.1 What goes in frontmatter

- Dates (`session_date: 2026-11-18`)
- Simple values (`session_lead: Alex Chen`, `duration_hours: 2.5`)
- Single-select option values, by their string `value` (not UUID): `event_type: public-showcase`
- Multi-select option values, as a list of strings: `subsystems: [intake, drivetrain]`
- Numeric values, booleans

The frontmatter is parsed by the standard `yaml` package. Multi-line strings use the `|` pipe operator.

### 3.2 What goes in body sections

- Long-text narrative fields (`## What worked` → `what_worked` column)
- Repeating composite structures (stories, action items, contributions, specialty triggers) — each composite has its own well-defined sub-format documented in §3.4
- The free-text "custom note" portion of a multi-select-with-note field

The body parser maps known headers (case-insensitive, normalized to snake_case) to field names. Unknown headers are ignored with a warning.

### 3.3 Why this split

- Frontmatter is unambiguous when filled by humans. Field name on the left, value on the right, end of line. No parsing of prose required.
- Body sections are readable as a document. A contributor or future reader can open the file and understand what was captured without parsing rules.
- Composite structures (stories, action items, etc.) need shape, and markdown subheadings give shape with low friction.

### 3.4 Composite structures in body sections

These four patterns recur across templates:

**Person attribution.** One bullet per person, name as a bold prefix, contribution as the rest of the line.

```markdown
## Per-Person Contributions

- **Alex Chen:** drove the test, decided on the revert
- **Sam Patel:** filmed and counted misses
- **Jordan Lee:** ran the scoring app
```

Parser: split on lines starting with `- `, extract bolded name and remaining text.

**Action items.** One bullet per item, pipe-separated key/value pairs.

```markdown
## Action Items

- **Owner:** Sam | **Action:** Order replacement gears | **Due:** 2026-11-22
- **Owner:** Alex | **Action:** Update intake CAD | **Due:** 2026-11-20
```

Parser: split on lines starting with `- `, split each on `|`, extract key/value from each segment.

**Specialty entries triggered.** GitHub-style checkbox list; only checked rows are imported.

```markdown
## Specialty Entries Triggered

- [x] **Hardware Change Log** — owner: Alex — subject: revert to v3 intake wheel
- [x] **Test Log** — owner: Sam — subject: v3 vs v4 miss rate at N=20
- [ ] Decision Log
- [ ] Software Change Log
- [ ] Contact Log
```

Parser: match the line pattern, only emit entries with `[x]`. Owner and subject are required for checked entries; importer rejects with a clear error if missing.

**Stories.** Numbered subheadings (`### Story N`); each story has a fixed sub-field block.

```markdown
## Stories

### Story 1

- **Person:** Alex Chen
- **Role / age:** Parent, ~40
- **Permission:** yes
- **Photo URL:** (leave blank in Phase 1)

**What happened:**
Stayed after the demo and asked detailed questions about the intake mechanism for 25 minutes. Engineer at a local manufacturer.

**Quote:**
This is exactly what I wish I'd had as a kid.

### Story 2

...
```

Parser: split on `### Story` boundaries; within each block parse the bullet-list metadata and the labeled `**What happened:**` / `**Quote:**` paragraphs.

**Multi-select with custom note.** Checkbox list followed by optional note.

```markdown
## Engagement Depth

Check all that apply:

- [x] Hands-on robot or team interaction
- [x] Sustained engagement (>15 min)
- [ ] Substantive questions
- [ ] Network expansion
- [x] Direct interest in joining or supporting
- [ ] Specific next-step commitment made
- [ ] Brief walk-by interactions
- [ ] Distracted audience or rushed format

**Custom note (optional):**
Several parents asked about FLL team availability in the district.
```

Parser: match labeled checkboxes against the `engagement_depth` category's option labels; collect checked items as a list of option `value` strings; extract the custom note paragraph if present.

## 4. The three templates

Templates are committed to the repo. Updating a template after a charter change is a regular PR. The version of the template the contributor used is recorded in the parsed file via a frontmatter field (`template_version`); the importer uses this to apply per-version parsing rules if templates evolve.

### 4.1 `docs/fallback/templates/session-log.md`

```markdown
---
# REQUIRED. Do not change the lines marked REQUIRED.
type: session_log # REQUIRED — must be 'session_log'
template_version: 1 # REQUIRED — leave as 1
session_date: 2026-MM-DD # REQUIRED — today's date
session_lead: Your Name # REQUIRED — who is filing this
duration_hours: # Optional — decimal hours, e.g. 2.5
subsystems: # Optional — list of subsystem labels
  - intake
  - drivetrain
---

## What did we work on today?

<!-- REQUIRED. 1–3 sentences. -->

## What worked?

<!-- Optional. 1–3 sentences. -->

## What didn't work?

<!-- Optional. 1–3 sentences. -->

## Numbers measured today

<!-- Optional. Free text. Substantive numerical results go in a Test Log. -->

## What's next session?

<!-- Optional. 1–2 sentences. -->

## Per-Person Contributions

<!-- One line per attending person. Format: - **Name:** contribution -->

- **Name:** contribution

## Specialty Entries Triggered

<!-- Check the boxes for Tier 2 entries that should result from this session. -->
<!-- For each checked box, fill in owner and subject. -->

- [ ] **Decision Log** — owner: NAME — subject: BRIEF
- [ ] **Hardware Change Log** — owner: NAME — subject: BRIEF
- [ ] **Software Change Log** — owner: NAME — subject: BRIEF
- [ ] **Test Log** — owner: NAME — subject: BRIEF
- [ ] **Contact Log** — owner: NAME — subject: BRIEF
```

### 4.2 `docs/fallback/templates/outreach-log.md`

```markdown
---
# REQUIRED. Do not change the lines marked REQUIRED.
type: outreach_log # REQUIRED — must be 'outreach_log'
template_version: 1 # REQUIRED — leave as 1
event_name: Event Name Here # REQUIRED
event_date: 2026-MM-DD # REQUIRED — date of event
location_city: # Optional
location_state: # Optional
host_org: # Optional — host organization name
our_role: demo # Optional — demo / coaching / workshop / fair-table / other
event_type:
  public-showcase # REQUIRED — one of: private-sponsor,
  #   public-showcase, presentation-conference,
  #   classroom-visit, workshop-hosted,
  #   recurring-program, first-community,
  #   online-virtual, other
outreach_reporter: Your Name # REQUIRED — you, the Reporter
total_attendees: 0 # REQUIRED — integer
zero_first_count:
  0 # REQUIRED — integer; of total, how many
  #   had no prior FIRST experience
age_range: mixed # Optional — e.g. "K-5", "middle school + parents"
follow_up_type: # Optional — none / via-host / individual /
  #   re-engagement
---

## Team Members Present

<!-- One line per team member at the event with their role. -->
<!-- Format: - **Name:** role at event -->

- **Name:** role

## Engagement Depth

<!-- REQUIRED — at least one box checked OR a custom note. -->

Check all that apply:

- [ ] Hands-on robot or team interaction
- [ ] Sustained engagement (>15 min)
- [ ] Substantive questions
- [ ] Network expansion
- [ ] Direct interest in joining or supporting
- [ ] Specific next-step commitment made
- [ ] Brief walk-by interactions
- [ ] Distracted audience or rushed format

**Custom note (optional):**

## New FLL Participants Directly Inspired Today

<!-- Optional. Names if known. -->

## New FTC Participants Directly Inspired Today

<!-- Optional. Names if known. -->

## New Mentors / Coaches / Volunteers Committed Today

<!-- Optional. Names if known. -->

## Existing FIRST Community Members Re-Engaged Today

<!-- Optional. -->

## Stories

<!-- REQUIRED — at least 3 stories. Each named, with permission status. -->

### Story 1

- **Person:** Name
- **Role / age:** e.g. Parent, ~40 / Student, age 8
- **Permission:** yes / no / pending
- **Photo URL:** (leave blank in Phase 1)

**What happened:**

<!-- 2–4 sentences. -->

**Quote:**

<!-- Direct quote if any; verbatim. -->

### Story 2

- **Person:** Name
- **Role / age:**
- **Permission:** yes / no / pending
- **Photo URL:**

**What happened:**

**Quote:**

### Story 3

- **Person:** Name
- **Role / age:**
- **Permission:** yes / no / pending
- **Photo URL:**

**What happened:**

**Quote:**

## What Worked Well

<!-- Optional. -->

## What We'd Do Differently Next Event

<!-- Optional. -->

## Follow-Up Details

<!-- Optional. Only fill in the part matching your follow_up_type frontmatter. -->

**Names for individual follow-up** (only if follow_up_type is `individual`):

**Link to prior Outreach Log** (only if follow_up_type is `re-engagement`):

## Specialty Entries Triggered

<!-- Most commonly a Contact Log for each new mentor / sponsor / individual follow-up. -->

- [ ] **Decision Log** — owner: NAME — subject: BRIEF
- [ ] **Hardware Change Log** — owner: NAME — subject: BRIEF
- [ ] **Software Change Log** — owner: NAME — subject: BRIEF
- [ ] **Test Log** — owner: NAME — subject: BRIEF
- [ ] **Contact Log** — owner: NAME — subject: BRIEF
```

### 4.3 `docs/fallback/templates/meeting-notes.md`

```markdown
---
# REQUIRED. Do not change the lines marked REQUIRED.
type: meeting_notes # REQUIRED — must be 'meeting_notes'
template_version: 1 # REQUIRED — leave as 1
meeting_type:
  weekly # REQUIRED — one of: kickoff, weekly,
  #   strategy, retro, planning
meeting_date: 2026-MM-DD # REQUIRED
scribe: Your Name # REQUIRED — who is filing this
next_meeting_date: # Optional
---

## Attendees

<!-- REQUIRED — at least one attendee. -->
<!-- Format: - **Name:** role/focus (optional after the colon) -->

- **Name:** (focus optional)

## Agenda Items + Outcomes

<!-- REQUIRED. For each agenda item, what was discussed and decided. -->

## Decisions Made

<!-- Optional. Summary; Decision Log entries are the canonical record. -->

## Action Items

<!-- Optional. One bullet per action. -->

- **Owner:** Name | **Action:** what they're doing | **Due:** YYYY-MM-DD

## Open Questions / Parking Lot

<!-- Optional. -->

## Specialty Entries Triggered

- [ ] **Decision Log** — owner: NAME — subject: BRIEF
- [ ] **Hardware Change Log** — owner: NAME — subject: BRIEF
- [ ] **Software Change Log** — owner: NAME — subject: BRIEF
- [ ] **Test Log** — owner: NAME — subject: BRIEF
- [ ] **Contact Log** — owner: NAME — subject: BRIEF
```

## 5. The importer script

`scripts/fallback/import.ts` is a Node.js script run via `npm run import-fallback -- <files-or-glob>`.

### 5.1 Behavior

1. **Resolve inputs.** Each argument is a file path or glob. Globs expand to file lists. Each file's basename plus path becomes its identifier in logs.
2. **Parse frontmatter and body.** `yaml` for frontmatter; a regex-based section splitter for body. Mapping table from header text to field name lives in the entry definition (added in §6 below) so the renderer, the validator, and the importer all share one source of truth.
3. **Resolve `type` to an entry definition.** The frontmatter's `type` field looks up the corresponding `EntryDefinition` from `entries/_registry.ts`. If no match: reject with a clear error.
4. **Build the same shape the live form would produce.** Walk the definition's fields; for each field, pull the value from frontmatter (for `'column'` blocks) or from the appropriate body section (for `'extras'` blocks). The result is a plain object keyed by field name.
5. **Resolve option-list references.** Single- and multi-select field values are strings (e.g., `event_type: public-showcase`). The importer looks up each value in `option_lists` by `(category, value)`. If the option exists, use its `id`. If it doesn't exist and the field has `allowAddNew: true`, **insert a new option_lists row** with `is_seed: false, created_via: 'fallback_import'` and use the new id. If the field has `allowAddNew: false` and the value doesn't exist, reject with an error naming the field and the unknown value.
6. **Validate with the entry's Zod schema.** Same schema the live form uses. On failure, write a `<filename>.errors.log` next to the source file with field-level errors; do not insert. Move on to the next file.
7. **Insert via the service role key.** Server-side insert into the entry's table, populating `created_via = 'fallback_form'` and `created_by = NULL` (the captain can manually link to a member later if desired). Common columns (`created_at`, `updated_at`, etc.) take their defaults.
8. **Rename successfully imported files.** `session-log-2026-11-18-intake-tuning.md` becomes `session-log-2026-11-18-intake-tuning.imported.md`. The file stays in `docs/fallback/inbox/` so the Captain can move or archive it.
9. **Summary.** At the end, print: total files, total imported, total errored, list of errored files with one-line error summaries.

### 5.2 Skeleton

```typescript
// scripts/fallback/import.ts (sketch — implementation lands in T17)

import { readFile, writeFile, rename } from 'node:fs/promises';
import { glob } from 'glob';
import yaml from 'yaml';
import { createClient } from '@supabase/supabase-js';
import { ENTRY_REGISTRY } from '@/entries/_registry';
import { buildZodSchemaFromDefinition } from '@/lib/validate-entry';
import { parseBodyForDefinition } from './parse-body';
import { resolveOptions } from './resolve-options';

async function importOne(filePath: string, supabase): Promise<{ ok: boolean; error?: string }> {
  const raw = await readFile(filePath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(raw);
  const fm = yaml.parse(frontmatter);

  // Look up entry definition by frontmatter.type
  const def = ENTRY_REGISTRY[fm.type];
  if (!def) return { ok: false, error: `Unknown entry type: ${fm.type}` };

  // Parse body using definition's header→field mapping
  const bodyFields = parseBodyForDefinition(def, body);

  // Merge frontmatter + body into one object keyed by field name
  const merged = mergeFrontmatterAndBody(def, fm, bodyFields);

  // Resolve option_lists references (string values → UUIDs, inserting new rows where allowed)
  const resolved = await resolveOptions(def, merged, supabase);

  // Validate with same Zod schema as the live form
  const schema = buildZodSchemaFromDefinition(def);
  const parsed = schema.safeParse(resolved);
  if (!parsed.success) {
    await writeFile(`${filePath}.errors.log`, formatZodErrors(parsed.error));
    return { ok: false, error: 'Validation failed; see .errors.log' };
  }

  // Split into column values and extras
  const { columns, extras } = splitColumnsAndExtras(def, parsed.data);

  // Insert
  const { error } = await supabase.from(def.table).insert({
    ...columns,
    extras,
    created_via: 'fallback_form',
    entry_state: def.defaultEntryState ?? 'complete',
  });

  if (error) return { ok: false, error: error.message };

  // Rename file to mark as imported
  await rename(filePath, filePath.replace(/\.md$/, '.imported.md'));
  return { ok: true };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npm run import-fallback -- <files-or-glob>');
    process.exit(1);
  }
  const files = (await Promise.all(args.map((a) => glob(a)))).flat();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role for fallback inserts
  );

  let okCount = 0;
  const errors: { file: string; error: string }[] = [];
  for (const file of files) {
    const result = await importOne(file, supabase);
    if (result.ok) {
      okCount++;
      console.log(`✓ ${file}`);
    } else {
      errors.push({ file, error: result.error! });
      console.log(`✗ ${file}: ${result.error}`);
    }
  }
  console.log(`\nImported: ${okCount} / ${files.length}`);
  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(({ file, error }) => console.log(`  ${file}: ${error}`));
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
```

### 5.3 The body parser

Each entry definition gets one new function: a header-to-field mapping. Lives in the entry definition file.

```typescript
// In session-log.ts, alongside the entry definition:

export const sessionLogBodyMapping: Record<string, string> = {
  'what did we work on today?': 'what_worked_on',
  'what worked?': 'what_worked',
  "what didn't work?": 'what_didnt_work',
  'numbers measured today': 'numbers_measured',
  "what's next session?": 'whats_next',
  'per-person contributions': 'contributions',
  'specialty entries triggered': 'specialty_entries',
};
```

The body parser normalizes headers (lowercase, trim, collapse whitespace), looks up the field name, and uses the appropriate sub-parser based on the block type from the definition:

- `long-text` blocks → take the raw paragraph(s) after the header
- `person-attribution`, `action-items`, `specialty-triggers` → invoke the composite-structure parser for that block type
- `multi-select` with `withCustomNote` → invoke the engagement-depth parser

The composite parsers are small functions in `scripts/fallback/parsers/`. One per composite block type. Each takes a raw markdown block, returns a structured value matching the Zod schema for that block.

### 5.4 Option resolution

`scripts/fallback/resolve-options.ts`:

```typescript
async function resolveOptions(def, data, supabase) {
  const resolved = { ...data };
  for (const field of def.fields) {
    if (field.type !== 'single-select' && field.type !== 'multi-select') continue;

    const valueOrValues = data[field.name];
    if (valueOrValues == null) continue;

    const values = Array.isArray(valueOrValues) ? valueOrValues : [valueOrValues];
    const resolvedIds: string[] = [];

    for (const v of values) {
      // Look up existing option
      const { data: existing } = await supabase
        .from('option_lists')
        .select('id')
        .eq('category', field.category)
        .eq('value', v)
        .is('deleted_at', null)
        .maybeSingle();

      if (existing) {
        resolvedIds.push(existing.id);
      } else if (field.allowAddNew !== false) {
        // Insert new option
        const { data: created } = await supabase
          .from('option_lists')
          .insert({
            category: field.category,
            value: v,
            label: v.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
            is_seed: false,
          })
          .select('id')
          .single();
        resolvedIds.push(created.id);
      } else {
        throw new Error(
          `Unknown option for ${field.name}: '${v}'. ` +
            `Category '${field.category}' does not allow new options.`,
        );
      }
    }

    resolved[field.name] = Array.isArray(valueOrValues) ? resolvedIds : resolvedIds[0];
  }
  return resolved;
}
```

This mirrors the "Add new..." affordance in the live form — same behavior, different invocation path.

## 6. Workflow

### 6.1 During an outage — the contributor

1. Open the team's shared docs (Discord pinned message, Drive folder, repo clone — wherever templates are mirrored).
2. Copy the appropriate template (`session-log.md`, etc.).
3. Save it locally with a filename like `2026-11-18-session-log-intake-tuning.md`. Convention is `YYYY-MM-DD-<type>-<slug>.md` so files sort sensibly.
4. Fill in the frontmatter and body sections. Skip optional fields with empty values.
5. Send the file to the Documentation Captain (Discord upload, email attachment, USB stick — any path that gets the file to them).

The contributor does not need git, the importer, or the Supabase credentials. They need a text editor and the template.

### 6.2 When the app is back — the Captain

1. Drop received files into `docs/fallback/inbox/`.
2. Run `npm run import-fallback -- docs/fallback/inbox/*.md`.
3. Read the summary. For any errored files, read the `.errors.log` next to each, fix the issue (typo, missing required field, malformed date), re-run.
4. Successfully imported files are renamed `*.imported.md` and stay in `inbox/`. Captain optionally moves them to an archive directory or deletes them.

Total Captain effort: ~1-2 minutes per file in the happy path; up to ~5 minutes per file if errors need investigation.

### 6.3 Friday 15 integration

The Friday 15 weekly review (Charter §14) includes a one-line check: "Any unprocessed files in `docs/fallback/inbox/`?" If yes, run the importer or chase the Captain to. This catches the "Captain forgot to import" failure mode.

## 7. Failure modes and recovery

| Failure                                                                                 | Detection                                                                      | Recovery                                                                                                        |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Contributor uses wrong date format                                                      | Importer rejects with `Invalid date in field 'session_date'`                   | Edit file, fix date, re-run                                                                                     |
| Contributor omits a required field                                                      | Importer rejects with `Required field missing: <field>`                        | Edit file, add field, re-run                                                                                    |
| Contributor uses an option value that doesn't exist (e.g. typo) and `allowAddNew: true` | Importer silently creates the option                                           | Captain reviews new options post-import; deletes typo'd ones via dashboard or a separate `option_lists` cleanup |
| Contributor uses a value where `allowAddNew: false`                                     | Importer rejects with `Unknown option ... category does not allow new options` | Edit file, use a valid value, re-run                                                                            |
| Body section has wrong header (e.g. "what worked" instead of "what worked?")            | Field defaults to empty; if required, validation rejects                       | Edit file, fix header, re-run                                                                                   |
| Frontmatter YAML is malformed                                                           | Importer reports YAML parse error with line number                             | Fix the YAML; re-run                                                                                            |
| Multiple files; some succeed, some fail                                                 | Summary at end of run lists failures separately                                | Re-run on failed files only                                                                                     |
| Supabase is still down when Captain tries to import                                     | Inserts fail; files stay unrenamed                                             | Re-run when Supabase is back. Files are unchanged so no data is lost.                                           |
| File is filled but Captain never receives it                                            | Not detected by the importer                                                   | Friday 15 review surfaces the contributor's missing entry; contributor re-sends                                 |
| Schema changed after template was written                                               | New required field missing on import                                           | Captain edits the old file to add the new field (with a reasonable default), re-runs                            |

The recurring property: **the original file is not modified or destroyed until the import succeeds.** Failures are recoverable. Data is not lost in any failure mode here.

## 8. What this does not handle (Phase 2+)

- **Photo and video attachments.** Phase 1 captures URLs only (and the live form's photo upload is itself Phase 2). The fallback templates have a `photo_url` field that takes a URL the contributor pastes if they have one — typically a Drive share link.
- **Tier 2 entries.** Decision Log, HW Change Log, etc., templates are not part of Phase 1 fallback. Phase 2 adds them when the live app gets Tier 2 capture forms. The pattern is the same: one template per type, same importer.
- **Subsystem Handoff.** Same as Tier 2 — Phase 4 work.
- **AI-driven deep-dive on Software Change Log.** Phase 2 feature. Fallback Software Change Log templates capture the baseline fields; the AI deep-dive happens when the live integration is back.
- **Flag-table row creation.** The importer writes `specialty_entries` into the entry's `extras` like the live form does. Phase 2's flag-tracking backfill picks these up the same way it picks up entries filed via the app.

## 9. Phase 1 deliverables for the fallback path

Captured in tasks T17–T18 in `00-plan.md` (revised next turn from the original T17–T19 Google Form tasks):

- **T17.** Templates committed in `docs/fallback/templates/` + a `docs/fallback/README.md` describing the workflow for non-developers + the `docs/fallback/inbox/` directory with `.gitkeep`.
- **T18.** Importer script in `scripts/fallback/import.ts` plus the composite-structure parsers in `scripts/fallback/parsers/`. The body-mapping export added to each of the three entry definition files. `package.json` gets an `import-fallback` script.

T19 from the original plan (full smoke test of Apps Script path) is dropped; the importer's smoke test is folded into T18: smoke test = "fill one of each template by hand, run the importer, confirm three rows appear in the database via `/list`."

Net change: 21 tasks → 20 tasks; total estimated time reduces by ~2-3 hours.
