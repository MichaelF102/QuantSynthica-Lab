"use client";

import React from "react";
import { Info } from "lucide-react";

interface RebalanceRow {
  frequency: "No Rebalance" | "Monthly" | "Quarterly" | "Weekly";
  ret: number;
  vol: number;
  sharpe: number;
  maxDd: number;
  turnover: number;
}

const REBALANCE_DATA: RebalanceRow[] = [
  { frequency: "No Rebalance", ret: 11.8, vol: 19.4, sharpe: 0.91, maxDd: -15.2, turnover: 0 },
  { frequency: "Monthly", ret: 12.6, vol: 17.8, sharpe: 1.08, maxDd: -12.7, turnover: 31.4 },
  { frequency: "Quarterly", ret: 12.2, vol: 18.2, sharpe: 1.01, maxDd: -13.4, turnover: 18.7 },
  { frequency: "Weekly", ret: 11.9, vol: 18.0, sharpe: 0.99, maxDd: -13.1, turnover: 62.3 },
];

interface PortfolioRebalancingWidgetProps {
  currentRebalance?: "Monthly" | "Quarterly" | "Weekly" | "Never";
  onRebalanceSelect?: (reb: "Monthly" | "Quarterly" | "Weekly" | "Never") => void;
}

export default function PortfolioRebalancingWidget({
  currentRebalance = "Monthly",
  onRebalanceSelect,
}: PortfolioRebalancingWidgetProps) {
  const isSelected = (freq: RebalanceRow["frequency"]) => {
    if (freq === "No Rebalance" && currentRebalance === "Never") return true;
    return freq === currentRebalance;
  };

  const handleSelect = (freq: RebalanceRow["frequency"]) => {
    if (!onRebalanceSelect) return;
    if (freq === "No Rebalance") onRebalanceSelect("Never");
    else onRebalanceSelect(freq);
  };

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-[#1A2230]">
        <h2 className="text-sm font-bold text-white tracking-tight font-sans">
          Rebalancing Analysis
        </h2>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Comparative performance and transaction drag across periodic rebalance frequencies"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="pt-2 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[#182232] text-[11px] text-[#717E90]">
              <th className="py-1 px-1 font-sans font-medium">Frequency</th>
              <th className="py-1 px-1 font-sans font-medium">Return</th>
              <th className="py-1 px-1 font-sans font-medium">Volatility</th>
              <th className="py-1 px-1 font-sans font-medium">Sharpe</th>
              <th className="py-1 px-1 font-sans font-medium">Max DD</th>
              <th className="py-1 px-1 font-sans font-medium text-right">Turnover</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#131B27]">
            {REBALANCE_DATA.map((r) => {
              const active = isSelected(r.frequency);
              return (
                <tr
                  key={r.frequency}
                  onClick={() => handleSelect(r.frequency)}
                  className={`cursor-pointer transition-colors ${
                    active
                      ? "bg-[#111C2B] border-l-2 border-l-[#38BDF8]"
                      : "hover:bg-[#0E1522]"
                  }`}
                >
                  <td className="py-2 px-1 font-sans font-semibold text-slate-200">
                    {r.frequency}
                  </td>
                  <td className="py-2 px-1 font-bold text-[#10B981]">
                    +{r.ret.toFixed(1)}%
                  </td>
                  <td className="py-2 px-1 text-slate-300">
                    {r.vol.toFixed(1)}%
                  </td>
                  <td className="py-2 px-1 text-white font-bold">
                    {r.sharpe.toFixed(2)}
                  </td>
                  <td className="py-2 px-1 text-[#F43F5E]">
                    {r.maxDd.toFixed(1)}%
                  </td>
                  <td className="py-2 px-1 text-right text-slate-300">
                    {r.turnover.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
