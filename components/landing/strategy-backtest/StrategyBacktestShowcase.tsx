"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code,
  Cpu,
  BarChart3,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Shield,
  Activity,
  Terminal,
  Zap,
  Play,
  Database,
  LineChart,
  RefreshCw,
  Info,
} from "lucide-react";

interface ProductTab {
  id: string;
  tabLabel: string;
  badge: string;
  name: string;
  tagline: string;
  description: string;
  pillColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  btnBg: string;
  btnHover: string;
  ctaText: string;
  ctaHref: string;
  highlights: string[];
}

const TABS: ProductTab[] = [
  {
    id: "strategy-studio",
    tabLabel: "Strategy Studio™",
    badge: "Rule Synthesizer",
    name: "Strategy Studio™",
    tagline: "Visual & Programmatic Alpha Modeling",
    description:
      "Strategy Studio™ is QuantSynthica's rule-based alpha modeling suite, empowering researchers to build multi-factor trading strategies without writing boilerplates. Combine 20+ technical indicators, define entry and exit triggers, and configure position sizing with mathematical precision.",
    pillColor: "bg-[#00c853] text-white",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/30",
    accentText: "text-emerald-400",
    btnBg: "bg-[#00c853]",
    btnHover: "hover:bg-[#00b047]",
    ctaText: "Try Strategy Studio",
    ctaHref: "/strategies",
    highlights: [
      "Visual block & Python code dual compositor",
      "20+ institutional indicators (RSI, SMA, MACD, BB, ATR)",
      "Explicit entry, exit, and stop-loss logic triggers",
      "Instant formula syntax validation & parameter tuning",
    ],
  },
  {
    id: "backtest-engine",
    tabLabel: "Backtest Engine™",
    badge: "Simulation Matrix",
    name: "Backtest Engine™",
    tagline: "High-Throughput Vectorized Simulation Core",
    description:
      "Backtest Engine™ is QuantSynthica's event-driven execution simulation matrix. It executes strategy logic against historical tick and daily bar datasets with realistic slippage, fee schedules, and next-open fills (t+1) to guarantee zero lookahead bias.",
    pillColor: "bg-[#00c853] text-white",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/30",
    accentText: "text-emerald-400",
    btnBg: "bg-[#00c853]",
    btnHover: "hover:bg-[#00b047]",
    ctaText: "Launch Backtest Engine",
    ctaHref: "/backtests",
    highlights: [
      "Zero lookahead bias with next-open execution (t+1)",
      "Configurable commissions & market slippage modeling",
      "Dual-market coverage: US (NYSE/NASDAQ) & India (NSE)",
      "Sub-50ms simulation across 10+ years of daily bars",
    ],
  },
  {
    id: "performance-lab",
    tabLabel: "Performance Lab™",
    badge: "Institutional Tear-Sheet",
    name: "Performance Lab™",
    tagline: "Institutional Analytics & Risk Observatory",
    description:
      "Performance Lab™ transforms raw backtest trade logs into institutional tear-sheets. Analyze Sharpe, Sortino, Calmar ratios, maximum drawdowns, and value-at-risk (VaR) to verify if an edge survives real-world market stress.",
    pillColor: "bg-[#00c853] text-white",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/30",
    accentText: "text-emerald-400",
    btnBg: "bg-[#00c853]",
    btnHover: "hover:bg-[#00b047]",
    ctaText: "Explore Performance Lab",
    ctaHref: "/analytics",
    highlights: [
      "Comprehensive ratios: Sharpe (2.14), Sortino (2.89), Calmar (2.54)",
      "6-axis spider radar risk profile (Alpha, Volatility, Liquidity)",
      "Underwater drawdown curves with recovery duration",
      "Monthly returns heatmap & tail-risk VaR distributions",
    ],
  },
  {
    id: "portfolio-desk",
    tabLabel: "Portfolio Desk™",
    badge: "Cross-Market Allocation",
    name: "Portfolio Desk™",
    tagline: "Multi-Asset Allocation & Live Rebalancing",
    description:
      "Portfolio Desk™ aggregates independent strategies into an institutional-grade multi-asset portfolio. Optimize risk parity, manage cash cushions, and orchestrate automated rebalancing across global and domestic asset classes.",
    pillColor: "bg-[#00c853] text-white",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/30",
    accentText: "text-emerald-400",
    btnBg: "bg-[#00c853]",
    btnHover: "hover:bg-[#00b047]",
    ctaText: "Open Portfolio Desk",
    ctaHref: "/portfolio",
    highlights: [
      "Cross-border allocation: US Tech + Indian Blue-Chips",
      "Dynamic risk-weighted position rebalancing",
      "Slippage and transaction cost optimization",
      "Automated drift detection and margin safeguard",
    ],
  },
];

export default function StrategyBacktestShowcase() {
  const [activeTabId, setActiveTabId] = useState<string>("strategy-studio");
  const activeTab = TABS.find((t) => t.id === activeTabId) || TABS[0];

  return (
    <div className="w-full">
      {/* 1. SECTION HEADER (Quantiphi style with Platforms & Accelerators Pill + Headline) */}
      <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/60 bg-slate-800/60 dark:bg-slate-900/80 backdrop-blur-md mb-4 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#00c853] animate-pulse" />
          <span className="text-[11px] sm:text-[12px] font-bold tracking-[0.18em] text-slate-300 uppercase">
            Platforms &amp; Accelerators
          </span>
        </div>

        <h2 className="text-[32px] sm:text-[44px] lg:text-[50px] font-extrabold tracking-[-0.035em] text-[#0B1220] dark:text-white leading-[1.12]">
          Explore Our Quantitative Platform
        </h2>

        <p className="mt-3.5 text-[15px] sm:text-[16px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Turn quantitative ideas into measurable evidence. Define rule-based logic, simulate with institutional tick precision, and stress-test performance with zero lookahead bias.
        </p>
      </div>

      {/* 2. HORIZONTAL PRODUCT TABS (Quantiphi pill bar) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-8">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`relative px-5 sm:px-6 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-bold transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? `${tab.pillColor} shadow-lg shadow-emerald-500/20 scale-[1.02]`
                  : "bg-[#0c182c]/80 dark:bg-[#0c182c]/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 hover:bg-[#13223c]"
              }`}
            >
              <span>{tab.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN SHOWCASE CONTAINER (2-Column Split: Info + UI Mockup) */}
      <div className="relative rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#081326] via-[#071120] to-[#050c18] p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
        {/* Subtle Background Glow Radial */}
        <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Product Branding, Copy, Highlights & CTA */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Brand Logo & Product Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[#00c853]">
                    {activeTab.id === "strategy-studio" && <Code className="h-6 w-6" />}
                    {activeTab.id === "backtest-engine" && <Cpu className="h-6 w-6" />}
                    {activeTab.id === "performance-lab" && <BarChart3 className="h-6 w-6" />}
                    {activeTab.id === "portfolio-desk" && <Layers className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                      {activeTab.name}
                    </h3>
                    <p className="text-[12px] font-semibold text-emerald-400 mt-1 uppercase tracking-wider">
                      {activeTab.tagline}
                    </p>
                  </div>
                </div>

                {/* Paragraph Description */}
                <p className="text-[14px] sm:text-[15px] leading-[1.7] text-slate-300/90 font-normal">
                  {activeTab.description}
                </p>

                {/* Key Capability Highlights */}
                <div className="space-y-2.5 pt-1">
                  {activeTab.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[13px] text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-[#00c853] shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <Link
                    href={activeTab.ctaHref}
                    className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-lg text-[14px] font-bold text-white shadow-lg transition-all duration-200 cursor-pointer ${activeTab.btnBg} ${activeTab.btnHover} hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0`}
                  >
                    <span>{activeTab.ctaText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Realistic Interactive Software UI Mockup */}
          {/* ========================================================= */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab.id === "strategy-studio" && <StrategyStudioMockup />}
                {activeTab.id === "backtest-engine" && <BacktestEngineMockup />}
                {activeTab.id === "performance-lab" && <PerformanceLabMockup />}
                {activeTab.id === "portfolio-desk" && <PortfolioDeskMockup />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 1. STRATEGY STUDIO MOCKUP COMPONENT */}
{/* ========================================================================= */}
function StrategyStudioMockup() {
  const [selectedIndicator, setSelectedIndicator] = useState<string>("RSI");

  const indicators = [
    { name: "RSI", params: "Period: 14 | Oversold: 30 | Overbought: 70" },
    { name: "SMA", params: "Fast: 20 | Slow: 50 | Trend: 200" },
    { name: "MACD", params: "Fast: 12 | Slow: 26 | Signal: 9" },
    { name: "Bollinger", params: "Period: 20 | StdDev: 2.0σ" },
    { name: "ATR", params: "Period: 14 | Volatility Filter" },
    { name: "VWAP", params: "Session Anchor: Intraday Volume" },
  ];

  const currentParams =
    indicators.find((i) => i.name === selectedIndicator)?.params ||
    "Period: 14 | Dynamic";

  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Dual_MA_MeanReversion_v2.strat
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SYNTAX VALIDATED
          </span>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            LONG / SHORT
          </span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Strategy Context Bar */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block text-[9.5px]">PRIMARY ASSET</span>
            <span className="text-white font-bold">NIFTY 50 / AAPL</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">BAR INTERVAL</span>
            <span className="text-emerald-400 font-bold">1-Day Candle (Close)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">EXECUTION ORDER</span>
            <span className="text-cyan-400 font-bold">Next-Open (t+1)</span>
          </div>
        </div>

        {/* Visual Logic Rule Cards */}
        <div className="space-y-2.5">
          {/* Rule 1: Entry Trigger */}
          <div className="p-3 rounded-xl bg-[#0F1C34] border border-cyan-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                RULE 01: ENTRY CONDITION (LONG)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Weight: 100%</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap font-mono text-[12px]">
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-bold">
                RSI(14) &lt; 32
              </span>
              <span className="text-slate-400 font-bold">AND</span>
              <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-700/50 font-bold">
                Close &gt; SMA(200)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              Enters long when asset is oversold in an established macro bullish trend.
            </div>
          </div>

          {/* Rule 2: Exit & Stop Loss */}
          <div className="p-3 rounded-xl bg-[#0F1C34] border border-rose-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                RULE 02: EXIT &amp; STOP-LOSS
              </span>
              <span className="text-[10px] font-mono text-slate-400">Strict Exit</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap font-mono text-[12px]">
              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/50 font-bold">
                Close &lt; SMA(50)
              </span>
              <span className="text-slate-400 font-bold">OR</span>
              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 font-bold">
                Trailing Stop: 3.5%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              Protects capital on trend degradation or locked profit reversal.
            </div>
          </div>
        </div>

        {/* Technical Indicators Interactive Selector */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
            <span>AVAILABLE INDICATORS (CLICK TO INSPECT)</span>
            <span className="text-cyan-400 font-bold">{currentParams}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {indicators.map((ind) => (
              <button
                key={ind.name}
                type="button"
                onClick={() => setSelectedIndicator(ind.name)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  selectedIndicator === ind.name
                    ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {ind.name}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Inspector */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span className="flex items-center gap-1">
              <Terminal className="h-3 w-3 text-cyan-400" />
              PYTHON GENERATED SPEC
            </span>
            <span className="text-emerald-400">0.0ms Compile</span>
          </div>
          <div className="text-cyan-300/90 leading-relaxed overflow-x-auto no-scrollbar whitespace-pre">
{`signals = (rsi(df.close, 14) < 32) & (df.close > sma(df.close, 200))
exits   = (df.close < sma(df.close, 50)) | trailing_stop(0.035)`}
          </div>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 2. BACKTEST ENGINE MOCKUP COMPONENT */}
{/* ========================================================================= */}
function BacktestEngineMockup() {
  const [activeRange, setActiveRange] = useState<string>("5Y");

  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Backtest Engine: NIFTY 50 (2019 — 2024)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400">
            SIMULATION COMPLETE (18ms)
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-[#0F1C34] border border-emerald-500/30">
            <div className="text-[10px] font-mono text-slate-400 uppercase">STRATEGY CAGR</div>
            <div className="text-[17px] font-extrabold text-[#00c853] font-mono leading-tight mt-0.5">
              +28.4%
            </div>
            <div className="text-[9.5px] text-slate-400">vs Benchmark +14.2%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0F1C34] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">TOTAL TRADES</div>
            <div className="text-[17px] font-extrabold text-white font-mono leading-tight mt-0.5">
              142
            </div>
            <div className="text-[9.5px] text-emerald-400 font-semibold">91 Wins / 51 Losses</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0F1C34] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">WIN RATE</div>
            <div className="text-[17px] font-extrabold text-white font-mono leading-tight mt-0.5">
              64.2%
            </div>
            <div className="text-[9.5px] text-slate-400">Avg Win: +4.8%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#0F1C34] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">MAX DRAWDOWN</div>
            <div className="text-[17px] font-extrabold text-rose-400 font-mono leading-tight mt-0.5">
              -11.2%
            </div>
            <div className="text-[9.5px] text-slate-400">Benchmark: -28.4%</div>
          </div>
        </div>

        {/* Equity Curve SVG Chart */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-white">
                <span className="h-2 w-2 rounded-full bg-[#00c853]" />
                Strategy (+248.6%)
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-500" />
                Benchmark (+112.4%)
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono">
              {["1Y", "3Y", "5Y", "MAX"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActiveRange(r)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeRange === r
                      ? "bg-slate-700 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative h-44 w-full">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 160"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="stratGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00c853" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00c853" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="benchGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#64748B" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#64748B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#1E293B" strokeDasharray="3 3" />

              {/* Benchmark Area & Line */}
              <path
                d="M 0 145 C 70 140, 140 135, 200 120 C 260 105, 330 115, 380 95 C 440 85, 480 75, 500 65 L 500 160 L 0 160 Z"
                fill="url(#benchGlow)"
              />
              <path
                d="M 0 145 C 70 140, 140 135, 200 120 C 260 105, 330 115, 380 95 C 440 85, 480 75, 500 65"
                fill="none"
                stroke="#64748B"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Strategy Area & Line */}
              <path
                d="M 0 140 C 60 135, 120 115, 180 95 C 240 80, 300 90, 360 55 C 420 30, 460 25, 500 15 L 500 160 L 0 160 Z"
                fill="url(#stratGlow)"
              />
              <path
                d="M 0 140 C 60 135, 120 115, 180 95 C 240 80, 300 90, 360 55 C 420 30, 460 25, 500 15"
                fill="none"
                stroke="#00c853"
                strokeWidth="2.5"
              />

              {/* Trade Points Pins */}
              <circle cx="180" cy="95" r="4" fill="#00c853" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="360" cy="55" r="4" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
            </svg>

            {/* Floating Trade Badge 1 */}
            <div className="absolute top-[82px] left-[32%] -translate-x-1/2 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500 text-[9.5px] font-mono text-emerald-300 shadow-md">
              BUY @ 18,240
            </div>

            {/* Floating Trade Badge 2 */}
            <div className="absolute top-[32px] left-[70%] -translate-x-1/2 px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[9.5px] font-mono text-cyan-300 shadow-md">
              TAKE PROFIT @ 22,480 (+23.2%)
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900 mt-1">
            <span>2019</span>
            <span>2020</span>
            <span>2021</span>
            <span>2022</span>
            <span>2023</span>
            <span>2024</span>
          </div>
        </div>

        {/* Realism Guard Details */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">
            Friction: <strong className="text-white">0.05% Slippage</strong> +{" "}
            <strong className="text-white">0.03% Brokerage</strong>
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Zero Lookahead Bias Verified
          </span>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 3. PERFORMANCE LAB MOCKUP COMPONENT */}
{/* ========================================================================= */}
function PerformanceLabMockup() {
  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Institutional Tear-Sheet: Risk &amp; Alpha
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-500/40 text-[10px] font-mono font-bold text-indigo-300">
          GRADE: INSTITUTIONAL A+
        </span>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Ratios Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#0F1C34] border border-cyan-500/30">
            <div className="text-[10px] font-mono text-slate-400 uppercase">SHARPE RATIO</div>
            <div className="text-xl font-black text-cyan-300 font-mono mt-0.5">2.14</div>
            <div className="text-[9px] text-slate-400">Risk-free: 5.5%</div>
          </div>
          <div className="p-3 rounded-xl bg-[#0F1C34] border border-emerald-500/30">
            <div className="text-[10px] font-mono text-slate-400 uppercase">SORTINO RATIO</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">2.89</div>
            <div className="text-[9px] text-slate-400">Downside deviation</div>
          </div>
          <div className="p-3 rounded-xl bg-[#0F1C34] border border-purple-500/30">
            <div className="text-[10px] font-mono text-slate-400 uppercase">CALMAR RATIO</div>
            <div className="text-xl font-black text-purple-300 font-mono mt-0.5">2.54</div>
            <div className="text-[9px] text-slate-400">CAGR / Max DD</div>
          </div>
          <div className="p-3 rounded-xl bg-[#0F1C34] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">PROFIT FACTOR</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">2.31</div>
            <div className="text-[9px] text-slate-400">Gross Win / Loss</div>
          </div>
        </div>

        {/* Split Grid: 6-Axis Radar Spider Chart & Monthly Heatmap */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* 6-Axis Radar Chart */}
          <div className="sm:col-span-6 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>6-AXIS RISK PROFILE</span>
              <span className="text-cyan-400 font-bold">BALANCED</span>
            </div>
            <div className="relative h-36 w-36 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 160 160">
                {/* Background Concentric Webs */}
                <polygon
                  points="80,15 136,47 136,113 80,145 24,113 24,47"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                <polygon
                  points="80,35 118,57 118,103 80,125 42,103 42,57"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                <polygon
                  points="80,55 100,67 100,93 80,105 60,93 60,67"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="1"
                />

                {/* Axes */}
                <line x1="80" y1="80" x2="80" y2="15" stroke="#334155" strokeWidth="0.8" />
                <line x1="80" y1="80" x2="136" y2="47" stroke="#334155" strokeWidth="0.8" />
                <line x1="80" y1="80" x2="136" y2="113" stroke="#334155" strokeWidth="0.8" />
                <line x1="80" y1="80" x2="80" y2="145" stroke="#334155" strokeWidth="0.8" />
                <line x1="80" y1="80" x2="24" y2="113" stroke="#334155" strokeWidth="0.8" />
                <line x1="80" y1="80" x2="24" y2="47" stroke="#334155" strokeWidth="0.8" />

                {/* Strategy Polygon Fill */}
                <polygon
                  points="80,24 130,52 120,105 80,132 38,100 32,55"
                  fill="rgba(0, 200, 83, 0.25)"
                  stroke="#00c853"
                  strokeWidth="2"
                />

                {/* Data points */}
                <circle cx="80" cy="24" r="3" fill="#00c853" />
                <circle cx="130" cy="52" r="3" fill="#00c853" />
                <circle cx="120" cy="105" r="3" fill="#00c853" />
                <circle cx="80" cy="132" r="3" fill="#00c853" />
                <circle cx="38" cy="100" r="3" fill="#00c853" />
                <circle cx="32" cy="55" r="3" fill="#00c853" />
              </svg>
            </div>
            <div className="w-full grid grid-cols-3 gap-1 text-[8.5px] font-mono text-center text-slate-400 mt-1">
              <span>Return: 92/100</span>
              <span>Sharpe: 88/100</span>
              <span>Stability: 85/100</span>
            </div>
          </div>

          {/* Monthly Alpha Heatmap Strip */}
          <div className="sm:col-span-6 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>MONTHLY ALPHA LOG (RECENT)</span>
              <span className="text-emerald-400 font-bold">+18.4% YTD</span>
            </div>
            <div className="grid grid-cols-6 gap-1 text-center font-mono text-[9px]">
              <div className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                JAN<br /><strong>+3.2%</strong>
              </div>
              <div className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                FEB<br /><strong>+1.8%</strong>
              </div>
              <div className="p-1 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                MAR<br /><strong>-0.9%</strong>
              </div>
              <div className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                APR<br /><strong>+4.5%</strong>
              </div>
              <div className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                MAY<br /><strong>+2.1%</strong>
              </div>
              <div className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                JUN<br /><strong>+5.4%</strong>
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10.5px] font-mono text-slate-300 flex items-center justify-between">
              <span>Historical Value at Risk (95% VaR):</span>
              <span className="text-rose-400 font-bold">1.42% daily</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 4. PORTFOLIO DESK MOCKUP COMPONENT */}
{/* ========================================================================= */}
function PortfolioDeskMockup() {
  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Portfolio Desk: Global &amp; Domestic Desk
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400">
          REBALANCING OPTIMAL
        </span>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Asset Allocation Breakdown Bar */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">MULTI-ASSET ALLOCATION</span>
            <span className="text-white font-bold">Total Capital: $250,000 / ₹2.08 Cr</span>
          </div>
          {/* Progress Multi-Bar */}
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
            <div className="h-full bg-blue-500 w-[45%]" title="US Equities (45%)" />
            <div className="h-full bg-emerald-500 w-[35%]" title="Indian Equities (35%)" />
            <div className="h-full bg-purple-500 w-[20%]" title="Hedging & Cash (20%)" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              US Equities (45%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Indian Blue-Chips (35%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Cash &amp; Hedge (20%)
            </span>
          </div>
        </div>

        {/* Active Holdings Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden text-[11px] font-mono">
          <div className="grid grid-cols-12 bg-slate-900/90 px-3 py-2 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
            <div className="col-span-4">ASSET / TICKER</div>
            <div className="col-span-3 text-right">WEIGHT</div>
            <div className="col-span-2 text-right">P&amp;L</div>
            <div className="col-span-3 text-right">ACTION</div>
          </div>

          <div className="divide-y divide-slate-800/80 bg-[#0A1424]">
            <div className="grid grid-cols-12 px-3 py-2.5 items-center">
              <div className="col-span-4 font-bold text-white flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                NVDA (US Tech)
              </div>
              <div className="col-span-3 text-right text-slate-300">18.5% ($46.2k)</div>
              <div className="col-span-2 text-right text-emerald-400 font-bold">+34.2%</div>
              <div className="col-span-3 text-right">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[9.5px] font-bold">
                  STRONG BUY
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 px-3 py-2.5 items-center">
              <div className="col-span-4 font-bold text-white flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                RELIANCE (NSE)
              </div>
              <div className="col-span-3 text-right text-slate-300">16.2% (₹33.7L)</div>
              <div className="col-span-2 text-right text-emerald-400 font-bold">+18.4%</div>
              <div className="col-span-3 text-right">
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-700/50 text-[9.5px] font-bold">
                  HOLD
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 px-3 py-2.5 items-center">
              <div className="col-span-4 font-bold text-white flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                MSFT (US Tech)
              </div>
              <div className="col-span-3 text-right text-slate-300">14.0% ($35.0k)</div>
              <div className="col-span-2 text-right text-emerald-400 font-bold">+21.8%</div>
              <div className="col-span-3 text-right">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[9.5px] font-bold">
                  BUY
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 px-3 py-2.5 items-center">
              <div className="col-span-4 font-bold text-white flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                HDFCBANK (NSE)
              </div>
              <div className="col-span-3 text-right text-slate-300">12.5% (₹26.0L)</div>
              <div className="col-span-2 text-right text-emerald-400 font-bold">+9.6%</div>
              <div className="col-span-3 text-right">
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50 text-[9.5px] font-bold">
                  REBALANCE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rebalance Schedule Bar */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">
            Next Rebalance: <strong className="text-white">Monthly (14 days left)</strong>
          </span>
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Max Drift: 0.42% (Normal)
          </span>
        </div>
      </div>
    </div>
  );
}
