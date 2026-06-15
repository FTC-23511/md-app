import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EntryForm } from '@/components/entry-form/EntryForm';
import { EntryEditBlocked } from '@/components/entry-detail/EntryEditBlocked';
import { loadEntryDetail, buildFormDefaults } from '@/lib/entry-detail';
import { addDecisionOutcome, decisionOutcomeDefinition } from '@/lib/update-decision-log';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveEditContext } from '@/lib/edit-lock-server';
import { EDIT_MESSAGES } from '@/lib/edit-lock';

export const dynamic = 'force-dynamic';

/**
 * "Add outcome" — the SOP-05 outcome-later mini-form (actual outcome / delta
 * from prediction / what we learned), filed once the decision has been
 * tested. Updates only its three keys via updateEntry's partial-definition
 * semantics; pre-fills if an outcome was already saved.
 */
export default async function AddDecisionOutcomePage({
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

  // 24h edit-lock gate (3C) — same as the complete flow.
  const backHref = `/entries/decision_log/${id}`;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  const ctx = await resolveEditContext(supabase, decisionOutcomeDefinition.table, id, user.id);
  if (ctx.capability.kind === 'role_denied')
    return <EntryEditBlocked message={EDIT_MESSAGES.role_denied} backHref={backHref} />;
  if (ctx.capability.kind === 'locked')
    return <EntryEditBlocked message={EDIT_MESSAGES.locked} backHref={backHref} />;
  if (ctx.capability.kind === 'denied')
    return <EntryEditBlocked message={EDIT_MESSAGES.denied} backHref={backHref} />;

  const defaultValues = buildFormDefaults(decisionOutcomeDefinition, detail.row);

  async function action(formData: FormData) {
    'use server';
    return addDecisionOutcome(id, formData);
  }

  return (
    <EntryForm
      definition={decisionOutcomeDefinition}
      optionsByCategory={{}}
      action={action}
      defaultValues={defaultValues}
      submitLabel="Save outcome"
      successPath={backHref}
      editReasonRequired={ctx.capability.kind === 'reason_required'}
    />
  );
}
