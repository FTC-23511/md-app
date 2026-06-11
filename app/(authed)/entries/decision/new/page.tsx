import { EntryForm } from '@/components/entry-form/EntryForm';
import { decisionLogEntry } from '@/entries/decision-log';
import { preloadOptions } from '@/lib/preload-options';
import { insertDecisionLog } from '@/lib/insert-decision-log';

export const dynamic = 'force-dynamic';

async function action(formData: FormData) {
  'use server';
  return insertDecisionLog(formData);
}

export default async function NewDecisionLogPage() {
  const optionsByCategory = await preloadOptions(decisionLogEntry);
  return (
    <EntryForm
      definition={decisionLogEntry}
      optionsByCategory={optionsByCategory}
      action={action}
    />
  );
}
