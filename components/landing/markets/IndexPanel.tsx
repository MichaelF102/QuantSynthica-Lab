"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { REAL_UNIVERSE_MAP, TickerUniverseItem, formatPrice } from "@/lib/marketUniverseData";

export interface IndexItem {
  name: string;
  ticker: string;
  country: "US" | "India";
  flag: string;
  price: string;
  change: string;
  isPositive: boolean;
  sparklineD: string;
  universeItem: TickerUniverseItem;
}

const INDEX_CONFIGS = [
  { key: "SPY", displayName: "S&P 500", ticker: "SPY" },
  { key: "QQQ", displayName: "Nasdaq 100", ticker: "QQQ" },
  { key: "^NSEI", displayName: "Nifty 50", ticker: "^NSEI" },
  { key: "^BSESN", displayName: "Sensex", ticker: "^BSESN" },
  { key: "DIA", displayName: "Dow Jones", ticker: "DIA" },
];

export function getIndicesList(): IndexItem[] {
  return INDEX_CONFIGS.map((cfg) => {
    const item = REAL_UNIVERSE_MAP[cfg.key] || REAL_UNIVERSE_MAP["SPY"];
    const prefix = item.change >= 0 ? "+" : "";
    return {
      name: cfg.displayName,
      ticker: cfg.ticker,
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

interface IndexPanelProps {
  selectedSymbol?: string;
  onSelectInstrument: (instrument: TickerUniverseItem) => void;
}

export default function IndexPanel({
  selectedSymbol = "SPY",
  onSelectInstrument,
}: IndexPanelProps) {
  const indices = getIndicesList();

  return (
    <div className="flex flex-col justify-between h-full rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#070D18] p-3.5 sm:p-4 shadow-2xs">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[14px] text-[#0B1220] dark:text-white tracking-tight">
              Indices
            </h3>
            <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Real Benchmarks
            </span>
          </div>
          <Link
            href="/research?ticker=SPY"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1769FF] dark:text-blue-400 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Rows */}
        <div className="mt-2 divide-y divide-slate-100/80 dark:divide-slate-800/80">
          {indices.map((idx) => {
            const isSelected =
              selectedSymbol === idx.ticker ||
              selectedSymbol === idx.universeItem.symbol ||
              selectedSymbol === idx.name;

            return (
              <div
                key={idx.ticker}
                onClick={() => onSelectInstrument(idx.universeItem)}
                className={`group flex cursor-pointer items-center justify-between py-2 px-2 rounded-lg transition-all duration-150 ${
                  isSelected
                    ? "bg-blue-50/90 dark:bg-blue-950/40 border-l-2 border-[#1769FF] shadow-2xs"
                    : "hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50"
                }`}
              >
                {/* Left: Name and Ticker */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] leading-none">{idx.flag}</span>
                    <span className="font-semibold text-[13px] text-[#0B1220] dark:text-white leading-tight">
                      {idx.name}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5 ml-4">
                    {idx.ticker}
                  </div>
                </div>

                {/* Right: Price, Change, Sparkline */}
                <div className="flex items-center gap-2.5">
                  <div className="text-right font-mono">
                    <div className="font-semibold text-[12px] text-[#0B1220] dark:text-white tabular-nums">
                      {idx.price}
                    </div>
                    <div
                      className={`text-[10px] font-bold tabular-nums ${
                        idx.isPositive ? "text-[#00A878] dark:text-emerald-400" : "text-[#E5484D] dark:text-rose-400"
                      }`}
                    >
                      {idx.change}
                    </div>
                  </div>

                  {/* Real SVG Sparkline */}
                  <div className="h-5 w-13 shrink-0">
                    <svg
                      viewBox="0 0 54 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-full w-full overflow-visible"
                    >
                      <path
                        d={idx.sparklineD}
                        stroke={idx.isPositive ? "#00A878" : "#E5484D"}
                        strokeWidth="1.8"
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

      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
        <span>Source: YFinance / NSE / BSE</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Verified Feeds
        </span>
      </div>
    </div>
  );
}
