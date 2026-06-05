import { EntryForm } from '@/components/entry-form/EntryForm';
import { hardwareChangeLogEntry } from '@/entries/hardware-change-log';
import { preloadOptions } from '@/lib/preload-options';
import { insertEntry } from '@/lib/insert-entry';

export const dynamic = 'force-dynamic';

async function action(formData: FormData) {
  'use server';
  return insertEntry(hardwareChangeLogEntry, formData);
}

export default async function NewHardwareChangeLogPage() {
  const optionsByCategory = await preloadOptions(hardwareChangeLogEntry);
  return (
    <EntryForm
      definition={hardwareChangeLogEntry}
      optionsByCategory={optionsByCategory}
      action={action}
    />
  );
}
