'use client';

import { useState } from 'react';
import type { SpecialtyTriggersBlock as SpecialtyTriggersBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

const TIER_2_TYPES = [
  { value: 'decision_log', label: 'Decision Log' },
  { value: 'hw_change_log', label: 'Hardware Change Log' },
  { value: 'sw_change_log', label: 'Software Change Log' },
  { value: 'test_log', label: 'Test Log' },
  { value: 'contact_log', label: 'Contact Log' },
] as const;

type TargetType = (typeof TIER_2_TYPES)[number]['value'];

type Trigger = {
  target_type: TargetType;
  checked: boolean;
  owner_text: string;
  subject: string;
};

export function SpecialtyTriggersBlock({
  block,
  defaultValue,
  error,
}: {
  block: SpecialtyTriggersBlockType;
  defaultValue?: { target_type: TargetType; owner_text: string; subject: string }[];
  error?: string;
}) {
  const [triggers, setTriggers] = useState<Trigger[]>(() =>
    TIER_2_TYPES.map((t) => {
      const existing = defaultValue?.find((d) => d.target_type === t.value);
      return {
        target_type: t.value,
        checked: !!existing,
        owner_text: existing?.owner_text ?? '',
        subject: existing?.subject ?? '',
      };
    }),
  );

  function update(target: TargetType, patch: Partial<Trigger>) {
    setTriggers((prev) => prev.map((t) => (t.target_type === target ? { ...t, ...patch } : t)));
  }

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-3">
        {triggers.map((t) => {
          const label = TIER_2_TYPES.find((x) => x.value === t.target_type)!.label;
          return (
            <div key={t.target_type} className="rounded-md border border-input p-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name={`${block.name}__checked`}
                  value={t.target_type}
                  checked={t.checked}
                  onChange={(e) => update(t.target_type, { checked: e.target.checked })}
                  className="h-4 w-4"
                />
                {label}
              </label>
              {t.checked ? (
                <div className="mt-2 grid grid-cols-[10rem_1fr] gap-2">
                  <input
                    type="text"
                    name={`${block.name}__owner__${t.target_type}`}
                    value={t.owner_text}
                    onChange={(e) => update(t.target_type, { owner_text: e.target.value })}
                    placeholder="Owner"
                    required
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <input
                    type="text"
                    name={`${block.name}__subject__${t.target_type}`}
                    value={t.subject}
                    onChange={(e) => update(t.target_type, { subject: e.target.value })}
                    placeholder="Subject (one-liner)"
                    required
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </BlockShell>
  );
}
