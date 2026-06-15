import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EntryForm } from '@/components/entry-form/EntryForm';
import { EntryEditBlocked } from '@/components/entry-detail/EntryEditBlocked';
import { ENTRY_REGISTRY } from '@/entries/_registry';
import { loadEntryDetail, buildFormDefaults } from '@/lib/entry-detail';
import { preloadOptions } from '@/lib/preload-options';
import { updateEntry } from '@/lib/update-entry';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveEditContext } from '@/lib/edit-lock-server';
import { EDIT_MESSAGES } from '@/lib/edit-lock';
import { isGenericEditable } from '@/lib/editable';

export const dynamic = 'force-dynamic';

/**
 * Generic edit flow for the single-table entry types (lib/editable.ts). Loads
 * the entry into the same definition-driven form used to create it, pre-filled,
 * and saves through the updateEntry chokepoint — so the 24h lock + Captain
 * edit-reason override (3C) apply automatically. Types needing recompute /
 * multi-table writes are excluded and bounce back to their detail page.
 */
export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const backHref = `/entries/${type}/${id}`;

  const found = ENTRY_REGISTRY[type];
  // Unknown type, or a type that isn't generically editable → send to detail.
  if (!found || !isGenericEditable(type)) {
    redirect(backHref as never);
  }
  const definition = found;

  const detail = await loadEntryDetail(type, id);
  if (!detail) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Entry not found</h1>
        <p className="mt-6">
          <Link
            href={'/entries/list' as never}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            ← Back to entries
          </Link>
        </p>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const ctx = await resolveEditContext(supabase, definition.table, id, user.id);
  if (ctx.capability.kind === 'role_denied')
    return <EntryEditBlocked message={EDIT_MESSAGES.role_denied} backHref={backHref} />;
  if (ctx.capability.kind === 'locked')
    return <EntryEditBlocked message={EDIT_MESSAGES.locked} backHref={backHref} />;
  if (ctx.capability.kind === 'denied')
    return <EntryEditBlocked message={EDIT_MESSAGES.denied} backHref={backHref} />;

  const optionsByCategory = await preloadOptions(definition);
  const defaultValues = buildFormDefaults(definition, detail.row);

  async function action(formData: FormData) {
    'use server';
    return updateEntry(definition, id, formData);
  }

  return (
    <EntryForm
      definition={definition}
      optionsByCategory={optionsByCategory}
      action={action}
      defaultValues={defaultValues}
      submitLabel="Save changes"
      successPath={backHref}
      editReasonRequired={ctx.capability.kind === 'reason_required'}
    />
  );
}
