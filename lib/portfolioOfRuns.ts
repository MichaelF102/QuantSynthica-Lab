import { Pt } from "@/lib/analyticsCalc";

/** Daily returns of several runs on the dates they all share. Returns between shared dates compound any gap days in between. */
export interface AlignedReturns { dates: string[]; returns: number[][]; window: { start: string; end: string }; sharedDays: number; shortestRun: number }

export function alignRunReturns(series: Pt[][]): AlignedReturns | null {
  if (series.length < 1 || series.some((s) => s.length < 3)) return null;
  const maps = series.map((s) => new Map(s.map((p) => [p.date, p.value])));
  const common = series[0].map((p) => p.date).filter((d) => maps.every((m) => m.has(d)));
  if (common.length < 3) return null;
  const returns = maps.map((m) => common.slice(1).map((d, i) => { const a = m.get(common[i])!, b = m.get(d)!; return a > 0 ? b / a - 1 : 0; }));
  return { dates: common.slice(1), returns, window: { start: common[0], end: common[common.length - 1] }, sharedDays: common.length, shortestRun: Math.min(...series.map((s) => s.length)) };
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const sd = (a: number[]) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };

export function pearson(a: number[], b: number[]): number | null {
  const sa = sd(a), sb = sd(b);
  if (!(sa > 1e-12) || !(sb > 1e-12)) return null;
  const ma = mean(a), mb = mean(b);
  return a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0) / (a.length - 1) / (sa * sb);
}

/** null where a run has no variance (for example it never held a position in the window). */
export const corrMatrix = (returns: number[][]) => returns.map((a) => returns.map((b) => pearson(a, b)));

export type WeightMode = "equal" | "inverse_vol" | "custom";

/** Weights that sum to 1. Inverse volatility gives quieter runs more weight; a run with no variance falls back to equal weight. */
export function weightsFor(mode: WeightMode, returns: number[][], custom: number[] = []): number[] {
  const n = returns.length;
  const norm = (w: number[]) => { const s = w.reduce((a, b) => a + b, 0); return s > 0 ? w.map((x) => x / s) : Array(n).fill(1 / n); };
  if (mode === "custom") return norm(returns.map((_, i) => Math.max(0, Number.isFinite(custom[i]) ? custom[i] : 0)));
  if (mode === "inverse_vol") { const v = returns.map(sd); return v.every((x) => x > 1e-12) ? norm(v.map((x) => 1 / x)) : Array(n).fill(1 / n); }
  return Array(n).fill(1 / n);
}

/** Daily-rebalanced portfolio: each day's return is the weighted sum of the runs' returns. */
export const portfolioReturns = (returns: number[][], w: number[]) => (returns[0] ?? []).map((_, t) => returns.reduce((s, r, i) => s + w[i] * r[t], 0));

export const equityFrom = (r: number[], base: number) => { let v = base; return [base, ...r.map((x) => (v *= 1 + x))]; };

export function maxDrawdown(equity: number[]) { let pk = -Infinity, m = 0; equity.forEach((v) => { pk = Math.max(pk, v); m = Math.max(m, pk > 0 ? ((pk - v) / pk) * 100 : 0); }); return m; }

/** Share of portfolio variance each run is responsible for (sums to 100), and stand-alone volatilities. */
export function riskContributions(returns: number[][], w: number[]) {
  const p = portfolioReturns(returns, w), vp = sd(p) ** 2;
  const mp = mean(p);
  const cov = returns.map((r) => { const mr = mean(r); return r.reduce((s, x, t) => s + (x - mr) * (p[t] - mp), 0) / (r.length - 1); });
  return { pct: returns.map((_, i) => (vp > 1e-18 ? ((w[i] * cov[i]) / vp) * 100 : 0)), vol: returns.map((r) => sd(r)), portVol: Math.sqrt(vp) };
}

/** Weighted average of stand-alone volatilities over the portfolio's volatility. 1 means no diversification; higher is better. */
export function diversificationRatio(returns: number[][], w: number[]): number | null {
  const vols = returns.map(sd), pv = sd(portfolioReturns(returns, w));
  return pv > 1e-12 ? vols.reduce((s, v, i) => s + w[i] * v, 0) / pv : null;
}
