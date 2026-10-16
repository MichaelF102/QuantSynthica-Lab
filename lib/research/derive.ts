/** Statistics derived from price bars: key stats, multi-period performance, risk snapshot and technical signals. */
import { MarketBar } from "@/types";
import { Pt, seriesStats, riskStats } from "@/lib/analyticsCalc";
import { drawdownStats } from "@/lib/risk/drawdown";
import { varEs } from "@/lib/risk/var";
import { atr, bollinger, ema, last, macd, rsi, sma, stochastic } from "./indicators";

type B = Pick<MarketBar, "date" | "open" | "high" | "low" | "close" | "volume">;

export function keyStats(bars: B[]) {
  const l = bars[bars.length - 1], p = bars[bars.length - 2];
  if (!l) return null;
  const y = bars.slice(-252);
  const v30 = bars.slice(-30).map((b) => b.volume).filter((v) => v > 0);
  return {
    date: l.date, close: l.close, prevClose: p?.close ?? null, open: l.open, high: l.high, low: l.low, volume: l.volume,
    avgVol30: v30.length ? v30.reduce((a, b) => a + b, 0) / v30.length : null,
    high52: Math.max(...y.map((b) => b.high)), low52: Math.min(...y.map((b) => b.low)), bars52: y.length,
    change: p ? l.close - p.close : null, changePct: p ? ((l.close - p.close) / p.close) * 100 : null,
  };
}

const at = (bars: B[], date: string) => {
  let found: B | null = null;
  for (const b of bars) { if (b.date <= date) found = b; else break; }
  return found;
};
const shift = (iso: string, days: number) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0, 10); };

export const PERF_WINDOWS = [
  { label: "1 Day", days: 1 }, { label: "1 Week", days: 7 }, { label: "1 Month", days: 30 }, { label: "3 Months", days: 91 },
  { label: "6 Months", days: 182 }, { label: "YTD", days: -1 }, { label: "1 Year", days: 365 }, { label: "5 Years", days: 1826 },
] as const;

/** Return over calendar windows measured back from the last bar; null when the series is too short to cover the window. */
export function performance(bars: B[], bench: B[] | null) {
  const l = bars[bars.length - 1];
  if (!l) return [];
  const ret = (series: B[], days: number) => {
    const end = series[series.length - 1];
    if (!end) return null;
    const target = days === -1 ? `${end.date.slice(0, 4)}-01-01` : shift(end.date, days);
    if (series[0].date > (days === -1 ? shift(target, -7) : shift(target, -6))) return null; // history does not reach back far enough
    const s = days === -1 ? series.filter((b) => b.date < target).slice(-1)[0] ?? series[0] : at(series, target) ?? series[0]; // series[0] is within a week of the target here
    return s && s.close > 0 ? (end.close / s.close - 1) * 100 : null;
  };
  return PERF_WINDOWS.map((w) => {
    const r = w.label === "1 Day" ? (bars.length > 1 ? (l.close / bars[bars.length - 2].close - 1) * 100 : null) : ret(bars, w.days);
    const b = bench && bench.length > 1 ? (w.label === "1 Day" ? (bench[bench.length - 1].close / bench[bench.length - 2].close - 1) * 100 : ret(bench, w.days)) : null;
    return { label: w.label, ret: r, bench: b, excess: r !== null && b !== null ? r - b : null };
  });
}

/** Volatility, drawdown, VaR and beta from the window's bars (benchmark aligned on shared dates). */
export function riskSnapshot(bars: B[], bench: B[] | null) {
  if (bars.length < 30) return null;
  const bm = new Map((bench ?? []).map((b) => [b.date, b.close]));
  let lastB: number | null = null;
  const pts: Pt[] = bars.map((b) => { lastB = bm.get(b.date) ?? lastB; return { date: b.date, value: b.close, bench: lastB ?? b.close, dd: 0 }; });
  const hasBench = !!bench && bench.length > 30;
  const s = seriesStats(pts, "Daily");
  const dd = drawdownStats(pts, s?.cagr ?? null);
  const rets = bars.slice(1).map((b, i) => b.close / bars[i].close - 1);
  const v = varEs(rets, 0.95, "Historical", 1);
  return { vol: s?.vol ?? null, maxDD: dd.maxDD, currentDD: dd.currentDD, var95: v.var * 100, es95: v.es * 100, beta: hasBench ? s?.beta ?? null : null, sharpe: s && s.vol > 0 ? s.cagr / s.vol : null, cagr: s?.cagr ?? null, dd: dd.dd, episodes: dd.episodes, risk: riskStats(pts) };
}

export type Signal = "Bullish" | "Bearish" | "Neutral";
export interface TechSignal { name: string; value: string; signal: Signal; rule: string }

/** Rule-based technical read-out from the latest bar. Each rule is shown so nothing is a black box. */
export function techSignals(bars: B[]): { signals: TechSignal[]; counts: Record<Signal, number>; score: number } | null {
  if (bars.length < 60) return null;
  const c = bars.map((b) => b.close), px = c[c.length - 1];
  const s20 = last(sma(c, 20)), s50 = last(sma(c, 50)), s200 = last(sma(c, 200)), e20 = last(ema(c, 20));
  const r = last(rsi(c, 14)), m = macd(c), mh = last(m.hist), ml = last(m.line), ms = last(m.signal);
  const st = stochastic(bars as any), sk = last(st.k), a = last(atr(bars as any, 14)), bb = bollinger(c, 20, 2);
  const bu = last(bb.upper), bl = last(bb.lower);
  const v20 = bars.slice(-20).reduce((x, y) => x + y.volume, 0) / 20, vlast = bars[bars.length - 1].volume;
  const mom = bars.length > 126 ? (px / c[c.length - 127] - 1) * 100 : null;
  const sig = (cond: boolean | null, bear: boolean | null): Signal => (cond ? "Bullish" : bear ? "Bearish" : "Neutral");
  const out: TechSignal[] = [];
  const add = (name: string, value: string, signal: Signal, rule: string) => out.push({ name, value, signal, rule });
  if (s20 !== null) add("Price vs SMA 20", `${((px / s20 - 1) * 100).toFixed(2)}%`, sig(px > s20, px < s20), "Above the 20-day average is bullish");
  if (s50 !== null) add("Price vs SMA 50", `${((px / s50 - 1) * 100).toFixed(2)}%`, sig(px > s50, px < s50), "Above the 50-day average is bullish");
  if (s200 !== null) add("Price vs SMA 200", `${((px / s200 - 1) * 100).toFixed(2)}%`, sig(px > s200, px < s200), "Above the 200-day average is bullish");
  if (s50 !== null && s200 !== null) add("SMA 50 vs 200", s50 > s200 ? "Golden cross state" : "Death cross state", sig(s50 > s200, s50 < s200), "50-day above 200-day is bullish");
  if (e20 !== null) add("EMA 20 slope", `${((e20 / (ema(c, 20)[c.length - 6] ?? e20) - 1) * 100).toFixed(2)}% / 5d`, sig(e20 > (ema(c, 20)[c.length - 6] ?? e20), e20 < (ema(c, 20)[c.length - 6] ?? e20)), "Rising 20-day EMA is bullish");
  if (r !== null) add("RSI (14)", r.toFixed(1), r > 70 ? "Bearish" : r < 30 ? "Bullish" : "Neutral", "Above 70 overbought (bearish), below 30 oversold (bullish)");
  if (ml !== null && ms !== null && mh !== null) add("MACD (12,26,9)", `hist ${mh.toFixed(2)}`, sig(ml > ms, ml < ms), "MACD line above its signal line is bullish");
  if (sk !== null) add("Stochastic %K (14)", sk.toFixed(1), sk > 80 ? "Bearish" : sk < 20 ? "Bullish" : "Neutral", "Above 80 overbought (bearish), below 20 oversold (bullish)");
  if (bu !== null && bl !== null) { const pb = (px - bl) / (bu - bl); add("Bollinger %B (20,2)", pb.toFixed(2), pb > 1 ? "Bearish" : pb < 0 ? "Bullish" : "Neutral", "Above 1 = stretched above the band (bearish); below 0 = below the band (bullish)"); }
  if (mom !== null) add("6-month momentum", `${mom.toFixed(1)}%`, sig(mom > 0, mom < 0), "Positive 6-month return is bullish");
  add("Volume vs 20-day avg", `${((vlast / v20 - 1) * 100).toFixed(0)}%`, "Neutral", "Context only; volume does not set direction");
  if (a !== null) add("ATR (14) % of price", `${((a / px) * 100).toFixed(2)}%`, "Neutral", "Volatility context; not directional");
  const counts: Record<Signal, number> = { Bullish: 0, Bearish: 0, Neutral: 0 };
  out.forEach((s) => counts[s.signal]++);
  const directional = counts.Bullish + counts.Bearish;
  return { signals: out, counts, score: directional ? ((counts.Bullish - counts.Bearish) / directional) * 100 : 0 };
}
