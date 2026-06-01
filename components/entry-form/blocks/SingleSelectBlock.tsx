'use client';

import { useEffect, useState } from 'react';
import type { SingleSelectBlock as SingleSelectBlockType, OptionListRow } from '@/entries/_types';
import { BlockShell } from './BlockShell';
import { AddNewPopover } from './AddNewPopover';

export function SingleSelectBlock({
  block,
  options: initialOptions,
  defaultValue,
  error,
}: {
  block: SingleSelectBlockType;
  options: OptionListRow[];
  defaultValue?: string;
  error?: string;
}) {
  const [options, setOptions] = useState<OptionListRow[]>(initialOptions);
  const [value, setValue] = useState<string>(defaultValue ?? '');
  const [isAdding, setIsAdding] = useState(false);
  const allowAddNew = block.allowAddNew !== false;

  // TEMP DIAGNOSTIC (remove before merge): only active with ?debug=1 in the URL.
  // Reveals whether the <select>'s onChange fires and whether React state holds,
  // to diagnose the "built-in option reverts to blank" report on the Vercel
  // preview that cannot be reproduced locally.
  const [debug, setDebug] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [lastRaw, setLastRaw] = useState<string>('—');
  // Random per-mount id: if it changes between clicks, the component remounted.
  const [mountId] = useState(() => Math.random().toString(36).slice(2, 6));
  useEffect(() => {
    setHydrated(true);
    if (typeof window !== 'undefined') {
      setDebug(new URLSearchParams(window.location.search).has('debug'));
    }
  }, []);

  function handleCreated(option: OptionListRow) {
    setOptions((prev) => {
      // Replace if same id already present (collision), else append.
      const existing = prev.findIndex((o) => o.id === option.id);
      if (existing >= 0) return prev;
      return [...prev, option].sort(
        (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
      );
    });
    setValue(option.id);
    setIsAdding(false);
  }

  if (block.display === 'radio') {
    return (
      <BlockShell block={block} error={error}>
        <div className="space-y-1.5">
          {options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={block.name}
                value={opt.id}
                checked={value === opt.id}
                onChange={() => setValue(opt.id)}
                required={block.required}
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
      </BlockShell>
    );
  }

  // Default: dropdown
  return (
    <BlockShell block={block} error={error}>
      <select
        id={block.name}
        name={block.name}
        value={value}
        onChange={(e) => {
          setChangeCount((c) => c + 1);
          setLastRaw(e.target.value === '' ? '(blank!)' : e.target.value.slice(0, 8));
          setValue(e.target.value);
        }}
        required={block.required}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="" disabled>
          Select an option…
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      {debug ? (
        <p className="mt-1 rounded bg-yellow-100 px-2 py-1 font-mono text-xs text-yellow-900">
          🔧 mount:{mountId} · hydrated:{hydrated ? 'yes' : 'no'} · changes:{changeCount} · raw:
          {lastRaw} · value:{value ? value.slice(0, 8) : '(empty)'}
          <br />
          opts:{options.length} · o1id:{options[1]?.id ? options[1].id.slice(0, 8) : 'NONE'} ·
          o1len:
          {options[1]?.id?.length ?? 0} · db:
          {(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace('https://', '').slice(0, 6)}
        </p>
      ) : null}
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
            className="mt-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            + Add new…
          </button>
        ))}
    </BlockShell>
  );
}
