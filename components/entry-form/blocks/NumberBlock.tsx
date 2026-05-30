import type { NumberBlock as NumberBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

export function NumberBlock({
  block,
  defaultValue,
  error,
}: {
  block: NumberBlockType;
  defaultValue?: number | string;
  error?: string;
}) {
  const step = block.step ?? (block.decimals ? 0.01 : 1);
  return (
    <BlockShell block={block} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          id={block.name}
          name={block.name}
          defaultValue={defaultValue ?? ''}
          min={block.min}
          max={block.max}
          step={step}
          required={block.required}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {block.unit ? <span className="text-sm text-muted-foreground">{block.unit}</span> : null}
      </div>
    </BlockShell>
  );
}
