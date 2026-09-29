"use client";

import React from "react";
import {
  BarChart3,
  FlaskConical,
  Play,
  ShieldCheck,
  PieChart,
  GitCompare,
  ArrowRight,
} from "lucide-react";
import { WorkspaceFeatureKey } from "./WorkspaceNavigation";

interface WorkspaceFeatureRailProps {
  activeFeature: WorkspaceFeatureKey;
  onSelectFeature: (feature: WorkspaceFeatureKey) => void;
}

export default function WorkspaceFeatureRail({
  activeFeature,
  onSelectFeature,
}: WorkspaceFeatureRailProps) {
  return (
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Advanced Charting */}
      <button
        onClick={() => onSelectFeature("charts")}
        className={`group flex flex-col justify-between rounded-xl border bg-white dark:bg-[#0B1528] p-4 text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer ${
          activeFeature === "charts"
            ? "border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-md"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs"
        }`}
      >
        {/* Preview Visualization */}
        <div className="h-20 w-full rounded-lg bg-[#0B1220] p-2 flex flex-col justify-between overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
          <div className="flex h-11 items-end gap-1 px-1">
            {[14, 22, 18, 28, 25, 32, 29, 36, 42, 38, 45].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}px` }}
                className={`flex-1 rounded-2xs ${
                  i % 2 === 0 ? "bg-[#00C896]" : "bg-[#FF4D5A]"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 border-t border-white/[0.08] pt-1">
            <span className="text-blue-400">RSI 58.2</span>
            <span className="text-emerald-400">MACD +1.23</span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[13px] font-bold text-[#0B1220] dark:text-white">
              Advanced Charting
            </h4>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            100+ technical indicators, drawing tools and multiple timeframes.
          </p>
        </div>

        {/* Footer Arrow */}
        <div className="mt-3 flex items-center justify-end text-slate-400 group-hover:text-[#1769FF]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {/* 2. Strategy Builder */}
      <button
        onClick={() => onSelectFeature("strategy")}
        className={`group flex flex-col justify-between rounded-xl border bg-white dark:bg-[#0B1528] p-4 text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer ${
          activeFeature === "strategy"
            ? "border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-md"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs"
        }`}
      >
        {/* Preview Visualization */}
        <div className="h-20 w-full rounded-lg bg-slate-50 dark:bg-[#070D18] border border-slate-200/80 dark:border-slate-800 p-2 flex flex-col justify-center items-center gap-1.5 overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="rounded bg-blue-100/80 dark:bg-blue-950/60 px-1.5 py-0.5 text-blue-700 dark:text-blue-300 font-semibold">
              Price &gt; EMA 50
            </span>
            <span className="rounded bg-emerald-500 text-white px-1.5 py-0.5 font-bold">
              BUY
            </span>
          </div>
          <div className="flex items-center gap-1 text-[8px] text-slate-400 dark:text-slate-500">
            <span>Exit Rule:</span>
            <span className="font-mono text-rose-500 font-bold">Price &lt; EMA 20</span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
              <FlaskConical className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[13px] font-bold text-[#0B1220] dark:text-white">
              Strategy Builder
            </h4>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            Create and test systematic trading strategies with a no-code workflow.
          </p>
        </div>

        {/* Footer Arrow */}
        <div className="mt-3 flex items-center justify-end text-slate-400 group-hover:text-[#1769FF]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {/* 3. Backtesting Engine */}
      <button
        onClick={() => onSelectFeature("backtesting")}
        className={`group flex flex-col justify-between rounded-xl border bg-white dark:bg-[#0B1528] p-4 text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer ${
          activeFeature === "backtesting"
            ? "border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-md"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs"
        }`}
      >
        {/* Preview Visualization */}
        <div className="h-20 w-full rounded-lg bg-[#0B1220] p-2 flex flex-col justify-between overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
          <svg viewBox="0 0 100 40" className="h-10 w-full overflow-visible">
            <path
              d="M 0 35 Q 25 32, 50 25 T 100 16"
              fill="none"
              stroke="#64748B"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <path
              d="M 0 35 Q 20 28, 45 18 T 100 6"
              fill="none"
              stroke="#1769FF"
              strokeWidth="2"
            />
          </svg>
          <div className="flex items-center justify-between text-[8px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-slate-400" /> Benchmark +16.2%
            </span>
            <span className="text-emerald-400 font-bold">+24.8%</span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
              <Play className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[13px] font-bold text-[#0B1220] dark:text-white">
              Backtesting Engine
            </h4>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            Evaluate strategy performance across historical periods with detailed analytics.
          </p>
        </div>

        {/* Footer Arrow */}
        <div className="mt-3 flex items-center justify-end text-slate-400 group-hover:text-[#1769FF]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {/* 4. Risk Analytics */}
      <button
        onClick={() => onSelectFeature("risk")}
        className={`group flex flex-col justify-between rounded-xl border bg-white dark:bg-[#0B1528] p-4 text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer ${
          activeFeature === "risk"
            ? "border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-md"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs"
        }`}
      >
        {/* Preview Visualization */}
        <div className="h-20 w-full rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-2 flex flex-col justify-between overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
          <div className="flex justify-between items-center text-[8px] font-semibold text-rose-600 dark:text-rose-400">
            <span>Underwater Drawdown</span>
            <span className="font-bold">-12.4%</span>
          </div>
          <svg viewBox="0 0 100 30" className="h-8 w-full overflow-visible">
            <path
              d="M 0 4 Q 20 8, 40 22 T 70 8 T 100 18 L 100 0 L 0 0 Z"
              fill="rgba(244, 63, 94, 0.2)"
            />
            <path
              d="M 0 4 Q 20 8, 40 22 T 70 8 T 100 18"
              fill="none"
              stroke="#F43F5E"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Info */}
        <div className="mt-3.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[13px] font-bold text-[#0B1220] dark:text-white">
              Risk Analytics
            </h4>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            Measure volatility, drawdowns, VaR, exposure and correlation across assets.
          </p>
        </div>

        {/* Footer Arrow */}
        <div className="mt-3 flex items-center justify-end text-slate-400 group-hover:text-[#1769FF]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {/* 5. Portfolio Construction */}
      <button
        onClick={() => onSelectFeature("portfolio")}
        className={`group flex flex-col justify-between rounded-xl border bg-white dark:bg-[#0B1528] p-4 text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer ${
          activeFeature === "portfolio"
            ? "border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-md"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs"
        }`}
      >
        {/* Preview Visualization */}
        <div className="h-20 w-full rounded-lg bg-slate-50 dark:bg-[#070D18] border border-slate-200/80 dark:border-slate-800 p-1.5 flex items-center justify-between gap-1 overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
          <div className="h-14 w-14 flex-shrink-0">
            <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
              <circle cx="20" cy="20" r="14" fill="none" stroke="#2563EB" strokeWidth="6" strokeDasharray="30 88" />
              <circle cx="20" cy="20" r="14" fill="none" stroke="#00C896" strokeWidth="6" strokeDasharray="22 96" strokeDashoffset="-30" />
              <circle cx="20" cy="20" r="14" fill="none" stroke="#8B5CF6" strokeWidth="6" strokeDasharray="20 98" strokeDashoffset="-52" />
              <circle cx="20" cy="20" r="14" fill="none" stroke="#F59E0B" strokeWidth="6" strokeDasharray="16 102" strokeDashoffset="-72" />
            </svg>
          </div>
          <div className="text-[7.5px] font-mono space-y-0.5 pr-1">
            <div className="flex justify-between gap-1 text-slate-600 dark:text-slate-400">
              <span>AAPL</span> <strong className="text-slate-900 dark:text-white">24%</strong>
            </div>
            <div className="flex justify-between gap-1 text-slate-600 dark:text-slate-400">
              <span>RELIANCE</span> <strong className="text-slate-900 dark:text-white">18%</strong>
            </div>
            <div className="flex justify-between gap-1 text-slate-600 dark:text-slate-400">
              <span>MSFT</span> <strong className="text-slate-900 dark:text-white">16%</strong>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
              <PieChart className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[13px] font-bold text-[#0B1220] dark:text-white">
              Portfolio Construction
            </h4>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            Build, optimize and analyze portfolios with institutional-grade tools.
          </p>
        </div>

        {/* Footer Arrow */}
        <div className="mt-3 flex items-center justify-end text-slate-400 group-hover:text-[#1769FF]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {/* 6. Options & Derivatives */}
      <button
        onClick={() => onSelectFeature("options")}
        className={`group flex flex-col justify-between rounded-xl border bg-white dark:bg-[#0B1528] p-4 text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer ${
          activeFeature === "options"
            ? "border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/40 shadow-md"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs"
        }`}
      >
        {/* Preview Visualization */}
        <div className="h-20 w-full rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 p-2 flex flex-col justify-center items-center overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
          <svg viewBox="0 0 100 40" className="h-12 w-full overflow-visible">
            <path
              d="M 10 30 Q 30 10, 50 25 T 90 12"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
            />
            <path
              d="M 10 35 Q 35 15, 60 28 T 90 20"
              fill="none"
              stroke="#818CF8"
              strokeWidth="1.5"
              strokeDasharray="2 3"
            />
            <path
              d="M 15 25 Q 40 5, 65 20 T 85 10"
              fill="none"
              stroke="#6366F1"
              strokeWidth="1"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Info */}
        <div className="mt-3.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
              <GitCompare className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[13px] font-bold text-[#0B1220] dark:text-white">
              Options &amp; Derivatives
            </h4>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            Analyze options chains, volatility, Greeks and build options strategies.
          </p>
        </div>

        {/* Footer Arrow */}
        <div className="mt-3 flex items-center justify-end text-slate-400 group-hover:text-[#1769FF]">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/80 transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>
    </div>
  );
}
