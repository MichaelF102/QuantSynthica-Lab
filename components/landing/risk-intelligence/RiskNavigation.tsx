"use client";

import React from "react";
import { Activity, BarChart3, TrendingDown, Waves, Zap, ChevronRight } from "lucide-react";

export type RiskState = "overview" | "var" | "drawdown" | "volatility" | "stress";

interface RiskNavigationProps {
  activeRisk: RiskState;
  onSelectRisk: (state: RiskState) => void;
}

interface NavItem {
  id: RiskState;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    title: "Risk Overview",
    subtitle: "Portfolio risk at a glance",
    icon: Activity,
    accentColor: "#1769FF",
  },
  {
    id: "var",
    title: "Value at Risk (VaR)",
    subtitle: "Probabilistic risk measures",
    icon: BarChart3,
    accentColor: "#2563EB",
  },
  {
    id: "drawdown",
    title: "Drawdown Analysis",
    subtitle: "Peak to trough and recovery",
    icon: TrendingDown,
    accentColor: "#7C3AED",
  },
  {
    id: "volatility",
    title: "Volatility Analysis",
    subtitle: "Historical and model based",
    icon: Waves,
    accentColor: "#0D9488",
  },
  {
    id: "stress",
    title: "Stress Testing",
    subtitle: "Extreme market scenarios",
    icon: Zap,
    accentColor: "#EF4444",
  },
];

export default function RiskNavigation({ activeRisk, onSelectRisk }: RiskNavigationProps) {
  return (
    <div className="w-full lg:w-[280px] shrink-0">
      <div className="bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeRisk === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectRisk(item.id)}
              className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-blue-50/90 dark:bg-blue-950/50 text-[#1769FF] dark:text-blue-400 font-semibold shadow-2xs border border-blue-100/80 dark:border-blue-900/50"
                  : "text-[#526174] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[#0B1220] dark:hover:text-white border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-[#1769FF] text-white shadow-xs shadow-blue-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div
                    className={`text-xs font-bold leading-tight truncate ${
                      isActive ? "text-[#1769FF] dark:text-blue-400" : "text-[#0B1220] dark:text-white"
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 leading-tight truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive
                    ? "text-[#1769FF] dark:text-blue-400 translate-x-0.5"
                    : "text-slate-300 dark:text-slate-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
