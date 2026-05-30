import Link from 'next/link';

/**
 * Placeholder detail view. Phase 2 builds the real per-entry detail page.
 * Phase 1 keeps the route so clicking a row in the list view doesn't 404.
 */
export default async function EntryDetailPlaceholder({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Detail view: Phase 2</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Per-entry detail rendering ships in Phase 2. Until then this page is a placeholder so
        list-view rows don&apos;t 404.
      </p>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Type</dt>
        <dd className="font-mono">{type}</dd>
        <dt className="text-muted-foreground">ID</dt>
        <dd className="font-mono">{id}</dd>
      </dl>
      <p className="mt-6">
        <Link
          href={'/entries/list' as never}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          ← Back to entries
        </Link>
      </p>
    </main>
  );
}
