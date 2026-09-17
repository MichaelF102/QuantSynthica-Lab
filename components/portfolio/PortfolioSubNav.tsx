"use client";

import React from "react";
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  PieChart,
  Network,
  Flame,
  Layers,
} from "lucide-react";

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

const TABS: { id: PortfolioTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "Overview", label: "Overview", icon: BarChart3 },
  { id: "Performance", label: "Performance", icon: TrendingUp },
  { id: "Risk Metrics", label: "Risk Metrics", icon: ShieldAlert },
  { id: "Allocation", label: "Allocation", icon: PieChart },
  { id: "Correlation", label: "Correlation", icon: Network },
  { id: "Stress Test", label: "Stress Test", icon: Flame },
  { id: "Scenario Analysis", label: "Scenario Analysis", icon: Layers },
];

export default function PortfolioSubNav({
  activeTab,
  onTabChange,
}: PortfolioSubNavProps) {
  return (
    <div className="flex items-center space-x-1 border-b border-[#1E2530] pb-2 overflow-x-auto scrollbar-none">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
              isActive
                ? "bg-[#141E2C] text-white border border-[#23354E] shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#0E1520] border border-transparent"
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${
                isActive ? "text-[#38BDF8]" : "text-slate-500"
              }`}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
