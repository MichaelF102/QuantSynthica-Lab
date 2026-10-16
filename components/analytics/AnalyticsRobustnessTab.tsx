"use client";

import React, { useMemo } from "react";
import { Sparkles, Dices, Info } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi } from "@/components/ui/Card";
import { fmtPct, fmtInt } from "@/lib/utils";
import { AnalyticsFilters, btPoints, currencyOf, fmtMoney, monteCarlo } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { usePrimaryBacktest } from "./StrategyPicker";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

export default function AnalyticsRobustnessTab({ selectedBacktests, filters }: Props) {
  const { bt, picker } = usePrimaryBacktest(selectedBacktests);
  const pts = useMemo(() => (bt ? btPoints(bt, { ...filters, frequency: "Daily" }) : []), [bt, filters]);
  const mc = useMemo(() => monteCarlo(pts, 252, 1000, 20), [pts]);
  if (!bt || !mc) return <EmptyState icon={Sparkles} title="Not enough history to resample" hint="At least ~30 daily returns are needed for a bootstrap." />;

  const cur = currencyOf(bt);
  const base = pts[0].value;
  const cone = mc.cone.map((c) => ({ ...c, p5: c.p5 * base, p25: c.p25 * base, p50: c.p50 * base, p75: c.p75 * base, p95: c.p95 * base }));
  const end = cone[cone.length - 1];

  return (
    <div className="space-y-4">
      {picker}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={`Paths breaching ${mc.ddLimit}% drawdown`} value={fmtPct(mc.breachedPct, 1, false)} tone={mc.breachedPct > 20 ? "text-rose-400" : "text-emerald-400"} sub={`${fmtInt(Math.round((mc.breachedPct / 100) * mc.paths))} of ${fmtInt(mc.paths)} paths`} />
        <Kpi label="Probability of loss (1Y)" value={fmtPct(mc.lossPct, 1, false)} tone={mc.lossPct > 40 ? "text-rose-400" : "text-blue-400"} sub="Paths ending below start" />
        <Kpi label="Median 1Y outcome" value={fmtPct((end.p50 / base - 1) * 100)} tone={end.p50 >= base ? "text-emerald-400" : "text-rose-400"} sub={fmtMoney(end.p50, cur, true)} />
        <Kpi label="5th–95th pct outcome" value={`${fmtPct((end.p5 / base - 1) * 100, 0)} / ${fmtPct((end.p95 / base - 1) * 100, 0)}`} sub="Range of simulated 1Y returns" />
      </div>

      <Card
        title="Monte Carlo confidence cone"
        subtitle={`${fmtInt(mc.paths)} bootstrap paths, ${mc.horizon} trading days, from ${fmtInt(pts.length - 1)} realised daily returns`}
        info="Daily returns are resampled with replacement from this backtest's own history and compounded forward. It shows how sensitive outcomes are to the order of returns; it is not a forecast."
        icon={Dices}
        tone="purple"
      >
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cone} margin={{ top: 15, right: 15, left: 10, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="period" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => `${Math.round((v / base - 1) * 100)}%`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [fmtPct((Number(v) / base - 1) * 100), String(n)]} />
              <Area type="monotone" dataKey="p95" name="95th" stroke="#16A34A" fill="#16A34A" fillOpacity={0.08} isAnimationActive={false} />
              <Area type="monotone" dataKey="p75" name="75th" stroke="#2563EB" fill="#2563EB" fillOpacity={0.12} isAnimationActive={false} />
              <Area type="monotone" dataKey="p50" name="Median" stroke="#2563EB" strokeWidth={2} fill="#2563EB" fillOpacity={0.18} isAnimationActive={false} />
              <Area type="monotone" dataKey="p25" name="25th" stroke="#D97706" fill="#D97706" fillOpacity={0.12} isAnimationActive={false} />
              <Area type="monotone" dataKey="p5" name="5th" stroke="#DC2626" fill="#DC2626" fillOpacity={0.08} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <p className="flex items-start gap-2 rounded-lg border border-slate-800 bg-[#0b1222]/60 p-3 text-[11px] text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
        Overfitting tests such as the Deflated Sharpe Ratio or parameter-stability sweeps need the number of trials and a parameter grid. Run an optimisation first; they are not estimated here.
      </p>
    </div>
  );
}
