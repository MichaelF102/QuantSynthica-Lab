"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Database, Globe, Layers, TrendingUp } from "lucide-react";

const CATEGORIES = ["Equities", "ETFs", "Indices", "Options", "Economic Data"];

const US_NODES = [
  { id: "spy", sym: "SPY", name: "S&P 500", badgeBg: "bg-red-500", badgeText: "SS" },
  { id: "qqq", sym: "QQQ", name: "NASDAQ 100", badgeBg: "bg-blue-500", badgeText: "N" },
  { id: "aapl", sym: "AAPL", name: "Apple Inc.", badgeBg: "bg-slate-700", badgeText: "" },
  { id: "msft", sym: "MSFT", name: "Microsoft", badgeBg: "bg-sky-500", badgeText: "⊞" },
  { id: "nvda", sym: "NVDA", name: "NVIDIA", badgeBg: "bg-emerald-500", badgeText: "NV" },
];

const INDIA_NODES = [
  { id: "nsei", sym: "^NSEI", name: "NIFTY 50", badgeBg: "bg-indigo-600", badgeText: "N" },
  { id: "bsesn", sym: "^BSESN", name: "SENSEX", badgeBg: "bg-blue-600", badgeText: "BSE" },
  { id: "reliance", sym: "RELIANCE", name: "Reliance Ind.", badgeBg: "bg-amber-600", badgeText: "R" },
  { id: "tcs", sym: "TCS", name: "Tata Consultancy", badgeBg: "bg-rose-600", badgeText: "tcs" },
  { id: "infy", sym: "INFY", name: "Infosys", badgeBg: "bg-cyan-600", badgeText: "Infosys" },
];

export default function DataVisual() {
  const [activeCategory, setActiveCategory] = useState("Equities");

  return (
    <div className="relative flex h-[460px] sm:h-[490px] w-full flex-col justify-between rounded-2xl bg-[#090E17] p-4 sm:p-5 text-white border border-slate-800 shadow-2xl overflow-hidden">
      {/* Background glow and subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(23,105,255,0.12)_0,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Top Bar: Universe Title + Category Pill Selectors */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#1769FF]">
            Market Universe
          </div>
          <div className="text-xs font-medium text-slate-300">
            Global and Indian markets — 1,000+ assets
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-900/90 p-0.5 border border-slate-800">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                activeCategory === cat
                  ? "bg-[#1769FF] text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Network Stage */}
      <div className="relative z-10 my-auto grid grid-cols-12 items-center gap-2 py-2">
        {/* Left Side: US Markets (3 cols) */}
        <div className="col-span-3 space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-0.5 text-[9px] font-semibold text-slate-300 border border-slate-700/60 mb-0.5">
            <span>🇺🇸</span>
            <span>US MARKETS</span>
          </div>

          {US_NODES.map((node, i) => (
            <div
              key={node.id}
              className="group flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/80 px-2 py-1 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:bg-slate-850"
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${node.badgeBg} text-[8px] font-bold text-white shadow-xs`}
              >
                {node.badgeText}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-white leading-tight truncate">
                  {node.name}
                </div>
                <div className="text-[8px] font-mono text-slate-400">
                  {node.sym}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Center: Glowing Quant Core & SVG Curved Connecting Lines (6 cols) */}
        <div className="col-span-6 relative flex items-center justify-center h-[220px]">
          {/* SVG Connector Lines */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="usLineGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#1769FF" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#1769FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00D2FF" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="inLineGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#00D2FF" stopOpacity="1" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* US Connection Arcs */}
            <path
              d="M 50 35 C 130 50, 160 110, 200 130"
              fill="none"
              stroke="url(#usLineGrad)"
              strokeWidth="1.6"
              strokeDasharray="4 2"
              className="animate-pulse"
            />
            <path
              d="M 50 85 C 120 90, 160 120, 200 130"
              fill="none"
              stroke="url(#usLineGrad)"
              strokeWidth="1.8"
            />
            <path
              d="M 50 130 C 110 130, 150 130, 200 130"
              fill="none"
              stroke="#1769FF"
              strokeWidth="2.2"
              opacity="0.8"
            />
            <path
              d="M 50 175 C 120 170, 160 140, 200 130"
              fill="none"
              stroke="url(#usLineGrad)"
              strokeWidth="1.8"
            />
            <path
              d="M 50 225 C 130 210, 160 150, 200 130"
              fill="none"
              stroke="url(#usLineGrad)"
              strokeWidth="1.6"
              strokeDasharray="4 2"
            />

            {/* India Connection Arcs */}
            <path
              d="M 200 130 C 240 110, 270 50, 350 35"
              fill="none"
              stroke="url(#inLineGrad)"
              strokeWidth="1.6"
              strokeDasharray="4 2"
              className="animate-pulse"
            />
            <path
              d="M 200 130 C 240 120, 280 90, 350 85"
              fill="none"
              stroke="url(#inLineGrad)"
              strokeWidth="1.8"
            />
            <path
              d="M 200 130 C 250 130, 290 130, 350 130"
              fill="none"
              stroke="#6366F1"
              strokeWidth="2.2"
              opacity="0.8"
            />
            <path
              d="M 200 130 C 240 140, 280 170, 350 175"
              fill="none"
              stroke="url(#inLineGrad)"
              strokeWidth="1.8"
            />
            <path
              d="M 200 130 C 240 150, 270 210, 350 225"
              fill="none"
              stroke="url(#inLineGrad)"
              strokeWidth="1.6"
              strokeDasharray="4 2"
            />
          </svg>

          {/* Central Glowing Quant Core */}
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
              boxShadow: [
                "0 0 30px rgba(23,105,255,0.35)",
                "0 0 50px rgba(23,105,255,0.6)",
                "0 0 30px rgba(23,105,255,0.35)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border-2 border-blue-400/50 bg-[#0B1220] text-center shadow-2xl backdrop-blur-md"
          >
            {/* Outer dotted orbit ring */}
            <div className="absolute -inset-2 rounded-full border border-blue-500/30 border-dashed animate-spin [animation-duration:24s]" />
            <div className="absolute -inset-5 rounded-full border border-indigo-500/20 [animation-duration:40s]" />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1769FF] text-white font-bold text-lg shadow-lg shadow-blue-500/40">
              Q
            </div>
            <div className="mt-1 text-[11px] font-bold text-white tracking-tight">
              QuantSynthica
            </div>
            <div className="text-[9px] font-medium text-blue-300">Lab Core</div>
          </motion.div>
        </div>

        {/* Right Side: Indian Markets (3 cols) */}
        <div className="col-span-3 space-y-1.5 z-10 text-right">
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-0.5 text-[9px] font-semibold text-slate-300 border border-slate-700/60 mb-0.5">
            <span>🇮🇳</span>
            <span>INDIAN MARKETS</span>
          </div>

          {INDIA_NODES.map((node, i) => (
            <div
              key={node.id}
              className="group flex items-center justify-end gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/80 px-2 py-1 backdrop-blur-sm transition-all hover:border-indigo-500/50 hover:bg-slate-850"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-white leading-tight truncate">
                  {node.name}
                </div>
                <div className="text-[8px] font-mono text-slate-400">
                  {node.sym}
                </div>
              </div>
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${node.badgeBg} text-[8px] font-bold text-white shadow-xs`}
              >
                {node.badgeText}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Metadata & Coverage Badges */}
      <div className="relative z-10 flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Real-Time Ingestion</span>
          </div>
          <span className="text-slate-600">•</span>
          <span>US (NYSE/NASDAQ) & India (NSE/BSE)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded bg-slate-800/90 px-2 py-0.5 font-mono text-[10px] text-blue-300 border border-slate-700">
            1,000+ SYMBOLS
          </span>
          <span className="rounded bg-slate-800/90 px-2 py-0.5 font-mono text-[10px] text-indigo-300 border border-slate-700">
            OHLCV + FINANCIALS
          </span>
        </div>
      </div>
    </div>
  );
}
