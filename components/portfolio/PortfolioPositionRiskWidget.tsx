"use client";

import React from "react";
import { Info } from "lucide-react";

interface PositionRiskRow {
  asset: string;
  weight: number;
  volatility: number;
  beta: number;
  var95: number;
  cvar95: number;
  riskPct: number;
}

const DEFAULT_POSITIONS: PositionRiskRow[] = [
  { asset: "AAPL", weight: 20.0, volatility: 24.5, beta: 1.08, var95: -0.31, cvar95: -0.52, riskPct: 17.8 },
  { asset: "MSFT", weight: 20.0, volatility: 21.2, beta: 0.96, var95: -0.27, cvar95: -0.46, riskPct: 14.2 },
  { asset: "NVDA", weight: 20.0, volatility: 42.0, beta: 1.42, var95: -0.61, cvar95: -0.98, riskPct: 34.7 },
  { asset: "SPY", weight: 20.0, volatility: 14.8, beta: 1.0, var95: -0.18, cvar95: -0.29, riskPct: 10.8 },
  { asset: "TLT", weight: 20.0, volatility: 16.5, beta: -0.21, var95: -0.16, cvar95: -0.27, riskPct: 12.5 },
];

export default function PortfolioPositionRiskWidget({
  positions = DEFAULT_POSITIONS,
}: {
  positions?: PositionRiskRow[];
}) {
  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-[#1A2230]">
        <h2 className="text-sm font-bold text-white tracking-tight font-sans">
          Position-Level Risk
        </h2>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Constituent-level volatility, systematic beta, Value at Risk, and Conditional VaR"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="pt-2 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[#182232] text-[11px] text-[#717E90]">
              <th className="py-1 px-1 font-sans font-medium">Asset</th>
              <th className="py-1 px-1 font-sans font-medium">Weight</th>
              <th className="py-1 px-1 font-sans font-medium">Volatility</th>
              <th className="py-1 px-1 font-sans font-medium">Beta</th>
              <th className="py-1 px-1 font-sans font-medium">VaR (95%)</th>
              <th className="py-1 px-1 font-sans font-medium">CVaR (95%)</th>
              <th className="py-1 px-1 font-sans font-medium text-right">Risk %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#131B27]">
            {positions.map((p) => (
              <tr key={p.asset} className="hover:bg-[#0E1522] transition-colors">
                <td className="py-1.5 px-1 font-sans font-bold text-slate-200">
                  {p.asset}
                </td>
                <td className="py-1.5 px-1 text-slate-300">
                  {p.weight.toFixed(1)}%
                </td>
                <td className="py-1.5 px-1 text-slate-300">
                  {p.volatility.toFixed(1)}%
                </td>
                <td className="py-1.5 px-1 text-slate-300">
                  {p.beta.toFixed(2)}
                </td>
                <td className="py-1.5 px-1 text-[#F43F5E]">
                  {p.var95.toFixed(2)}%
                </td>
                <td className="py-1.5 px-1 text-[#F43F5E]">
                  {p.cvar95.toFixed(2)}%
                </td>
                <td className="py-1.5 px-1 text-right font-bold text-white">
                  {p.riskPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
