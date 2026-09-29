"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Calendar,
  Filter,
  BarChart2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import {
  fetchOptionChain,
  OptionChainData,
  OptionContract,
  formatCurrencyValue,
  formatLargeVolume,
} from "@/lib/market/yahooFinance";

interface OptionsChainPreviewProps {
  initialSymbol?: string;
  onSelectUnderlying?: (symbol: string) => void;
}

const UNDERLYING_OPTIONS = [
  { symbol: "SPY", name: "S&P 500 ETF", flag: "🇺🇸" },
  { symbol: "QQQ", name: "Invesco Nasdaq ETF", flag: "🇺🇸" },
  { symbol: "AAPL", name: "Apple Inc.", flag: "🇺🇸" },
  { symbol: "NVDA", name: "NVIDIA Corporation", flag: "🇺🇸" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", flag: "🇮🇳" },
];

export default function OptionsChainPreview({
  initialSymbol = "SPY",
  onSelectUnderlying,
}: OptionsChainPreviewProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [selectedExpiration, setSelectedExpiration] = useState<string | undefined>(undefined);
  const [data, setData] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strikeRange, setStrikeRange] = useState<"near" | "all" | "5pct">("near");
  const [viewMode, setViewMode] = useState<"table" | "oi_chart">("table");

  // Load option chain
  const loadOptions = async (sym: string, exp?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOptionChain(sym, exp);
      setData(res);
      if (res.selectedExpiration && !selectedExpiration) {
        setSelectedExpiration(res.selectedExpiration);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load options chain");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions(selectedSymbol, selectedExpiration);
  }, [selectedSymbol, selectedExpiration]);

  const handleSymbolChange = (sym: string) => {
    setSelectedSymbol(sym);
    setSelectedExpiration(undefined);
    if (onSelectUnderlying) onSelectUnderlying(sym);
  };

  const underlyingPrice = data?.underlyingPrice || 0;

  // Filter strikes based on selected range
  const filteredContracts = useMemo(() => {
    if (!data?.available) return { calls: [], puts: [] };
    const { calls, puts } = data;
    if (strikeRange === "all" || underlyingPrice <= 0) {
      return { calls, puts };
    }

    const pct = strikeRange === "5pct" ? 0.05 : 0.08;
    const lowBound = underlyingPrice * (1 - pct);
    const highBound = underlyingPrice * (1 + pct);

    const fCalls = calls.filter((c) => c.strike >= lowBound && c.strike <= highBound);
    const fPuts = puts.filter((p) => p.strike >= lowBound && p.strike <= highBound);

    return {
      calls: fCalls.length > 0 ? fCalls : calls.slice(0, 15),
      puts: fPuts.length > 0 ? fPuts : puts.slice(0, 15),
    };
  }, [data, strikeRange, underlyingPrice]);

  // Combine calls and puts by strike for dual-side table
  const strikeRows = useMemo(() => {
    const map = new Map<number, { call?: OptionContract; put?: OptionContract }>();

    filteredContracts.calls.forEach((c) => {
      const entry = map.get(c.strike) || {};
      entry.call = c;
      map.set(c.strike, entry);
    });

    filteredContracts.puts.forEach((p) => {
      const entry = map.get(p.strike) || {};
      entry.put = p;
      map.set(p.strike, entry);
    });

    const sortedStrikes = Array.from(map.keys()).sort((a, b) => a - b);
    return sortedStrikes.map((s) => ({
      strike: s,
      call: map.get(s)?.call,
      put: map.get(s)?.put,
      isAtm: Math.abs(s - underlyingPrice) / (underlyingPrice || 1) < 0.008,
    }));
  }, [filteredContracts, underlyingPrice]);

  // Max Open Interest for bar scale
  const maxOi = useMemo(() => {
    let m = 1;
    strikeRows.forEach((r) => {
      if (r.call && r.call.openInterest > m) m = r.call.openInterest;
      if (r.put && r.put.openInterest > m) m = r.put.openInterest;
    });
    return m;
  }, [strikeRows]);

  return (
    <div className="flex h-full flex-col justify-between">
      {/* 1. TOP HEADER & UNDERLYING SELECTOR */}
      <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[17px] leading-none">🎯</span>
              <h3 className="font-bold text-[18px] sm:text-[20px] text-[#0B1220] dark:text-white tracking-tight">
                Options Chain
              </h3>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#1769FF] dark:text-blue-400">
                yfinance Derivatives Feed
              </span>
              <span className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {selectedSymbol.includes(".NS") ? "NSE F&O" : "CBOE / OPRA"}
              </span>
            </div>

            {/* Underlying Details */}
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[24px] sm:text-[28px] font-extrabold text-[#0B1220] dark:text-white tabular-nums">
                {underlyingPrice > 0
                  ? formatCurrencyValue(underlyingPrice, selectedSymbol.includes(".NS") ? "₹" : "$")
                  : "Loading..."}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Underlying: <strong className="text-slate-800 dark:text-slate-200">{selectedSymbol}</strong>
              </span>
            </div>
          </div>

          {/* Underlying Quick Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            {UNDERLYING_OPTIONS.map((item) => (
              <button
                key={item.symbol}
                onClick={() => handleSymbolChange(item.symbol)}
                className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition-all ${
                  selectedSymbol === item.symbol
                    ? "bg-[#1769FF] text-white shadow-xs shadow-blue-500/30"
                    : "border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{item.flag}</span> <span className="ml-1">{item.symbol.replace(".NS", "")}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Expiration Date Selector & View Toggles */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100/80 dark:border-slate-800/80">
          {/* Expiration Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              <span>Expiry:</span>
            </div>
            {data?.expirations && data.expirations.length > 0 ? (
              data.expirations.slice(0, 6).map((exp) => (
                <button
                  key={exp}
                  onClick={() => setSelectedExpiration(exp)}
                  className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    (selectedExpiration || data.selectedExpiration) === exp
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {exp}
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-400">None available</span>
            )}
          </div>

          {/* Controls: Strike Filter & Chart Toggle */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-0.5 text-[11px] font-semibold">
              <button
                onClick={() => setStrikeRange("near")}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  strikeRange === "near" ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 shadow-2xs" : "text-slate-500"
                }`}
              >
                Near ATM
              </button>
              <button
                onClick={() => setStrikeRange("5pct")}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  strikeRange === "5pct" ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 shadow-2xs" : "text-slate-500"
                }`}
              >
                ±5%
              </button>
              <button
                onClick={() => setStrikeRange("all")}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  strikeRange === "all" ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 shadow-2xs" : "text-slate-500"
                }`}
              >
                All
              </button>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-0.5 text-[11px] font-semibold">
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  viewMode === "table" ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 shadow-2xs" : "text-slate-500"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("oi_chart")}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  viewMode === "oi_chart" ? "bg-white dark:bg-slate-800 text-[#1769FF] dark:text-blue-400 shadow-2xs" : "text-slate-500"
                }`}
              >
                OI Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="relative my-3 flex-1 min-h-[320px]">
        {loading ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-[#1769FF]" />
            <span className="text-xs font-mono text-slate-500">Fetching live option chain from Yahoo Finance...</span>
          </div>
        ) : error || !data?.available ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-500 mb-3">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Options Data Unavailable
            </h4>
            <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {data?.reason || "Options data unavailable for this instrument through Yahoo Finance."}
            </p>
            <button
              onClick={() => handleSymbolChange("SPY")}
              className="mt-4 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              Switch to SPY Options
            </button>
          </div>
        ) : viewMode === "oi_chart" ? (
          /* Open Interest & IV Profile Chart */
          <div className="h-full flex flex-col justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-3 font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  Calls Open Interest
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                  Puts Open Interest
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">Underlying: ${underlyingPrice}</span>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {strikeRows.map((row) => {
                const callOi = row.call?.openInterest || 0;
                const putOi = row.put?.openInterest || 0;
                const callPct = (callOi / maxOi) * 100;
                const putPct = (putOi / maxOi) * 100;

                return (
                  <div
                    key={row.strike}
                    className={`flex items-center gap-2 py-1 px-2 rounded font-mono text-[11px] ${
                      row.isAtm ? "bg-blue-500/10 border border-blue-500/30" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Call Bar (Left) */}
                    <div className="flex-1 flex justify-end items-center gap-2">
                      <span className="text-[10px] text-slate-400">{formatLargeVolume(callOi)}</span>
                      <div className="h-2.5 bg-emerald-500/80 rounded-l" style={{ width: `${Math.max(2, callPct)}%` }} />
                    </div>

                    {/* Strike (Center) */}
                    <span className={`w-14 text-center font-bold ${row.isAtm ? "text-blue-500 font-extrabold" : "text-slate-800 dark:text-slate-200"}`}>
                      ${row.strike}
                    </span>

                    {/* Put Bar (Right) */}
                    <div className="flex-1 flex justify-start items-center gap-2">
                      <div className="h-2.5 bg-rose-500/80 rounded-r" style={{ width: `${Math.max(2, putPct)}%` }} />
                      <span className="text-[10px] text-slate-400">{formatLargeVolume(putOi)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Dual-Sided Calls vs Puts Table */
          <div className="overflow-x-auto max-h-[320px] rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider backdrop-blur-xs">
                <tr>
                  <th className="py-2 px-2 text-emerald-600 dark:text-emerald-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    CALLS (Bid / Ask)
                  </th>
                  <th className="py-2 px-2 text-right border-b border-slate-200 dark:border-slate-800">Last</th>
                  <th className="py-2 px-2 text-right border-b border-slate-200 dark:border-slate-800">IV%</th>
                  <th className="py-2 px-2 text-right border-b border-slate-200 dark:border-slate-800">OI</th>
                  <th className="py-2 px-3 text-center bg-blue-50/80 dark:bg-blue-950/40 font-bold text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800">
                    STRIKE
                  </th>
                  <th className="py-2 px-2 text-rose-600 dark:text-rose-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    PUTS (Bid / Ask)
                  </th>
                  <th className="py-2 px-2 text-right border-b border-slate-200 dark:border-slate-800">Last</th>
                  <th className="py-2 px-2 text-right border-b border-slate-200 dark:border-slate-800">IV%</th>
                  <th className="py-2 px-2 text-right border-b border-slate-200 dark:border-slate-800">OI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {strikeRows.map((row) => {
                  const call = row.call;
                  const put = row.put;

                  return (
                    <tr
                      key={row.strike}
                      className={`transition-colors ${
                        row.isAtm
                          ? "bg-blue-500/10 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Call Bid / Ask */}
                      <td className="py-1.5 px-2">
                        <span className={`inline-block mr-1 text-[9px] px-1 rounded ${call?.inTheMoney ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                          {call?.inTheMoney ? "ITM" : "OTM"}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {call ? `${call.bid.toFixed(2)} / ${call.ask.toFixed(2)}` : "—"}
                        </span>
                      </td>

                      {/* Call Last */}
                      <td className="py-1.5 px-2 text-right font-bold text-slate-900 dark:text-white">
                        {call ? `$${call.lastPrice.toFixed(2)}` : "—"}
                      </td>

                      {/* Call IV */}
                      <td className="py-1.5 px-2 text-right text-slate-500 dark:text-slate-400">
                        {call ? `${call.impliedVolatility.toFixed(1)}%` : "—"}
                      </td>

                      {/* Call OI */}
                      <td className="py-1.5 px-2 text-right text-slate-600 dark:text-slate-300">
                        {call ? formatLargeVolume(call.openInterest) : "—"}
                      </td>

                      {/* Strike */}
                      <td className="py-1.5 px-3 text-center bg-blue-50/50 dark:bg-blue-950/20 font-bold text-slate-900 dark:text-white">
                        ${row.strike.toFixed(2)}
                      </td>

                      {/* Put Bid / Ask */}
                      <td className="py-1.5 px-2">
                        <span className={`inline-block mr-1 text-[9px] px-1 rounded ${put?.inTheMoney ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
                          {put?.inTheMoney ? "ITM" : "OTM"}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {put ? `${put.bid.toFixed(2)} / ${put.ask.toFixed(2)}` : "—"}
                        </span>
                      </td>

                      {/* Put Last */}
                      <td className="py-1.5 px-2 text-right font-bold text-slate-900 dark:text-white">
                        {put ? `$${put.lastPrice.toFixed(2)}` : "—"}
                      </td>

                      {/* Put IV */}
                      <td className="py-1.5 px-2 text-right text-slate-500 dark:text-slate-400">
                        {put ? `${put.impliedVolatility.toFixed(1)}%` : "—"}
                      </td>

                      {/* Put OI */}
                      <td className="py-1.5 px-2 text-right text-slate-600 dark:text-slate-300">
                        {put ? formatLargeVolume(put.openInterest) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. FOOTER STATUS BAR */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time yfinance OPRA Option Chain</span>
        </div>
        <div className="flex items-center gap-3">
          <span>ATM: Green / Red highlights indicate ITM / OTM</span>
          <span>Expiry: {selectedExpiration || data?.selectedExpiration || "Nearest"}</span>
        </div>
      </div>
    </div>
  );
}
