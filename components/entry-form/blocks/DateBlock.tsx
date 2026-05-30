import type { DateBlock as DateBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DateBlock({
  block,
  defaultValue,
  error,
}: {
  block: DateBlockType;
  defaultValue?: string;
  error?: string;
}) {
  const resolvedDefault =
    defaultValue ?? (block.defaultValue === 'today' ? isoToday() : (block.defaultValue ?? ''));
  const maxDate = block.maxDate ?? isoToday();

  return (
    <BlockShell block={block} error={error}>
      <input
        type="date"
        id={block.name}
        name={block.name}
        defaultValue={resolvedDefault}
        min={block.minDate}
        max={maxDate}
        required={block.required}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </BlockShell>
  );
}
