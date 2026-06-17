/**
 * Google Drive ingest (2F, docs/phase2/04-media.md §§3–4). Uploads bytes to the
 * team Shared Drive folder as a service account, makes the file link-viewable,
 * and returns the share link + thumbnail. Server-only (uses the service-account
 * key from a server env var — never exposed to the client).
 *
 * Setup (App Lead, one-time): a Google service account is a Content manager on
 * the Shared Drive; its key JSON is in `GOOGLE_SERVICE_ACCOUNT_KEY` and the
 * target folder id in `GOOGLE_DRIVE_MEDIA_FOLDER_ID` (Vercel + .env.local).
 */

import { Readable } from 'node:stream';
import { google } from 'googleapis';

function getDrive() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set.');
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

export type DriveUpload = {
  fileId: string;
  webViewLink: string;
  thumbnailUrl: string;
};

/**
 * Upload bytes into the configured Shared Drive folder and make them readable by
 * anyone with the link (so previews/embeds work with no manual sharing step).
 * `supportsAllDrives: true` is required for Shared Drives.
 */
export async function uploadToDrive(opts: {
  bytes: Buffer;
  filename: string;
  mimeType: string;
}): Promise<DriveUpload> {
  const folderId = process.env.GOOGLE_DRIVE_MEDIA_FOLDER_ID;
  if (!folderId) throw new Error('GOOGLE_DRIVE_MEDIA_FOLDER_ID is not set.');

  const drive = getDrive();

  const created = await drive.files.create({
    requestBody: { name: opts.filename, parents: [folderId] },
    media: { mimeType: opts.mimeType, body: Readable.from(opts.bytes) },
    fields: 'id',
    supportsAllDrives: true,
  });

  const fileId = created.data.id;
  if (!fileId) throw new Error('Drive upload returned no file id.');

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });

  return {
    fileId,
    webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w640`,
  };
}

/** Download a direct media URL server-side so its bytes can be re-homed in Drive. */
export async function downloadBytes(url: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Failed to fetch source (${res.status}).`);
  const mimeType =
    res.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
  const bytes = Buffer.from(await res.arrayBuffer());
  return { bytes, mimeType };
}
