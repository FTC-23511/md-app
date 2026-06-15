#!/usr/bin/env tsx
/**
 * Fallback importer — ingests filled-out markdown templates from
 * docs/fallback/inbox/ into the Supabase database.
 *
 * Usage: pnpm run import-fallback -- <glob-or-path> [...]
 * Example: pnpm run import-fallback -- docs/fallback/inbox/*.md
 *
 * Spec: docs/phase1/05-fallback.md §5
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { parse as parseYaml } from 'yaml';
import { glob } from 'glob';

// Relative imports — tsx resolves these correctly from the project root
import { ENTRY_REGISTRY } from '../../entries/_registry';
import { sessionLogBodyMapping } from '../../entries/session-log';
import { outreachLogBodyMapping } from '../../entries/outreach-log';
import { meetingNotesBodyMapping } from '../../entries/meeting-notes';
import { testLogBodyMapping } from '../../entries/test-log';
import { softwareChangeLogBodyMapping } from '../../entries/software-change-log';
import { buildZodSchemaFromDefinition, flattenZodErrors } from '../../lib/validate-entry';
import {
  computeTestLogExtras,
  writeTestSeriesRow,
  type TestType,
} from '../../lib/test-log-finalize';
import type { CustomRow, PassFailRow, SingleMeasureRow } from '../../lib/compute/test-stats';
import type { FieldBlock } from '../../entries/_types';

import { parsePersonAttribution } from './parsers/person-attribution';
import { parseActionItems } from './parsers/action-items';
import { parseSpecialtyTriggers } from './parsers/specialty-triggers';
import { parseStories } from './parsers/stories';
import { parseMultiSelectWithNote } from './parsers/multi-select-with-note';
import { parseRawDataTable, parseCustomColumns, type RawDataTable } from './parsers/raw-data-table';
import { parseRepeatingRows } from './parsers/repeating-rows';

// ---------------------------------------------------------------------------
// Body mapping registry
// ---------------------------------------------------------------------------

const BODY_MAPPINGS: Record<string, Record<string, string>> = {
  session_log: sessionLogBodyMapping,
  outreach_log: outreachLogBodyMapping,
  meeting_notes: meetingNotesBodyMapping,
  test_log: testLogBodyMapping,
  sw_change_log: softwareChangeLogBodyMapping,
};

// ---------------------------------------------------------------------------
// Env loading
// Reads .env.local from the project root (script is run from project root via
// pnpm). Only sets keys that aren't already in process.env so real env vars
// take priority.
// ---------------------------------------------------------------------------

function loadEnvFile(envPath: string): void {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

// ---------------------------------------------------------------------------
// Slugify — inline copy to avoid importing lib/option-list-helpers.ts, which
// pulls in Next.js server modules that don't run outside the app context.
// ---------------------------------------------------------------------------

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// ---------------------------------------------------------------------------
// Frontmatter + body splitting
// ---------------------------------------------------------------------------

function parseFrontmatterAndBody(raw: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const lines = raw.split('\n');
  if (lines[0]?.trim() !== '---') {
    return { frontmatter: {}, body: raw.trim() };
  }
  const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (endIdx === -1) {
    return { frontmatter: {}, body: raw.trim() };
  }
  const fmText = lines.slice(1, endIdx).join('\n');
  const body = lines
    .slice(endIdx + 1)
    .join('\n')
    .trim();
  const frontmatter = (parseYaml(fmText) ?? {}) as Record<string, unknown>;
  return { frontmatter, body };
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Splits body on "## Header" boundaries; returns a map of normalised header → content.
function parseBodySections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  // split() with a capturing group interleaves [pre, header, content, header, content, ...]
  const parts = body.split(/^## (.+)$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const header = normalizeHeader(parts[i] ?? '');
    const content = (parts[i + 1] ?? '').trim();
    sections[header] = content;
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Option resolution
// Tries exact value match → label match → create new (if allowAddNew).
// ---------------------------------------------------------------------------

async function resolveOption(
  category: string,
  text: string,
  allowAddNew: boolean,
  supabase: SupabaseClient,
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Try slug/value match first (covers frontmatter like "event_type: public-showcase")
  const { data: byValue } = await supabase
    .from('option_lists')
    .select('id')
    .eq('category', category)
    .eq('value', trimmed)
    .is('deleted_at', null)
    .maybeSingle();
  if (byValue) return (byValue as { id: string }).id;

  // Try label match (covers body-section checkboxes with human-readable labels)
  const { data: byLabel } = await supabase
    .from('option_lists')
    .select('id')
    .eq('category', category)
    .eq('label', trimmed)
    .is('deleted_at', null)
    .maybeSingle();
  if (byLabel) return (byLabel as { id: string }).id;

  if (!allowAddNew) return null;

  // Create new option — mirrors lib/option-list-actions.ts createOption logic
  const value = slugify(trimmed);
  if (!value) return null;

  // Check for existing row with the derived slug (avoids unique-constraint error)
  const { data: bySlug } = await supabase
    .from('option_lists')
    .select('id')
    .eq('category', category)
    .eq('value', value)
    .is('deleted_at', null)
    .maybeSingle();
  if (bySlug) return (bySlug as { id: string }).id;

  const { data: maxRow } = await supabase
    .from('option_lists')
    .select('sort_order')
    .eq('category', category)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = ((maxRow as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  const { data: created, error: createError } = await supabase
    .from('option_lists')
    .insert({ category, value, label: trimmed, sort_order: nextSortOrder, is_seed: false })
    .select('id')
    .single();

  if (createError) {
    console.warn(
      `  Warning: could not create option '${trimmed}' in '${category}': ${createError.message}`,
    );
    return null;
  }

  console.log(`  Created new option: category='${category}' value='${value}'`);
  return (created as { id: string }).id;
}

// ---------------------------------------------------------------------------
// Field value extraction helpers
// ---------------------------------------------------------------------------

// Single-select fields have an _option_id suffix in the definition; the
// template frontmatter uses the base name (e.g. "event_type" not "event_type_option_id").
function getFrontmatterKey(field: FieldBlock): string {
  if (field.type === 'single-select' && field.name.endsWith('_option_id')) {
    return field.name.slice(0, -'_option_id'.length);
  }
  return field.name;
}

async function parseFrontmatterValue(
  field: FieldBlock,
  rawValue: unknown,
  supabase: SupabaseClient,
  errors: string[],
): Promise<unknown> {
  if (rawValue === undefined || rawValue === null || rawValue === '') return undefined;

  switch (field.type) {
    case 'text':
    case 'long-text':
      return String(rawValue).trim() || undefined;

    case 'date': {
      const s = String(rawValue).trim();
      // Skip unfilled template placeholder values like "2026-MM-DD"
      if (/MM|DD|YYYY/.test(s)) return undefined;
      return s;
    }

    case 'number': {
      const n = Number(rawValue);
      return Number.isNaN(n) ? undefined : n;
    }

    case 'choice': {
      // Literal-string option (e.g. test_type). Zod refine validates membership.
      const v = String(rawValue).trim();
      return v || undefined;
    }

    case 'single-select': {
      const id = await resolveOption(
        field.category,
        String(rawValue).trim(),
        field.allowAddNew !== false,
        supabase,
      );
      if (!id && field.required) {
        errors.push(
          `${field.name}: could not resolve option '${rawValue}' in category '${field.category}'`,
        );
      }
      return id ?? undefined;
    }

    case 'multi-select': {
      const values = Array.isArray(rawValue)
        ? rawValue.map((v) => String(v).trim()).filter(Boolean)
        : [String(rawValue).trim()].filter(Boolean);
      const ids: string[] = [];
      for (const v of values) {
        const id = await resolveOption(field.category, v, field.allowAddNew !== false, supabase);
        if (id) {
          ids.push(id);
        } else if (field.allowAddNew === false) {
          errors.push(
            `${field.name}: unknown option '${v}' in '${field.category}' (allowAddNew=false)`,
          );
        }
      }
      return field.withCustomNote ? { ids, note: '' } : ids;
    }

    default:
      return undefined;
  }
}

async function parseBodyValue(
  field: FieldBlock,
  sectionText: string,
  supabase: SupabaseClient,
  errors: string[],
  frontmatter: Record<string, unknown>,
): Promise<unknown> {
  // raw-data-table can legitimately need parsing even from an empty section
  // (an empty table → empty rows, which the schema rejects with a clear error).
  if (!sectionText.trim() && field.type !== 'raw-data-table') return undefined;

  switch (field.type) {
    case 'long-text':
      return sectionText.trim() || undefined;

    case 'raw-data-table': {
      const modeRaw = String(frontmatter['test_type'] ?? field.mode ?? 'pass_fail').trim();
      const mode = (
        ['pass_fail', 'single_measure', 'custom'].includes(modeRaw) ? modeRaw : 'pass_fail'
      ) as 'pass_fail' | 'single_measure' | 'custom';
      const customColumns = parseCustomColumns(frontmatter['custom_columns']);
      return parseRawDataTable(sectionText, mode, customColumns);
    }

    case 'person-attribution':
      return parsePersonAttribution(sectionText);

    case 'action-items':
      return parseActionItems(sectionText);

    case 'specialty-triggers':
      return parseSpecialtyTriggers(sectionText);

    case 'story-block':
      return parseStories(sectionText);

    case 'repeating-rows':
      return parseRepeatingRows(sectionText, field.columns);

    case 'multi-select': {
      if (field.withCustomNote) {
        const { checkedLabels, note } = parseMultiSelectWithNote(sectionText);
        const ids: string[] = [];
        for (const label of checkedLabels) {
          const id = await resolveOption(
            field.category,
            label,
            field.allowAddNew !== false,
            supabase,
          );
          if (id) {
            ids.push(id);
          } else if (field.allowAddNew === false) {
            errors.push(
              `${field.name}: unknown option '${label}' in '${field.category}' (allowAddNew=false)`,
            );
          }
        }
        return { ids, note };
      }
      // Plain multi-select in body (checked-checkbox list without note)
      const ids: string[] = [];
      for (const line of sectionText.split('\n')) {
        const match = line.trim().match(/^-\s+\[x\]\s+(.+)/i);
        if (!match) continue;
        const label = (match[1] ?? '').trim();
        const id = await resolveOption(
          field.category,
          label,
          field.allowAddNew !== false,
          supabase,
        );
        if (id) ids.push(id);
      }
      return ids;
    }

    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Per-file processing
// ---------------------------------------------------------------------------

type FileResult = { ok: true; id: string } | { ok: false; errors: string[] };

async function processFile(filePath: string, supabase: SupabaseClient): Promise<FileResult> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatterAndBody(raw);

  const entryType = String(frontmatter['type'] ?? '').trim();
  if (!entryType) return { ok: false, errors: ['Missing required frontmatter field: type'] };

  const definition = ENTRY_REGISTRY[entryType];
  if (!definition) return { ok: false, errors: [`Unknown entry type: '${entryType}'`] };

  const bodyMapping = BODY_MAPPINGS[entryType] ?? {};
  // Invert: field name → normalised body section header
  const fieldToHeader: Record<string, string> = {};
  for (const [header, fieldName] of Object.entries(bodyMapping)) {
    fieldToHeader[fieldName] = normalizeHeader(header);
  }

  const bodySections = parseBodySections(body);
  const data: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const field of definition.fields) {
    const bodyHeader = fieldToHeader[field.name];
    if (bodyHeader !== undefined) {
      // Field comes from a body section
      const sectionText = bodySections[bodyHeader] ?? '';
      data[field.name] = await parseBodyValue(field, sectionText, supabase, errors, frontmatter);
    } else {
      // Field comes from frontmatter
      const fmKey = getFrontmatterKey(field);
      data[field.name] = await parseFrontmatterValue(field, frontmatter[fmKey], supabase, errors);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  // Validate with the same Zod schema the live form uses
  const schema = buildZodSchemaFromDefinition(definition);
  const result = schema.safeParse(data);
  if (!result.success) {
    const flat = flattenZodErrors(result.error);
    return { ok: false, errors: Object.entries(flat).map(([k, v]) => `${k}: ${v}`) };
  }

  // Split validated data into typed column fields vs extras JSONB
  const columns: Record<string, unknown> = {};
  const extras: Record<string, unknown> = {};
  for (const field of definition.fields) {
    const val = (result.data as Record<string, unknown>)[field.name];
    if (val === undefined) continue;
    if (field.storage === 'column') columns[field.name] = val;
    else extras[field.name] = val;
  }

  // Test Log: auto-compute stats + headline via the SAME shared module the app
  // submit path uses (lib/test-log-finalize.ts), so fallback-created Test Logs
  // get identical extras.computed / extras.headline and a matching test_series
  // rollup row. Done here (post-validate, pre-insert) so the computed object is
  // persisted in the same insert.
  let testHeadline: { label: string; stat: number } | null = null;
  if (entryType === 'test_log') {
    const table = (extras.test_data as RawDataTable | undefined) ?? {
      raw_rows: [],
      custom_columns: [],
    };
    const finalized = await computeTestLogExtras(supabase, {
      testType: String(columns.test_type ?? 'pass_fail') as TestType,
      rawRows: table.raw_rows as unknown as PassFailRow[] | SingleMeasureRow[] | CustomRow[],
      customColumns: table.custom_columns,
      testLabel: String(columns.test_label ?? ''),
    });
    extras.computed = finalized.computed;
    if (finalized.headline) {
      extras.headline = finalized.headline;
      testHeadline = finalized.headline;
    }
  }

  const row = {
    ...columns,
    extras,
    created_by: null,
    created_via: 'fallback_form',
    entry_state: definition.defaultEntryState ?? 'complete',
  };

  const { data: inserted, error: insertError } = await supabase
    .from(definition.table)
    .insert(row)
    .select('id')
    .single();

  if (insertError) return { ok: false, errors: [`Database insert failed: ${insertError.message}`] };

  const insertedId = (inserted as { id: string }).id;

  // Test Log: best-effort test_series rollup row (mirrors the app submit path).
  if (entryType === 'test_log' && testHeadline) {
    await writeTestSeriesRow(supabase, {
      testLabel: String(columns.test_label ?? ''),
      testLogId: insertedId,
      testDate: (columns.test_date as string | undefined) ?? null,
      headline: testHeadline,
    });
  }

  return { ok: true, id: insertedId };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  loadEnvFile(path.resolve('.env.local'));

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    console.error('Ensure .env.local is present in the project root.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const patterns = process.argv.slice(2);
  if (patterns.length === 0) {
    console.error('Usage: pnpm run import-fallback -- <glob-or-path> [...]');
    process.exit(1);
  }

  const matched: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern);
    matched.push(...matches);
  }

  // Deduplicate and skip files this importer has already processed. A glob like
  // `*.md` still matches the `*.imported.md` files we rename on success, so
  // without this guard a second run would re-insert every already-imported
  // file. Skipping them by name is what makes re-runs idempotent. We also skip
  // the `*.errors.log` siblings if a broad glob happens to catch them.
  const seen = new Set<string>();
  const files = matched.filter((f) => {
    if (seen.has(f)) return false;
    seen.add(f);
    return !/\.imported\.md$/i.test(f) && !/\.errors\.log$/i.test(f);
  });
  const skipped = matched.length - files.length;

  if (files.length === 0) {
    console.log(
      skipped > 0
        ? `No new files to process (${skipped} already-imported file(s) skipped).`
        : 'No files matched the given patterns.',
    );
    process.exit(0);
  }

  console.log(
    `Processing ${files.length} file(s)${skipped > 0 ? ` (${skipped} already-imported skipped)` : ''}...\n`,
  );

  let successCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    console.log(`Processing: ${filePath}`);
    const result = await processFile(filePath, supabase);

    if (result.ok) {
      const importedPath = filePath.replace(/\.md$/, '.imported.md');
      fs.renameSync(filePath, importedPath);
      console.log(`  [ok] Inserted id=${result.id} -> ${path.basename(importedPath)}`);
      successCount++;
    } else {
      const errorLogPath = filePath + '.errors.log';
      fs.writeFileSync(errorLogPath, result.errors.join('\n') + '\n');
      console.log(`  [fail] Errors written to ${path.basename(errorLogPath)}`);
      for (const e of result.errors) {
        console.log(`    - ${e}`);
      }
      errorCount++;
    }
  }

  console.log(`\nDone. ${successCount} succeeded, ${errorCount} failed.`);
  if (errorCount > 0) process.exit(1);
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
