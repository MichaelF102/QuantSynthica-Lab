"use client";

import React from "react";
import { BarChart3, TrendingUp, ShieldAlert, PieChart, Network, Flame, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type PortfolioTab =
  | "Overview"
  | "Performance"
  | "Risk Metrics"
  | "Allocation"
  | "Correlation"
  | "Stress Test"
  | "Scenario Analysis";

interface PortfolioSubNavProps {
  activeTab: PortfolioTab;
  onTabChange: (tab: PortfolioTab) => void;
}

export const PORTFOLIO_TABS: { key: PortfolioTab; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "Overview", icon: BarChart3 },
  { key: "Performance", icon: TrendingUp },
  { key: "Risk Metrics", icon: ShieldAlert },
  { key: "Allocation", icon: PieChart },
  { key: "Correlation", icon: Network },
  { key: "Stress Test", icon: Flame },
  { key: "Scenario Analysis", icon: Layers },
];

/** DESIGN.md 7.3 pill tab track; the active tab is mirrored in `?tab=` by the page. */
export default function PortfolioSubNav({ activeTab, onTabChange }: PortfolioSubNavProps) {
  return (
    <div className="no-scrollbar w-full overflow-x-auto py-2">
      <nav className="flex min-w-max items-center gap-1.5 rounded-xl border border-slate-800/80 bg-[#0b1120]/80 p-1 backdrop-blur-md" aria-label="Portfolio sections">
        {PORTFOLIO_TABS.map(({ key, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70",
                active ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/30" : "font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {key}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
