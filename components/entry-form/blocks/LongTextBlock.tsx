import type { LongTextBlock as LongTextBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

export function LongTextBlock({
  block,
  defaultValue,
  error,
}: {
  block: LongTextBlockType;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <BlockShell block={block} error={error}>
      <textarea
        id={block.name}
        name={block.name}
        defaultValue={defaultValue ?? ''}
        placeholder={block.placeholder}
        minLength={block.minLength}
        maxLength={block.maxLength}
        required={block.required}
        rows={block.rows ?? 4}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </BlockShell>
  );
}
