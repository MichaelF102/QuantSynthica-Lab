"use client";

import React from "react";
import { cn } from "@/lib/cn";

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
    <div className="select-none border-b border-border/80 bg-surface/20 px-4">
      <div className="no-scrollbar mx-auto flex max-w-[1720px] items-center gap-1 overflow-x-auto py-1.5">
        {RESEARCH_TABS.map((tab) => {
          const isActive =
            activeTab.toLowerCase() === tab.toLowerCase() ||
            (tab === "Overview" && activeTab === "overview");

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={cn(
                "relative whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-surface-active text-white"
                  : "text-slate-400 hover:bg-surface-hover hover:text-white"
              )}
            >
              {tab}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-[7px] h-px bg-brand-amber" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
