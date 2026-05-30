import { EntryForm } from '@/components/entry-form/EntryForm';
import { outreachLogEntry } from '@/entries/outreach-log';
import { preloadOptions } from '@/lib/preload-options';
import { insertEntry } from '@/lib/insert-entry';

async function action(formData: FormData) {
  'use server';
  return insertEntry(outreachLogEntry, formData);
}

export default async function NewOutreachLogPage() {
  const optionsByCategory = await preloadOptions(outreachLogEntry);
  return (
    <EntryForm
      definition={outreachLogEntry}
      optionsByCategory={optionsByCategory}
      action={action}
    />
  );
}
