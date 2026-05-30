'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { EntryDefinition, FieldBlock, OptionCategory, OptionListRow } from '@/entries/_types';
import { FieldRenderer } from './FieldRenderer';
import { isVisible } from './visibility';

export type InsertEntryAction = (
  formData: FormData,
) => Promise<
  { ok: true; id: string } | { ok: false; fieldErrors?: Record<string, string>; formError?: string }
>;

/**
 * Generic definition-driven form renderer.
 *
 * Walks definition.fields, rendering each block via FieldRenderer. Watches
 * form values to evaluate visibleWhen conditions (re-renders on change so
 * conditional fields show/hide).
 *
 * On submit:
 *   - Hidden fields are excluded by re-reading FormData and filtering.
 *   - Posts to the server `action` (which validates with the entry's Zod
 *     schema and inserts).
 *   - Field errors are returned and rendered inline; form errors as a banner.
 *   - On success, navigates to /entries/list.
 */
export function EntryForm({
  definition,
  optionsByCategory,
  action,
}: {
  definition: EntryDefinition;
  optionsByCategory: Partial<Record<OptionCategory, OptionListRow[]>>;
  action: InsertEntryAction;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshValues = useCallback(() => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const next: Record<string, unknown> = {};
    for (const [key, v] of fd.entries()) {
      // For radios/single-selects the last write wins (FormData supports multiple values
      // under the same name; for single-select we expect only one).
      next[key] = v;
    }
    setValues(next);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    // Strip hidden fields from the submission per spec §2.4.
    for (const field of definition.fields) {
      if (!isVisible(field.visibleWhen, values, optionsByCategory)) {
        // Remove every entry under this field's name (and its composite children).
        for (const key of Array.from(fd.keys())) {
          if (key === field.name || key.startsWith(`${field.name}__`)) {
            fd.delete(key);
          }
        }
      }
    }
    startTransition(async () => {
      const result = await action(fd);
      if (result.ok) {
        // The /entries/list route lands in item 16 of the rev2 brief; until
        // typed routes pick it up, cast through `as never` to satisfy
        // experimental typedRoutes. Swap to a typed import after item 16.
        router.push('/entries/list' as never);
        return;
      }
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result.formError) setFormError(result.formError);
    });
  }

  function shouldRender(block: FieldBlock): boolean {
    return isVisible(block.visibleWhen, values, optionsByCategory);
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={refreshValues}
      onInput={refreshValues}
      className="mx-auto max-w-2xl space-y-5 px-6 py-8"
      noValidate
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{definition.label}</h1>
        {definition.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{definition.description}</p>
        ) : null}
      </header>

      {formError ? (
        <div className="rounded-md border border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      {definition.fields.map((block) =>
        shouldRender(block) ? (
          <FieldRenderer
            key={block.name}
            block={block}
            optionsByCategory={optionsByCategory}
            error={fieldErrors[block.name]}
          />
        ) : null,
      )}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </form>
  );
}
