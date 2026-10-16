/** Euler risk decomposition and single-index (benchmark) systematic/idiosyncratic split. */
import { PortfolioResult, covMatrix, portfolioVol, riskModel } from "@/lib/portfolio/engine";
import { mean, normInv } from "./stats";

export interface Decomp {
  tickers: string[]; w: number[]; volAnn: number[]; portVolAnn: number;
  /** Share of portfolio variance (%), sums to 100. */
  share: number[];
  /** Contribution to annualised portfolio volatility, in percentage points; sums to portVolAnn. */
  volPoints: number[];
  /** Marginal contribution to volatility: d sigma_p / d w_i (annualised, in %). */
  marginal: number[];
  /** Parametric marginal and component VaR (percent of portfolio, 1-day). Component sums to total VaR. */
  mVaR: number[]; cVaR: number[]; totalVaR: number;
  /** R² of each asset on the benchmark (share of its variance that is systematic), %. */
  assetSystematic: number[];
  diversificationRatio: number; effectiveBets: number;
  /** pairwise[i][j] = w_i w_j cov_ij / sigma_p² * 100; the whole matrix sums to 100. */
  pairwise: number[][];
}

export function decompose(r: PortfolioResult, conf: number): Decomp {
  const m = riskModel(r);
  const { cov, w } = m;
  const n = w.length, k = Math.sqrt(252) * 100;
  const sp = portfolioVol(cov, w);
  const mw = cov.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
  const z = -normInv(1 - conf);
  const mu = mean(r.returns);
  const share = w.map((wi, i) => (sp > 0 ? ((wi * mw[i]) / (sp * sp)) * 100 : 0));
  const marginal = mw.map((x) => (sp > 0 ? (x / sp) * k : 0));
  // Parametric VaR_p = -mu_p + z sigma_p; component_i = w_i * z * (Σw)_i / sigma_p - w_i mu_i  (sums to VaR_p).
  const mVaR = mw.map((x, i) => (sp > 0 ? (z * x) / sp - m.mu[i] : 0) * 100);
  const cVaR = mVaR.map((x, i) => w[i] * x);
  const totalVaR = (z * sp - mu) * 100;
  const bvar = r.benchReturns.reduce((s, v) => s + (v - mean(r.benchReturns)) ** 2, 0);
  const assetSystematic = r.tickers.map((t) => {
    const a = r.assetReturns[t], ma = mean(a), mb = mean(r.benchReturns);
    const sab = a.reduce((s, v, i) => s + (v - ma) * (r.benchReturns[i] - mb), 0), saa = a.reduce((s, v) => s + (v - ma) ** 2, 0);
    return saa > 0 && bvar > 0 ? ((sab * sab) / (saa * bvar)) * 100 : 0;
  });
  const vols = cov.map((row, i) => Math.sqrt(row[i]));
  return {
    tickers: r.tickers, w, volAnn: vols.map((v) => v * k), portVolAnn: sp * k, share, volPoints: share.map((s) => (s / 100) * sp * k), marginal,
    mVaR, cVaR, totalVaR, assetSystematic,
    diversificationRatio: sp > 0 ? w.reduce((s, wi, i) => s + wi * vols[i], 0) / sp : 1,
    effectiveBets: 1 / Math.max(1e-12, share.reduce((s, x) => s + (x / 100) ** 2, 0)),
    pairwise: cov.map((row, i) => row.map((c, j) => (sp > 0 ? ((w[i] * w[j] * c) / (sp * sp)) * 100 : 0))),
  };
}

/** Rolling Euler shares over `win` days (subsampled to ~`max` points). */
export function rollingShares(r: PortfolioResult, win: number, max = 80) {
  const n = r.returns.length, w = r.tickers.map((t) => r.targetWeights[t]);
  const out: Record<string, number | string>[] = [];
  const step = Math.max(1, Math.ceil((n - win) / max));
  for (let i = win; i <= n; i += step) {
    const rows = r.tickers.map((t) => r.assetReturns[t].slice(i - win, i));
    const cov = covMatrix(rows), sp = portfolioVol(cov, w);
    const mw = cov.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
    const row: Record<string, number | string> = { date: r.dates[i] };
    r.tickers.forEach((t, a) => (row[t] = sp > 0 ? ((w[a] * mw[a]) / (sp * sp)) * 100 : 0));
    out.push(row);
  }
  return out;
}

/** Rolling R² of the portfolio on the benchmark: systematic vs idiosyncratic share of variance. */
export function rollingSystematic(r: PortfolioResult, win: number, max = 120) {
  const out: { date: string; systematic: number; idiosyncratic: number }[] = [];
  const n = r.returns.length, step = Math.max(1, Math.ceil((n - win) / max));
  for (let i = win; i <= n; i += step) {
    const y = r.returns.slice(i - win, i), x = r.benchReturns.slice(i - win, i), mx = mean(x), my = mean(y);
    const sxy = x.reduce((s, v, k) => s + (v - mx) * (y[k] - my), 0), sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0), syy = y.reduce((s, v) => s + (v - my) ** 2, 0);
    const r2 = sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : 0;
    out.push({ date: r.dates[i], systematic: r2 * 100, idiosyncratic: (1 - r2) * 100 });
  }
  return out;
}

export function aggregateBy(keys: string[], values: number[]) {
  const m = new Map<string, number>();
  keys.forEach((k, i) => m.set(k, (m.get(k) ?? 0) + values[i]));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
