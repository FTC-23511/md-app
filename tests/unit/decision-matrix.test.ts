import { describe, it, expect } from 'vitest';
import { computeDecisionMatrix, type MatrixInput } from '@/lib/compute/decision-matrix';

describe('computeDecisionMatrix', () => {
  it('computes weighted totals and a single winner when weights already sum to 1.0', () => {
    const input: MatrixInput = {
      criteria: [
        { name: 'speed', weight: 0.5 },
        { name: 'cost', weight: 0.5 },
      ],
      options: ['A', 'B'],
      scores: {
        A: { speed: 4, cost: 2 }, // 0.5·4 + 0.5·2 = 3.0
        B: { speed: 1, cost: 4 }, // 0.5·1 + 0.5·4 = 2.5
      },
    };
    const stats = computeDecisionMatrix(input);

    expect(stats.kind).toBe('decision_matrix');
    expect(stats.rawWeightSum).toBeCloseTo(1, 10);
    expect(stats.weightsWereNormalized).toBe(false);
    expect(stats.normalizedWeights).toEqual({ speed: 0.5, cost: 0.5 });

    expect(stats.options[0]!).toMatchObject({ option: 'A', isWinner: true });
    expect(stats.options[0]!.weightedTotal).toBeCloseTo(3.0, 10);
    expect(stats.options[1]!).toMatchObject({ option: 'B', isWinner: false });
    expect(stats.options[1]!.weightedTotal).toBeCloseTo(2.5, 10);

    expect(stats.winner).toBe('A');
    expect(stats.tie).toBe(false);
  });

  it('warns + auto-normalizes when raw weights do not sum to 1.0 (brief Q2)', () => {
    const input: MatrixInput = {
      criteria: [
        { name: 'speed', weight: 2 }, // normalizes to 0.5
        { name: 'cost', weight: 2 }, // normalizes to 0.5
      ],
      options: ['A', 'B'],
      scores: {
        A: { speed: 4, cost: 2 },
        B: { speed: 1, cost: 4 },
      },
    };
    const stats = computeDecisionMatrix(input);

    expect(stats.rawWeightSum).toBe(4);
    expect(stats.weightsWereNormalized).toBe(true);
    expect(stats.normalizedWeights).toEqual({ speed: 0.5, cost: 0.5 });
    // Same normalized weights → same totals/winner as the summed-to-1 case.
    expect(stats.options[0]!.weightedTotal).toBeCloseTo(3.0, 10);
    expect(stats.winner).toBe('A');
  });

  it('flags a tie and reports no winner when options share the top total', () => {
    const input: MatrixInput = {
      criteria: [
        { name: 'speed', weight: 0.5 },
        { name: 'cost', weight: 0.5 },
      ],
      options: ['A', 'B'],
      scores: {
        A: { speed: 4, cost: 2 }, // 3.0
        B: { speed: 2, cost: 4 }, // 3.0
      },
    };
    const stats = computeDecisionMatrix(input);

    expect(stats.tie).toBe(true);
    expect(stats.winner).toBeNull();
    expect(stats.options.every((o) => o.isWinner === false)).toBe(true);
  });

  it('falls back to equal weights when raw weights sum to zero', () => {
    const input: MatrixInput = {
      criteria: [
        { name: 'speed', weight: 0 },
        { name: 'cost', weight: 0 },
      ],
      options: ['A', 'B'],
      scores: {
        A: { speed: 5, cost: 1 }, // 0.5·5 + 0.5·1 = 3.0
        B: { speed: 1, cost: 1 }, // 1.0
      },
    };
    const stats = computeDecisionMatrix(input);

    expect(stats.weightsWereNormalized).toBe(true);
    expect(stats.normalizedWeights).toEqual({ speed: 0.5, cost: 0.5 });
    expect(stats.options[0]!.weightedTotal).toBeCloseTo(3.0, 10);
    expect(stats.winner).toBe('A');
  });

  it('parses string cells and treats missing scores as zero', () => {
    const input: MatrixInput = {
      criteria: [
        { name: 'speed', weight: '0.5' },
        { name: 'cost', weight: '0.5' },
      ],
      options: ['A', 'B'],
      scores: {
        A: { speed: '4' }, // cost missing → 0; total = 0.5·4 = 2.0
        B: { speed: '3', cost: '3' }, // 3.0
      },
    };
    const stats = computeDecisionMatrix(input);

    expect(stats.options[0]!.weightedTotal).toBeCloseTo(2.0, 10);
    expect(stats.options[1]!.weightedTotal).toBeCloseTo(3.0, 10);
    expect(stats.winner).toBe('B');
  });

  it('handles an empty matrix', () => {
    const stats = computeDecisionMatrix({ criteria: [], options: [], scores: {} });
    expect(stats.options).toEqual([]);
    expect(stats.winner).toBeNull();
    expect(stats.tie).toBe(false);
    expect(stats.normalizedWeights).toEqual({});
  });
});
