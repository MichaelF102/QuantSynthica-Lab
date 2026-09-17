"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Play,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { StrategyConfig, StockProfile } from "@/types";
import { api } from "@/lib/api";
import { BENCHMARKS } from "@/lib/constants";
import StockSearchInput from "@/components/ui/StockSearchInput";
import { formatCurrency, formatPercent } from "@/lib/formatters";

interface TestStrategyModalProps {
  strategy: StrategyConfig | null;
  isOpen: boolean;
  onClose: () => void;
  initialStock?: string;
  onSuccess?: (backtestId: string) => void;
}

export default function TestStrategyModal({
  strategy,
  isOpen,
  onClose,
  initialStock,
  onSuccess,
}: TestStrategyModalProps) {
  const router = useRouter();

  // Active country from localStorage or initialStock
  const [market, setMarket] = useState<"India" | "US">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_country");
      if (saved === "India" || saved === "US") return saved;
    }
    return "India";
  });

  // Selected Stock
  const [selectedStock, setSelectedStock] = useState<string>(() => {
    if (initialStock) return initialStock.toUpperCase();
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("algolab_active_ticker");
      if (active) return active.toUpperCase();
    }
    return strategy?.asset || "GENUSPOWER";
  });

  const [selectedProfile, setSelectedProfile] = useState<StockProfile | null>(null);

  // Date Range Presets
  const [datePreset, setDatePreset] = useState<"1Y" | "2Y" | "YTD" | "ALL">("1Y");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");

  // Benchmark
  const [benchmark, setBenchmark] = useState<string>("^NSEI");

  // Execution settings
  const [initialCapital, setInitialCapital] = useState<number>(1000000);
  const [positionSizePct, setPositionSizePct] = useState<number>(10);
  const [allowShort, setAllowShort] = useState<boolean>(false);

  // Execution Progress State
  const [status, setStatus] = useState<
    "IDLE" | "QUEUED" | "SIMULATING" | "CALCULATING" | "COMPLETE" | "ERROR"
  >("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-fill on open or strategy change
  useEffect(() => {
    if (isOpen && strategy) {
      // Determine default stock
      let stock = initialStock;
      if (!stock && typeof window !== "undefined") {
        stock = localStorage.getItem("algolab_active_ticker") || undefined;
      }
      if (!stock) {
        stock = market === "India" ? "GENUSPOWER" : strategy.asset || "AAPL";
      }
      setSelectedStock(stock.toUpperCase());

      // Auto-set capital & benchmark according to market
      const isInd =
        market === "India" ||
        stock.endsWith(".NS") ||
        stock.endsWith(".BO") ||
        ["GENUSPOWER", "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "TATAMOTORS", "SBIN"].includes(stock.toUpperCase());

      if (isInd) {
        setMarket("India");
        setBenchmark("^NSEI");
        setInitialCapital(1000000);
      } else {
        setMarket("US");
        setBenchmark("SPY");
        setInitialCapital(100000);
      }

      // 1-year default lookback
      const now = new Date();
      const endStr = now.toISOString().split("T")[0];
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      const startStr = start.toISOString().split("T")[0];
      setStartDate(startStr);
      setEndDate(endStr);
      setDatePreset("1Y");

      setStatus("IDLE");
      setErrorMessage(null);
    }
  }, [isOpen, strategy, initialStock]);

  // Handle market toggle
  const handleMarketToggle = (newMarket: "India" | "US") => {
    setMarket(newMarket);
    if (newMarket === "India") {
      setBenchmark("^NSEI");
      setInitialCapital(1000000);
      if (!selectedStock.endsWith(".NS") && !["GENUSPOWER", "RELIANCE", "TCS", "INFY"].includes(selectedStock)) {
        setSelectedStock("GENUSPOWER");
      }
    } else {
      setBenchmark("SPY");
      setInitialCapital(100000);
      if (["GENUSPOWER", "RELIANCE", "TCS", "INFY"].includes(selectedStock) || selectedStock.endsWith(".NS")) {
        setSelectedStock(strategy?.asset || "AAPL");
      }
    }
  };

  // Quick Date Preset handler
  const handlePresetChange = (preset: "1Y" | "2Y" | "YTD" | "ALL") => {
    setDatePreset(preset);
    const now = new Date();
    const endStr = now.toISOString().split("T")[0];
    const start = new Date(now);
    if (preset === "1Y") start.setFullYear(start.getFullYear() - 1);
    else if (preset === "2Y") start.setFullYear(start.getFullYear() - 2);
    else if (preset === "YTD") {
      start.setMonth(0);
      start.setDate(1);
    } else if (preset === "ALL") {
      start.setFullYear(2020);
      start.setMonth(0);
      start.setDate(1);
    }
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(endStr);
  };

  // Execute Backtest on Selected Stock
  const handleExecuteBacktest = async () => {
    if (!strategy) return;
    const ticker = selectedStock.trim().toUpperCase();
    if (!ticker) {
      setErrorMessage("Please specify a target stock symbol.");
      return;
    }

    setStatus("QUEUED");
    setErrorMessage(null);

    try {
      setTimeout(() => setStatus("SIMULATING"), 300);
      setTimeout(() => setStatus("CALCULATING"), 900);

      // Create cloned strategy targeted at the selected stock
      const customStrat: StrategyConfig = {
        ...strategy,
        asset: ticker,
        universe: [ticker],
        risk: {
          ...strategy.risk,
          position_size_pct: positionSizePct,
          allow_short: allowShort,
        },
        execution: {
          ...strategy.execution,
          initial_capital: initialCapital,
        },
      };

      const effectiveBenchmark = market === "India" && benchmark === "SPY" ? "^NSEI" : benchmark;

      const res = await api.runBacktest(
        customStrat,
        startDate,
        endDate,
        effectiveBenchmark
      );

      setStatus("COMPLETE");
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess(res.id);
        } else {
          router.push(`/backtests/${res.id}`);
        }
      }, 400);
    } catch (err: any) {
      setStatus("ERROR");
      setErrorMessage(err.message || "Simulation execution failed");
    }
  };

  if (!isOpen || !strategy) return null;

  const isIndiaMarket = market === "India";
  const sym = isIndiaMarket ? "₹" : "$";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-[#0E1218] border border-[#252E3E] rounded-[2px] shadow-2xl overflow-hidden font-mono text-xs flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-[#080B10] border-b border-[#1E2530] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-[2px] bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8]">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-[13px]">
                  Test Strategy on Custom Stock
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 uppercase">
                  {strategy.strategy_type || "Trend"}
                </span>
              </div>
              <span className="text-[10px] text-[#89919C]">
                Model: <span className="text-white font-bold">{strategy.name}</span> (Default: {strategy.asset})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#89919C] hover:text-white hover:bg-[#1A2230] rounded-[2px] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Market Selection Toggle */}
          <div>
            <label className="text-[10px] text-[#89919C] uppercase font-bold block mb-1.5">
              1. Choose Target Market
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMarketToggle("India")}
                className={`py-2 px-3 rounded-[2px] border flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  market === "India"
                    ? "bg-[#10B981]/15 border-[#10B981] text-white font-bold shadow-xs"
                    : "bg-[#0A0D14] border-[#1E2530] text-[#89919C] hover:text-white hover:bg-[#141A24]"
                }`}
              >
                <span className="text-base">🇮🇳</span>
                <div className="text-left">
                  <div className="leading-tight">India Equities</div>
                  <div className="text-[9px] text-[#89919C] font-normal">NSE / BSE &bull; ₹ INR</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleMarketToggle("US")}
                className={`py-2 px-3 rounded-[2px] border flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  market === "US"
                    ? "bg-[#38BDF8]/15 border-[#38BDF8] text-white font-bold shadow-xs"
                    : "bg-[#0A0D14] border-[#1E2530] text-[#89919C] hover:text-white hover:bg-[#141A24]"
                }`}
              >
                <span className="text-base">🇺🇸</span>
                <div className="text-left">
                  <div className="leading-tight">US Equities</div>
                  <div className="text-[9px] text-[#89919C] font-normal">NYSE / NASDAQ &bull; $ USD</div>
                </div>
              </button>
            </div>
          </div>

          {/* Stock Search & Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-[#89919C] uppercase font-bold">
                2. Select Security to Test ({isIndiaMarket ? "India ₹" : "US $"})
              </label>
              <span className="text-[10px] text-[#38BDF8] font-bold">
                Active: {selectedStock}
              </span>
            </div>

            {/* Custom Search Box */}
            <div className="space-y-1.5">
              <StockSearchInput
                value={selectedStock}
                onChange={(sym, prof) => {
                  setSelectedStock(sym);
                  if (prof) setSelectedProfile(prof);
                }}
                placeholder={isIndiaMarket ? "Search 2,500+ Indian stocks (e.g. GENUSPOWER, RELIANCE, TCS)..." : "Search 16,000+ US stocks (e.g. AAPL, NVDA, TSLA)..."}
              />

              {/* Quick Suggestion Chips */}
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pt-1">
                <span className="text-[9px] text-[#59616B] uppercase font-bold">Suggestions:</span>
                {(isIndiaMarket
                  ? ["GENUSPOWER", "RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "ICICIBANK"]
                  : ["AAPL", "NVDA", "TSLA", "MSFT", "SPY", "QQQ", "AMZN"]
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedStock(s)}
                    className={`px-1.5 py-0.5 rounded-[2px] border text-[9px] font-mono transition-colors cursor-pointer ${
                      selectedStock === s
                        ? isIndiaMarket
                          ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold"
                          : "bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8] font-bold"
                        : "bg-[#080B10] border-[#1E2530] text-[#89919C] hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lookback & Date Window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-[#89919C] uppercase font-bold">
                  3. Lookback Window
                </label>
                <div className="flex items-center space-x-1 text-[9px]">
                  {(["1Y", "2Y", "YTD", "ALL"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePresetChange(p)}
                      className={`px-1.5 py-0.2 rounded-[2px] transition-colors cursor-pointer ${
                        datePreset === p
                          ? "bg-[#0284C7] text-white font-bold"
                          : "text-[#89919C] hover:text-white bg-[#0A0D14]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 p-1.5 rounded-[2px] bg-[#0A0D14] border border-[#1E2530] text-[10px] text-white focus:outline-none focus:border-[#38BDF8]"
                />
                <span className="text-[#59616B]">&rarr;</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 p-1.5 rounded-[2px] bg-[#0A0D14] border border-[#1E2530] text-[10px] text-white focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#89919C] uppercase font-bold block mb-1.5">
                4. Benchmark for Alpha
              </label>
              <select
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="w-full p-1.5 rounded-[2px] bg-[#0A0D14] border border-[#1E2530] text-[11px] text-white focus:outline-none focus:border-[#38BDF8]"
              >
                {BENCHMARKS.map((b) => (
                  <option key={b.symbol} value={b.symbol}>
                    {b.symbol} - {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Capital & Position Sizing */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-[2px] bg-[#080B10] border border-[#1E2530]">
            <div>
              <label className="text-[10px] text-[#89919C] uppercase font-bold block mb-1">
                Initial Capital ({sym})
              </label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="w-full p-1 rounded-[2px] bg-[#0A0D14] border border-[#1E2530] text-xs font-mono font-bold text-white focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#89919C] uppercase font-bold block mb-1">
                Position Size (% of Capital)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={positionSizePct}
                  min={1}
                  max={100}
                  onChange={(e) => setPositionSizePct(Number(e.target.value))}
                  className="w-20 p-1 rounded-[2px] bg-[#0A0D14] border border-[#1E2530] text-xs font-mono font-bold text-white focus:outline-none focus:border-[#38BDF8]"
                />
                <span className="text-[10px] text-[#89919C]">% per trade</span>
              </div>
            </div>
          </div>

          {/* Execution Progress & Feedback */}
          {status !== "IDLE" && (
            <div className="p-3 rounded-[2px] border border-[#0284C7]/30 bg-[#0284C7]/10 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                  <span>
                    {status === "QUEUED" && "Queuing simulation task..."}
                    {status === "SIMULATING" && `Fetching OHLCV & executing rules on ${selectedStock}...`}
                    {status === "CALCULATING" && "Computing Sharpe, drawdown, & equity curve..."}
                    {status === "COMPLETE" && "Simulation completed! Redirecting..."}
                    {status === "ERROR" && "Execution error"}
                  </span>
                </span>
                <span className="text-[10px] text-[#38BDF8] font-mono">
                  {status}
                </span>
              </div>

              {errorMessage && (
                <div className="text-[11px] text-[#EF4444] flex items-center space-x-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#080B10] border-t border-[#1E2530] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(`/backtests?run=${strategy.id}&ticker=${encodeURIComponent(selectedStock)}`);
            }}
            className="text-[10px] text-[#89919C] hover:text-[#38BDF8] flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open in Backtest Studio</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={status === "SIMULATING" || status === "CALCULATING"}
              className="px-3 py-1.5 rounded-[2px] bg-[#141A24] hover:bg-[#1E2530] text-[#D8DCE2] border border-[#232B38] text-[11px] cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteBacktest}
              disabled={status === "SIMULATING" || status === "CALCULATING" || !selectedStock}
              className={`px-4 py-1.5 rounded-[2px] font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                isIndiaMarket
                  ? "bg-[#10B981] hover:bg-[#059669] text-black shadow-sm"
                  : "bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm"
              } disabled:opacity-50`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {status === "SIMULATING" || status === "CALCULATING"
                  ? "SIMULATING..."
                  : `Run on ${selectedStock}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
