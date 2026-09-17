"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  ExternalLink,
  GitCompare,
  MoreHorizontal,
  Copy,
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { StockProfile } from "@/types";
import StockSearchInput from "@/components/ui/StockSearchInput";

interface ResearchCompanyHeaderProps {
  ticker: string;
  onTickerChange?: (ticker: string) => void;
  profile?: StockProfile | null;
  onOpenTerminal?: () => void;
  onCompare?: () => void;
  isIndia?: boolean;
}

export default function ResearchCompanyHeader({
  ticker,
  onTickerChange,
  profile,
  onOpenTerminal,
  onCompare,
  isIndia,
}: ResearchCompanyHeaderProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isIndiaStock =
    isIndia !== undefined
      ? isIndia
      : profile?.market === "India" ||
        profile?.currency === "INR" ||
        ticker.endsWith(".NS") ||
        ticker.endsWith(".BO") ||
        (typeof window !== "undefined" && localStorage.getItem("algolab_active_country") === "India");

  const companyName = profile?.name || (ticker === "AAPL" ? "Apple Inc." : `${ticker} Corp.`);
  const exchange = profile?.exchange || (isIndiaStock ? "NSE" : "NASDAQ");
  const sector = profile?.sector || (isIndiaStock ? "Indian Equities" : "Electronic Technology");
  const industry = isIndiaStock ? "Manufacturing & Services" : "Consumer Electronics";

  // Compute market cap category
  const capBadge = (() => {
    if (!profile?.market_cap) return isIndiaStock ? "Mid Cap" : "Large Cap";
    const mcap = Number(profile.market_cap);
    if (isIndiaStock) {
      if (mcap >= 2e11) return "Large Cap";
      if (mcap >= 5e10) return "Mid Cap";
      return "Small Cap";
    } else {
      if (mcap >= 1e10) return "Large Cap";
      if (mcap >= 2e9) return "Mid Cap";
      return "Small Cap";
    }
  })();

  const handleCopyTicker = () => {
    navigator.clipboard?.writeText(ticker);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-b border-[#1E2530] bg-[#07090E] px-4 py-2.5">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Breadcrumb, Avatar, Ticker, Name, Badges, Subtitle */}
        <div className="flex flex-col space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-1.5 text-[11px] text-[#59616B] font-mono">
            <Link href="/research" className="hover:text-[#38BDF8] transition-colors">
              Research
            </Link>
            <span>&gt;</span>
            <span className="text-[#D8DCE2] font-semibold">{ticker}</span>
          </div>

          {/* Identity Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Logo Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#141A24] border border-[#222B38] flex items-center justify-center text-white shadow-inner flex-shrink-0">
              {ticker === "AAPL" ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.44-6.1-9.35-10.8-19.78-14.09-31.31-3.29-11.53-4.94-22.37-4.94-32.54 0-14.45 3.63-26.65 10.89-36.6 7.26-9.95 16.53-15.02 27.81-15.22 4.47 0 9.53 1.25 15.18 3.75 5.66 2.5 9.4 3.77 11.22 3.8 1.45 0 5.49-1.37 12.11-4.11 6.63-2.74 12.13-3.9 16.51-3.48 12.39 1.14 22.02 5.86 28.91 14.16-11.08 6.74-16.52 16.14-16.32 28.2.22 9.57 3.91 17.56 11.07 23.97 7.16 6.41 15.7 10.02 25.62 10.83-2.22 6.74-5.07 13.91-8.55 21.52zM119.22 33.15c0-6.96 2.5-13.53 7.5-19.71 5-6.18 11.26-10.45 18.78-12.81.65 2.17.98 4.24.98 6.2 0 7.07-2.61 13.75-7.83 20.04-5.22 6.29-11.53 10.15-18.93 11.58-.33-1.74-.5-3.51-.5-5.3z" />
                </svg>
              ) : (
                <span className="font-bold text-sm tracking-wider">{ticker.slice(0, 2)}</span>
              )}
            </div>

            {/* Ticker & Name */}
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white tracking-tight">{ticker}</span>
              <span className="text-sm text-[#89919C] font-normal">{companyName}</span>
            </div>

            {/* Badges */}
            <div className="flex items-center space-x-1.5 text-[10px] font-medium">
              <span className="px-2 py-0.5 rounded bg-[#141A24] border border-[#232B38] text-[#94A3B8]">
                {capBadge}
              </span>
              {isIndiaStock ? (
                <>
                  <span className="px-2 py-0.5 rounded bg-[#141A24] border border-[#232B38] text-[#38BDF8]">
                    {exchange}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#141A24] border border-[#232B38] text-[#94A3B8]">
                    NIFTY 500
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2 py-0.5 rounded bg-[#141A24] border border-[#232B38] text-[#94A3B8]">
                    S&amp;P 500
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#141A24] border border-[#232B38] text-[#94A3B8]">
                    {exchange === "NYSE" ? "NYSE" : "NASDAQ-100"}
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={handleCopyTicker}
                title="Copy Symbol"
                className="p-1 text-[#59616B] hover:text-[#D8DCE2] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
              </button>

              {onTickerChange && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(!searchOpen)}
                    title="Search & Switch Ticker"
                    className="p-1 text-[#59616B] hover:text-[#38BDF8] transition-colors"
                  >
                    <Search className="w-3 h-3" />
                  </button>
                  {searchOpen && (
                    <div className="absolute left-0 mt-1 w-72 bg-[#0E131C] border border-[#252E3E] rounded p-2 z-50 shadow-2xl">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#1E2530] text-[10px] text-[#89919C]">
                        <span>SELECT SECURITY</span>
                        <button type="button" onClick={() => setSearchOpen(false)}>
                          <X className="w-3 h-3 hover:text-white" />
                        </button>
                      </div>
                      <StockSearchInput
                        value={ticker}
                        onChange={(sym) => {
                          onTickerChange(sym);
                          setSearchOpen(false);
                        }}
                        placeholder="Search 18,500+ equities..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subtitle / Taxonomy */}
          <div className="text-[11px] text-[#59616B] flex items-center space-x-2">
            <span>{exchange}</span>
            <span>&bull;</span>
            <span>{sector}</span>
            <span>&bull;</span>
            <span>{industry}</span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Watchlist */}
          <button
            type="button"
            onClick={() => setIsWatchlisted(!isWatchlisted)}
            className={`px-3 py-1.5 rounded border text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              isWatchlisted
                ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]"
                : "border-[#252E3E] bg-[#10141D] hover:bg-[#161D2B] text-[#D8DCE2]"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isWatchlisted ? "fill-[#F59E0B]" : ""}`} />
            <span>Watchlist</span>
          </button>

          {/* Open in Terminal */}
          <button
            type="button"
            onClick={onOpenTerminal}
            className="px-3 py-1.5 rounded border border-[#252E3E] bg-[#10141D] hover:bg-[#161D2B] text-[#D8DCE2] text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Open in Terminal</span>
          </button>

          {/* Compare */}
          <button
            type="button"
            onClick={onCompare}
            className="px-3 py-1.5 rounded border border-[#252E3E] bg-[#10141D] hover:bg-[#161D2B] text-[#D8DCE2] text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#89919C]" />
            <span>Compare</span>
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen(!actionsOpen)}
              className="px-2.5 py-1.5 rounded border border-[#252E3E] bg-[#10141D] hover:bg-[#161D2B] text-[#D8DCE2] text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-[#89919C]" />
              <span>Actions</span>
              <ChevronDown className="w-3 h-3 text-[#59616B]" />
            </button>

            {actionsOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-[#0E131C] border border-[#252E3E] rounded shadow-2xl py-1 z-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  className="w-full px-3 py-1.5 text-left text-[#D8DCE2] hover:bg-[#1A2230] hover:text-white"
                >
                  Export Data (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  className="w-full px-3 py-1.5 text-left text-[#D8DCE2] hover:bg-[#1A2230] hover:text-white"
                >
                  Create Alert
                </button>
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  className="w-full px-3 py-1.5 text-left text-[#D8DCE2] hover:bg-[#1A2230] hover:text-white"
                >
                  View SEC Filings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
