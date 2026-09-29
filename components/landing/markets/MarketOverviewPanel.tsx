"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MarketCategoryId } from "./MarketCategoryTabs";
import MarketChartPreview from "./MarketChartPreview";
import OptionsChainPreview from "./OptionsChainPreview";
import MacroCrossAssetPreview from "./MacroCrossAssetPreview";
import IndexPanel from "./IndexPanel";
import WatchlistPanel from "./WatchlistPanel";
import {
  fetchMarketAsset,
  NormalizedMarketAsset,
} from "@/lib/market/yahooFinance";
import liveSnapshot from "@/data/market_universe_live.json";
import { RefreshCw, AlertCircle } from "lucide-react";

interface MarketOverviewPanelProps {
  activeCategory: MarketCategoryId;
}

const CATEGORY_DEFAULT_SYMBOLS: Record<MarketCategoryId, string> = {
  us_equities: "AAPL",
  indian_equities: "RELIANCE.NS",
  etfs: "SPY",
  indices: "^GSPC",
  options: "SPY",
  economic_data: "^TNX",
};

const CATEGORY_TICKERS: Record<MarketCategoryId, { symbol: string; label: string; flag?: string }[]> = {
  us_equities: [
    { symbol: "AAPL", label: "AAPL", flag: "🇺🇸" },
    { symbol: "MSFT", label: "MSFT", flag: "🇺🇸" },
    { symbol: "NVDA", label: "NVDA", flag: "🇺🇸" },
    { symbol: "AMZN", label: "AMZN", flag: "🇺🇸" },
    { symbol: "GOOGL", label: "GOOGL", flag: "🇺🇸" },
    { symbol: "META", label: "META", flag: "🇺🇸" },
    { symbol: "TSLA", label: "TSLA", flag: "🇺🇸" },
    { symbol: "JPM", label: "JPM", flag: "🇺🇸" },
  ],
  indian_equities: [
    { symbol: "RELIANCE.NS", label: "RELIANCE", flag: "🇮🇳" },
    { symbol: "TCS.NS", label: "TCS", flag: "🇮🇳" },
    { symbol: "INFY.NS", label: "INFY", flag: "🇮🇳" },
    { symbol: "HDFCBANK.NS", label: "HDFCBANK", flag: "🇮🇳" },
    { symbol: "ICICIBANK.NS", label: "ICICIBANK", flag: "🇮🇳" },
    { symbol: "SBIN.NS", label: "SBIN", flag: "🇮🇳" },
    { symbol: "ITC.NS", label: "ITC", flag: "🇮🇳" },
    { symbol: "LT.NS", label: "LT", flag: "🇮🇳" },
  ],
  etfs: [
    { symbol: "SPY", label: "SPY (S&P 500)", flag: "🇺🇸" },
    { symbol: "QQQ", label: "QQQ (Nasdaq 100)", flag: "🇺🇸" },
    { symbol: "IWM", label: "IWM (Russell 2000)", flag: "🇺🇸" },
    { symbol: "VOO", label: "VOO (S&P 500)", flag: "🇺🇸" },
    { symbol: "VTI", label: "VTI (Total Market)", flag: "🇺🇸" },
    { symbol: "GLD", label: "GLD (Gold Trust)", flag: "🇺🇸" },
    { symbol: "TLT", label: "TLT (20Y Treasury)", flag: "🇺🇸" },
  ],
  indices: [
    { symbol: "^GSPC", label: "S&P 500", flag: "🇺🇸" },
    { symbol: "^IXIC", label: "Nasdaq Composite", flag: "🇺🇸" },
    { symbol: "^DJI", label: "Dow Jones", flag: "🇺🇸" },
    { symbol: "^NSEI", label: "NIFTY 50", flag: "🇮🇳" },
    { symbol: "^BSESN", label: "Sensex", flag: "🇮🇳" },
    { symbol: "^NSEBANK", label: "NIFTY Bank", flag: "🇮🇳" },
  ],
  options: [
    { symbol: "SPY", label: "SPY", flag: "🇺🇸" },
    { symbol: "QQQ", label: "QQQ", flag: "🇺🇸" },
    { symbol: "AAPL", label: "AAPL", flag: "🇺🇸" },
    { symbol: "NVDA", label: "NVDA", flag: "🇺🇸" },
    { symbol: "RELIANCE.NS", label: "RELIANCE", flag: "🇮🇳" },
  ],
  economic_data: [
    { symbol: "^TNX", label: "US 10Y Yield", flag: "🇺🇸" },
    { symbol: "^FVX", label: "US 5Y Yield", flag: "🇺🇸" },
    { symbol: "^IRX", label: "13-Week T-Bill", flag: "🇺🇸" },
    { symbol: "EURUSD=X", label: "EUR / USD", flag: "🇪🇺" },
    { symbol: "USDINR=X", label: "USD / INR", flag: "🇮🇳" },
    { symbol: "GC=F", label: "Gold", flag: "🌐" },
    { symbol: "CL=F", label: "Crude Oil", flag: "🌐" },
  ],
};

export default function MarketOverviewPanel({
  activeCategory,
}: MarketOverviewPanelProps) {
  const [currentSymbol, setCurrentSymbol] = useState<string>(
    CATEGORY_DEFAULT_SYMBOLS[activeCategory] || "AAPL"
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("6M");
  const [assetData, setAssetData] = useState<NormalizedMarketAsset | null>(() => {
    const sym = CATEGORY_DEFAULT_SYMBOLS[activeCategory] || "AAPL";
    return (liveSnapshot as any)?.assets?.[sym] || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync symbol when active category tab changes
  useEffect(() => {
    const defaultSym = CATEGORY_DEFAULT_SYMBOLS[activeCategory] || "AAPL";
    setCurrentSymbol(defaultSym);
  }, [activeCategory]);

  // Load asset data whenever currentSymbol or selectedTimeframe changes (for chart view)
  useEffect(() => {
    if (activeCategory === "options" || activeCategory === "economic_data") {
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetchMarketAsset(currentSymbol, selectedTimeframe)
      .then((data) => {
        if (isCancelled) return;
        setAssetData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        // Check if pre-generated snapshot has this asset
        const snapshotAssets = (liveSnapshot as any)?.assets || {};
        if (snapshotAssets[currentSymbol]) {
          setAssetData(snapshotAssets[currentSymbol]);
          setLoading(false);
        } else {
          setError(err.message || "Market data temporarily unavailable.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentSymbol, selectedTimeframe, activeCategory]);

  const handleSelectTicker = (sym: string) => {
    setCurrentSymbol(sym);
  };

  const handleSelectFromPanel = (sym: string) => {
    setCurrentSymbol(sym);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B1528] p-3.5 sm:p-5 lg:p-6 shadow-sm">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12"
        >
          {/* 1. Main Interactive Workspace (6 cols out of 12) */}
          <div className="md:col-span-2 lg:col-span-6 flex flex-col justify-between min-h-[460px]">
            {activeCategory === "options" ? (
              <OptionsChainPreview
                initialSymbol={currentSymbol.includes("SPY") ? "SPY" : currentSymbol}
                onSelectUnderlying={handleSelectTicker}
              />
            ) : activeCategory === "economic_data" ? (
              <MacroCrossAssetPreview onSelectInstrument={handleSelectTicker} />
            ) : loading && !assetData ? (
              /* Skeleton Loading State */
              <div className="flex h-full min-h-[440px] flex-col justify-between p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="h-10 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <div className="h-14 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-14 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-14 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-14 rounded-lg bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="my-6 h-64 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
                <div className="h-4 w-60 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : error && !assetData ? (
              /* Professional Inline Error State with Retry */
              <div className="flex h-full min-h-[440px] flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-rose-500/10 p-3 text-rose-500 mb-3">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Market Data Temporarily Unavailable
                </h4>
                <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                  {error}
                </p>
                <button
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    fetchMarketAsset(currentSymbol, selectedTimeframe)
                      .then((d) => setAssetData(d))
                      .catch((e) => setError(e.message))
                      .finally(() => setLoading(false));
                  }}
                  className="mt-4 flex items-center gap-1.5 rounded-lg bg-[#1769FF] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-600 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : assetData ? (
              /* Class-Aware Candlestick Chart View */
              <MarketChartPreview
                instrument={assetData}
                onSelectTimeframe={setSelectedTimeframe}
                availableTickers={CATEGORY_TICKERS[activeCategory]}
                onSelectTicker={handleSelectTicker}
              />
            ) : null}
          </div>

          {/* 2. Middle Panel: Market Benchmarks (3 cols out of 12) */}
          <div className="md:col-span-1 lg:col-span-3">
            <IndexPanel
              selectedSymbol={currentSymbol}
              onSelectInstrument={handleSelectFromPanel}
            />
          </div>

          {/* 3. Right Panel: Watchlist (3 cols out of 12) */}
          <div className="md:col-span-1 lg:col-span-3">
            <WatchlistPanel
              selectedSymbol={currentSymbol}
              onSelectInstrument={handleSelectFromPanel}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
