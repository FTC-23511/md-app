import { describe, it, expect } from 'vitest';
import { detectProvider, extractDriveFileId } from '@/lib/media/provider';

describe('detectProvider', () => {
  it('treats YouTube + Vimeo as native passthrough video', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=abc123',
      'https://youtu.be/abc123',
      'https://vimeo.com/123456789',
    ]) {
      const info = detectProvider(url);
      expect(info.passthrough).toBe(true);
      expect(info.media_type).toBe('video');
    }
    expect(detectProvider('https://youtu.be/x').provider).toBe('youtube');
    expect(detectProvider('https://vimeo.com/1').provider).toBe('vimeo');
  });

  it('keeps an existing Drive link as-is and pulls out the file id', () => {
    const info = detectProvider('https://drive.google.com/file/d/FILEID123/view?usp=sharing');
    expect(info.provider).toBe('google_drive');
    expect(info.passthrough).toBe(true);
    expect(info.drive_file_id).toBe('FILEID123');
  });

  it('marks a loose direct image/video link for ingest', () => {
    const img = detectProvider('https://i.imgur.com/abcd.jpg');
    expect(img.provider).toBe('direct');
    expect(img.passthrough).toBe(false);
    expect(img.media_type).toBe('image');

    const vid = detectProvider('https://example.com/clips/run.mp4');
    expect(vid.passthrough).toBe(false);
    expect(vid.media_type).toBe('video');
  });

  it('stores an unknown loose link as-is rather than downloading a web page', () => {
    const info = detectProvider('https://imgur.com/gallery/xyz');
    expect(info.provider).toBe('other');
    expect(info.passthrough).toBe(true);
    expect(info.media_type).toBe('unknown');
  });

  it('does not throw on an unparseable URL', () => {
    const info = detectProvider('not a url');
    expect(info.provider).toBe('other');
    expect(info.passthrough).toBe(true);
  });
});

describe('extractDriveFileId', () => {
  it('handles /file/d/<id>/ and ?id=<id> shapes', () => {
    expect(extractDriveFileId('https://drive.google.com/file/d/ABC_123-x/view')).toBe('ABC_123-x');
    expect(extractDriveFileId('https://drive.google.com/uc?id=ZZZ999&export=download')).toBe(
      'ZZZ999',
    );
    expect(extractDriveFileId('https://drive.google.com/drive/folders/none')).toBeUndefined();
  });
});
