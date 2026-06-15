import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EntryForm } from '@/components/entry-form/EntryForm';
import { EntryEditBlocked } from '@/components/entry-detail/EntryEditBlocked';
import { decisionLogEntry } from '@/entries/decision-log';
import { preloadOptions } from '@/lib/preload-options';
import { loadEntryDetail, buildFormDefaults } from '@/lib/entry-detail';
import { completeDecisionLog } from '@/lib/update-decision-log';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveEditContext } from '@/lib/edit-lock-server';
import { EDIT_MESSAGES } from '@/lib/edit-lock';

export const dynamic = 'force-dynamic';

/**
 * "Complete this entry" — re-opens the Decision Log form pre-filled so the
 * filer can add previously-hidden depth sections within SOP-05's 7-day
 * window, then flips entry_state to 'complete' (the required-for-complete
 * check runs server-side in completeDecisionLog).
 */
export default async function CompleteDecisionLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await loadEntryDetail('decision_log', id);

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

  // 24h edit-lock gate (3C): show a friendly message instead of the form when
  // the lock / role denies it; show the edit_reason field on a Captain override.
  const backHref = `/entries/decision_log/${id}`;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  const ctx = await resolveEditContext(supabase, decisionLogEntry.table, id, user.id);
  if (ctx.capability.kind === 'role_denied')
    return <EntryEditBlocked message={EDIT_MESSAGES.role_denied} backHref={backHref} />;
  if (ctx.capability.kind === 'locked')
    return <EntryEditBlocked message={EDIT_MESSAGES.locked} backHref={backHref} />;
  if (ctx.capability.kind === 'denied')
    return <EntryEditBlocked message={EDIT_MESSAGES.denied} backHref={backHref} />;

  const optionsByCategory = await preloadOptions(decisionLogEntry);
  const defaultValues = buildFormDefaults(decisionLogEntry, detail.row);

  async function action(formData: FormData) {
    'use server';
    return completeDecisionLog(id, formData);
  }

  return (
    <EntryForm
      definition={decisionLogEntry}
      optionsByCategory={optionsByCategory}
      action={action}
      defaultValues={defaultValues}
      submitLabel="Mark complete"
      successPath={backHref}
      editReasonRequired={ctx.capability.kind === 'reason_required'}
    />
  );
}
