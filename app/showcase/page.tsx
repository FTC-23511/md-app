import { createSupabaseServerClient } from '@/lib/supabase/server';

export const revalidate = 300; // cache 5 minutes at the edge

export default async function ShowcasePage() {
  const supabase = await createSupabaseServerClient();
  const { data: entries } = await supabase
    .from('entries')
    .select('id, type, title, event_date')
    .eq('is_public_showcase', true)
    .order('event_date', { ascending: false })
    .limit(50);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">FTC 23511 — Documentation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A curated view into our team&apos;s working documentation.
        </p>
      </header>

      <ul className="mt-8 divide-y divide-border">
        {(entries ?? []).map((entry) => (
          <li key={entry.id} className="py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {entry.type.replace(/_/g, ' ')}
            </p>
            <p className="mt-1 font-medium">{entry.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{entry.event_date}</p>
          </li>
        ))}
        {(entries ?? []).length === 0 && (
          <li className="py-12 text-center text-sm text-muted-foreground">
            No public entries yet. Check back during competition season.
          </li>
        )}
      </ul>
    </main>
  );
}
