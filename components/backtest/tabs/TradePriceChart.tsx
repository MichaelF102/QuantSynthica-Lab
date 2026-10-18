"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CandlestickChart } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from "recharts";
import { api } from "@/lib/api";
import { BacktestResult, TradeRecord } from "@/types";
import { Card, EmptyState } from "@/components/ui/Card";
import { AXIS_PROPS, DOWN_COLOR, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR } from "@/lib/chartTheme";
import { cn } from "@/lib/utils";

type Range = "ALL" | "1Y" | "6M" | "3M" | "TRADE";
interface Mark { i: number; date: string; price: number; trade: TradeRecord; kind: "entry" | "exit"; win: boolean; short: boolean }

const Shape = (onSelect: (t: TradeRecord) => void, selectedId?: string | null) => function MarkShape(p: any) {
  const { cx, cy, payload } = p as { cx?: number; cy?: number; payload: Mark };
  if (cx == null || cy == null || !payload) return <g />;
  // entries point the way the position faces; exits point the other way. Exits are green on a win, red on a loss.
  const up = payload.kind === "entry" ? !payload.short : payload.short;
  const color = payload.kind === "entry" ? "#60A5FA" : payload.win ? UP_COLOR : DOWN_COLOR;
  const big = payload.trade.id === selectedId, s = big ? 7 : 5;
  const d = up ? `M${cx},${cy - s} L${cx - s},${cy + s * 0.6} L${cx + s},${cy + s * 0.6} Z` : `M${cx},${cy + s} L${cx - s},${cy - s * 0.6} L${cx + s},${cy - s * 0.6} Z`;
  return <path d={d} fill={color} stroke={big ? "#F8FAFC" : "#0b1222"} strokeWidth={big ? 1.5 : 1} style={{ cursor: "pointer" }} onClick={() => onSelect(payload.trade)} data-testid={`mark-${payload.kind}`} />;
};

/** The traded security's closes with every entry and exit marked, so a result can be traced back to the price action. */
export default function TradePriceChart({ bt, selectedTrade, onSelectTrade }: { bt: BacktestResult; selectedTrade?: TradeRecord | null; onSelectTrade: (t: TradeRecord) => void }) {
  const [bars, setBars] = useState<{ date: string; close: number }[] | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none" | "synthetic">("loading");
  const [range, setRange] = useState<Range>("ALL");

  useEffect(() => {
    let live = true;
    setState("loading");
    api.getMarketData({ ticker: bt.ticker, start_date: bt.start_date, end_date: bt.end_date, benchmark: bt.benchmark })
      .then((r) => {
        if (!live) return;
        if (r.summary?.is_synthetic || bt.is_synthetic) { setBars(null); setState("synthetic"); return; }
        const rows = (r.bars ?? []).map((b: any) => ({ date: String(b.date).slice(0, 10), close: b.close })).filter((b: any) => Number.isFinite(b.close));
        setBars(rows); setState(rows.length ? "ready" : "none");
      })
      .catch(() => { if (live) { setBars(null); setState("none"); } });
    return () => { live = false; };
  }, [bt.ticker, bt.start_date, bt.end_date, bt.benchmark, bt.is_synthetic]);

  useEffect(() => { if (selectedTrade) setRange("TRADE"); }, [selectedTrade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    if (!bars?.length) return [];
    if (range === "TRADE" && selectedTrade) {
      const a = bars.findIndex((b) => b.date >= selectedTrade.entry_date), z = bars.findIndex((b) => b.date >= selectedTrade.exit_date);
      const pad = Math.max(15, Math.round(((z < 0 ? bars.length : z) - Math.max(a, 0)) * 0.6));
      return bars.slice(Math.max(0, a - pad), (z < 0 ? bars.length : z) + pad + 1);
    }
    const n = { ALL: bars.length, "1Y": 252, "6M": 126, "3M": 63, TRADE: bars.length }[range];
    return bars.slice(-n);
  }, [bars, range, selectedTrade]);

  const marks = useMemo(() => {
    if (!view.length) return { entries: [] as Mark[], exits: [] as Mark[] };
    const at = new Map(view.map((b, k) => [b.date, k]));
    const entries: Mark[] = [], exits: Mark[] = [];
    bt.trades.forEach((t) => {
      const win = t.net_pnl > 0, short = t.direction.includes("SHORT");
      const a = at.get(t.entry_date), z = at.get(t.exit_date);
      if (a !== undefined) entries.push({ i: a, date: t.entry_date, price: t.entry_price, trade: t, kind: "entry", win, short });
      if (z !== undefined) exits.push({ i: z, date: t.exit_date, price: t.exit_price, trade: t, kind: "exit", win, short });
    });
    return { entries, exits };
  }, [view, bt.trades]);

  // Marks sit on a numeric index axis (not the date category axis) so they never add extra slots to it.
  const indexed = useMemo(() => view.map((b, k) => ({ ...b, i: k })), [view]);
  const ticks = useMemo(() => { const n = view.length; if (n < 2) return [0]; const c = Math.min(7, n); return Array.from({ length: c }, (_, k) => Math.round((k * (n - 1)) / (c - 1))); }, [view]);
  const dateAt = (v: number) => view[Math.round(v)]?.date ?? "";
  const selA = selectedTrade ? view.findIndex((b) => b.date === selectedTrade.entry_date) : -1, selZ = selectedTrade ? view.findIndex((b) => b.date === selectedTrade.exit_date) : -1;
  const EntryShape = useMemo(() => Shape(onSelectTrade, selectedTrade?.id), [onSelectTrade, selectedTrade?.id]);
  const chip = (r: Range, label: string, disabled = false) => (
    <button key={r} type="button" disabled={disabled} aria-pressed={range === r} onClick={() => setRange(r)} className={cn("rounded-md px-2 py-1 text-[11px] font-semibold disabled:opacity-30", range === r ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{label}</button>
  );

  return (
    <div id="price-chart" className="scroll-mt-24">
      <Card title="Price and trades" subtitle={`${bt.ticker} closes with every entry and exit`} info="Blue triangles are entries, green and red triangles are exits that made or lost money. Click a marker to inspect the trade; selecting a trade elsewhere zooms here. Longs point up on entry; shorts point down." icon={CandlestickChart} tone="blue"
        action={state === "ready" ? <div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5" role="group" aria-label="Chart range">{chip("ALL", "All")}{chip("1Y", "1Y")}{chip("6M", "6M")}{chip("3M", "3M")}{chip("TRADE", "Trade", !selectedTrade)}</div> : undefined}>
        {state === "loading" && <div className="py-16 text-center text-xs text-slate-400">Loading prices…</div>}
        {state === "none" && <EmptyState icon={CandlestickChart} title="No price history available" hint={`Prices for ${bt.ticker} could not be loaded, so the trades can't be drawn on a chart.`} />}
        {state === "synthetic" && <EmptyState icon={CandlestickChart} title="Generated prices" hint="This run used generated prices, so a price chart would not show real market data." />}
        {state === "ready" && (
          <>
            <div className="h-72" aria-label="Price chart with trades"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={indexed} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} /><XAxis type="number" dataKey="i" domain={[0, Math.max(1, view.length - 1)]} ticks={ticks} tickFormatter={dateAt} {...AXIS_PROPS} /><YAxis {...AXIS_PROPS} domain={["auto", "auto"]} width={52} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v: any) => dateAt(Number(v))} />
              {selectedTrade && selA >= 0 && selZ >= 0 && <ReferenceArea x1={selA} x2={selZ} fill={selectedTrade.net_pnl > 0 ? UP_COLOR : DOWN_COLOR} fillOpacity={0.12} />}
              <Line type="monotone" dataKey="close" name="Close" stroke="#64748B" strokeWidth={1.3} dot={false} isAnimationActive={false} />
              <Scatter data={marks.entries} dataKey="price" name="Entry" shape={<EntryShape />} isAnimationActive={false} />
              <Scatter data={marks.exits} dataKey="price" name="Exit" shape={<EntryShape />} isAnimationActive={false} />
            </ComposedChart></ResponsiveContainer></div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span><span className="text-blue-400">▲</span> entry</span><span><span className="text-emerald-400">▼</span> winning exit</span><span><span className="text-rose-400">▼</span> losing exit</span>
              <span className="ml-auto font-mono">{marks.entries.length} entries · {marks.exits.length} exits in view</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
