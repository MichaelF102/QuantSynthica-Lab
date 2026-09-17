"use client";

import React, { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Info, Sliders } from "lucide-react";

export interface AssetAllocation {
  ticker: string;
  weight: number;
  value: number;
  color: string;
  targetWeight?: number;
  drift?: number;
}

interface PortfolioAllocationWidgetProps {
  totalValue?: number;
  allocations?: AssetAllocation[];
  onAllocationChange?: (allocations: AssetAllocation[]) => void;
  currency?: "USD" | "INR" | "EUR" | "GBP";
  onEditBasket?: () => void;
}

const DEFAULT_ALLOCATIONS: AssetAllocation[] = [
  { ticker: "AAPL", weight: 20.0, value: 24468, color: "#38BDF8", targetWeight: 18.4, drift: 1.6 },
  { ticker: "MSFT", weight: 20.0, value: 24468, color: "#F59E0B", targetWeight: 16.7, drift: 3.3 },
  { ticker: "NVDA", weight: 20.0, value: 24468, color: "#EC4899", targetWeight: 28.2, drift: -8.2 },
  { ticker: "SPY", weight: 20.0, value: 24468, color: "#8B5CF6", targetWeight: 22.1, drift: -2.1 },
  { ticker: "TLT", weight: 20.0, value: 24468, color: "#06B6D4", targetWeight: 14.6, drift: 5.4 },
];

export default function PortfolioAllocationWidget({
  totalValue = 122340,
  allocations = DEFAULT_ALLOCATIONS,
  currency = "USD",
  onEditBasket,
}: PortfolioAllocationWidgetProps) {
  const [activeTab, setActiveTab] = useState<"Current" | "Target" | "Drift">("Current");
  const currSymbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  const displayData = allocations.map((a) => ({
    ...a,
    displayWeight:
      activeTab === "Current"
        ? a.weight
        : activeTab === "Target"
        ? a.targetWeight ?? a.weight
        : Math.abs(a.drift ?? 0),
    displayValue:
      activeTab === "Current"
        ? a.value
        : activeTab === "Target"
        ? Math.round(totalValue * ((a.targetWeight ?? a.weight) / 100))
        : Math.round(totalValue * (Math.abs(a.drift ?? 0) / 100)),
  }));

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header & Tabs */}
      <div className="space-y-2 pb-2 border-b border-[#1A2230]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">
              Portfolio Allocation
            </h2>
            {onEditBasket && (
              <button
                type="button"
                onClick={onEditBasket}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0284C7]/20 hover:bg-[#0284C7]/30 border border-[#0284C7]/50 text-[#38BDF8] text-[10px] font-semibold transition-colors cursor-pointer"
                title="Configure constituent stocks and weights"
              >
                <Sliders className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Asset universe weights, capital breakdown, and portfolio drift"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center bg-[#111722] border border-[#1F2B3E] rounded p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("Current")}
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === "Current"
                  ? "bg-[#0284C7] text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Current Allocation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Target")}
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === "Target"
                  ? "bg-[#0284C7] text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Target Allocation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Drift")}
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === "Drift"
                  ? "bg-[#0284C7] text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Drift Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Body: Donut Chart + Asset Table */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-2">
        {/* Donut Chart with Center Text (5 cols) */}
        <div className="sm:col-span-5 relative flex items-center justify-center h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
                dataKey="displayWeight"
                stroke="#090D14"
                strokeWidth={2}
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0C1017",
                  borderColor: "#202C3F",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#E2E8F0",
                }}
                formatter={(value: any, name: any, item: any) => [
                  `${value.toFixed(1)}% (${currSymbol}${item.payload.displayValue.toLocaleString()})`,
                  item.payload.ticker,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-bold font-mono text-white leading-tight">
              {currSymbol}
              {totalValue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 leading-tight">
              Total Value
            </span>
          </div>
        </div>

        {/* Legend List on Right (7 cols) */}
        <div className="sm:col-span-7 space-y-1.5 pl-2">
          {displayData.map((item) => (
            <div
              key={item.ticker}
              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#0E1522]/60 border border-[#182335]/50 hover:bg-[#121B2B] transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-200 font-sans">
                  {item.ticker}
                </span>
              </div>

              <div className="flex items-center space-x-3 font-mono">
                <span className="text-slate-300 font-medium">
                  {activeTab === "Drift" && item.drift !== undefined
                    ? `${item.drift > 0 ? "+" : ""}${item.drift.toFixed(1)}%`
                    : `${item.displayWeight.toFixed(1)}%`}
                </span>
                <span className="text-slate-400 text-[11px] w-16 text-right">
                  {currSymbol}
                  {item.displayValue.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
