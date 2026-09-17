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
} from "lucide-react";

export type AnalyticsTabKey =
  | "Overview"
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

const TABS: { key: AnalyticsTabKey; label: string; icon: React.ElementType }[] = [
  { key: "Overview", label: "Overview", icon: LayoutDashboard },
  { key: "Performance", label: "Performance", icon: TrendingUp },
  { key: "Risk", label: "Risk", icon: ShieldAlert },
  { key: "Trades", label: "Trades", icon: ArrowLeftRight },
  { key: "Regimes", label: "Regimes", icon: Gauge },
  { key: "Factors", label: "Factors", icon: Sliders },
  { key: "Robustness", label: "Robustness", icon: Sparkles },
  { key: "Attribution", label: "Attribution", icon: GitMerge },
];

export default function AnalyticsSubNav({
  activeTab,
  onTabChange,
}: AnalyticsSubNavProps) {
  return (
    <div className="flex items-center space-x-1 overflow-x-auto border-b border-[#1E2530] scrollbar-none pb-0 text-xs font-sans">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-medium transition-all whitespace-nowrap ${
              isActive
                ? "border-[#38BDF8] text-white font-semibold bg-[#131822]/40"
                : "border-transparent text-[#89919C] hover:text-slate-200 hover:border-[#252E3E]"
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${
                isActive ? "text-[#38BDF8]" : "text-[#59616B]"
              }`}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
