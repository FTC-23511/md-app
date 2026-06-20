/**
 * Post-insert media save (2F, docs/phase2/04-media.md §3). Runs after an entry
 * row exists (we need its id for the polymorphic `media_links.entry_id`). Reads
 * the media-links block's rows straight from the submitted FormData — including
 * uploaded File objects — decides passthrough vs ingest per row, performs the
 * Drive ingest where needed, and inserts one `media_links` row per item.
 *
 * Best-effort by design: a single item failing (oversized, dead link, Drive
 * hiccup) must not lose the entry the user already filed. Failures for *link*
 * items are recorded as `ingest_status='failed'` rows so they're visible and
 * retryable; a failed *upload* has no URL to store, so it is counted and skipped.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { MediaLinksBlock } from '@/entries/_types';
import { detectProvider } from './provider';
import { uploadToDrive, downloadBytes } from './drive';

const DEFAULT_MAX_MB = 4;
const PERMISSIONS = new Set(['yes', 'no', 'pending', 'n_a']);

function mediaTypeFromMime(mime: string): 'image' | 'video' | 'unknown' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'unknown';
}

export type SaveMediaResult = { saved: number; failed: number };

export async function saveEntryMedia(
  entryType: string,
  entryId: string,
  formData: FormData,
  block: MediaLinksBlock,
): Promise<SaveMediaResult> {
  const name = block.name;
  const urls = formData.getAll(`${name}__url`).map(String);
  const captions = formData.getAll(`${name}__caption`).map(String);
  const perms = formData.getAll(`${name}__permission_status`).map(String);
  const roles = formData.getAll(`${name}__role`).map(String);
  const files = formData.getAll(`${name}__file`);
  const rowCount = Math.max(urls.length, captions.length, perms.length, roles.length, files.length);
  if (rowCount === 0) return { saved: 0, failed: 0 };

  const maxBytes = (block.maxUploadMb ?? DEFAULT_MAX_MB) * 1024 * 1024;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const createdBy = user?.id ?? null;

  type MediaRow = Record<string, unknown>;
  const rows: MediaRow[] = [];
  let failed = 0;

  for (let i = 0; i < rowCount; i++) {
    const url = (urls[i] ?? '').trim();
    const f = files[i];
    const file = typeof f !== 'string' && f != null && (f as File).size > 0 ? (f as File) : null;
    if (!url && !file) continue; // empty row

    const caption = (captions[i] ?? '').trim() || null;
    const permRaw = perms[i] ?? 'pending';
    const permission_status = PERMISSIONS.has(permRaw) ? permRaw : 'pending';
    const role = (roles[i] ?? '').trim() || null;
    const base: MediaRow = {
      entry_type: entryType,
      entry_id: entryId,
      created_by: createdBy,
      caption,
      permission_status,
      role,
    };

    try {
      if (file) {
        if (file.size > maxBytes) {
          failed++;
          continue; // too big — the form message tells them to use YouTube
        }
        const bytes = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || 'application/octet-stream';
        const up = await uploadToDrive({ bytes, filename: file.name || `upload-${i}`, mimeType });
        rows.push({
          ...base,
          url: up.webViewLink,
          provider: 'google_drive',
          source_provider: 'upload',
          drive_file_id: up.fileId,
          ingest_status: 'done',
          media_type: mediaTypeFromMime(mimeType),
          thumbnail_url: up.thumbnailUrl,
        });
      } else {
        const info = detectProvider(url);
        if (info.passthrough) {
          rows.push({
            ...base,
            url,
            provider: info.provider,
            source_provider: null,
            drive_file_id: info.drive_file_id ?? null,
            ingest_status: 'not_needed',
            media_type: info.media_type,
            thumbnail_url: null,
          });
        } else {
          // Loose direct image/video link → re-home in Drive.
          const { bytes, mimeType } = await downloadBytes(url);
          if (bytes.length > maxBytes) {
            failed++;
            continue;
          }
          const filename = url.split('/').pop()?.split('?')[0] || `media-${i}`;
          const up = await uploadToDrive({ bytes, filename, mimeType });
          rows.push({
            ...base,
            url: up.webViewLink,
            provider: 'google_drive',
            source_provider: 'direct',
            drive_file_id: up.fileId,
            ingest_status: 'done',
            media_type:
              info.media_type === 'unknown' ? mediaTypeFromMime(mimeType) : info.media_type,
            thumbnail_url: up.thumbnailUrl,
          });
        }
      }
    } catch (err) {
      failed++;
      console.error(`media ingest failed for ${entryType}/${entryId} row ${i}:`, err);
      // A link item still has a URL we can record as failed; an upload doesn't.
      if (url) {
        rows.push({
          ...base,
          url,
          provider: 'other',
          source_provider: file ? 'upload' : 'direct',
          ingest_status: 'failed',
          media_type: 'unknown',
        });
      }
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('media_links').insert(rows);
    if (error) {
      console.error(`media_links insert failed for ${entryType}/${entryId}:`, error.message);
      return { saved: 0, failed: failed + rows.length };
    }
  }
  return { saved: rows.length, failed };
}
