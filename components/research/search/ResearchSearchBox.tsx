"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, ChevronDown, Check, X, Loader2 } from "lucide-react";
import { StockProfile } from "@/types";
import {
  MarketFilter,
  searchTickersUnified,
  navigateToResearchWorkspace,
} from "@/lib/tickerSearch";

export default function ResearchSearchBox() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<MarketFilter>("ALL");
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [results, setResults] = useState<StockProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const marketDropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted market preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_search_market") as MarketFilter;
      if (saved === "ALL" || saved === "India" || saved === "US") {
        setMarket(saved);
      }
    }
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (marketDropdownRef.current && !marketDropdownRef.current.contains(e.target as Node)) {
        setMarketDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchTickersUnified(query, market, 12);
        setResults(data);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [query, market, isOpen]);

  const handleSelectMarket = (m: MarketFilter) => {
    setMarket(m);
    setMarketDropdownOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("algolab_search_market", m);
    }
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const handleSelectSecurity = (stock: StockProfile) => {
    setIsOpen(false);
    navigateToResearchWorkspace(stock, router, market);
  };

  const handleSubmit = () => {
    if (selectedIndex >= 0 && results[selectedIndex]) {
      handleSelectSecurity(results[selectedIndex]);
      return;
    }

    if (results.length > 0 && query.trim()) {
      handleSelectSecurity(results[0]);
      return;
    }

    if (query.trim()) {
      navigateToResearchWorkspace(query.trim(), router, market);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const formatMarketCap = (mcap?: number | null, isIndia?: boolean) => {
    if (!mcap) return null;
    if (isIndia) {
      const cr = mcap / 1e7;
      return cr >= 1000 ? `₹${(mcap / 1e10).toFixed(1)}k Cr` : `₹${cr.toFixed(0)} Cr`;
    }
    if (mcap >= 1e12) return `$${(mcap / 1e12).toFixed(2)}T`;
    if (mcap >= 1e9) return `$${(mcap / 1e9).toFixed(1)}B`;
    if (mcap >= 1e6) return `$${(mcap / 1e6).toFixed(0)}M`;
    return `$${mcap.toLocaleString()}`;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Outer Glowing Search Bar Container */}
      <div
        className={`group relative flex items-center rounded-full border bg-[#0B1220]/95 p-1.5 shadow-[0_0_35px_rgba(56,189,248,0.14)] backdrop-blur-xl transition-all duration-300 ${
          isOpen
            ? "border-cyan-400 shadow-[0_0_50px_rgba(56,189,248,0.25)] ring-2 ring-cyan-500/20"
            : "border-slate-800/80 hover:border-cyan-500/50 hover:shadow-[0_0_40px_rgba(56,189,248,0.2)]"
        }`}
      >
        {/* Search Magnifying Glass Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center pl-2 text-slate-400 group-hover:text-cyan-400 transition-colors">
          <Search className="h-5 w-5" />
        </div>

        {/* Search Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search for a company, ticker or keyword..."
          className="h-11 w-full bg-transparent px-3 text-[14px] sm:text-[15px] font-medium text-white placeholder-slate-400 outline-none selection:bg-cyan-500/30"
        />

        {/* Clear query button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="mr-1 p-1 text-slate-400 hover:text-white transition-colors"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Market Selector Inside Search Bar */}
        <div ref={marketDropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMarketDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            title="Filter by Market"
          >
            <span>
              {market === "ALL" && "All Markets"}
              {market === "India" && "🇮🇳 India"}
              {market === "US" && "🇺🇸 US"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Market Dropdown Menu */}
          {marketDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-slate-700/80 bg-[#0B1528] py-1 shadow-2xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => handleSelectMarket("ALL")}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  market === "ALL"
                    ? "bg-cyan-500/15 text-cyan-400"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <span>All Markets</span>
                {market === "ALL" && <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelectMarket("India")}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  market === "India"
                    ? "bg-cyan-500/15 text-cyan-400"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🇮🇳</span>
                  <span>India (NSE/BSE)</span>
                </span>
                {market === "India" && <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleSelectMarket("US")}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  market === "US"
                    ? "bg-cyan-500/15 text-cyan-400"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🇺🇸</span>
                  <span>US (NYSE/NASDAQ)</span>
                </span>
                {market === "US" && <Check className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Submit Arrow Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-md transition-all hover:scale-105 hover:from-[#1D4ED8] hover:to-[#6D28D9] hover:shadow-cyan-500/25 active:scale-95"
          title="Start Research"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* ========================================================
          AUTOCOMPLETE SUGGESTIONS DROPDOWN
          ======================================================== */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0B1528]/95 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">
              {market === "India"
                ? "Indian Equities (NSE · BSE)"
                : market === "US"
                ? "US Equities & ETFs (NYSE · NASDAQ)"
                : "Global Instruments & Universe"}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              ↑↓ Navigate · ↵ Select · ESC Close
            </span>
          </div>

          <div className="max-h-80 divide-y divide-slate-800/60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                <span>Searching quantitative universe…</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <div>No securities matching &quot;{query}&quot;.</div>
                <div className="mt-1 text-[11px] text-cyan-400 font-medium">
                  Press Enter to analyze &quot;{query.toUpperCase()}&quot; directly in the Research
                  Workspace.
                </div>
              </div>
            ) : (
              results.map((stock, idx) => {
                const isSelected = idx === selectedIndex;
                const isIndia = stock.market === "India" || stock.currency === "INR";
                const mcap = formatMarketCap(stock.market_cap, isIndia);

                return (
                  <div
                    key={`${stock.market}-${stock.symbol}-${idx}`}
                    onClick={() => handleSelectSecurity(stock)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors ${
                      isSelected
                        ? "border-l-4 border-cyan-400 bg-cyan-950/30 text-white"
                        : "hover:bg-slate-800/40 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-20 shrink-0">
                        <span className="block text-sm font-bold tracking-wide text-white">
                          {stock.symbol}
                        </span>
                        <span className="block font-mono text-[10px] text-cyan-400/80">
                          {stock.exchange || (isIndia ? "NSE" : "US")}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <div className="truncate text-xs font-medium text-slate-200">
                          {stock.name}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {stock.sector || stock.market} ·{" "}
                          {isIndia ? "Indian Equity" : "US Equity"}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right font-mono">
                      {stock.price !== undefined && stock.price !== null && (
                        <div className="text-xs font-semibold tabular-nums text-white">
                          {isIndia ? "₹" : "$"}
                          {Number(stock.price).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      )}
                      {stock.change_1d !== undefined && stock.change_1d !== null && (
                        <div
                          className={`text-[10px] font-semibold tabular-nums ${
                            Number(stock.change_1d) >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {Number(stock.change_1d) >= 0 ? "+" : ""}
                          {Number(stock.change_1d).toFixed(2)}%
                        </div>
                      )}
                      {mcap && <div className="text-[9px] text-slate-500">{mcap}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 text-[10px] text-slate-500">
            <span>Powered by QuantSynthica Financial Engine</span>
            <span className="text-cyan-400">Direct Research Workspace Handoff</span>
          </div>
        </div>
      )}
    </div>
  );
}
