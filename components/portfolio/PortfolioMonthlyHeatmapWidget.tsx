"use client";

import React, { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { fmtPct, cn } from "@/lib/utils";
import { PortfolioResult } from "@/lib/portfolio/engine";
import { MONTH_NAMES, monthlyMatrix } from "@/lib/analyticsCalc";
import { signTone } from "@/components/ui/Card";

const heat = (v?: number) => {
  if (typeof v !== "number") return "text-slate-600";
  if (v > 5) return "bg-emerald-500/50 font-semibold text-white";
  if (v > 2) return "bg-emerald-500/30 text-emerald-200";
  if (v > 0) return "bg-emerald-500/15 text-slate-200";
  if (v > -2) return "bg-rose-500/20 text-rose-200";
  return "bg-rose-500/45 font-semibold text-white";
};

export default function PortfolioMonthlyHeatmapWidget({ result }: { result: PortfolioResult }) {
  const matrix = useMemo(() => monthlyMatrix(result.pts), [result]);
  return (
    <Card title="Monthly returns" subtitle="Calendar-month return of the portfolio" info="Compounded change in portfolio value per calendar month; YTD compounds the months shown." icon={CalendarDays} tone="emerald">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-center font-mono text-[11px]">
          <thead>
            <tr className="border-b border-slate-800 font-sans text-[10px] uppercase tracking-wider text-slate-400">
              <th className="py-1.5 pl-1 text-left">Year</th>
              {MONTH_NAMES.map((m) => <th key={m} className="py-1.5">{m}</th>)}
              <th className="py-1.5 pr-1 text-right">YTD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {matrix.map((row) => (
              <tr key={row.year} className="transition-colors hover:bg-slate-800/30">
                <td className="py-1.5 pl-1 text-left font-bold text-white">{row.year}</td>
                {MONTH_NAMES.map((m) => { const v = row[m] as number | undefined; return <td key={m} className={cn("px-0.5 py-1.5", heat(v))}>{typeof v === "number" ? v.toFixed(1) : "—"}</td>; })}
                <td className={cn("py-1.5 pr-1 text-right font-bold", signTone(row.YTD))}>{fmtPct(row.YTD, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
