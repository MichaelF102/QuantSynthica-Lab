"use client";

import React from "react";
import { GitMerge, CalendarRange, Trophy } from "lucide-react";
import { BacktestResult } from "@/types";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { AnalyticsFilters, btPoints, btTrades, currencyOf, fmtMoney, seriesStats, benchmarkLabel } from "@/lib/analyticsCalc";
import { usePrimaryBacktest } from "./StrategyPicker";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

/**
 * Attribution is computed from the run itself:
 *  - Return vs benchmark: total = beta x benchmark return (market exposure) + residual (selection/timing).
 *  - Realised P&L by exit year and the largest single contributors, from the recorded trades.
 * Sector-level (Brinson) attribution needs holdings with sector tags, which a single-asset
 * backtest does not have, so it is deliberately not shown.
 */
export default function AnalyticsAttributionTab({ selectedBacktests, filters }: Props) {
  const { bt, picker } = usePrimaryBacktest(selectedBacktests);
  const pts = bt ? btPoints(bt, { ...filters, frequency: "Daily" }) : [];
  const stats = seriesStats(pts);
  const trades = bt ? btTrades(bt, filters) : [];
  if (!bt || !stats) return <EmptyState icon={GitMerge} title="No data to attribute in this window" hint="Widen the date window or select a backtest." />;

  const cur = currencyOf(bt);
  const market = stats.beta === null ? null : stats.beta * stats.benchReturn;
  const active = market === null ? null : stats.totalReturn - market;

  const byYear = new Map<string, { pnl: number; n: number }>();
  trades.forEach((t) => { const y = t.exit_date.slice(0, 4); const e = byYear.get(y) ?? { pnl: 0, n: 0 }; e.pnl += t.net_pnl; e.n++; byYear.set(y, e); });
  const totalPnl = trades.reduce((s, t) => s + t.net_pnl, 0);
  const top = [...trades].sort((a, b) => Math.abs(b.net_pnl) - Math.abs(a.net_pnl)).slice(0, 5);

  const rows: [string, number | null, string][] = [
    ["Benchmark return", stats.benchReturn, benchmarkLabel(bt.benchmark)],
    ["Market exposure (β × benchmark)", market, stats.beta === null ? "Beta unavailable" : `β = ${stats.beta.toFixed(2)}`],
    ["Active return (selection & timing)", active, "Total minus market exposure"],
    ["Total strategy return", stats.totalReturn, "Equity-curve change over the window"],
  ];

  return (
    <div className="space-y-4">
      {picker}
      <Card title="Return decomposition vs benchmark" subtitle="How much came from the market and how much from the strategy" info="Total return split into beta-scaled benchmark return and the residual. This is a single-factor attribution computed from the run's own equity and benchmark curves." icon={GitMerge} tone="blue">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <tbody className="divide-y divide-slate-800/50">
              {rows.map(([label, v, note], i) => (
                <tr key={label} className={cn("transition-colors hover:bg-slate-800/30", i === rows.length - 1 && "bg-slate-800/20")}>
                  <td className="py-2.5 font-medium text-white">{label}</td>
                  <td className={cn("py-2.5 text-right font-mono font-bold", signTone(v))}>{fmtPct(v)}</td>
                  <td className="py-2.5 pl-4 text-[11px] text-slate-400">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {trades.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No closed trades in this window" hint="Trade-level attribution needs at least one closed trade." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Realised P&L by exit year" subtitle={`Net of costs · total ${fmtMoney(totalPnl, cur)}`} info="Sum of net P&L for trades closed in each calendar year." icon={CalendarRange} tone="emerald">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-1.5">Year</th><th className="py-1.5 text-right">Trades</th><th className="py-1.5 text-right">Net P&amp;L</th><th className="py-1.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[...byYear.entries()].sort().reverse().map(([y, e]) => (
                  <tr key={y} className="transition-colors hover:bg-slate-800/30">
                    <td className="py-2 font-mono font-bold text-white">{y}</td>
                    <td className="py-2 text-right font-mono text-slate-300">{fmtInt(e.n)}</td>
                    <td className={cn("py-2 text-right font-mono font-semibold", signTone(e.pnl))}>{fmtMoney(e.pnl, cur)}</td>
                    <td className="py-2 text-right font-mono text-slate-400">{totalPnl !== 0 ? fmtPct((e.pnl / totalPnl) * 100, 1, false) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Largest contributors" subtitle="Five biggest trades by absolute P&L" info="Closed trades ranked by absolute net P&L, to show how concentrated the result is." icon={Trophy} tone="amber">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-1.5">Entry → exit</th><th className="py-1.5">Side</th><th className="py-1.5">Reason</th><th className="py-1.5 text-right">Return</th><th className="py-1.5 text-right">Net P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {top.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-800/30">
                    <td className="py-2 font-mono text-slate-300">{t.entry_date} → {t.exit_date}</td>
                    <td className="py-2 font-mono text-[10px] text-slate-400">{t.direction}</td>
                    <td className="py-2 font-mono text-[10px] text-slate-400">{t.exit_reason}</td>
                    <td className={cn("py-2 text-right font-mono", signTone(t.return_pct))}>{fmtPct(t.return_pct)}</td>
                    <td className={cn("py-2 text-right font-mono font-semibold", signTone(t.net_pnl))}>{fmtMoney(t.net_pnl, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
