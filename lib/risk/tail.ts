/** Tail-risk helpers: rolling VaR, QQ data, tail-vs-normal counts, extreme events, component and market/idiosyncratic VaR. */
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";
import { mean, std, normInv, normCdf, quantile } from "./stats";
import { varEs, VarMethod, simulateHorizon } from "./var";

export function qqPoints(returns: number[]) {
  const m = mean(returns), s = std(returns);
  if (returns.length < 20 || s === 0) return [];
  const sorted = [...returns].sort((a, b) => a - b);
  const n = sorted.length;
  return sorted.map((r, i) => ({ theoretical: normInv((i + 0.5) / n), empirical: (r - m) / s }));
}

/** Observed number of days beyond k sigmas on the downside vs the count a normal distribution would give. */
export function tailComparison(returns: number[]) {
  const m = mean(returns), s = std(returns), n = returns.length;
  return [2, 3, 4, 5].map((k) => ({
    level: `≤ -${k}σ`,
    observed: returns.filter((r) => (r - m) / s <= -k).length,
    expected: Number((n * normCdf(-k)).toFixed(2)),
  }));
}

export function extremeEvents(r: PortfolioResult, value: number, count = 5) {
  return r.returns.map((ret, i) => ({ date: r.dates[i + 1], ret })).sort((a, b) => a.ret - b.ret).slice(0, count)
    .map((e) => ({ ...e, loss: -e.ret * value }));
}

export function varVsConfidence(returns: number[], horizon: number) {
  const confs = [0.9, 0.925, 0.95, 0.975, 0.99, 0.995];
  const methods: VarMethod[] = ["Parametric", "Historical", "Monte Carlo", "Cornish-Fisher"];
  return confs.map((c) => {
    const row: Record<string, number> = { conf: c * 100 };
    methods.forEach((m) => (row[m] = -varEs(returns, c, m, horizon).var * 100));
    return row;
  });
}

export const HORIZON_GRID = [1, 2, 5, 10, 20, 40, 60];

/** VaR across holding periods: sqrt-of-time (historical/parametric) vs simulated compounding. */
export function horizonScaling(returns: number[], conf: number) {
  return HORIZON_GRID.map((h) => ({
    horizon: h,
    Parametric: -varEs(returns, conf, "Parametric", h).var * 100,
    Historical: -varEs(returns, conf, "Historical", h).var * 100,
    "Monte Carlo": -varEs(returns, conf, "Monte Carlo", h).var * 100,
  }));
}

/** Rolling VaR/ES of a return series (window in observations). */
export function rolling(returns: number[], dates: string[], win: number, conf: number, method: VarMethod) {
  const out: { date: string; var: number; es: number }[] = [];
  for (let i = win; i <= returns.length; i++) {
    const e = varEs(returns.slice(i - win, i), conf, method, 1);
    out.push({ date: dates[i], var: -e.var * 100, es: -e.es * 100 });
  }
  return out;
}

/** Parametric component VaR per asset: share of portfolio VaR (Euler) and the amount. */
export function componentVar(r: PortfolioResult, conf: number, value: number) {
  const m = riskModel(r);
  const total = varEs(r.returns, conf, "Parametric", 1).var;
  return m.assets.map((a, i) => ({ ticker: a.ticker, share: m.rc[i], amount: (m.rc[i] / 100) * total * value, weight: a.weight }));
}

/** Systematic (benchmark) vs idiosyncratic share of return variance: R² of the portfolio on the benchmark. */
export function marketVsSpecific(r: PortfolioResult) {
  const x = r.benchReturns, y = r.returns;
  const mx = mean(x), my = mean(y);
  const sxy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0), sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0), syy = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const r2 = sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : 0;
  return { systematic: r2 * 100, idiosyncratic: (1 - r2) * 100 };
}

export { quantile, simulateHorizon };
