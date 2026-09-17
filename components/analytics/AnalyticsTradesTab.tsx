"use client";

import React from "react";
import { Info, ArrowLeftRight, CheckCircle2, XCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { BacktestResult } from "@/types";

interface AnalyticsTradesTabProps {
  selectedBacktests: BacktestResult[];
}

export default function AnalyticsTradesTab({
  selectedBacktests,
}: AnalyticsTradesTabProps) {
  const tradePnlBins = [
    { bin: "<-6%", count: 4 },
    { bin: "-6% to -4%", count: 9 },
    { bin: "-4% to -2%", count: 18 },
    { bin: "-2% to 0%", count: 32 },
    { bin: "0% to 2%", count: 48 },
    { bin: "2% to 4%", count: 36 },
    { bin: "4% to 6%", count: 21 },
    { bin: ">6%", count: 11 },
  ];

  const exitReasons = [
    { reason: "Take Profit Target", count: 72, pct: "40.2%", pnl: "+$18,420" },
    { reason: "Opposite Signal Cross", count: 54, pct: "30.1%", pnl: "+$6,890" },
    { reason: "Trailing Stop Activated", count: 33, pct: "18.4%", pnl: "+$4,120" },
    { reason: "Stop Loss Hit", count: 20, pct: "11.3%", pnl: "-$7,410" },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Total Trades Executed</span>
          <div className="text-xl font-bold text-white font-mono">179</div>
          <p className="text-[10px] text-slate-400">Average holding period: 8.4 days.</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Win / Loss Ratio</span>
          <div className="text-xl font-bold text-[#10B981] font-mono">1.31</div>
          <p className="text-[10px] text-slate-400">101 winning vs 78 losing trades.</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Avg Win / Avg Loss</span>
          <div className="text-xl font-bold text-[#38BDF8] font-mono">1.74x</div>
          <p className="text-[10px] text-slate-400">+$342 avg win vs -$196 avg loss.</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Max Win / Loss Streak</span>
          <div className="text-xl font-bold text-white font-mono">7 / 4</div>
          <p className="text-[10px] text-slate-400">7 consecutive wins, max 4 consecutive losses.</p>
        </div>
      </div>

      {/* Trade PnL Distribution */}
      <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
        <div className="pb-2 border-b border-[#1E2530]">
          <span className="font-semibold text-white text-xs tracking-tight">
            Trade PnL Distribution (Return % per Closed Trade)
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tradePnlBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#18202C" strokeDasharray="2 2" vertical={false} />
              <XAxis dataKey="bin" stroke="#485362" fontSize={10} />
              <YAxis stroke="#485362" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0C1017",
                  borderColor: "#202C3F",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <Bar dataKey="count" fill="#0284C7" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exit Reason Breakdown Table */}
      <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
        <div className="pb-2 border-b border-[#1E2530]">
          <span className="font-semibold text-white text-xs tracking-tight">
            Trade Exit Reason Breakdown
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2530] text-[10px] text-slate-400 uppercase font-sans">
                <th className="py-2">Exit Trigger Mechanism</th>
                <th className="py-2 text-right">Trades Count</th>
                <th className="py-2 text-right">% of Total</th>
                <th className="py-2 text-right">Net Realized PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2530]/50">
              {exitReasons.map((r) => (
                <tr key={r.reason} className="hover:bg-[#111622]/50">
                  <td className="py-2.5 font-bold text-white font-sans">{r.reason}</td>
                  <td className="py-2.5 text-right text-slate-200">{r.count}</td>
                  <td className="py-2.5 text-right text-slate-400">{r.pct}</td>
                  <td className={`py-2.5 text-right font-semibold ${r.pnl.startsWith("+") ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                    {r.pnl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
