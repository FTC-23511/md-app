import type { TextBlock as TextBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

export function TextBlock({
  block,
  defaultValue,
  error,
}: {
  block: TextBlockType;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <BlockShell block={block} error={error}>
      <input
        type="text"
        id={block.name}
        name={block.name}
        defaultValue={defaultValue ?? ''}
        placeholder={block.placeholder}
        minLength={block.minLength}
        maxLength={block.maxLength}
        required={block.required}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </BlockShell>
  );
}
