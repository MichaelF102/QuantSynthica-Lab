"use client";

import React from "react";
import { Info, ShieldAlert, AlertTriangle, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BacktestResult } from "@/types";

interface AnalyticsRiskTabProps {
  selectedBacktests: BacktestResult[];
}

export default function AnalyticsRiskTab({
  selectedBacktests,
}: AnalyticsRiskTabProps) {
  const stressScenarios = [
    { name: "2008 Global Financial Crisis", duration: "Sep 2008 - Mar 2009", marketReturn: "-46.2%", strategyReturn: "-16.4%", alpha: "+29.8%" },
    { name: "2011 US Sovereign Debt Downgrade", duration: "Jul 2011 - Oct 2011", marketReturn: "-18.6%", strategyReturn: "-5.2%", alpha: "+13.4%" },
    { name: "2015 China Yuan Devaluation", duration: "Aug 2015 - Sep 2015", marketReturn: "-11.8%", strategyReturn: "-3.1%", alpha: "+8.7%" },
    { name: "2020 COVID Flash Crash", duration: "Feb 2020 - Mar 2020", marketReturn: "-33.9%", strategyReturn: "-12.8%", alpha: "+21.1%" },
    { name: "2022 Fed Inflation Shock", duration: "Jan 2022 - Oct 2022", marketReturn: "-24.8%", strategyReturn: "-6.9%", alpha: "+17.9%" },
  ];

  const drawdownBins = [
    { range: "0% - 2%", days: 165 },
    { range: "2% - 4%", days: 82 },
    { range: "4% - 6%", days: 48 },
    { range: "6% - 8%", days: 28 },
    { range: "8% - 10%", days: 14 },
    { range: "10% - 15%", days: 8 },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Risk KPI Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Value at Risk (95% Daily)</span>
          <div className="text-xl font-bold text-[#EF4444] font-mono">1.42%</div>
          <p className="text-[10px] text-slate-400">95% confidence max expected single-day loss.</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Conditional VaR (95% ES)</span>
          <div className="text-xl font-bold text-[#EF4444] font-mono">1.96%</div>
          <p className="text-[10px] text-slate-400">Average expected loss in worst 5% tail events.</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Downside Deviation</span>
          <div className="text-xl font-bold text-amber-400 font-mono">9.84%</div>
          <p className="text-[10px] text-slate-400">Annualized downside volatility under zero return.</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Ulcer Performance Index</span>
          <div className="text-xl font-bold text-[#38BDF8] font-mono">3.42</div>
          <p className="text-[10px] text-slate-400">Measures depth and duration of underwater stress.</p>
        </div>
      </div>

      {/* Historical Stress Test Simulation Table */}
      <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
        <div className="pb-2 border-b border-[#1E2530]">
          <span className="font-semibold text-white text-xs tracking-tight">
            Historical Stress-Testing Simulations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2530] text-[10px] text-slate-400 uppercase font-sans">
                <th className="py-2">Macro Crisis Event</th>
                <th className="py-2">Historical Window</th>
                <th className="py-2">Market Drawdown</th>
                <th className="py-2">Simulated Strategy</th>
                <th className="py-2">Capital Preservation Alpha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2530]/50">
              {stressScenarios.map((sc) => (
                <tr key={sc.name} className="hover:bg-[#111622]/50">
                  <td className="py-2.5 font-bold text-white">{sc.name}</td>
                  <td className="py-2.5 text-slate-400">{sc.duration}</td>
                  <td className="py-2.5 text-[#EF4444] font-semibold">{sc.marketReturn}</td>
                  <td className="py-2.5 text-[#EF4444] font-semibold">{sc.strategyReturn}</td>
                  <td className="py-2.5 text-[#10B981] font-semibold">{sc.alpha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawdown Duration Distribution Histogram */}
      <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
        <div className="pb-2 border-b border-[#1E2530]">
          <span className="font-semibold text-white text-xs tracking-tight">
            Drawdown Severity Distribution (Days Spent in Drawdown Tier)
          </span>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={drawdownBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#18202C" strokeDasharray="2 2" vertical={false} />
              <XAxis dataKey="range" stroke="#485362" fontSize={10} />
              <YAxis stroke="#485362" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0C1017",
                  borderColor: "#202C3F",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <Bar dataKey="days" fill="#0284C7" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
