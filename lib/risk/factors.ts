/**
 * Factor model on ETF/index proxy factors (long-short ETF pairs). These are tradable-proxy factors, not the academic
 * Fama-French series, and are described that way in the UI. OLS with standard errors and p-values.
 */
import { loadSeries } from "@/lib/portfolio/engine";
import { mean, std, tPValue, quantile } from "./stats";
import type { Market } from "./presets";
import type { Frequency } from "@/lib/analyticsCalc";

export interface FactorDef { key: string; label: string; long: string; short?: string; desc: string }

export const FACTORS: Record<Market, FactorDef[]> = {
  US: [
    { key: "MKT", label: "Market (MKT)", long: "SPY", desc: "S&P 500 ETF return" },
    { key: "SIZE", label: "Size (SMB)", long: "IWM", short: "SPY", desc: "Russell 2000 minus S&P 500" },
    { key: "VALUE", label: "Value (HML)", long: "IVE", short: "IVW", desc: "S&P 500 Value minus S&P 500 Growth" },
    { key: "MOM", label: "Momentum (MOM)", long: "MTUM", short: "SPY", desc: "MSCI USA Momentum minus S&P 500" },
    { key: "QUAL", label: "Quality (QMJ)", long: "QUAL", short: "SPY", desc: "MSCI USA Quality minus S&P 500" },
    { key: "LOWVOL", label: "Low Volatility (LV)", long: "USMV", short: "SPY", desc: "MSCI USA Min Vol minus S&P 500" },
  ],
  India: [
    { key: "MKT", label: "Market (MKT)", long: "^NSEI", desc: "NIFTY 50 return" },
    { key: "SIZE", label: "Size (Mid-cap)", long: "MID150BEES.NS", short: "NIFTYBEES.NS", desc: "Nifty Midcap 150 ETF minus Nifty 50 ETF" },
    { key: "VALUE", label: "Value", long: "MOVALUE.NS", short: "NIFTYBEES.NS", desc: "Nifty 500 Value 50 ETF minus Nifty 50 ETF" },
    { key: "MOM", label: "Momentum", long: "MOMENTUM.NS", short: "NIFTYBEES.NS", desc: "Nifty 200 Momentum 30 ETF minus Nifty 50 ETF" },
    { key: "QUAL", label: "Quality", long: "MOQUALITY.NS", short: "NIFTYBEES.NS", desc: "Nifty 200 Quality 30 ETF minus Nifty 50 ETF" },
    { key: "LOWVOL", label: "Low Volatility", long: "LOWVOLIETF.NS", short: "NIFTYBEES.NS", desc: "Nifty 100 Low Vol 30 ETF minus Nifty 50 ETF" },
  ],
};

// ---------- OLS ----------
function invert(a: number[][]): number[][] {
  const n = a.length;
  const m = a.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-14) throw new Error("Singular design matrix: factors are collinear");
    [m[c], m[p]] = [m[p], m[c]];
    const d = m[c][c];
    for (let j = 0; j < 2 * n; j++) m[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = m[r][c]; for (let j = 0; j < 2 * n; j++) m[r][j] -= f * m[c][j]; }
  }
  return m.map((r) => r.slice(n));
}

export interface OlsResult { names: string[]; beta: number[]; se: number[]; t: number[]; p: number[]; r2: number; adjR2: number; n: number; resid: number[]; fitted: number[]; sigma2: number }

/** y on [1, X...]; `names[0]` is the intercept. */
export function ols(y: number[], X: number[][], names: string[]): OlsResult {
  const n = y.length, k = X.length + 1;
  if (n <= k + 5) throw new Error(`Only ${n} observations for ${k} parameters`);
  const cols = [Array(n).fill(1), ...X];
  const xtx = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => cols[i].reduce((s, v, t) => s + v * cols[j][t], 0)));
  const xty = cols.map((c) => c.reduce((s, v, t) => s + v * y[t], 0));
  const inv = invert(xtx);
  const beta = inv.map((row) => row.reduce((s, v, j) => s + v * xty[j], 0));
  const fitted = y.map((_, t) => cols.reduce((s, c, i) => s + beta[i] * c[t], 0));
  const resid = y.map((v, t) => v - fitted[t]);
  const sse = resid.reduce((s, e) => s + e * e, 0), my = mean(y), sst = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const df = n - k, sigma2 = sse / df;
  const se = inv.map((row, i) => Math.sqrt(Math.max(0, row[i] * sigma2)));
  const t = beta.map((b, i) => (se[i] > 0 ? b / se[i] : 0));
  const r2 = sst > 0 ? 1 - sse / sst : 0;
  return { names: ["Alpha", ...names], beta, se, t, p: t.map((x) => tPValue(x, df)), r2, adjR2: 1 - (1 - r2) * ((n - 1) / df), n, resid, fitted, sigma2 };
}

export function rollingBetas(y: number[], X: number[][], names: string[], dates: string[], win: number, max = 90) {
  const out: Record<string, number | string>[] = [];
  const step = Math.max(1, Math.ceil((y.length - win) / max));
  for (let i = win; i <= y.length; i += step) {
    try {
      const f = ols(y.slice(i - win, i), X.map((c) => c.slice(i - win, i)), names);
      const row: Record<string, number | string> = { date: dates[i - 1] };
      names.forEach((nm, k) => (row[nm] = f.beta[k + 1]));
      out.push(row);
    } catch { /* skip singular windows */ }
  }
  return out;
}

// ---------- attribution ----------
export function riskShares(y: number[], X: number[][], fit: OlsResult) {
  const my = mean(y), varY = y.reduce((s, v) => s + (v - my) ** 2, 0) / (y.length - 1);
  const cov = (a: number[]) => { const ma = mean(a); return a.reduce((s, v, i) => s + (v - ma) * (y[i] - my), 0) / (y.length - 1); };
  const factor = X.map((x, k) => (fit.beta[k + 1] * cov(x)) / varY * 100);
  return { factor, residual: (1 - fit.r2) * 100, varY, portVolAnn: Math.sqrt(varY * 252) * 100 };
}

/** Mean contribution of each factor (beta * factor return) over a subset of days; used for downside and tail attribution. */
export function subsetAttribution(y: number[], X: number[][], fit: OlsResult, mask: boolean[]) {
  const idx = mask.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return null;
  const factor = X.map((x, k) => mean(idx.map((i) => fit.beta[k + 1] * x[i])));
  const resid = mean(idx.map((i) => y[i] - factor.reduce((s, f, k) => s + fit.beta[k + 1] * X[k][i], 0)));
  return { factor, other: resid, total: mean(idx.map((i) => y[i])), n: idx.length };
}

export const tailMask = (y: number[], conf: number) => { const q = quantile([...y].sort((a, b) => a - b), 1 - conf); return y.map((v) => v <= q); };

// ---------- data ----------
export interface FactorData {
  dates: string[]; factors: { def: FactorDef; ret: number[] }[]; excluded: { def: FactorDef; reason: string }[]; synthetic: string[];
}

function toReturns(s: { dates: string[]; close: number[] }) {
  const m = new Map<string, number>();
  for (let i = 1; i < s.dates.length; i++) m.set(s.dates[i], s.close[i] / s.close[i - 1] - 1);
  return m;
}

/** Loads factor proxies and aligns them to the portfolio's return dates; factors without enough history are reported, not faked. */
export async function loadFactorData(market: Market, portDates: string[], start: string, end: string): Promise<FactorData> {
  const defs = FACTORS[market];
  const tickers = [...new Set(defs.flatMap((d) => [d.long, d.short].filter(Boolean) as string[]))];
  const loaded = await Promise.all(tickers.map((t) => loadSeries(t, start, end, "SPY").then((s) => ({ t, s })).catch(() => ({ t, s: null as null }))));
  const maps = new Map(loaded.map((x) => [x.t, x.s ? toReturns(x.s) : null]));
  const synthetic = loaded.filter((x) => x.s?.synthetic).map((x) => x.t);
  const dates = portDates.slice(1);
  const built = defs.map((def) => {
    const a = maps.get(def.long), b = def.short ? maps.get(def.short) : null;
    if (!a || (def.short && !b)) return { def, series: null as Map<string, number> | null, reason: "price history unavailable" };
    const m = new Map<string, number>();
    a.forEach((v, d) => { if (!def.short) m.set(d, v); else if (b!.has(d)) m.set(d, v - b!.get(d)!); });
    const cov = dates.filter((d) => m.has(d)).length / dates.length;
    return cov >= 0.85 ? { def, series: m, reason: "" } : { def, series: null, reason: `history covers only ${(cov * 100).toFixed(0)}% of the window` };
  });
  const keep = built.filter((b) => b.series);
  const common = dates.filter((d) => keep.every((b) => b.series!.has(d)));
  return {
    dates: common, synthetic,
    factors: keep.map((b) => ({ def: b.def, ret: common.map((d) => b.series!.get(d)!) })),
    excluded: built.filter((b) => !b.series).map((b) => ({ def: b.def, reason: b.reason })),
  };
}

/** Compounds aligned daily returns into weekly/monthly periods. */
export function resample(dates: string[], series: number[][], freq: Frequency) {
  if (freq === "Daily") return { dates, series };
  const key = (d: string) => {
    if (freq === "Monthly") return d.slice(0, 7);
    const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7)); return t.toISOString().slice(0, 10);
  };
  const groups = new Map<string, number[]>();
  dates.forEach((d, i) => { const k = key(d); (groups.get(k) ?? groups.set(k, []).get(k)!).push(i); });
  const idx = [...groups.values()];
  return { dates: idx.map((g) => dates[g[g.length - 1]]), series: series.map((s) => idx.map((g) => g.reduce((p, i) => p * (1 + s[i]), 1) - 1)) };
}

export { std };
