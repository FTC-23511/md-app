'use client';

import type { ComputedReadonlyBlock as ComputedReadonlyBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

/**
 * Form-side rendering of a {@link ComputedReadonlyBlockType}. The block holds
 * no input — statistics are computed server-side on save (`lib/compute/`) and
 * shown on the detail page. On a fresh entry there is nothing to display, so we
 * render a short explanatory placeholder. No hidden input: the field is
 * excluded from the submit payload by design (validate-entry drops it).
 */
export function ComputedReadonlyBlock({
  block,
  error,
}: {
  block: ComputedReadonlyBlockType;
  error?: string;
}) {
  return (
    <BlockShell block={block} error={error}>
      <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
        Statistics are computed automatically from your data when you save. They appear on the
        entry&apos;s detail page.
      </p>
    </BlockShell>
  );
}
