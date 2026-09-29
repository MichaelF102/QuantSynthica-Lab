"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { WorkspaceFeatureKey } from "./WorkspaceNavigation";
import ResearchSidebar from "./ResearchSidebar";
import SecurityHeader from "./SecurityHeader";
import SecurityChart from "./SecurityChart";
import SecurityInsightPanel from "./SecurityInsightPanel";

interface SecurityTerminalProps {
  activeFeature: WorkspaceFeatureKey;
  onSelectFeature: (feature: WorkspaceFeatureKey) => void;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

const TOP_NAV_ITEMS: { id: WorkspaceFeatureKey; label: string }[] = [
  { id: "charts", label: "Charts" },
  { id: "strategy", label: "Strategies" },
  { id: "backtesting", label: "Backtests" },
  { id: "analytics", label: "Analytics" },
  { id: "portfolio", label: "Portfolio" },
  { id: "risk", label: "Risk" },
  { id: "options", label: "Options" },
  { id: "research", label: "Research" },
];

export default function SecurityTerminal({
  activeFeature,
  onSelectFeature,
  selectedSymbol,
  onSelectSymbol,
}: SecurityTerminalProps) {
  const [selectedMarket, setSelectedMarket] = useState<"US" | "India">("US");
  const [selectedTimeframe, setSelectedTimeframe] = useState("3M");

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.10] bg-[#0B1220] shadow-[0_30px_80px_rgba(15,23,42,0.22)] overflow-hidden">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/[0.08] bg-[#070D18] px-3.5 py-2.5 sm:px-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1769FF] shadow-xs">
            <span className="text-[12px] font-black text-white font-mono">Q</span>
          </div>
          <span className="text-[13px] font-bold tracking-tight text-white">
            QuantSynthica <span className="font-light text-slate-400">Lab</span>
          </span>
        </div>

        {/* Center: Interactive Feature Navigation Pills */}
        <div className="hidden xl:flex items-center gap-1 rounded-lg bg-white/[0.03] p-0.5 border border-white/[0.04]">
          {TOP_NAV_ITEMS.map((item) => {
            const isActive = activeFeature === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectFeature(item.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-[#1769FF] text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Search, Market Selector, Avatar */}
        <div className="flex items-center gap-2">
          {/* Universal Search Bar */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              readOnly
              value=""
              placeholder="Search symbols, indicators, or functions..."
              className="w-56 lg:w-64 rounded-md border border-white/[0.08] bg-white/[0.04] py-1 pr-8 pl-8 text-[11px] text-slate-200 placeholder-slate-500 cursor-pointer hover:border-white/[0.15] transition-colors"
            />
            <kbd className="absolute right-2 hidden rounded bg-white/[0.08] px-1 py-0.5 text-[9px] font-mono text-slate-400 sm:inline-block">
              ⌘K
            </kbd>
          </div>

          {/* Market Switcher (US / India) */}
          <div className="flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] p-0.5 text-[11px]">
            <button
              onClick={() => setSelectedMarket("US")}
              className={`flex items-center gap-1 rounded px-2 py-0.5 transition-colors ${
                selectedMarket === "US"
                  ? "bg-[#1769FF] text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇺🇸</span>
              <span className="font-mono text-[10px]">US</span>
            </button>
            <button
              onClick={() => setSelectedMarket("India")}
              className={`flex items-center gap-1 rounded px-2 py-0.5 transition-colors ${
                selectedMarket === "India"
                  ? "bg-[#1769FF] text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇮🇳</span>
              <span className="font-mono text-[10px]">INDIA</span>
            </button>
          </div>

          {/* Small User Avatar */}
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-[11px] font-bold text-white shadow-xs">
            A
          </div>
        </div>
      </div>

      {/* Terminal Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 h-[520px] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06] overflow-x-auto">
        {/* Left Research Sidebar: Watchlist (col-span-3) */}
        <div className="hidden md:block lg:col-span-3 h-full overflow-hidden">
          <ResearchSidebar
            selectedSymbol={selectedSymbol}
            onSelectSymbol={onSelectSymbol}
          />
        </div>

        {/* Center: Security Header + Chart & Dynamic View (col-span-6) */}
        <div className="col-span-12 md:col-span-8 lg:col-span-6 flex flex-col h-full overflow-hidden bg-[#0B1220]">
          <SecurityHeader
            selectedSymbol={selectedSymbol}
            selectedTimeframe={selectedTimeframe}
            onSelectTimeframe={setSelectedTimeframe}
          />
          <div className="flex-1 overflow-hidden">
            <SecurityChart
              activeFeature={activeFeature}
              selectedSymbol={selectedSymbol}
            />
          </div>
        </div>

        {/* Right Research Insights Panel (col-span-3) */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-hidden">
          <SecurityInsightPanel />
        </div>
      </div>
    </div>
  );
}
