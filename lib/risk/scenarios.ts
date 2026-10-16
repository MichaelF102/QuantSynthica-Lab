/**
 * Historical scenario replay: re-simulates the CURRENT weights through a real past episode (buy-and-hold from the
 * episode start). Holdings with no price history for the episode are excluded and the rest renormalised, which is
 * reported to the user. No hypothetical shocks are used.
 */
import { Holding, loadSeries, normalizeWeights } from "@/lib/portfolio/engine";
import { std, quantile } from "./stats";

export interface ScenarioDef { key: string; label: string; desc: string; start: string; end: string; kind: "historical" | "custom" | "empirical" | "window" }

export const HISTORICAL: ScenarioDef[] = [
  { key: "dotcom", label: "2000–02 Dot-com bust", desc: "Tech-led bear market, 2000-03-24 to 2002-10-09", start: "2000-03-24", end: "2002-10-09", kind: "historical" },
  { key: "gfc", label: "2008 Global Financial Crisis", desc: "Peak to trough, 2008-01-08 to 2009-03-09", start: "2008-01-08", end: "2009-03-09", kind: "historical" },
  { key: "euro", label: "2011 Euro-zone & US downgrade", desc: "2011-07-22 to 2011-10-04", start: "2011-07-22", end: "2011-10-04", kind: "historical" },
  { key: "taper", label: "2013 Taper tantrum", desc: "Emerging-market sell-off, 2013-05-22 to 2013-08-28", start: "2013-05-22", end: "2013-08-28", kind: "historical" },
  { key: "china", label: "2015–16 China & oil sell-off", desc: "2015-03-04 to 2016-02-29", start: "2015-03-04", end: "2016-02-29", kind: "historical" },
  { key: "ilfs", label: "2018 IL&FS / NBFC crisis", desc: "2018-08-28 to 2018-10-26", start: "2018-08-28", end: "2018-10-26", kind: "historical" },
  { key: "covid", label: "2020 COVID-19 crash", desc: "2020-01-20 to 2020-03-23", start: "2020-01-20", end: "2020-03-23", kind: "historical" },
  { key: "rates", label: "2022 Rate-hike sell-off", desc: "2022-01-03 to 2022-06-17", start: "2022-01-03", end: "2022-06-17", kind: "historical" },
  { key: "ukraine", label: "2022 Russia–Ukraine shock", desc: "2022-02-10 to 2022-03-07", start: "2022-02-10", end: "2022-03-07", kind: "historical" },
];

export interface ScenarioResult {
  def: ScenarioDef;
  status: "ok" | "partial" | "unavailable";
  used: string[]; excluded: string[];
  dates: string[]; index: number[]; benchIndex: number[] | null;
  totalReturn: number; benchReturn: number | null; volAnn: number; var95: number; maxDD: number;
  troughDate: string; recoveryDays: number | null; recovered: boolean;
  assetReturns: Record<string, number | null>;
  horizons: { h: string; port: number | null; bench: number | null }[];
  error?: string;
}

const addDays = (d: string, n: number) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000);
const addYears = (d: string, y: number) => { const t = new Date(d + "T00:00:00Z"); t.setUTCFullYear(t.getUTCFullYear() + y); return t.toISOString().slice(0, 10); };

export function replayFromSeries(
  def: ScenarioDef,
  holdings: Holding[],
  series: Record<string, { dates: string[]; close: number[] } | null>,
  bench: { dates: string[]; close: number[] } | null
): ScenarioResult {
  const base = { def, dates: [] as string[], index: [] as number[], benchIndex: null, totalReturn: NaN, benchReturn: null, volAnn: NaN, var95: NaN, maxDD: NaN, troughDate: "", recoveryDays: null, recovered: false, assetReturns: {}, horizons: [] };
  const minBars = Math.max(5, Math.floor((daysBetween(def.start, def.end) * 5) / 7 * 0.7));
  const ok = (s: { dates: string[]; close: number[] } | null) => {
    if (!s) return false;
    const inWin = s.dates.filter((d) => d >= def.start && d <= def.end).length;
    return s.dates[0] <= addDays(def.start, 14) && s.dates[s.dates.length - 1] >= addDays(def.end, -14) && inWin >= minBars;
  };
  const usedH = holdings.filter((h) => ok(series[h.ticker]));
  const excluded = holdings.filter((h) => !ok(series[h.ticker])).map((h) => h.ticker);
  const assetReturns: Record<string, number | null> = {};
  holdings.forEach((h) => (assetReturns[h.ticker] = null));
  if (!usedH.length) return { ...base, status: "unavailable", used: [], excluded, assetReturns, error: "No holding has price history for this period" };

  const w = normalizeWeights(usedH.map((h) => ({ ...h }))).map((h) => h.weight / 100);
  let dates = [...new Set(usedH.flatMap((h) => series[h.ticker]!.dates))].sort().filter((d) => d >= def.start);
  const maps = usedH.map((h) => new Map(series[h.ticker]!.dates.map((d, i) => [d, series[h.ticker]!.close[i]])));
  dates = dates.filter((d) => maps.every((m) => m.has(d)));
  const winEndIdx = dates.reduce((acc, d, i) => (d <= def.end ? i : acc), -1);
  if (winEndIdx < 4) return { ...base, status: "unavailable", used: usedH.map((h) => h.ticker), excluded, assetReturns, error: "Too few common trading days" };
  const px = usedH.map((_, k) => dates.map((d) => maps[k].get(d)!));
  const shares = px.map((p, k) => w[k] / p[0]);
  const value = dates.map((_, i) => px.reduce((s, p, k) => s + shares[k] * p[i], 0));

  const win = value.slice(0, winEndIdx + 1), wd = dates.slice(0, winEndIdx + 1);
  const rets = win.slice(1).map((v, i) => v / win[i] - 1);
  let pk = -Infinity, maxDD = 0, troughI = 0, peakAtTrough = win[0];
  win.forEach((v, i) => { if (v > pk) pk = v; const dd = (pk - v) / pk; if (dd > maxDD) { maxDD = dd; troughI = i; peakAtTrough = pk; } });
  let recoveryDays: number | null = null, recovered = maxDD === 0;
  if (maxDD > 0) for (let i = troughI + 1; i < value.length; i++) if (value[i] >= peakAtTrough) { recoveryDays = daysBetween(dates[troughI], dates[i]); recovered = true; break; }

  let benchIndex: number[] | null = null, benchReturn: number | null = null;
  if (bench) {
    const bm = new Map(bench.dates.map((d, i) => [d, bench.close[i]]));
    let last = bench.close[bench.dates.findIndex((d) => d >= wd[0])] ?? NaN;
    const b = wd.map((d) => { last = bm.get(d) ?? last; return last; });
    if (b.every(Number.isFinite)) { benchIndex = b.map((x) => (x / b[0]) * 100); benchReturn = (b[b.length - 1] / b[0] - 1) * 100; }
  }
  const sorted = [...rets].sort((a, b) => a - b);
  usedH.forEach((h, k) => (assetReturns[h.ticker] = (px[k][winEndIdx] / px[k][0] - 1) * 100));
  const hz = (n: number | "full") => {
    const i = n === "full" ? win.length - 1 : n;
    if (i > win.length - 1) return { port: null, bench: null };
    return { port: (win[i] / win[0] - 1) * 100, bench: benchIndex ? benchIndex[i] - 100 : null };
  };
  return {
    def, status: excluded.length ? "partial" : "ok", used: usedH.map((h) => h.ticker), excluded,
    dates: wd, index: win.map((v) => (v / win[0]) * 100), benchIndex,
    totalReturn: (win[win.length - 1] / win[0] - 1) * 100, benchReturn,
    volAnn: std(rets) * Math.sqrt(252) * 100, var95: Math.max(0, -quantile(sorted, 0.05)), maxDD: maxDD * 100,
    troughDate: wd[troughI], recoveryDays, recovered, assetReturns,
    horizons: [{ h: "1M", ...hz(21) }, { h: "3M", ...hz(63) }, { h: "6M", ...hz(126) }, { h: "Full", ...hz("full") }],
  };
}

const settle = <T,>(p: Promise<T>) => p.then((v) => v).catch(() => null);

export async function replayScenario(def: ScenarioDef, holdings: Holding[], benchmark: string): Promise<ScenarioResult> {
  const extEnd = (() => { const e = addYears(def.end, 3); return e > today() ? today() : e; })();
  try {
    const [benchS, ...assetS] = await Promise.all([settle(loadSeries(benchmark, def.start, extEnd, benchmark)), ...holdings.map((h) => settle(loadSeries(h.ticker, def.start, extEnd, benchmark)))]);
    const series: Record<string, { dates: string[]; close: number[] } | null> = {};
    holdings.forEach((h, i) => (series[h.ticker] = assetS[i]));
    return replayFromSeries(def, holdings, series, benchS);
  } catch (e: any) {
    return { ...replayFromSeries(def, [], {}, null), status: "unavailable", error: e?.message || "Replay failed" };
  }
}

/** Best and worst rolling 252-day windows of the benchmark since 2005, plus the full distribution of 1Y returns. */
export async function empiricalWindows(benchmark: string) {
  const s = await loadSeries(benchmark, "2005-01-01", today(), benchmark);
  const n = 252;
  if (s.close.length < n + 50) return null;
  const rows = s.close.slice(n).map((c, i) => ({ start: s.dates[i], end: s.dates[i + n], ret: (c / s.close[i] - 1) * 100 }));
  const best = rows.reduce((a, b) => (b.ret > a.ret ? b : a)), worst = rows.reduce((a, b) => (b.ret < a.ret ? b : a));
  return { best, worst, dist: rows.map((r) => r.ret), years: s.dates.length / 252 };
}
