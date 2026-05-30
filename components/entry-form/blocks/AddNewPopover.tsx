'use client';

import { useState, useTransition } from 'react';
import { createOption } from '@/lib/option-list-actions';
import type { OptionCategory, OptionListRow } from '@/entries/_types';

/**
 * Inline "Add new option" form. Renders a small text input + Create button.
 * On submit, calls the createOption server action, then notifies the parent
 * via onCreated with the new (or pre-existing) option row.
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="bg-card mt-2 rounded-md border border-input p-3 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">New option label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
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
      </form>
    </div>
  );
}
