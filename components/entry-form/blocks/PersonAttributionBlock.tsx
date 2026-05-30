'use client';

import { useState } from 'react';
import type { PersonAttributionBlock as PersonAttributionBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

type Row = { id: string; name: string; contribution: string };

let nextRowId = 0;
function newRow(name = '', contribution = ''): Row {
  nextRowId += 1;
  return { id: `row-${nextRowId}`, name, contribution };
}

export function PersonAttributionBlock({
  block,
  defaultValue,
  error,
}: {
  block: PersonAttributionBlockType;
  defaultValue?: { name: string; contribution: string }[];
  error?: string;
}) {
  const contributionLabel = block.contributionLabel ?? 'Contribution';
  const minRows = block.minRows ?? 0;
  const maxRows = block.maxRows ?? 50;

  const [rows, setRows] = useState<Row[]>(() =>
    defaultValue && defaultValue.length > 0
      ? defaultValue.map((d) => newRow(d.name, d.contribution))
      : minRows > 0
        ? Array.from({ length: minRows }, () => newRow())
        : [newRow()],
  );

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow() {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, newRow()]);
  }
  function removeRow(id: string) {
    if (rows.length <= minRows) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={row.id} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
            <input
              type="text"
              name={`${block.name}__name`}
              value={row.name}
              onChange={(e) => updateRow(row.id, { name: e.target.value })}
              placeholder="Name"
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              type="text"
              name={`${block.name}__contribution`}
              value={row.contribution}
              onChange={(e) => updateRow(row.id, { contribution: e.target.value })}
              placeholder={contributionLabel}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
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
          + Add another person
        </button>
      </div>
    </BlockShell>
  );
}
