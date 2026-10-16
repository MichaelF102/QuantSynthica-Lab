/**
 * Portfolio engine: real constituent prices -> aligned returns -> rebalanced portfolio path,
 * plus covariance-based risk and long-only optimisers. Percent values are in percent units.
 * Nothing is fabricated: if a series cannot be fetched the run fails, and synthetic inputs are flagged.
 */
import { api } from "@/lib/api";
import { Pt, seriesStats, SeriesStats } from "@/lib/analyticsCalc";

export type Rebalance = "Monthly" | "Quarterly" | "Weekly" | "Never";
export interface Holding { ticker: string; weight: number }

export interface PortfolioInput {
  holdings: Holding[];
  benchmark: string;
  start: string;
  end: string;
  initialCapital: number;
  rebalance: Rebalance;
}

export interface PortfolioResult {
  dates: string[];
  value: number[];
  bench: number[];
  returns: number[]; // daily portfolio returns (fractions), length = dates.length - 1
  benchReturns: number[];
  assetReturns: Record<string, number[]>;
  prices: Record<string, number[]>;
  benchPrices: number[];
  rebalance: Rebalance;
  tickers: string[];
  targetWeights: Record<string, number>; // fractions summing to 1
  finalWeights: Record<string, number>; // drifted weights at the end, fractions
  rebalanceCount: number;
  turnover: number; // sum of |trade| / portfolio value at rebalances, fraction
  syntheticTickers: string[];
  pts: Pt[];
  stats: SeriesStats | null;
}

// ---------- weights ----------
/** Scales weights to sum to exactly 100, with 2-dp rounding resolved by largest remainder. */
export function normalizeWeights<T extends { weight: number }>(items: T[]): T[] {
  const clean = items.map((i) => Math.max(0, Number(i.weight) || 0));
  const sum = clean.reduce((a, b) => a + b, 0);
  if (!items.length) return items;
  const raw = sum > 0 ? clean.map((w) => (w / sum) * 100) : clean.map(() => 100 / items.length);
  const floored = raw.map((w) => Math.floor(w * 100) / 100);
  let rest = Math.round((100 - floored.reduce((a, b) => a + b, 0)) * 100);
  const order = raw.map((w, i) => ({ i, frac: w * 100 - Math.floor(w * 100) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; rest > 0 && k < order.length; k++, rest--) floored[order[k].i] += 0.01;
  return items.map((it, i) => ({ ...it, weight: Number(floored[i].toFixed(2)) }));
}

/** Adds a holding at an equal share (1/(n+1)) and scales the others proportionally. */
export function addHolding<T extends { ticker: string; weight: number }>(items: T[], next: T): T[] {
  if (items.some((i) => i.ticker === next.ticker)) return items;
  const share = 100 / (items.length + 1);
  const scaled = items.map((i) => ({ ...i, weight: (i.weight * (100 - share)) / 100 }));
  return normalizeWeights([...scaled, { ...next, weight: share }]);
}

// ---------- data ----------
export interface Series { dates: string[]; close: number[]; synthetic: boolean }
const cache = new Map<string, Promise<Series>>();

export function loadSeries(ticker: string, start: string, end: string, benchmark: string): Promise<Series> {
  const key = `${ticker}|${start}|${end}`;
  let p = cache.get(key);
  if (!p) {
    p = api
      .getMarketData({ ticker, start_date: start, end_date: end, benchmark })
      .then((r) => {
        const bars = (r.bars ?? []).filter((b) => b.date >= start && b.date <= end && b.close > 0);
        if (bars.length < 5) throw new Error(`No price history for ${ticker} in ${start} → ${end}`);
        return { dates: bars.map((b) => b.date), close: bars.map((b) => b.close), synthetic: !!r.summary?.is_synthetic };
      })
      .catch((e) => {
        cache.delete(key);
        throw e;
      });
    cache.set(key, p);
  }
  return p;
}

/** Aligns several tickers on their common trading days; the optional benchmark is forward-filled onto them. */
export async function loadAligned(tickers: string[], start: string, end: string, benchmark?: string) {
  const [series, bench] = await Promise.all([
    Promise.all(tickers.map((t) => loadSeries(t, start, end, benchmark ?? "SPY"))),
    benchmark ? loadSeries(benchmark, start, end, benchmark) : Promise.resolve(null),
  ]);
  const common = series.map((s) => new Set(s.dates)).reduce((a, b) => new Set([...a].filter((d) => b.has(d))));
  const dates = [...common].sort();
  if (dates.length < 20) throw new Error(`Only ${dates.length} common trading days across ${tickers.join(", ")}; widen the date range.`);
  const prices: Record<string, number[]> = {};
  tickers.forEach((t, i) => {
    const m = new Map(series[i].dates.map((d, k) => [d, series[i].close[k]]));
    prices[t] = dates.map((d) => m.get(d)!);
  });
  let benchPrices: number[] | null = null;
  if (bench) {
    const bm = new Map(bench.dates.map((d, k) => [d, bench.close[k]]));
    let last = bench.close[0];
    benchPrices = dates.map((d) => { last = bm.get(d) ?? last; return last; });
  }
  return { dates, prices, benchPrices, synthetic: [...tickers.filter((_, i) => series[i].synthetic), ...(bench?.synthetic && benchmark ? [benchmark] : [])] };
}

// ---------- rebalancing ----------
function isRebalanceDay(prev: string, cur: string, mode: Rebalance): boolean {
  if (mode === "Never") return false;
  if (mode === "Monthly") return prev.slice(0, 7) !== cur.slice(0, 7);
  if (mode === "Quarterly") {
    const q = (d: string) => `${d.slice(0, 4)}Q${Math.floor((Number(d.slice(5, 7)) - 1) / 3)}`;
    return q(prev) !== q(cur);
  }
  const wk = (d: string) => {
    const t = new Date(d + "T00:00:00Z");
    t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
    return t.toISOString().slice(0, 10);
  };
  return wk(prev) !== wk(cur);
}

/** Pure simulation on already-aligned price matrices (exported for tests). */
export function simulate(
  dates: string[],
  prices: Record<string, number[]>,
  benchPrices: number[],
  holdings: Holding[],
  initialCapital: number,
  rebalance: Rebalance
) {
  const tickers = holdings.map((h) => h.ticker);
  const w = normalizeWeights(holdings.map((h) => ({ ...h }))).map((h) => h.weight / 100);
  const n = dates.length;
  const shares = tickers.map((t, i) => (initialCapital * w[i]) / prices[t][0]);
  const value: number[] = [];
  let turnover = 0, rebalanceCount = 0;
  for (let d = 0; d < n; d++) {
    let total = tickers.reduce((s, t, i) => s + shares[i] * prices[t][d], 0);
    if (d > 0 && isRebalanceDay(dates[d - 1], dates[d], rebalance)) {
      let traded = 0;
      tickers.forEach((t, i) => {
        const target = (total * w[i]) / prices[t][d];
        traded += Math.abs(target - shares[i]) * prices[t][d];
        shares[i] = target;
      });
      turnover += traded / total;
      rebalanceCount++;
      total = tickers.reduce((s, t, i) => s + shares[i] * prices[t][d], 0);
    }
    value.push(total);
  }
  const finalTotal = value[n - 1];
  const finalWeights: Record<string, number> = {};
  tickers.forEach((t, i) => (finalWeights[t] = (shares[i] * prices[t][n - 1]) / finalTotal));
  const rets = (x: number[]) => x.slice(1).map((v, i) => v / x[i] - 1);
  const assetReturns: Record<string, number[]> = {};
  tickers.forEach((t) => (assetReturns[t] = rets(prices[t])));
  const b0 = benchPrices[0];
  return {
    value, bench: benchPrices.map((b) => (b / b0) * initialCapital), returns: rets(value), benchReturns: rets(benchPrices),
    assetReturns, finalWeights, targetWeights: Object.fromEntries(tickers.map((t, i) => [t, w[i]])), rebalanceCount, turnover,
  };
}

export async function runPortfolio(input: PortfolioInput): Promise<PortfolioResult> {
  const { holdings, benchmark, start, end, initialCapital, rebalance } = input;
  if (!holdings.length) throw new Error("Add at least one stock to the basket.");
  if (start >= end) throw new Error("Start date must be before end date.");
  const tickers = holdings.map((h) => h.ticker);
  const [assetSeries, benchSeries] = await Promise.all([
    Promise.all(tickers.map((t) => loadSeries(t, start, end, benchmark))),
    loadSeries(benchmark, start, end, benchmark),
  ]);

  // Align on dates present for every holding; the benchmark is forward-filled onto them.
  const common = assetSeries.map((s) => new Set(s.dates)).reduce((a, b) => new Set([...a].filter((d) => b.has(d))));
  const dates = [...common].sort();
  if (dates.length < 20) throw new Error(`Only ${dates.length} common trading days across the basket; widen the date range.`);
  const prices: Record<string, number[]> = {};
  tickers.forEach((t, i) => {
    const m = new Map(assetSeries[i].dates.map((d, k) => [d, assetSeries[i].close[k]]));
    prices[t] = dates.map((d) => m.get(d)!);
  });
  const bm = new Map(benchSeries.dates.map((d, k) => [d, benchSeries.close[k]]));
  let lastB = benchSeries.close[0];
  const benchPrices = dates.map((d) => { lastB = bm.get(d) ?? lastB; return lastB; });

  const sim = simulate(dates, prices, benchPrices, holdings, initialCapital, rebalance);
  let peak = -Infinity;
  const pts: Pt[] = dates.map((date, i) => {
    peak = Math.max(peak, sim.value[i]);
    return { date, value: sim.value[i], bench: sim.bench[i], dd: ((peak - sim.value[i]) / peak) * 100 };
  });
  return {
    dates, ...sim, prices, benchPrices, rebalance, tickers, pts, stats: seriesStats(pts, "Daily"),
    syntheticTickers: [...tickers.filter((_, i) => assetSeries[i].synthetic), ...(benchSeries.synthetic ? [benchmark] : [])],
  };
}

// ---------- covariance & risk ----------
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);

export function covMatrix(r: number[][]): number[][] {
  const n = r.length, T = r[0]?.length ?? 0;
  const m = r.map(mean);
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
    let s = 0;
    for (let t = 0; t < T; t++) s += (r[i][t] - m[i]) * (r[j][t] - m[j]);
    return T > 1 ? s / (T - 1) : 0;
  }));
}

export function corrMatrix(cov: number[][]): number[][] {
  return cov.map((row, i) => row.map((v, j) => (cov[i][i] > 0 && cov[j][j] > 0 ? v / Math.sqrt(cov[i][i] * cov[j][j]) : i === j ? 1 : 0)));
}

/** Percent contribution of each asset to portfolio variance at the given weights (sums to 100). */
export function riskContributions(cov: number[][], w: number[]): number[] {
  const mw = cov.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
  const varP = w.reduce((s, wi, i) => s + wi * mw[i], 0);
  return w.map((wi, i) => (varP > 0 ? ((wi * mw[i]) / varP) * 100 : 0));
}

export const portfolioVol = (cov: number[][], w: number[]) =>
  Math.sqrt(Math.max(0, w.reduce((s, wi, i) => s + wi * cov[i].reduce((a, v, j) => a + v * w[j], 0), 0)));

// ---------- optimisers (long-only, fully invested) ----------
export type OptMethod = "Equal Weight" | "Inv Volatility" | "Risk Parity" | "Min Variance" | "Max Sharpe";

/** Euclidean projection onto the simplex (weights >= 0, sum = 1). */
function projectSimplex(v: number[]): number[] {
  const u = [...v].sort((a, b) => b - a);
  let css = 0, rho = 0, theta = 0;
  u.forEach((x, i) => { css += x; if (x - (css - 1) / (i + 1) > 0) { rho = i + 1; theta = (css - 1) / rho; } });
  return v.map((x) => Math.max(0, x - theta));
}

export function optimise(method: OptMethod, cov: number[][], mu: number[]): number[] {
  const n = cov.length;
  const eq = Array(n).fill(1 / n);
  if (method === "Equal Weight") return eq;
  if (method === "Inv Volatility") {
    const iv = cov.map((r, i) => (r[i] > 0 ? 1 / Math.sqrt(r[i]) : 0));
    const s = iv.reduce((a, b) => a + b, 0);
    return s > 0 ? iv.map((x) => x / s) : eq;
  }
  if (method === "Risk Parity") {
    // Fixed-point iteration on w_i ∝ w_i / RC_i (Spinu-style), converges quickly for PSD cov.
    let w = eq;
    for (let it = 0; it < 500; it++) {
      const rc = riskContributions(cov, w).map((x) => x / 100);
      const next = w.map((wi, i) => (rc[i] > 1e-12 ? wi * Math.pow((1 / n) / rc[i], 0.5) : wi));
      const s = next.reduce((a, b) => a + b, 0);
      w = next.map((x) => x / s);
    }
    return w;
  }
  const step = 0.5 / Math.max(1e-12, Math.max(...cov.map((r, i) => r[i])));
  let w = eq;
  if (method === "Min Variance") {
    for (let it = 0; it < 4000; it++) {
      const g = cov.map((row) => 2 * row.reduce((s, v, j) => s + v * w[j], 0));
      w = projectSimplex(w.map((x, i) => x - step * 0.5 * g[i]));
    }
    return w;
  }
  // Max Sharpe: ascent on (mu·w) / sqrt(w'Σw) with projection.
  for (let it = 0; it < 4000; it++) {
    const sd = portfolioVol(cov, w) || 1e-9;
    const mw = cov.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
    const m = mu.reduce((s, x, i) => s + x * w[i], 0);
    const g = mu.map((x, i) => x / sd - (m * mw[i]) / (sd ** 3));
    w = projectSimplex(w.map((x, i) => x + (0.05 / (Math.max(...mu.map(Math.abs)) / sd + 1e-9)) * 0.01 * g[i] * 100));
  }
  return w;
}

// ---------- derived risk model for widgets ----------
const std = (a: number[]) => {
  const m = mean(a);
  return a.length > 1 ? Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)) : 0;
};

export function riskModel(r: PortfolioResult) {
  const rows = r.tickers.map((t) => r.assetReturns[t]);
  const cov = covMatrix(rows);
  const w = r.tickers.map((t) => r.targetWeights[t]);
  const bvar = std(r.benchReturns) ** 2;
  const maxDD = (prices: number[]) => { let pk = -Infinity, m = 0; prices.forEach((p) => { pk = Math.max(pk, p); m = Math.max(m, ((pk - p) / pk) * 100); }); return m; };
  const beta = (x: number[]) => {
    if (bvar <= 1e-14) return null;
    const mx = mean(x), mb = mean(r.benchReturns);
    return (x.reduce((s, v, i) => s + (v - mx) * (r.benchReturns[i] - mb), 0) / (x.length - 1)) / bvar;
  };
  return {
    cov, corr: corrMatrix(cov), w, rc: riskContributions(cov, w), mu: rows.map(mean),
    portVolAnn: portfolioVol(cov, w) * Math.sqrt(252) * 100,
    assets: r.tickers.map((t, i) => ({
      ticker: t, weight: w[i] * 100, finalWeight: r.finalWeights[t] * 100,
      volAnn: std(rows[i]) * Math.sqrt(252) * 100, beta: beta(rows[i]),
      maxDD: maxDD(r.prices[t]), totalReturn: (r.prices[t][r.prices[t].length - 1] / r.prices[t][0] - 1) * 100,
    })),
    portBeta: beta(r.returns),
  };
}
