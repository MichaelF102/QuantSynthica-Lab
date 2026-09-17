"use client";

import React from "react";
import { Info } from "lucide-react";

interface RiskContributionItem {
  asset: string;
  pctOfRisk: number;
  barColor: string;
}

const DEFAULT_RISK_CONTRIBUTIONS: RiskContributionItem[] = [
  { asset: "NVDA", pctOfRisk: 34.7, barColor: "#EF4444" },
  { asset: "AAPL", pctOfRisk: 17.8, barColor: "#38BDF8" },
  { asset: "MSFT", pctOfRisk: 14.2, barColor: "#F59E0B" },
  { asset: "TLT", pctOfRisk: 12.5, barColor: "#8B5CF6" },
  { asset: "SPY", pctOfRisk: 10.8, barColor: "#10B981" },
];

export default function PortfolioRiskContributionWidget({
  items = DEFAULT_RISK_CONTRIBUTIONS,
}: {
  items?: RiskContributionItem[];
}) {
  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-[#1A2230]">
        <h2 className="text-sm font-bold text-white tracking-tight font-sans">
          Risk Contribution (Euler Decomposition)
        </h2>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Euler risk attribution measuring marginal risk contributions accounting for cross-asset correlations"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table & Bars */}
      <div className="pt-2 space-y-2.5">
        <div className="grid grid-cols-12 text-[11px] text-[#717E90] font-sans font-medium px-1">
          <div className="col-span-2">Asset</div>
          <div className="col-span-8">Risk Contribution</div>
          <div className="col-span-2 text-right">% of Risk</div>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.asset}
              className="grid grid-cols-12 items-center text-xs py-1 px-1 rounded hover:bg-[#0E1522] transition-colors"
            >
              <div className="col-span-2 font-bold font-sans text-slate-200">
                {item.asset}
              </div>

              <div className="col-span-8 pr-3">
                <div className="w-full bg-[#141C28] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.min(100, item.pctOfRisk * 2.5)}%`,
                      backgroundColor: item.barColor,
                    }}
                  />
                </div>
              </div>

              <div className="col-span-2 text-right font-mono font-bold text-slate-200">
                {item.pctOfRisk.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
