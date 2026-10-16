"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CandlestickChart, ChevronDown, GitCompare, Layers } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/risk/ui/controls";
import { api } from "@/lib/api";
import { MarketBar } from "@/types";
import { atr, bollinger, ema, macd, rsi, sma, stochastic } from "@/lib/research/indicators";
import { Region, fmtPx, fmtVol } from "@/lib/research/format";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, DOWN_COLOR, UP_COLOR } from "@/lib/chartTheme";
import { cn, fmtPct } from "@/lib/utils";

const RANGES = ["1M", "3M", "6M", "YTD", "1Y", "5Y", "ALL"] as const;
const TYPES = ["Candles", "Line", "Area"] as const;
const INTERVALS = ["Day", "Week", "Month"] as const;
type Range = (typeof RANGES)[number];

const OVERLAYS = [
  { key: "sma20", label: "SMA 20", color: "#D97706" }, { key: "sma50", label: "SMA 50", color: "#2563EB" }, { key: "sma200", label: "SMA 200", color: "#7C3AED" },
  { key: "ema9", label: "EMA 9", color: "#16A34A" }, { key: "ema20", label: "EMA 20", color: "#0891B2" }, { key: "ema50", label: "EMA 50", color: "#EA580C" },
  { key: "ema200", label: "EMA 200", color: "#DC2626" }, { key: "bb", label: "Bollinger (20, 2)", color: "#64748B" },
] as const;
const PANELS = ["Volume", "RSI", "MACD", "Stochastic", "ATR"] as const;

function rangeStart(r: Range, last: string): string | null {
  if (r === "ALL") return null;
  if (r === "YTD") return `${last.slice(0, 4)}-01-01`;
  const d = new Date(last + "T00:00:00Z");
  const m = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "5Y": 60 }[r];
  d.setUTCMonth(d.getUTCMonth() - m);
  return d.toISOString().slice(0, 10);
}

function resample(bars: MarketBar[], interval: (typeof INTERVALS)[number]) {
  if (interval === "Day") return bars;
  const key = (d: string) => {
    if (interval === "Month") return d.slice(0, 7);
    const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7)); return t.toISOString().slice(0, 10);
  };
  const groups = new Map<string, MarketBar[]>();
  bars.forEach((b) => (groups.get(key(b.date)) ?? groups.set(key(b.date), []).get(key(b.date))!).push(b));
  return [...groups.values()].map((g) => ({ ...g[g.length - 1], open: g[0].open, high: Math.max(...g.map((x) => x.high)), low: Math.min(...g.map((x) => x.low)), volume: g.reduce((s, x) => s + x.volume, 0) }));
}

const Candle = (p: any) => {
  const { x, y, width, height, payload } = p;
  const { open, close, high, low } = payload ?? {};
  if (![open, close, high, low].every(Number.isFinite)) return null;
  const color = close >= open ? UP_COLOR : DOWN_COLOR, range = high - low;
  const py = (v: number) => (range > 0 ? y + ((high - v) / range) * height : y);
  const cx = x + width / 2, bw = Math.max(1, Math.min(width * 0.7, 10));
  return (
    <g>
      <line x1={cx} x2={cx} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={cx - bw / 2} y={Math.min(py(open), py(close))} width={bw} height={Math.max(1, Math.abs(py(open) - py(close)))} fill={color} />
    </g>
  );
};

interface Props {
  bars: MarketBar[]; bench: MarketBar[] | null; symbol: string; benchLabel: string; region: Region;
  defaultPanels?: (typeof PANELS)[number][]; defaultOverlays?: string[]; height?: number; compareRequest?: number;
}

export default function PriceChart({ bars, bench, symbol, benchLabel, region, defaultPanels = ["Volume"], defaultOverlays = ["sma20", "sma50"], height = 380, compareRequest = 0 }: Props) {
  const [range, setRange] = useState<Range>("1Y");
  const [type, setType] = useState<(typeof TYPES)[number]>("Candles");
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]>("Day");
  const [overlays, setOverlays] = useState<string[]>(defaultOverlays);
  const [panels, setPanels] = useState<string[]>(defaultPanels);
  const [menu, setMenu] = useState<"ind" | "cmp" | null>(null);
  const [compare, setCompare] = useState<"off" | "bench" | string>("off");
  const [custom, setCustom] = useState("");
  const [customBars, setCustomBars] = useState<MarketBar[] | null>(null);
  const [customErr, setCustomErr] = useState<string | null>(null);
  const [hover, setHover] = useState<any>(null);

  useEffect(() => { if (compareRequest > 0) { setCompare("bench"); setMenu(null); } }, [compareRequest]);

  const loadCustom = async () => {
    const t = custom.trim().toUpperCase();
    if (!t) return;
    setCustomErr(null);
    try {
      const end = bars[bars.length - 1].date, start = bars[0].date;
      const r = await api.getMarketData({ ticker: t, start_date: start, end_date: end });
      if (r.summary?.is_synthetic) throw new Error("No real price history for that ticker");
      setCustomBars(r.bars); setCompare(t); setMenu(null);
    } catch (e: any) { setCustomErr(e?.message || "Could not load that ticker"); }
  };

  const series = useMemo(() => resample(bars, interval), [bars, interval]);
  const calc = useMemo(() => {
    const c = series.map((b) => b.close);
    const bb = bollinger(c, 20, 2), m = macd(c), st = stochastic(series as any), rs = rsi(c, 14), at = atr(series as any, 14);
    return { sma20: sma(c, 20), sma50: sma(c, 50), sma200: sma(c, 200), ema9: ema(c, 9), ema20: ema(c, 20), ema50: ema(c, 50), ema200: ema(c, 200), bbU: bb.upper, bbL: bb.lower, macd: m.line, signal: m.signal, hist: m.hist, k: st.k, d: st.d, rsi: rs, atr: at };
  }, [series]);

  const start = rangeStart(range, series[series.length - 1]?.date ?? "");
  const first = Math.max(0, start ? series.findIndex((b) => b.date >= start) : 0);
  const cmpSrc = compare === "off" ? null : compare === "bench" ? bench : customBars;
  const cmpMap = useMemo(() => (cmpSrc ? new Map(cmpSrc.map((b) => [b.date, b.close])) : null), [cmpSrc]);

  const rows = useMemo(() => {
    const out: any[] = [];
    let cmpBase: number | null = null, lastCmp: number | null = null;
    series.slice(first).forEach((b, k) => {
      const i = first + k;
      if (cmpMap) { lastCmp = cmpMap.get(b.date) ?? lastCmp; if (cmpBase === null && lastCmp !== null) cmpBase = lastCmp; }
      out.push({
        date: b.date, open: b.open, high: b.high, low: b.low, close: b.close, hl: [b.low, b.high], volume: b.volume, up: b.close >= b.open,
        sma20: calc.sma20[i], sma50: calc.sma50[i], sma200: calc.sma200[i], ema9: calc.ema9[i], ema20: calc.ema20[i], ema50: calc.ema50[i], ema200: calc.ema200[i],
        bbU: calc.bbU[i], bbL: calc.bbL[i], rsi: calc.rsi[i], macd: calc.macd[i], signal: calc.signal[i], hist: calc.hist[i], k: calc.k[i], d: calc.d[i], atr: calc.atr[i],
        cmp: cmpBase !== null && lastCmp !== null ? (lastCmp / cmpBase) * series[first].close : null,
      });
    });
    return out;
  }, [series, first, calc, cmpMap]);

  if (!rows.length) return null;
  const cur = hover ?? rows[rows.length - 1];
  const prev = rows[Math.max(0, rows.findIndex((r) => r.date === cur.date) - 1)];
  const chg = cur.close - prev.close;
  const tog = (set: React.Dispatch<React.SetStateAction<string[]>>, k: string) => set((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const margin = { top: 6, right: 8, left: 0, bottom: 0 };
  const sub = (h: number, children: React.ReactNode, label: string, ticks = false) => (
    <div className="border-t border-slate-800/70 pt-1">
      <div className="px-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</div>
      <div style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={rows} margin={margin} syncId="research-chart">{children}<XAxis dataKey="date" {...AXIS_PROPS} hide={!ticks} minTickGap={60} /><CartesianGrid {...GRID_PROPS} /></ComposedChart></ResponsiveContainer>
      </div>
    </div>
  );
  const nPanels = ["RSI", "MACD", "Stochastic", "ATR"].filter((p) => panels.includes(p));

  return (
    <Card title="Price chart" subtitle={`${symbol} · ${interval === "Day" ? "daily" : interval === "Week" ? "weekly" : "monthly"} bars`} info="Real OHLCV prices. Indicators are computed from these bars (Wilder smoothing for RSI/ATR). Compare rebases another series to this chart's first visible price." icon={CandlestickChart} tone="blue"
      action={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Segmented value={range} options={RANGES} onChange={setRange} size="sm" />
          <Segmented value={interval} options={INTERVALS} onChange={setInterval} size="sm" />
          <Segmented value={type} options={TYPES} onChange={setType} size="sm" />
          <div className="relative">
            <button type="button" onClick={() => setMenu(menu === "ind" ? null : "ind")} aria-expanded={menu === "ind"} className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800"><Layers className="h-3 w-3" /> Indicators <ChevronDown className="h-3 w-3" /></button>
            {menu === "ind" && (
              <div className="absolute right-0 top-full z-[60] mt-1 w-56 space-y-2 rounded-xl border border-slate-800 bg-[#0B101C] p-3 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)]">
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Overlays</div>
                {OVERLAYS.map((o) => <label key={o.key} className="flex cursor-pointer items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={overlays.includes(o.key)} onChange={() => tog(setOverlays, o.key)} className="accent-blue-500" /><span className="h-2 w-2 rounded-full" style={{ backgroundColor: o.color }} />{o.label}</label>)}
                <div className="border-t border-slate-800 pt-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">Panels</div>
                {PANELS.map((p) => <label key={p} className="flex cursor-pointer items-center gap-2 text-xs text-slate-200"><input type="checkbox" checked={panels.includes(p)} onChange={() => tog(setPanels, p)} className="accent-blue-500" />{p}</label>)}
              </div>
            )}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setMenu(menu === "cmp" ? null : "cmp")} aria-expanded={menu === "cmp"} className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium hover:bg-slate-800", compare !== "off" ? "border-purple-500/40 bg-purple-500/10 text-purple-300" : "border-slate-700/80 bg-slate-900/70 text-slate-200")}><GitCompare className="h-3 w-3" /> Compare{compare !== "off" && `: ${compare === "bench" ? benchLabel : compare}`} <ChevronDown className="h-3 w-3" /></button>
            {menu === "cmp" && (
              <div className="absolute right-0 top-full z-[60] mt-1 w-60 space-y-2 rounded-xl border border-slate-800 bg-[#0B101C] p-3 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)]">
                {[["off", "Off"], ["bench", `Benchmark (${benchLabel})`]].map(([k, l]) => <button key={k} type="button" disabled={k === "bench" && !bench} onClick={() => { setCompare(k); setMenu(null); }} className={cn("block w-full rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-slate-800/70 disabled:opacity-40", compare === k ? "text-blue-400" : "text-slate-200")}>{l}</button>)}
                <form onSubmit={(e) => { e.preventDefault(); void loadCustom(); }} className="flex gap-1 border-t border-slate-800 pt-2">
                  <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Any ticker" aria-label="Compare ticker" className="min-w-0 flex-1 rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2 py-1 font-mono text-xs text-white outline-none focus:border-blue-500" />
                  <button type="submit" className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500">Add</button>
                </form>
                {customErr && <p className="text-[11px] text-rose-400">{customErr}</p>}
              </div>
            )}
          </div>
        </div>
      }>
      <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px]" aria-live="off">
        <span className="font-bold text-white">{symbol}</span>
        <span className="text-slate-400">O <span className="text-slate-200">{fmtPx(cur.open, region)}</span></span>
        <span className="text-slate-400">H <span className="text-emerald-400">{fmtPx(cur.high, region)}</span></span>
        <span className="text-slate-400">L <span className="text-rose-400">{fmtPx(cur.low, region)}</span></span>
        <span className="text-slate-400">C <span className="font-semibold text-white">{fmtPx(cur.close, region)}</span></span>
        <span className={chg >= 0 ? "text-emerald-400" : "text-rose-400"}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)} ({fmtPct((chg / prev.close) * 100)})</span>
        <span className="text-slate-400">Vol <span className="text-slate-200">{fmtVol(cur.volume, region)}</span></span>
        <span className="ml-auto text-slate-500">{cur.date}</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={margin} syncId="research-chart" onMouseMove={(s: any) => s?.activePayload?.[0] && setHover(s.activePayload[0].payload)} onMouseLeave={() => setHover(null)}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} hide={panels.length > 0 && (panels.includes("Volume") || nPanels.length > 0)} />
            <YAxis {...AXIS_PROPS} domain={[(m: number) => m * 0.985, (m: number) => m * 1.015]} tickFormatter={(v) => (region === "India" ? `₹${Math.round(v).toLocaleString("en-IN")}` : `$${Math.round(v)}`)} width={56} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#475569", strokeDasharray: "3 3" }} content={() => null} />
            {overlays.includes("bb") && [<Line key="bbU" dataKey="bbU" stroke="#64748B" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} connectNulls />, <Line key="bbL" dataKey="bbL" stroke="#64748B" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} connectNulls />]}
            {type === "Candles" && <Bar dataKey="hl" shape={<Candle />} isAnimationActive={false} />}
            {type === "Area" && <Area dataKey="close" stroke="#2563EB" strokeWidth={2} fill="#2563EB" fillOpacity={0.15} isAnimationActive={false} />}
            {type === "Line" && <Line dataKey="close" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />}
            {OVERLAYS.filter((o) => o.key !== "bb" && overlays.includes(o.key)).map((o) => <Line key={o.key} dataKey={o.key} stroke={o.color} strokeWidth={1.4} dot={false} isAnimationActive={false} connectNulls />)}
            {compare !== "off" && <Line dataKey="cmp" stroke="#A855F7" strokeWidth={1.6} strokeDasharray="5 3" dot={false} isAnimationActive={false} connectNulls />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {panels.includes("Volume") && sub(70, [<Bar key="k0" dataKey="volume" isAnimationActive={false}>{rows.map((r, i) => <Cell key={i} fill={r.up ? UP_COLOR : DOWN_COLOR} fillOpacity={0.55} />)}</Bar>], "Volume", nPanels.length === 0)}
      {panels.includes("RSI") && sub(80, [<YAxis key="k0" {...AXIS_PROPS} width={56} domain={[0, 100]} ticks={[30, 70]} />, <ReferenceLine key="k1" y={70} stroke="#DC2626" strokeDasharray="3 3" />, <ReferenceLine key="k2" y={30} stroke="#16A34A" strokeDasharray="3 3" />, <Line key="k3" dataKey="rsi" stroke="#7C3AED" strokeWidth={1.6} dot={false} isAnimationActive={false} connectNulls />], `RSI (14) · ${cur.rsi != null ? cur.rsi.toFixed(1) : "—"}`, nPanels[nPanels.length - 1] === "RSI")}
      {panels.includes("MACD") && sub(90, [<YAxis key="k0" {...AXIS_PROPS} width={56} />, <ReferenceLine key="k1" y={0} stroke="#475569" />, <Bar key="k2" dataKey="hist" isAnimationActive={false}>{rows.map((r, i) => <Cell key={i} fill={(r.hist ?? 0) >= 0 ? UP_COLOR : DOWN_COLOR} fillOpacity={0.6} />)}</Bar>, <Line key="k3" dataKey="macd" stroke="#2563EB" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />, <Line key="k4" dataKey="signal" stroke="#D97706" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />], `MACD (12, 26, 9) · ${cur.macd != null ? cur.macd.toFixed(2) : "—"}`, nPanels[nPanels.length - 1] === "MACD")}
      {panels.includes("Stochastic") && sub(80, [<YAxis key="k0" {...AXIS_PROPS} width={56} domain={[0, 100]} ticks={[20, 80]} />, <ReferenceLine key="k1" y={80} stroke="#DC2626" strokeDasharray="3 3" />, <ReferenceLine key="k2" y={20} stroke="#16A34A" strokeDasharray="3 3" />, <Line key="k3" dataKey="k" stroke="#2563EB" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />, <Line key="k4" dataKey="d" stroke="#D97706" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />], `Stochastic (14, 3) · %K ${cur.k != null ? cur.k.toFixed(1) : "—"}`, nPanels[nPanels.length - 1] === "Stochastic")}
      {panels.includes("ATR") && sub(70, [<YAxis key="k0" {...AXIS_PROPS} width={56} />, <Line key="k1" dataKey="atr" stroke="#EA580C" strokeWidth={1.6} dot={false} isAnimationActive={false} connectNulls />], `ATR (14) · ${cur.atr != null ? cur.atr.toFixed(2) : "—"}`, true)}
      {OVERLAYS.some((o) => overlays.includes(o.key)) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-800/70 pt-2 font-mono text-[10px]">
          {OVERLAYS.filter((o) => overlays.includes(o.key)).map((o) => <span key={o.key} className="flex items-center gap-1 text-slate-400"><span className="h-0.5 w-3" style={{ backgroundColor: o.color }} />{o.label}{o.key !== "bb" && cur[o.key] != null && <span className="text-slate-200">{Number(cur[o.key]).toFixed(2)}</span>}</span>)}
        </div>
      )}
    </Card>
  );
}
