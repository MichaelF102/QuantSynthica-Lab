"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, Activity, BarChart2 } from "lucide-react";

export default function RiskVisual() {
  return (
    <div className="relative flex h-[460px] sm:h-[490px] w-full flex-col justify-between rounded-2xl bg-[#090E17] p-4 sm:p-5 text-white border border-slate-800 shadow-2xl overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.08)_0,transparent_65%)]" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">
              RISK ENGINE & TAIL DEVIATION
            </div>
            <div className="text-[11px] text-slate-400">
              Parametric & Historical VaR · Underwater Drawdown Tracking
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300">
            SOLVENCY CHECK: PASSED
          </span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Max Drawdown</div>
          <div className="text-base font-mono font-bold text-rose-400">-12.4%</div>
          <div className="text-[9px] text-slate-500">Duration: 18 bars</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Annual Volatility</div>
          <div className="text-base font-mono font-bold text-blue-400">18.6%</div>
          <div className="text-[9px] text-slate-500">Benchmark: 15.2%</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">VaR (95% 1-Day)</div>
          <div className="text-base font-mono font-bold text-rose-400">-2.8%</div>
          <div className="text-[9px] text-slate-500">Parametric model</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Beta vs SPY</div>
          <div className="text-base font-mono font-bold text-white">0.92</div>
          <div className="text-[9px] text-slate-500">Correlation: 0.81</div>
        </div>
      </div>

      {/* Dual Coordinated Charts (Underwater DD + VaR Distribution) */}
      <div className="relative z-10 my-auto grid grid-cols-1 sm:grid-cols-12 gap-3 py-1">
        {/* Left: Underwater Drawdown Area (7 cols) */}
        <div className="sm:col-span-7 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span className="text-rose-400 font-bold uppercase">Underwater Drawdown (%)</span>
            <span>Trough: -12.4%</span>
          </div>

          <div className="relative h-[110px] w-full">
            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 350 110">
              <defs>
                <linearGradient id="ddArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* 0% Baseline */}
              <line x1="0" y1="10" x2="350" y2="10" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />

              {/* Drawdown Polygon */}
              <path
                d="M 0 10 L 40 10 L 70 35 L 110 80 L 140 100 L 170 65 L 210 20 L 240 10 L 280 40 L 320 20 L 350 10 L 350 10 L 0 10 Z"
                fill="url(#ddArea)"
              />
              {/* Drawdown Line */}
              <path
                d="M 0 10 L 40 10 L 70 35 L 110 80 L 140 100 L 170 65 L 210 20 L 240 10 L 280 40 L 320 20 L 350 10"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
              />

              {/* Max Drawdown Trough Marker */}
              <circle cx="140" cy="100" r="4" fill="#EF4444" stroke="#090E17" strokeWidth="2" />
            </svg>
            <div className="absolute left-[135px] bottom-1 text-[9px] font-mono text-rose-300">
              -12.4% Peak Drop
            </div>
          </div>
        </div>

        {/* Right: Return Distribution & VaR Cutoff (5 cols) */}
        <div className="sm:col-span-5 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span className="text-blue-400 font-bold uppercase">Return Distribution</span>
            <span className="text-rose-400">VaR -2.8%</span>
          </div>

          <div className="relative h-[110px] w-full">
            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 250 110">
              <defs>
                <linearGradient id="tailArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Shaded Tail Risk Area (Left of VaR) */}
              <path
                d="M 10 95 Q 40 95, 65 75 L 65 95 Z"
                fill="url(#tailArea)"
              />

              {/* Bell Curve */}
              <path
                d="M 10 95 C 40 95, 70 85, 100 40 C 125 5, 135 5, 150 40 C 175 80, 210 95, 240 95"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2"
              />

              {/* Vertical VaR Cutoff Line */}
              <line x1="65" y1="20" x2="65" y2="95" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            <div className="absolute left-[50px] top-2 text-[9px] font-mono text-rose-400 font-bold">
              VaR (95%)
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footnote */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>Continuous stress testing against historical black swan events</span>
        </div>
        <span className="font-mono text-[9px] text-slate-500">
          CVaR: -4.1%
        </span>
      </div>
    </div>
  );
}
