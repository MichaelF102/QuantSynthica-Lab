"use client";

import React, { useMemo } from "react";
import { Gauge, BarChart3, Info } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { AnalyticsFilters, btPoints, benchmarkLabel, exposureSeries, regimeProfile, windowedBt } from "@/lib/analyticsCalc";
import RegimeExtras from "@/components/backtest/tabs/RegimeExtras";
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
  const pts = useMemo(() => (bt ? btPoints(bt, { ...filters, frequency: "Daily" }) : []), [bt, filters]);
  const exposure = useMemo(() => (bt ? exposureSeries(bt) : null), [bt]);
  const positions = useMemo(() => new Map((exposure?.series ?? []).map((p) => [p.date, p.positions])), [exposure]);
  const regimes = useMemo(() => regimeProfile(pts, positions), [pts, positions]);
  if (!bt || !regimes) return <EmptyState icon={Gauge} title="Not enough history to classify regimes" hint="At least ~80 trading days are needed in the selected window." />;
  const inMarket = pts.length ? (pts.filter((p) => (positions.get(p.date) ?? 0) > 0).length / pts.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {picker}
      {inMarket < 30 && (
        <div role="note" data-testid="regime-idle-note" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>This strategy held a position on only {fmtPct(inMarket, 0, false)} of the days in this window. Days with no position count as 0% return, so the figures below mostly describe idle time. Read the Invested column before the returns.</span>
        </div>
      )}
      <Card
        title="Performance by market regime"
        subtitle={`Regimes derived from ${benchmarkLabel(bt.benchmark)} · every day in the window`}
        info="Daily strategy returns are bucketed by whether the benchmark was above or below its 50-day average, and by high or low benchmark volatility, using only what was known at the previous close. Invested is the share of that regime's days with a position open. Win rate counts days with a non-zero return, so flat days are not losses. Annualised on 252 days."
        icon={Gauge}
        tone="blue"
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-xs" aria-label="Performance by regime">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-1.5">Regime</th>
                <th className="py-1.5 text-right">Days</th>
                <th className="py-1.5 text-right">Invested</th>
                <th className="py-1.5 text-right">Ann. return</th>
                <th className="py-1.5 text-right">Ann. vol</th>
                <th className="py-1.5 text-right">Sharpe</th>
                <th className="py-1.5 text-right">Win rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {regimes.map((r) => {
                const idle = r.exposure !== null && r.exposure < 10;
                return (
                  <tr key={r.regime} className={cn("transition-colors hover:bg-slate-800/30", idle && "opacity-70")}>
                    <td className="py-2 font-medium text-slate-200">{r.regime}</td>
                    <td className="py-2 text-right font-mono text-slate-400">{fmtInt(r.days)}</td>
                    <td className={cn("py-2 text-right font-mono", idle ? "text-amber-300" : "text-slate-300")}>{r.exposure === null ? "—" : fmtPct(r.exposure, 0, false)}</td>
                    <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.annReturn))}>{r.days ? fmtPct(r.annReturn, 1) : "—"}</td>
                    <td className="py-2 text-right font-mono text-slate-300">{r.days && r.annVol > 0 ? fmtPct(r.annVol, 1, false) : "—"}</td>
                    <td className={cn("py-2 text-right font-mono", signTone(r.sharpe))}>{r.sharpe === null ? "—" : formatRatio(r.sharpe)}</td>
                    <td className="py-2 text-right font-mono text-slate-300">{r.winRate === null ? "—" : fmtPct(r.winRate, 1, false)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Annualised return by regime" subtitle="Where the strategy earns and where it bleeds" info="Same buckets as above. Grey bars are regimes where the strategy was invested on fewer than 10% of days." icon={BarChart3} tone="emerald">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regimes.map((r) => ({ ...r, annReturn: Number(r.annReturn.toFixed(2)) }))} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="regime" {...AXIS_PROPS} tickFormatter={(v: string) => v.split(" (")[0]} />
              <YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={0} stroke="#475569" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${fmtPct(Number(v))}${p.payload.exposure === null ? "" : ` · invested ${fmtPct(p.payload.exposure, 0, false)}`}`, "Ann. return"]} />
              <Bar dataKey="annReturn" radius={[3, 3, 0, 0]} isAnimationActive={false} fill={UP_COLOR}>
                {regimes.map((r) => <Cell key={r.regime} fill={r.exposure !== null && r.exposure < 10 ? "#475569" : r.annReturn >= 0 ? UP_COLOR : DOWN_COLOR} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <RegimeExtras bt={windowedBt(bt, filters)} />
    </div>
  );
}
