"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { REAL_UNIVERSE_MAP, TickerUniverseItem, formatPrice } from "@/lib/marketUniverseData";

export interface WatchlistItem {
  symbol: string;
  name: string;
  country: "US" | "India";
  flag: string;
  price: string;
  change: string;
  isPositive: boolean;
  sparklineD: string;
  universeItem: TickerUniverseItem;
}

const WATCHLIST_SYMBOLS = [
  "NVDA",
  "AAPL",
  "RELIANCE",
  "TCS",
  "INFY",
  "MSFT",
  "AMZN",
  "TSLA",
];

export function getWatchlistList(): WatchlistItem[] {
  return WATCHLIST_SYMBOLS.map((sym) => {
    const item = REAL_UNIVERSE_MAP[sym] || REAL_UNIVERSE_MAP["SPY"];
    const prefix = item.change >= 0 ? "+" : "";
    return {
      symbol: item.symbol,
      name: item.name,
      country: item.country,
      flag: item.flag,
      price: formatPrice(item.price, item.currency),
      change: `${prefix}${item.change_pct.toFixed(2)}%`,
      isPositive: item.is_positive,
      sparklineD: item.sparkline_d,
      universeItem: item,
    };
  });
}

interface WatchlistPanelProps {
  selectedSymbol?: string;
  onSelectInstrument: (instrument: TickerUniverseItem) => void;
}

export default function WatchlistPanel({
  selectedSymbol = "SPY",
  onSelectInstrument,
}: WatchlistPanelProps) {
  const watchlist = getWatchlistList();

  return (
    <div className="flex flex-col justify-between h-full rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#070D18] p-3.5 sm:p-4 shadow-2xs">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[14px] text-[#0B1220] dark:text-white tracking-tight">
              Watchlist
            </h3>
            <span className="rounded bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 text-[9px] font-bold text-[#1769FF] dark:text-blue-400 uppercase tracking-wider">
              US + India
            </span>
          </div>
          <Link
            href="/research"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1769FF] dark:text-blue-400 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Table Column Labels */}
        <div className="flex items-center justify-between pt-2 pb-1 px-2 text-[10px] font-mono text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-slate-800/60">
          <span>Symbol</span>
          <div className="flex items-center gap-6">
            <span>Price</span>
            <span className="w-12 text-right">Change</span>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100/70 dark:divide-slate-800/70 overflow-hidden">
          {watchlist.map((item) => {
            const isSelected = selectedSymbol === item.symbol;

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectInstrument(item.universeItem)}
                className={`group flex cursor-pointer items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-150 ${
                  isSelected
                    ? "bg-blue-50/90 dark:bg-blue-950/40 border-l-2 border-[#1769FF] shadow-2xs"
                    : "hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50"
                }`}
              >
                {/* Symbol & Country Flag */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] leading-none">{item.flag}</span>
                  <span className="font-bold font-mono text-[12px] text-[#0B1220] dark:text-white">
                    {item.symbol}
                  </span>
                </div>

                {/* Price, Change & Micro-Sparkline */}
                <div className="flex items-center gap-2">
                  <div className="font-mono text-[11px] font-semibold text-[#0B1220] dark:text-white tabular-nums">
                    {item.price}
                  </div>

                  <div
                    className={`font-mono text-[10px] font-bold w-12 text-right tabular-nums ${
                      item.isPositive ? "text-[#00A878] dark:text-emerald-400" : "text-[#E5484D] dark:text-rose-400"
                    }`}
                  >
                    {item.change}
                  </div>

                  {/* Real SVG Sparkline */}
                  <div className="h-4 w-12 shrink-0">
                    <svg
                      viewBox="0 0 54 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-full w-full overflow-visible"
                    >
                      <path
                        d={item.sparklineD}
                        stroke={item.isPositive ? "#00A878" : "#E5484D"}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
        <span>Click row to load chart</span>
        <span className="text-[#1769FF] dark:text-blue-400 font-medium">8 Actives</span>
      </div>
    </div>
  );
}
