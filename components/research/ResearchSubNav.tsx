"use client";

import React from "react";

export type ResearchNavTab =
  | "Overview"
  | "Technicals"
  | "Fundamentals"
  | "Sentiment"
  | "Options"
  | "Analyst Estimates"
  | "News"
  | "Filings"
  | "Competitors"
  | "Ownership"
  | "ESG";

interface ResearchSubNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

const RESEARCH_TABS: ResearchNavTab[] = [
  "Overview",
  "Technicals",
  "Fundamentals",
  "Sentiment",
  "Options",
  "Analyst Estimates",
  "News",
  "Filings",
  "Competitors",
  "Ownership",
  "ESG",
];

export default function ResearchSubNav({ activeTab, onSelectTab }: ResearchSubNavProps) {
  return (
    <div className="border-b border-[#1E2530] bg-[#07090D] px-4 select-none">
      <div className="max-w-[1720px] mx-auto flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
        {RESEARCH_TABS.map((tab) => {
          const isActive =
            activeTab.toLowerCase() === tab.toLowerCase() ||
            (tab === "Overview" && activeTab === "overview");

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-[#141A24] text-white border border-[#252E3E] shadow-sm font-semibold"
                  : "text-[#89919C] hover:text-white hover:bg-[#10141D]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
