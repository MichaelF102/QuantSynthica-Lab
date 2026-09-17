"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  PieChart as PieIcon,
  Sliders,
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Info,
} from "lucide-react";
import StockSearchInput from "@/components/ui/StockSearchInput";
import { AssetAllocation } from "@/components/portfolio/PortfolioAllocationWidget";
import { StockProfile } from "@/types";

interface PortfolioStockBasketModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: "India" | "US";
  onMarketChange: (market: "India" | "US") => void;
  allocations: AssetAllocation[];
  onSaveAllocations: (newAllocations: AssetAllocation[]) => void;
  initialCapital: number;
  currency: "INR" | "USD" | "EUR" | "GBP";
}

const COLOR_PALETTE = [
  "#38BDF8", // Sky blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#E11D48", // Rose
];

// Curated Institutional Baskets
const PRESET_BASKETS = {
  India: [
    {
      id: "in_core",
      name: "NIFTY 50 Bluechip Leaders",
      desc: "Top weighted private banking, energy, and IT conglomerates",
      stocks: [
        { ticker: "RELIANCE", weight: 25, name: "Reliance Industries" },
        { ticker: "HDFCBANK", weight: 25, name: "HDFC Bank" },
        { ticker: "TCS", weight: 20, name: "Tata Consultancy Services" },
        { ticker: "INFY", weight: 15, name: "Infosys Ltd" },
        { ticker: "ICICIBANK", weight: 15, name: "ICICI Bank" },
      ],
    },
    {
      id: "in_cleantech",
      name: "Smart Grid & Clean Tech Alpha",
      desc: "High momentum energy transition and electronics manufacturers",
      stocks: [
        { ticker: "KAYNES", weight: 25, name: "Kaynes Technology" },
        { ticker: "GENUSPOWER", weight: 25, name: "Genus Power Infrastructures" },
        { ticker: "TATAPOWER", weight: 20, name: "Tata Power" },
        { ticker: "ADANIGREEN", weight: 15, name: "Adani Green Energy" },
        { ticker: "POWERGRID", weight: 15, name: "Power Grid Corp" },
      ],
    },
    {
      id: "in_tech_auto",
      name: "Momentum Tech & Mobility",
      desc: "Digital transformation and automotive EV manufacturing",
      stocks: [
        { ticker: "TATAMOTORS", weight: 25, name: "Tata Motors" },
        { ticker: "BHARTIARTL", weight: 25, name: "Bharti Airtel" },
        { ticker: "KPITTECH", weight: 20, name: "KPIT Technologies" },
        { ticker: "LTIM", weight: 15, name: "LTIMindtree" },
        { ticker: "DIXON", weight: 15, name: "Dixon Technologies" },
      ],
    },
  ],
  US: [
    {
      id: "us_mag7",
      name: "Magnificent 7 Tech Titans",
      desc: "Mega-cap technology leaders dominating global cloud & AI",
      stocks: [
        { ticker: "NVDA", weight: 20, name: "NVIDIA Corp" },
        { ticker: "AAPL", weight: 20, name: "Apple Inc" },
        { ticker: "MSFT", weight: 20, name: "Microsoft Corp" },
        { ticker: "AMZN", weight: 15, name: "Amazon.com" },
        { ticker: "GOOGL", weight: 15, name: "Alphabet Inc" },
        { ticker: "META", weight: 10, name: "Meta Platforms" },
      ],
    },
    {
      id: "us_semis",
      name: "Semiconductor Supercycle",
      desc: "Foundry, GPU, and chip design pure-plays",
      stocks: [
        { ticker: "NVDA", weight: 30, name: "NVIDIA Corp" },
        { ticker: "AMD", weight: 25, name: "Advanced Micro Devices" },
        { ticker: "AVGO", weight: 20, name: "Broadcom Inc" },
        { ticker: "TSM", weight: 15, name: "Taiwan Semiconductor" },
        { ticker: "QCOM", weight: 10, name: "Qualcomm" },
      ],
    },
    {
      id: "us_balanced",
      name: "60/40 Institutional Multi-Asset",
      desc: "Classic institutional equity, tech, and treasury mix",
      stocks: [
        { ticker: "SPY", weight: 40, name: "S&P 500 ETF" },
        { ticker: "QQQ", weight: 20, name: "Nasdaq 100 ETF" },
        { ticker: "TLT", weight: 20, name: "20+ Year Treasury Bond" },
        { ticker: "GLD", weight: 10, name: "SPDR Gold Shares" },
        { ticker: "IWM", weight: 10, name: "Russell 2000 Small Cap" },
      ],
    },
  ],
};

export default function PortfolioStockBasketModal({
  isOpen,
  onClose,
  market,
  onMarketChange,
  allocations,
  onSaveAllocations,
  initialCapital,
  currency,
}: PortfolioStockBasketModalProps) {
  const [basket, setBasket] = useState<AssetAllocation[]>([]);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [terminalActiveTicker, setTerminalActiveTicker] = useState<string | null>(null);

  // Sync with prop on open
  useEffect(() => {
    if (isOpen) {
      setBasket(
        allocations.map((a, idx) => ({
          ...a,
          color: a.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
        }))
      );

      // Check active terminal ticker
      if (typeof window !== "undefined") {
        const t = localStorage.getItem("algolab_active_ticker");
        if (t) setTerminalActiveTicker(t.toUpperCase());
      }
    }
  }, [isOpen, allocations]);

  const totalWeight = useMemo(() => {
    return Number(basket.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0).toFixed(1));
  }, [basket]);

  const currSymbol = currency === "INR" ? "₹" : "$";

  if (!isOpen) return null;

  // Add stock to basket
  const handleAddStock = (symbol: string, profile?: StockProfile) => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;

    if (basket.some((b) => b.ticker === sym)) {
      alert(`${sym} is already in the portfolio basket.`);
      return;
    }

    const nextColor = COLOR_PALETTE[basket.length % COLOR_PALETTE.length];
    const defaultWeight = 10;
    const itemVal = Math.round((initialCapital * defaultWeight) / 100);

    setBasket((prev) => [
      ...prev,
      {
        ticker: sym,
        weight: defaultWeight,
        targetWeight: defaultWeight,
        value: itemVal,
        drift: 0,
        color: nextColor,
      },
    ]);
    setSearchSymbol("");
  };

  // Remove stock from basket
  const handleRemoveStock = (sym: string) => {
    setBasket((prev) => prev.filter((b) => b.ticker !== sym));
  };

  // Update weight for stock
  const handleWeightChange = (sym: string, weightVal: number) => {
    const w = Math.max(0, Math.min(100, weightVal));
    setBasket((prev) =>
      prev.map((item) =>
        item.ticker === sym
          ? {
              ...item,
              weight: w,
              targetWeight: w,
              value: Math.round((initialCapital * w) / 100),
            }
          : item
      )
    );
  };

  // Equal weight 1/N
  const handleEqualWeight = () => {
    if (basket.length === 0) return;
    const equalW = Number((100 / basket.length).toFixed(1));
    const remainder = Number((100 - equalW * (basket.length - 1)).toFixed(1));

    setBasket((prev) =>
      prev.map((item, idx) => {
        const w = idx === prev.length - 1 ? remainder : equalW;
        return {
          ...item,
          weight: w,
          targetWeight: w,
          value: Math.round((initialCapital * w) / 100),
          drift: 0,
        };
      })
    );
  };

  // Normalize all weights proportionally to 100%
  const handleNormalize = () => {
    if (totalWeight <= 0 || basket.length === 0) return;
    const factor = 100 / totalWeight;

    let runningSum = 0;
    setBasket((prev) =>
      prev.map((item, idx) => {
        if (idx === prev.length - 1) {
          const finalW = Number((100 - runningSum).toFixed(1));
          return {
            ...item,
            weight: finalW,
            targetWeight: finalW,
            value: Math.round((initialCapital * finalW) / 100),
            drift: 0,
          };
        }
        const w = Number((item.weight * factor).toFixed(1));
        runningSum += w;
        return {
          ...item,
          weight: w,
          targetWeight: w,
          value: Math.round((initialCapital * w) / 100),
          drift: 0,
        };
      })
    );
  };

  // Apply a curated preset basket
  const handleApplyPreset = (preset: (typeof PRESET_BASKETS)["India"][0]) => {
    const newBasket: AssetAllocation[] = preset.stocks.map((s, idx) => ({
      ticker: s.ticker,
      weight: s.weight,
      targetWeight: s.weight,
      value: Math.round((initialCapital * s.weight) / 100),
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      drift: 0,
    }));
    setBasket(newBasket);
  };

  // Save changes
  const handleSave = () => {
    if (basket.length === 0) {
      alert("Please select at least one stock for the portfolio.");
      return;
    }
    if (Math.abs(totalWeight - 100) > 0.5) {
      if (
        !confirm(
          `Total portfolio weight is ${totalWeight}% (not 100%). Would you like to automatically normalize it to 100% before saving?`
        )
      ) {
        return;
      }
      handleNormalize();
    }
    onSaveAllocations(basket);
    onClose();
  };

  const presets = market === "India" ? PRESET_BASKETS.India : PRESET_BASKETS.US;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-[#0B0E14] border border-[#202C3F] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 1. Modal Header */}
        <div className="p-4 border-b border-[#1E2530] bg-[#0E131C] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase font-sans">
                  Portfolio Stock Basket &amp; Asset Selection
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold">
                  {market === "India" ? "🇮🇳 INDIA NSE/BSE" : "🇺🇸 UNITED STATES"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Customize constituent stocks, assign portfolio weights, and balance capital allocations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#151C28] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Market Switcher & Quick Add Strip */}
        <div className="p-3 border-b border-[#1E2530] bg-[#090D14] flex flex-wrap items-center justify-between gap-3">
          {/* Market Switcher */}
          <div className="inline-flex rounded p-0.5 bg-[#111722] border border-[#1F2B3E]">
            <button
              type="button"
              onClick={() => onMarketChange("India")}
              className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                market === "India"
                  ? "bg-[#10B981] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇮🇳</span>
              <span>INDIA (NSE/BSE &amp; ₹)</span>
            </button>
            <button
              type="button"
              onClick={() => onMarketChange("US")}
              className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                market === "US"
                  ? "bg-[#38BDF8] text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇺🇸</span>
              <span>UNITED STATES (NYSE/NASDAQ &amp; $)</span>
            </button>
          </div>

          {/* Quick Active Terminal Stock Shortcut */}
          {terminalActiveTicker && !basket.some((b) => b.ticker === terminalActiveTicker) && (
            <button
              type="button"
              onClick={() => handleAddStock(terminalActiveTicker)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/25 transition-colors cursor-pointer text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                Add Active Terminal Stock: <strong>{terminalActiveTicker}</strong>
              </span>
            </button>
          )}
        </div>

        {/* 3. Curated Presets Ribbon */}
        <div className="p-3 border-b border-[#1E2530] bg-[#0C1017] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider">
              Quick Institutional Baskets ({market}):
            </span>
            <span className="text-slate-500">1-Click to Load Model Portfolio</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-2 rounded border border-[#202C3F] bg-[#111722] hover:border-[#38BDF8]/60 hover:bg-[#151D2A] text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs group-hover:text-[#38BDF8]">
                    {p.name}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.desc}</div>
                <div className="text-[9px] text-[#38BDF8] mt-1 font-mono">
                  {p.stocks.map((s) => s.ticker).join(", ")}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Stock Search & Add Bar */}
        <div className="p-3 border-b border-[#1E2530] bg-[#0E131C]">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Add Any Stock From 18,500+ Universe:
              </label>
              <StockSearchInput
                value={searchSymbol}
                placeholder={
                  market === "India"
                    ? "Search Indian Stock (e.g. KAYNES, GENUSPOWER, RELIANCE, TCS)..."
                    : "Search US Stock (e.g. NVDA, AAPL, MSFT, TSLA, SPY)..."
                }
                onChange={(sym, profile) => handleAddStock(sym, profile)}
              />
            </div>
            <div className="pt-4 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleEqualWeight}
                className="px-2.5 py-1.5 bg-[#141A25] hover:bg-[#1B2332] border border-[#253247] rounded text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Equally divide 100% across all active stocks"
              >
                Equal Weight (1/N)
              </button>
              <button
                type="button"
                onClick={handleNormalize}
                className="px-2.5 py-1.5 bg-[#141A25] hover:bg-[#1B2332] border border-[#253247] rounded text-[#38BDF8] text-[11px] font-semibold transition-colors cursor-pointer"
                title="Scale all weights proportionally to 100%"
              >
                Normalize to 100%
              </button>
            </div>
          </div>
        </div>

        {/* 5. Constituent Stocks Table */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#080B10]">
          <div className="border border-[#1E2530] rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2530] bg-[#0E131C] text-[10px] text-slate-400 uppercase">
                  <th className="py-2 px-3 w-8">#</th>
                  <th className="py-2 px-3">Stock Ticker</th>
                  <th className="py-2 px-3">Weight (%)</th>
                  <th className="py-2 px-3 w-48">Weight Slider</th>
                  <th className="py-2 px-3 text-right">Allocated Value</th>
                  <th className="py-2 px-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2230] text-xs">
                {basket.map((item, idx) => (
                  <tr key={item.ticker} className="hover:bg-[#0F141E] transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-white font-mono">{item.ticker}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={item.weight}
                          onChange={(e) =>
                            handleWeightChange(item.ticker, parseFloat(e.target.value) || 0)
                          }
                          className="w-16 bg-[#131822] border border-[#252E3E] text-white text-xs px-2 py-1 rounded text-right font-mono focus:outline-none focus:border-[#38BDF8]"
                        />
                        <span className="text-slate-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={item.weight}
                        onChange={(e) =>
                          handleWeightChange(item.ticker, parseFloat(e.target.value) || 0)
                        }
                        className="w-full accent-[#38BDF8] cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">
                      {currSymbol}
                      {item.value.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveStock(item.ticker)}
                        className="p-1 rounded text-slate-500 hover:text-[#EF4444] hover:bg-[#1E2530] transition-colors cursor-pointer"
                        title={`Remove ${item.ticker}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Footer Total Weight & Apply Bar */}
        <div className="p-3 border-t border-[#1E2530] bg-[#0E131C] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-xs">Total Weight:</span>
              <span
                className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${
                  Math.abs(totalWeight - 100) < 0.1
                    ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                    : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                }`}
              >
                {totalWeight}%
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              Total Capital:{" "}
              <strong className="text-white font-mono">
                {currSymbol}
                {initialCapital.toLocaleString()}
              </strong>{" "}
              across {basket.length} stocks
            </div>

            {Math.abs(totalWeight - 100) >= 0.1 && (
              <button
                type="button"
                onClick={handleNormalize}
                className="text-[11px] text-[#38BDF8] hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Fix to 100%</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-[#202C3F] bg-[#111722] hover:bg-[#151D2A] text-slate-300 text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply &amp; Simulate Basket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
