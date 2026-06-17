'use client';

import { useState } from 'react';
import type { MediaLinksBlock as MediaLinksBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

type Row = { id: string };

let nextRowId = 0;
function newRow(): Row {
  nextRowId += 1;
  return { id: `media-${nextRowId}` };
}

const PERMISSIONS: Array<{ value: string; label: string }> = [
  { value: 'pending', label: 'Permission pending' },
  { value: 'yes', label: 'Permission: yes' },
  { value: 'no', label: 'Permission: no' },
  { value: 'n_a', label: 'Permission: N/A' },
];

/**
 * Media attachment block (2F, docs/phase2/04-media.md §7). Each row is one photo
 * or video: paste a link OR upload a file, plus a caption, permission status, and
 * optional role. On submit the server decides passthrough (YouTube/Vimeo/Drive
 * links stay native) vs ingest (uploads + loose direct links re-home into the
 * team Shared Drive); rows land in the polymorphic `media_links` table, not the
 * entry row. The inputs are wired as parallel arrays (`name__url`, `name__file`,
 * …) so one row = one index across them.
 */
export function MediaLinksBlock({ block, error }: { block: MediaLinksBlockType; error?: string }) {
  const maxRows = block.maxRows ?? 10;
  const maxMb = block.maxUploadMb ?? 4;
  const roles = block.roles ?? [];
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);

  function addRow() {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, newRow()]);
  }
  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  const inputClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={row.id} className="grid gap-2 rounded-md border border-input p-3">
            <input
              type="url"
              name={`${block.name}__url`}
              placeholder="Paste a link (YouTube, Vimeo, Drive, or an image/video URL)"
              className={inputClass}
            />
            <label className="text-xs text-muted-foreground">
              …or upload a file (≤ {maxMb} MB — larger videos go on YouTube):
              <input
                type="file"
                name={`${block.name}__file`}
                accept="image/*,video/*"
                className="mt-1 block w-full text-xs file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-2 file:py-1 file:text-xs"
              />
            </label>
            <input
              type="text"
              name={`${block.name}__caption`}
              placeholder="Caption (optional)"
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                name={`${block.name}__permission_status`}
                defaultValue="pending"
                className={inputClass}
              >
                {PERMISSIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {roles.length > 0 ? (
                <select name={`${block.name}__role`} defaultValue="" className={inputClass}>
                  <option value="">Role (optional)…</option>
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              ) : (
                // Keep the array aligned even without a role select.
                <input type="hidden" name={`${block.name}__role`} value="" />
              )}
            </div>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              aria-label={`Remove media ${idx + 1}`}
              className="justify-self-start text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= maxRows}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          + Add media
        </button>
      </div>
    </BlockShell>
  );
}
