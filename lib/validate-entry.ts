/**
 * Build a Zod schema from an EntryDefinition + parse FormData into the shape
 * the schema expects. The same definition is the source of truth for both
 * (no duplication between schema and form).
 *
 * Spec: docs/phase1/03-forms.md §2.6 + per-block §§3–12.
 *
 * FormData wire format for composite blocks:
 *   - PersonAttribution: name__name (repeated) + name__contribution (repeated)
 *   - ActionItems:       name__owner (repeated) + name__action + name__due_date
 *   - Story:             name__person_name + name__person_role_age + name__what_happened
 *                        + name__direct_quote + name__permission + name__photo_url
 *   - SpecialtyTriggers: name__checked (one per checked target_type value) +
 *                        name__owner__<target_type> + name__subject__<target_type>
 *   - MultiSelect:       name (repeated UUIDs) + optional name__note
 *   - RepeatingRows:     name__<col> (repeated, one parallel array per column)
 *   - Alternatives:      name__label + name__pros + name__cons + name__predicted
 *                        (repeated, parallel arrays → {label, pros, cons, predicted})
 *   - RawDataTable:      name (JSON-encoded raw_rows) + name__columns (JSON
 *                        custom_columns, custom mode only) → parsed to a
 *                        { raw_rows, custom_columns } composite value
 *   - Matrix:            name (JSON-encoded MatrixInput) → parsed to a
 *                        { criteria, options, scores } composite value
 *   - Fmea:              name__failure_mode + name__effect + name__severity +
 *                        name__likelihood + name__detectability + name__mitigation
 *                        (repeated, parallel arrays → FmeaRow objects)
 */

import { z, type ZodTypeAny } from 'zod';
import type { EntryDefinition, FieldBlock } from '@/entries/_types';

// ---------- FormData parsing ----------------------------------------------

export type ParsedEntry = Record<string, unknown>;

function getAll(fd: FormData, key: string): string[] {
  return fd.getAll(key).map((v) => String(v));
}

function getOne(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  return v == null ? undefined : String(v);
}

export function parseFormDataWithDefinition(def: EntryDefinition, fd: FormData): ParsedEntry {
  const out: ParsedEntry = {};

  for (const field of def.fields) {
    switch (field.type) {
      case 'text':
      case 'long-text': {
        const v = getOne(fd, field.name);
        const trimmed = v == null ? undefined : v.trim();
        // Drop empty optional text so it inserts as NULL, not "". Required-but-empty
        // stays "" so the zod .min(1) check fires the "Required" error. This matters
        // for optional UUID-backed columns (e.g. robot_version_hw_id): Postgres
        // rejects "" for type uuid.
        out[field.name] = trimmed === '' && !field.required ? undefined : trimmed;
        break;
      }
      case 'date': {
        const v = getOne(fd, field.name);
        out[field.name] = v && v.length > 0 ? v : undefined;
        break;
      }
      case 'number': {
        const v = getOne(fd, field.name);
        if (v == null || v === '') {
          out[field.name] = undefined;
        } else {
          const n = Number(v);
          out[field.name] = Number.isNaN(n) ? undefined : n;
        }
        break;
      }
      case 'single-select':
      case 'choice': {
        const v = getOne(fd, field.name);
        out[field.name] = v && v.length > 0 ? v : undefined;
        break;
      }
      case 'multi-select': {
        const ids = getAll(fd, field.name).filter((v) => v.length > 0);
        if (field.withCustomNote) {
          const note = getOne(fd, `${field.name}__note`) ?? '';
          out[field.name] = { ids, note: note.trim() };
        } else {
          out[field.name] = ids;
        }
        break;
      }
      case 'person-attribution': {
        const names = getAll(fd, `${field.name}__name`);
        const contribs = getAll(fd, `${field.name}__contribution`);
        const rows = names
          .map((name, i) => ({ name: name.trim(), contribution: (contribs[i] ?? '').trim() }))
          .filter((r) => r.name.length > 0 || r.contribution.length > 0);
        out[field.name] = rows;
        break;
      }
      case 'action-items': {
        const owners = getAll(fd, `${field.name}__owner`);
        const actions = getAll(fd, `${field.name}__action`);
        const dueDates = getAll(fd, `${field.name}__due_date`);
        const rows = owners
          .map((owner, i) => ({
            owner: owner.trim(),
            action: (actions[i] ?? '').trim(),
            due_date: (dueDates[i] ?? '').trim() || undefined,
          }))
          .filter((r) => r.owner.length > 0 || r.action.length > 0);
        out[field.name] = rows;
        break;
      }
      case 'story-block': {
        const names = getAll(fd, `${field.name}__person_name`);
        const roleAges = getAll(fd, `${field.name}__person_role_age`);
        const happened = getAll(fd, `${field.name}__what_happened`);
        const quotes = getAll(fd, `${field.name}__direct_quote`);
        const perms = getAll(fd, `${field.name}__permission`);
        const photos = getAll(fd, `${field.name}__photo_url`);
        const rows = names.map((person_name, i) => ({
          person_name: person_name.trim(),
          person_role_age: (roleAges[i] ?? '').trim() || undefined,
          what_happened: (happened[i] ?? '').trim(),
          direct_quote: (quotes[i] ?? '').trim() || undefined,
          permission: (perms[i] ?? 'pending') as 'yes' | 'no' | 'pending',
          photo_url: (photos[i] ?? '').trim() || undefined,
        }));
        out[field.name] = rows;
        break;
      }
      case 'specialty-triggers': {
        const checked = new Set(getAll(fd, `${field.name}__checked`));
        const triggers: Array<{
          target_type: string;
          owner_text: string;
          subject: string;
        }> = [];
        for (const target of checked) {
          triggers.push({
            target_type: target,
            owner_text: (getOne(fd, `${field.name}__owner__${target}`) ?? '').trim(),
            subject: (getOne(fd, `${field.name}__subject__${target}`) ?? '').trim(),
          });
        }
        out[field.name] = triggers;
        break;
      }
      case 'repeating-rows': {
        const cols = field.columns;
        const colValues = cols.map((c) => getAll(fd, `${field.name}__${c.name}`));
        const rowCount = colValues.reduce((max, arr) => Math.max(max, arr.length), 0);
        const rows: Array<Record<string, string>> = [];
        for (let i = 0; i < rowCount; i++) {
          const row: Record<string, string> = {};
          let anyFilled = false;
          cols.forEach((c, ci) => {
            const v = (colValues[ci]?.[i] ?? '').trim();
            row[c.name] = v;
            if (v.length > 0) anyFilled = true;
          });
          if (anyFilled) rows.push(row);
        }
        out[field.name] = rows;
        break;
      }
      case 'alternatives': {
        const labels = getAll(fd, `${field.name}__label`);
        const pros = getAll(fd, `${field.name}__pros`);
        const cons = getAll(fd, `${field.name}__cons`);
        const predicted = getAll(fd, `${field.name}__predicted`);
        const rowCount = Math.max(labels.length, pros.length, cons.length, predicted.length);
        const rows: Array<{
          label: string;
          pros?: string;
          cons?: string;
          predicted?: string;
        }> = [];
        for (let i = 0; i < rowCount; i++) {
          const label = (labels[i] ?? '').trim();
          const p = (pros[i] ?? '').trim();
          const c = (cons[i] ?? '').trim();
          const pr = (predicted[i] ?? '').trim();
          if (label || p || c || pr) {
            rows.push({
              label,
              pros: p || undefined,
              cons: c || undefined,
              predicted: pr || undefined,
            });
          }
        }
        out[field.name] = rows;
        break;
      }
      case 'raw-data-table': {
        out[field.name] = {
          raw_rows: parseJsonArray(getOne(fd, field.name)),
          custom_columns:
            field.mode === 'custom' ? parseJsonArray(getOne(fd, `${field.name}__columns`)) : [],
        };
        break;
      }
      case 'matrix': {
        out[field.name] = parseMatrixInput(getOne(fd, field.name));
        break;
      }
      case 'fmea': {
        const failureModes = getAll(fd, `${field.name}__failure_mode`);
        const effects = getAll(fd, `${field.name}__effect`);
        const severities = getAll(fd, `${field.name}__severity`);
        const likelihoods = getAll(fd, `${field.name}__likelihood`);
        const detectabilities = getAll(fd, `${field.name}__detectability`);
        const mitigations = getAll(fd, `${field.name}__mitigation`);
        const rowCount = Math.max(
          failureModes.length,
          effects.length,
          severities.length,
          likelihoods.length,
          detectabilities.length,
          mitigations.length,
        );
        const rows: Array<{
          failure_mode: string;
          effect?: string;
          severity?: string;
          likelihood?: string;
          detectability?: string;
          mitigation?: string;
        }> = [];
        for (let i = 0; i < rowCount; i++) {
          const failure_mode = (failureModes[i] ?? '').trim();
          const effect = (effects[i] ?? '').trim();
          const severity = (severities[i] ?? '').trim();
          const likelihood = (likelihoods[i] ?? '').trim();
          const detectability = (detectabilities[i] ?? '').trim();
          const mitigation = (mitigations[i] ?? '').trim();
          if (failure_mode || effect || severity || likelihood || detectability || mitigation) {
            rows.push({
              failure_mode,
              effect: effect || undefined,
              severity: severity || undefined,
              likelihood: likelihood || undefined,
              detectability: detectability || undefined,
              mitigation: mitigation || undefined,
            });
          }
        }
        out[field.name] = rows;
        break;
      }
      case 'computed-readonly': {
        // Never submitted — statistics are recomputed server-side. Leave absent.
        break;
      }
      case 'checkbox': {
        // Present (any value) when checked, absent when not → a definite boolean.
        out[field.name] = getOne(fd, field.name) != null;
        break;
      }
      case 'section-header': {
        // Presentational only — holds no value, never submitted. Leave absent.
        break;
      }
      case 'media-links': {
        // Build rows for validation only (the real save reads FormData directly,
        // incl. File bytes, in lib/media/save-entry-media.ts). Parallel arrays,
        // one row per index; empty rows (no url and no file) are dropped.
        const urls = getAll(fd, `${field.name}__url`);
        const captions = getAll(fd, `${field.name}__caption`);
        const perms = getAll(fd, `${field.name}__permission_status`);
        const roles = getAll(fd, `${field.name}__role`);
        const fileParts = fd.getAll(`${field.name}__file`);
        const count = Math.max(
          urls.length,
          captions.length,
          perms.length,
          roles.length,
          fileParts.length,
        );
        const rows: Array<{
          url?: string;
          caption?: string;
          permission_status?: string;
          role?: string;
          has_file: boolean;
        }> = [];
        for (let i = 0; i < count; i++) {
          const url = (urls[i] ?? '').trim();
          const part = fileParts[i];
          const has_file = typeof part !== 'string' && part != null && (part as File).size > 0;
          if (!url && !has_file) continue;
          rows.push({
            url: url || undefined,
            caption: (captions[i] ?? '').trim() || undefined,
            permission_status: perms[i] || undefined,
            role: (roles[i] ?? '').trim() || undefined,
            has_file,
          });
        }
        out[field.name] = rows;
        break;
      }
    }
  }

  return out;
}

/** Parse a JSON array from a hidden-input string; returns [] on anything unexpected. */
function parseJsonArray(raw: string | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parse a MatrixInput ({ criteria, options, scores }) from a hidden-input
 * string; returns an empty matrix on anything unexpected so validation can
 * fail cleanly via the schema rather than throwing here.
 */
function parseMatrixInput(raw: string | undefined): {
  criteria: unknown[];
  options: unknown[];
  scores: Record<string, unknown>;
} {
  const empty = { criteria: [], options: [], scores: {} };
  if (!raw) return empty;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty;
    const o = parsed as Record<string, unknown>;
    return {
      criteria: Array.isArray(o.criteria) ? o.criteria : [],
      options: Array.isArray(o.options) ? o.options : [],
      scores:
        o.scores && typeof o.scores === 'object' && !Array.isArray(o.scores)
          ? (o.scores as Record<string, unknown>)
          : {},
    };
  } catch {
    return empty;
  }
}

// ---------- Zod schema construction ---------------------------------------

function maybeOptional<T extends ZodTypeAny>(schema: T, required?: boolean): ZodTypeAny {
  return required ? schema : schema.optional();
}

function schemaForBlock(block: FieldBlock): ZodTypeAny {
  switch (block.type) {
    case 'text':
    case 'long-text': {
      let s = z.string();
      if (block.required) s = s.min(1, 'Required');
      if (block.minLength != null) s = s.min(block.minLength, `Min ${block.minLength} characters`);
      if (block.maxLength != null) s = s.max(block.maxLength, `Max ${block.maxLength} characters`);
      return maybeOptional(s, block.required);
    }
    case 'date': {
      const s = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
      return maybeOptional(s, block.required);
    }
    case 'number': {
      let s = z.number();
      if (!block.decimals) s = s.int('Must be a whole number');
      if (block.min != null) s = s.min(block.min, `Min ${block.min}`);
      if (block.max != null) s = s.max(block.max, `Max ${block.max}`);
      return maybeOptional(s, block.required);
    }
    case 'single-select': {
      const s = z.string().uuid('Pick an option');
      return maybeOptional(s, block.required);
    }
    case 'choice': {
      const allowed = new Set(block.options.map((o) => o.value));
      const s = z.string().refine((v) => allowed.has(v), { message: 'Pick an option' });
      return maybeOptional(s, block.required);
    }
    case 'multi-select': {
      if (block.withCustomNote) {
        const baseShape = z.object({
          ids: z.array(z.string().uuid()).default([]),
          note: z.string().default(''),
        });
        if (block.minSelected != null) {
          // "at least N selected OR a non-empty note"
          return baseShape.refine(
            (v) => v.ids.length >= block.minSelected! || v.note.trim().length > 0,
            { message: `Select at least ${block.minSelected} OR add a note` },
          );
        }
        return block.required ? baseShape : baseShape.optional();
      }
      let s = z.array(z.string().uuid());
      if (block.minSelected != null)
        s = s.min(block.minSelected, `Pick at least ${block.minSelected}`);
      return maybeOptional(s, block.required);
    }
    case 'person-attribution': {
      const rowSchema = z.object({
        name: z.string().min(1, 'Name required'),
        contribution: z.string().min(1, 'Contribution required'),
      });
      let s = z.array(rowSchema);
      const min = block.minRows ?? 0;
      const max = block.maxRows ?? 50;
      if (min > 0) s = s.min(min, `At least ${min} required`);
      s = s.max(max, `At most ${max} allowed`);
      return s;
    }
    case 'action-items': {
      const rowSchema = z.object({
        owner: z.string().min(1, 'Owner required'),
        action: z.string().min(1, 'Action required'),
        due_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
          .optional(),
      });
      let s = z.array(rowSchema);
      const min = block.minItems ?? 0;
      const max = block.maxItems ?? 50;
      if (min > 0) s = s.min(min, `At least ${min} required`);
      s = s.max(max, `At most ${max} allowed`);
      return s;
    }
    case 'story-block': {
      const rowSchema = z.object({
        person_name: z.string().min(1, 'Person name required'),
        person_role_age: z.string().optional(),
        what_happened: z.string().min(1, 'What happened is required'),
        direct_quote: z.string().optional(),
        permission: z.enum(['yes', 'no', 'pending']),
        photo_url: z.string().url('Must be a URL').optional(),
      });
      let s = z.array(rowSchema);
      const min = block.minStories ?? 0;
      const max = block.maxStories ?? 10;
      if (min > 0) s = s.min(min, `At least ${min} stories required`);
      s = s.max(max, `At most ${max} stories allowed`);
      return s;
    }
    case 'specialty-triggers': {
      return z.array(
        z.object({
          target_type: z.enum([
            'decision_log',
            'hw_change_log',
            'sw_change_log',
            'test_log',
            'contact_log',
          ]),
          owner_text: z.string().min(1, 'Owner required when checked'),
          subject: z.string().min(1, 'Subject required when checked'),
        }),
      );
    }
    case 'repeating-rows': {
      const rowShape: Record<string, ZodTypeAny> = {};
      for (const col of block.columns) rowShape[col.name] = z.string().optional();
      let s = z.array(z.object(rowShape));
      const min = block.minRows ?? 0;
      const max = block.maxRows ?? 50;
      if (min > 0) s = s.min(min, `At least ${min} required`);
      s = s.max(max, `At most ${max} allowed`);
      return s;
    }
    case 'alternatives': {
      const rowSchema = z.object({
        label: z.string().min(1, 'Label required'),
        pros: z.string().optional(),
        cons: z.string().optional(),
        predicted: z.string().optional(),
      });
      let s = z.array(rowSchema);
      const min = block.minRows ?? 3;
      const max = block.maxRows ?? 10;
      if (min > 0) s = s.min(min, `At least ${min} alternatives required`);
      s = s.max(max, `At most ${max} alternatives allowed`);
      return s;
    }
    case 'raw-data-table': {
      const cell = z.union([z.string(), z.number(), z.boolean(), z.null()]).optional();
      const rowSchema = z.record(cell);
      const columnSchema = z.object({
        name: z.string().min(1),
        kind: z.enum(['number', 'text', 'pass_fail', 'category']),
        isCondition: z.boolean().optional(),
      });
      const composite = z.object({
        raw_rows: z
          .array(rowSchema)
          .max(block.maxRows ?? 500, `At most ${block.maxRows ?? 500} rows`),
        custom_columns: z.array(columnSchema).default([]),
      });
      if (block.required) {
        return composite.refine((v) => v.raw_rows.length > 0, { message: 'Add at least one row' });
      }
      return composite;
    }
    case 'matrix': {
      // Cells are forgiving (string|number|…) — the compute module coerces.
      const cell = z.union([z.string(), z.number(), z.boolean(), z.null()]).optional();
      const criterion = z.object({ name: z.string(), weight: cell });
      const composite = z.object({
        criteria: z
          .array(criterion)
          .max(block.maxCriteria ?? 20)
          .default([]),
        options: z
          .array(z.string())
          .max(block.maxOptions ?? 10)
          .default([]),
        scores: z.record(z.record(cell)).default({}),
      });
      if (block.required) {
        return composite.refine((v) => v.criteria.length > 0 && v.options.length > 0, {
          message: 'Add at least one criterion and one option',
        });
      }
      return composite;
    }
    case 'fmea': {
      // S/L/D cells are forgiving strings — `lib/compute/fmea.ts` coerces.
      const rowSchema = z.object({
        failure_mode: z.string().min(1, 'Failure mode required'),
        effect: z.string().optional(),
        severity: z.string().optional(),
        likelihood: z.string().optional(),
        detectability: z.string().optional(),
        mitigation: z.string().optional(),
      });
      let s = z.array(rowSchema);
      const min = block.minRows ?? 0;
      const max = block.maxRows ?? 30;
      if (block.required && min > 0) s = s.min(min, `At least ${min} required`);
      s = s.max(max, `At most ${max} allowed`);
      return s;
    }
    case 'computed-readonly': {
      // Excluded from the submit payload; accept absence so validation passes.
      return z.unknown().optional();
    }
    case 'checkbox': {
      // Always parsed to a definite boolean; `required` is a no-op here (use a
      // refine in a future consent-style field if "must be checked" is needed).
      return maybeOptional(z.boolean(), block.required);
    }
    case 'section-header': {
      // Presentational; excluded from the submit payload. Accept absence.
      return z.unknown().optional();
    }
    case 'media-links': {
      // Validated for shape only; the rows are written to the side `media_links`
      // table by the post-insert step, not stored on the entry. Each row carries
      // a url or an uploaded file (parse drops empty rows, guaranteeing one of
      // the two). File bytes never reach Zod — `has_file` flags their presence.
      const rowSchema = z.object({
        url: z.string().min(1).optional(),
        caption: z.string().optional(),
        permission_status: z.enum(['yes', 'no', 'pending', 'n_a']).optional(),
        role: z.string().optional(),
        has_file: z.boolean().optional(),
      });
      let s = z
        .array(rowSchema)
        .max(block.maxRows ?? 10, `At most ${block.maxRows ?? 10} media items`);
      if (block.required) s = s.min(1, 'Add at least one photo or video');
      return s;
    }
  }
}

export function buildZodSchemaFromDefinition(def: EntryDefinition) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const field of def.fields) {
    shape[field.name] = schemaForBlock(field);
  }
  return z.object(shape);
}

export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const rootField = String(issue.path[0] ?? '_form');
    if (!errors[rootField])
      errors[rootField] = issue.message + (path !== rootField ? ` (${path})` : '');
  }
  return errors;
}
