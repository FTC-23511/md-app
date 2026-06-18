#!/usr/bin/env tsx
/**
 * Dev-only: verify the Google Drive service-account setup end-to-end (2F).
 * Uploads a tiny test image into the configured Shared Drive folder, makes it
 * link-viewable, prints the link, then deletes it. Proves the whole chain —
 * credentials, Shared Drive access, and the auto-sharing step — without the app
 * or a browser. NOT imported by the app.
 *
 * Reads credentials from .env.local:
 *   GOOGLE_DRIVE_MEDIA_FOLDER_ID=<folder id>
 *   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=<absolute path to the key .json>   (or)
 *   GOOGLE_SERVICE_ACCOUNT_KEY=<inline key JSON>
 *
 * Run: pnpm tsx scripts/dev/drive-smoke.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { uploadToDrive, deleteDriveFile } from '../../lib/media/drive';

function loadEnvFile(envPath: string): void {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

// 1×1 transparent PNG.
const TEST_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function main(): Promise<void> {
  loadEnvFile(path.resolve('.env.local'));

  if (!process.env.GOOGLE_DRIVE_MEDIA_FOLDER_ID) {
    console.error('GOOGLE_DRIVE_MEDIA_FOLDER_ID is not set in .env.local.');
    process.exit(1);
  }

  const bytes = Buffer.from(TEST_PNG_BASE64, 'base64');
  console.log('Uploading a 1×1 test PNG to the MD-media Shared Drive folder…');
  const up = await uploadToDrive({
    bytes,
    filename: 'md-app-drive-smoke-test.png',
    mimeType: 'image/png',
  });
  console.log('  ✓ uploaded');
  console.log('    link:     ', up.webViewLink);
  console.log('    thumbnail:', up.thumbnailUrl);
  console.log('    fileId:   ', up.fileId);

  console.log('Cleaning up (deleting the test file)…');
  await deleteDriveFile(up.fileId);
  console.log('  ✓ deleted');

  console.log(
    '\n✓ Drive round-trip OK — service account, Shared Drive, and link-sharing all work.',
  );
}

main().catch((err: unknown) => {
  console.error('\n✗ Drive smoke failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
