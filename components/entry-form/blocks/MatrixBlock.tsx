'use client';

import { useState } from 'react';
import type { MatrixBlock as MatrixBlockType } from '@/entries/_types';
import type { MatrixInput } from '@/lib/compute/decision-matrix';
import { BlockShell } from './BlockShell';

/** A criterion row. `id` is stable; `name`/`weight` are edited. */
type Criterion = { id: string; name: string; weight: string };
/** An option column. `id` is stable; `name` is edited. */
type OptionCol = { id: string; name: string };

let uid = 0;
const nextId = (p: string) => `${p}-${(uid += 1)}`;
const newCriterion = (): Criterion => ({ id: nextId('mx-c'), name: '', weight: '' });
const newOption = (): OptionCol => ({ id: nextId('mx-o'), name: '' });

/** Key into the scores map; stable across renames since it uses ids, not names. */
const cellKey = (critId: string, optId: string) => `${critId}__${optId}`;

const inputCls =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

/**
 * Weighted trade-off matrix block. An editable grid of criteria (rows, each
 * with a weight) × options (columns), with a 1–5 score per cell. Serializes to
 * a single hidden input (`${name}`) holding the {@link MatrixInput} wire format
 * the validate-entry parser reads and `lib/compute/decision-matrix.ts` consumes.
 * Scores are keyed internally by stable ids so renaming a criterion/option
 * never orphans an entered score; only named rows/columns reach the payload.
 * The weighted totals + winner are not shown here — they compute on save and
 * render on the detail page via a paired `computed-readonly` block.
 */
export function MatrixBlock({ block, error }: { block: MatrixBlockType; error?: string }) {
  const minCriteria = block.minCriteria ?? 2;
  const minOptions = block.minOptions ?? 2;
  const maxCriteria = block.maxCriteria ?? 20;
  const maxOptions = block.maxOptions ?? 10;

  const [criteria, setCriteria] = useState<Criterion[]>(() =>
    Array.from({ length: Math.max(minCriteria, 1) }, () => newCriterion()),
  );
  const [options, setOptions] = useState<OptionCol[]>(() =>
    Array.from({ length: Math.max(minOptions, 1) }, () => newOption()),
  );
  // scores[`${critId}__${optId}`] = '1'..'5' (string; blank → 0 on compute).
  const [scores, setScores] = useState<Record<string, string>>({});

  function updateCriterion(id: string, patch: Partial<Criterion>) {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function addCriterion() {
    setCriteria((prev) => (prev.length >= maxCriteria ? prev : [...prev, newCriterion()]));
  }
  function removeCriterion(id: string) {
    setCriteria((prev) => (prev.length <= minCriteria ? prev : prev.filter((c) => c.id !== id)));
  }

  function updateOption(id: string, name: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, name } : o)));
  }
  function addOption() {
    setOptions((prev) => (prev.length >= maxOptions ? prev : [...prev, newOption()]));
  }
  function removeOption(id: string) {
    setOptions((prev) => (prev.length <= minOptions ? prev : prev.filter((o) => o.id !== id)));
  }

  function setScore(critId: string, optId: string, value: string) {
    setScores((prev) => ({ ...prev, [cellKey(critId, optId)]: value }));
  }

  // Only named rows/columns contribute to the payload (mirrors raw-data-table).
  const namedCriteria = criteria.filter((c) => c.name.trim().length > 0);
  const namedOptions = options.filter((o) => o.name.trim().length > 0);

  const matrixInput: MatrixInput = {
    criteria: namedCriteria.map((c) => ({ name: c.name.trim(), weight: c.weight.trim() })),
    options: namedOptions.map((o) => o.name.trim()),
    scores: Object.fromEntries(
      namedOptions.map((o) => [
        o.name.trim(),
        Object.fromEntries(
          namedCriteria.map((c) => [c.name.trim(), scores[cellKey(c.id, o.id)] ?? '']),
        ),
      ]),
    ),
  };

  // grid: criterion name | weight | one score cell per option | remove
  const gridTemplate = `minmax(8rem,1.4fr) 5rem repeat(${options.length}, minmax(5rem,1fr)) auto`;

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-3">
        <div className="overflow-x-auto">
          <div className="min-w-fit space-y-2">
            {/* Header: option column names (editable) */}
            <div
              className="grid items-center gap-2 text-xs font-medium text-muted-foreground"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <span>Criterion</span>
              <span>Weight</span>
              {options.map((o, i) => (
                <div key={o.id} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={o.name}
                    onChange={(e) => updateOption(o.id, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(o.id)}
                    disabled={options.length <= minOptions}
                    aria-label={`Remove option ${i + 1}`}
                    className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-xs hover:bg-accent disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <span aria-hidden />
            </div>

            {/* One row per criterion */}
            {criteria.map((c, ci) => (
              <div
                key={c.id}
                className="grid items-center gap-2"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => updateCriterion(c.id, { name: e.target.value })}
                  placeholder={`Criterion ${ci + 1}`}
                  className={inputCls}
                />
                <input
                  type="number"
                  step="any"
                  min={0}
                  value={c.weight}
                  onChange={(e) => updateCriterion(c.id, { weight: e.target.value })}
                  placeholder="0.0"
                  className={inputCls}
                />
                {options.map((o) => (
                  <input
                    key={o.id}
                    type="number"
                    min={1}
                    max={5}
                    step={1}
                    value={scores[cellKey(c.id, o.id)] ?? ''}
                    onChange={(e) => setScore(c.id, o.id, e.target.value)}
                    placeholder="1–5"
                    className={inputCls}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => removeCriterion(c.id)}
                  disabled={criteria.length <= minCriteria}
                  aria-label={`Remove criterion ${ci + 1}`}
                  className="inline-flex h-9 items-center rounded-md border border-input bg-background px-2 text-xs hover:bg-accent disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={addCriterion}
            disabled={criteria.length >= maxCriteria}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            + Add criterion
          </button>
          <button
            type="button"
            onClick={addOption}
            disabled={options.length >= maxOptions}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
          >
            + Add option
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Score each option 1–5 per criterion. Weights need not sum to 1.0 — they&apos;re normalized
          automatically. Weighted totals and the winner compute on save and appear on the detail
          page.
        </p>

        {/* Serialized payload — what the validate-entry parser reads. */}
        <input type="hidden" name={block.name} value={JSON.stringify(matrixInput)} />
      </div>
    </BlockShell>
  );
}
