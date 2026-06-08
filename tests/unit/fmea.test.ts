import { describe, it, expect } from 'vitest';
import { computeFmea, type FmeaRow } from '@/lib/compute/fmea';

describe('computeFmea', () => {
  it('computes RPN = S×L×D per row and finds the worst failure mode', () => {
    const rows: FmeaRow[] = [
      { failure_mode: 'jam', severity: 8, likelihood: 3, detectability: 5 }, // 120
      { failure_mode: 'overheat', severity: 9, likelihood: 2, detectability: 4 }, // 72
    ];
    const stats = computeFmea(rows);

    expect(stats.kind).toBe('fmea');
    expect(stats.rows[0]!.rpn).toBe(120);
    expect(stats.rows[1]!.rpn).toBe(72);
    expect(stats.maxRpn).toBe(120);
    expect(stats.topRisk).toBe('jam');
  });

  it('passes through descriptive fields and trims text', () => {
    const stats = computeFmea([
      {
        failure_mode: '  belt slip ',
        effect: 'drivetrain stalls',
        severity: 7,
        likelihood: 4,
        detectability: 2,
        mitigation: 'tensioner',
      },
    ]);
    expect(stats.rows[0]!).toMatchObject({
      failureMode: 'belt slip',
      effect: 'drivetrain stalls',
      mitigation: 'tensioner',
      rpn: 56,
    });
  });

  it('reports null RPN when a factor is blank/non-numeric and excludes it from the max', () => {
    const stats = computeFmea([
      { failure_mode: 'jam', severity: 8, likelihood: 3, detectability: 5 }, // 120
      { failure_mode: 'wobble', severity: 5, likelihood: '', detectability: 3 }, // null
      { failure_mode: 'drift', severity: 'oops', likelihood: 2, detectability: 2 }, // null
    ]);
    expect(stats.rows[1]!.rpn).toBeNull();
    expect(stats.rows[2]!.rpn).toBeNull();
    expect(stats.maxRpn).toBe(120);
    expect(stats.topRisk).toBe('jam');
  });

  it('parses numeric strings as factors', () => {
    const stats = computeFmea([
      { failure_mode: 'jam', severity: '8', likelihood: '3', detectability: '5' },
    ]);
    expect(stats.rows[0]!.rpn).toBe(120);
  });

  it('handles empty input', () => {
    const stats = computeFmea([]);
    expect(stats.rows).toEqual([]);
    expect(stats.maxRpn).toBeNull();
    expect(stats.topRisk).toBeNull();
  });
});
