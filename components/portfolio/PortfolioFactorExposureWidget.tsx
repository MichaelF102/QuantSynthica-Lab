"use client";

import React from "react";
import { Sliders } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { Card } from "@/components/ui/Card";
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";

/** Market-factor exposure only: style factors (size, value, momentum) need factor-return data we do not have. */
export default function PortfolioFactorExposureWidget({ result, benchmarkSymbol }: { result: PortfolioResult; benchmarkSymbol: string }) {
  const m = riskModel(result);
  const data = [...m.assets.map((a) => ({ name: a.ticker, beta: a.beta })), { name: "Portfolio", beta: m.portBeta }].filter((d) => d.beta !== null).map((d) => ({ ...d, beta: Number((d.beta as number).toFixed(2)) }));
  return (
    <Card title="Market exposure" subtitle={`Beta to ${benchmarkSymbol}${m.portBeta === null ? "" : ` · portfolio β ${m.portBeta.toFixed(2)}`}`} info="Regression slope of each holding's daily returns on the benchmark. Style factors (size, value, momentum) are not estimated because no factor return series is available." icon={Sliders} tone="amber">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="name" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <ReferenceLine y={1} stroke="#475569" strokeDasharray="3 3" />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [Number(v).toFixed(2), "Beta"]} />
            <Bar dataKey="beta" radius={[3, 3, 0, 0]} isAnimationActive={false}>{data.map((d) => <Cell key={d.name} fill={d.name === "Portfolio" ? "#2563EB" : d.beta >= 0 ? UP_COLOR : DOWN_COLOR} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
