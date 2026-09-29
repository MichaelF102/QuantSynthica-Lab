"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MarketCategoryId } from "./MarketCategoryTabs";
import MarketChartPreview from "./MarketChartPreview";
import OptionsChainPreview from "./OptionsChainPreview";
import MacroCrossAssetPreview from "./MacroCrossAssetPreview";
import { MarketSidebarPanels } from "./MarketSidebarPanels";
import {
  fetchMarketAsset,
  NormalizedMarketAsset,
} from "@/lib/market/yahooFinance";
import {
  US_EQUITIES,
  INDIAN_EQUITIES,
  ETFS,
  INDICES,
  OPTIONS_UNDERLYINGS,
  TickerConfig,
} from "@/lib/market/symbols";
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

  // Options context for sidebar
  const [optionsExpiration, setOptionsExpiration] = useState<string | undefined>(undefined);
  const [optionsExpirationsList, setOptionsExpirationsList] = useState<string[]>([]);

  // Sync symbol when active category tab changes
  useEffect(() => {
    const defaultSym = CATEGORY_DEFAULT_SYMBOLS[activeCategory] || "AAPL";
    setCurrentSymbol(defaultSym);
  }, [activeCategory]);

  // Load asset data whenever currentSymbol or selectedTimeframe changes
  useEffect(() => {
    if (activeCategory === "economic_data") {
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
          setError(err.message || "Unable to load market data.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentSymbol, selectedTimeframe, activeCategory]);

  // Keep options expirations in sync for options tab
  useEffect(() => {
    if (activeCategory === "options") {
      const snapshotOptions = (liveSnapshot as any)?.options || {};
      const opt = snapshotOptions[currentSymbol] || snapshotOptions["SPY"];
      if (opt?.expirations?.length) {
        setOptionsExpirationsList(opt.expirations);
        if (!optionsExpiration) {
          setOptionsExpiration(opt.selectedExpiration || opt.expirations[0]);
        }
      }
    }
  }, [activeCategory, currentSymbol, optionsExpiration]);

  const handleSelectTicker = (sym: string) => {
    setCurrentSymbol(sym);
  };

  // Determine tickers strip for active category
  const { primaryTickers, secondaryTickers } = React.useMemo(() => {
    switch (activeCategory) {
      case "us_equities":
        return {
          primaryTickers: US_EQUITIES.slice(0, 8), // AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA, JPM
          secondaryTickers: US_EQUITIES.slice(8),  // JNJ, XOM, AVGO
        };
      case "indian_equities":
        return {
          primaryTickers: INDIAN_EQUITIES, // RELIANCE, TCS, INFY, HDFC BANK, ICICI BANK, SBI, ITC, L&T
          secondaryTickers: [],
        };
      case "etfs":
        return {
          primaryTickers: ETFS.filter((e) => e.category === "Core"),     // SPY, QQQ, IWM, DIA, VOO, VTI
          secondaryTickers: ETFS.filter((e) => e.category === "Thematic"), // XLK, XLF, XLE, GLD, TLT
        };
      case "indices":
        return {
          primaryTickers: INDICES,
          secondaryTickers: [],
        };
      case "options":
        return {
          primaryTickers: OPTIONS_UNDERLYINGS,
          secondaryTickers: [],
        };
      case "economic_data":
      default:
        return {
          primaryTickers: [],
          secondaryTickers: [],
        };
    }
  }, [activeCategory]);

  return (
    <div className="w-full rounded-xl border border-border/70 dark:border-border/40 bg-card p-3 sm:p-5 lg:p-6 shadow-sm font-sans transition-colors duration-200">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 gap-5 lg:grid-cols-12"
        >
          {/* 1. Main Interactive Research Desk Workspace (8 columns out of 12 on Desktop) */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col justify-between min-h-[500px]">
            {activeCategory === "options" ? (
              <OptionsChainPreview
                initialSymbol={currentSymbol.includes("SPY") ? "SPY" : currentSymbol}
                onSelectUnderlying={handleSelectTicker}
                onSelectExpiration={setOptionsExpiration}
              />
            ) : activeCategory === "economic_data" ? (
              <MacroCrossAssetPreview onSelectInstrument={handleSelectTicker} />
            ) : loading && !assetData ? (
              /* Minimal Institutional Skeleton */
              <div className="flex h-full min-h-[460px] flex-col justify-between p-4 animate-pulse space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-muted/60" />
                  <div className="h-8 w-48 rounded bg-muted/60" />
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <div className="h-10 rounded bg-muted/40" />
                    <div className="h-10 rounded bg-muted/40" />
                    <div className="h-10 rounded bg-muted/40" />
                    <div className="h-10 rounded bg-muted/40" />
                  </div>
                </div>
                <div className="my-4 h-64 rounded bg-muted/30" />
                <div className="h-4 w-64 rounded bg-muted/40" />
              </div>
            ) : error && !assetData ? (
              /* High-Density Terminal Error */
              <div className="flex h-full min-h-[460px] flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-rose-500/10 p-3 text-rose-500 mb-2">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold font-mono tracking-wider text-foreground uppercase">
                  Unable to load market data.
                </h4>
                <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    fetchMarketAsset(currentSymbol, selectedTimeframe)
                      .then((d) => setAssetData(d))
                      .catch((e) => setError(e.message))
                      .finally(() => setLoading(false));
                  }}
                  className="mt-4 flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-mono font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>RETRY FEED</span>
                </button>
              </div>
            ) : assetData ? (
              /* Quant Chart and Research Workbench */
              <MarketChartPreview
                instrument={assetData}
                onSelectTimeframe={setSelectedTimeframe}
                tickerConfigs={primaryTickers}
                secondaryTickers={secondaryTickers}
                onSelectTicker={handleSelectTicker}
                activeCategory={activeCategory}
              />
            ) : null}
          </div>

          {/* 2. Right Context-Aware Benchmarks & Watchlist Panels (4 columns out of 12 on Desktop) */}
          <div className="lg:col-span-4 xl:col-span-4">
            <MarketSidebarPanels
              activeCategory={activeCategory}
              selectedSymbol={currentSymbol}
              onSelectSymbol={handleSelectTicker}
              underlyingAsset={assetData}
              selectedExpiration={optionsExpiration}
              availableExpirations={optionsExpirationsList}
              onSelectExpiration={setOptionsExpiration}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
