"use client";

import React, { useMemo } from "react";
import { LineChart as LineIcon, TrendingUp, Activity, BarChart3, CalendarRange } from "lucide-react";
import { ResponsiveContainer, ComposedChart, LineChart, AreaChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { ReturnHistogram } from "@/components/risk/ui/charts";
import { annualTable, currencyOf, fmtMoney, seriesStats, toPts, benchmarkLabel } from "@/lib/analyticsCalc";
import { mean, std } from "@/lib/risk/stats";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { formatRatio } from "@/lib/formatters";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

export default function PerformanceTab({ bt }: { bt: BacktestResult }) {
  const pts = useMemo(() => toPts(bt.equity_curve), [bt]);
  const stats = useMemo(() => seriesStats(pts, "Daily"), [pts]);
  const cur = currencyOf(bt);
  const rets = useMemo(() => pts.slice(1).map((p, i) => p.value / pts[i].value - 1), [pts]);
  const brets = useMemo(() => pts.slice(1).map((p, i) => p.bench / pts[i].bench - 1), [pts]);
  const annual = useMemo(() => annualTable(pts), [pts]);
  const win = Math.min(60, Math.max(20, Math.floor(pts.length / 4)));

  const eq = useMemo(() => {
    const v0 = pts[0]?.value ?? 1, b0 = pts[0]?.bench ?? 1;
    return pts.map((p) => ({ date: p.date, Strategy: p.value, Benchmark: (p.bench / b0) * v0, Excess: (p.value / v0 - p.bench / b0) * 100 }));
  }, [pts]);
  const rolling = useMemo(() => rets.map((_, i) => {
    if (i < win - 1) return null;
    const w = rets.slice(i - win + 1, i + 1), s = std(w);
    return { date: pts[i + 1].date, "Volatility (ann.)": s * Math.sqrt(252) * 100, Sharpe: s > 0 ? (mean(w) / s) * Math.sqrt(252) : 0 };
  }).filter(Boolean) as { date: string; "Volatility (ann.)": number; Sharpe: number }[], [rets, pts, win]);

  if (!stats || pts.length < 5) return <EmptyState icon={LineIcon} title="Not enough equity-curve data" hint="This run recorded too few observations to analyse." />;
  const up = rets.filter((r) => r > 0).length;
  const bName = benchmarkLabel(bt.benchmark);

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <Kpi label="Total return" value={fmtPct(stats.totalReturn)} tone={signTone(stats.totalReturn)} sub={<span className={signTone(stats.totalReturn - stats.benchReturn)}>{fmtPct(stats.totalReturn - stats.benchReturn)} vs bench</span>} />
        <Kpi label="CAGR" value={fmtPct(stats.cagr)} tone={signTone(stats.cagr)} sub={`Bench ${fmtPct(stats.benchCagr)}`} />
        <Kpi label="Volatility (ann.)" value={fmtPct(stats.vol, 1, false)} sub={`Bench ${fmtPct(stats.benchVol, 1, false)}`} />
        <Kpi label="Sharpe" value={formatRatio(stats.sharpe)} sub={`Bench ${formatRatio(stats.benchSharpe)}`} title="Rf = 0%" />
        <Kpi label="Sortino" value={formatRatio(stats.sortino)} />
        <Kpi label="Best day" value={fmtPct(Math.max(...rets) * 100)} tone="text-emerald-400" />
        <Kpi label="Worst day" value={fmtPct(Math.min(...rets) * 100)} tone="text-rose-400" />
        <Kpi label="Up days" value={fmtPct((up / rets.length) * 100, 1, false)} sub={`${fmtInt(up)} of ${fmtInt(rets.length)}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card title="Equity vs benchmark" subtitle={`${bt.strategy_name} vs ${bName}`} info="Portfolio value from the backtest's recorded equity curve, with the benchmark rebased to the same starting value." icon={LineIcon} tone="blue">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eq} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => fmtMoney(v, cur, true)} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtMoney(Number(v), cur)} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="Benchmark" stroke="#64748B" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line dataKey="Strategy" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Excess return" subtitle="Strategy minus benchmark, cumulative" info="Difference between the strategy's and the benchmark's cumulative return at each date. Above zero means the strategy is ahead." icon={TrendingUp} tone="emerald">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eq} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs><linearGradient id="btEx" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16A34A" stopOpacity={0.4} /><stop offset="100%" stopColor="#16A34A" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><ReferenceLine y={0} stroke="#475569" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v))} />
                  <Area dataKey="Excess" stroke="#16A34A" strokeWidth={2} fill="url(#btEx)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Rolling volatility and Sharpe" subtitle={`${win}-day window`} info="Annualised volatility (left, %) and Sharpe ratio (right, Rf = 0) over a sliding window." icon={Activity} tone="purple">
          {rolling.length < 3 ? <EmptyState icon={Activity} title="Window too short" /> : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rolling} margin={{ top: 8, right: 4, left: -6, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} />
                  <YAxis yAxisId="v" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><YAxis yAxisId="s" orientation="right" {...AXIS_PROPS} /><ReferenceLine yAxisId="s" y={0} stroke="#475569" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => (n === "Sharpe" ? Number(v).toFixed(2) : fmtPct(Number(v), 1, false))} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="v" dataKey="Volatility (ann.)" stroke="#D97706" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                  <Line yAxisId="s" dataKey="Sharpe" stroke="#7C3AED" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card title="Daily return distribution" subtitle="Strategy" info="Histogram of daily portfolio returns over the run. Red bars are losing days." icon={BarChart3} tone="rose">
          <ReturnHistogram returns={rets} fit height={240} />
        </Card>
      </div>

      <Card title="Annual performance" subtitle={`Strategy vs ${bName}`} info="Calendar-year return measured from the prior year-end close; the first and last years may be partial." icon={CalendarRange} tone="amber">
        <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
          <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Year</th><th className="py-1.5 text-right">Strategy</th><th className="py-1.5 text-right">Benchmark</th><th className="py-1.5 text-right">Excess</th><th className="py-1.5 text-right">Sharpe</th><th className="py-1.5 text-right">Max DD</th><th className="py-1.5 text-right">Days</th></tr></thead>
          <tbody className="divide-y divide-slate-800/50">{annual.map((r) => (
            <tr key={r.year} className="transition-colors hover:bg-slate-800/30">
              <td className="py-2 font-mono font-bold text-white">{r.year}</td>
              <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.strat))}>{fmtPct(r.strat)}</td><td className={cn("py-2 text-right font-mono", signTone(r.bench))}>{fmtPct(r.bench)}</td>
              <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.excess))}>{fmtPct(r.excess)}</td>
              <td className="py-2 text-right font-mono text-white">{r.sharpe === null || r.days < 20 ? "—" : formatRatio(r.sharpe)}</td><td className="py-2 text-right font-mono text-rose-400">{r.maxDD === null ? "—" : fmtPct(-r.maxDD, 1)}</td><td className="py-2 text-right font-mono text-slate-400">{fmtInt(r.days)}</td>
            </tr>))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
