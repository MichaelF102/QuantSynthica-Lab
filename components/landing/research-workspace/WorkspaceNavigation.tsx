"use client";

import React from "react";
import {
  BarChart3,
  FlaskConical,
  Play,
  ChartNoAxesCombined,
  PieChart,
  ShieldCheck,
  GitCompare,
  FileText,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

export type WorkspaceFeatureKey =
  | "charts"
  | "strategy"
  | "backtesting"
  | "analytics"
  | "portfolio"
  | "risk"
  | "options"
  | "research";

export interface FeatureItem {
  id: WorkspaceFeatureKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WORKSPACE_FEATURES: FeatureItem[] = [
  {
    id: "charts",
    title: "Charts",
    description: "Advanced charting with 100+ indicators",
    icon: BarChart3,
  },
  {
    id: "strategy",
    title: "Strategy Lab",
    description: "Build systematic trading strategies",
    icon: FlaskConical,
  },
  {
    id: "backtesting",
    title: "Backtesting",
    description: "Test ideas on historical data",
    icon: Play,
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Deep performance and factor analysis",
    icon: ChartNoAxesCombined,
  },
  {
    id: "portfolio",
    title: "Portfolio",
    description: "Construct and optimize portfolios",
    icon: PieChart,
  },
  {
    id: "risk",
    title: "Risk",
    description: "Measure and manage risk",
    icon: ShieldCheck,
  },
  {
    id: "options",
    title: "Options",
    description: "Options chains, volatility and Greeks",
    icon: GitCompare,
  },
  {
    id: "research",
    title: "Research",
    description: "Save, share and reproduce research",
    icon: FileText,
  },
];

interface WorkspaceNavigationProps {
  activeFeature: WorkspaceFeatureKey;
  onSelectFeature: (feature: WorkspaceFeatureKey) => void;
}

export default function WorkspaceNavigation({
  activeFeature,
  onSelectFeature,
}: WorkspaceNavigationProps) {
  return (
    <div className="relative mt-6 max-w-[480px]">
      {/* Delicate Vertical Guide Line */}
      <div className="absolute left-[19px] top-4 bottom-5 w-px bg-slate-200/90 dark:bg-slate-800 z-0" />

      <div className="flex flex-col space-y-1.5 relative z-10">
        {WORKSPACE_FEATURES.map((item) => {
          const isActive = activeFeature === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectFeature(item.id)}
              className="group relative flex w-full items-center gap-3.5 rounded-xl px-2 py-2 text-left transition-all duration-200 cursor-pointer"
            >
              {/* Timeline Node Dot */}
              <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-[#1769FF] ring-4 ring-blue-100 dark:ring-blue-950/60 scale-110"
                      : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-600 group-hover:scale-105"
                  }`}
                />
              </div>

              {/* Active Animated Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="workspace-active"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute inset-y-0 right-0 left-9 rounded-xl border border-blue-200/80 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/40 shadow-xs"
                />
              )}

              {/* Inactive Hover Background */}
              {!isActive && (
                <div className="absolute inset-y-0 right-0 left-9 rounded-xl bg-transparent transition-colors duration-150 group-hover:bg-slate-100/60 dark:group-hover:bg-slate-800/40" />
              )}

              {/* Content Container */}
              <div className="relative z-10 flex flex-1 items-center justify-between pr-3 pl-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-white border border-blue-200 text-[#1769FF] dark:bg-[#0B1528] dark:border-blue-800 dark:text-blue-400 shadow-2xs"
                        : "bg-slate-100/80 text-slate-500 group-hover:text-slate-800 dark:bg-slate-800/80 dark:text-slate-400 dark:group-hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div
                      className={`text-[14px] font-semibold tracking-tight transition-colors ${
                        isActive
                          ? "text-[#0B1220] dark:text-white"
                          : "text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="text-[12px] text-slate-400 dark:text-slate-500 font-normal leading-tight group-hover:text-slate-500 dark:group-hover:text-slate-400">
                      {item.description}
                    </div>
                  </div>
                </div>

                {/* Active Chevron Arrow */}
                <div
                  className={`transition-all duration-200 ${
                    isActive
                      ? "opacity-100 translate-x-0 text-[#1769FF] dark:text-blue-400"
                      : "opacity-0 -translate-x-2 text-slate-400"
                  }`}
                >
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
