"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const RESEARCH_TABS = [
  { key: "overview", label: "Overview" }, { key: "technicals", label: "Technicals" }, { key: "fundamentals", label: "Fundamentals" },
  { key: "sentiment", label: "Sentiment" }, { key: "options", label: "Options" }, { key: "analyst", label: "Analyst Estimates" },
  { key: "news", label: "News" }, { key: "filings", label: "Filings" }, { key: "competitors", label: "Competitors" },
  { key: "ownership", label: "Ownership" }, { key: "esg", label: "ESG" },
] as const;
export type ResearchTabKey = (typeof RESEARCH_TABS)[number]["key"];

/** DESIGN.md 7.3 pill tab track; the active tab is mirrored in `?tab=`. */
export default function ResearchTabs({ active, onChange }: { active: ResearchTabKey; onChange: (t: ResearchTabKey) => void }) {
  return (
    <div className="no-scrollbar w-full overflow-x-auto py-2">
      <nav className="flex min-w-max items-center gap-1.5 rounded-xl border border-slate-800/80 bg-[#0b1120]/80 p-1 backdrop-blur-md" aria-label="Research sections">
        {RESEARCH_TABS.map((t) => {
          const on = t.key === active;
          return (
            <button key={t.key} type="button" onClick={() => onChange(t.key)} aria-current={on ? "page" : undefined}
              className={cn("rounded-lg px-3.5 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70", on ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/30" : "font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")}>
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
