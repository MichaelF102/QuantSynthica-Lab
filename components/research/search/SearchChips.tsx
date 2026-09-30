"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Building2,
  Layers,
  Percent,
  LineChart,
} from "lucide-react";
import { navigateToResearchWorkspace } from "@/lib/tickerSearch";

interface CompanyChip {
  name: string;
  ticker: string;
  country: "India" | "US";
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
}

interface CategoryChip {
  label: string;
  ticker: string;
  country: "India" | "US";
  icon: React.ReactNode;
  iconColor: string;
  borderHover: string;
}

const POPULAR_COMPANIES: CompanyChip[] = [
  {
    name: "Reliance",
    ticker: "RELIANCE",
    country: "India",
    badgeText: "RE",
    badgeBg: "bg-amber-500/20 border-amber-500/40",
    badgeColor: "text-amber-300",
  },
  {
    name: "TCS",
    ticker: "TCS",
    country: "India",
    badgeText: "TC",
    badgeBg: "bg-blue-500/20 border-blue-500/40",
    badgeColor: "text-blue-300",
  },
  {
    name: "Infosys",
    ticker: "INFY",
    country: "India",
    badgeText: "IN",
    badgeBg: "bg-cyan-500/20 border-cyan-500/40",
    badgeColor: "text-cyan-300",
  },
  {
    name: "HDFC Bank",
    ticker: "HDFCBANK",
    country: "India",
    badgeText: "HDFC",
    badgeBg: "bg-rose-500/20 border-rose-500/40",
    badgeColor: "text-rose-300",
  },
  {
    name: "Tata Motors",
    ticker: "TATAMOTORS",
    country: "India",
    badgeText: "TM",
    badgeBg: "bg-indigo-500/20 border-indigo-500/40",
    badgeColor: "text-indigo-300",
  },
];

const RESEARCH_CATEGORIES: CategoryChip[] = [
  {
    label: "NIFTY 50",
    ticker: "NIFTY50",
    country: "India",
    icon: <LineChart className="h-3.5 w-3.5" />,
    iconColor: "text-purple-400",
    borderHover: "hover:border-purple-500/60 hover:shadow-purple-500/10",
  },
  {
    label: "Banking Stocks",
    ticker: "HDFCBANK",
    country: "India",
    icon: <Building2 className="h-3.5 w-3.5" />,
    iconColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/60 hover:shadow-emerald-500/10",
  },
  {
    label: "Large Cap",
    ticker: "RELIANCE",
    country: "India",
    icon: <Layers className="h-3.5 w-3.5" />,
    iconColor: "text-cyan-400",
    borderHover: "hover:border-cyan-500/60 hover:shadow-cyan-500/10",
  },
  {
    label: "High Dividend",
    ticker: "TCS",
    country: "India",
    icon: <Percent className="h-3.5 w-3.5" />,
    iconColor: "text-amber-400",
    borderHover: "hover:border-amber-500/60 hover:shadow-amber-500/10",
  },
  {
    label: "Top Gainers",
    ticker: "GENUSPOWER",
    country: "India",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    iconColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/60 hover:shadow-emerald-500/10",
  },
];

export default function SearchChips() {
  const router = useRouter();

  const handleChipClick = (ticker: string, country: "India" | "US") => {
    navigateToResearchWorkspace(ticker, router, country);
  };

  return (
    <div className="mt-7 flex flex-col items-center gap-3">
      {/* Eyebrow Label */}
      <div className="text-[12px] font-medium text-slate-400">
        Or explore popular examples:
      </div>

      {/* Row 1: Company Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {POPULAR_COMPANIES.map((comp) => (
          <button
            key={comp.ticker}
            type="button"
            onClick={() => handleChipClick(comp.ticker, comp.country)}
            className="group flex items-center gap-2 rounded-full border border-slate-800/80 bg-[#0B1528]/80 px-3.5 py-1.5 text-xs font-medium text-slate-200 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-500/50 hover:bg-slate-800/90 hover:text-white active:scale-95"
            title={`Analyze ${comp.name} (${comp.ticker})`}
          >
            <span
              className={`flex h-4 min-w-[16px] items-center justify-center rounded px-1 text-[9px] font-bold tracking-tighter border ${comp.badgeBg} ${comp.badgeColor}`}
            >
              {comp.badgeText}
            </span>
            <span>{comp.name}</span>
          </button>
        ))}
      </div>

      {/* Row 2: Category / Screener Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {RESEARCH_CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => handleChipClick(cat.ticker, cat.country)}
            className={`group flex items-center gap-1.5 rounded-full border border-slate-800/70 bg-[#070D1B]/90 px-3.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-slate-800/80 hover:text-white active:scale-95 ${cat.borderHover}`}
            title={`Explore ${cat.label}`}
          >
            <span className={cat.iconColor}>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
