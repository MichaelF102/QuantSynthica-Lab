"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { StockProfile } from "@/types";

type MarketCountry = "US" | "India";

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

  // Initialize active country & symbol from storage / settings / URL
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
      const urlCountry = params.get("country");
      if (urlCountry === "India" || urlCountry === "US") {
        setCountry(urlCountry as MarketCountry);
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

    const handleExternalCountryChange = (e: any) => {
      if (e.detail?.country && (e.detail.country === "US" || e.detail.country === "India")) {
        setCountry(e.detail.country);
      }
    };

    window.addEventListener("algolab:security-change", handleExternalSecurityChange);
    window.addEventListener("algolab:country-change", handleExternalCountryChange);
    return () => {
      window.removeEventListener("algolab:security-change", handleExternalSecurityChange);
      window.removeEventListener("algolab:country-change", handleExternalCountryChange);
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
      // Already on research page, update URL with both ticker & country
      const url = new URL(window.location.href);
      url.searchParams.set("ticker", sym);
      url.searchParams.set("country", stockCountry);
      window.history.pushState(null, "", url.toString());
    } else {
      // Navigate to research page
      router.push(`/research?ticker=${encodeURIComponent(sym)}&country=${encodeURIComponent(stockCountry)}`);
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
    <div ref={containerRef} className="flex items-center gap-2">
      {/* Security Searchbar (Moved to the left) */}
      <div className="relative w-44 sm:w-56 md:w-64 lg:w-72 xl:w-80">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
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
                ? "Search NSE/BSE (e.g. RELIANCE)..."
                : "Search US (e.g. AAPL, NVDA)..."
            }
            className="h-8 w-full rounded-lg border border-border bg-[#131722] py-1 pl-8 pr-16 text-[12px] text-[#d1d4dc] placeholder-[#787b86] outline-none transition-colors focus:border-[#2962FF] sm:text-[13px] sm:pr-20"
          />

          {/* Right badges: clear X or active symbol badge + '/' shortcut */}
          <div className="absolute right-1.5 flex items-center gap-1">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="p-1 text-slate-400 transition-colors hover:text-white"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            ) : activeSymbol ? (
              <span
                className="rounded border border-border/80 bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-amber shadow-2xs"
                title={`Active security: ${activeSymbol}`}
              >
                {activeSymbol}
              </span>
            ) : (
              <span className="rounded border border-border/80 bg-surface-muted px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                /
              </span>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown - aligned to left-0 */}
        {isOpen && (
          <div className="absolute left-0 z-50 mt-1.5 flex w-80 sm:w-96 max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-lg border border-border bg-surface-elevated/95 font-mono text-xs shadow-panel backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border bg-background/60 px-3 py-1.5 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-stone-200">
                  {country === "India" ? "India (NSE / BSE)" : "United States (NYSE / NASDAQ)"}
                </span>
              </div>
              <span className="text-[9px] text-slate-500">↑↓ navigate · ↵ select</span>
            </div>

            <div className="max-h-80 divide-y divide-border/60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <span className="text-stone-400">Searching securities…</span>
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching securities found for &quot;{query}&quot;.
                  <div className="mt-1 text-[10px] text-slate-500">
                    Press Enter to load ticker directly.
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
                      className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
                        isSelected
                          ? "border-l-2 border-brand-amber bg-surface-hover"
                          : "hover:bg-surface-hover/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-16 shrink-0">
                          <span className="block text-sm font-bold text-slate-100">
                            {stock.symbol}
                          </span>
                          <span className="block text-[9px] text-stone-500">
                            {stock.exchange || (isIndia ? "NSE" : "US")}
                          </span>
                        </div>
                        <div className="overflow-hidden">
                          <div className="max-w-[150px] truncate text-[11px] text-slate-200 sm:max-w-[180px]">
                            {stock.name}
                          </div>
                          <div className="max-w-[150px] truncate text-[10px] text-slate-500">
                            {stock.sector || stock.market}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right font-mono">
                        {stock.price !== undefined && stock.price !== null && (
                          <div className="text-xs font-semibold tabular-nums text-slate-100">
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
                              Number(stock.change_1d) >= 0 ? "text-market-up" : "text-market-down"
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

            <div className="flex items-center justify-between border-t border-border bg-background/50 px-3 py-1.5 text-[9px] text-slate-500">
              <span>Search across 18,500+ securities</span>
              <span className="text-slate-400">ESC to close</span>
            </div>
          </div>
        )}
      </div>

      {/* Country Selector: US / INDIA (Moved to the right) */}
      <div className="flex shrink-0 items-center rounded-lg border border-border bg-[#131722] p-0.5 text-[11px] select-none">
        <button
          type="button"
          onClick={() => handleCountryChange("US")}
          className={`flex items-center gap-1 rounded px-2 py-0.5 transition-all ${
            country === "US"
              ? "bg-surface-active font-semibold text-brand-amber"
              : "text-stone-500 hover:text-stone-200"
          }`}
          title="Filter US Equities (NYSE, NASDAQ)"
        >
          <span className="text-[11px] leading-none">🇺🇸</span>
          <span>US</span>
        </button>
        <button
          type="button"
          onClick={() => handleCountryChange("India")}
          className={`flex items-center gap-1 rounded px-2 py-0.5 transition-all ${
            country === "India"
              ? "bg-surface-active font-semibold text-brand-amber"
              : "text-stone-500 hover:text-stone-200"
          }`}
          title="Filter Indian Equities (NSE, BSE)"
        >
          <span className="text-[11px] leading-none">🇮🇳</span>
          <span>INDIA</span>
        </button>
      </div>
    </div>
  );
}
