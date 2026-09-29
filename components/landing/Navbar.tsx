"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, X, Sun, Moon } from "lucide-react";
import { api } from "@/lib/api";
import { StockProfile } from "@/types";
import { useTheme } from "@/components/providers/ThemeProvider";
import QuantSynthicaLogo from "@/components/branding/QuantSynthicaLogo";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Charts", href: "/research" },
  { label: "Strategies", href: "/strategies" },
  { label: "Backtests", href: "/backtests" },
  { label: "Analytics", href: "/analytics" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Risk", href: "/risk" },
  { label: "Research", href: "/research" },
  { label: "Resources", href: "#features" },
];

export default function LandingNavbar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [activeMarket, setActiveMarket] = useState<"US" | "India">("US");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<StockProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_country") as "US" | "India";
      if (saved === "US" || saved === "India") {
        setActiveMarket(saved);
      }
    }
  }, []);

  const handleMarketChange = (market: "US" | "India") => {
    setActiveMarket(market);
    if (typeof window !== "undefined") {
      localStorage.setItem("algolab_active_country", market);
      window.dispatchEvent(
        new CustomEvent("algolab:country-change", { detail: { country: market } })
      );
    }
  };

  // Keyboard shortcut '/'
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
        searchInputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchTickers({
          query: query.trim(),
          market: activeMarket,
          limit: 8,
        });
        setResults(data);
      } catch (err) {
        console.error("Landing navbar search error:", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, activeMarket, isOpen]);

  const handleSelectSecurity = (symbol: string) => {
    setIsOpen(false);
    setQuery("");
    if (typeof window !== "undefined") {
      localStorage.setItem("algolab_active_ticker", symbol.toUpperCase());
    }
    router.push(`/research?ticker=${encodeURIComponent(symbol.toUpperCase())}&country=${activeMarket}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (results.length > 0) {
        handleSelectSecurity(results[0].symbol);
      } else if (query.trim()) {
        handleSelectSecurity(query.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-[#070D18]/90">
      <div className="mx-auto flex h-16 max-w-[1520px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-7">
          <QuantSynthicaLogo variant="compact" size="default" priority />

          {/* Center Navigation Links */}
          <nav className="hidden items-center gap-1 xl:flex">
            {NAV_ITEMS.map((item) => {
              const isHome = item.label === "Home";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative px-3 py-1.5 text-[14px] transition-colors ${
                    isHome
                      ? "font-semibold text-[#1769FF]"
                      : "font-medium text-[#526174] hover:text-[#0B1220] dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                  {isHome && (
                    <span className="absolute bottom-[-17px] left-3 right-3 h-[2.5px] rounded-full bg-[#1769FF]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls: Search, Market Selector, Theme Toggle, Open Lab Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Universal Search Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block w-60 lg:w-72">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search tickers, indicators, or tools..."
                className="h-9 w-full rounded-lg border border-slate-200/90 bg-slate-50/70 py-1 pl-9 pr-8 text-[13px] text-[#0B1220] placeholder-slate-400 outline-none transition-all focus:border-[#1769FF] focus:bg-white focus:ring-1 focus:ring-[#1769FF]/20 dark:border-slate-800 dark:bg-[#0B1528] dark:text-white dark:placeholder-slate-500 dark:focus:border-[#1769FF] dark:focus:bg-[#0E1A33]"
              />
              <div className="absolute right-2 flex items-center">
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 shadow-2xs dark:border-slate-750 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Autocomplete dropdown */}
            {isOpen && (
              <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl dark:border-slate-800 dark:bg-[#0B1528]">
                {loading ? (
                  <div className="p-3 text-center text-slate-400">Searching markets...</div>
                ) : results.length > 0 ? (
                  results.map((r) => (
                    <div
                      key={r.symbol}
                      onClick={() => handleSelectSecurity(r.symbol)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <div>
                        <span className="font-bold text-[#0B1220] dark:text-white">{r.symbol}</span>
                        <span className="ml-2 text-slate-500 dark:text-slate-400">{r.name}</span>
                      </div>
                      <span className="font-mono text-slate-400">{r.exchange || activeMarket}</span>
                    </div>
                  ))
                ) : query.trim() ? (
                  <div
                    onClick={() => handleSelectSecurity(query.trim())}
                    className="cursor-pointer p-2.5 text-center text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/70"
                  >
                    Load &quot;{query.trim().toUpperCase()}&quot; in charts ↵
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Market Country Selector: US / INDIA */}
          <div className="flex items-center rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5 text-[12px] dark:border-slate-800 dark:bg-[#0B1528]">
            <button
              type="button"
              onClick={() => handleMarketChange("US")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                activeMarket === "US"
                  ? "bg-white font-semibold text-[#0B1220] shadow-xs dark:bg-slate-800 dark:text-white"
                  : "text-[#526174] hover:text-[#0B1220] dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span className="text-[12px] leading-none">🇺🇸</span>
              <span>US</span>
            </button>
            <button
              type="button"
              onClick={() => handleMarketChange("India")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                activeMarket === "India"
                  ? "bg-white font-semibold text-[#0B1220] shadow-xs dark:bg-slate-800 dark:text-white"
                  : "text-[#526174] hover:text-[#0B1220] dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span className="text-[12px] leading-none">🇮🇳</span>
              <span>INDIA</span>
            </button>
          </div>

          {/* Theme Toggle Button (Light / Dark Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50/80 text-slate-600 shadow-2xs transition-all hover:border-slate-300 hover:bg-white hover:text-[#0B1220] active:scale-95 dark:border-slate-800 dark:bg-[#0B1528] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Enter Lab Button */}
          <Link
            href="/research"
            className="flex items-center gap-1.5 rounded-lg bg-[#0B1220] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow dark:bg-[#1769FF] dark:hover:bg-[#1258db]"
          >
            <span>Open Lab</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
