"use client";

import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  ArrowLeftRight,
  Gauge,
  Sliders,
  Sparkles,
  GitMerge,
  Columns3,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AnalyticsTabKey =
  | "Overview"
  | "Compare"
  | "Portfolio"
  | "Performance"
  | "Risk"
  | "Trades"
  | "Regimes"
  | "Factors"
  | "Robustness"
  | "Attribution";

interface AnalyticsSubNavProps {
  activeTab: AnalyticsTabKey;
  onTabChange: (tab: AnalyticsTabKey) => void;
}

export const TABS: { key: AnalyticsTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "Overview", label: "Overview", icon: LayoutDashboard },
  { key: "Compare", label: "Compare", icon: Columns3 },
  { key: "Portfolio", label: "Portfolio", icon: PieChart },
  { key: "Performance", label: "Performance", icon: TrendingUp },
  { key: "Risk", label: "Risk", icon: ShieldAlert },
  { key: "Trades", label: "Trades", icon: ArrowLeftRight },
  { key: "Regimes", label: "Regimes", icon: Gauge },
  { key: "Factors", label: "Factors", icon: Sliders },
  { key: "Robustness", label: "Robustness", icon: Sparkles },
  { key: "Attribution", label: "Attribution", icon: GitMerge },
];

/** DESIGN.md 7.3 pill tab track. Blue = selection; state lives in the URL (?tab=). */
export default function AnalyticsSubNav({ activeTab, onTabChange }: AnalyticsSubNavProps) {
  return (
    <div className="no-scrollbar w-full overflow-x-auto py-2">
      <nav
        className="flex min-w-max items-center gap-1.5 rounded-xl border border-slate-800/80 bg-[#0b1120]/80 p-1 backdrop-blur-md"
        aria-label="Analytics sections"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70",
                isActive
                  ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/30"
                  : "font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
