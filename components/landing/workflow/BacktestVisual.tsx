"use client";

import React from "react";
import { motion } from "framer-motion";
import { PlayCircle, TrendingUp, Award, CheckCircle } from "lucide-react";

export default function BacktestVisual() {
  return (
    <div className="relative flex h-[460px] sm:h-[490px] w-full flex-col justify-between rounded-2xl bg-[#090E17] p-4 sm:p-5 text-white border border-slate-800 shadow-2xl overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(23,105,255,0.12)_0,transparent_60%)]" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <PlayCircle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">
              HISTORICAL SIMULATION ENGINE
            </div>
            <div className="text-[11px] text-slate-400">
              Period: 2021 – 2025 · Fills: t+1 Open · Friction: 5 bps
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-[#1769FF]" />
            <span className="text-blue-300 font-bold">Strategy (+24.8%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-full bg-slate-500" />
            <span className="text-slate-400">Benchmark (+16.2%)</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Cumulative Return</div>
          <div className="text-base font-mono font-bold text-emerald-400">+24.8%</div>
          <div className="text-[9px] text-slate-500">Alpha: +8.6% vs SPY</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Sharpe Ratio</div>
          <div className="text-base font-mono font-bold text-blue-400">1.42</div>
          <div className="text-[9px] text-slate-500">Sortino: 2.10</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Max Drawdown</div>
          <div className="text-base font-mono font-bold text-rose-400">-8.4%</div>
          <div className="text-[9px] text-slate-500">Benchmark: -18.2%</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Win Rate</div>
          <div className="text-base font-mono font-bold text-white">64.2%</div>
          <div className="text-[9px] text-slate-500">Profit Factor: 2.18</div>
        </div>
      </div>

      {/* Main Equity Curve Canvas */}
      <div className="relative z-10 my-auto h-[200px] w-full">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="w-full border-b border-slate-700" />
          <div className="w-full border-b border-slate-700" />
          <div className="w-full border-b border-slate-700" />
          <div className="w-full border-b border-slate-700" />
        </div>

        <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 200">
          <defs>
            <linearGradient id="stratArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1769FF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1769FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Benchmark Curve (Gray Dashed) */}
          <path
            d="M 0 160 C 80 155, 140 170, 200 150 C 260 130, 320 145, 380 120 C 440 95, 520 110, 600 80"
            fill="none"
            stroke="#64748B"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.7"
          />

          {/* Strategy Area Shading */}
          <path
            d="M 0 160 C 60 150, 120 140, 180 125 C 240 110, 290 120, 340 90 C 400 60, 480 65, 540 45 L 600 30 L 600 200 L 0 200 Z"
            fill="url(#stratArea)"
          />

          {/* Strategy Equity Line */}
          <path
            d="M 0 160 C 60 150, 120 140, 180 125 C 240 110, 290 120, 340 90 C 400 60, 480 65, 540 45 L 600 30"
            fill="none"
            stroke="#1769FF"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Trade Markers */}
          {/* Green Buy Dots */}
          <circle cx="120" cy="140" r="4.5" fill="#10B981" stroke="#090E17" strokeWidth="2" />
          <circle cx="290" cy="120" r="4.5" fill="#10B981" stroke="#090E17" strokeWidth="2" />
          <circle cx="480" cy="65" r="4.5" fill="#10B981" stroke="#090E17" strokeWidth="2" />

          {/* Red Sell Dots */}
          <circle cx="180" cy="125" r="4.5" fill="#EF4444" stroke="#090E17" strokeWidth="2" />
          <circle cx="340" cy="90" r="4.5" fill="#EF4444" stroke="#090E17" strokeWidth="2" />
          <circle cx="540" cy="45" r="4.5" fill="#EF4444" stroke="#090E17" strokeWidth="2" />
        </svg>

        {/* Trade Marker Callout in Canvas */}
        <div className="absolute right-4 top-2 rounded-lg bg-slate-900/90 border border-slate-800 px-2 py-1 text-[10px] font-mono text-slate-300">
          <span className="text-emerald-400 font-bold">● Buy</span> /{" "}
          <span className="text-rose-400 font-bold">● Exit</span> Execution Points
        </div>
      </div>

      {/* Bottom Compliance & Friction Note */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-blue-400" />
          <span>Friction modeling: 5 bps commission + 2 bps slippage</span>
        </div>
        <span className="font-mono text-[9px] text-slate-500">
          *Illustrative quantitative simulation
        </span>
      </div>
    </div>
  );
}
