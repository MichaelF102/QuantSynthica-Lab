"use client";

import React from "react";
import { WATCHLIST_ITEMS } from "./ResearchSidebar";

interface SecurityHeaderProps {
  selectedSymbol: string;
  selectedTimeframe: string;
  onSelectTimeframe: (tf: string) => void;
}

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"];

export default function SecurityHeader({
  selectedSymbol,
  selectedTimeframe,
  onSelectTimeframe,
}: SecurityHeaderProps) {
  const stock = WATCHLIST_ITEMS.find((s) => s.symbol === selectedSymbol) || {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: "223.19",
    change: "-0.34%",
    isPositive: false,
  };

  const isAAPL = stock.symbol === "AAPL";
  const displayPrice = isAAPL ? "223.19" : stock.price;
  const displayChange = isAAPL ? "-0.76 (-0.34%)" : `${stock.change}`;
  const isPositive = isAAPL ? false : stock.isPositive;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0A101D] px-4 py-3">
      {/* Security Identifier & Price */}
      <div className="flex items-center gap-3">
        {/* Company Icon Badge */}
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] text-white">
          {stock.symbol === "AAPL" ? (
            <svg
              className="h-4.5 w-4.5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.6-.74 1.01-1.78.9-2.82-.87.04-1.92.58-2.54 1.31-.55.63-.98 1.67-.85 2.69.97.08 1.89-.47 2.49-1.18z" />
            </svg>
          ) : (
            <span className="text-[12px] font-bold text-blue-400">
              {stock.symbol.slice(0, 2)}
            </span>
          )}
        </div>

        {/* Ticker Name & Exchange */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tracking-tight text-white">
              {stock.symbol}
            </span>
            <span className="text-[12px] text-slate-400 font-normal">
              {stock.name}
            </span>
            <span className="rounded bg-white/[0.05] border border-white/[0.07] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
              {stock.symbol.includes("RELIANCE") ||
              stock.symbol.includes("TCS") ||
              stock.symbol.includes("INFY") ||
              stock.symbol.includes("HDFC")
                ? "NSE"
                : "NASDAQ"}
            </span>
          </div>

          {/* Price & Change Subline */}
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-[17px] font-bold text-white tabular-nums">
              {displayPrice}
            </span>
            <span
              className={`text-[12px] font-semibold tabular-nums ${
                isPositive ? "text-[#00C896]" : "text-[#FF4D5A]"
              }`}
            >
              {displayChange}
            </span>
          </div>
        </div>
      </div>

      {/* Timeframe Selector Pill Group */}
      <div className="flex items-center rounded-lg bg-black/30 border border-white/[0.06] p-0.5">
        {TIMEFRAMES.map((tf) => {
          const isActive = selectedTimeframe === tf;
          return (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                isActive
                  ? "bg-[#1769FF] text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tf}
            </button>
          );
        })}
      </div>
    </div>
  );
}
