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

const TABS: { key: AnalyticsTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
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
    <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-border/80 pb-0 font-sans text-xs">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-2.5 font-medium transition-all ${
              isActive
                ? "bg-surface-active/40 font-semibold text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 ${
                isActive ? "text-brand-amber" : "text-stone-500"
              }`}
            />
            <span>{tab.label}</span>
            {isActive && (
              <span className="absolute inset-x-3 bottom-0 h-px bg-brand-amber" />
            )}
          </button>
        );
      })}
    </div>
  );
}
