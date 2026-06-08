/**
 * Decision Log auto-compute — weighted trade-off matrix.
 *
 * Spec: docs/phase2/02-forms-and-detail.md §1 (`matrix` block: criteria rows
 * `{name, weight}` weights sum to 1.0 × option columns, score 1–5 per cell;
 * weighted totals + winner auto-computed) and §2 (triggered depth); brief
 * docs/briefs/2026-06-04-2e-decision-log.md (Q2: weights → warn + auto-normalize).
 *
 * Like lib/compute/test-stats.ts, this is Phase 2's named safety net
 * (CLAUDE.md rule 6 / 00-plan.md §3 decision 1): the compute lives in
 * TypeScript — NOT a DB trigger — so the same function runs on the app submit
 * path AND in the fallback importer. Strictly pure: no DB access, no Claude
 * calls, no I/O. Unit-tested in tests/unit/decision-matrix.test.ts.
 *
 * The output is stored verbatim in `decision_logs.extras.matrix` (alongside the
 * raw cells) and surfaced read-only via the `computed-readonly` block — the
 * filer never types a weighted total. Values are full precision; display rounds.
 */

// The forgiving cell type + numeric parser are single-sourced in test-stats
// (the first compute module); reuse rather than duplicate.
import { parseNumber, type Cell } from './test-stats';

// Raw weights rarely sum to exactly 1.0 after editing; only flag a normalization
// when they're off by more than this. Same epsilon guards tie detection.
const EPSILON = 1e-9;

// ---- Wire-format input types ----------------------------------------------
// What the `matrix` block (and the importer) serialize and feed back on every
// (re)compute. Cells are forgiving (string | number | …) like the raw-data-table.

/** A criterion row: a name and its (pre-normalization) weight. */
export interface MatrixCriterion {
  name: string;
  weight: Cell;
}

export interface MatrixInput {
  /** Criteria rows, in display order. */
  criteria: MatrixCriterion[];
  /** Option column labels, in display order. */
  options: string[];
  /** scores[optionName][criterionName] = 1–5 (forgiving; missing → 0). */
  scores: Record<string, Record<string, Cell>>;
}

// ---- Output types ---------------------------------------------------------

export interface MatrixOptionResult {
  option: string;
  weightedTotal: number;
  isWinner: boolean;
}

export interface MatrixStats {
  kind: 'decision_matrix';
  /** Normalized criterion weights (sum to 1.0), keyed by criterion name. */
  normalizedWeights: Record<string, number>;
  /** Sum of the raw weights as entered. */
  rawWeightSum: number;
  /**
   * True when the raw weights didn't already sum to 1.0 (or summed to ≤0) and
   * were normalized — surfaced as a "weights were normalized" warning (brief Q2).
   */
  weightsWereNormalized: boolean;
  /** Per-option weighted totals, in input order. */
  options: MatrixOptionResult[];
  /** Option with the single highest weighted total; null when empty or tied. */
  winner: string | null;
  /** True when two or more options share the top weighted total. */
  tie: boolean;
}

// ---- Compute --------------------------------------------------------------

export function computeDecisionMatrix(input: MatrixInput): MatrixStats {
  const criteria = input.criteria ?? [];
  const options = input.options ?? [];
  const scores = input.scores ?? {};

  // Parse raw weights (blank/non-numeric → 0).
  const rawWeights = criteria.map((c) => parseNumber(c.weight) ?? 0);
  const rawWeightSum = rawWeights.reduce((a, b) => a + b, 0);

  // Warn + auto-normalize so a fast filer isn't blocked on weights summing to
  // exactly 1.0 (brief Q2). When the sum is ≤0 there's nothing to normalize
  // against, so fall back to equal weights to keep the compute well-defined.
  const usableSum = rawWeightSum > 0;
  const normalizedWeights: Record<string, number> = {};
  criteria.forEach((c, i) => {
    if (usableSum) normalizedWeights[c.name] = (rawWeights[i] ?? 0) / rawWeightSum;
    else if (criteria.length > 0) normalizedWeights[c.name] = 1 / criteria.length;
    else normalizedWeights[c.name] = 0;
  });
  const weightsWereNormalized = !usableSum || Math.abs(rawWeightSum - 1) > EPSILON;

  // Weighted total per option = Σ normalizedWeight(criterion) · score(option, criterion).
  const results: MatrixOptionResult[] = options.map((option) => {
    const optionScores = scores[option] ?? {};
    let total = 0;
    for (const c of criteria) {
      const score = parseNumber(optionScores[c.name]) ?? 0;
      total += (normalizedWeights[c.name] ?? 0) * score;
    }
    return { option, weightedTotal: total, isWinner: false };
  });

  // Winner = single highest total; a shared top (within epsilon) is a tie.
  let winner: string | null = null;
  let tie = false;
  if (results.length > 0) {
    const maxTotal = Math.max(...results.map((r) => r.weightedTotal));
    const top = results.filter((r) => Math.abs(r.weightedTotal - maxTotal) <= EPSILON);
    const sole = top.length === 1 ? top[0] : undefined;
    if (sole) {
      winner = sole.option;
      sole.isWinner = true;
    } else {
      tie = true;
    }
  }

  return {
    kind: 'decision_matrix',
    normalizedWeights,
    rawWeightSum,
    weightsWereNormalized,
    options: results,
    winner,
    tie,
  };
}
