"use client";

import React from "react";
import { Info, Sliders, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { BacktestResult } from "@/types";

interface AnalyticsFactorsTabProps {
  selectedBacktests: BacktestResult[];
}

export default function AnalyticsFactorsTab({
  selectedBacktests,
}: AnalyticsFactorsTabProps) {
  const famaFrenchFactors = [
    { factor: "Market (Mkt-RF)", beta: 0.78, tStat: 6.42, pValue: "<0.001", significance: "Significant" },
    { factor: "Size (SMB)", beta: 0.32, tStat: 2.84, pValue: "0.005", significance: "Significant" },
    { factor: "Value (HML)", beta: -0.18, tStat: -1.72, pValue: "0.086", significance: "Marginal" },
    { factor: "Robust Profitability (RMW)", beta: 0.41, tStat: 3.25, pValue: "0.001", significance: "Significant" },
    { factor: "Conservative Investment (CMA)", beta: -0.22, tStat: -1.94, pValue: "0.052", significance: "Marginal" },
    { factor: "Momentum (UMD / MOM)", beta: 1.24, tStat: 8.12, pValue: "<0.001", significance: "Highly Significant" },
  ];

  return (
    <div className="space-y-4">
      {/* Regression Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Annualized Jensen's Alpha</span>
          <div className="text-xl font-bold text-[#10B981] font-mono">+8.21%</div>
          <p className="text-[10px] text-slate-400">t-stat: 3.84 (99.9% statistical significance).</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">R-Squared (Explained Variance)</span>
          <div className="text-xl font-bold text-white font-mono">0.684</div>
          <p className="text-[10px] text-slate-400">68.4% of returns explained by 6 factors.</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Tracking Error</span>
          <div className="text-xl font-bold text-slate-200 font-mono">5.42%</div>
          <p className="text-[10px] text-slate-400">Annualized active residual volatility.</p>
        </div>
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Information Ratio</span>
          <div className="text-xl font-bold text-[#38BDF8] font-mono">1.51</div>
          <p className="text-[10px] text-slate-400">Alpha generated per unit of active tracking risk.</p>
        </div>
      </div>

      {/* Fama-French Regression Decomposition */}
      <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
        <div className="pb-2 border-b border-[#1E2530]">
          <span className="font-semibold text-white text-xs tracking-tight">
            Fama-French Multi-Factor Regression Decomposition (OLS)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2530] text-[10px] text-slate-400 uppercase font-sans">
                <th className="py-2">Risk Factor Loading</th>
                <th className="py-2 text-right">Factor Beta</th>
                <th className="py-2 text-right">t-Statistic</th>
                <th className="py-2 text-right">p-Value</th>
                <th className="py-2 text-right">Statistical Significance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2530]/50">
              {famaFrenchFactors.map((f) => (
                <tr key={f.factor} className="hover:bg-[#111622]/50">
                  <td className="py-2.5 font-bold text-white font-sans">{f.factor}</td>
                  <td className={`py-2.5 text-right font-semibold ${f.beta >= 0 ? "text-[#38BDF8]" : "text-[#EF4444]"}`}>
                    {f.beta >= 0 ? `+${f.beta.toFixed(2)}` : f.beta.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right text-slate-200">{f.tStat.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-slate-400">{f.pValue}</td>
                  <td className="py-2.5 text-right text-[#10B981] font-sans font-medium text-[11px]">
                    {f.significance}
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
