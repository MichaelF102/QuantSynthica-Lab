"use client";

import React from "react";
import { BarChart3, TrendingDown, Waves, Zap } from "lucide-react";
import { RiskState } from "./RiskNavigation";

interface RiskMetricsProps {
  activeRisk: RiskState;
  onSelectRisk: (state: RiskState) => void;
}

export default function RiskMetrics({ activeRisk, onSelectRisk }: RiskMetricsProps) {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* ============================================================ */}
      {/* CARD 1: VALUE AT RISK (VaR) */}
      {/* ============================================================ */}
      <div
        onClick={() => onSelectRisk("var")}
        className={`p-5 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
          activeRisk === "var"
            ? "border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Value at Risk (VaR)</h4>
              <p className="text-[10px] text-[#64748B] dark:text-slate-400 leading-tight">Potential loss at a given confidence level</p>
            </div>
          </div>

          {/* Mini Gaussian Distribution SVG */}
          <div className="my-3 h-20 w-full flex items-center justify-center">
            <svg viewBox="0 0 160 65" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="varGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
                  <stop offset="35%" stopColor="#3B82F6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Baseline */}
              <line x1="10" y1="58" x2="150" y2="58" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
              {/* Bell Curve */}
              <path
                d="M 10 58 C 35 58, 45 52, 60 30 C 72 10, 88 10, 100 30 C 115 52, 125 58, 150 58"
                fill="none"
                stroke="#1769FF"
                strokeWidth="1.5"
              />
              {/* Shaded Tail Area (95% & 99%) */}
              <path
                d="M 10 58 C 25 58, 35 55, 45 42 L 45 58 Z"
                fill="url(#varGrad)"
              />
              {/* Threshold Lines */}
              <line x1="45" y1="20" x2="45" y2="58" stroke="#1E40AF" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="30" y1="36" x2="30" y2="58" stroke="#DC2626" strokeWidth="1" strokeDasharray="2,2" />
              {/* Marker labels */}
              <text x="45" y="16" fontSize="7" fill="#1E40AF" textAnchor="middle" fontWeight="bold">95%</text>
              <text x="28" y="32" fontSize="7" fill="#DC2626" textAnchor="middle" fontWeight="bold">99%</text>
            </svg>
          </div>
        </div>

        {/* Metrics Rows */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">95% VaR</span>
            <span className="font-bold text-[#0B1220] dark:text-white">-3.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">99% VaR</span>
            <span className="font-bold text-[#0B1220] dark:text-white">-5.7%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">Expected Shortfall</span>
            <span className="font-bold text-rose-600">-6.8%</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CARD 2: DRAWDOWN ANALYSIS */}
      {/* ============================================================ */}
      <div
        onClick={() => onSelectRisk("drawdown")}
        className={`p-5 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
          activeRisk === "drawdown"
            ? "border-purple-500 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/30"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-700"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Drawdown Analysis</h4>
              <p className="text-[10px] text-[#64748B] dark:text-slate-400 leading-tight">Peak to trough drawdowns and recovery</p>
            </div>
          </div>

          {/* Underwater Drawdown Curve */}
          <div className="my-3 h-20 w-full flex items-center justify-center">
            <svg viewBox="0 0 160 65" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="ddGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F87171" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.75" />
                </linearGradient>
              </defs>
              {/* Baseline 0% */}
              <line x1="5" y1="12" x2="155" y2="12" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" />
              <text x="145" y="10" fontSize="7" fill="#94A3B8" textAnchor="end">0%</text>

              {/* Drawdown Polygon */}
              <path
                d="M 5 12 Q 18 12, 25 24 T 40 38 T 52 14 T 68 50 T 80 18 T 98 42 T 115 15 T 130 28 T 155 12 L 155 12 L 5 12 Z"
                fill="url(#ddGrad)"
                stroke="#EF4444"
                strokeWidth="1.5"
              />
              {/* Max DD marker */}
              <circle cx="68" cy="50" r="3" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1" />
              <text x="68" y="60" fontSize="7" fill="#DC2626" textAnchor="middle" fontWeight="bold">-11.4%</text>
            </svg>
          </div>
        </div>

        {/* Metrics Rows */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">Max Drawdown</span>
            <span className="font-bold text-rose-600">-11.4%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">Average Drawdown</span>
            <span className="font-bold text-[#0B1220] dark:text-white">-4.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">Recovery Time</span>
            <span className="font-bold text-[#0B1220] dark:text-white">38 days</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CARD 3: VOLATILITY ANALYSIS */}
      {/* ============================================================ */}
      <div
        onClick={() => onSelectRisk("volatility")}
        className={`p-5 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
          activeRisk === "volatility"
            ? "border-teal-500 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/30"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-teal-300 dark:hover:border-teal-700"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Waves className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Volatility Analysis</h4>
              <p className="text-[10px] text-[#64748B] dark:text-slate-400 leading-tight">Historical and forecasted volatility</p>
            </div>
          </div>

          {/* Volatility Waveform */}
          <div className="my-3 h-20 w-full flex items-center justify-center">
            <svg viewBox="0 0 160 65" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="volGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {/* Lower baseline */}
              <line x1="5" y1="58" x2="155" y2="58" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
              {/* Filled Waveform */}
              <path
                d="M 5 44 C 18 36, 25 50, 40 38 C 55 24, 68 42, 85 26 C 98 16, 115 35, 130 20 C 142 30, 148 22, 155 18 L 155 58 L 5 58 Z"
                fill="url(#volGrad)"
              />
              {/* Primary Curve */}
              <path
                d="M 5 44 C 18 36, 25 50, 40 38 C 55 24, 68 42, 85 26 C 98 16, 115 35, 130 20 C 142 30, 148 22, 155 18"
                fill="none"
                stroke="#6366F1"
                strokeWidth="1.6"
              />
              {/* 30D Secondary Curve */}
              <path
                d="M 5 48 C 22 42, 35 46, 50 35 C 70 28, 85 36, 105 28 C 120 22, 140 26, 155 22"
                fill="none"
                stroke="#A855F7"
                strokeWidth="1.2"
                strokeDasharray="2,2"
              />
            </svg>
          </div>
        </div>

        {/* Metrics Rows */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">Current</span>
            <span className="font-bold text-[#0B1220] dark:text-white">24.8%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">30D Average</span>
            <span className="font-bold text-[#0B1220] dark:text-white">22.1%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">90D / 1Y</span>
            <span className="font-bold text-[#0B1220] dark:text-white">19.6% / 21.4%</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CARD 4: STRESS TESTING */}
      {/* ============================================================ */}
      <div
        onClick={() => onSelectRisk("stress")}
        className={`p-5 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
          activeRisk === "stress"
            ? "border-rose-500 shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-rose-300 dark:hover:border-rose-700"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Stress Testing</h4>
              <p className="text-[10px] text-[#64748B] dark:text-slate-400 leading-tight">Simulate extreme market conditions</p>
            </div>
          </div>

          {/* Scenario Impact Bars */}
          <div className="my-3 h-20 w-full flex items-end justify-between gap-2 px-1">
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400">-15%</span>
              <div className="w-full bg-rose-400 rounded-t-sm" style={{ height: "42px" }} />
              <span className="text-[7.5px] text-slate-500 dark:text-slate-400 truncate text-center leading-tight">Crash</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[8px] font-bold text-rose-500 dark:text-rose-400">-8%</span>
              <div className="w-full bg-rose-300 rounded-t-sm" style={{ height: "24px" }} />
              <span className="text-[7.5px] text-slate-500 dark:text-slate-400 truncate text-center leading-tight">Rates</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[8px] font-bold text-rose-500 dark:text-rose-400">-12%</span>
              <div className="w-full bg-rose-400 rounded-t-sm" style={{ height: "35px" }} />
              <span className="text-[7.5px] text-slate-500 dark:text-slate-400 truncate text-center leading-tight">Vol</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[8px] font-bold text-rose-700 dark:text-rose-400">-20%</span>
              <div className="w-full bg-rose-500 rounded-t-sm" style={{ height: "54px" }} />
              <span className="text-[7.5px] text-slate-500 dark:text-slate-400 truncate text-center leading-tight">Liquidity</span>
            </div>
          </div>
        </div>

        {/* Metrics Rows */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">Market Crash</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">-15%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">Rate Shock (+200 bps)</span>
            <span className="font-bold text-[#0B1220] dark:text-white">-8%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] dark:text-slate-400">Liquidity Freeze</span>
            <span className="font-bold text-rose-700 dark:text-rose-400">-20%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
