'use client';

import { useState } from 'react';
import type { RepeatingRowsBlock as RepeatingRowsBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

type Row = { id: string; values: Record<string, string> };

let nextRowId = 0;
function newRow(values: Record<string, string> = {}): Row {
  nextRowId += 1;
  return { id: `rr-${nextRowId}`, values };
}

/**
 * Generic repeating-row table. Renders one input per declared column per row,
 * wired as `${block.name}__${column.name}` (parallel arrays, mirroring the
 * ActionItems wire convention). Uncontrolled-style local state; values are
 * collected from the named inputs on submit.
 */
export function RepeatingRowsBlock({
  block,
  defaultValue,
  error,
}: {
  block: RepeatingRowsBlockType;
  defaultValue?: Array<Record<string, string>>;
  error?: string;
}) {
  const minRows = block.minRows ?? 0;
  const maxRows = block.maxRows ?? 50;

  const [rows, setRows] = useState<Row[]>(() =>
    defaultValue && defaultValue.length > 0
      ? defaultValue.map((v) => newRow({ ...v }))
      : minRows > 0
        ? Array.from({ length: minRows }, () => newRow())
        : [],
  );

  function updateCell(id: string, col: string, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, values: { ...r.values, [col]: value } } : r)),
    );
  }
  function addRow() {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, newRow()]);
  }
  function removeRow(id: string) {
    if (rows.length <= minRows) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const gridTemplate = `repeat(${block.columns.length}, 1fr) auto`;

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-2">
        {block.columns.length > 1 && rows.length > 0 ? (
          <div
            className="grid items-center gap-2 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {block.columns.map((col) => (
              <span key={col.name}>{col.label}</span>
            ))}
            <span aria-hidden />
          </div>
        ) : null}
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="grid items-start gap-2"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {block.columns.map((col) => (
              <input
                key={col.name}
                type={col.kind === 'number' ? 'number' : 'text'}
                name={`${block.name}__${col.name}`}
                value={row.values[col.name] ?? ''}
                onChange={(e) => updateCell(row.id, col.name, e.target.value)}
                placeholder={col.label}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            ))}
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= minRows}
              aria-label={`Remove row ${idx + 1}`}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-xs hover:bg-accent disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= maxRows}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          + {block.addLabel ?? 'Add row'}
        </button>
      </div>
    </BlockShell>
  );
}
