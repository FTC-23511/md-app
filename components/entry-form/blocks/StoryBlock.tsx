'use client';

import { useState } from 'react';
import type { StoryBlock as StoryBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

type Story = {
  id: string;
  person_name: string;
  person_role_age: string;
  what_happened: string;
  direct_quote: string;
  permission: 'yes' | 'no' | 'pending';
  photo_url: string;
};

let nextStoryId = 0;
function newStory(partial?: Partial<Story>): Story {
  nextStoryId += 1;
  return {
    id: `story-${nextStoryId}`,
    person_name: '',
    person_role_age: '',
    what_happened: '',
    direct_quote: '',
    permission: 'pending',
    photo_url: '',
    ...partial,
  };
}

export function StoryBlock({
  block,
  defaultValue,
  error,
}: {
  block: StoryBlockType;
  defaultValue?: Array<Omit<Story, 'id'>>;
  error?: string;
}) {
  const minStories = block.minStories ?? 0;
  const maxStories = block.maxStories ?? 10;

  const [stories, setStories] = useState<Story[]>(() =>
    defaultValue && defaultValue.length > 0
      ? defaultValue.map((d) => newStory(d))
      : Array.from({ length: Math.max(minStories, 1) }, () => newStory()),
  );

  function update(id: string, patch: Partial<Story>) {
    setStories((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function add() {
    if (stories.length >= maxStories) return;
    setStories((prev) => [...prev, newStory()]);
  }
  function remove(id: string) {
    if (stories.length <= minStories) return;
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-4">
        {stories.map((s, idx) => (
          <div key={s.id} className="bg-card rounded-md border border-input p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Story {idx + 1}</span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                disabled={stories.length <= minStories}
                className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name={`${block.name}__person_name`}
                value={s.person_name}
                onChange={(e) => update(s.id, { person_name: e.target.value })}
                placeholder="Person's name"
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <input
                type="text"
                name={`${block.name}__person_role_age`}
                value={s.person_role_age}
                onChange={(e) => update(s.id, { person_role_age: e.target.value })}
                placeholder="Role / age (e.g. Parent, ~40)"
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <textarea
              name={`${block.name}__what_happened`}
              value={s.what_happened}
              onChange={(e) => update(s.id, { what_happened: e.target.value })}
              placeholder="What happened (2–4 sentences)"
              rows={3}
              className="mt-2 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <textarea
              name={`${block.name}__direct_quote`}
              value={s.direct_quote}
              onChange={(e) => update(s.id, { direct_quote: e.target.value })}
              placeholder="Direct quote (verbatim, if any)"
              rows={2}
              className="mt-2 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="mt-2 grid grid-cols-[10rem_1fr] gap-2">
              <select
                name={`${block.name}__permission`}
                value={s.permission}
                onChange={(e) =>
                  update(s.id, { permission: e.target.value as Story['permission'] })
                }
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="pending">Permission: pending</option>
                <option value="yes">Permission: yes</option>
                <option value="no">Permission: no</option>
              </select>
              <input
                type="url"
                name={`${block.name}__photo_url`}
                value={s.photo_url}
                onChange={(e) => update(s.id, { photo_url: e.target.value })}
                placeholder="Photo URL (optional, Phase 2 adds upload)"
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          disabled={stories.length >= maxStories}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          + Add another story
        </button>
      </div>
    </BlockShell>
  );
}
