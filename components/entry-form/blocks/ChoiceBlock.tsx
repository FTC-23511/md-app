'use client';

import { useState } from 'react';
import type { ChoiceBlock as ChoiceBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

/**
 * Fixed-option single choice (radio or dropdown). Unlike SingleSelectBlock the
 * options are inline literals, not option_lists rows, and the submitted value
 * is the literal `value` string — so it drives `visibleWhen: {field, equals}`
 * and a raw-data-table's `modeField` directly. Uncontrolled-ish: local state
 * keeps the selection so the bubbled form onChange re-evaluates visibility.
 */
export function ChoiceBlock({
  block,
  defaultValue,
  error,
}: {
  block: ChoiceBlockType;
  /** Stored value when pre-filling (wins over the block's own defaultValue). */
  defaultValue?: string;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? block.defaultValue ?? '');
  const display = block.display ?? 'radio';

  if (display === 'dropdown') {
    return (
      <BlockShell block={block} error={error}>
        <select
          id={block.name}
          name={block.name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select an option…</option>
          {block.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </BlockShell>
    );
  }

  return (
    <BlockShell block={block} error={error}>
      <div className="flex flex-col gap-1.5">
        {block.options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={block.name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => setValue(e.target.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </BlockShell>
  );
}
