'use client';

import { useState } from 'react';
import type {
  ColumnKind,
  CustomColumn,
  RawDataTableBlock as RawDataTableBlockType,
  RawDataTableMode,
} from '@/entries/_types';
import { BlockShell } from './BlockShell';

/** A column as rendered in the grid. `id` is stable; `name` may be edited (custom mode). */
type GridColumn = { id: string; name: string; label: string; kind: ColumnKind };

/** Editable column definition for custom mode. */
type CustomColState = { id: string; name: string; kind: ColumnKind; isCondition: boolean };

/** One grid row. Values are keyed by column `id` so renaming a column never orphans data. */
type Row = { id: string; values: Record<string, string> };

const KIND_OPTIONS: ColumnKind[] = ['number', 'text', 'pass_fail', 'category'];

const FIXED_COLUMNS: Record<'pass_fail' | 'single_measure', GridColumn[]> = {
  pass_fail: [
    { id: 'success', name: 'success', label: 'Result (pass / fail)', kind: 'pass_fail' },
    { id: 'note', name: 'note', label: 'Note (optional)', kind: 'text' },
  ],
  single_measure: [{ id: 'value', name: 'value', label: 'Value', kind: 'number' }],
};

let uid = 0;
const nextId = (p: string) => `${p}-${(uid += 1)}`;
const newRow = (values: Record<string, string> = {}): Row => ({ id: nextId('rdt-r'), values });
const newCol = (): CustomColState => ({
  id: nextId('rdt-c'),
  name: '',
  kind: 'number',
  isCondition: false,
});

/** Split pasted text into trimmed rows of cells, detecting tab vs comma delimiter. */
function parsePaste(text: string, columns: GridColumn[]): Row[] {
  const delim = text.includes('\t') ? '\t' : ',';
  return text
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cells = line.split(delim).map((c) => c.trim());
      const values: Record<string, string> = {};
      columns.forEach((col, i) => {
        values[col.id] = cells[i] ?? '';
      });
      return newRow(values);
    });
}

/**
 * Paste-friendly raw-data-table block. Renders an editable grid plus a paste
 * box; serializes the result to two hidden inputs the validate-entry parser
 * reads: `${name}` (JSON `raw_rows`) and, in custom mode, `${name}__columns`
 * (JSON `custom_columns`). See docs/phase2/03-test-log.md §2.
 */
export function RawDataTableBlock({
  block,
  error,
  mode: modeOverride,
}: {
  block: RawDataTableBlockType;
  error?: string;
  /** Runtime mode from a `modeField` sibling; falls back to block.mode. */
  mode?: RawDataTableMode;
}) {
  const mode = modeOverride ?? block.mode;
  const isCustom = mode === 'custom';
  const maxRows = block.maxRows ?? 500;

  const [customCols, setCustomCols] = useState<CustomColState[]>(() =>
    isCustom ? [newCol(), newCol()] : [],
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [paste, setPaste] = useState('');

  const gridColumns: GridColumn[] =
    mode === 'custom'
      ? customCols.map((c) => ({ id: c.id, name: c.name, label: c.name, kind: c.kind }))
      : FIXED_COLUMNS[mode];

  // Only columns with a usable name contribute to the serialized payload.
  const namedColumns = isCustom ? gridColumns.filter((c) => c.name.trim().length > 0) : gridColumns;

  const rawRows = rows
    .map((row) => {
      const out: Record<string, string> = {};
      for (const col of namedColumns) out[col.name.trim()] = (row.values[col.id] ?? '').trim();
      return out;
    })
    .filter((o) => Object.values(o).some((v) => v.length > 0));

  const customColumns: CustomColumn[] = isCustom
    ? customCols
        .filter((c) => c.name.trim().length > 0)
        .map((c) => ({
          name: c.name.trim(),
          kind: c.kind,
          ...(c.kind === 'category' && c.isCondition ? { isCondition: true } : {}),
        }))
    : [];

  function updateCell(rowId: string, colId: string, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, values: { ...r.values, [colId]: value } } : r)),
    );
  }
  function addRow() {
    setRows((prev) => (prev.length >= maxRows ? prev : [...prev, newRow()]));
  }
  function removeRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }
  function applyPaste() {
    if (paste.trim().length === 0) return;
    setRows(parsePaste(paste, gridColumns).slice(0, maxRows));
    setPaste('');
  }

  function updateColumn(colId: string, patch: Partial<CustomColState>) {
    setCustomCols((prev) => prev.map((c) => (c.id === colId ? { ...c, ...patch } : c)));
  }
  function addColumn() {
    setCustomCols((prev) => [...prev, newCol()]);
  }
  function removeColumn(colId: string) {
    setCustomCols((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== colId)));
  }

  const cellGrid = `repeat(${gridColumns.length}, minmax(6rem, 1fr)) auto`;

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-3">
        {isCustom ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Define your columns</p>
            {customCols.map((col) => (
              <div key={col.id} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={col.name}
                  onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                  placeholder="Column name"
                  className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <select
                  value={col.kind}
                  onChange={(e) => updateColumn(col.id, { kind: e.target.value as ColumnKind })}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {KIND_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                {col.kind === 'category' ? (
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={col.isCondition}
                      onChange={(e) => updateColumn(col.id, { isCondition: e.target.checked })}
                    />
                    condition (group by)
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeColumn(col.id)}
                  disabled={customCols.length <= 1}
                  aria-label="Remove column"
                  className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-xs hover:bg-accent disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addColumn}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              + Add column
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={3}
            placeholder="Paste rows here (tab- or comma-separated, one trial per line)…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={applyPaste}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-xs hover:bg-accent"
          >
            Fill grid from paste
          </button>
        </div>

        {rows.length > 0 ? (
          <div className="space-y-2">
            <div
              className="grid items-center gap-2 text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: cellGrid }}
            >
              {gridColumns.map((col) => (
                <span key={col.id}>{col.name.trim() || col.label}</span>
              ))}
              <span aria-hidden />
            </div>
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="grid items-start gap-2"
                style={{ gridTemplateColumns: cellGrid }}
              >
                {gridColumns.map((col) => (
                  <input
                    key={col.id}
                    type={col.kind === 'number' ? 'number' : 'text'}
                    value={row.values[col.id] ?? ''}
                    onChange={(e) => updateCell(row.id, col.id, e.target.value)}
                    placeholder={col.kind === 'pass_fail' ? 'pass / fail' : ''}
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label={`Remove row ${idx + 1}`}
                  className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-xs hover:bg-accent"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= maxRows}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          + Add row
        </button>

        {/* Serialized payload — what the validate-entry parser reads. */}
        <input type="hidden" name={block.name} value={JSON.stringify(rawRows)} />
        {isCustom ? (
          <input
            type="hidden"
            name={`${block.name}__columns`}
            value={JSON.stringify(customColumns)}
          />
        ) : null}
      </div>
    </BlockShell>
  );
}
