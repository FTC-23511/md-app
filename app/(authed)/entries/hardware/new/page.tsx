import { EntryForm } from '@/components/entry-form/EntryForm';
import { hardwareChangeLogEntry } from '@/entries/hardware-change-log';
import { preloadOptions } from '@/lib/preload-options';
import { submitEntryWithMedia } from '@/lib/submit-entry-with-media';
import { loadLatestHwVersions } from '@/lib/hw-versions';

export const dynamic = 'force-dynamic';

async function action(formData: FormData) {
  'use server';
  // HW Change Log carries a media-links block (Photos) → insert + ingest media.
  return submitEntryWithMedia(hardwareChangeLogEntry, formData);
}

export default async function NewHardwareChangeLogPage() {
  const [optionsByCategory, latestVersions] = await Promise.all([
    preloadOptions(hardwareChangeLogEntry),
    loadLatestHwVersions(),
  ]);
  return (
    <div className="mx-auto max-w-2xl px-6 pt-8">
      {latestVersions.length > 0 ? (
        <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
          <p className="text-sm font-medium">Latest saved version per subsystem</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick the next number above the current one for the subsystem you’re changing.
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {latestVersions.map((v) => (
              <li key={v.label}>
                <span className="text-muted-foreground">{v.label}:</span> v{v.version}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <EntryForm
        definition={hardwareChangeLogEntry}
        optionsByCategory={optionsByCategory}
        action={action}
      />
    </div>
  );
}
