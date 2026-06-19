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
  const maxBytes = maxMb * 1024 * 1024;
  const roles = block.roles ?? [];
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  // Per-row "file too big" messages. The check runs HERE, in the browser, and
  // clears the file input — so an oversized upload never reaches the server.
  // Vercel rejects request bodies over ~4.5 MB with a 413 before our server-side
  // check can run, so the only reliable place to enforce the cap is client-side.
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  function addRow() {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, newRow()]);
  }
  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
    setFileErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function onFilePick(rowId: string, input: HTMLInputElement) {
    const file = input.files?.[0];
    if (file && file.size > maxBytes) {
      input.value = ''; // drop it so it isn't submitted
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileErrors((prev) => ({
        ...prev,
        [rowId]: `That file is ${mb} MB — over the ${maxMb} MB limit. Put large photos/videos on YouTube (or compress the image) and paste the link instead.`,
      }));
    } else {
      setFileErrors((prev) => {
        if (!(rowId in prev)) return prev;
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
    }
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
                onChange={(e) => onFilePick(row.id, e.currentTarget)}
                className="mt-1 block w-full text-xs file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-2 file:py-1 file:text-xs"
              />
            </label>
            {fileErrors[row.id] ? (
              <p className="text-xs text-destructive">{fileErrors[row.id]}</p>
            ) : null}
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
