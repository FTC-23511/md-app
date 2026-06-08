import type { SectionHeaderBlock as SectionHeaderBlockType } from '@/entries/_types';

/**
 * Presentational section divider. Holds no input and is excluded from the
 * submit payload (validate-entry skips it). Visibility is handled by the form
 * renderer's `visibleWhen` check, so a header paired with a `checkbox` trigger
 * appears/disappears with its section.
 */
export function SectionHeaderBlock({ block }: { block: SectionHeaderBlockType }) {
  return (
    <div className="border-t border-border pt-4">
      <h2 className="text-base font-semibold">{block.label}</h2>
      {block.helper ? <p className="mt-0.5 text-sm text-muted-foreground">{block.helper}</p> : null}
    </div>
  );
}
