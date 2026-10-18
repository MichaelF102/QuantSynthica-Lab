"use client";

import React, { useMemo, useState } from "react";
import { Dices, HelpCircle, Play, TrendingDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ComposedChart, Area, Line, ReferenceLine } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";
import { currencyOf, fmtMoney } from "@/lib/analyticsCalc";
import { blockBootstrap, histogram, rng } from "@/lib/monteCarlo";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

type Method = "daily" | "trades";

/**
 * Two ways to ask "how much of this result was luck of the draw?"
 * Daily: block-bootstrap the run's own daily returns, which keeps streaks and the time spent out of the market,
 *        and gives a drawdown distribution as well as a return distribution.
 * Trades: resample the closed trades as independent bets (only sound when they did not overlap).
 */
export default function MonteCarloView({ bt }: { bt: BacktestResult }) {
  const [method, setMethod] = useState<Method>("daily");
  const [iterations, setIterations] = useState(5000);
  const [block, setBlock] = useState(10);
  const [ddLevel, setDdLevel] = useState(20);
  const [seed, setSeed] = useState(1);
  const cur = currencyOf(bt);
  const curve = bt.equity_curve;
  const capital = curve[0]?.portfolio_value ?? 0;

  const returns = useMemo(() => curve.slice(1).map((p, i) => p.portfolio_value / curve[i].portfolio_value - 1).filter(Number.isFinite), [curve]);
  const realisedPct = curve.length > 1 && capital ? (curve[curve.length - 1].portfolio_value / capital - 1) * 100 : 0;
  const realisedDd = useMemo(() => { let pk = 0, w = 0; curve.forEach((p) => { pk = Math.max(pk, p.portfolio_value); w = Math.max(w, pk > 0 ? (pk - p.portfolio_value) / pk : 0); }); return w * 100; }, [curve]);

  const daily = useMemo(() => (method === "daily" ? blockBootstrap(returns, { iterations, block, seed }) : null), [method, returns, iterations, block, seed]);

  const pnl = useMemo(() => bt.trades.map((t) => t.net_pnl).filter(Number.isFinite), [bt]);
  const byTrade = useMemo(() => {
    if (method !== "trades" || pnl.length < 5 || !capital) return null;
    const rand = rng(pnl.length * 7919 + seed * 104729);
    const out: number[] = [];
    for (let k = 0; k < iterations; k++) { let s = 0; for (let i = 0; i < pnl.length; i++) s += pnl[Math.floor(rand() * pnl.length)]; out.push((s / capital) * 100); }
    out.sort((a, b) => a - b);
    const q = (p: number) => out[Math.min(out.length - 1, Math.floor(p * out.length))];
    return { terminal: out, mean: out.reduce((a, b) => a + b, 0) / out.length, p5: q(0.05), p50: q(0.5), p95: q(0.95), probLoss: (out.filter((v) => v < 0).length / out.length) * 100 };
  }, [method, pnl, capital, iterations, seed]);

  const res = method === "daily" ? daily : byTrade;
  const tradeSum = (pnl.reduce((a, b) => a + b, 0) / (capital || 1)) * 100;
  const overlapping = useMemo(() => {
    const spans = bt.trades.map((t) => [t.entry_date, t.exit_date] as const).sort();
    let end = ""; let n = 0;
    for (const [a, b] of spans) { if (a < end) n++; if (b > end) end = b; }
    return n;
  }, [bt.trades]);

  const methodSwitch = (
    <div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5 text-[11px]" role="group" aria-label="Method">
      {([["daily", "Daily returns"], ["trades", "Trades"]] as const).map(([m, l]) => (
        <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)} className={cn("rounded-md px-2.5 py-1 font-semibold", method === m ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{l}</button>
      ))}
    </div>
  );
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      {methodSwitch}
      <div className="w-36"><Select label="Iterations" value={String(iterations)} onChange={(v) => setIterations(Number(v))} options={[1000, 5000, 10000].map((n) => ({ value: String(n), label: `${fmtInt(n)} iterations` }))} /></div>
      {method === "daily" && <div className="w-32"><Select label="Block length" value={String(block)} onChange={(v) => setBlock(Number(v))} options={[{ value: "1", label: "Block 1 (iid)" }, { value: "5", label: "Block 5 days" }, { value: "10", label: "Block 10 days" }, { value: "20", label: "Block 20 days" }]} /></div>}
      <button onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"><Play className="h-3 w-3 fill-current" />Re-run</button>
    </div>
  );

  if (!res) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{controls}</div>
        <EmptyState icon={Dices} title={method === "daily" ? "Too few days to resample" : "Too few trades to resample"}
          hint={method === "daily" ? `This run has ${returns.length} daily returns; at least 30 are needed for a block bootstrap.` : `This run closed ${pnl.length} trade${pnl.length === 1 ? "" : "s"}; at least 5 are needed. Daily returns need only 30 days.`} />
      </div>
    );
  }

  const hist = histogram(res.terminal);
  const ddHist = daily ? histogram(daily.maxDrawdown) : null;

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi label="Realised return" value={fmtPct(method === "daily" ? realisedPct : tradeSum)} tone={signTone(method === "daily" ? realisedPct : tradeSum)} sub={method === "daily" ? "This run, end to end" : "Sum of this run's trades"} />
        <Kpi label="Median" value={fmtPct(res.p50)} tone={signTone(res.p50)} sub={`Mean ${fmtPct(res.mean)}`} />
        <Kpi label="5th percentile" value={fmtPct(res.p5)} tone={signTone(res.p5)} sub="Worst 5% of resamples" />
        <Kpi label="95th percentile" value={fmtPct(res.p95)} tone={signTone(res.p95)} sub="Best 5% of resamples" />
        <Kpi label="Probability of loss" value={fmtPct(res.probLoss, 1, false)} tone={res.probLoss > 40 ? "text-rose-400" : "text-amber-400"} sub={`Ending below ${fmtMoney(capital, cur, true)}`} />
        {daily ? <Kpi label="Median max drawdown" value={fmtPct(-daily.ddMedian, 1)} tone="text-rose-400" sub={`Realised ${fmtPct(-realisedDd, 1)}`} /> : <Kpi label="Overlapping trades" value={String(overlapping)} tone={overlapping ? "text-amber-400" : "text-white"} sub="Break the independence assumption" />}
      </div>

      {daily && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Worst-case drawdown" value={fmtPct(-daily.ddP95, 1)} tone="text-rose-400" sub="95th percentile of max drawdown" />
          <Kpi label={`P(drawdown ≥ ${ddLevel}%)`} value={fmtPct(daily.probDrawdown(ddLevel), 1, false)} tone={daily.probDrawdown(ddLevel) > 25 ? "text-rose-400" : "text-amber-400"} sub={<span className="flex gap-1">{[10, 20, 30].map((l) => <button key={l} type="button" onClick={() => setDdLevel(l)} aria-pressed={ddLevel === l} className={cn("rounded px-1.5", ddLevel === l ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{l}%</button>)}</span>} />
          <Kpi label="P(losing half)" value={fmtPct(daily.probRuin, 1, false)} tone={daily.probRuin > 0 ? "text-rose-400" : "text-white"} sub="Equity ever below 50%" />
          <Kpi label="Sample" value={`${fmtInt(daily.days)} days`} sub={`Blocks of ${daily.block}`} />
        </div>
      )}

      {overlapping > 0 && method === "trades" && (
        <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">{overlapping} of {bt.trades.length} trades overlapped another one, so they are not independent and this view overstates certainty. Use <b>Daily returns</b> instead.</div>
      )}

      {daily && (
        <Card title="Equity paths" subtitle={`${fmtInt(iterations)} resamples of ${fmtInt(daily.days)} days, start = 100`} info="Shaded bands show where 50% (dark) and 90% (light) of the resampled equity paths fall on each day. The line is this run's actual path." icon={Dices} tone="blue" action={controls}>
          <div className="h-72" aria-label="Fan chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={daily.fan.map((f, i) => ({ ...f, band90: [f.p5, f.p95], band50: [f.p25, f.p75], actual: curve[Math.min(curve.length - 1, f.step)] ? (curve[Math.min(curve.length - 1, f.step)].portfolio_value / capital) * 100 : null, i }))} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="step" {...AXIS_PROPS} tickFormatter={(v) => `d${v}`} /><YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => String(Math.round(Number(v)))} />
            <ReferenceLine y={100} stroke="#475569" strokeDasharray="3 3" />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => (Array.isArray(v) ? `${v[0].toFixed(1)} to ${v[1].toFixed(1)}` : Number(v).toFixed(1))} />
            <Area dataKey="band90" name="90% of paths" stroke="none" fill="#2563EB" fillOpacity={0.14} isAnimationActive={false} />
            <Area dataKey="band50" name="50% of paths" stroke="none" fill="#2563EB" fillOpacity={0.28} isAnimationActive={false} />
            <Line dataKey="p50" name="Median" stroke="#93C5FD" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line dataKey="actual" name="This run" stroke="#F8FAFC" strokeWidth={1.8} dot={false} isAnimationActive={false} />
          </ComposedChart></ResponsiveContainer></div>
        </Card>
      )}

      <div className={cn("grid grid-cols-1 gap-4", ddHist && "lg:grid-cols-2")}>
        <Card title="Terminal return distribution" subtitle={method === "daily" ? "Return over the whole window" : `${fmtInt(iterations)} resamples of ${fmtInt(pnl.length)} trades`} info="Where the end result lands across all resamples. The spread shows how much of this run's outcome depends on the order and the specific days or trades that happened. It does not forecast future prices." icon={Dices} tone="purple" action={!daily ? controls : undefined}>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={hist.map((h) => ({ ...h, label: `${h.from.toFixed(1)}%` }))} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="label" {...AXIS_PROPS} interval={1} /><YAxis {...AXIS_PROPS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${fmtInt(Number(v))} (${((Number(v) / iterations) * 100).toFixed(1)}%)`, `${p.payload.from.toFixed(1)}% to ${p.payload.to.toFixed(1)}%`]} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>{hist.map((h, i) => <Cell key={i} fill={(h.from + h.to) / 2 >= 0 ? UP_COLOR : DOWN_COLOR} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
        </Card>
        {ddHist && (
          <Card title="Max drawdown distribution" subtitle="Deepest peak-to-trough fall on each path" info="How deep the worst fall was on each resampled path. If the realised drawdown sits at the mild end, the run may have been lucky about ordering." icon={TrendingDown} tone="rose">
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={ddHist.map((h) => ({ ...h, label: `${h.from.toFixed(0)}%` }))} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="label" {...AXIS_PROPS} interval={1} /><YAxis {...AXIS_PROPS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${fmtInt(Number(v))} (${((Number(v) / iterations) * 100).toFixed(1)}%)`, `${p.payload.from.toFixed(1)}% to ${p.payload.to.toFixed(1)}%`]} />
              <Bar dataKey="count" fill={DOWN_COLOR} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart></ResponsiveContainer></div>
          </Card>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-800/90 bg-[#0b1222] p-3 text-xs text-slate-400"><HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
        {method === "daily" ? `Daily returns are resampled in blocks of ${daily?.block} consecutive days, which keeps streaks and the days spent out of the market. It shows the range of outcomes this return stream could have produced; it assumes the future resembles this window.` : "Return is trade P&L divided by the run's starting capital. Trades are treated as independent, which ignores position overlap and market regime."}
      </div>
    </div>
  );
}
