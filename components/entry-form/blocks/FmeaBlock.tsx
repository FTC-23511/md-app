'use client';

import { useState } from 'react';
import type { FmeaBlock as FmeaBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

type FmeaRowDraft = {
  id: string;
  failure_mode: string;
  effect: string;
  severity: string;
  likelihood: string;
  detectability: string;
  mitigation: string;
};

let nextRowId = 0;
function newRow(partial?: Partial<FmeaRowDraft>): FmeaRowDraft {
  nextRowId += 1;
  return {
    id: `fmea-${nextRowId}`,
    failure_mode: '',
    effect: '',
    severity: '',
    likelihood: '',
    detectability: '',
    mitigation: '',
    ...partial,
  };
}

const inputCls =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

// failure mode | effect | S | L | D | mitigation | remove
const gridTemplate = 'minmax(9rem,1.4fr) minmax(8rem,1.2fr) 4rem 4rem 4rem minmax(8rem,1.2fr) auto';

/**
 * FMEA table block: repeating rows of
 * `{failure_mode, effect, severity, likelihood, detectability, mitigation}`
 * with S/L/D scored 1–10. Values are collected on submit as parallel arrays
 * (`name__failure_mode`, `name__severity`, …) — the same wire pattern as
 * `alternatives` / `repeating-rows`. The per-row RPN (= S×L×D) is never typed;
 * it computes on save via `lib/compute/fmea.ts` and renders on the detail page
 * through a paired `computed-readonly` block.
 */
export function FmeaBlock({
  block,
  defaultValue,
  error,
}: {
  block: FmeaBlockType;
  defaultValue?: Array<Partial<Omit<FmeaRowDraft, 'id'>>>;
  error?: string;
}) {
  const minRows = block.minRows ?? 1;
  const maxRows = block.maxRows ?? 30;

  const [rows, setRows] = useState<FmeaRowDraft[]>(() =>
    defaultValue && defaultValue.length > 0
      ? defaultValue.map((d) => newRow(d))
      : Array.from({ length: Math.max(minRows, 1) }, () => newRow()),
  );

  function update(id: string, patch: Partial<FmeaRowDraft>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function add() {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, newRow()]);
  }
  function remove(id: string) {
    if (rows.length <= minRows) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-3">
        <div className="overflow-x-auto">
          <div className="min-w-fit space-y-2">
            <div
              className="grid items-center gap-2 text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <span>Failure mode</span>
              <span>Effect</span>
              <span>S (1–10)</span>
              <span>L (1–10)</span>
              <span>D (1–10)</span>
              <span>Mitigation</span>
              <span aria-hidden />
            </div>

            {rows.map((r, idx) => (
              <div
                key={r.id}
                className="grid items-center gap-2"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <input
                  type="text"
                  name={`${block.name}__failure_mode`}
                  value={r.failure_mode}
                  onChange={(e) => update(r.id, { failure_mode: e.target.value })}
                  placeholder={`Failure mode ${idx + 1}`}
                  className={inputCls}
                />
                <input
                  type="text"
                  name={`${block.name}__effect`}
                  value={r.effect}
                  onChange={(e) => update(r.id, { effect: e.target.value })}
                  placeholder="Effect"
                  className={inputCls}
                />
                <input
                  type="number"
                  name={`${block.name}__severity`}
                  min={1}
                  max={10}
                  step={1}
                  value={r.severity}
                  onChange={(e) => update(r.id, { severity: e.target.value })}
                  placeholder="S"
                  className={inputCls}
                />
                <input
                  type="number"
                  name={`${block.name}__likelihood`}
                  min={1}
                  max={10}
                  step={1}
                  value={r.likelihood}
                  onChange={(e) => update(r.id, { likelihood: e.target.value })}
                  placeholder="L"
                  className={inputCls}
                />
                <input
                  type="number"
                  name={`${block.name}__detectability`}
                  min={1}
                  max={10}
                  step={1}
                  value={r.detectability}
                  onChange={(e) => update(r.id, { detectability: e.target.value })}
                  placeholder="D"
                  className={inputCls}
                />
                <input
                  type="text"
                  name={`${block.name}__mitigation`}
                  value={r.mitigation}
                  onChange={(e) => update(r.id, { mitigation: e.target.value })}
                  placeholder="Mitigation"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={rows.length <= minRows}
                  aria-label={`Remove failure mode ${idx + 1}`}
                  className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-xs hover:bg-accent disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={add}
          disabled={rows.length >= maxRows}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          + Add failure mode
        </button>

        <p className="text-xs text-muted-foreground">
          Score severity, likelihood, and detectability 1–10. RPN (= S×L×D) computes on save and
          appears on the detail page.
        </p>
      </div>
    </BlockShell>
  );
}
