"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Landmark,
  Zap,
  Droplets,
  Activity,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  LineChart,
  BarChart3,
  Layers,
  ChevronRight,
} from "lucide-react";

interface RiskRegime {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  shockLabel: string;
  simulatedLoss: string;
  maxDrawdown: string;
  volatilitySpike: string;
  var99: string;
  highlights: string[];
}

const REGIMES: RiskRegime[] = [
  {
    id: "crash",
    name: "Market Crash",
    badge: "Systemic Shock",
    tagline: "-15% Equity Shock & Liquidity Plunge",
    icon: Shield,
    iconBg: "bg-rose-500/15 border-rose-500/30",
    iconColor: "text-rose-400",
    description:
      "Simulate systemic multi-sigma equity sell-offs comparable to the March 2020 liquidity plunge. Evaluate portfolio correlation breakdown, margin calls, and extreme left-tail drawdown before committing live capital.",
    ctaText: "Explore Market Crash Simulator",
    ctaHref: "/risk",
    shockLabel: "-15% Systemic Equity Shock",
    simulatedLoss: "-15.2%",
    maxDrawdown: "-18.4%",
    volatilitySpike: "+38.6%",
    var99: "-8.4%",
    highlights: [
      "Cornish-Fisher non-normal tail risk expansion",
      "Correlations spike toward 1.0 during liquidity stress",
      "Dynamic protective stop-loss & put hedge simulation",
      "Instant portfolio value-at-risk impact calculation",
    ],
  },
  {
    id: "rates",
    name: "Rate Shock",
    badge: "Monetary Dislocation",
    tagline: "+200 bps Central Bank Tightening",
    icon: Landmark,
    iconBg: "bg-amber-500/15 border-amber-500/30",
    iconColor: "text-amber-400",
    description:
      "Stress test sudden hawkish central bank rate hikes and yield curve steepening. Measure how interest rate sensitivity compresses equity multiples and shocks high-beta growth stocks versus defensive value equities.",
    ctaText: "Simulate Rate Shock",
    ctaHref: "/risk",
    shockLabel: "+200 bps Bond Yield Spike",
    simulatedLoss: "-8.1%",
    maxDrawdown: "-12.6%",
    volatilitySpike: "+28.4%",
    var99: "-6.9%",
    highlights: [
      "Yield curve twist & duration exposure mapping",
      "Valuation multiple compression on tech & growth",
      "Bond-equity correlation reversal tracking",
      "Floating rate and defensive cash hedge evaluation",
    ],
  },
  {
    id: "vol",
    name: "Volatility Spike",
    badge: "Gamma & Vega Shock",
    tagline: "+80% VIX Jump & Skew Blowout",
    icon: Zap,
    iconBg: "bg-purple-500/15 border-purple-500/30",
    iconColor: "text-purple-400",
    description:
      "Model options market gamma squeezes and implied volatility blowouts. Understand vega risk, volatility surface inversions, and margin requirement escalations when market sentiment turns from complacency to panic.",
    ctaText: "Simulate Volatility Spike",
    ctaHref: "/risk",
    shockLabel: "+80% Implied Volatility Jump",
    simulatedLoss: "-12.4%",
    maxDrawdown: "-14.8%",
    volatilitySpike: "+45.2%",
    var99: "-9.1%",
    highlights: [
      "VIX term structure inversion (backwardation)",
      "Option implied volatility smile & skew distortion",
      "Option delta drift & tail-risk hedging cost",
      "Short volatility strategy ruin probability test",
    ],
  },
  {
    id: "liquidity",
    name: "Liquidity Freeze",
    badge: "Microstructure Shock",
    tagline: "-20% Depth Drop & Spread Blowout",
    icon: Droplets,
    iconBg: "bg-cyan-500/15 border-cyan-500/30",
    iconColor: "text-cyan-400",
    description:
      "Analyze market depth evaporations and bid-ask spread expansions during flash crashes. Quantify realistic execution slippage, market impact costs, and order queue depletion under severe institutional withdrawal.",
    ctaText: "Simulate Liquidity Freeze",
    ctaHref: "/risk",
    shockLabel: "-20% Order Book Depth Drop",
    simulatedLoss: "-9.8%",
    maxDrawdown: "-13.5%",
    volatilitySpike: "+32.1%",
    var99: "-7.6%",
    highlights: [
      "Bid-ask spread expands from 2 bps to 48 bps",
      "Market impact cost scaling with 6.4x multiplier",
      "Limit order book depletion & slippage guard",
      "Mid-cap & small-cap illiquidity penalty modeling",
    ],
  },
  {
    id: "var",
    name: "Value at Risk (VaR)",
    badge: "Statistical Tail Risk",
    tagline: "Parametric, Historical & Monte Carlo VaR",
    icon: Activity,
    iconBg: "bg-blue-500/15 border-blue-500/30",
    iconColor: "text-blue-400",
    description:
      "Compute institutional parametric, historical simulation, and Monte Carlo Value at Risk. Examine Expected Shortfall (CVaR) to understand average losses beyond the 99th percentile threshold with mathematical rigor.",
    ctaText: "Explore Value at Risk",
    ctaHref: "/risk",
    shockLabel: "99% VaR & Expected Shortfall",
    simulatedLoss: "-5.7%",
    maxDrawdown: "-11.4%",
    volatilitySpike: "+19.8%",
    var99: "-6.8%",
    highlights: [
      "95% VaR: -3.2% | 99% VaR: -5.7% (1-Day Horizon)",
      "Conditional VaR (Expected Shortfall): -6.8%",
      "10,000-path Monte Carlo probability distribution",
      "Fat-tail Student's t and GARCH volatility models",
    ],
  },
  {
    id: "drawdown",
    name: "Drawdown Analysis",
    badge: "Recovery & Duration",
    tagline: "Peak-to-Trough Capital Degradation",
    icon: TrendingDown,
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    iconColor: "text-emerald-400",
    description:
      "Inspect historical underwater curves, maximum peak-to-trough drawdowns, and recovery time distributions. Ensure your algorithmic strategy avoids catastrophic capital impairment during prolonged sideways or bear trends.",
    ctaText: "Analyze Drawdown Curves",
    ctaHref: "/risk",
    shockLabel: "Max Drawdown & Recovery Path",
    simulatedLoss: "-11.4%",
    maxDrawdown: "-11.4%",
    volatilitySpike: "+22.1%",
    var99: "-5.2%",
    highlights: [
      "Maximum historical drawdown: -11.4% (vs -28.4% benchmark)",
      "Average drawdown duration: 18 trading days",
      "Full recovery time: 33 calendar days",
      "Calmar Ratio: 2.54 with underwater duration metrics",
    ],
  },
];

export default function RiskIntelligenceShowcase() {
  const [activeRegimeId, setActiveRegimeId] = useState<string>("crash");
  const activeRegime =
    REGIMES.find((r) => r.id === activeRegimeId) || REGIMES[0];

  return (
    <div className="w-full">
      {/* 1. SECTION HEADER */}
      <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10">
        <h2 className="text-[32px] sm:text-[44px] lg:text-[50px] font-extrabold tracking-[-0.035em] text-[#0B1220] dark:text-white leading-[1.12]">
          Regimes
        </h2>

        <p className="mt-3.5 text-[15px] sm:text-[16px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          From liquidity freezes to volatility spikes, rate dislocations to systemic crashes—we bring non-linear quantitative stress models and institutional risk controls to safeguard your capital.
        </p>
      </div>

      {/* 2. MAIN SHOWCASE CONTAINER (2-Column Split: Left Info + Right Mockup) */}
      <div className="relative rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#081326] via-[#071120] to-[#050c18] p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden mb-8">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-rose-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Icon, Title, Description, Metrics & CTA */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRegime.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Square Icon Badge & Title */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border ${activeRegime.iconBg} ${activeRegime.iconColor} shadow-md`}
                  >
                    <activeRegime.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                      {activeRegime.name}
                    </h3>
                    <p className="text-[12px] font-semibold text-emerald-400 mt-1 uppercase tracking-wider font-mono">
                      {activeRegime.tagline}
                    </p>
                  </div>
                </div>

                {/* Impact Paragraph */}
                <p className="text-[14px] sm:text-[15px] leading-[1.7] text-slate-300/90 font-normal">
                  {activeRegime.description}
                </p>

                {/* Scenario Metric Highlights */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-[#0B1528] border border-slate-800 text-[11px] font-mono">
                  <div className="p-2 rounded-md bg-slate-900/80">
                    <span className="text-slate-500 block text-[9.5px]">SIMULATED LOSS</span>
                    <span className="text-rose-400 font-extrabold text-[15px]">{activeRegime.simulatedLoss}</span>
                  </div>
                  <div className="p-2 rounded-md bg-slate-900/80">
                    <span className="text-slate-500 block text-[9.5px]">MAX DRAWDOWN</span>
                    <span className="text-amber-400 font-extrabold text-[15px]">{activeRegime.maxDrawdown}</span>
                  </div>
                  <div className="p-2 rounded-md bg-slate-900/80">
                    <span className="text-slate-500 block text-[9.5px]">VOLATILITY JUMP</span>
                    <span className="text-purple-400 font-extrabold text-[15px]">{activeRegime.volatilitySpike}</span>
                  </div>
                  <div className="p-2 rounded-md bg-slate-900/80">
                    <span className="text-slate-500 block text-[9.5px]">99% TAIL VAR</span>
                    <span className="text-cyan-400 font-extrabold text-[15px]">{activeRegime.var99}</span>
                  </div>
                </div>

                {/* Highlights List */}
                <div className="space-y-2 pt-1">
                  {activeRegime.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[13px] text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-[#00c853] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <Link
                    href={activeRegime.ctaHref}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg text-[14px] font-bold text-white shadow-lg bg-[#00c853] hover:bg-[#00b047] hover:shadow-emerald-500/25 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>{activeRegime.ctaText}</span>
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
                key={activeRegime.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                {activeRegime.id === "crash" && <CrashScenarioMockup />}
                {activeRegime.id === "rates" && <RatesScenarioMockup />}
                {activeRegime.id === "vol" && <VolScenarioMockup />}
                {activeRegime.id === "liquidity" && <LiquidityScenarioMockup />}
                {activeRegime.id === "var" && <VaRScenarioMockup />}
                {activeRegime.id === "drawdown" && <DrawdownScenarioMockup />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 3. ICONIC FLOATING DOCK AT THE BOTTOM */}
      <div className="flex justify-center items-center">
        <div className="inline-flex items-center gap-2.5 sm:gap-3 px-4 py-2 rounded-xl bg-white dark:bg-[#0B1528] border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-md">
          {REGIMES.map((regime) => {
            const isActive = regime.id === activeRegimeId;
            const Icon = regime.icon;

            return (
              <button
                key={regime.id}
                type="button"
                onClick={() => setActiveRegimeId(regime.id)}
                title={`${regime.name}: ${regime.tagline}`}
                className={`group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#0B1220] dark:bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/30 scale-105"
                    : "text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 1. MARKET CRASH SCENARIO MOCKUP */}
{/* ========================================================================= */}
function CrashScenarioMockup() {
  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Macro Stress Simulator: -15% Systemic Plunge
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-rose-950/70 border border-rose-500/40 text-[10px] font-mono font-bold text-rose-400">
          ● TAIL RISK SHOCK: SEVERE
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Analog & Calibration */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block text-[9.5px]">HISTORICAL ANALOG</span>
            <span className="text-rose-400 font-bold">March 2020 Liquidity</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">EQUITY BETA IMPACT</span>
            <span className="text-white font-bold">1.34x Systematic</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">CROSS-ASSET CORR</span>
            <span className="text-amber-400 font-bold">Spikes to 0.92</span>
          </div>
        </div>

        {/* Tail Shock SVG Curve */}
        <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800 relative">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-slate-300 font-bold">Probability Distribution Shift (Normal vs Crash)</span>
            <span className="text-rose-400 font-bold">Cornish-Fisher Left Tail</span>
          </div>

          <div className="relative h-40 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
              <defs>
                <linearGradient id="crashGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Baseline Normal Bell Curve */}
              <path
                d="M 50 135 C 150 135, 200 130, 250 20 C 300 130, 350 135, 450 135"
                fill="none"
                stroke="#475569"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />

              {/* Shifted Left-Tail Shock Curve */}
              <path
                d="M 20 135 C 90 120, 140 30, 180 30 C 230 40, 300 130, 450 135 L 450 140 L 20 140 Z"
                fill="url(#crashGlow)"
              />
              <path
                d="M 20 135 C 90 120, 140 30, 180 30 C 230 40, 300 130, 450 135"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
              />

              {/* Threshold Pin Line */}
              <line x1="120" y1="10" x2="120" y2="135" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>

            <div className="absolute top-2 left-[24%] -translate-x-1/2 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500 text-[9.5px] font-mono text-rose-300 shadow">
              99% Expected Shortfall: -8.4%
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900 mt-1">
            <span>-25% Crash Tail</span>
            <span>-15% Shock</span>
            <span>0% Mean</span>
            <span>+15% Upside</span>
          </div>
        </div>

        {/* Asset Shock Breakdown Table */}
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="p-2.5 rounded-md bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">US TECH (NVDA/MSFT)</span>
            <span className="text-rose-400 font-bold text-[13px]">-18.4% Impact</span>
          </div>
          <div className="p-2.5 rounded-md bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">INDIA (RELIANCE/TCS)</span>
            <span className="text-rose-400 font-bold text-[13px]">-14.2% Impact</span>
          </div>
          <div className="p-2.5 rounded-md bg-slate-900/60 border border-emerald-500/30">
            <span className="text-slate-400 block text-[10px]">TAIL HEDGE / CASH</span>
            <span className="text-emerald-400 font-bold text-[13px]">+24.6% Offset</span>
          </div>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 2. RATES SCENARIO MOCKUP */}
{/* ========================================================================= */}
function RatesScenarioMockup() {
  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Yield Curve Dislocation: +200 bps Shock
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-400">
          ● MONETARY POLICY TIGHTENING
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block text-[9.5px]">10Y US TREASURY</span>
            <span className="text-amber-400 font-bold">4.20% → 6.20%</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">10Y INDIA G-SEC</span>
            <span className="text-amber-400 font-bold">7.10% → 8.90%</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">DURATION SENSITIVITY</span>
            <span className="text-white font-bold">-6.4 yrs Modified</span>
          </div>
        </div>

        {/* Yield Curve Twist Chart */}
        <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-slate-300 font-bold">Yield Curve Twist (+200 bps Parallel Shift)</span>
            <span className="text-amber-400 font-bold">Inversion Risk: High</span>
          </div>

          <div className="relative h-40 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
              <line x1="0" y1="40" x2="500" y2="40" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#1E293B" strokeDasharray="3 3" />

              {/* Baseline Yield Curve */}
              <path d="M 0 110 C 100 105, 250 85, 500 75" fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="4 4" />

              {/* Shocked Yield Curve */}
              <path d="M 0 55 C 100 50, 250 35, 500 25" fill="none" stroke="#F59E0B" strokeWidth="2.5" />

              <circle cx="250" cy="35" r="4" fill="#F59E0B" />
            </svg>
            <div className="absolute top-4 left-[50%] -translate-x-1/2 px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500 text-[9.5px] font-mono text-amber-300 shadow">
              Multiple Compression: -14.2% on Growth
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900 mt-1">
            <span>3M Bills</span>
            <span>2Y Note</span>
            <span>5Y Note</span>
            <span>10Y Benchmark</span>
            <span>30Y Bond</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">Equity P/E Multiple Contraction: <strong className="text-white">24.5x → 18.2x</strong></span>
          <span className="text-amber-400 font-bold">Simulated Loss: -8.1%</span>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 3. VOLATILITY SCENARIO MOCKUP */}
{/* ========================================================================= */}
function VolScenarioMockup() {
  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Volatility Surface: +80% VIX Blowout
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-purple-950/70 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-400">
          ● VEGA SHOCK &amp; SKEW INVERSION
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded-md bg-slate-900/80 border border-purple-500/30">
            <span className="text-slate-500 block text-[9.5px]">SPOT VIX</span>
            <span className="text-purple-400 font-bold text-[14px]">14.2 → 42.8</span>
          </div>
          <div className="p-2 rounded-md bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[9.5px]">INDIA VIX</span>
            <span className="text-purple-400 font-bold text-[14px]">12.8 → 34.5</span>
          </div>
          <div className="p-2 rounded-md bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[9.5px]">TERM STRUCTURE</span>
            <span className="text-rose-400 font-bold text-[13px]">Backwardation</span>
          </div>
          <div className="p-2 rounded-md bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[9.5px]">OPTION VEGA</span>
            <span className="text-white font-bold text-[13px]">-$18,400</span>
          </div>
        </div>

        {/* Volatility Surface Inversion SVG */}
        <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-slate-300 font-bold">Implied Volatility Term Structure (Contango vs Backwardation)</span>
            <span className="text-purple-400 font-bold">Gamma Squeeze</span>
          </div>

          <div className="relative h-40 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
              {/* Normal Contango */}
              <path d="M 0 115 C 100 100, 250 80, 500 50" fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="4 4" />

              {/* Inverted Backwardation Spike */}
              <path d="M 0 20 C 100 35, 250 70, 500 85" fill="none" stroke="#A855F7" strokeWidth="2.5" />
              <circle cx="50" cy="28" r="4" fill="#A855F7" />
            </svg>

            <div className="absolute top-2 left-[18%] -translate-x-1/2 px-2 py-0.5 rounded bg-purple-950/90 border border-purple-500 text-[9.5px] font-mono text-purple-300 shadow">
              Front-Month Vol: +200% Surge
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900 mt-1">
            <span>1M (Spot)</span>
            <span>2M</span>
            <span>3M</span>
            <span>6M</span>
            <span>12M Forward</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">Vega Risk Mitigated via Dynamic Delta Neutrality: <strong className="text-white">Active</strong></span>
          <span className="text-purple-400 font-bold">Loss: -12.4%</span>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 4. LIQUIDITY SCENARIO MOCKUP */}
{/* ========================================================================= */}
function LiquidityScenarioMockup() {
  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Order Book Evaporation: -20% Depth Shock
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-400">
          ● FLASH CRASH SLIPPAGE RISK
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block text-[9.5px]">BID-ASK SPREAD</span>
            <span className="text-cyan-400 font-bold">2.1 bps → 48.6 bps</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">SLIPPAGE MULTIPLIER</span>
            <span className="text-rose-400 font-bold">6.4x Standard</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">ORDER QUEUE FILL</span>
            <span className="text-amber-400 font-bold">Partial 42%</span>
          </div>
        </div>

        {/* Order Book Depth Depletion SVG */}
        <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-slate-300 font-bold">Limit Order Depth (Normal vs Evaporated)</span>
            <span className="text-cyan-400 font-bold">Liquidity Gap</span>
          </div>

          <div className="relative h-40 w-full flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
              {/* Green Bids Area */}
              <polygon points="0,135 180,135 180,90 140,70 80,40 0,40" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="2" />
              {/* Red Asks Area */}
              <polygon points="320,135 500,135 500,40 420,40 360,70 320,90" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="2" />

              {/* The Liquidity Void in Middle */}
              <rect x="180" y="40" width="140" height="95" fill="rgba(6, 182, 212, 0.1)" stroke="#06B6D4" strokeDasharray="3 3" />
            </svg>

            <div className="absolute px-3 py-1 rounded bg-cyan-950 border border-cyan-400 text-[10px] font-mono text-cyan-300 shadow">
              Liquidity Void: Spread Blowout (48.6 bps)
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900 mt-1">
            <span>$95 (Bids)</span>
            <span>$98</span>
            <span>$100 Mid-Price</span>
            <span>$102</span>
            <span>$105 (Asks)</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">Adaptive TWAP / VWAP Router Execution: <strong className="text-white">Active</strong></span>
          <span className="text-cyan-400 font-bold">Simulated Loss: -9.8%</span>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 5. VALUE AT RISK (VaR) SCENARIO MOCKUP */}
{/* ========================================================================= */}
function VaRScenarioMockup() {
  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Parametric &amp; Historical VaR Model
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-500/40 text-[10px] font-mono font-bold text-blue-400">
          ● CONFIDENCE INTERVAL: 99%
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block text-[9.5px]">95% 1-DAY VAR</span>
            <span className="text-blue-400 font-bold text-[14px]">-3.2% ($8,000)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">99% 1-DAY VAR</span>
            <span className="text-rose-400 font-bold text-[14px]">-5.7% ($14,250)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">EXPECTED SHORTFALL</span>
            <span className="text-rose-500 font-bold text-[14px]">-6.8% ($17,000)</span>
          </div>
        </div>

        {/* VaR Bell Curve SVG */}
        <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-slate-300 font-bold">Loss Distribution &amp; Tail Cutoffs</span>
            <span className="text-blue-400 font-bold">10,000 Monte Carlo Paths</span>
          </div>

          <div className="relative h-40 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
              <defs>
                <linearGradient id="varRedTail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Shaded Tail Area */}
              <path d="M 50 135 C 80 135, 110 130, 130 95 L 130 140 L 50 140 Z" fill="url(#varRedTail)" />

              {/* Normal Distribution Curve */}
              <path
                d="M 50 135 C 150 135, 200 120, 250 15 C 300 120, 350 135, 450 135"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
              />

              {/* 95% Cutoff Line */}
              <line x1="160" y1="15" x2="160" y2="135" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* 99% Cutoff Line */}
              <line x1="130" y1="15" x2="130" y2="135" stroke="#EF4444" strokeWidth="1.8" />
            </svg>

            <div className="absolute top-2 left-[28%] -translate-x-1/2 px-2 py-0.5 rounded bg-blue-950 border border-blue-400 text-[9.5px] font-mono text-blue-300">
              95% VaR: -3.2%
            </div>
            <div className="absolute top-8 left-[18%] -translate-x-1/2 px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-[9.5px] font-mono text-rose-300">
              99% VaR: -5.7%
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900 mt-1">
            <span>Extreme Tail Loss</span>
            <span>-5.7% (99%)</span>
            <span>-3.2% (95%)</span>
            <span>0% Mean</span>
            <span>Profits +</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">Expected Shortfall (Avg loss beyond 99%): <strong className="text-rose-400">-6.8%</strong></span>
          <span className="text-blue-400 font-bold">Pass: Within Limits</span>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 6. DRAWDOWN SCENARIO MOCKUP */}
{/* ========================================================================= */}
function DrawdownScenarioMockup() {
  return (
    <div className="w-full rounded-lg border border-slate-700/80 bg-[#0B1528] shadow-2xl overflow-hidden select-none">
      <div className="flex items-center justify-between px-4 py-3 bg-[#08101E] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[12px] font-mono text-slate-400 font-semibold truncate">
            Underwater Curve &amp; Recovery Analysis
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400">
          ● RECOVERY RATE: OPTIMAL
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block text-[9.5px]">MAX DRAWDOWN</span>
            <span className="text-rose-400 font-bold text-[14px]">-11.4% (Strategy)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">BENCHMARK MAX DD</span>
            <span className="text-slate-400 font-bold text-[14px]">-28.4% (NIFTY/S&amp;P)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9.5px]">RECOVERY TIMELINE</span>
            <span className="text-emerald-400 font-bold text-[14px]">33 Days Full Path</span>
          </div>
        </div>

        {/* Underwater Spikes SVG */}
        <div className="p-3.5 rounded-md bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-slate-300 font-bold">Historical Underwater Equity Degradation (%)</span>
            <span className="text-emerald-400 font-bold">0% Waterline</span>
          </div>

          <div className="relative h-40 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
              <defs>
                <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Waterline 0% */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#334155" strokeWidth="1.5" />

              {/* Underwater Area */}
              <polygon
                points="0,20 60,20 90,60 120,20 180,20 220,110 260,70 290,125 330,35 360,20 420,50 450,20 500,20 500,20 0,20"
                fill="url(#drawdownFill)"
                stroke="#EF4444"
                strokeWidth="2"
              />
            </svg>

            <div className="absolute top-[85px] left-[58%] -translate-x-1/2 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500 text-[9.5px] font-mono text-rose-300 shadow">
              Max Drawdown: -11.4%
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900 mt-1">
            <span>2019</span>
            <span>2020 (Covid Dip)</span>
            <span>2021</span>
            <span>2022 (Bear Fed)</span>
            <span>2023</span>
            <span>2024</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
          <span className="text-slate-400">Average Drawdown: <strong className="text-white">-4.2%</strong> across 142 closed cycles</span>
          <span className="text-emerald-400 font-bold">Calmar Ratio: 2.54</span>
        </div>
      </div>
    </div>
  );
}
