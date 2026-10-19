"use client";

import React from "react";
import { ShieldAlert, TrendingDown, BarChart3, AlertTriangle, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { AnalyticsFilters, btPoints, riskStats, windowedBt, worstWindows } from "@/lib/analyticsCalc";
import RiskExtras from "@/components/backtest/tabs/RiskExtras";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { usePrimaryBacktest } from "./StrategyPicker";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

export default function AnalyticsRiskTab({ selectedBacktests, filters }: Props) {
  const { bt, picker } = usePrimaryBacktest(selectedBacktests);
  const pts = bt ? btPoints(bt, { ...filters, frequency: "Daily" }) : [];
  const risk = riskStats(pts);
  if (!bt || !risk) return <EmptyState icon={ShieldAlert} title="Not enough history for risk analytics" hint="At least ~20 daily observations are needed in the selected window." />;
  const windows = worstWindows(pts, 21, 5);

  return (
    <div className="space-y-4">
      {picker}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Value at Risk (95%, daily)" value={fmtPct(-risk.var95)} tone="text-rose-400" sub="Historical 1-day loss threshold" />
        <Kpi label="Expected shortfall (95%)" value={fmtPct(-risk.cvar95)} tone="text-rose-400" sub="Mean loss beyond VaR" />
        <Kpi label="Downside deviation" value={fmtPct(risk.downsideDev, 2, false)} tone="text-amber-400" sub="Annualised, below 0%" />
        <Kpi label="Ulcer index" value={risk.ulcer.toFixed(2)} tone="text-blue-400" sub="Depth × duration of drawdowns" />
      </div>

      <Card
        title="Worst 21-day windows"
        subtitle="Strategy vs benchmark over the same dates"
        info="Rolling 21-trading-day returns, ranked worst-first and non-overlapping. This replaces fixed crisis scenarios, which a backtest may not cover."
        icon={AlertTriangle}
        tone="rose"
      >
        {windows.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">Window shorter than 21 trading days.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-1.5">Window</th>
                  <th className="py-1.5 text-right">Benchmark</th>
                  <th className="py-1.5 text-right">Strategy</th>
                  <th className="py-1.5 text-right">Relative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {windows.map((w) => (
                  <tr key={w.start} className="transition-colors hover:bg-slate-800/30">
                    <td className="py-2 font-mono text-slate-300">{w.start} → {w.end}</td>
                    <td className={cn("py-2 text-right font-mono", signTone(w.bench))}>{fmtPct(w.bench)}</td>
                    <td className={cn("py-2 text-right font-mono font-semibold", signTone(w.strat))}>{fmtPct(w.strat)}</td>
                    <td className={cn("py-2 text-right font-mono font-semibold", signTone(w.strat - w.bench))}>{fmtPct(w.strat - w.bench)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Drawdown severity"
        subtitle="Trading days spent in each drawdown tier"
        info="Counts days where the portfolio sat below its running peak by the given depth."
        icon={TrendingDown}
        tone="amber"
      >
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={risk.binCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="range" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtInt(Number(v)), "Days"]} />
              <Bar dataKey="days" fill="#D97706" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Activity className="h-3 w-3" /> Skew of daily returns: <span className="font-mono text-slate-200">{risk.skew.toFixed(2)}</span> · average drawdown <span className="font-mono text-slate-200">{fmtPct(-risk.pain, 2)}</span>
        </p>
      </Card>
      <RiskExtras bt={windowedBt(bt, filters)} />
    </div>
  );
}
