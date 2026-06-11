import type { FieldBlock, RawDataTableMode, RawDataTableValue } from '@/entries/_types';
import type { ComputedStats } from '@/lib/compute/test-stats';
import type { MatrixInput, MatrixStats } from '@/lib/compute/decision-matrix';
import { readFieldValue, type EntryDetail } from '@/lib/entry-detail';
import { ComputedStatsView } from './ComputedStatsView';
import { MatrixStatsView } from './MatrixStatsView';

/** A field whose stored value is empty / absent — rendered as a muted dash. */
function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

const PERMISSION_LABEL: Record<string, string> = {
  yes: 'Permission: yes',
  no: 'Permission: no',
  pending: 'Permission: pending',
};

const TARGET_TYPE_LABEL: Record<string, string> = {
  decision_log: 'Decision Log',
  hw_change_log: 'Hardware Change Log',
  sw_change_log: 'Software Change Log',
  test_log: 'Test Log',
  contact_log: 'Contact Log',
};

function FieldValue({
  block,
  value,
  optionLabels,
  rawMode,
}: {
  block: FieldBlock;
  value: unknown;
  optionLabels: Record<string, string>;
  /** Resolved mode for a `modeField`-driven raw-data-table (from the row). */
  rawMode?: RawDataTableMode;
}) {
  if (isEmpty(value)) return <Dash />;

  switch (block.type) {
    case 'text':
    case 'date':
      return <span>{String(value)}</span>;

    case 'choice': {
      const opt = block.options.find((o) => o.value === String(value));
      return <span>{opt ? opt.label : String(value)}</span>;
    }

    case 'long-text':
      return <p className="whitespace-pre-wrap">{String(value)}</p>;

    case 'number': {
      const unit = 'unit' in block && block.unit ? ` ${block.unit}` : '';
      return (
        <span>
          {String(value)}
          {unit}
        </span>
      );
    }

    case 'single-select': {
      const id = String(value);
      return <span>{optionLabels[id] ?? id}</span>;
    }

    case 'multi-select': {
      const withNote = value && typeof value === 'object' && !Array.isArray(value);
      const ids = (
        withNote ? ((value as { ids?: unknown[] }).ids ?? []) : (value as unknown[])
      ) as unknown[];
      const note = withNote ? String((value as { note?: unknown }).note ?? '') : '';
      const labels = ids
        .filter((id): id is string => typeof id === 'string')
        .map((id) => optionLabels[id] ?? id);
      return (
        <div className="flex flex-col gap-1">
          {labels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label, i) => (
                <span
                  key={i}
                  className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          {note.trim().length > 0 ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        </div>
      );
    }

    case 'person-attribution': {
      const rows = value as Array<{ name?: string; contribution?: string }>;
      return (
        <ul className="flex flex-col gap-1">
          {rows.map((r, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{r.name}</span>
              {r.contribution ? (
                <span className="text-muted-foreground"> — {r.contribution}</span>
              ) : null}
            </li>
          ))}
        </ul>
      );
    }

    case 'action-items': {
      const rows = value as Array<{ owner?: string; action?: string; due_date?: string }>;
      return (
        <ul className="flex flex-col gap-1">
          {rows.map((r, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{r.owner}</span>
              {r.action ? <span> — {r.action}</span> : null}
              {r.due_date ? (
                <span className="text-muted-foreground"> (due {r.due_date})</span>
              ) : null}
            </li>
          ))}
        </ul>
      );
    }

    case 'story-block': {
      const rows = value as Array<{
        person_name?: string;
        person_role_age?: string;
        what_happened?: string;
        direct_quote?: string;
        permission?: string;
        photo_url?: string;
      }>;
      return (
        <ul className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <li key={i} className="rounded-md border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{r.person_name}</span>
                {r.person_role_age ? (
                  <span className="text-xs text-muted-foreground">{r.person_role_age}</span>
                ) : null}
                {r.permission ? (
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {PERMISSION_LABEL[r.permission] ?? r.permission}
                  </span>
                ) : null}
              </div>
              {r.what_happened ? (
                <p className="mt-1 whitespace-pre-wrap">{r.what_happened}</p>
              ) : null}
              {r.direct_quote ? (
                <p className="mt-1 border-l-2 border-border pl-2 italic text-muted-foreground">
                  “{r.direct_quote}”
                </p>
              ) : null}
              {r.photo_url ? (
                <a
                  href={r.photo_url}
                  className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Photo
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      );
    }

    case 'specialty-triggers': {
      const rows = value as Array<{ target_type?: string; owner_text?: string; subject?: string }>;
      return (
        <ul className="flex flex-col gap-1">
          {rows.map((r, i) => (
            <li key={i} className="text-sm">
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {TARGET_TYPE_LABEL[r.target_type ?? ''] ?? r.target_type}
              </span>
              {r.subject ? <span className="ml-2">{r.subject}</span> : null}
              {r.owner_text ? (
                <span className="text-muted-foreground"> — owner: {r.owner_text}</span>
              ) : null}
            </li>
          ))}
        </ul>
      );
    }

    case 'repeating-rows': {
      const rows = value as Array<Record<string, string>>;
      const columns = block.columns;
      const soleColumn = columns.length === 1 ? columns[0] : undefined;
      if (soleColumn) {
        return (
          <ul className="flex flex-col gap-1">
            {rows.map((r, i) => (
              <li key={i} className="text-sm">
                {r[soleColumn.name]}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {columns.map((col) => (
                  <th key={col.name} className="py-1 pr-4 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  {columns.map((col) => (
                    <td key={col.name} className="py-1 pr-4 align-top">
                      {r[col.name] ? r[col.name] : <Dash />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'alternatives': {
      const rows = value as Array<{
        label?: string;
        pros?: string;
        cons?: string;
        predicted?: string;
      }>;
      return (
        <ul className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <li key={i} className="rounded-md border border-border p-3 text-sm">
              <span className="font-medium">{r.label}</span>
              <div className="mt-1 grid gap-1">
                {r.pros ? (
                  <p className="whitespace-pre-wrap">
                    <span className="text-muted-foreground">Pros: </span>
                    {r.pros}
                  </p>
                ) : null}
                {r.cons ? (
                  <p className="whitespace-pre-wrap">
                    <span className="text-muted-foreground">Cons: </span>
                    {r.cons}
                  </p>
                ) : null}
                {r.predicted ? (
                  <p className="whitespace-pre-wrap">
                    <span className="text-muted-foreground">Predicted: </span>
                    {r.predicted}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    case 'matrix': {
      const v = (value ?? {}) as Partial<MatrixInput>;
      const criteria = v.criteria ?? [];
      const options = v.options ?? [];
      const scores = v.scores ?? {};
      if (criteria.length === 0 || options.length === 0) return <Dash />;
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-1 pr-4 font-medium">Criterion</th>
                <th className="py-1 pr-4 font-medium">Weight</th>
                {options.map((o) => (
                  <th key={o} className="py-1 pr-4 font-medium">
                    {o}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((c, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1 pr-4 align-top">{c.name}</td>
                  <td className="py-1 pr-4 align-top tabular-nums">
                    {c.weight === '' || c.weight == null ? <Dash /> : String(c.weight)}
                  </td>
                  {options.map((o) => {
                    const cell = scores[o]?.[c.name];
                    return (
                      <td key={o} className="py-1 pr-4 align-top tabular-nums">
                        {cell === '' || cell == null ? <Dash /> : String(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'raw-data-table': {
      const v = (value ?? {}) as Partial<RawDataTableValue>;
      const rows = v.raw_rows ?? [];
      if (rows.length === 0) return <Dash />;
      const mode = rawMode ?? block.mode;
      let columns: Array<{ key: string; label: string }>;
      if (mode === 'pass_fail') {
        columns = [
          { key: 'success', label: 'Pass / fail' },
          { key: 'note', label: 'Note' },
        ];
      } else if (mode === 'single_measure') {
        columns = [{ key: 'value', label: 'Value' }];
      } else {
        const names = (v.custom_columns ?? []).map((c) => c.name);
        const keys =
          names.length > 0 ? names : Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
        columns = keys.map((k) => ({ key: k, label: k }));
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {columns.map((col) => (
                  <th key={col.key} className="py-1 pr-4 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  {columns.map((col) => (
                    <td key={col.key} className="py-1 pr-4 align-top">
                      {r[col.key] ? r[col.key] : <Dash />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'computed-readonly':
      return block.shape === 'decision-matrix' ? (
        <MatrixStatsView stats={value as MatrixStats} />
      ) : (
        <ComputedStatsView stats={value as ComputedStats} />
      );

    case 'checkbox':
      return <span>{value === true ? 'Yes' : 'No'}</span>;

    case 'section-header':
      // Rendered as a divider heading in the map below, not as a field row.
      return null;
  }
}

export function EntryDetailView({ detail }: { detail: EntryDetail }) {
  const { definition, row, optionLabels, flags } = detail;
  const createdAt = row.created_at ? String(row.created_at).slice(0, 10) : '';

  return (
    <article className="mt-6 flex flex-col gap-6">
      {definition.fields.map((block) => {
        // Section headers are dividers, not labelled value rows.
        if (block.type === 'section-header') {
          return (
            <section key={block.name} className="grid gap-0.5 border-t border-border pt-4">
              <h2 className="text-base font-semibold">{block.label}</h2>
              {block.helper ? (
                <p className="text-sm text-muted-foreground">{block.helper}</p>
              ) : null}
            </section>
          );
        }
        const value = readFieldValue(block, row);
        const rawMode =
          block.type === 'raw-data-table' && block.modeField
            ? (row[block.modeField] as RawDataTableMode | undefined)
            : undefined;
        return (
          <section key={block.name} className="grid gap-1">
            <h2 className="text-sm font-medium text-muted-foreground">{block.label}</h2>
            <div className="text-sm">
              <FieldValue
                block={block}
                value={value}
                optionLabels={optionLabels}
                rawMode={rawMode}
              />
            </div>
          </section>
        );
      })}

      {flags.length > 0 ? (
        <section className="grid gap-2 border-t border-border pt-4">
          <h2 className="text-sm font-medium">Flags raised from this entry</h2>
          <ul className="flex flex-col gap-1">
            {flags.map((f) => (
              <li key={f.id} className="text-sm">
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {TARGET_TYPE_LABEL[f.target_entry_type] ?? f.target_entry_type}
                </span>
                <span className="ml-2">{f.subject}</span>
                <span className="text-muted-foreground"> ({f.status})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {createdAt ? (
        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          Filed {createdAt}
        </footer>
      ) : null}
    </article>
  );
}
