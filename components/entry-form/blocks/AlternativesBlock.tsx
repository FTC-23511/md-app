'use client';

import { useState } from 'react';
import type { AlternativesBlock as AlternativesBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

type Alternative = {
  id: string;
  label: string;
  pros: string;
  cons: string;
  predicted: string;
};

let nextAltId = 0;
function newAlternative(partial?: Partial<Alternative>): Alternative {
  nextAltId += 1;
  return {
    id: `alt-${nextAltId}`,
    label: '',
    pros: '',
    cons: '',
    predicted: '',
    ...partial,
  };
}

/**
 * Repeating set of decision alternatives ({label, pros, cons, predicted}).
 * Dynamic-row card pattern shared with StoryBlock; values are collected from
 * the named inputs on submit as parallel arrays (`name__label`, `name__pros`,
 * …). At least `minRows` (default 3) cards are shown so the filer is nudged
 * toward a real trade-off (SOP-05).
 */
export function AlternativesBlock({
  block,
  defaultValue,
  error,
}: {
  block: AlternativesBlockType;
  defaultValue?: Array<Partial<Omit<Alternative, 'id'>>>;
  error?: string;
}) {
  const minRows = block.minRows ?? 3;
  const maxRows = block.maxRows ?? 10;

  const [alts, setAlts] = useState<Alternative[]>(() =>
    defaultValue && defaultValue.length > 0
      ? defaultValue.map((d) => newAlternative(d))
      : Array.from({ length: Math.max(minRows, 1) }, () => newAlternative()),
  );

  function update(id: string, patch: Partial<Alternative>) {
    setAlts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }
  function add() {
    if (alts.length >= maxRows) return;
    setAlts((prev) => [...prev, newAlternative()]);
  }
  function remove(id: string) {
    if (alts.length <= minRows) return;
    setAlts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-4">
        {alts.map((a, idx) => (
          <div key={a.id} className="rounded-md border border-input bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Alternative {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(a.id)}
                disabled={alts.length <= minRows}
                className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              name={`${block.name}__label`}
              value={a.label}
              onChange={(e) => update(a.id, { label: e.target.value })}
              placeholder="Option (e.g. Belt drive)"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <textarea
                name={`${block.name}__pros`}
                value={a.pros}
                onChange={(e) => update(a.id, { pros: e.target.value })}
                placeholder="Pros"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <textarea
                name={`${block.name}__cons`}
                value={a.cons}
                onChange={(e) => update(a.id, { cons: e.target.value })}
                placeholder="Cons"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <input
              type="text"
              name={`${block.name}__predicted`}
              value={a.predicted}
              onChange={(e) => update(a.id, { predicted: e.target.value })}
              placeholder="Predicted outcome (optional)"
              className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          disabled={alts.length >= maxRows}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          + Add another alternative
        </button>
      </div>
    </BlockShell>
  );
}
