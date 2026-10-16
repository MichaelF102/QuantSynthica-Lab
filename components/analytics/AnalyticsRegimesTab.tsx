"use client";

import React from "react";
import { Gauge, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { AnalyticsFilters, btPoints, benchmarkLabel, regimeStats } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";
import { usePrimaryBacktest } from "./StrategyPicker";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

/**
 * Regimes are classified from the strategy's own benchmark path: trend (benchmark above/below its
 * 50-day average) and volatility (21-day benchmark vol above/below its median). The strategy's
 * daily returns are then bucketed by regime.
 */
export default function AnalyticsRegimesTab({ selectedBacktests, filters }: Props) {
  const { bt, picker } = usePrimaryBacktest(selectedBacktests);
  const pts = bt ? btPoints(bt, { ...filters, frequency: "Daily" }) : [];
  const regimes = regimeStats(pts);
  if (!bt || !regimes) return <EmptyState icon={Gauge} title="Not enough history to classify regimes" hint="At least ~80 trading days are needed in the selected window." />;

  return (
    <div className="space-y-4">
      {picker}
      <Card
        title="Performance by market regime"
        subtitle={`Regimes derived from ${benchmarkLabel(bt.benchmark)}`}
        info="Daily strategy returns are bucketed by whether the benchmark was above/below its 50-day average, and by high/low benchmark volatility. Annualised on 252 days."
        icon={Gauge}
        tone="blue"
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-1.5">Regime</th>
                <th className="py-1.5 text-right">Days</th>
                <th className="py-1.5 text-right">Ann. return</th>
                <th className="py-1.5 text-right">Ann. vol</th>
                <th className="py-1.5 text-right">Sharpe</th>
                <th className="py-1.5 text-right">Win rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {regimes.map((r) => (
                <tr key={r.regime} className="transition-colors hover:bg-slate-800/30">
                  <td className="py-2 font-medium text-slate-200">{r.regime}</td>
                  <td className="py-2 text-right font-mono text-slate-400">{fmtInt(r.days)}</td>
                  <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.annReturn))}>{r.days ? fmtPct(r.annReturn, 1) : "—"}</td>
                  <td className="py-2 text-right font-mono text-slate-300">{r.days ? fmtPct(r.annVol, 1, false) : "—"}</td>
                  <td className={cn("py-2 text-right font-mono", signTone(r.sharpe))}>{r.sharpe === null ? "—" : formatRatio(r.sharpe)}</td>
                  <td className="py-2 text-right font-mono text-slate-300">{r.winRate === null ? "—" : fmtPct(r.winRate, 1, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Annualised return by regime" subtitle="Where the strategy earns and where it bleeds" info="Same buckets as above, shown as annualised return." icon={BarChart3} tone="emerald">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regimes.map((r) => ({ ...r, annReturn: Number(r.annReturn.toFixed(2)) }))} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="regime" {...AXIS_PROPS} tickFormatter={(v: string) => v.split(" (")[0]} />
              <YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="#475569" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), "Ann. return"]} />
              <Bar dataKey="annReturn" radius={[3, 3, 0, 0]} isAnimationActive={false} fill={UP_COLOR}>
                {regimes.map((r) => <Cell key={r.regime} fill={r.annReturn >= 0 ? UP_COLOR : DOWN_COLOR} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

