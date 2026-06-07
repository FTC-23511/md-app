import { EntryForm } from '@/components/entry-form/EntryForm';
import { testLogEntry } from '@/entries/test-log';
import { preloadOptions } from '@/lib/preload-options';
import { insertTestLog } from '@/lib/insert-test-log';

export const dynamic = 'force-dynamic';

async function action(formData: FormData) {
  'use server';
  return insertTestLog(formData);
}

export default async function NewTestLogPage() {
  const optionsByCategory = await preloadOptions(testLogEntry);
  return (
    <EntryForm definition={testLogEntry} optionsByCategory={optionsByCategory} action={action} />
  );
}
