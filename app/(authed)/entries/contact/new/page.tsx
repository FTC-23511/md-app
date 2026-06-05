import { EntryForm } from '@/components/entry-form/EntryForm';
import { contactLogEntry } from '@/entries/contact-log';
import { preloadOptions } from '@/lib/preload-options';
import { insertContactLog } from '@/lib/insert-contact-log';

export const dynamic = 'force-dynamic';

async function action(formData: FormData) {
  'use server';
  return insertContactLog(formData);
}

export default async function NewContactLogPage() {
  const optionsByCategory = await preloadOptions(contactLogEntry);
  return (
    <EntryForm definition={contactLogEntry} optionsByCategory={optionsByCategory} action={action} />
  );
}
