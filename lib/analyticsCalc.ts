/**
 * Analytics calculations derived only from recorded backtest results (equity curve + trades).
 * Percent values are in percent units (12.3 = 12.3%), matching the backend contract.
 * Nothing here invents data: anything that cannot be computed returns null and renders "—".
 */
import { BacktestResult, EquityPoint, TradeRecord } from "@/types";
import { BENCHMARKS } from "@/lib/constants";
import { isIndianTicker } from "@/lib/market";

export type Frequency = "Daily" | "Weekly" | "Monthly";
export const PERIODS_PER_YEAR: Record<Frequency, number> = { Daily: 252, Weekly: 52, Monthly: 12 };

export interface Pt { date: string; value: number; bench: number; dd: number }

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP";
export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };

export const currencyOf = (bt: Pick<BacktestResult, "ticker">): CurrencyCode => (isIndianTicker(bt.ticker) ? "INR" : "USD");

export function benchmarkLabel(symbol: string | undefined): string {
  if (!symbol) return "Benchmark";
  const b = BENCHMARKS.find((x) => x.symbol === symbol);
  return b ? `${b.name} (${b.symbol})` : symbol;
}

/** Compact currency: ₹1.2L-style is avoided; en-IN grouping for INR, en-US otherwise. */
export function fmtMoney(v: number | null | undefined, c: CurrencyCode, compact = false): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  const sym = CURRENCY_SYMBOL[c];
  if (compact) {
    const a = Math.abs(v);
    const s =
      c === "INR"
        ? a >= 1e7 ? `${(a / 1e7).toFixed(2)}Cr` : a >= 1e5 ? `${(a / 1e5).toFixed(1)}L` : a >= 1e3 ? `${(a / 1e3).toFixed(0)}k` : a.toFixed(0)
        : a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(0)}k` : a.toFixed(0);
    return `${v < 0 ? "-" : ""}${sym}${s}`;
  }
  return `${v < 0 ? "-" : ""}${sym}${Math.abs(v).toLocaleString(c === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: 0 })}`;
}

/** Display name that stays unique when several runs share a strategy and ticker (adds the date window, then the run id). */
export function runName(bt: Pick<BacktestResult, "id" | "strategy_name" | "ticker" | "start_date" | "end_date">, all: Pick<BacktestResult, "id" | "strategy_name" | "ticker" | "start_date" | "end_date">[]): string {
  const same = all.filter((o) => o.strategy_name === bt.strategy_name && o.ticker === bt.ticker);
  if (same.length < 2) return bt.strategy_name;
  const win = `${bt.start_date} → ${bt.end_date}`;
  const twin = same.some((o) => o.id !== bt.id && o.start_date === bt.start_date && o.end_date === bt.end_date);
  return `${bt.strategy_name} · ${win}${twin ? ` · #${bt.id.slice(-4)}` : ""}`;
}

export const toPts = (curve: EquityPoint[]): Pt[] =>
  curve.map((p) => ({ date: p.date, value: p.portfolio_value, bench: p.benchmark_value, dd: p.drawdown }));

/** Filter to [start, end] and resample to the requested frequency (last observation per period). */
export function windowPts(pts: Pt[], start: string | null, end: string | null, freq: Frequency): Pt[] {
  let out = pts.filter((p) => (!start || p.date >= start) && (!end || p.date <= end));
  if (freq !== "Daily" && out.length) {
    const key = (d: string) => {
      if (freq === "Monthly") return d.slice(0, 7);
      const t = new Date(d + "T00:00:00Z");
      const day = (t.getUTCDay() + 6) % 7; // Monday-based ISO week
      t.setUTCDate(t.getUTCDate() - day);
      return t.toISOString().slice(0, 10);
    };
    const last = new Map<string, Pt>();
    out.forEach((p) => last.set(key(p.date), p));
    out = [...last.values()];
  }
  // Recompute drawdown within the window so it is relative to the window's own peak.
  let peak = -Infinity;
  return out.map((p) => {
    peak = Math.max(peak, p.value);
    return { ...p, dd: peak > 0 ? ((peak - p.value) / peak) * 100 : 0 };
  });
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const std = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};
const rets = (v: number[]) => v.slice(1).map((x, i) => (v[i] > 0 ? x / v[i] - 1 : 0));

export interface SeriesStats {
  totalReturn: number; cagr: number; vol: number; sharpe: number; sortino: number; maxDD: number;
  ddDuration: number; calmar: number; beta: number | null; alpha: number | null;
  benchReturn: number; benchCagr: number; benchVol: number; benchSharpe: number; benchMaxDD: number;
  bestPeriod: number; worstPeriod: number; positivePct: number; n: number; years: number;
}

export function seriesStats(pts: Pt[], freq: Frequency = "Daily"): SeriesStats | null {
  if (pts.length < 3) return null;
  const ppy = PERIODS_PER_YEAR[freq];
  const v = pts.map((p) => p.value), b = pts.map((p) => p.bench);
  const r = rets(v), br = rets(b);
  const years = Math.max((new Date(pts[pts.length - 1].date).getTime() - new Date(pts[0].date).getTime()) / 31557600000, 1 / ppy);
  const cagrOf = (x: number[]) => (x[0] > 0 ? (Math.pow(x[x.length - 1] / x[0], 1 / years) - 1) * 100 : 0);
  const sharpeOf = (x: number[]) => (std(x) > 0 ? (mean(x) / std(x)) * Math.sqrt(ppy) : 0);
  const ddOf = (x: number[]) => { let pk = -Infinity, m = 0; x.forEach((y) => { pk = Math.max(pk, y); m = Math.max(m, ((pk - y) / pk) * 100); }); return m; };
  const downside = Math.sqrt(mean(r.map((x) => Math.min(x, 0) ** 2)));
  const maxDD = ddOf(v);
  let dur = 0, cur = 0;
  pts.forEach((p) => { cur = p.dd > 0 ? cur + 1 : 0; dur = Math.max(dur, cur); });
  const bvar = std(br) ** 2;
  const cov = br.length > 1 ? mean(r.map((x, i) => (x - mean(r)) * (br[i] - mean(br)))) * (r.length / (r.length - 1)) : 0;
  const hasBench = b.some((x) => x !== b[0]);
  const beta = hasBench && bvar > 1e-12 ? cov / bvar : null;
  const cagr = cagrOf(v);
  return {
    totalReturn: (v[v.length - 1] / v[0] - 1) * 100, cagr, vol: std(r) * Math.sqrt(ppy) * 100,
    sharpe: sharpeOf(r), sortino: downside > 0 ? (mean(r) / downside) * Math.sqrt(ppy) : 0, maxDD, ddDuration: dur,
    calmar: maxDD > 0 ? cagr / maxDD : 0, beta,
    alpha: beta === null ? null : (mean(r) - beta * mean(br)) * ppy * 100,
    benchReturn: (b[b.length - 1] / b[0] - 1) * 100, benchCagr: cagrOf(b), benchVol: std(br) * Math.sqrt(ppy) * 100,
    benchSharpe: sharpeOf(br), benchMaxDD: ddOf(b),
    bestPeriod: Math.max(...r) * 100, worstPeriod: Math.min(...r) * 100,
    positivePct: (r.filter((x) => x > 0).length / r.length) * 100, n: pts.length, years,
  };
}

// ---------- multi-strategy date alignment ----------
export interface MergedRow { date: string; [series: string]: number | string | null }

/**
 * Aligns any number of curves on the union of calendar dates, forward-filling gaps (market
 * holidays differ between NYSE and NSE). A series is null before its own first observation,
 * so nothing is extrapolated backwards.
 */
export function mergeByDate(series: { key: string; pts: Pt[]; pick: (p: Pt) => number }[]): MergedRow[] {
  const dates = [...new Set(series.flatMap((s) => s.pts.map((p) => p.date)))].sort();
  const maps = series.map((s) => new Map(s.pts.map((p) => [p.date, p])));
  const lastVal: (number | null)[] = series.map(() => null);
  return dates.map((date) => {
    const row: MergedRow = { date };
    series.forEach((s, i) => {
      const p = maps[i].get(date);
      if (p) lastVal[i] = s.pick(p);
      row[s.key] = lastVal[i];
    });
    return row;
  });
}

// ---------- monthly / annual ----------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTH_NAMES = MONTHS;

export function monthlyMatrix(pts: Pt[]): { year: number; YTD: number; [m: string]: number }[] {
  const last = new Map<string, number>();
  pts.forEach((p) => last.set(p.date.slice(0, 7), p.value));
  const rows = new Map<number, Record<string, number>>();
  let prev = pts[0]?.value ?? 0;
  [...last.entries()].forEach(([ym, v], i) => {
    const [y, m] = ym.split("-").map(Number);
    const base = i === 0 ? pts[0].value : prev;
    const row = rows.get(y) ?? {};
    row[MONTHS[m - 1]] = (v / base - 1) * 100;
    rows.set(y, row);
    prev = v;
  });
  return [...rows.entries()]
    .map(([year, row]) => ({ year, ...row, YTD: (Object.values(row).reduce((a, r) => a * (1 + r / 100), 1) - 1) * 100 }))
    .sort((a, b) => b.year - a.year);
}

export function annualTable(pts: Pt[]) {
  const years = [...new Set(pts.map((p) => p.date.slice(0, 4)))];
  return years.map((y) => {
    const sub = windowPts(pts, `${y}-01-01`, `${y}-12-31`, "Daily");
    const s = seriesStats(sub);
    // Return for a calendar year is measured from the prior year-end close when available.
    const prior = pts.filter((p) => p.date < `${y}-01-01`).pop();
    const first = prior ?? sub[0];
    const strat = sub.length ? (sub[sub.length - 1].value / first.value - 1) * 100 : null;
    const bench = sub.length ? (sub[sub.length - 1].bench / first.bench - 1) * 100 : null;
    return { year: Number(y), strat, bench, excess: strat !== null && bench !== null ? strat - bench : null, sharpe: s?.sharpe ?? null, maxDD: s?.maxDD ?? null, days: sub.length };
  }).sort((a, b) => b.year - a.year);
}

// ---------- risk ----------
export function riskStats(pts: Pt[]) {
  const r = rets(pts.map((p) => p.value));
  if (r.length < 20) return null;
  const sorted = [...r].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.max(0, Math.floor(p * sorted.length))];
  const tail = (p: number) => mean(sorted.filter((x) => x <= q(p)));
  const ulcer = Math.sqrt(mean(pts.map((p) => p.dd ** 2)));
  const bins = [[0, 2], [2, 4], [4, 6], [6, 8], [8, 10], [10, 15], [15, Infinity]] as const;
  const binCounts = bins.map(([lo, hi]) => ({
    range: hi === Infinity ? `${lo}%+` : `${lo}–${hi}%`,
    days: pts.filter((p) => p.dd > 0 && p.dd >= lo && p.dd < hi).length,
  }));
  const pain = mean(pts.map((p) => p.dd));
  return {
    var95: Math.max(0, -q(0.05) * 100), var99: Math.max(0, -q(0.01) * 100),
    cvar95: Math.max(0, -tail(0.05) * 100), downsideDev: Math.sqrt(mean(r.map((x) => Math.min(x, 0) ** 2))) * Math.sqrt(252) * 100,
    ulcer, pain, binCounts, skew: (() => { const m = mean(r), s = std(r); return s > 0 ? mean(r.map((x) => ((x - m) / s) ** 3)) : 0; })(),
  };
}

/** Worst non-overlapping rolling windows, strategy vs benchmark over the same dates. */
export function worstWindows(pts: Pt[], len = 21, count = 5) {
  if (pts.length <= len) return [];
  const all = pts.slice(len).map((p, i) => {
    const a = pts[i];
    return { start: a.date, end: p.date, strat: (p.value / a.value - 1) * 100, bench: (p.bench / a.bench - 1) * 100 };
  }).sort((x, y) => x.strat - y.strat);
  const picked: typeof all = [];
  for (const w of all) {
    if (picked.every((q) => w.end < q.start || w.start > q.end)) picked.push(w);
    if (picked.length === count) break;
  }
  return picked;
}

// ---------- trades ----------
export function tradeStats(trades: TradeRecord[]) {
  if (!trades.length) return null;
  const wins = trades.filter((t) => t.net_pnl > 0), losses = trades.filter((t) => t.net_pnl <= 0);
  const sum = (a: TradeRecord[], k: "net_pnl" | "return_pct") => a.reduce((s, t) => s + t[k], 0);
  let maxW = 0, maxL = 0, cw = 0, cl = 0;
  trades.forEach((t) => { if (t.net_pnl > 0) { cw++; cl = 0; } else { cl++; cw = 0; } maxW = Math.max(maxW, cw); maxL = Math.max(maxL, cl); });
  const edges = [-Infinity, -6, -4, -2, 0, 2, 4, 6, Infinity];
  const labels = ["<-6%", "-6 to -4%", "-4 to -2%", "-2 to 0%", "0 to 2%", "2 to 4%", "4 to 6%", ">6%"];
  const bins = labels.map((bin, i) => ({ bin, count: trades.filter((t) => t.return_pct >= edges[i] && t.return_pct < edges[i + 1]).length }));
  const byReason = new Map<string, { count: number; pnl: number }>();
  trades.forEach((t) => { const e = byReason.get(t.exit_reason) ?? { count: 0, pnl: 0 }; e.count++; e.pnl += t.net_pnl; byReason.set(t.exit_reason, e); });
  const avgWin = wins.length ? sum(wins, "net_pnl") / wins.length : 0;
  const avgLoss = losses.length ? sum(losses, "net_pnl") / losses.length : 0;
  return {
    count: trades.length, wins: wins.length, losses: losses.length, winRate: (wins.length / trades.length) * 100,
    avgHold: trades.reduce((s, t) => s + t.holding_period_bars, 0) / trades.length,
    avgWin, avgLoss, payoff: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : null,
    profitFactor: Math.abs(sum(losses, "net_pnl")) > 0 ? sum(wins, "net_pnl") / Math.abs(sum(losses, "net_pnl")) : null,
    maxWinStreak: maxW, maxLossStreak: maxL, bins,
    reasons: [...byReason.entries()].map(([reason, v]) => ({ reason, ...v })).sort((a, b) => b.count - a.count),
    netPnl: sum(trades, "net_pnl"),
  };
}

// ---------- regimes (derived from the benchmark path) ----------
export function regimeStats(pts: Pt[]) {
  if (pts.length < 80) return null;
  const b = pts.map((p) => p.bench), v = pts.map((p) => p.value);
  const br = rets(b), sr = rets(v);
  const ma = (i: number, n = 50) => mean(b.slice(Math.max(0, i - n + 1), i + 1));
  const vol = br.map((_, i) => (i < 20 ? NaN : std(br.slice(i - 20, i))));
  const finiteVol = vol.filter(Number.isFinite).sort((x, y) => x - y);
  const medVol = finiteVol[Math.floor(finiteVol.length / 2)];
  const buckets: Record<string, number[]> = { "Bull (benchmark > 50d avg)": [], "Bear (benchmark < 50d avg)": [], "Low volatility": [], "High volatility": [] };
  sr.forEach((x, i) => {
    if (i < 50) return;
    (b[i] >= ma(i) ? buckets["Bull (benchmark > 50d avg)"] : buckets["Bear (benchmark < 50d avg)"]).push(x);
    if (Number.isFinite(vol[i])) (vol[i] <= medVol ? buckets["Low volatility"] : buckets["High volatility"]).push(x);
  });
  return Object.entries(buckets).map(([regime, x]) => ({
    regime, days: x.length, annReturn: mean(x) * 252 * 100, annVol: std(x) * Math.sqrt(252) * 100,
    sharpe: std(x) > 0 ? (mean(x) / std(x)) * Math.sqrt(252) : null, winRate: x.length ? (x.filter((y) => y > 0).length / x.length) * 100 : null,
  }));
}

// ---------- Monte Carlo (bootstrap of realised daily returns) ----------
function mulberry(seed: number) {
  let a = seed;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function monteCarlo(pts: Pt[], horizon = 252, paths = 1000, ddLimit = 20) {
  const r = rets(pts.map((p) => p.value));
  if (r.length < 30) return null;
  const rand = mulberry(r.length * 2654435761);
  const sims: number[][] = [];
  let breached = 0, losses = 0;
  for (let k = 0; k < paths; k++) {
    let v = 1, pk = 1, bad = false;
    const path = [1];
    for (let i = 0; i < horizon; i++) {
      v *= 1 + r[Math.floor(rand() * r.length)];
      pk = Math.max(pk, v);
      if ((pk - v) / pk > ddLimit / 100) bad = true;
      path.push(v);
    }
    sims.push(path);
    if (bad) breached++;
    if (v < 1) losses++;
  }
  const steps = [0, ...Array.from({ length: 6 }, (_, i) => Math.round(((i + 1) * horizon) / 6))];
  const cone = steps.map((s) => {
    const col = sims.map((p) => p[s]).sort((a, b) => a - b);
    const at = (q: number) => col[Math.min(col.length - 1, Math.floor(q * col.length))];
    return { period: s === 0 ? "Start" : `T+${s}d`, p5: at(0.05), p25: at(0.25), p50: at(0.5), p75: at(0.75), p95: at(0.95) };
  });
  return { cone, ddLimit, breachedPct: (breached / paths) * 100, lossPct: (losses / paths) * 100, paths, horizon };
}

// ---------- shared filter context ----------
export interface AnalyticsFilters { start: string | null; end: string | null; frequency: Frequency; currency: CurrencyCode }

export const btPoints = (bt: BacktestResult, f: AnalyticsFilters) => windowPts(toPts(bt.equity_curve), f.start, f.end, f.frequency);

/** Trades whose exit falls inside the active date window. */
export const btTrades = (bt: BacktestResult, f: AnalyticsFilters) =>
  bt.trades.filter((t) => (!f.start || t.exit_date >= f.start) && (!f.end || t.exit_date <= f.end));
