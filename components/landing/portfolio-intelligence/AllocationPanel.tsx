"use client";

import React, { useState } from "react";
import { Search, Plus, Minus, Check } from "lucide-react";
import { AssetAllocation } from "./PortfolioConstellation";

interface ConstructPanelProps {
  allocations: AssetAllocation[];
  onUpdateWeight: (id: string, delta: number) => void;
  selectedAsset: string | null;
  onSelectAsset: (id: string) => void;
}

export function ConstructPortfolioPanel({
  allocations,
  onUpdateWeight,
  selectedAsset,
  onSelectAsset,
}: ConstructPanelProps) {
  const [activeTab, setActiveTab] = useState<"assets" | "strategies" | "factors">("assets");
  const [activeFilter, setActiveFilter] = useState<string>("Equity");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = ["Equity", "ETF", "Options", "Futures", "Indices"];

  const filteredAssets = allocations.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full lg:w-[320px] shrink-0">
      <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Header */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-[#1769FF] text-white font-black text-xs flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1220] dark:text-white leading-tight">Construct Portfolio</h3>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-tight mt-0.5">
              Select assets, set allocations and constraints
            </p>
          </div>
        </div>

        {/* Tabs: Assets, Strategies, Factors */}
        <div className="mt-3 flex p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 text-xs font-semibold text-[#526174] dark:text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === "assets"
                ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 shadow-2xs font-bold"
                : "hover:text-[#0B1220] dark:hover:text-white"
            }`}
          >
            Assets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("strategies")}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === "strategies"
                ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 shadow-2xs font-bold"
                : "hover:text-[#0B1220] dark:hover:text-white"
            }`}
          >
            Strategies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("factors")}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === "factors"
                ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 shadow-2xs font-bold"
                : "hover:text-[#0B1220] dark:hover:text-white"
            }`}
          >
            Factors
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stocks, ETFs or indices..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs text-[#0B1220] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-[#1769FF] focus:border-[#1769FF]"
          />
        </div>

        {/* Filter Pills */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                activeFilter === f
                  ? "bg-[#1769FF] text-white"
                  : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Assets List with + and - controls */}
        <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAsset === asset.id;
            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-500/80 shadow-2xs"
                    : "border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-[#070D18]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: asset.color }}
                  >
                    {asset.id.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight truncate">
                      {asset.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate">
                      {asset.company}
                    </div>
                  </div>
                </div>

                {/* Weight Adjustment Buttons */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onUpdateWeight(asset.id, -0.5)}
                    aria-label={`Decrease weight for ${asset.name}`}
                    className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-12 text-center text-xs font-black text-[#0B1220] dark:text-white">
                    {asset.weight.toFixed(1)}%
                  </span>

                  <button
                    type="button"
                    onClick={() => onUpdateWeight(asset.id, 0.5)}
                    aria-label={`Increase weight for ${asset.name}`}
                    className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface AllocationBarsProps {
  weights: {
    equity: number;
    factors: number;
    options: number;
    cash: number;
  };
}

export function PortfolioAllocationBars({ weights }: AllocationBarsProps) {
  return (
    <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Portfolio Allocation</h4>
          <span className="text-[10px] text-[#64748B] dark:text-slate-400">Total Assets: 6 Assets</span>
        </div>
        <span className="text-[11px] font-bold text-[#1769FF]">100%</span>
      </div>

      <div className="mt-3 space-y-2.5">
        {/* Equity */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600 dark:text-slate-400">Equity</span>
            <span className="font-bold text-[#0B1220] dark:text-white">{weights.equity.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1769FF] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, weights.equity))}%` }}
            />
          </div>
        </div>

        {/* Factors */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600 dark:text-slate-400">Factors</span>
            <span className="font-bold text-[#0B1220] dark:text-white">{weights.factors.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0D9488] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, weights.factors))}%` }}
            />
          </div>
        </div>

        {/* Options */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600 dark:text-slate-400">Options</span>
            <span className="font-bold text-[#0B1220] dark:text-white">{weights.options.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8B5CF6] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, weights.options))}%` }}
            />
          </div>
        </div>

        {/* Cash */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600 dark:text-slate-400">Cash</span>
            <span className="font-bold text-slate-600 dark:text-slate-400">{weights.cash.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, weights.cash))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
