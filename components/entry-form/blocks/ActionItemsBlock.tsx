'use client';

import { useState } from 'react';
import type { ActionItemsBlock as ActionItemsBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

type Row = { id: string; owner: string; action: string; due_date: string };

let nextRowId = 0;
function newRow(owner = '', action = '', due_date = ''): Row {
  nextRowId += 1;
  return { id: `ai-${nextRowId}`, owner, action, due_date };
}

export function ActionItemsBlock({
  block,
  defaultValue,
  error,
}: {
  block: ActionItemsBlockType;
  defaultValue?: { owner: string; action: string; due_date?: string }[];
  error?: string;
}) {
  const minItems = block.minItems ?? 0;
  const maxItems = block.maxItems ?? 50;

  const [rows, setRows] = useState<Row[]>(() =>
    defaultValue && defaultValue.length > 0
      ? defaultValue.map((d) => newRow(d.owner, d.action, d.due_date ?? ''))
      : minItems > 0
        ? Array.from({ length: minItems }, () => newRow())
        : [],
  );

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow() {
    if (rows.length >= maxItems) return;
    setRows((prev) => [...prev, newRow()]);
  }
  function removeRow(id: string) {
    if (rows.length <= minItems) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={row.id} className="grid grid-cols-[1fr_2fr_10rem_auto] items-start gap-2">
            <input
              type="text"
              name={`${block.name}__owner`}
              value={row.owner}
              onChange={(e) => updateRow(row.id, { owner: e.target.value })}
              placeholder="Owner"
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              type="text"
              name={`${block.name}__action`}
              value={row.action}
              onChange={(e) => updateRow(row.id, { action: e.target.value })}
              placeholder="Action"
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <input
              type="date"
              name={`${block.name}__due_date`}
              value={row.due_date}
              onChange={(e) => updateRow(row.id, { due_date: e.target.value })}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= minItems}
              aria-label={`Remove action item ${idx + 1}`}
              className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-xs hover:bg-accent disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= maxItems}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          + Add action item
        </button>
      </div>
    </BlockShell>
  );
}
