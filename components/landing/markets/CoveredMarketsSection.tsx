"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import MarketSectionHeader from "./MarketSectionHeader";
import MarketCategoryTabs, { MarketCategoryId } from "./MarketCategoryTabs";
import MarketOverviewPanel from "./MarketOverviewPanel";

// Dynamic import of subtle 3D globe with SSR disabled
const MarketUniverseGlobe = dynamic(
  () => import("@/components/three/MarketUniverseGlobe"),
  {
    ssr: false,
    loading: () => null,
  }
);

const DATA_PROVIDERS = [
  "Yahoo Finance",
  "Alpha Vantage",
  "NSE (National Stock Exchange)",
  "BSE (Bombay Stock Exchange)",
  "FRED (Federal Reserve)",
  "World Bank Open Data",
  "QuantSynthica Vector Engine",
];

export default function CoveredMarketsSection() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MarketCategoryId>("us_equities");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#070D18] py-16 sm:py-24">
      {/* 1. Subtle 3D Globe & Atmospheric Background */}
      <div className="pointer-events-none absolute right-[-5%] top-[-5%] z-0 h-[480px] w-[580px] overflow-hidden lg:h-[560px] lg:w-[680px]">
        {mounted && <MarketUniverseGlobe />}
      </div>

      {/* Background Soft Ambient Radial Glow */}
      <div
        className="pointer-events-none absolute right-10 top-20 z-0 h-[400px] w-[500px] opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(23,105,255,0.08) 0%, rgba(79,70,229,0.03) 50%, transparent 70%)",
        }}
      />

      {/* Floating Global Orbit Marker Badges */}
      <div className="pointer-events-none absolute right-[28%] top-[12%] z-0 hidden lg:flex items-center gap-1.5 rounded-full border border-blue-200/60 dark:border-blue-900/60 bg-white/70 dark:bg-[#0B1528]/80 px-2.5 py-0.5 text-[10px] font-bold text-[#1769FF] dark:text-blue-400 shadow-2xs backdrop-blur-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1769FF] animate-pulse" />
        <span>US MARKETS</span>
      </div>

      <div className="pointer-events-none absolute right-[6%] top-[18%] z-0 hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-200/60 dark:border-emerald-900/60 bg-white/70 dark:bg-[#0B1528]/80 px-2.5 py-0.5 text-[10px] font-bold text-[#00A878] dark:text-emerald-400 shadow-2xs backdrop-blur-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-[#00A878] animate-pulse" />
        <span>INDIAN MARKETS</span>
      </div>

      {/* 2. Main Section Content */}
      <div className="relative z-10 mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="transition-all duration-500 ease-out">
          <MarketSectionHeader />
        </div>

        {/* Category Tabs */}
        <div className="mt-2 transition-all duration-500 ease-out">
          <MarketCategoryTabs
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />
        </div>

        {/* Interactive Workspace Panel */}
        <div className="mt-2 transition-all duration-500 ease-out">
          <MarketOverviewPanel activeCategory={activeCategory} />
        </div>

        {/* 3. Lower Data & Research Coverage Strip */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 dark:border-slate-800 pt-8 sm:flex-row"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500 uppercase">
              DATA & RESEARCH COVERAGE
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[12px] font-medium text-slate-500 dark:text-slate-400">
            {DATA_PROVIDERS.map((provider, idx) => (
              <React.Fragment key={provider}>
                <span className="rounded-md bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-200/70 dark:hover:bg-slate-700/70 hover:text-[#0B1220] dark:hover:text-white">
                  {provider}
                </span>
                {idx < DATA_PROVIDERS.length - 1 && (
                  <span className="hidden text-slate-300 md:inline">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
