import { EntryForm } from '@/components/entry-form/EntryForm';
import { softwareChangeLogEntry } from '@/entries/software-change-log';
import { preloadOptions } from '@/lib/preload-options';
import { insertEntry } from '@/lib/insert-entry';

export const dynamic = 'force-dynamic';

async function action(formData: FormData) {
  'use server';
  return insertEntry(softwareChangeLogEntry, formData);
}

export default async function NewSoftwareChangeLogPage() {
  const optionsByCategory = await preloadOptions(softwareChangeLogEntry);
  return (
    <EntryForm
      definition={softwareChangeLogEntry}
      optionsByCategory={optionsByCategory}
      action={action}
    />
  );
}
