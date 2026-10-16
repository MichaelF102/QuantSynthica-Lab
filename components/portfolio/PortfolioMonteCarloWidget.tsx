"use client";

import React, { useMemo } from "react";
import { Dices } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, EmptyState } from "@/components/ui/Card";
import { fmtPct } from "@/lib/utils";
import { PortfolioResult } from "@/lib/portfolio/engine";
import { CurrencyCode, fmtMoney, monteCarlo } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";

export default function PortfolioMonteCarloWidget({ result, currency }: { result: PortfolioResult; currency: CurrencyCode }) {
  const mc = useMemo(() => monteCarlo(result.pts, 252, 1000, 20), [result]);
  const v0 = result.value[result.value.length - 1];
  return (
    <Card title="Monte Carlo" subtitle="1,000 bootstrap paths, 1 year forward" info="Daily portfolio returns are resampled with replacement from the analysis window and compounded from today's value. It shows sensitivity to return ordering; it is not a forecast." icon={Dices} tone="purple">
      {!mc ? (
        <EmptyState icon={Dices} title="Not enough history" hint="Need ~30 daily returns." />
      ) : (
        <>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mc.cone.map((c) => ({ ...c, p5: c.p5 * v0, p25: c.p25 * v0, p50: c.p50 * v0, p75: c.p75 * v0, p95: c.p95 * v0 }))} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="period" {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => fmtMoney(v, currency, true)} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [fmtMoney(Number(v), currency), String(n)]} />
                <Area dataKey="p95" name="95th" stroke="#16A34A" fill="#16A34A" fillOpacity={0.08} isAnimationActive={false} />
                <Area dataKey="p50" name="Median" stroke="#2563EB" strokeWidth={2} fill="#2563EB" fillOpacity={0.15} isAnimationActive={false} />
                <Area dataKey="p5" name="5th" stroke="#DC2626" fill="#DC2626" fillOpacity={0.08} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div>P(loss over 1Y) <span className="font-mono font-semibold text-white">{fmtPct(mc.lossPct, 1, false)}</span></div>
            <div>P(DD &gt; {mc.ddLimit}%) <span className="font-mono font-semibold text-white">{fmtPct(mc.breachedPct, 1, false)}</span></div>
          </div>
        </>
      )}
    </Card>
  );
}
