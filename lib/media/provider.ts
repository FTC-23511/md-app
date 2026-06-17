/**
 * Pure media-provider detection (2F, docs/phase2/04-media.md §2). Decides, from
 * a pasted URL, whether the item is a platform video that stays **native**
 * (passthrough) or a team-owned/fragile link that should be **ingested** into the
 * team Shared Drive. No I/O — unit-tested in tests/unit/media-provider.test.ts.
 */

export type MediaProvider = 'google_drive' | 'youtube' | 'vimeo' | 'direct' | 'other';
export type MediaKind = 'image' | 'video' | 'unknown';

export type ProviderInfo = {
  provider: MediaProvider;
  /** true → store the URL as-is; false → download the bytes and re-home in Drive. */
  passthrough: boolean;
  media_type: MediaKind;
  /** Drive file id, when the pasted link is already a Drive link. */
  drive_file_id?: string;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|heic|avif)(?:[?#].*)?$/i;
const VIDEO_EXT = /\.(mp4|mov|webm|m4v|avi|mkv)(?:[?#].*)?$/i;

/** Pull a Drive file id out of the common share-link shapes. */
export function extractDriveFileId(url: string): string | undefined {
  const byPath = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath?.[1]) return byPath[1];
  const byQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (byQuery?.[1]) return byQuery[1];
  return undefined;
}

export function detectProvider(rawUrl: string): ProviderInfo {
  const url = rawUrl.trim();
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    // Not a parseable URL — treat as an opaque "other" link, stored as-is.
    return { provider: 'other', passthrough: true, media_type: 'unknown' };
  }

  if (host === 'youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')) {
    return { provider: 'youtube', passthrough: true, media_type: 'video' };
  }
  if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
    return { provider: 'vimeo', passthrough: true, media_type: 'video' };
  }
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    // Already in Drive — keep as-is; record the file id so the app can manage it.
    return {
      provider: 'google_drive',
      passthrough: true,
      media_type: 'unknown',
      drive_file_id: extractDriveFileId(url),
    };
  }
  if (IMAGE_EXT.test(url)) {
    return { provider: 'direct', passthrough: false, media_type: 'image' };
  }
  if (VIDEO_EXT.test(url)) {
    return { provider: 'direct', passthrough: false, media_type: 'video' };
  }
  // Unknown loose link (e.g. an Imgur page, a tweet). Don't blindly download an
  // arbitrary HTML page — store the link as-is and let the preview try.
  return { provider: 'other', passthrough: true, media_type: 'unknown' };
}
