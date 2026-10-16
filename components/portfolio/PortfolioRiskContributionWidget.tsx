"use client";

import React from "react";
import { Target } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card } from "@/components/ui/Card";
import { fmtPct } from "@/lib/utils";
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";

export default function PortfolioRiskContributionWidget({ result }: { result: PortfolioResult }) {
  const m = riskModel(result);
  const data = m.assets.map((a, i) => ({ ticker: a.ticker, weight: a.weight, risk: m.rc[i] }));
  return (
    <Card title="Risk contribution" subtitle={`Share of portfolio variance · vol ${fmtPct(m.portVolAnn, 2, false)}`} info="Marginal risk contribution: w_i × (Σw)_i ÷ portfolio variance, from the covariance of daily returns. Compare with the capital weight to see which holding drives risk." icon={Target} tone="rose">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="ticker" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [fmtPct(Number(v), 1, false), n === "risk" ? "Risk share" : "Capital weight"]} />
            <Bar dataKey="weight" fill="#64748B" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="risk" radius={[3, 3, 0, 0]} isAnimationActive={false}>{data.map((d, i) => <Cell key={d.ticker} fill={seriesColor(i)} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">Grey = capital weight · colour = risk share</p>
    </Card>
  );
}
