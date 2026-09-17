"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { StockProfile } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface StockSearchInputProps {
  value: string;
  onChange: (symbol: string, profile?: StockProfile) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function StockSearchInput({
  value,
  onChange,
  placeholder = "Search 18,500+ US & Indian stocks...",
  className = "",
  id = "stock-search-input",
}: StockSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [market, setMarket] = useState<"ALL" | "US" | "India">("ALL");
  const [results, setResults] = useState<StockProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchTickers({
          query: query.trim(),
          market: market !== "ALL" ? market : undefined,
          limit: 25,
        });
        setResults(data);
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, market, isOpen]);

  const handleSelect = (stock: StockProfile) => {
    setQuery(stock.symbol);
    setIsOpen(false);
    onChange(stock.symbol, stock);
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
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="h-3 w-3 absolute left-2 text-[#59616B] pointer-events-none" />
        <input
          id={id}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setQuery(val);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (results.length > 0) {
                handleSelect(results[0]);
              } else if (query.trim()) {
                onChange(query.trim());
                setIsOpen(false);
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-7 pr-12 py-1 rounded-[2px] border border-[#252A31] bg-[#101318] text-xs font-mono text-[#D8DCE2] placeholder-[#59616B] focus:outline-none focus:border-[#38BDF8]"
        />
        <div className="absolute right-1.5 flex items-center space-x-1">
          {value && (
            <span className="text-[10px] font-mono text-[#89919C] bg-[#141820] px-1 py-0.2 rounded-[2px] border border-[#252A31]">
              {value}
            </span>
          )}
          <span className="text-[9px] font-mono text-[#59616B] border border-[#252A31] px-1 py-0.2 rounded-[2px]">
            /
          </span>
        </div>
      </div>

      {/* Autocomplete dropdown - flat terminal style */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-[2px] border border-[#252A31] bg-[#101318] overflow-hidden max-h-96 flex flex-col font-mono text-xs">
          {/* Market filter tabs */}
          <div className="flex border-b border-[#252A31] bg-[#141820] text-[10px]">
            <button
              type="button"
              onClick={() => setMarket("ALL")}
              className={`flex-1 py-1 text-center border-r border-[#252A31] transition-colors ${
                market === "ALL"
                  ? "bg-[#101318] text-[#38BDF8] font-bold"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              ALL (18.5k)
            </button>
            <button
              type="button"
              onClick={() => setMarket("US")}
              className={`flex-1 py-1 text-center border-r border-[#252A31] transition-colors ${
                market === "US"
                  ? "bg-[#101318] text-[#38BDF8] font-bold"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              US (10.9k)
            </button>
            <button
              type="button"
              onClick={() => setMarket("India")}
              className={`flex-1 py-1 text-center transition-colors ${
                market === "India"
                  ? "bg-[#101318] text-[#38BDF8] font-bold"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              INDIA (7.6k)
            </button>
          </div>

          {/* Results list */}
          <div className="overflow-y-auto divide-y divide-[#252A31]/50 flex-1">
            {loading ? (
              <div className="p-3 text-center text-[#89919C] text-xs">
                Querying security universe...
              </div>
            ) : results.length === 0 ? (
              <div className="p-3 text-center text-[#89919C] text-xs">
                No security matched &quot;{query}&quot;. Press Enter to query symbol.
              </div>
            ) : (
              results.map((stock) => {
                const isSelected = stock.symbol === value;
                const isIndia = stock.market === "India" || stock.currency === "INR";
                const mcapFormatted = formatMarketCap(stock.market_cap, isIndia);

                return (
                  <div
                    key={`${stock.market}-${stock.symbol}`}
                    onClick={() => handleSelect(stock)}
                    className={`flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-[#141820] transition-colors text-xs ${
                      isSelected ? "bg-[#141820] border-l-2 border-[#38BDF8]" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <span className="font-bold text-[#D8DCE2] w-16 shrink-0">
                        {stock.symbol}
                      </span>
                      <div className="overflow-hidden">
                        <div className="text-[11px] text-[#89919C] truncate max-w-[170px]">
                          {stock.name}
                        </div>
                        <div className="text-[10px] text-[#59616B] flex items-center space-x-1.5">
                          <span>{stock.exchange}</span>
                          {stock.sector && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate max-w-[110px]">{stock.sector}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px]">
                      {stock.price !== undefined && stock.price !== null && (
                        <div className="text-[#D8DCE2] font-semibold">
                          {isIndia ? "₹" : "$"}
                          {Number(stock.price).toFixed(2)}
                        </div>
                      )}
                      {stock.change_1d !== undefined && stock.change_1d !== null && (
                        <div
                          className={`text-[10px] font-bold ${
                            Number(stock.change_1d) >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                          }`}
                        >
                          {Number(stock.change_1d) >= 0 ? "+" : ""}
                          {Number(stock.change_1d).toFixed(2)}%
                        </div>
                      )}
                      {mcapFormatted && (
                        <div className="text-[9px] text-[#59616B]">{mcapFormatted}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
