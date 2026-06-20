'use client';

import { useState } from 'react';
import type { MediaLinksBlock as MediaLinksBlockType } from '@/entries/_types';
import { BlockShell } from './BlockShell';

type Source = 'link' | 'upload';
type Row = { id: string };

let nextRowId = 0;
function newRow(): Row {
  nextRowId += 1;
  return { id: `media-${nextRowId}` };
}

const PERMISSIONS: Array<{ value: string; label: string }> = [
  { value: 'pending', label: 'Consent: pending' },
  { value: 'yes', label: 'Consent: yes' },
  { value: 'no', label: 'Consent: no' },
  { value: 'n_a', label: 'Consent: N/A (no people)' },
];

const CONSENT_HELP =
  'Do you have permission to publish this? A recognizable person — especially a minor — needs consent before it goes in the portfolio. Pick N/A if no people are shown.';

// Join class names with a real (code, not string-literal) space. A leading space
// inside a conditional like `? ' hidden'` gets stripped by prettier-plugin-tailwindcss
// on format, which would glue 'hidden' onto the previous class and break it.
function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Media attachment block (2F, docs/phase2/04-media.md §7). Each row is ONE item:
 * a link OR an uploaded file, chosen by a per-row Link/Upload toggle, plus a
 * caption, publishing-consent status, and optional role. On submit the server
 * decides passthrough (YouTube/Vimeo/Drive links stay native) vs ingest (uploads
 * + loose direct links re-home into the team Shared Drive); rows land in the
 * polymorphic `media_links` table, not the entry row.
 *
 * Both the url and file inputs are always mounted (one hidden via the toggle) so
 * the parallel-array wire format (`name__url`, `name__file`, …) stays index-
 * aligned across rows. The hidden input is remounted empty on toggle (its React
 * key includes the source), so a row never submits both a link and a file.
 */
export function MediaLinksBlock({ block, error }: { block: MediaLinksBlockType; error?: string }) {
  const maxRows = block.maxRows ?? 10;
  const maxMb = block.maxUploadMb ?? 4;
  const maxBytes = maxMb * 1024 * 1024;
  const roles = block.roles ?? [];
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  // Per-row "file too big" message. The check runs HERE, in the browser, and
  // clears the input — Vercel rejects bodies over ~4.5 MB with a 413 before our
  // server-side check can run, so client-side is the only reliable enforcement.
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [source, setSource] = useState<Record<string, Source>>({});

  const sourceOf = (id: string): Source => source[id] ?? 'link';

  function clearKey<T>(map: Record<string, T>, id: string): Record<string, T> {
    if (!(id in map)) return map;
    const next = { ...map };
    delete next[id];
    return next;
  }

  function addRow() {
    if (rows.length >= maxRows) return;
    setRows((prev) => [...prev, newRow()]);
  }
  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
    setFileErrors((prev) => clearKey(prev, id));
    setSource((prev) => clearKey(prev, id));
  }
  function setRowSource(id: string, s: Source) {
    setSource((prev) => ({ ...prev, [id]: s }));
    setFileErrors((prev) => clearKey(prev, id)); // switching clears the inactive input + its error
  }
  function onFilePick(rowId: string, input: HTMLInputElement) {
    const file = input.files?.[0];
    if (file && file.size > maxBytes) {
      input.value = '';
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileErrors((prev) => ({
        ...prev,
        [rowId]: `That file is ${mb} MB — over the ${maxMb} MB limit. Put large photos/videos on YouTube (or compress the image) and paste the link instead.`,
      }));
      return;
    }
    setFileErrors((prev) => clearKey(prev, rowId));
  }

  const inputClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
  const toggleBase = 'inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium';

  return (
    <BlockShell block={block} error={error}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          One item per row. Choose <strong>Link</strong> (YouTube/Vimeo/Drive or an image URL) or{' '}
          <strong>Upload</strong> a file — not both. “Consent” = permission to publish it; a
          recognizable person, especially a minor, needs consent before it goes in the portfolio.
        </p>
        {rows.map((row, idx) => {
          const src = sourceOf(row.id);
          return (
            <div key={row.id} className="grid gap-2 rounded-md border border-input p-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setRowSource(row.id, 'link')}
                  aria-pressed={src === 'link'}
                  className={`${toggleBase} ${
                    src === 'link'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-muted-foreground'
                  }`}
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => setRowSource(row.id, 'upload')}
                  aria-pressed={src === 'upload'}
                  className={`${toggleBase} ${
                    src === 'upload'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-muted-foreground'
                  }`}
                >
                  Upload
                </button>
              </div>

              <input
                key={`${row.id}-url-${src}`}
                type="url"
                name={`${block.name}__url`}
                placeholder="Paste a link (YouTube, Vimeo, Drive, or an image/video URL)"
                className={cx(inputClass, src === 'upload' && 'hidden')}
              />

              <label className={cx('text-xs text-muted-foreground', src === 'link' && 'hidden')}>
                Upload a file (≤ {maxMb} MB — larger videos go on YouTube):
                <input
                  key={`${row.id}-file-${src}`}
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
                  title={CONSENT_HELP}
                  aria-label="Publishing consent"
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
          );
        })}
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
