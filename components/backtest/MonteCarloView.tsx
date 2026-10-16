"use client";

import React, { useMemo, useState } from "react";
import { Dices, HelpCircle, Play } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";
import { currencyOf, fmtMoney } from "@/lib/analyticsCalc";
import { fmtPct, fmtInt } from "@/lib/utils";

function rng(seed: number) {
  let a = seed;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Resamples this run's own closed trades (with replacement) to see how much the end result depends on which trades happened. */
export default function MonteCarloView({ bt }: { bt: BacktestResult }) {
  const [iterations, setIterations] = useState(5000);
  const [seed, setSeed] = useState(1);
  const cur = currencyOf(bt);
  const capital = bt.equity_curve[0]?.portfolio_value ?? 0;
  const pnl = useMemo(() => bt.trades.map((t) => t.net_pnl).filter(Number.isFinite), [bt]);

  const sim = useMemo(() => {
    if (pnl.length < 5 || !capital) return null;
    const rand = rng(pnl.length * 7919 + seed * 104729);
    const out: number[] = [];
    for (let k = 0; k < iterations; k++) {
      let s = 0;
      for (let i = 0; i < pnl.length; i++) s += pnl[Math.floor(rand() * pnl.length)];
      out.push((s / capital) * 100);
    }
    out.sort((a, b) => a - b);
    const q = (p: number) => out[Math.min(out.length - 1, Math.floor(p * out.length))];
    const lo = out[0], hi = out[out.length - 1], bins = 14, w = (hi - lo) / bins || 1;
    const hist = Array.from({ length: bins }, (_, i) => ({ from: lo + i * w, to: lo + (i + 1) * w, count: 0 }));
    out.forEach((v) => { hist[Math.min(bins - 1, Math.floor((v - lo) / w))].count++; });
    return { mean: out.reduce((a, b) => a + b, 0) / out.length, p5: q(0.05), p50: q(0.5), p95: q(0.95), loss: (out.filter((v) => v < 0).length / out.length) * 100, hist };
  }, [pnl, capital, iterations, seed]);

  if (!sim) return <EmptyState icon={Dices} title="Too few trades to resample" hint={`This run closed ${pnl.length} trade${pnl.length === 1 ? "" : "s"}; at least 5 are needed for a meaningful bootstrap.`} />;
  const realised = (pnl.reduce((a, b) => a + b, 0) / capital) * 100;

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi label="Realised return" value={fmtPct(realised)} tone={signTone(realised)} sub="Sum of this run's trades" />
        <Kpi label="Expected (mean)" value={fmtPct(sim.mean)} tone={signTone(sim.mean)} />
        <Kpi label="5th percentile" value={fmtPct(sim.p5)} tone={signTone(sim.p5)} sub="Worst 5% of resamples" />
        <Kpi label="Median" value={fmtPct(sim.p50)} tone={signTone(sim.p50)} />
        <Kpi label="95th percentile" value={fmtPct(sim.p95)} tone={signTone(sim.p95)} sub="Best 5% of resamples" />
        <Kpi label="Probability of loss" value={fmtPct(sim.loss, 1, false)} tone={sim.loss > 40 ? "text-rose-400" : "text-amber-400"} sub={`Ending below ${fmtMoney(capital, cur, true)}`} />
      </div>
      <Card title="Terminal return distribution" subtitle={`${fmtInt(iterations)} resamples of ${fmtInt(pnl.length)} trades`} info="Each simulation draws this run's trades at random with replacement and adds their P&L. The spread shows how dependent the result is on the specific trades taken. It does not forecast future prices." icon={Dices} tone="purple"
        action={<div className="flex items-center gap-2">
          <select value={iterations} onChange={(e) => setIterations(Number(e.target.value))} className="rounded-lg border border-slate-800 bg-[#080d1a] px-2 py-1.5 text-xs text-slate-200 focus:outline-none">
            {[1000, 5000, 10000].map((n) => <option key={n} value={n}>{fmtInt(n)} iterations</option>)}
          </select>
          <button onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"><Play className="h-3 w-3 fill-current" />Re-run</button>
        </div>}>
        <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={sim.hist.map((h) => ({ ...h, label: `${h.from.toFixed(1)}%` }))} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="label" {...AXIS_PROPS} interval={1} /><YAxis {...AXIS_PROPS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${fmtInt(Number(v))} (${((Number(v) / iterations) * 100).toFixed(1)}%)`, `${p.payload.from.toFixed(1)}% to ${p.payload.to.toFixed(1)}%`]} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>{sim.hist.map((h, i) => <Cell key={i} fill={(h.from + h.to) / 2 >= 0 ? UP_COLOR : DOWN_COLOR} />)}</Bar>
        </BarChart></ResponsiveContainer></div>
      </Card>
      <div className="flex items-start gap-2 rounded-xl border border-slate-800/90 bg-[#0b1222] p-3 text-xs text-slate-400"><HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />Return is trade P&amp;L divided by the run&apos;s starting capital. Trades are treated as independent, which ignores position overlap and market regime.</div>
    </div>
  );
}
