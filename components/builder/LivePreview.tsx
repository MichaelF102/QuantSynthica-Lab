"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { Activity } from "lucide-react";
import { api } from "@/lib/api";
import { StrategyConfig, BacktestResult } from "@/types";
import { Bar, runLocalBacktest } from "@/lib/localBacktest";
import { AXIS_PROPS, DOWN_COLOR, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR } from "@/lib/chartTheme";
import { cn, fmtPct } from "@/lib/utils";

interface Props {
  strategy: StrategyConfig;
  start: string;
  end: string;
  benchmark: string;
  /** False while the strategy has validation errors; the preview then explains what to fix. */
  valid: boolean;
  issueCount: number;
}

type Series = { bars: Bar[]; synthetic: boolean };

const toBars = (rows: any[]): Bar[] => rows.map((r) => ({ date: String(r.date).slice(0, 10), open: r.open, high: r.high, low: r.low, close: r.close, volume: r.volume ?? 0 }));

/** Collapse daily bars into weekly bars (first open, max high, min low, last close). */
function weekly(bars: Bar[]): Bar[] {
  const out: Bar[] = [];
  let key = "";
  for (const b of bars) {
    const d = new Date(b.date + "T00:00:00Z");
    const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
    if (monday !== key) { out.push({ ...b }); key = monday; }
    else { const w = out[out.length - 1]; w.high = Math.max(w.high, b.high); w.low = Math.min(w.low, b.low); w.close = b.close; w.volume += b.volume; w.date = b.date; }
  }
  return out;
}

const Marker = (color: string, up: boolean) => function MarkerShape(p: any) {
  const { cx, cy } = p;
  if (cx == null || cy == null) return <g />;
  const d = up ? `M${cx},${cy - 6} L${cx - 5},${cy + 3} L${cx + 5},${cy + 3} Z` : `M${cx},${cy + 6} L${cx - 5},${cy - 3} L${cx + 5},${cy - 3} Z`;
  return <path d={d} fill={color} stroke="#0b1222" strokeWidth={1} />;
};
const EntryMarker = Marker(UP_COLOR, true);
const ExitMarker = Marker(DOWN_COLOR, false);

export default function LivePreview({ strategy, start, end, benchmark, valid, issueCount }: Props) {
  const cache = useRef(new Map<string, Series | null>());
  const [asset, setAsset] = useState<Series | null>(null);
  const [bench, setBench] = useState<Series | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ticker = strategy.asset.toUpperCase();
  const datesOk = !!start && !!end && start < end;

  // prices: fetched once per ticker/window, not per keystroke
  useEffect(() => {
    if (!ticker || !datesOk) { setAsset(null); return; }
    let live = true;
    const load = async (sym: string): Promise<Series | null> => {
      const key = `${sym}|${start}|${end}`;
      if (cache.current.has(key)) return cache.current.get(key)!;
      try {
        const r = await api.getMarketData({ ticker: sym, start_date: start, end_date: end, benchmark });
        const s = r.bars?.length ? { bars: toBars(r.bars), synthetic: !!r.summary?.is_synthetic } : null;
        cache.current.set(key, s);
        return s;
      } catch { cache.current.set(key, null); return null; }
    };
    setLoading(true);
    Promise.all([load(ticker), load(benchmark)]).then(([a, b]) => { if (!live) return; setAsset(a); setBench(b); setLoading(false); });
    return () => { live = false; };
  }, [ticker, benchmark, start, end, datesOk]);

  // simulation: debounced so typing in a rule does not recompute on every key
  const strategyKey = JSON.stringify([strategy.indicators, strategy.entry_rules, strategy.exit_rules, strategy.risk, strategy.execution, strategy.timeframe]);
  useEffect(() => {
    if (!valid || !asset || asset.synthetic || asset.bars.length < 30) { setResult(null); setError(null); return; }
    const t = setTimeout(() => {
      try {
        const wk = strategy.timeframe === "1W";
        const bars = wk ? weekly(asset.bars) : asset.bars;
        const benchBars = bench && !bench.synthetic ? (wk ? weekly(bench.bars) : bench.bars) : undefined;
        setResult(runLocalBacktest(strategy, start, end, benchmark, { bars, benchmarkBars: benchBars, synthetic: false }));
        setError(null);
      } catch (e: any) { setResult(null); setError(e?.message || "Preview failed"); }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategyKey, asset, bench, valid, start, end, benchmark]);

  // numeric index axis so the markers never add extra slots to the date axis
  const bars = useMemo(() => (asset ? (strategy.timeframe === "1W" ? weekly(asset.bars) : asset.bars) : []), [asset, strategy.timeframe]);
  const priceData = useMemo(() => bars.map((b, i) => ({ i, date: b.date, close: b.close })), [bars]);
  const at = useMemo(() => new Map(bars.map((b, i) => [b.date, i])), [bars]);
  const entries = useMemo(() => (result?.trades ?? []).flatMap((t) => (at.has(t.entry_date) ? [{ i: at.get(t.entry_date)!, price: t.entry_price }] : [])), [result, at]);
  const exits = useMemo(() => (result?.trades ?? []).flatMap((t) => (at.has(t.exit_date) ? [{ i: at.get(t.exit_date)!, price: t.exit_price }] : [])), [result, at]);
  const priceTicks = useMemo(() => { const n = bars.length; if (n < 2) return [0]; const c = Math.min(5, n); return Array.from({ length: c }, (_, k) => Math.round((k * (n - 1)) / (c - 1))); }, [bars]);
  const showBench = !!bench && !bench.synthetic;
  const m = result?.metrics;

  let status: React.ReactNode = null;
  if (!datesOk) status = "Choose a valid window to preview.";
  else if (loading && !asset) status = "Loading prices…";
  else if (!asset) status = `No price history for ${ticker}, so nothing can be previewed.`;
  else if (asset.synthetic) status = "Only generated prices are available for this ticker. The preview is disabled so it can't be mistaken for real data.";
  else if (asset.bars.length < 30) status = "Too few bars in this window to preview.";
  else if (!valid) status = `Fix ${issueCount} issue${issueCount === 1 ? "" : "s"} to see the preview.`;
  else if (error) status = error;

  const kpi = (label: string, value: string, tone = "text-white") => (
    <div className="rounded-lg border border-slate-800 bg-[#080d1a] px-2 py-1.5 text-center">
      <div className={cn("font-mono text-xs font-bold", tone)}>{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-3" data-testid="live-preview">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-bold text-white"><Activity className="h-4 w-4 text-emerald-400" />Live preview</div>
        <span className="text-[10px] text-slate-500" title="Runs in your browser on real daily prices. Costs and sizing are simplified, so run a full backtest for exact figures.">{ticker} · approx.</span>
      </div>

      {status && <p className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-[11px] text-slate-400">{status}</p>}

      {!status && result && m && (
        <>
          <div className="mb-2 grid grid-cols-4 gap-1.5">
            {kpi("Return", fmtPct(m.total_return), m.total_return >= 0 ? "text-emerald-400" : "text-rose-400")}
            {kpi("Max DD", fmtPct(-Math.abs(m.max_drawdown), 1), "text-rose-400")}
            {kpi("Trades", String(m.num_trades))}
            {kpi("Win rate", m.num_trades ? fmtPct(m.win_rate, 0, false) : "—")}
          </div>
          {m.num_trades < 5 && <p className="mb-2 text-[10px] text-amber-300">Only {m.num_trades} trade{m.num_trades === 1 ? "" : "s"}: too few to judge. Widen the window or loosen the rules.</p>}

          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Price · entries <span className="text-emerald-400">▲</span> exits <span className="text-rose-400">▼</span></div>
          <div className="h-40" aria-label="Price chart with entry and exit markers">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={priceData} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis type="number" dataKey="i" domain={[0, Math.max(1, bars.length - 1)]} ticks={priceTicks} tickFormatter={(v) => String(bars[Math.round(v)]?.date ?? "").slice(0, 7)} {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} domain={["auto", "auto"]} width={42} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v: any) => String(bars[Math.round(Number(v))]?.date ?? "")} />
                <Line type="monotone" dataKey="close" stroke="#64748b" strokeWidth={1.2} dot={false} isAnimationActive={false} name="Close" />
                <Scatter data={entries} dataKey="price" name="Entry" shape={<EntryMarker />} isAnimationActive={false} />
                <Scatter data={exits} dataKey="price" name="Exit" shape={<ExitMarker />} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Equity{showBench ? ` vs ${benchmark}` : ""}</div>
          <div className="h-28" aria-label="Equity curve">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={result.equity_curve} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="date" {...AXIS_PROPS} interval="preserveStartEnd" minTickGap={40} tickFormatter={(d) => String(d).slice(0, 7)} />
                <YAxis {...AXIS_PROPS} domain={["auto", "auto"]} width={42} tickFormatter={(v) => (v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : String(Math.round(v)))} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                {showBench && <Line type="monotone" dataKey="benchmark_value" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} name={benchmark} />}
                <Area type="monotone" dataKey="portfolio_value" stroke={(m.total_return ?? 0) >= 0 ? UP_COLOR : DOWN_COLOR} fill={(m.total_return ?? 0) >= 0 ? UP_COLOR : DOWN_COLOR} fillOpacity={0.12} strokeWidth={1.5} dot={false} isAnimationActive={false} name="Strategy" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      {!status && !result && <p className="p-3 text-center text-[11px] text-slate-500">Calculating…</p>}
    </div>
  );
}
