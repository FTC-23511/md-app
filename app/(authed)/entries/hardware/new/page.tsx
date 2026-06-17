import { EntryForm } from '@/components/entry-form/EntryForm';
import { hardwareChangeLogEntry } from '@/entries/hardware-change-log';
import { preloadOptions } from '@/lib/preload-options';
import { submitEntryWithMedia } from '@/lib/submit-entry-with-media';

export const dynamic = 'force-dynamic';

async function action(formData: FormData) {
  'use server';
  // HW Change Log carries a media-links block (Photos) → insert + ingest media.
  return submitEntryWithMedia(hardwareChangeLogEntry, formData);
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
