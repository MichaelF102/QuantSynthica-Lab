"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase, PieChart, Layers, ArrowUpRight } from "lucide-react";

const ALLOCATIONS = [
  { sym: "AAPL", name: "Apple Inc.", weight: 24, market: "US", color: "#3B82F6" },
  { sym: "RELIANCE", name: "Reliance Ind.", weight: 18, market: "India", color: "#14B8A6" },
  { sym: "MSFT", name: "Microsoft", weight: 16, market: "US", color: "#6366F1" },
  { sym: "SPY", name: "S&P 500 ETF", weight: 15, market: "US", color: "#00D2FF" },
  { sym: "TCS", name: "Tata Consultancy", weight: 12, market: "India", color: "#F59E0B" },
  { sym: "NVDA", name: "NVIDIA Corp.", weight: 9, market: "US", color: "#10B981" },
  { sym: "CASH", name: "USD Reserve", weight: 6, market: "Cash", color: "#64748B" },
];

export default function PortfolioVisual() {
  return (
    <div className="relative flex h-[460px] sm:h-[490px] w-full flex-col justify-between rounded-2xl bg-[#090E17] p-4 sm:p-5 text-white border border-slate-800 shadow-2xl overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.1)_0,transparent_70%)]" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">
              OPTIMIZED PORTFOLIO BOOK
            </div>
            <div className="text-[11px] text-slate-400">
              Multi-Asset Allocation · US (USD) & India (INR) Cross-Hedging
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-teal-300">
            EFFICIENT FRONTIER: OPTIMAL
          </span>
        </div>
      </div>

      {/* Top Stat Row */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Expected Return</div>
          <div className="text-base font-mono font-bold text-emerald-400">19.4% p.a.</div>
          <div className="text-[9px] text-slate-500">Optimized weights</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Book Volatility</div>
          <div className="text-base font-mono font-bold text-blue-400">14.2%</div>
          <div className="text-[9px] text-slate-500">Diversified risk</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Portfolio Sharpe</div>
          <div className="text-base font-mono font-bold text-teal-400">1.58</div>
          <div className="text-[9px] text-slate-500">Max Sharpe frontier</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="text-[9px] font-mono uppercase text-slate-400">Diversification</div>
          <div className="text-base font-mono font-bold text-amber-400">8.6 / 10</div>
          <div className="text-[9px] text-slate-500">Low correlation cross-asset</div>
        </div>
      </div>

      {/* Main Allocation Area: Donut Chart + Horizontal Weight Bars */}
      <div className="relative z-10 my-auto grid grid-cols-1 sm:grid-cols-12 items-center gap-4 py-1">
        {/* Left: Donut Chart (5 cols) */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative h-40 w-40 flex items-center justify-center">
            {/* SVG Donut */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              {/* Circle circumference is 2 * PI * 38 ~= 238.76 */}
              {/* AAPL 24% => strokeDasharray: 57.3 181.4, strokeDashoffset: 0 */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="14"
                strokeDasharray="57.3 181.4"
                strokeDashoffset="0"
              />
              {/* RELIANCE 18% => 43.0, offset: -57.3 */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#14B8A6"
                strokeWidth="14"
                strokeDasharray="43.0 195.7"
                strokeDashoffset="-57.3"
              />
              {/* MSFT 16% => 38.2, offset: -100.3 */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#6366F1"
                strokeWidth="14"
                strokeDasharray="38.2 200.5"
                strokeDashoffset="-100.3"
              />
              {/* SPY 15% => 35.8, offset: -138.5 */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#00D2FF"
                strokeWidth="14"
                strokeDasharray="35.8 202.9"
                strokeDashoffset="-138.5"
              />
              {/* TCS 12% => 28.6, offset: -174.3 */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="14"
                strokeDasharray="28.6 210.1"
                strokeDashoffset="-174.3"
              />
              {/* NVDA 9% => 21.5, offset: -202.9 */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#10B981"
                strokeWidth="14"
                strokeDasharray="21.5 217.2"
                strokeDashoffset="-202.9"
              />
              {/* CASH 6% => 14.3, offset: -224.4 */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#64748B"
                strokeWidth="14"
                strokeDasharray="14.3 224.4"
                strokeDashoffset="-224.4"
              />
            </svg>

            {/* Center Label inside donut */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs font-mono font-bold text-white">100%</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Deployed</span>
            </div>
          </div>
        </div>

        {/* Right: Allocation Bars List (7 cols) */}
        <div className="sm:col-span-7 space-y-1.5">
          {ALLOCATIONS.map((item, i) => (
            <div key={item.sym} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-bold text-white">{item.sym}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {item.name}
                  </span>
                  <span className="rounded bg-slate-800 px-1 text-[9px] text-slate-400">
                    {item.market}
                  </span>
                </div>
                <span className="font-bold text-slate-200">{item.weight}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.weight * 3.5}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-teal-400" />
          <span>Dynamic rebalancing: Triggered when asset drift exceeds ±3%</span>
        </div>
        <span className="font-mono text-[9px] text-slate-500">
          Markowitz Mean-Variance MVO
        </span>
      </div>
    </div>
  );
}
