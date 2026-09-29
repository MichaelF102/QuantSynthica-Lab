"use client";

import React from "react";
import {
  CandlestickChart,
  Sigma,
  Activity,
  Layers,
  ArrowRight,
  GitBranch,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

export type LabId =
  | "technical"
  | "statistical"
  | "timeseries"
  | "volatility"
  | "options"
  | "factors";

export interface LabItem {
  id: LabId;
  num: string;
  title: string;
  description: string;
  pills: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export const LAB_ITEMS: LabItem[] = [
  {
    id: "technical",
    num: "01",
    title: "Technical Analysis",
    description:
      "Understand price behaviour with 100+ technical indicators and charting tools.",
    pills: ["RSI", "MACD", "Bollinger", "ATR", "ADX"],
    icon: CandlestickChart,
  },
  {
    id: "statistical",
    num: "02",
    title: "Statistical Analysis",
    description:
      "Explore statistical tools for correlation, regression and distribution analysis.",
    pills: ["Regression", "Correlation", "PCA", "Hypothesis"],
    icon: Sigma,
  },
  {
    id: "timeseries",
    num: "03",
    title: "Time Series Lab",
    description:
      "Forecast and model time series using ARIMA, SARIMA, GARCH and more.",
    pills: ["ARIMA", "SARIMA", "GARCH", "HMM"],
    icon: Activity,
  },
  {
    id: "volatility",
    num: "04",
    title: "Volatility Lab",
    description:
      "Model and forecast volatility using GARCH, EGARCH and advanced methods.",
    pills: ["GARCH", "EGARCH", "HMM", "Realized"],
    icon: TrendingUp,
  },
  {
    id: "options",
    num: "05",
    title: "Options Lab",
    description:
      "Analyze options chains, Greeks, volatility surface and options strategies.",
    pills: ["Options Chain", "Greeks", "IV Surface", "Strategies"],
    icon: GitBranch,
  },
  {
    id: "factors",
    num: "06",
    title: "Factor Research",
    description:
      "Build and analyze multi-factor models and asset pricing frameworks.",
    pills: ["Momentum", "Value", "Quality", "Size"],
    icon: Layers,
  },
];

interface LabMatrixProps {
  activeLab: LabId;
  onSelectLab: (lab: LabId) => void;
}

export default function LabMatrix({ activeLab, onSelectLab }: LabMatrixProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {LAB_ITEMS.map((lab) => {
        const isActive = activeLab === lab.id;
        const Icon = lab.icon;

        return (
          <button
            key={lab.id}
            onClick={() => onSelectLab(lab.id)}
            className={`group relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-[#0B1528] p-5 text-left transition-all duration-200 hover:-translate-y-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#1769FF]/50 ${
              isActive
                ? "border-[#1769FF] shadow-lg shadow-blue-500/10 ring-1 ring-[#1769FF]/20"
                : "border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
            }`}
          >
            {/* Active Pill Layout Indicator */}
            {isActive && (
              <motion.div
                layoutId="active-lab-border"
                className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-[#1769FF]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            {/* Top Row: Number & Icon */}
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                {lab.num}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>

            {/* Mini Visualization Thumbnail */}
            <div className="mt-3.5 mb-2 h-18 w-full overflow-hidden rounded-lg bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03]">
              {lab.id === "technical" && (
                <div className="flex h-12 items-end gap-1.5 px-2">
                  {[20, 28, 22, 34, 30, 42, 36, 48, 44].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}px` }}
                      className={`w-2 rounded-2xs ${
                        i % 2 === 0 ? "bg-[#00C896]" : "bg-[#FF4D5A]"
                      }`}
                    />
                  ))}
                </div>
              )}

              {lab.id === "statistical" && (
                <div className="relative h-14 w-full px-3 py-1">
                  <svg viewBox="0 0 120 40" className="h-full w-full">
                    {/* Scatter dots */}
                    {[
                      [15, 32],
                      [25, 28],
                      [35, 30],
                      [45, 22],
                      [55, 25],
                      [65, 18],
                      [75, 14],
                      [85, 16],
                      [95, 10],
                      [105, 8],
                    ].map(([cx, cy], i) => (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="2.2"
                        fill="#3B82F6"
                        opacity={0.8}
                      />
                    ))}
                    {/* Linear Regression Line */}
                    <line
                      x1="10"
                      y1="36"
                      x2="110"
                      y2="6"
                      stroke="#1769FF"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}

              {lab.id === "timeseries" && (
                <div className="relative h-14 w-full px-3 py-1">
                  <svg viewBox="0 0 120 40" className="h-full w-full">
                    {/* Confidence interval fan */}
                    <polygon
                      points="65,18 115,4 115,34 65,18"
                      fill="rgba(59, 130, 246, 0.18)"
                    />
                    {/* Historical time series */}
                    <path
                      d="M 5 28 Q 20 18, 35 25 T 65 18"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />
                    {/* Forecast dotted continuation */}
                    <path
                      d="M 65 18 Q 90 14, 115 16"
                      fill="none"
                      stroke="#1769FF"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                  </svg>
                </div>
              )}

              {lab.id === "volatility" && (
                <div className="relative h-14 w-full px-2">
                  <svg viewBox="0 0 120 40" className="h-full w-full">
                    {/* Realized Volatility Cluster */}
                    <path
                      d="M 5 36 L 15 32 L 25 35 L 35 15 L 42 34 L 50 10 L 58 36 L 68 8 L 76 34 L 88 18 L 98 32 L 115 35"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              )}

              {lab.id === "options" && (
                <div className="relative h-14 w-full px-2 flex items-center justify-center">
                  <svg viewBox="0 0 100 40" className="h-full w-full">
                    {/* 3D Volatility Surface Isometric Mesh */}
                    <path
                      d="M 10 32 Q 40 12, 70 24 T 95 14"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M 15 36 Q 45 16, 75 28 T 98 20"
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 5 28 Q 35 8, 65 20 T 90 8"
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="1.2"
                      opacity="0.7"
                    />
                  </svg>
                </div>
              )}

              {lab.id === "factors" && (
                <div className="flex h-12 items-end justify-center gap-1.5 px-2">
                  {[
                    { h: 32, c: "bg-blue-600" },
                    { h: 42, c: "bg-blue-400" },
                    { h: 22, c: "bg-amber-400" },
                    { h: 36, c: "bg-indigo-500" },
                    { h: 18, c: "bg-slate-400" },
                    { h: 38, c: "bg-blue-500" },
                  ].map((bar, i) => (
                    <div
                      key={i}
                      style={{ height: `${bar.h}px` }}
                      className={`w-2.5 rounded-t-xs ${bar.c}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Title & Arrow */}
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#0B1220] dark:text-white group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors">
                {lab.title}
              </h3>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[#1769FF] text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-[#1769FF] dark:group-hover:text-blue-400 group-hover:translate-x-1"
                }`}
              >
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Description */}
            <p className="mt-2 text-[12px] leading-relaxed text-[#64748B] dark:text-slate-400">
              {lab.description}
            </p>

            {/* Technique Pills */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {lab.pills.map((pill) => (
                <span
                  key={pill}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700/70"
                  }`}
                >
                  {pill}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
