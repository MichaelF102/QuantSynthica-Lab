/**
 * Probabilistic and deflated Sharpe ratios (Bailey and Lopez de Prado), plus a plateau measure for parameter sweeps.
 * Sharpe ratios here are per observation (daily), not annualised, because the formulas use the sample length T.
 */
import { normCdf, normInv, mean, std, skewness, kurtosis } from "@/lib/risk/stats";

const EULER = 0.5772156649015329;

export interface SharpeStats { sr: number; skew: number; kurt: number; n: number }

/** Per-observation Sharpe (risk-free 0) with skew and raw (not excess) kurtosis. */
export function sharpeStats(returns: number[]): SharpeStats | null {
  if (returns.length < 30) return null;
  const s = std(returns);
  if (!(s > 1e-12)) return null;
  return { sr: mean(returns) / s, skew: skewness(returns), kurt: kurtosis(returns) + 3, n: returns.length };
}

const denom = (st: SharpeStats, sr: number) => Math.sqrt(Math.max(1e-12, 1 - st.skew * sr + ((st.kurt - 1) / 4) * sr * sr));

/** Probability that the true Sharpe exceeds `benchmark` (per-observation units), given the sample's length, skew and tails. */
export function psr(st: SharpeStats, benchmark = 0): number {
  return normCdf(((st.sr - benchmark) * Math.sqrt(st.n - 1)) / denom(st, st.sr));
}

/**
 * The Sharpe that the best of `trials` unskilled strategies would reach by chance, given the spread of Sharpe ratios
 * tried (`trialSharpes`, per-observation units). With fewer than two trials there is nothing to deflate by.
 */
export function expectedMaxSharpe(trialSharpes: number[], trials: number): number {
  if (trials < 2 || trialSharpes.length < 2) return 0;
  const v = std(trialSharpes) ** 2;
  return Math.sqrt(v) * ((1 - EULER) * normInv(1 - 1 / trials) + EULER * normInv(1 - 1 / (trials * Math.E)));
}

/** Probability the Sharpe is real once the number of configurations tried is accounted for. */
export function dsr(st: SharpeStats, trialSharpes: number[], trials: number): { value: number; threshold: number } {
  const threshold = expectedMaxSharpe(trialSharpes, trials);
  return { value: psr(st, threshold), threshold };
}

export interface SweepStability { cells: number; best: number; median: number; plateauShare: number; bestVsMedian: number | null; verdict: "stable" | "fragile" | "unprofitable" }

/**
 * A good parameter choice sits on a plateau: many neighbouring settings do almost as well. Plateau share is the portion of
 * tested settings reaching at least 75% of the best Sharpe. Fragile means a lone peak.
 */
export function sweepStability(sharpes: number[]): SweepStability | null {
  const xs = sharpes.filter(Number.isFinite);
  if (xs.length < 4) return null;
  const sorted = [...xs].sort((a, b) => a - b), best = sorted[sorted.length - 1], median = sorted[Math.floor(sorted.length / 2)];
  if (best <= 0) return { cells: xs.length, best, median, plateauShare: 0, bestVsMedian: null, verdict: "unprofitable" };
  const share = (xs.filter((x) => x >= 0.75 * best).length / xs.length) * 100;
  return { cells: xs.length, best, median, plateauShare: share, bestVsMedian: median > 0 ? best / median : null, verdict: share >= 35 ? "stable" : "fragile" };
}
