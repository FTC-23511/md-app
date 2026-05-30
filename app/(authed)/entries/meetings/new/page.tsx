import { EntryForm } from '@/components/entry-form/EntryForm';
import { meetingNotesEntry } from '@/entries/meeting-notes';
import { preloadOptions } from '@/lib/preload-options';
import { insertEntry } from '@/lib/insert-entry';

async function action(formData: FormData) {
  'use server';
  return insertEntry(meetingNotesEntry, formData);
}

export default async function NewMeetingNotesPage() {
  const optionsByCategory = await preloadOptions(meetingNotesEntry);
  return (
    <EntryForm
      definition={meetingNotesEntry}
      optionsByCategory={optionsByCategory}
      action={action}
    />
  );
}
