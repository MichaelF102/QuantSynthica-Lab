"use client";

import React, { useState } from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";

export interface WatchlistStock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  sparkline: string; // SVG path d
}

export const WATCHLIST_ITEMS: WatchlistStock[] = [
  {
    symbol: "SPY",
    name: "S&P 500",
    price: "588.45",
    change: "+0.42%",
    isPositive: true,
    sparkline: "M0 12 Q 10 14, 20 8 T 40 10 T 60 5 T 75 3",
  },
  {
    symbol: "QQQ",
    name: "Nasdaq 100",
    price: "501.23",
    change: "+0.31%",
    isPositive: true,
    sparkline: "M0 14 Q 15 12, 30 7 T 50 9 T 75 4",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: "223.19",
    change: "-0.34%",
    isPositive: false,
    sparkline: "M0 4 Q 18 6, 35 12 T 55 10 T 75 15",
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    price: "438.21",
    change: "+0.48%",
    isPositive: true,
    sparkline: "M0 15 Q 20 13, 38 8 T 58 6 T 75 2",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    price: "128.62",
    change: "+2.15%",
    isPositive: true,
    sparkline: "M0 16 Q 15 14, 30 6 T 55 4 T 75 1",
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Ind.",
    price: "3,012.25",
    change: "-2.13%",
    isPositive: false,
    sparkline: "M0 2 Q 22 5, 40 11 T 60 13 T 75 16",
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy",
    price: "4,126.80",
    change: "+0.65%",
    isPositive: true,
    sparkline: "M0 13 Q 20 10, 40 9 T 60 4 T 75 3",
  },
  {
    symbol: "INFY",
    name: "Infosys",
    price: "1,704.55",
    change: "+1.12%",
    isPositive: true,
    sparkline: "M0 14 Q 18 11, 36 7 T 56 6 T 75 2",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    price: "1,542.30",
    change: "+0.22%",
    isPositive: true,
    sparkline: "M0 11 Q 20 12, 38 8 T 58 7 T 75 5",
  },
];

interface ResearchSidebarProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export default function ResearchSidebar({
  selectedSymbol,
  onSelectSymbol,
}: ResearchSidebarProps) {
  const [activeTab, setActiveTab] = useState<"Watchlist" | "Indices" | "Sectors">(
    "Watchlist"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = WATCHLIST_ITEMS.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col border-r border-white/[0.06] bg-[#070D18]/90 text-slate-200">
      {/* Search Input Bar */}
      <div className="p-3 pb-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-white/[0.07] bg-white/[0.04] py-1.5 pr-8 pl-8 text-[12px] text-slate-200 placeholder-slate-500 transition-colors focus:border-blue-500/50 focus:bg-white/[0.07] focus:outline-hidden"
          />
          <button
            type="button"
            className="absolute right-2 text-slate-500 hover:text-slate-300"
            title="Filter parameters"
          >
            <SlidersHorizontal className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] px-3 text-[11px] font-medium">
        {(["Watchlist", "Indices", "Sectors"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-1.5 px-2.5 transition-colors ${
              activeTab === tab
                ? "text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1769FF]" />
            )}
          </button>
        ))}
      </div>

      {/* Stock List Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] py-1">
        {filteredItems.map((stock) => {
          const isSelected = selectedSymbol === stock.symbol;

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectSymbol(stock.symbol)}
              className={`group flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                isSelected
                  ? "bg-blue-600/15 border-l-2 border-l-[#1769FF]"
                  : "border-l-2 border-l-transparent hover:bg-white/[0.03]"
              }`}
            >
              {/* Symbol & Name */}
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[12px] font-bold tracking-tight ${
                      isSelected
                        ? "text-blue-400 font-extrabold"
                        : "text-slate-100 group-hover:text-white"
                    }`}
                  >
                    {stock.symbol}
                  </span>
                </div>
                <div className="truncate text-[10px] text-slate-400 group-hover:text-slate-300">
                  {stock.name}
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="flex h-5 w-14 flex-shrink-0 items-center justify-center px-1">
                <svg
                  viewBox="0 0 75 20"
                  className="h-full w-full overflow-visible"
                >
                  <path
                    d={stock.sparkline}
                    fill="none"
                    stroke={stock.isPositive ? "#00C896" : "#FF4D5A"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Price & Change */}
              <div className="text-right flex-shrink-0">
                <div className="text-[12px] font-semibold text-slate-100 tabular-nums">
                  {stock.price}
                </div>
                <div
                  className={`text-[10px] font-medium tabular-nums ${
                    stock.isPositive ? "text-[#00C896]" : "text-[#FF4D5A]"
                  }`}
                >
                  {stock.change}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Symbol Bottom Button */}
      <div className="p-2 border-t border-white/[0.06]">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-white/10 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-white/20 hover:bg-white/[0.02] hover:text-slate-200"
        >
          <Plus className="h-3 w-3" />
          <span>Add Symbol</span>
        </button>
      </div>
    </div>
  );
}
