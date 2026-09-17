"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, ArrowUpRight, ChevronDown, Check } from "lucide-react";

interface StrategyExecutionBannerProps {
  strategyUrl: string;
  ticker: string;
  benchmark: string;
}

export default function StrategyExecutionBanner({
  strategyUrl,
  ticker,
  benchmark,
}: StrategyExecutionBannerProps) {
  const [templateSaved, setTemplateSaved] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSaveTemplate = () => {
    setTemplateSaved(true);
    setDropdownOpen(false);
    setTimeout(() => setTemplateSaved(false), 2500);
  };

  return (
    <div className="border border-[#1E2530] bg-[#0A0D14] rounded-sm p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left info & description */}
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 flex items-center justify-center flex-shrink-0">
          <Info className="h-3.5 w-3.5 text-[#38BDF8]" />
        </div>
        <div>
          <div className="font-semibold text-white text-[13px] tracking-tight">
            Research &rarr; Strategy Execution
          </div>
          <div className="text-[#89919C] text-[11px] mt-0.5">
            Transfer current setup to Strategy Builder with benchmark, date range, and indicators.
          </div>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center space-x-2 relative">
        <Link
          href={strategyUrl}
          className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <span>Open in Strategy Builder</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-3.5 py-2 bg-[#10141D] hover:bg-[#161D2B] border border-[#252E3E] text-[#D8DCE2] text-xs font-medium rounded flex items-center space-x-1 transition-colors"
          >
            {templateSaved ? (
              <span className="text-[#10B981] flex items-center space-x-1">
                <Check className="h-3.5 w-3.5" />
                <span>Saved</span>
              </span>
            ) : (
              <>
                <span>Save as Template</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#89919C]" />
              </>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-48 bg-[#0E131C] border border-[#252E3E] rounded shadow-xl py-1 z-30">
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="w-full px-3 py-1.5 text-left text-[11px] text-[#D8DCE2] hover:bg-[#1A2230] hover:text-white"
              >
                Save as {ticker} Workspace Preset
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="w-full px-3 py-1.5 text-left text-[11px] text-[#D8DCE2] hover:bg-[#1A2230] hover:text-white"
              >
                Save {ticker} vs {benchmark} Spread
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
