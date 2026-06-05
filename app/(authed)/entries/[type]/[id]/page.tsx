import Link from 'next/link';
import { loadEntryDetail } from '@/lib/entry-detail';
import { EntryDetailView } from '@/components/entry-detail/EntryDetailView';

export const dynamic = 'force-dynamic';

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const detail = await loadEntryDetail(type, id);

  if (!detail) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Entry not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This entry doesn’t exist, was deleted, or the type isn’t recognized.
        </p>
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

  const isDraft = String(detail.row.entry_state ?? 'complete') === 'draft';

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{detail.definition.label}</h1>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              isDraft ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {isDraft ? 'Draft' : 'Complete'}
          </span>
        </div>
        <Link
          href={'/entries/list' as never}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          ← Back to entries
        </Link>
      </header>

      <EntryDetailView detail={detail} />
    </main>
  );
}
