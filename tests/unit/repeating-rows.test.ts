import { describe, it, expect } from 'vitest';
import { parseRepeatingRows } from '@/scripts/fallback/parsers/repeating-rows';

describe('parseRepeatingRows', () => {
  const single = [{ name: 'path', label: 'File path' }];
  const multi = [
    { name: 'metric', label: 'Metric' },
    { name: 'was', label: 'Was' },
    { name: 'now', label: 'Now' },
  ];

  it('parses a single-column block (e.g. Software Change Log files_changed)', () => {
    const text = ['- lib/drive/HeadingController.java', '- test/drive/DriveControllerTest.java'].join(
      '\n',
    );
    expect(parseRepeatingRows(text, single)).toEqual([
      { path: 'lib/drive/HeadingController.java' },
      { path: 'test/drive/DriveControllerTest.java' },
    ]);
  });

  it('parses a multi-column block by **Label:** segments', () => {
    const text = [
      '- **Metric:** cycle time | **Was:** 4.2s | **Now:** 3.1s',
      '- **Metric:** mass | **Was:** 120g | **Now:** 95g',
    ].join('\n');
    expect(parseRepeatingRows(text, multi)).toEqual([
      { metric: 'cycle time', was: '4.2s', now: '3.1s' },
      { metric: 'mass', was: '120g', now: '95g' },
    ]);
  });

  it('ignores blank lines, the template placeholder, and non-bullet text', () => {
    const text = ['Some intro line that is not a row.', '', '- lib/real/File.java', '   '].join('\n');
    expect(parseRepeatingRows(text, single)).toEqual([{ path: 'lib/real/File.java' }]);
  });

  it('returns an empty array for an empty section', () => {
    expect(parseRepeatingRows('', single)).toEqual([]);
    expect(parseRepeatingRows('   \n  ', single)).toEqual([]);
  });

  it('drops multi-column rows where no labelled segment matched', () => {
    const text = ['- nonsense with no labels', '- **Metric:** torque | **Now:** 2.0Nm'].join('\n');
    expect(parseRepeatingRows(text, multi)).toEqual([
      { metric: 'torque', was: '', now: '2.0Nm' },
    ]);
  });
});
