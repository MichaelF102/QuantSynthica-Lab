"use client";

import React, { useState } from "react";
import { ArrowRight, ChevronRight, TrendingUp } from "lucide-react";

interface StageDetailPanelsProps {
  activeStage: number; // 1 = BUILD, 2 = TEST, 3 = EVALUATE
  onSelectStage: (stage: number) => void;
}

const INDICATORS = [
  { name: "SMA", bg: "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60" },
  { name: "EMA", bg: "bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60" },
  { name: "RSI", bg: "bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/60" },
  { name: "MACD", bg: "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60" },
  { name: "BB", bg: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60" },
  { name: "ATR", bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
  { name: "ADX", bg: "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60" },
  { name: "Stochastic", bg: "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60" },
  { name: "VWAP", bg: "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60" },
];

export default function StageDetailPanels({
  activeStage,
  onSelectStage,
}: StageDetailPanelsProps) {
  return (
    <div
      id="strategy-details"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch select-none"
    >
      {/* ============================================================ */}
      {/* 01 BUILD STRATEGY CARD */}
      {/* ============================================================ */}
      <div
        onClick={() => onSelectStage(1)}
        className={`group flex flex-col justify-between rounded-3xl border bg-white dark:bg-[#0B1528] p-5 sm:p-6 transition-all duration-200 cursor-pointer ${
          activeStage === 1
            ? "border-cyan-500 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/20 -translate-y-1"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-cyan-300 dark:hover:border-cyan-700 hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-[13px] font-black font-mono transition-colors ${
                  activeStage === 1
                    ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                    : "bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400"
                }`}
              >
                01
              </span>
              <div>
                <h3 className="text-[17px] font-bold text-[#0B1220] dark:text-white leading-tight">
                  Build Strategy
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Turn an idea into explicit, testable rules.
                </p>
              </div>
            </div>

            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                activeStage === 1
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {/* Card Content Grid: Strategy Logic (Left) & Technical Indicators (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Strategy Logic Table */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                STRATEGY LOGIC (EXAMPLE)
              </div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Entry</span>
                  <span className="font-bold text-[#0B1220] dark:text-white">RSI &gt; 50</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Exit</span>
                  <span className="font-bold text-[#0B1220] dark:text-white">SMA 20 &lt; SMA 50</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Position Size</span>
                  <span className="font-bold text-[#0B1220] dark:text-white">10% of capital</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Stop Loss</span>
                  <span className="font-bold text-rose-500">5%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 dark:text-slate-400">Rebalance</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Monthly</span>
                </div>
              </div>
            </div>

            {/* Technical Indicators Pill Cloud */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                TECHNICAL INDICATORS
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {INDICATORS.map((ind) => (
                  <div
                    key={ind.name}
                    className={`flex items-center justify-center py-1 px-1.5 rounded-lg border text-[10px] font-mono font-bold text-center ${ind.bg}`}
                  >
                    {ind.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 02 TEST ON HISTORICAL DATA CARD */}
      {/* ============================================================ */}
      <div
        onClick={() => onSelectStage(2)}
        className={`group flex flex-col justify-between rounded-3xl border bg-white dark:bg-[#0B1528] p-5 sm:p-6 transition-all duration-200 cursor-pointer ${
          activeStage === 2
            ? "border-purple-500 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/20 -translate-y-1"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-[13px] font-black font-mono transition-colors ${
                  activeStage === 2
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                }`}
              >
                02
              </span>
              <div>
                <h3 className="text-[17px] font-bold text-[#0B1220] dark:text-white leading-tight">
                  Test on Historical Data
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Run the strategy across different market conditions.
                </p>
              </div>
            </div>

            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                activeStage === 2
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {/* Card Content Grid: Backtest Config (Left) & Equity Curve (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Backtest Configuration */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                BACKTEST CONFIGURATION
              </div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Asset</span>
                  <span className="font-bold text-[#0B1220] dark:text-white">NIFTY 50</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Period</span>
                  <span className="font-bold text-[#0B1220] dark:text-white">2015 – 2024</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Initial Capital</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹ 10,00,000</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Transaction Cost</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">0.1%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Slippage</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">0.05%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 dark:text-slate-400">Frequency</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">Daily</span>
                </div>
              </div>
            </div>

            {/* Equity Curve SVG Chart */}
            <div className="flex flex-col justify-between">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                EQUITY CURVE (EXAMPLE)
              </div>
              <div className="relative h-28 w-full bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-2 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col justify-between">
                {/* SVG Curve */}
                <svg className="w-full h-20 overflow-visible" viewBox="0 0 160 60">
                  <defs>
                    <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 52 Q 25 48, 50 36 T 85 24 T 120 16 T 160 5 L 160 60 L 0 60 Z"
                    fill="url(#eqFill)"
                  />
                  <path
                    d="M 0 52 Q 25 48, 50 36 T 85 24 T 120 16 T 160 5"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                  />
                  {/* Buy Marker */}
                  <circle cx="50" cy="36" r="3" fill="#10B981" />
                  {/* Sell Marker */}
                  <circle cx="120" cy="16" r="3" fill="#EF4444" />
                </svg>

                {/* Buy / Sell Floating Badges */}
                <div className="absolute top-5 left-10 px-1 py-0.5 rounded bg-emerald-500 text-white font-mono text-[8px] font-bold shadow-xs">
                  Buy
                </div>
                <div className="absolute top-2 right-12 px-1 py-0.5 rounded bg-rose-500 text-white font-mono text-[8px] font-bold shadow-xs">
                  Sell
                </div>

                {/* X Axis Timeline Labels */}
                <div className="flex justify-between text-[8px] font-mono text-slate-400 dark:text-slate-500 pt-1">
                  <span>2015</span>
                  <span>2017</span>
                  <span>2019</span>
                  <span>2021</span>
                  <span>2023</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 03 EVALUATE RESULTS CARD */}
      {/* ============================================================ */}
      <div
        onClick={() => onSelectStage(3)}
        className={`group flex flex-col justify-between rounded-3xl border bg-white dark:bg-[#0B1528] p-5 sm:p-6 transition-all duration-200 cursor-pointer ${
          activeStage === 3
            ? "border-teal-500 shadow-xl shadow-teal-500/10 ring-2 ring-teal-500/20 -translate-y-1"
            : "border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-[13px] font-black font-mono transition-colors ${
                  activeStage === 3
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                    : "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400"
                }`}
              >
                03
              </span>
              <div>
                <h3 className="text-[17px] font-bold text-[#0B1220] dark:text-white leading-tight">
                  Evaluate Results
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Measure performance, risk and robustness.
                </p>
              </div>
            </div>

            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                activeStage === 3
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {/* Card Content Grid: Key Metrics (Left) & Risk Profile Radar (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Key Metrics Table */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                KEY METRICS (EXAMPLE)
              </div>
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">CAGR</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+18.4% &gt;</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Sharpe Ratio</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">1.42 &gt;</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Max Drawdown</span>
                  <span className="font-bold text-rose-500">-12.3%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Volatility</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">15.8%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Win Rate</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">61.4%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 dark:text-slate-400">Total Trades</span>
                  <span className="font-bold text-slate-900 dark:text-white">248 &gt;</span>
                </div>
              </div>
            </div>

            {/* Risk Profile Radar Chart */}
            <div className="flex flex-col justify-between">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                RISK PROFILE
              </div>
              <div className="relative h-28 w-full bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-1 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                <svg className="w-24 h-24 overflow-visible" viewBox="0 0 100 100">
                  {/* Outer Hexagon Grid */}
                  <polygon
                    points="50,10 85,30 85,70 50,90 15,70 15,30"
                    fill="none"
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth="1"
                  />
                  {/* Middle Hexagon Grid */}
                  <polygon
                    points="50,25 72,38 72,62 50,75 28,62 28,38"
                    fill="none"
                    className="stroke-slate-300 dark:stroke-slate-700"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  {/* Active Radar Shape */}
                  <polygon
                    points="50,15 78,35 68,66 50,72 24,58 22,34"
                    fill="rgba(20, 184, 166, 0.25)"
                    stroke="#0D9488"
                    strokeWidth="1.8"
                  />
                  {/* Axis Spokes */}
                  <line x1="50" y1="50" x2="50" y2="10" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.8" />
                  <line x1="50" y1="50" x2="85" y2="30" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.8" />
                  <line x1="50" y1="50" x2="85" y2="70" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.8" />
                  <line x1="50" y1="50" x2="50" y2="90" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.8" />
                  <line x1="50" y1="50" x2="15" y2="70" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.8" />
                  <line x1="50" y1="50" x2="15" y2="30" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.8" />

                  {/* Radar Axis Labels */}
                  <text x="50" y="6" textAnchor="middle" fontSize="6.5" className="fill-slate-500 dark:fill-slate-400 font-mono">Return</text>
                  <text x="88" y="32" textAnchor="start" fontSize="6" className="fill-slate-500 dark:fill-slate-400 font-mono">Sharpe</text>
                  <text x="88" y="73" textAnchor="start" fontSize="6" className="fill-slate-500 dark:fill-slate-400 font-mono">Stability</text>
                  <text x="50" y="97" textAnchor="middle" fontSize="6" className="fill-slate-500 dark:fill-slate-400 font-mono">Drawdown</text>
                  <text x="12" y="73" textAnchor="end" fontSize="6" className="fill-slate-500 dark:fill-slate-400 font-mono">Consistency</text>
                  <text x="12" y="32" textAnchor="end" fontSize="6" className="fill-slate-500 dark:fill-slate-400 font-mono">Profit Factor</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
