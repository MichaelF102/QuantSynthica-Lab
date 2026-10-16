/**
 * VaR / Expected Shortfall. All results are LOSS MAGNITUDES as fractions (0.0231 = a 2.31% loss);
 * the UI prints them negative. Multi-day horizons scale historical, parametric and Cornish-Fisher
 * by sqrt(h) (stated in the UI); Monte Carlo compounds h resampled days.
 */
import { mean, std, skewness, kurtosis, normInv, normPdf, quantile, seeded, chi2Sf1 } from "./stats";

export type VarMethod = "Historical" | "Parametric" | "Monte Carlo" | "Cornish-Fisher";
export const VAR_METHODS: VarMethod[] = ["Parametric", "Historical", "Monte Carlo", "Cornish-Fisher"];
export const CONFIDENCES = [0.9, 0.95, 0.975, 0.99];

export interface VarEs { var: number; es: number }

/** Bootstrap h-day compounded returns from daily returns (deterministic seed). */
export function simulateHorizon(returns: number[], horizon: number, sims = 10000): number[] {
  if (returns.length < 20) return [];
  const rand = seeded(returns.length * 2654435761 + horizon);
  const out: number[] = new Array(sims);
  for (let k = 0; k < sims; k++) {
    let v = 1;
    for (let i = 0; i < horizon; i++) v *= 1 + returns[Math.floor(rand() * returns.length)];
    out[k] = v - 1;
  }
  return out;
}

const histVarEs = (r: number[], conf: number): VarEs => {
  const sorted = [...r].sort((a, b) => a - b);
  const q = quantile(sorted, 1 - conf);
  const tail = sorted.filter((x) => x <= q);
  return { var: Math.max(0, -q), es: Math.max(0, -mean(tail.length ? tail : [q])) };
};

function cfZ(z: number, s: number, k: number) {
  return z + ((z * z - 1) * s) / 6 + ((z ** 3 - 3 * z) * k) / 24 - ((2 * z ** 3 - 5 * z) * s * s) / 36;
}

export function varEs(returns: number[], conf: number, method: VarMethod, horizon = 1): VarEs {
  if (returns.length < 20) return { var: NaN, es: NaN };
  const mu = mean(returns), sd = std(returns), h = horizon;
  const alpha = 1 - conf, z = normInv(alpha);
  switch (method) {
    case "Historical": {
      const base = histVarEs(returns, conf);
      return { var: base.var * Math.sqrt(h), es: base.es * Math.sqrt(h) };
    }
    case "Parametric":
      return { var: Math.max(0, -(mu * h + sd * Math.sqrt(h) * z)), es: Math.max(0, -mu * h + (sd * Math.sqrt(h) * normPdf(z)) / alpha) };
    case "Cornish-Fisher": {
      const s = skewness(returns), k = kurtosis(returns);
      const v = Math.max(0, -(mu * h + sd * Math.sqrt(h) * cfZ(z, s, k)));
      // ES: average of CF quantiles across the tail (numerical integration of the quantile function).
      const N = 400;
      let acc = 0;
      for (let i = 1; i <= N; i++) acc += -(mu * h + sd * Math.sqrt(h) * cfZ(normInv((alpha * (i - 0.5)) / N), s, k));
      return { var: v, es: Math.max(v, acc / N) };
    }
    case "Monte Carlo": {
      const sims = simulateHorizon(returns, h);
      const e = histVarEs(sims, conf);
      return e;
    }
  }
}

export function varTable(returns: number[], horizon: number) {
  return VAR_METHODS.map((method) => ({
    method,
    cells: CONFIDENCES.map((c) => ({ conf: c, ...varEs(returns, c, method, horizon) })),
  }));
}

/** Rolling VaR/ES series over `window` observations. */
export function rollingVarEs(returns: number[], dates: string[], window: number, conf: number, method: VarMethod) {
  const out: { date: string; var: number; es: number }[] = [];
  for (let i = window; i <= returns.length; i += 1) {
    const w = returns.slice(i - window, i);
    const r = varEs(w, conf, method === "Monte Carlo" ? "Historical" : method, 1);
    out.push({ date: dates[i], var: r.var, es: r.es });
  }
  return out;
}

export function histogram(values: number[], bins = 40, lo?: number, hi?: number) {
  const min = lo ?? Math.min(...values), max = hi ?? Math.max(...values), step = (max - min) / bins || 1e-9;
  const counts = new Array(bins).fill(0);
  values.forEach((v) => { const k = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / step))); counts[k]++; });
  return counts.map((count, i) => ({ x: min + (i + 0.5) * step, count, lo: min + i * step, hi: min + (i + 1) * step }));
}

/** Kupiec proportion-of-failures and Christoffersen independence tests on a VaR exception series. */
export function backtestVar(returns: number[], dates: string[], conf: number, window = 250) {
  const p = 1 - conf;
  const exc: boolean[] = [];
  const rows: { date: string; ret: number; var: number; hit: boolean }[] = [];
  for (let i = window; i < returns.length; i++) {
    const v = histVarEs(returns.slice(i - window, i), conf).var;
    const hit = returns[i] < -v;
    exc.push(hit);
    rows.push({ date: dates[i + 1], ret: returns[i], var: v, hit });
  }
  const T = exc.length, x = exc.filter(Boolean).length;
  if (T < 30) return null;
  const ll = (pp: number, n: number, k: number) => (k === 0 ? n * Math.log(1 - pp) : k === n ? n * Math.log(pp) : (n - k) * Math.log(1 - pp) + k * Math.log(pp));
  const kupiecLR = -2 * (ll(p, T, x) - ll(x / T, T, x));
  let n00 = 0, n01 = 0, n10 = 0, n11 = 0;
  for (let i = 1; i < exc.length; i++) {
    if (!exc[i - 1] && !exc[i]) n00++; else if (!exc[i - 1] && exc[i]) n01++; else if (exc[i - 1] && !exc[i]) n10++; else n11++;
  }
  const pi01 = n00 + n01 ? n01 / (n00 + n01) : 0, pi11 = n10 + n11 ? n11 / (n10 + n11) : 0, pi = (n01 + n11) / Math.max(1, n00 + n01 + n10 + n11);
  const lg = (a: number, b: number) => (b <= 0 || a <= 0 ? 0 : a * Math.log(b));
  const llInd = lg(n00 + n10, 1 - pi) + lg(n01 + n11, pi);
  const llDep = lg(n00, 1 - pi01) + lg(n01, pi01) + lg(n10, 1 - pi11) + lg(n11, pi11);
  const indLR = Math.max(0, -2 * (llInd - llDep));
  return { rows, T, exceptions: x, rate: x / T, expectedRate: p, kupiecP: chi2Sf1(kupiecLR), christoffersenP: chi2Sf1(indLR) };
}

/** Monte Carlo of portfolio value paths by bootstrapping daily returns. Recorded at `checkpoints` evenly spaced steps. */
export function simulatePaths(returns: number[], days: number, sims: number, start: number, sample = 40, checkpoints = 24) {
  if (returns.length < 20) return null;
  const rand = seeded(returns.length * 40503 + days);
  const cp = Array.from({ length: checkpoints }, (_, i) => Math.max(1, Math.round(((i + 1) * days) / checkpoints)));
  const at: number[][] = cp.map(() => new Array(sims));
  const finals: number[] = new Array(sims);
  const samplePaths: number[][] = Array.from({ length: Math.min(sample, sims) }, () => [start]);
  for (let k = 0; k < sims; k++) {
    let v = start, c = 0;
    for (let d = 1; d <= days; d++) {
      v *= 1 + returns[Math.floor(rand() * returns.length)];
      if (d === cp[c]) { at[c][k] = v; if (k < samplePaths.length) samplePaths[k].push(v); c++; }
    }
    finals[k] = v;
  }
  const pct = (arr: number[], p: number) => quantile([...arr].sort((a, b) => a - b), p);
  const bands = cp.map((step, i) => ({ step, p5: pct(at[i], 0.05), p25: pct(at[i], 0.25), p50: pct(at[i], 0.5), p75: pct(at[i], 0.75), p95: pct(at[i], 0.95) }));
  return { checkpoints: [0, ...cp], bands, samplePaths, finals, median: pct(finals, 0.5), p5: pct(finals, 0.05), p95: pct(finals, 0.95), probLoss: finals.filter((f) => f < start).length / sims };
}
