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
  defaultValues,
  submitLabel,
  successPath,
  editReasonRequired,
}: {
  definition: EntryDefinition;
  optionsByCategory: Partial<Record<OptionCategory, OptionListRow[]>>;
  action: InsertEntryAction;
  /**
   * Stored values keyed by field name, for the pre-filled edit flows (2E
   * "Complete this entry" / "Add outcome"). Also seeds the visibility values
   * so sections whose stored trigger is checked start revealed.
   */
  defaultValues?: Record<string, unknown>;
  /** Submit button label. Default: 'Save entry'. */
  submitLabel?: string;
  /** Where to navigate on success. Default: '/entries/list'. */
  successPath?: string;
  /**
   * Phase 3 (3C): when a Captain/Deputy is editing an entry older than 24h,
   * an edit_reason is required and recorded to the audit trail. Shows a
   * required textarea (name="edit_reason") submitted with the form.
   */
  editReasonRequired?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<string, unknown>>(() => defaultValues ?? {});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Re-read all form values so visibleWhen conditions re-evaluate. Driven by the
  // form's bubbling `onChange` ONLY.
  //
  // Do NOT also wire this to `onInput`. The `input` event fires *before* `change`
  // on a <select>/radio, and the select's `value` is owned by SingleSelectBlock's
  // local state. Refreshing on `input` re-renders the form while that child state
  // is still the previous value, so React re-asserts the controlled <select> back
  // to its old value (the placeholder) — and the subsequent `change` handler then
  // reads the reset, empty value. Net effect: picking a built-in option snaps the
  // dropdown straight back to "Select an option…". All visibleWhen triggers here
  // are option-based (selects/radios), which fire `change`, so `onChange` alone is
  // sufficient and the child's own onChange runs first (same event, child-first
  // bubbling), updating its state before this refresh re-renders.
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
        router.push((successPath ?? '/entries/list') as never);
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

      {definition.fields.map((block) => {
        if (!shouldRender(block)) return null;
        // A raw-data-table whose mode is driven by a sibling field must remount
        // when that mode changes, so its internal column/row state resets to the
        // new shape. Folding the live mode into the key does that.
        const key =
          block.type === 'raw-data-table' && block.modeField
            ? `${block.name}:${String(values[block.modeField] ?? '')}`
            : block.name;
        return (
          <FieldRenderer
            key={key}
            block={block}
            optionsByCategory={optionsByCategory}
            error={fieldErrors[block.name]}
            values={values}
            defaults={defaultValues}
          />
        );
      })}

      {editReasonRequired ? (
        <div className="grid gap-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-3">
          <label htmlFor="edit_reason" className="text-sm font-medium text-amber-900">
            Edit reason <span className="text-amber-700">(required)</span>
          </label>
          <p className="text-xs text-amber-800">
            This entry is more than 24 hours old. As Captain/Deputy you can still edit it, but the
            reason is recorded to the audit trail to keep the record trustworthy.
          </p>
          <textarea
            id="edit_reason"
            name="edit_reason"
            rows={2}
            required
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. Fixing a transcription error in the original capture"
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : (submitLabel ?? 'Save entry')}
        </button>
      </div>
    </form>
  );
}
