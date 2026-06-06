import { describe, it, expect } from 'vitest';
import {
  computePassFail,
  computeSingleMeasure,
  computeCustom,
  computeTestStats,
  parsePassFail,
  parseNumber,
  type CustomColumn,
  type CustomStats,
  type NumberColumnStats,
  type CategoryColumnStats,
} from '@/lib/compute/test-stats';

describe('parse helpers', () => {
  it('parsePassFail handles booleans, numbers, and string variants', () => {
    expect(parsePassFail(true)).toBe(true);
    expect(parsePassFail(false)).toBe(false);
    expect(parsePassFail(1)).toBe(true);
    expect(parsePassFail(0)).toBe(false);
    expect(parsePassFail('pass')).toBe(true);
    expect(parsePassFail('  Success ')).toBe(true);
    expect(parsePassFail('FAIL')).toBe(false);
    expect(parsePassFail('y')).toBe(true);
    expect(parsePassFail('n')).toBe(false);
  });

  it('parsePassFail returns null for blank/unrecognized (excluded from N)', () => {
    expect(parsePassFail('')).toBeNull();
    expect(parsePassFail('   ')).toBeNull();
    expect(parsePassFail(null)).toBeNull();
    expect(parsePassFail(undefined)).toBeNull();
    expect(parsePassFail('maybe')).toBeNull();
  });

  it('parseNumber coerces numeric strings and rejects blanks/junk', () => {
    expect(parseNumber(3.5)).toBe(3.5);
    expect(parseNumber('  12 ')).toBe(12);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber(true)).toBe(1);
  });
});

describe('computePassFail', () => {
  it('computes N, successes, pass rate, and 95% Wald CI', () => {
    const stats = computePassFail(Array.from({ length: 10 }, (_, i) => ({ success: i < 8 })));
    expect(stats.kind).toBe('pass_fail');
    expect(stats.n).toBe(10);
    expect(stats.successes).toBe(8);
    expect(stats.passRate).toBeCloseTo(0.8, 10);
    // 0.8 ± 1.96·√(0.8·0.2/10) = 0.8 ± 0.247926
    expect(stats.ci95.low).toBeCloseTo(0.552074, 5);
    // upper bound clamps to 1
    expect(stats.ci95.high).toBe(1);
    expect(stats.failureModes).toBeUndefined();
  });

  it('tallies failure modes from notes on failed trials only', () => {
    const stats = computePassFail([
      { success: true, note: 'n/a' },
      { success: false, note: 'jam' },
      { success: false, note: 'jam' },
      { success: false, note: 'overheat' },
    ]);
    expect(stats.n).toBe(4);
    expect(stats.successes).toBe(1);
    expect(stats.failureModes).toEqual({ jam: 2, overheat: 1 });
  });

  it('excludes blank rows from N and handles empty input', () => {
    const stats = computePassFail([{ success: '' }, { success: null }]);
    expect(stats.n).toBe(0);
    expect(stats.successes).toBe(0);
    expect(stats.passRate).toBe(0);
    expect(stats.ci95).toEqual({ low: 0, high: 0 });
  });
});

describe('computeSingleMeasure', () => {
  it('computes N, mean, sample stddev, min, max, and 95% CI of the mean', () => {
    const stats = computeSingleMeasure([2, 4, 4, 4, 5, 5, 7, 9].map((value) => ({ value })));
    expect(stats.n).toBe(8);
    expect(stats.mean).toBeCloseTo(5, 10);
    // sample stddev = √(32/7) = 2.138090
    expect(stats.stddev).toBeCloseTo(2.13809, 5);
    expect(stats.min).toBe(2);
    expect(stats.max).toBe(9);
    // 5 ± 1.96·(√(32/7)/√8) = 5 ± 1.481621
    expect(stats.ci95.low).toBeCloseTo(3.518379, 5);
    expect(stats.ci95.high).toBeCloseTo(6.481621, 5);
  });

  it('reports stddev 0 and a degenerate CI for a single value', () => {
    const stats = computeSingleMeasure([{ value: 5 }]);
    expect(stats.n).toBe(1);
    expect(stats.mean).toBe(5);
    expect(stats.stddev).toBe(0);
    expect(stats.ci95).toEqual({ low: 5, high: 5 });
  });

  it('drops blank/non-numeric rows and handles empty input', () => {
    const stats = computeSingleMeasure([
      { value: '3' },
      { value: '' },
      { value: 'oops' },
      { value: 5 },
    ]);
    expect(stats.n).toBe(2);
    expect(stats.mean).toBe(4);

    const empty = computeSingleMeasure([]);
    expect(empty.n).toBe(0);
    expect(empty.mean).toBe(0);
    expect(empty.ci95).toEqual({ low: 0, high: 0 });
  });
});

describe('computeCustom', () => {
  const columns: CustomColumn[] = [
    { name: 'time', kind: 'number' },
    { name: 'result', kind: 'pass_fail' },
    { name: 'mode', kind: 'category' },
    { name: 'notes', kind: 'text' },
  ];
  const rows = [
    { time: 10, result: 'pass', mode: 'auto', notes: 'clean' },
    { time: 12, result: 'fail', mode: 'auto', notes: 'jam' },
    { time: 14, result: 'pass', mode: 'teleop', notes: 'ok' },
  ];

  it('computes per-column stats by kind', () => {
    const stats = computeCustom(rows, columns);

    const time = stats.columns.time as NumberColumnStats;
    expect(time.kind).toBe('number');
    expect(time.n).toBe(3);
    expect(time.mean).toBeCloseTo(12, 10);
    expect(time.min).toBe(10);
    expect(time.max).toBe(14);

    expect(stats.columns.result).toMatchObject({
      kind: 'pass_fail',
      n: 3,
      successes: 2,
    });

    const mode = stats.columns.mode as CategoryColumnStats;
    expect(mode.kind).toBe('category');
    expect(mode.counts).toEqual({ auto: 2, teleop: 1 });

    // text columns are shown, not summarized
    expect(stats.columns.notes).toEqual({ kind: 'text' });

    // no condition column → no per-group breakdown
    expect(stats.byCondition).toBeUndefined();
  });

  it('computes per-group numeric stats when a category column is a condition', () => {
    const condColumns: CustomColumn[] = [
      { name: 'time', kind: 'number' },
      { name: 'surface', kind: 'category', isCondition: true },
    ];
    const condRows = [
      { time: 10, surface: 'tile' },
      { time: 12, surface: 'tile' },
      { time: 20, surface: 'carpet' },
      { time: 24, surface: 'carpet' },
    ];
    const stats = computeCustom(condRows, condColumns);
    expect(stats.byCondition?.column).toBe('surface');

    const tile = stats.byCondition?.groups.tile?.time;
    expect(tile?.n).toBe(2);
    expect(tile?.mean).toBe(11);
    expect(tile?.stddev).toBeCloseTo(Math.SQRT2, 10);

    const carpet = stats.byCondition?.groups.carpet?.time;
    expect(carpet?.mean).toBe(22);
    expect(carpet?.min).toBe(20);
    expect(carpet?.max).toBe(24);
  });

  it('skips per-group breakdown when there are no number columns to group', () => {
    const stats = computeCustom(
      [{ surface: 'tile' }, { surface: 'carpet' }],
      [{ name: 'surface', kind: 'category', isCondition: true }],
    );
    expect(stats.byCondition).toBeUndefined();
  });
});

describe('computeTestStats dispatcher', () => {
  it('routes to the mode-specific compute', () => {
    expect(computeTestStats({ testType: 'pass_fail', rawRows: [{ success: true }] }).kind).toBe(
      'pass_fail',
    );
    expect(computeTestStats({ testType: 'single_measure', rawRows: [{ value: 1 }] }).kind).toBe(
      'single_measure',
    );

    const custom = computeTestStats({
      testType: 'custom',
      rawRows: [{ x: 1 }],
      customColumns: [{ name: 'x', kind: 'number' }],
    }) as CustomStats;
    expect(custom.kind).toBe('custom');
    expect((custom.columns.x as NumberColumnStats).mean).toBe(1);
  });

  it('treats custom mode with no declared columns as empty', () => {
    const custom = computeTestStats({ testType: 'custom', rawRows: [{ x: 1 }] }) as CustomStats;
    expect(custom.columns).toEqual({});
  });
});
