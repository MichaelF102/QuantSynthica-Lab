"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MarketCategoryId } from "./MarketCategoryTabs";
import MarketChartPreview from "./MarketChartPreview";
import IndexPanel from "./IndexPanel";
import WatchlistPanel from "./WatchlistPanel";
import {
  REAL_UNIVERSE_MAP,
  OPTIONS_UNIVERSE_ITEMS,
  MACRO_UNIVERSE_ITEMS,
  TickerUniverseItem,
} from "@/lib/marketUniverseData";
import { api } from "@/lib/api";

interface MarketOverviewPanelProps {
  activeCategory: MarketCategoryId;
}

// Category-specific flagship instruments
const CATEGORY_DEFAULT_INSTRUMENTS: Record<MarketCategoryId, TickerUniverseItem> = {
  us_equities: REAL_UNIVERSE_MAP["SPY"],
  indian_equities: REAL_UNIVERSE_MAP["RELIANCE"],
  etfs: REAL_UNIVERSE_MAP["QQQ"],
  indices: REAL_UNIVERSE_MAP["^NSEI"],
  options: OPTIONS_UNIVERSE_ITEMS["SPY_241018C560"],
  economic_data: MACRO_UNIVERSE_ITEMS["FEDFUNDS"],
};

export default function MarketOverviewPanel({
  activeCategory,
}: MarketOverviewPanelProps) {
  const [selectedInstrument, setSelectedInstrument] = useState<TickerUniverseItem>(
    CATEGORY_DEFAULT_INSTRUMENTS[activeCategory] || REAL_UNIVERSE_MAP["SPY"]
  );

  // Sync flagship instrument when category tab changes
  useEffect(() => {
    const inst = CATEGORY_DEFAULT_INSTRUMENTS[activeCategory] || REAL_UNIVERSE_MAP["SPY"];
    setSelectedInstrument(inst);
  }, [activeCategory]);

  // Optional: Try fetching fresh live data from backend for the selected ticker if not already rich
  useEffect(() => {
    let isCancelled = false;
    const sym = selectedInstrument.symbol;
    if (sym && !sym.includes(" ") && !sym.includes("REPO") && !sym.includes("FEDFUNDS")) {
      api
        .getMarketData({
          ticker: sym,
        })
        .then((res) => {
          // If response is missing, cancelled, or synthetic fallback, preserve authentic yfinance dataset
          if (isCancelled || !res?.bars?.length || res.summary?.is_synthetic) return;
          const lastBar = res.bars[res.bars.length - 1];
          const prevBar = res.bars[res.bars.length - 2] || lastBar;
          const changeVal = +(lastBar.close - prevBar.close).toFixed(2);
          const changePct = +(prevBar.close > 0 ? (changeVal / prevBar.close) * 100 : 0).toFixed(2);

          setSelectedInstrument((prev) => ({
            ...prev,
            price: lastBar.close,
            change: changeVal,
            change_pct: changePct,
            is_positive: changeVal >= 0,
            open: lastBar.open,
            high: lastBar.high,
            low: lastBar.low,
            close: lastBar.close,
            volume: lastBar.volume,
            high_52w: res.summary?.high_52w || prev.high_52w,
            low_52w: res.summary?.low_52w || prev.low_52w,
            avg_volume_30d: res.summary?.avg_volume_30d || prev.avg_volume_30d,
            beta: res.summary?.beta || prev.beta,
            volatility: res.summary?.annualized_volatility || prev.volatility,
            bars: res.bars.map((b) => ({
              date: b.date,
              open: b.open,
              high: b.high,
              low: b.low,
              close: b.close,
              volume: b.volume,
              ema_20: (b as any).ema_20 || null,
              ema_50: (b as any).ema_50 || null,
              sma_20: (b as any).sma_20 || null,
              sma_50: (b as any).sma_50 || null,
            })),
          }));
        })
        .catch(() => {
          // If offline, authentic data from REAL_UNIVERSE_MAP is already active
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedInstrument.symbol]);

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B1528] p-3.5 sm:p-5 lg:p-6 shadow-sm">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12"
        >
          {/* 1. Main Interactive Candlestick Chart (6 cols out of 12) */}
          <div className="md:col-span-2 lg:col-span-6">
            <MarketChartPreview instrument={selectedInstrument} />
          </div>

          {/* 2. Middle Panel: Indices (3 cols out of 12) */}
          <div className="md:col-span-1 lg:col-span-3">
            <IndexPanel
              selectedSymbol={selectedInstrument.symbol}
              onSelectInstrument={setSelectedInstrument}
            />
          </div>

          {/* 3. Right Panel: Watchlist (3 cols out of 12) */}
          <div className="md:col-span-1 lg:col-span-3">
            <WatchlistPanel
              selectedSymbol={selectedInstrument.symbol}
              onSelectInstrument={setSelectedInstrument}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
