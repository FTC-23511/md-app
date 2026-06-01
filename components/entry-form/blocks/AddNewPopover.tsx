'use client';

import { useState, useTransition } from 'react';
import { createOption } from '@/lib/option-list-actions';
import type { OptionCategory, OptionListRow } from '@/entries/_types';

/**
 * Inline "Add new option" control. Renders a small text input + Create button.
 * On create, calls the createOption server action, then notifies the parent
 * via onCreated with the new (or pre-existing) option row.
 *
 * IMPORTANT: this is rendered *inside* the entry's <form> (see EntryForm.tsx).
 * Nested <form> elements are invalid HTML and submit unreliably across
 * browsers — which broke the "Add new…" flow on the multi-select fields
 * (engagement depth, subsystems). So we deliberately do NOT use a <form> here;
 * creation is driven by the button's onClick plus an Enter keydown handler.
 */
export function AddNewPopover({
  category,
  onCreated,
  onCancel,
}: {
  category: OptionCategory;
  onCreated: (option: OptionListRow) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (isPending || label.trim().length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await createOption(category, label);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated(result.option);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      // Stop the keypress from bubbling up and submitting the parent entry form.
      e.preventDefault();
      e.stopPropagation();
      submit();
    }
  }

  return (
    <div className="bg-card mt-2 space-y-2 rounded-md border border-input p-3 shadow-sm">
      <label className="block text-xs font-medium text-muted-foreground">New option label</label>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || label.trim().length === 0}
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
