"use client";

import React, { useMemo } from "react";
import { Layers } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState } from "@/components/ui/Card";
import { exposureSeries } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { fmtPct } from "@/lib/utils";

/** How much capital was at work, and how many trades were open at once. */
export default function ExposureCard({ bt }: { bt: BacktestResult }) {
  const x = useMemo(() => exposureSeries(bt), [bt]);
  const chip = (label: string, value: string, warn = false) => (
    <div className="rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-1.5 text-center">
      <div className={`font-mono text-sm font-bold ${warn ? "text-amber-300" : "text-white"}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
  return (
    <Card title="Exposure" subtitle="Capital deployed and trades open at once" info="Gross exposure is the cost of open positions divided by portfolio value at each close. Several trades open at once means they are correlated bets, which inflates the trade count and makes win rate look more certain than it is." icon={Layers} tone="amber"
      action={x ? <div className="flex flex-wrap gap-2">{chip("Avg exposure", fmtPct(x.avgExposure, 0, false))}{chip("Time in market", fmtPct(x.timeInMarket, 0, false))}{chip("Max open", String(x.maxConcurrent), x.maxConcurrent > 1)}</div> : undefined}>
      {!x || x.maxConcurrent === 0 ? <EmptyState icon={Layers} title="No positions held" hint="This run never held a position." /> : (
        <>
          <div className="h-44" aria-label="Exposure and open positions"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={x.series} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} />
            <YAxis yAxisId="e" {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(Number(v))}%`} />
            <YAxis yAxisId="p" orientation="right" {...AXIS_PROPS} allowDecimals={false} width={28} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, k: any) => (k === "Exposure" ? fmtPct(Number(v), 1, false) : v)} />
            <Area yAxisId="e" type="stepAfter" dataKey="exposure" name="Exposure" stroke="#D97706" fill="#D97706" fillOpacity={0.15} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line yAxisId="p" type="stepAfter" dataKey="positions" name="Open positions" stroke="#2563EB" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </ComposedChart></ResponsiveContainer></div>
          {x.maxConcurrent > 1 && <p className="mt-2 text-[11px] text-amber-300">Up to {x.maxConcurrent} trades were open at once (about {x.avgConcurrentWhenInvested.toFixed(1)} on average while invested), so the trade-level statistics describe overlapping, correlated bets.</p>}
        </>
      )}
    </Card>
  );
}
