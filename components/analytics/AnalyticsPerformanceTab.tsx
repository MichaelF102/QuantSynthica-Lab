"use client";

import React from "react";
import { Info, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { BacktestResult } from "@/types";

interface AnalyticsPerformanceTabProps {
  selectedBacktests: BacktestResult[];
}

export default function AnalyticsPerformanceTab({
  selectedBacktests,
}: AnalyticsPerformanceTabProps) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyMatrix = [
    { year: 2024, Jan: 2.4, Feb: 1.8, Mar: -0.9, Apr: 3.1, May: 1.5, Jun: 2.2, Jul: 0.8, Aug: -1.2, Sep: 2.6, Oct: 1.4, Nov: 3.5, Dec: 1.9, YTD: 20.8 },
    { year: 2023, Jan: 3.1, Feb: -1.4, Mar: 2.8, Apr: 1.2, May: 4.5, Jun: 3.6, Jul: -0.8, Aug: 0.5, Sep: -2.1, Oct: -1.0, Nov: 4.2, Dec: 3.8, YTD: 19.4 },
    { year: 2022, Jan: -2.1, Feb: -1.8, Mar: 3.4, Apr: -3.2, May: 1.1, Jun: -2.5, Jul: 4.6, Aug: -1.9, Sep: -3.8, Oct: 3.2, Nov: 2.8, Dec: -1.5, YTD: -2.1 },
    { year: 2021, Jan: 1.8, Feb: 2.4, Mar: 1.5, Apr: 3.8, May: 0.6, Jun: 1.9, Jul: 2.1, Aug: 1.4, Sep: -1.8, Oct: 4.2, Nov: -0.5, Dec: 2.7, YTD: 21.6 },
  ];

  const annualComparison = [
    { year: 2024, strategy: "+20.8%", benchmark: "+14.2%", excess: "+6.6%", sharpe: 1.74, maxDd: "-6.2%" },
    { year: 2023, strategy: "+19.4%", benchmark: "+24.2%", excess: "-4.8%", sharpe: 1.32, maxDd: "-14.9%" },
    { year: 2022, strategy: "-2.1%", benchmark: "-18.1%", excess: "+16.0%", sharpe: 0.42, maxDd: "-11.4%" },
    { year: 2021, strategy: "+21.6%", benchmark: "+28.7%", excess: "-7.1%", sharpe: 1.58, maxDd: "-5.8%" },
  ];

  const getHeatColor = (val: number) => {
    if (val > 3.0) return "bg-[#10B981]/50 text-white font-semibold";
    if (val > 1.0) return "bg-[#10B981]/30 text-emerald-200";
    if (val > 0) return "bg-[#10B981]/15 text-slate-200";
    if (val > -1.5) return "bg-[#EF4444]/20 text-rose-200";
    return "bg-[#EF4444]/45 text-white font-semibold";
  };

  return (
    <div className="space-y-4">
      {/* Monthly Returns Heatmap Matrix */}
      <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2530]">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-white text-xs tracking-tight">
                Monthly Returns Heatmap Matrix (%)
              </span>
              <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
            </div>
            <p className="text-[11px] text-[#89919C]">
              Calendar month return distribution across historical backtest years
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2530] text-[10px] text-slate-400 uppercase font-sans">
                <th className="py-2 text-left pl-2">Year</th>
                {months.map((m) => (
                  <th key={m} className="py-2">{m}</th>
                ))}
                <th className="py-2 text-right pr-2">YTD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2530]/40">
              {monthlyMatrix.map((row) => (
                <tr key={row.year} className="hover:bg-[#111622]">
                  <td className="py-2.5 text-left font-bold text-white pl-2">{row.year}</td>
                  {months.map((m) => {
                    const val = (row as any)[m];
                    return (
                      <td key={m} className={`py-2 px-1 rounded-sm ${getHeatColor(val)}`}>
                        {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                      </td>
                    );
                  })}
                  <td className={`py-2.5 text-right font-bold pr-2 ${row.YTD >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                    {row.YTD > 0 ? `+${row.YTD.toFixed(1)}%` : `${row.YTD.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual Breakdown Table */}
      <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
        <div className="pb-2 border-b border-[#1E2530]">
          <span className="font-semibold text-white text-xs tracking-tight">
            Annual Performance Breakdown vs Benchmark
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2530] text-[10px] text-slate-400 uppercase font-sans">
                <th className="py-2">Year</th>
                <th className="py-2">Strategy Return</th>
                <th className="py-2">Benchmark Return</th>
                <th className="py-2">Excess Alpha</th>
                <th className="py-2">Sharpe Ratio</th>
                <th className="py-2">Max Drawdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2530]/50">
              {annualComparison.map((r) => (
                <tr key={r.year} className="hover:bg-[#111622]/50">
                  <td className="py-2.5 font-bold text-white">{r.year}</td>
                  <td className="py-2.5 text-[#10B981] font-semibold">{r.strategy}</td>
                  <td className="py-2.5 text-slate-300">{r.benchmark}</td>
                  <td className={`py-2.5 font-semibold ${r.excess.startsWith("+") ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                    {r.excess}
                  </td>
                  <td className="py-2.5 text-white">{r.sharpe.toFixed(2)}</td>
                  <td className="py-2.5 text-[#EF4444]">{r.maxDd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
