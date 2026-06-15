import Link from 'next/link';

/**
 * Friendly "you can't edit this" notice for the detail-page edit flows (3C).
 * Rendered instead of the form when the 24h lock / role gate denies the edit,
 * so a non-technical user sees a plain explanation rather than a raw error.
 */
export function EntryEditBlocked({ message, backHref }: { message: string; backHref: string }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-4">
        <h1 className="text-lg font-semibold text-amber-900">This entry can’t be edited</h1>
        <p className="mt-1 text-sm text-amber-800">{message}</p>
      </div>
      <p className="mt-6">
        <Link
          href={backHref as never}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          ← Back to the entry
        </Link>
      </p>
    </main>
  );
}
