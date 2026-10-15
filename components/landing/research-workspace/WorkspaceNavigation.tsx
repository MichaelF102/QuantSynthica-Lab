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
    <div className="relative mt-8 max-w-full px-2 flex justify-center">
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0B1528]/80 backdrop-blur-md overflow-x-auto max-w-full scrollbar-none shadow-xs">
        {WORKSPACE_FEATURES.map((item) => {
          const isActive = activeFeature === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectFeature(item.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? "bg-[#1769FF] text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
