import { EntryForm } from '@/components/entry-form/EntryForm';
import { sessionLogEntry } from '@/entries/session-log';
import { preloadOptions } from '@/lib/preload-options';
import { insertEntry } from '@/lib/insert-entry';

async function action(formData: FormData) {
  'use server';
  return insertEntry(sessionLogEntry, formData);
}

export default async function NewSessionLogPage() {
  const optionsByCategory = await preloadOptions(sessionLogEntry);
  return (
    <EntryForm definition={sessionLogEntry} optionsByCategory={optionsByCategory} action={action} />
  );
}
