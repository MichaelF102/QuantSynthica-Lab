"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, Dices, Play, TrendingDown, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Area, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { AnalyticsFilters, btPoints, currencyOf, exposureSeries, fmtMoney } from "@/lib/analyticsCalc";
import { blockBootstrap, histogram } from "@/lib/monteCarlo";
import { AXIS_PROPS, DOWN_COLOR, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR } from "@/lib/chartTheme";
import { usePrimaryBacktest } from "./StrategyPicker";
import RobustnessStudy from "./RobustnessStudy";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

const opts = (xs: [string, string][]) => xs.map(([value, label]) => ({ value, label }));

/**
 * Resamples this run's own daily returns in blocks (keeping streaks and idle stretches) and projects them over a chosen horizon.
 * It shows how much the outcome depends on the order of what happened, not what will happen.
 */
export default function AnalyticsRobustnessTab({ selectedBacktests, filters }: Props) {
  const { bt, picker } = usePrimaryBacktest(selectedBacktests);
  const [horizon, setHorizon] = useState(252);
  const [block, setBlock] = useState(10);
  const [iterations, setIterations] = useState(5000);
  const [ddLevel, setDdLevel] = useState(20);
  const [seed, setSeed] = useState(1);

  const pts = useMemo(() => (bt ? btPoints(bt, { ...filters, frequency: "Daily" }) : []), [bt, filters]);
  const returns = useMemo(() => pts.slice(1).map((p, i) => (pts[i].value > 0 ? p.value / pts[i].value - 1 : 0)), [pts]);
  const mc = useMemo(() => blockBootstrap(returns, { iterations, block, seed, horizon }), [returns, iterations, block, seed, horizon]);
  const exposure = useMemo(() => (bt ? exposureSeries(bt) : null), [bt]);

  if (!bt || !mc) return <div className="space-y-4">{picker}<EmptyState icon={Sparkles} title="Not enough history to resample" hint="At least 30 daily returns are needed for a bootstrap." /></div>;

  const cur = currencyOf(bt);
  const base = pts[0].value;
  const heldOn = new Map((exposure?.series ?? []).map((e) => [e.date, e.positions]));
  const inMarket = pts.length ? (pts.filter((p) => (heldOn.get(p.date) ?? 0) > 0).length / pts.length) * 100 : 0;
  const trades = bt.trades.length;
  const warnings: string[] = [];
  if (returns.length < 120) warnings.push(`Short sample: only ${fmtInt(returns.length)} daily returns (about ${Math.max(1, Math.round(returns.length / 21))} months). Projecting ${fmtInt(horizon)} days from it is speculative.`);
  else if (horizon > returns.length) warnings.push(`The ${fmtInt(horizon)}-day horizon is longer than the ${fmtInt(returns.length)} days of history, so the same return stream is repeated to fill it.`);
  if (inMarket < 30) warnings.push(`The strategy held a position on only ${fmtPct(inMarket, 0, false)} of days; the resampling reproduces that idleness, so outcomes cluster near zero.`);
  if (trades < 30) warnings.push(`Only ${trades} trade${trades === 1 ? "" : "s"}: the return stream comes from very few decisions, so the spread says little about robustness.`);

  const fan = mc.fan.map((f) => ({ step: f.step, band90: [f.p5 - 100, f.p95 - 100], band50: [f.p25 - 100, f.p75 - 100], p50: f.p50 - 100 }));
  const hist = histogram(mc.terminal), ddHist = histogram(mc.maxDrawdown);
  const lab = (h: { from: number; to: number }) => `${h.from.toFixed(h.to - h.from < 5 ? 1 : 0)}%`;
  const unit = horizon === 252 ? "1Y" : horizon === 126 ? "6M" : horizon === 63 ? "3M" : `${horizon}d`;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-28"><Select label="Horizon" value={String(horizon)} onChange={(v) => setHorizon(Number(v))} options={opts([["63", "3 months"], ["126", "6 months"], ["252", "1 year"], ["504", "2 years"]])} /></div>
      <div className="w-32"><Select label="Block length" value={String(block)} onChange={(v) => setBlock(Number(v))} options={opts([["1", "Block 1 (iid)"], ["5", "Block 5 days"], ["10", "Block 10 days"], ["20", "Block 20 days"]])} /></div>
      <div className="w-32"><Select label="Iterations" value={String(iterations)} onChange={(v) => setIterations(Number(v))} options={opts([["1000", "1,000 paths"], ["5000", "5,000 paths"], ["10000", "10,000 paths"]])} /></div>
      <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"><Play className="h-3 w-3 fill-current" />Re-run</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {picker}
      {warnings.length > 0 && (
        <div role="note" data-testid="robustness-warnings" className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          {warnings.map((w) => <p key={w} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{w}</p>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={`Probability of loss (${unit})`} value={fmtPct(mc.probLoss, 1, false)} tone={mc.probLoss > 40 ? "text-rose-400" : "text-blue-400"} sub="Paths ending below start" />
        <Kpi label={`Median ${unit} outcome`} value={fmtPct(mc.p50)} tone={signTone(mc.p50)} sub={fmtMoney(base * (1 + mc.p50 / 100), cur, true)} />
        <Kpi label="5th–95th pct outcome" value={`${fmtPct(mc.p5, 0)} / ${fmtPct(mc.p95, 0)}`} sub={`Range of simulated ${unit} returns`} />
        <Kpi label="Median max drawdown" value={fmtPct(-mc.ddMedian, 1)} tone="text-rose-400" sub={`Worst 5%: ${fmtPct(-mc.ddP95, 1)}`} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={`P(drawdown ≥ ${ddLevel}%)`} value={fmtPct(mc.probDrawdown(ddLevel), 1, false)} tone={mc.probDrawdown(ddLevel) > 25 ? "text-rose-400" : "text-amber-400"} sub={<span className="flex gap-1">{[10, 20, 30].map((l) => <button key={l} type="button" aria-pressed={ddLevel === l} onClick={() => setDdLevel(l)} className={cn("rounded px-1.5", ddLevel === l ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{l}%</button>)}</span>} />
        <Kpi label="P(losing half)" value={fmtPct(mc.probRuin, 1, false)} tone={mc.probRuin > 0 ? "text-rose-400" : "text-white"} sub="Equity ever below 50%" />
        <Kpi label="History used" value={`${fmtInt(returns.length)} days`} sub={`${trades} trades · blocks of ${mc.block}`} />
        <Kpi label="Invested" value={fmtPct(inMarket, 0, false)} tone={inMarket < 30 ? "text-amber-300" : "text-white"} sub="Share of days with a position" />
      </div>

      <Card title="Equity paths" subtitle={`${fmtInt(iterations)} block-bootstrap paths · ${fmtInt(mc.horizon)} trading days · from ${fmtInt(returns.length)} realised daily returns`} info="Shaded bands show where 50% (dark) and 90% (light) of the resampled paths fall on each day, as the change from the start. Daily returns are resampled in blocks of consecutive days, which keeps streaks and idle stretches. It shows sensitivity to ordering; it is not a forecast." icon={Dices} tone="purple" action={controls}>
        <div className="h-60" aria-label="Equity path bands"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={fan} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="step" {...AXIS_PROPS} minTickGap={48} tickFormatter={(v) => `d${v}`} /><YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => `${Math.round(Number(v))}%`} />
          <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => (Array.isArray(v) ? `${v[0].toFixed(1)}% to ${v[1].toFixed(1)}%` : `${Number(v).toFixed(1)}%`)} />
          <Area dataKey="band90" name="90% of paths" stroke="none" fill="#2563EB" fillOpacity={0.14} isAnimationActive={false} />
          <Area dataKey="band50" name="50% of paths" stroke="none" fill="#2563EB" fillOpacity={0.28} isAnimationActive={false} />
          <Line dataKey="p50" name="Median" stroke="#93C5FD" strokeWidth={1.8} dot={false} isAnimationActive={false} />
        </ComposedChart></ResponsiveContainer></div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Outcome distribution" subtitle={`Return over ${unit}`} info="Where the end result lands across all paths." icon={Dices} tone="blue">
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={hist.map((h) => ({ ...h, label: lab(h) }))} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="label" {...AXIS_PROPS} interval={1} /><YAxis {...AXIS_PROPS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${fmtInt(Number(v))} (${((Number(v) / iterations) * 100).toFixed(1)}%)`, `${p.payload.from.toFixed(1)}% to ${p.payload.to.toFixed(1)}%`]} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>{hist.map((h, i) => <Cell key={i} fill={(h.from + h.to) / 2 >= 0 ? UP_COLOR : DOWN_COLOR} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
        </Card>
        <Card title="Max drawdown distribution" subtitle="Deepest fall on each path" info="How deep the worst fall was on each resampled path." icon={TrendingDown} tone="rose">
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={ddHist.map((h) => ({ ...h, label: lab(h) }))} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="label" {...AXIS_PROPS} interval={1} /><YAxis {...AXIS_PROPS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${fmtInt(Number(v))} (${((Number(v) / iterations) * 100).toFixed(1)}%)`, `${p.payload.from.toFixed(1)}% to ${p.payload.to.toFixed(1)}%`]} />
            <Bar dataKey="count" fill={DOWN_COLOR} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart></ResponsiveContainer></div>
        </Card>
      </div>

      <RobustnessStudy bt={bt} filters={filters} />
    </div>
  );
}
