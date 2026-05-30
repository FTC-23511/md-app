'use client';

import { useState } from 'react';
import type { MultiSelectBlock as MultiSelectBlockType, OptionListRow } from '@/entries/_types';
import { BlockShell } from './BlockShell';
import { AddNewPopover } from './AddNewPopover';

export function MultiSelectBlock({
  block,
  options: initialOptions,
  defaultValueIds,
  defaultValueNote,
  error,
}: {
  block: MultiSelectBlockType;
  options: OptionListRow[];
  defaultValueIds?: string[];
  defaultValueNote?: string;
  error?: string;
}) {
  const [options, setOptions] = useState<OptionListRow[]>(initialOptions);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(defaultValueIds ?? []));
  const [isAdding, setIsAdding] = useState(false);
  const allowAddNew = block.allowAddNew !== false;

  function handleCreated(option: OptionListRow) {
    setOptions((prev) => {
      if (prev.find((o) => o.id === option.id)) return prev;
      return [...prev, option].sort(
        (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
      );
    });
    setSelectedIds((prev) => new Set(prev).add(option.id));
    setIsAdding(false);
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // The form posts each id as a `name`-repeated hidden input. The validator
  // splits by name. For `withCustomNote`, also include the note as
  // `<name>__note`.
  const idsFieldName = block.name;
  const noteFieldName = `${block.name}__note`;

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={idsFieldName}
              value={opt.id}
              checked={selectedIds.has(opt.id)}
              onChange={() => toggle(opt.id)}
              className="h-4 w-4"
            />
            <span>{opt.label}</span>
          </label>
        ))}
        {allowAddNew &&
          (isAdding ? (
            <AddNewPopover
              category={block.category}
              onCreated={handleCreated}
              onCancel={() => setIsAdding(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              + Add new…
            </button>
          ))}
      </div>
      {block.withCustomNote ? (
        <div className="mt-3 space-y-1">
          <label
            htmlFor={noteFieldName}
            className="block text-xs font-medium text-muted-foreground"
          >
            Custom note (optional)
          </label>
          <textarea
            id={noteFieldName}
            name={noteFieldName}
            defaultValue={defaultValueNote ?? ''}
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      ) : null}
    </BlockShell>
  );
}
