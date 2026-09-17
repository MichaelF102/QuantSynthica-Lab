"use client";

import React, { useState } from "react";
import {
  Calendar,
  ChevronDown,
  Play,
  RotateCw,
  Save,
  Download,
  Edit2,
  Check,
  PieChart as PieIcon,
  Sliders,
  Zap,
} from "lucide-react";
import { AssetAllocation } from "@/components/portfolio/PortfolioAllocationWidget";

export const INDIA_BENCHMARKS = [
  { value: "^NSEI", label: "NIFTY 50 (^NSEI)" },
  { value: "^NSEBANK", label: "NIFTY Bank (^NSEBANK)" },
  { value: "^BSESN", label: "BSE SENSEX (^BSESN)" },
  { value: "NIFTY_IT", label: "NIFTY IT Index" },
  { value: "NIFTY_MIDCAP", label: "NIFTY Midcap 100" },
];

export const US_BENCHMARKS = [
  { value: "SPY", label: "SPY (S&P 500 ETF)" },
  { value: "QQQ", label: "QQQ (Nasdaq 100 ETF)" },
  { value: "IWM", label: "IWM (Russell 2000)" },
  { value: "DIA", label: "DIA (Dow Jones 30)" },
];

interface PortfolioHeaderProps {
  portfolioName: string;
  onPortfolioNameChange?: (name: string) => void;
  availablePortfolios?: string[];
  benchmark: string;
  onBenchmarkChange: (bm: string) => void;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  frequency: "Daily" | "Weekly" | "Monthly";
  onFrequencyChange: (freq: "Daily" | "Weekly" | "Monthly") => void;
  currency: "USD" | "INR" | "EUR" | "GBP";
  onCurrencyChange: (curr: "USD" | "INR" | "EUR" | "GBP") => void;
  initialCapital: number;
  onInitialCapitalChange: (cap: number) => void;
  rebalance: "Monthly" | "Quarterly" | "Weekly" | "Never";
  onRebalanceChange: (reb: "Monthly" | "Quarterly" | "Weekly" | "Never") => void;
  onRunAnalysis: () => void;
  isRunning?: boolean;

  // New multi-market & stock selection props
  market?: "India" | "US";
  onMarketChange?: (m: "India" | "US") => void;
  allocations?: AssetAllocation[];
  onOpenStockBasketModal?: () => void;
  terminalActiveTicker?: string | null;
  onAddStockQuick?: (ticker: string) => void;
}

export default function PortfolioHeader({
  portfolioName,
  onPortfolioNameChange,
  availablePortfolios = [
    "Dual Moving Average Crossover",
    "RSI Mean Reversion (SPY)",
    "Bollinger Band Breakout (TSLA)",
    "Multi-Strategy Tactical Basket",
  ],
  benchmark,
  onBenchmarkChange,
  startDate,
  endDate,
  onDateChange,
  frequency,
  onFrequencyChange,
  currency,
  onCurrencyChange,
  initialCapital,
  onInitialCapitalChange,
  rebalance,
  onRebalanceChange,
  onRunAnalysis,
  isRunning = false,
  market = "India",
  onMarketChange,
  allocations = [],
  onOpenStockBasketModal,
  terminalActiveTicker,
  onAddStockQuick,
}: PortfolioHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(portfolioName);
  const [savedLayoutToast, setSavedLayoutToast] = useState(false);

  const handleApplyDate = () => {
    onDateChange(tempStart, tempEnd);
    setShowDatePicker(false);
  };

  const handleSaveLayout = () => {
    setSavedLayoutToast(true);
    setTimeout(() => setSavedLayoutToast(false), 2000);
  };

  const handleExport = () => {
    window.print();
  };

  const benchmarks = market === "India" ? INDIA_BENCHMARKS : US_BENCHMARKS;
  const currSymbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  const capitalPresets =
    currency === "INR"
      ? [
          { label: "10L", val: 1000000 },
          { label: "25L", val: 2500000 },
          { label: "50L", val: 5000000 },
          { label: "1Cr", val: 10000000 },
        ]
      : [
          { label: "50k", val: 50000 },
          { label: "100k", val: 100000 },
          { label: "250k", val: 250000 },
          { label: "1M", val: 1000000 },
        ];

  return (
    <div className="space-y-2.5 pb-3 border-b border-[#1E2530]">
      {/* 1. Main Title, Market Switcher & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-tight font-sans">
              Portfolio &amp; Tail Risk Analytics
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] font-semibold border border-[#38BDF8]/30">
              INSTITUTIONAL
            </span>
          </div>
          <p className="text-xs text-[#89919C] mt-0.5">
            Comprehensive portfolio risk analysis, tail risk measurement, and multi-asset allocation insights
          </p>
        </div>

        {/* Top Right: Country Switcher + Action Buttons */}
        <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
          {/* Country Switcher */}
          {onMarketChange && (
            <div className="inline-flex rounded p-0.5 bg-[#0F141D] border border-[#202C3F]">
              <button
                type="button"
                onClick={() => onMarketChange("India")}
                className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  market === "India"
                    ? "bg-[#10B981] text-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🇮🇳</span>
                <span>INDIA</span>
              </button>
              <button
                type="button"
                onClick={() => onMarketChange("US")}
                className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  market === "US"
                    ? "bg-[#38BDF8] text-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🇺🇸</span>
                <span>US</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveLayout}
            className="flex items-center space-x-1.5 bg-[#0F141D] hover:bg-[#151C28] active:bg-[#1B2433] border border-[#202C3F] px-3 py-1.5 rounded text-slate-200 hover:text-white transition-colors text-xs font-medium shadow-sm"
          >
            {savedLayoutToast ? (
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <Save className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{savedLayoutToast ? "Layout Saved!" : "Save Layout"}</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center space-x-1.5 bg-[#0F141D] hover:bg-[#151C28] active:bg-[#1B2433] border border-[#202C3F] px-3 py-1.5 rounded text-slate-200 hover:text-white transition-colors text-xs font-medium shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Configuration & Parameter Ribbon */}
      <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        {/* Portfolio Selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 text-[11px]">Portfolio</span>
          {isEditingName ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-[#111622] border border-[#38BDF8] text-white text-xs px-2 py-1 rounded w-48 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (onPortfolioNameChange) onPortfolioNameChange(customName);
                  setIsEditingName(false);
                }}
                className="p-1 text-[#10B981] hover:bg-[#1A2232] rounded"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <div className="relative">
                <select
                  value={portfolioName}
                  onChange={(e) => {
                    if (onPortfolioNameChange) onPortfolioNameChange(e.target.value);
                  }}
                  className="appearance-none bg-[#111622] border border-[#202C3F] text-slate-200 pl-2.5 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer font-sans"
                >
                  {availablePortfolios.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-[#151C28]"
                title="Rename portfolio"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Benchmark (Dynamically filtered by Country) */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 text-[11px]">Benchmark</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${market === "India" ? "text-[#10B981] bg-[#10B981]/15" : "text-[#38BDF8] bg-[#38BDF8]/15"}`}>
              {market === "India" ? "IN" : "US"}
            </span>
          </div>
          <div className="relative">
            <select
              value={benchmark}
              onChange={(e) => onBenchmarkChange(e.target.value)}
              className="appearance-none bg-[#111622] border border-[#202C3F] text-slate-200 pl-2.5 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer font-sans"
            >
              {benchmarks.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 text-[11px]">Date Range</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center space-x-1.5 bg-[#111622] hover:bg-[#151C28] border border-[#202C3F] px-2.5 py-1 rounded text-slate-200 text-xs font-mono"
            >
              <Calendar className="w-3 h-3 text-[#38BDF8]" />
              <span>{startDate}</span>
              <span className="text-slate-500">→</span>
              <span>{endDate}</span>
            </button>

            {showDatePicker && (
              <div className="absolute left-0 top-full mt-1.5 bg-[#0C1017] border border-[#202C3F] rounded-lg p-3 shadow-2xl z-50 w-72 space-y-3">
                <div className="text-[11px] font-semibold text-white">Select Date Window</div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                      className="w-full bg-[#131822] border border-[#252E3E] text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                      className="w-full bg-[#131822] border border-[#252E3E] text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-1 border-t border-[#1E2530]">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyDate}
                    className="px-3 py-1 text-[11px] bg-[#0284C7] hover:bg-[#0369A1] text-white font-medium rounded"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frequency */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 text-[11px]">Frequency</span>
          <div className="relative">
            <select
              value={frequency}
              onChange={(e) => onFrequencyChange(e.target.value as any)}
              className="appearance-none bg-[#111622] border border-[#202C3F] text-slate-200 pl-2.5 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 text-[11px]">Currency</span>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as any)}
              className="appearance-none bg-[#111622] border border-[#202C3F] text-slate-200 pl-2.5 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer font-bold"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Initial Capital (Amount Selection) */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 text-[11px]">Initial Capital</span>
          <div className="flex items-center space-x-1">
            <div className="relative w-28">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold pointer-events-none">
                {currSymbol}
              </span>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => onInitialCapitalChange(Number(e.target.value) || 100000)}
                className="bg-[#111622] border border-[#202C3F] text-white text-xs pl-5 pr-2 py-1 rounded w-full font-mono text-right focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Quick Capital Preset Pills */}
            <div className="hidden xl:flex items-center space-x-0.5">
              {capitalPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onInitialCapitalChange(p.val)}
                  className={`px-1 py-0.5 text-[9px] font-mono rounded border transition-colors cursor-pointer ${
                    initialCapital === p.val
                      ? "bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8] font-bold"
                      : "bg-[#111722] border-[#202C3F] text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rebalance */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 text-[11px]">Rebalance</span>
          <div className="relative">
            <select
              value={rebalance}
              onChange={(e) => onRebalanceChange(e.target.value as any)}
              className="appearance-none bg-[#111622] border border-[#202C3F] text-slate-200 pl-2.5 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Weekly">Weekly</option>
              <option value="Never">Never</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Run Analysis Action Button */}
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={isRunning}
          className="flex items-center space-x-1.5 bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          {isRunning ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white text-white" />
          )}
          <span>{isRunning ? "Simulating..." : "Run Analysis"}</span>
        </button>
      </div>

      {/* 3. Constituent Stocks & Basket Quick Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#090D14] border border-[#1E2530] rounded-lg text-xs font-mono">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <PieIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="font-semibold text-slate-300">Basket Stocks ({allocations.length}):</span>
          </div>

          {allocations.map((a) => (
            <button
              key={a.ticker}
              type="button"
              onClick={onOpenStockBasketModal}
              className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#111722] hover:bg-[#182030] border border-[#202C3F] hover:border-[#38BDF8]/60 text-slate-200 transition-colors cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
              <span className="font-bold font-mono group-hover:text-[#38BDF8]">{a.ticker}</span>
              <span className="text-[10px] text-slate-400 font-mono">{a.weight}%</span>
            </button>
          ))}

          {onOpenStockBasketModal && (
            <button
              type="button"
              onClick={onOpenStockBasketModal}
              className="flex items-center space-x-1 px-2.5 py-0.5 rounded bg-[#0284C7]/20 hover:bg-[#0284C7]/30 border border-[#0284C7]/50 text-[#38BDF8] text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>+ Configure Basket &amp; Weights</span>
            </button>
          )}
        </div>

        {terminalActiveTicker && !allocations.some((a) => a.ticker === terminalActiveTicker) && (
          <button
            type="button"
            onClick={() => onAddStockQuick && onAddStockQuick(terminalActiveTicker)}
            className="flex items-center space-x-1 px-2.5 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/25 text-[11px] transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            <span>
              Add Active Stock: <strong>{terminalActiveTicker}</strong>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
