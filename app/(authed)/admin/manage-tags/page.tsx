import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { softDeleteOption } from '@/lib/option-list-actions';
import type { OptionCategory } from '@/entries/_types';

type TagRow = { id: string; category: OptionCategory; label: string; sort_order: number };

const CATEGORY_LABELS: Record<OptionCategory, string> = {
  event_type: 'Event Type',
  engagement_depth: 'Engagement Depth',
  follow_up_type: 'Follow-up Type',
  our_role: 'Our Role',
  meeting_type: 'Meeting Type',
  subsystem: 'Subsystem',
  relationship_type: 'Relationship Type',
  relationship_status: 'Relationship Status',
  change_type: 'Change Type',
};

export default async function ManageTagsPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('option_lists')
    .select('id, category, label, sort_order')
    .eq('is_seed', false)
    .is('deleted_at', null)
    .order('category')
    .order('sort_order');

  const rows = (data ?? []) as TagRow[];

  const grouped = new Map<OptionCategory, TagRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.category) ?? [];
    list.push(row);
    grouped.set(row.category, list);
  }
  const categories = [...grouped.keys()];

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (id) {
      await softDeleteOption(id);
      revalidatePath('/admin/manage-tags');
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Manage tags</h1>
        <Link
          href={'/dashboard' as never}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Dashboard
        </Link>
      </header>

      <p className="mt-4 text-sm text-muted-foreground">
        Tags created via the &quot;Add new…&quot; affordance on entry forms. Built-in seed tags are
        not listed and cannot be deleted. Removing a tag hides it from future dropdowns but does not
        affect existing entries.
      </p>

      {categories.length === 0 ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          No user-created tags yet.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {grouped.get(cat)!.map((tag) => (
                  <li key={tag.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm">{tag.label}</span>
                    <form action={handleDelete}>
                      <input type="hidden" name="id" value={tag.id} />
                      <button
                        type="submit"
                        className="text-xs text-destructive hover:underline focus:outline-none"
                      >
                        Delete
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
