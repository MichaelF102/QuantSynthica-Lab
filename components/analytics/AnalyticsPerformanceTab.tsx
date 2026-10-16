"use client";

import React from "react";
import { CalendarDays, BarChart3 } from "lucide-react";
import { BacktestResult } from "@/types";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { AnalyticsFilters, MONTH_NAMES, annualTable, btPoints, monthlyMatrix, benchmarkLabel } from "@/lib/analyticsCalc";
import { usePrimaryBacktest } from "./StrategyPicker";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

const heat = (v: number | undefined) => {
  if (typeof v !== "number") return "text-slate-600";
  if (v > 3) return "bg-emerald-500/50 font-semibold text-white";
  if (v > 1) return "bg-emerald-500/30 text-emerald-200";
  if (v > 0) return "bg-emerald-500/15 text-slate-200";
  if (v > -1.5) return "bg-rose-500/20 text-rose-200";
  return "bg-rose-500/45 font-semibold text-white";
};

export default function AnalyticsPerformanceTab({ selectedBacktests, filters }: Props) {
  const { bt, picker } = usePrimaryBacktest(selectedBacktests);
  const pts = bt ? btPoints(bt, { ...filters, frequency: "Daily" }) : [];
  if (!bt || pts.length < 3) return <EmptyState icon={BarChart3} title="No performance data in this window" hint="Widen the date window or select a backtest." />;

  const matrix = monthlyMatrix(pts);
  const annual = annualTable(pts);

  return (
    <div className="space-y-4">
      {picker}
      <Card
        title="Monthly returns"
        subtitle="Calendar-month return, compounded from the equity curve"
        info="Each cell is the % change in portfolio value over that calendar month. YTD compounds the months shown."
        icon={CalendarDays}
        tone="blue"
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full text-center font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 font-sans text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-1.5 pl-2 text-left">Year</th>
                {MONTH_NAMES.map((m) => <th key={m} className="py-1.5">{m}</th>)}
                <th className="py-1.5 pr-2 text-right">YTD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {matrix.map((row) => (
                <tr key={row.year} className="transition-colors hover:bg-slate-800/30">
                  <td className="py-2 pl-2 text-left font-bold text-white">{row.year}</td>
                  {MONTH_NAMES.map((m) => {
                    const v = row[m] as number | undefined;
                    return <td key={m} className={cn("rounded-sm px-1 py-2", heat(v))}>{typeof v === "number" ? fmtPct(v, 1) : "—"}</td>;
                  })}
                  <td className={cn("py-2 pr-2 text-right font-bold", signTone(row.YTD))}>{fmtPct(row.YTD, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Annual performance vs benchmark"
        subtitle={`Benchmark: ${benchmarkLabel(bt.benchmark)}`}
        info="Calendar-year return measured from the prior year-end close. Partial first/last years cover only the days in the backtest."
        icon={BarChart3}
        tone="emerald"
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-1.5">Year</th>
                <th className="py-1.5 text-right">Strategy</th>
                <th className="py-1.5 text-right">Benchmark</th>
                <th className="py-1.5 text-right">Excess</th>
                <th className="py-1.5 text-right">Sharpe</th>
                <th className="py-1.5 text-right">Max DD</th>
                <th className="py-1.5 text-right">Trading days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {annual.map((r) => (
                <tr key={r.year} className="transition-colors hover:bg-slate-800/30">
                  <td className="py-2 font-mono font-bold text-white">{r.year}</td>
                  <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.strat))}>{fmtPct(r.strat)}</td>
                  <td className={cn("py-2 text-right font-mono", signTone(r.bench))}>{fmtPct(r.bench)}</td>
                  <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.excess))}>{fmtPct(r.excess)}</td>
                  <td className="py-2 text-right font-mono text-white">{r.sharpe === null || r.days < 20 ? "—" : formatRatio(r.sharpe)}</td>
                  <td className="py-2 text-right font-mono text-rose-400">{r.maxDD === null ? "—" : fmtPct(-r.maxDD, 1)}</td>
                  <td className="py-2 text-right font-mono text-slate-400">{fmtInt(r.days)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
