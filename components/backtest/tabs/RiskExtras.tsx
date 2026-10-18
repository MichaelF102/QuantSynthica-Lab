"use client";

import React, { useMemo, useState } from "react";
import { Activity, TrendingDown, Gauge } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState } from "@/components/ui/Card";
import { drawdownEpisodes, rollingVol, toPts, currencyOf, fmtMoney } from "@/lib/analyticsCalc";
import { varEs, VarMethod } from "@/lib/risk/var";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

const METHODS: VarMethod[] = ["Historical", "Parametric", "Cornish-Fisher"];

/** Risk detail specific to this run: how long and deep each drawdown was, how volatility moved, and VaR by method. */
export default function RiskExtras({ bt }: { bt: BacktestResult }) {
  const pts = useMemo(() => toPts(bt.equity_curve), [bt]);
  const cur = currencyOf(bt);
  const [win, setWin] = useState(30);
  const episodes = useMemo(() => drawdownEpisodes(pts, 0.5, 6), [pts]);
  const vol = useMemo(() => rollingVol(pts, win), [pts, win]);
  const returns = useMemo(() => pts.slice(1).map((p, i) => (pts[i].value > 0 ? p.value / pts[i].value - 1 : 0)), [pts]);
  const last = pts[pts.length - 1]?.value ?? 0;
  const hasBench = pts.some((p) => p.bench !== pts[0]?.bench);

  return (
    <div className="space-y-4">
      <Card title="Drawdown episodes" subtitle="Each fall from a peak, deepest first" info="An episode starts when the portfolio drops below its previous high and ends when that high is regained. Days are trading days. Episodes shallower than 0.5% are hidden." icon={TrendingDown} tone="rose">
        {episodes.length === 0 ? <EmptyState icon={TrendingDown} title="No drawdowns of 0.5% or more" /> : (
          <div className="w-full overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-left text-xs" aria-label="Drawdown episodes">
            <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">Peak</th><th className="py-1.5">Trough</th><th className="py-1.5">Recovered</th><th className="py-1.5 text-right">Depth</th><th className="py-1.5 text-right">To trough</th><th className="py-1.5 text-right">To recover</th><th className="py-1.5 text-right">Length</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">{episodes.map((e) => (
              <tr key={e.peakDate} className="hover:bg-slate-800/30">
                <td className="py-2 text-slate-300">{e.peakDate}</td><td className="py-2 text-slate-300">{e.troughDate}</td>
                <td className={cn("py-2", e.recoveryDate ? "text-slate-300" : "text-amber-300")}>{e.recoveryDate ?? "Not yet"}</td>
                <td className="py-2 text-right font-semibold text-rose-400">{fmtPct(-e.depth, 1)}</td>
                <td className="py-2 text-right text-slate-300">{fmtInt(e.daysToTrough)} d</td>
                <td className="py-2 text-right text-slate-300">{e.daysToRecover === null ? "—" : `${fmtInt(e.daysToRecover)} d`}</td>
                <td className="py-2 text-right text-slate-400">{fmtInt(e.length)} d</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Card>

      <Card title="Rolling volatility" subtitle={`Annualised, ${win}-day window${hasBench ? ", strategy vs benchmark" : ""}`} info="Standard deviation of daily returns over a trailing window, scaled to a year. Spikes show when the strategy's risk changed, and the gap to the benchmark shows how much of it is the market's." icon={Activity} tone="amber"
        action={<div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5 text-[11px]" role="group" aria-label="Volatility window">{[30, 60, 90].map((w) => <button key={w} type="button" aria-pressed={win === w} onClick={() => setWin(w)} className={cn("rounded-md px-2.5 py-1 font-semibold", win === w ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{w}d</button>)}</div>}>
        {vol.length === 0 ? <EmptyState icon={Activity} title="Not enough history" hint={`Needs more than ${win} trading days.`} /> : (
          <div className="h-56" aria-label="Rolling volatility"><ResponsiveContainer width="100%" height="100%"><LineChart data={vol} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(Number(v))}%`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v), 1, false)} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="strat" name="Strategy" stroke="#2563EB" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            {hasBench && <Line dataKey="bench" name="Benchmark" stroke="#64748B" strokeDasharray="4 4" strokeWidth={1.3} dot={false} isAnimationActive={false} />}
          </LineChart></ResponsiveContainer></div>
        )}
      </Card>

      <Card title="Value at Risk by method" subtitle="One-day loss on the current portfolio value" info="Historical reads the loss straight from this run's daily returns. Parametric assumes they are normal. Cornish-Fisher adjusts the normal for skew and fat tails. If the methods disagree a lot, the returns are far from normal." icon={Gauge} tone="purple">
        {returns.length < 20 ? <EmptyState icon={Gauge} title="Not enough returns" hint="At least 20 daily returns are needed." /> : (
          <div className="w-full overflow-x-auto"><table className="w-full min-w-[480px] border-collapse text-left text-xs" aria-label="Value at risk by method">
            <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">Method</th><th className="py-1.5 text-right">VaR 95%</th><th className="py-1.5 text-right">ES 95%</th><th className="py-1.5 text-right">VaR 99%</th><th className="py-1.5 text-right">ES 99%</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">{METHODS.map((m) => {
              const a = varEs(returns, 0.95, m), b = varEs(returns, 0.99, m);
              const cell = (x: number) => <td className="py-2 text-right text-rose-400">{fmtPct(-x * 100, 2)}<span className="ml-1.5 text-[10px] text-slate-500">{fmtMoney(x * last, cur, true)}</span></td>;
              return <tr key={m} className="hover:bg-slate-800/30"><td className="py-2 font-sans font-medium text-slate-200">{m}</td>{cell(a.var)}{cell(a.es)}{cell(b.var)}{cell(b.es)}</tr>;
            })}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
