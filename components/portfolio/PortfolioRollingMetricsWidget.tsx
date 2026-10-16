"use client";

import React, { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, EmptyState } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { PortfolioResult } from "@/lib/portfolio/engine";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";

type Metric = "Volatility" | "Sharpe" | "Beta";
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

export default function PortfolioRollingMetricsWidget({ result, benchmarkSymbol }: { result: PortfolioResult; benchmarkSymbol: string }) {
  const [metric, setMetric] = useState<Metric>("Volatility");
  const [win, setWin] = useState(60);
  const data = useMemo(() => {
    const r = result.returns, b = result.benchReturns;
    return r.map((_, i) => {
      if (i < win - 1) return null;
      const x = r.slice(i - win + 1, i + 1), y = b.slice(i - win + 1, i + 1);
      const mx = mean(x), my = mean(y);
      const sx = Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0) / (win - 1));
      const sy2 = y.reduce((s, v) => s + (v - my) ** 2, 0) / (win - 1);
      const cov = x.reduce((s, v, k) => s + (v - mx) * (y[k] - my), 0) / (win - 1);
      const value = metric === "Volatility" ? sx * Math.sqrt(252) * 100 : metric === "Sharpe" ? (sx > 0 ? (mx / sx) * Math.sqrt(252) : 0) : sy2 > 0 ? cov / sy2 : 0;
      return { date: result.dates[i + 1], value: Number(value.toFixed(3)) };
    }).filter(Boolean) as { date: string; value: number }[];
  }, [result, metric, win]);

  return (
    <Card
      title="Rolling metrics"
      subtitle={`${win}-day window${metric === "Beta" ? ` vs ${benchmarkSymbol}` : ""}`}
      info="Volatility and Sharpe are annualised on 252 days (Rf = 0); beta is the rolling regression slope against the benchmark."
      icon={Activity}
      tone="purple"
      action={
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-800 bg-[#0b1222] p-0.5 text-[11px]">
            {(["Volatility", "Sharpe", "Beta"] as Metric[]).map((m) => <button key={m} type="button" onClick={() => setMetric(m)} className={cn("rounded px-2 py-1", metric === m ? "bg-blue-600 font-semibold text-white" : "font-medium text-slate-400 hover:text-white")}>{m}</button>)}
          </div>
          <div className="flex items-center rounded-lg border border-slate-800 bg-[#0b1222] p-0.5 font-mono text-[11px]">
            {[30, 60, 90].map((w) => <button key={w} type="button" onClick={() => setWin(w)} className={cn("rounded px-2 py-1", win === w ? "bg-blue-600 font-semibold text-white" : "font-medium text-slate-400 hover:text-white")}>{w}d</button>)}
          </div>
        </div>
      }
    >
      {data.length < 2 ? (
        <EmptyState icon={Activity} title="Window too short" hint={`Need more than ${win} trading days.`} />
      ) : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} />
              <YAxis {...AXIS_PROPS} tickFormatter={(v) => (metric === "Volatility" ? `${v}%` : String(v))} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [metric === "Volatility" ? `${Number(v).toFixed(2)}%` : Number(v).toFixed(2), metric]} />
              <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
