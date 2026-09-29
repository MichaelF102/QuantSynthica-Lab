"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import {
  fetchMarketBenchmarks,
  BenchmarkItem,
  formatCurrencyValue,
} from "@/lib/market/yahooFinance";
import liveSnapshot from "@/data/market_universe_live.json";

interface IndexPanelProps {
  selectedSymbol?: string;
  onSelectInstrument: (symbol: string) => void;
}

export default function IndexPanel({
  selectedSymbol = "^GSPC",
  onSelectInstrument,
}: IndexPanelProps) {
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>(
    (liveSnapshot as any)?.benchmarks || []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    fetchMarketBenchmarks()
      .then((data) => {
        if (isCancelled || !data?.length) return;
        setBenchmarks(data);
      })
      .catch(() => {
        // Fallback to snapshot already loaded
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col justify-between h-full rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#070D18] p-3.5 sm:p-4 shadow-2xs">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[14px] text-[#0B1220] dark:text-white tracking-tight">
              Market Benchmarks
            </h3>
            <span className="rounded bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 text-[9px] font-bold text-[#1769FF] dark:text-blue-400 uppercase tracking-wider">
              Real Benchmarks
            </span>
          </div>
          <Link
            href="/research?ticker=^GSPC"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1769FF] dark:text-blue-400 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Rows */}
        <div className="mt-2 divide-y divide-slate-100/80 dark:divide-slate-800/80">
          {benchmarks.map((idx) => {
            const isSelected =
              selectedSymbol === idx.symbol ||
              selectedSymbol === idx.name;

            return (
              <div
                key={idx.symbol}
                onClick={() => onSelectInstrument(idx.symbol)}
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
                    {idx.symbol} · {idx.market}
                  </div>
                </div>

                {/* Right: Price, Change, Sparkline */}
                <div className="flex items-center gap-2.5">
                  <div className="text-right font-mono">
                    <div className="font-semibold text-[12px] text-[#0B1220] dark:text-white tabular-nums">
                      {formatCurrencyValue(idx.price, idx.currency)}
                    </div>
                    <div
                      className={`text-[10px] font-bold tabular-nums ${
                        idx.isPositive
                          ? "text-[#00A878] dark:text-emerald-400"
                          : "text-[#E5484D] dark:text-rose-400"
                      }`}
                    >
                      {idx.isPositive ? "+" : ""}
                      {idx.changePercent.toFixed(2)}%
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
                        d={idx.sparklineSvg || "M 0 11 L 54 11"}
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
        <span>Yahoo Finance · Global Indices</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Benchmarks
        </span>
      </div>
    </div>
  );
}
