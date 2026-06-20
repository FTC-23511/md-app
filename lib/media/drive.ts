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

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive'];

function getDrive() {
  // Two ways to supply the service-account key:
  //  - GOOGLE_SERVICE_ACCOUNT_KEY      — the key JSON inline (used on Vercel).
  //  - GOOGLE_SERVICE_ACCOUNT_KEY_FILE — a path to the key JSON on disk (handy
  //    for local dev: no JSON to single-line into .env.local).
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  let auth: InstanceType<typeof google.auth.GoogleAuth>;
  if (keyFile) {
    auth = new google.auth.GoogleAuth({ keyFile, scopes: DRIVE_SCOPES });
  } else if (raw) {
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.');
    }
    auth = new google.auth.GoogleAuth({ credentials, scopes: DRIVE_SCOPES });
  } else {
    throw new Error(
      'No Drive credentials: set GOOGLE_SERVICE_ACCOUNT_KEY (inline JSON) or GOOGLE_SERVICE_ACCOUNT_KEY_FILE (path).',
    );
  }
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

/** Delete a Drive file (used by the dev smoke test to clean up after itself). */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const drive = getDrive();
  await drive.files.delete({ fileId, supportsAllDrives: true });
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
