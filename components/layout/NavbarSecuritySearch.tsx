"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { api } from "@/lib/api";
import { StockProfile } from "@/types";

export type MarketCountry = "US" | "India";

export default function NavbarSecuritySearch() {
  const router = useRouter();
  const pathname = usePathname();

  const [country, setCountry] = useState<MarketCountry>("US");
  const [query, setQuery] = useState("");
  const [activeSymbol, setActiveSymbol] = useState("");
  const [results, setResults] = useState<StockProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize active country & symbol from storage / settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCountry = localStorage.getItem("algolab_active_country") as MarketCountry;
      if (savedCountry === "US" || savedCountry === "India") {
        setCountry(savedCountry);
      }
      const savedTicker = localStorage.getItem("algolab_active_ticker");
      if (savedTicker) {
        setActiveSymbol(savedTicker);
      }

      // Check URL params if on research
      const params = new URLSearchParams(window.location.search);
      const urlTicker = params.get("ticker");
      if (urlTicker) {
        setActiveSymbol(urlTicker.toUpperCase());
      }
    }

    const handleExternalSecurityChange = (e: any) => {
      if (e.detail?.symbol) {
        setActiveSymbol(e.detail.symbol.toUpperCase());
      }
      if (e.detail?.country && (e.detail.country === "US" || e.detail.country === "India")) {
        setCountry(e.detail.country);
      }
    };

    window.addEventListener("algolab:security-change", handleExternalSecurityChange);
    return () => {
      window.removeEventListener("algolab:security-change", handleExternalSecurityChange);
    };
  }, []);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
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
        const data = await api.searchTickers({
          query: query.trim() || undefined,
          market: country,
          limit: 20,
        });
        setResults(data);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Navbar security search error:", err);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, country, isOpen]);

  const handleCountryChange = (newCountry: MarketCountry) => {
    setCountry(newCountry);
    if (typeof window !== "undefined") {
      localStorage.setItem("algolab_active_country", newCountry);
      window.dispatchEvent(
        new CustomEvent("algolab:country-change", { detail: { country: newCountry } })
      );
    }

    // If currently viewing a stock from the other country, switch to representative flagship stock
    if (
      newCountry === "India" &&
      (activeSymbol === "AAPL" || activeSymbol === "SPY" || activeSymbol === "NVDA" || activeSymbol === "MSFT")
    ) {
      handleSelectSecurity({
        symbol: "RELIANCE",
        yf_symbol: "RELIANCE.NS",
        name: "Reliance Industries Limited",
        market: "India",
        exchange: "NSE",
        currency: "INR",
        price: 1290.9,
      });
      return;
    } else if (
      newCountry === "US" &&
      (activeSymbol === "RELIANCE" || activeSymbol === "GENUSPOWER" || activeSymbol === "TCS" || activeSymbol === "INFY")
    ) {
      handleSelectSecurity({
        symbol: "AAPL",
        yf_symbol: "AAPL",
        name: "Apple Inc.",
        market: "US",
        exchange: "NASDAQ",
        currency: "USD",
        price: 306.13,
      });
      return;
    }

    // Re-focus input and refresh search results
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const handleSelectSecurity = (stock: StockProfile) => {
    const sym = stock.symbol.toUpperCase();
    const stockCountry: MarketCountry =
      stock.market === "India" || stock.currency === "INR" ? "India" : "US";

    setCountry(stockCountry);
    setActiveSymbol(sym);
    setQuery("");
    setIsOpen(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("algolab_active_ticker", sym);
      localStorage.setItem("algolab_active_country", stockCountry);
      window.dispatchEvent(
        new CustomEvent("algolab:country-change", { detail: { country: stockCountry } })
      );
      window.dispatchEvent(
        new CustomEvent("algolab:security-change", {
          detail: {
            symbol: sym,
            yf_symbol: stock.yf_symbol,
            stock,
            country: stockCountry,
          },
        })
      );
    }

    if (pathname.startsWith("/research")) {
      // Already on research page, update URL without full reload
      const url = new URL(window.location.href);
      url.searchParams.set("ticker", sym);
      window.history.pushState(null, "", url.toString());
    } else {
      // Navigate to research page
      router.push(`/research?ticker=${encodeURIComponent(sym)}`);
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
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectSecurity(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelectSecurity(results[0]);
      } else if (query.trim()) {
        // Fallback custom ticker
        const sym = query.trim().toUpperCase();
        handleSelectSecurity({
          symbol: sym,
          yf_symbol: sym,
          name: sym,
          market: country === "India" ? "India" : "US",
          exchange: country === "India" ? "NSE" : "US",
        });
      }
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
    <div ref={containerRef} className="flex items-center space-x-2">
      {/* Country Selector: US / INDIA */}
      <div className="flex items-center rounded bg-[#0A0D13] border border-[#212836] p-0.5 font-mono text-[10px] select-none">
        <button
          type="button"
          onClick={() => handleCountryChange("US")}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-all ${
            country === "US"
              ? "bg-[#1E293B] text-[#38BDF8] font-bold shadow-sm"
              : "text-[#89919C] hover:text-[#D8DCE2]"
          }`}
          title="Filter US Equities (NYSE, NASDAQ)"
        >
          <span className="text-[11px] leading-none">🇺🇸</span>
          <span>US</span>
        </button>
        <button
          type="button"
          onClick={() => handleCountryChange("India")}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-all ${
            country === "India"
              ? "bg-[#1E293B] text-[#38BDF8] font-bold shadow-sm"
              : "text-[#89919C] hover:text-[#D8DCE2]"
          }`}
          title="Filter Indian Equities (NSE, BSE)"
        >
          <span className="text-[11px] leading-none">🇮🇳</span>
          <span>INDIA</span>
        </button>
      </div>

      {/* Security Searchbar */}
      <div className="relative w-44 sm:w-56 md:w-64 lg:w-72">
        <div className="relative flex items-center">
          <Search className="h-3 w-3 absolute left-2 text-[#59616B] pointer-events-none" />
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
            placeholder={
              country === "India"
                ? activeSymbol ? `${activeSymbol} (NSE/BSE)...` : "Search India (RELIANCE, TCS)..."
                : activeSymbol ? `${activeSymbol} (US)...` : "Search US (AAPL, NVDA)..."
            }
            className="w-full pl-7 pr-12 py-1 h-7 rounded bg-[#0A0D13] border border-[#212836] text-[11px] font-mono text-[#D8DCE2] placeholder-[#59616B] focus:outline-none focus:border-[#38BDF8] focus:bg-[#0E131C] transition-colors"
          />

          {/* Right badges: clear X or active symbol + '/' key */}
          <div className="absolute right-1.5 flex items-center space-x-1">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="p-0.5 text-[#59616B] hover:text-[#D8DCE2] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            ) : activeSymbol ? (
              <span className="text-[9px] font-mono font-semibold text-[#38BDF8] bg-[#141A24] px-1 py-0.2 rounded border border-[#252E3E]">
                {activeSymbol}
              </span>
            ) : (
              <span className="text-[9px] font-mono text-[#59616B] border border-[#212836] px-1 py-0.2 rounded bg-[#0A0D13]">
                /
              </span>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded border border-[#252E3E] bg-[#0E131C] overflow-hidden shadow-2xl z-50 flex flex-col font-mono text-xs">
            {/* Dropdown Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#212836] bg-[#0A0D13] text-[10px] text-[#89919C]">
              <div className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                <span className="font-semibold text-[#D8DCE2]">
                  {country === "India" ? "INDIA UNIVERSE" : "US UNIVERSE"}
                </span>
                <span className="text-[#59616B]">
                  ({country === "India" ? "7,610 EQUITIES" : "10,936 EQUITIES"})
                </span>
              </div>
              <span className="text-[9px] text-[#59616B]">↑↓ to navigate • ↵ select</span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[#1E2530]">
              {loading ? (
                <div className="p-4 text-center text-[#89919C] text-xs">
                  <span className="inline-block animate-pulse text-[#38BDF8]">
                    Scanning universe...
                  </span>
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-[#89919C] text-xs">
                  No matching securities found for &quot;{query}&quot;.
                  <div className="mt-1 text-[10px] text-[#59616B]">
                    Press Enter to load symbol directly.
                  </div>
                </div>
              ) : (
                results.map((stock, idx) => {
                  const isSelected = idx === selectedIndex || stock.symbol === activeSymbol;
                  const isIndia = stock.market === "India" || stock.currency === "INR";
                  const mcap = formatMarketCap(stock.market_cap, isIndia);

                  return (
                    <div
                      key={`${stock.market}-${stock.symbol}-${stock.exchange || idx}`}
                      onClick={() => handleSelectSecurity(stock)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#141A24] border-l-2 border-[#38BDF8]"
                          : "hover:bg-[#141A24]/60"
                      }`}
                    >
                      {/* Left: Symbol & Name */}
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className="w-16 shrink-0">
                          <span className="font-bold text-sm text-[#D8DCE2] block">
                            {stock.symbol}
                          </span>
                          <span className="text-[9px] text-[#38BDF8] uppercase tracking-wider block">
                            {stock.exchange || (isIndia ? "NSE" : "US")}
                          </span>
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[11px] text-[#D8DCE2] truncate max-w-[150px] sm:max-w-[180px]">
                            {stock.name}
                          </div>
                          <div className="text-[10px] text-[#59616B] truncate max-w-[150px]">
                            {stock.sector || stock.market}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price, Change %, Market Cap */}
                      <div className="text-right shrink-0 font-mono">
                        {stock.price !== undefined && stock.price !== null && (
                          <div className="text-xs font-semibold text-[#D8DCE2]">
                            {isIndia ? "₹" : "$"}
                            {Number(stock.price).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
                        {mcap && <div className="text-[9px] text-[#59616B]">{mcap}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="px-3 py-1 bg-[#0A0D13] border-t border-[#212836] flex items-center justify-between text-[9px] text-[#59616B]">
              <span>Search across 18,500+ securities</span>
              <span className="text-[#89919C]">ESC to close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
