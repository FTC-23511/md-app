/**
 * Shared layout shell for every field block — label, helper, input slot, error.
 * Each block component renders its input via children.
 */

import type { BlockBase } from '@/entries/_types';

export function BlockShell({
  block,
  error,
  children,
}: {
  block: BlockBase;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={block.name} className="block text-sm font-medium">
        {block.label}
        {block.required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {block.helper ? <p className="text-xs text-muted-foreground">{block.helper}</p> : null}
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
