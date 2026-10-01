"use client";

import React, { useState } from "react";
import { X, PieChart, BarChart3, TrendingUp, ShieldAlert, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { PortfolioAllocationBars } from "./AllocationPanel";
import PortfolioMetrics from "./PortfolioMetrics";
import RiskReturnProfile from "./RiskReturnProfile";
import { PORTFOLIO_VISUAL_CONFIG } from "@/lib/portfolio/portfolioVisualConfig";

interface PortfolioContextualPanelProps {
  drilldownLevel: number;
  selectedAssetClass: "equity" | "factors" | "options" | "cash" | null;
  selectedSector: string | null;
  selectedAsset: string | null;
  onReset: () => void;
  onSelectAsset: (id: string) => void;
  assetClassWeights: {
    equity: number;
    factors: number;
    options: number;
    cash: number;
  };
  metrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    var95: number;
    sortinoRatio: number;
  };
  allocations: {
    id: string;
    name: string;
    company: string;
    weight: number;
    color: string;
    riskContrib?: number;
    volatility?: number;
    correlation?: number;
  }[];
}

export default function PortfolioContextualPanel({
  drilldownLevel,
  selectedAssetClass,
  selectedSector,
  selectedAsset,
  onReset,
  onSelectAsset,
  assetClassWeights,
  metrics,
  allocations,
}: PortfolioContextualPanelProps) {
  const [subTab, setSubTab] = useState<"sector" | "asset">("sector");

  const isDrilled = drilldownLevel > 0 || selectedAsset !== null;

  // 1. IF AT PORTFOLIO LEVEL: Show Default Allocation Bars, Metrics & Risk/Return Chart
  if (!isDrilled) {
    return (
      <div className="w-full lg:w-[320px] shrink-0 space-y-4">
        <PortfolioAllocationBars weights={assetClassWeights} />
        <PortfolioMetrics metrics={metrics} />
        <RiskReturnProfile
          volatility={metrics.volatility}
          expectedReturn={metrics.expectedReturn}
        />
      </div>
    );
  }

  // 2. IF AN INDIVIDUAL ASSET IS SELECTED: Show Deep Asset Profile
  if (selectedAsset) {
    const asset = allocations.find((a) => a.id === selectedAsset) || allocations[0];
    const amount = (asset.weight / 100) * PORTFOLIO_VISUAL_CONFIG.totalPortfolioValue;

    return (
      <div className="w-full lg:w-[320px] shrink-0 space-y-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider text-cyan-500 uppercase">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }} />
                <span>SELECTED ASSET</span>
              </div>
              <h3 className="text-lg font-black text-[#0B1220] dark:text-white leading-tight mt-0.5">
                {asset.name}
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">{asset.company}</p>
            </div>
            <button
              onClick={onReset}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Close and return to Portfolio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Allocation & Amount Banner */}
          <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Weight in Portfolio
              </span>
              <div className="text-xl font-black text-[#1769FF] dark:text-cyan-400">
                {asset.weight.toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Allocated Capital
              </span>
              <div className="text-sm font-bold text-[#0B1220] dark:text-white">
                ₹{amount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Risk & Analytics Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-medium">Volatility</span>
              <span className="text-xs font-bold text-[#0B1220] dark:text-white mt-0.5 block">
                {asset.volatility ? `${asset.volatility.toFixed(1)}%` : "22.4%"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-medium">Risk Contrib.</span>
              <span className="text-xs font-bold text-amber-500 mt-0.5 block">
                {asset.riskContrib ? `${asset.riskContrib.toFixed(1)}%` : "12.8%"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-medium">Correlation</span>
              <span className="text-xs font-bold text-[#0B1220] dark:text-white mt-0.5 block">
                {asset.correlation ? asset.correlation.toFixed(2) : "0.58"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-medium">Sharpe Est.</span>
              <span className="text-xs font-bold text-emerald-500 mt-0.5 block">
                1.34
              </span>
            </div>
          </div>
        </div>

        {/* Action Link to Full Terminal */}
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>Open in Research Lab</span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-cyan-400" />
        </div>
      </div>
    );
  }

  // 3. IF ASSET CLASS (EQUITY) IS SELECTED: Matches input_file_1.png exactly!
  const sectors = PORTFOLIO_VISUAL_CONFIG.sectors;
  const topHoldings = [
    { ticker: "RELIANCE", name: "Reliance Industries", weight: 18.4, amount: "₹1,84,000", color: "#10B981" },
    { ticker: "HDFC", name: "HDFC Bank", weight: 11.6, amount: "₹1,16,000", color: "#06B6D4" },
    { ticker: "TCS", name: "Tata Consultancy", weight: 8.7, amount: "₹87,000", color: "#3B82F6" },
    { ticker: "INFY", name: "Infosys", weight: 7.3, amount: "₹73,000", color: "#8B5CF6" },
    { ticker: "AAPL", name: "Apple Inc.", weight: 5.1, amount: "₹51,000", color: "#EF4444" },
    { ticker: "MSFT", name: "Microsoft Corp.", weight: 4.2, amount: "₹42,000", color: "#F59E0B" },
  ];

  return (
    <div className="w-full lg:w-[320px] shrink-0 space-y-3.5">
      <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider text-[#1769FF] dark:text-cyan-400 uppercase">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>SELECTED: {selectedAssetClass ? selectedAssetClass.toUpperCase() : "EQUITY"}</span>
            </div>
            <div className="text-xl font-black text-[#0B1220] dark:text-white leading-tight mt-0.5">
              {assetClassWeights.equity.toFixed(1)}% <span className="text-xs font-semibold text-slate-500">OF PORTFOLIO</span>
            </div>
          </div>
          <button
            onClick={onReset}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Close selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle [ By Sector ] [ By Asset ] */}
        <div className="mt-3 flex p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setSubTab("sector")}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              subTab === "sector"
                ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-cyan-400 shadow-2xs font-bold"
                : "hover:text-[#0B1220] dark:hover:text-white"
            }`}
          >
            By Sector
          </button>
          <button
            type="button"
            onClick={() => setSubTab("asset")}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              subTab === "asset"
                ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-cyan-400 shadow-2xs font-bold"
                : "hover:text-[#0B1220] dark:hover:text-white"
            }`}
          >
            By Asset
          </button>
        </div>

        {/* Sub-view 1: By Sector Breakdown */}
        {subTab === "sector" ? (
          <div className="mt-3.5 space-y-3">
            {/* Visual Ring / Progress Breakdown */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-300">Sector Exposure</span>
                <span className="text-[#1769FF] dark:text-cyan-400">100% Equity</span>
              </div>

              {/* Stacked Color Bar */}
              <div className="h-2.5 w-full rounded-full overflow-hidden flex">
                {sectors.map((s) => (
                  <div
                    key={s.id}
                    style={{ width: `${s.weight}%`, backgroundColor: s.color }}
                    title={`${s.name}: ${s.weight}%`}
                  />
                ))}
              </div>

              {/* Legend List */}
              <div className="mt-3 space-y-1.5 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                {sectors.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{s.name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#0B1220] dark:text-white">{s.weight.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Holdings in Equity Table */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Top Holdings in Equity
              </div>
              <div className="space-y-1.5">
                {topHoldings.slice(0, 4).map((h) => (
                  <div
                    key={h.ticker}
                    onClick={() => onSelectAsset(h.ticker)}
                    className="p-2 rounded-xl bg-white dark:bg-[#070D18] border border-slate-100 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-cyan-500/50 flex items-center justify-between cursor-pointer transition-all text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: h.color }} />
                      <div>
                        <div className="font-bold text-[#0B1220] dark:text-white leading-none">{h.ticker}</div>
                        <div className="text-[10px] text-slate-400 leading-none mt-0.5">{h.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-[#1769FF] dark:text-cyan-400 leading-none">{h.weight}%</div>
                      <div className="text-[10px] font-mono text-slate-400 leading-none mt-0.5">{h.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Sub-view 2: By Asset Breakdown */
          <div className="mt-3.5 space-y-2">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Equity Assets
            </div>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {topHoldings.map((h) => (
                <div
                  key={h.ticker}
                  onClick={() => onSelectAsset(h.ticker)}
                  className="p-2 rounded-xl bg-white dark:bg-[#070D18] border border-slate-100 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-cyan-500/50 flex items-center justify-between cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                    <div>
                      <div className="font-bold text-[#0B1220] dark:text-white leading-none">{h.ticker}</div>
                      <div className="text-[10px] text-slate-400 leading-none mt-0.5">{h.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[#1769FF] dark:text-cyan-400 leading-none">{h.weight}%</div>
                    <div className="text-[10px] font-mono text-slate-400 leading-none mt-0.5">{h.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
