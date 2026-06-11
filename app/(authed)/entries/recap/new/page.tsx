import { EntryForm } from '@/components/entry-form/EntryForm';
import { competitionRecapEntry } from '@/entries/competition-recap';
import { preloadOptions } from '@/lib/preload-options';
import { insertEntry } from '@/lib/insert-entry';

export const dynamic = 'force-dynamic';

async function action(formData: FormData) {
  'use server';
  return insertEntry(competitionRecapEntry, formData);
}

export default async function NewCompetitionRecapPage() {
  const optionsByCategory = await preloadOptions(competitionRecapEntry);
  return (
    <EntryForm
      definition={competitionRecapEntry}
      optionsByCategory={optionsByCategory}
      action={action}
    />
  );
}
