'use client';

import type { CheckboxBlock as CheckboxBlockType } from '@/entries/_types';

/**
 * Single boolean checkbox. Uncontrolled (native `defaultChecked`) so it keeps
 * its state across the parent's visibility re-renders without local state — the
 * bubbling `change` event drives EntryForm's `refreshValues`, which re-reads
 * FormData so any `visibleWhen: {field, truthy: true}` section toggles in step.
 *
 * Submits `value="true"` only when checked; absence (unchecked) parses to
 * `false` in validate-entry. Rendered inline (box beside label) rather than via
 * BlockShell, whose label sits above the input.
 */
export function CheckboxBlock({ block, error }: { block: CheckboxBlockType; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={block.name} className="flex items-start gap-2 text-sm font-medium">
        <input
          type="checkbox"
          id={block.name}
          name={block.name}
          value="true"
          defaultChecked={block.defaultChecked ?? false}
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <span>
          {block.label}
          {block.required ? <span className="ml-1 text-destructive">*</span> : null}
        </span>
      </label>
      {block.helper ? <p className="pl-6 text-xs text-muted-foreground">{block.helper}</p> : null}
      {error ? <p className="pl-6 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
