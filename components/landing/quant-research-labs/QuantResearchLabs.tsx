"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useReducedMotion, PanInfo } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Sigma,
  TrendingUp,
  Waves,
  Layers,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SectionBackground from "@/components/backgrounds/SectionBackground";
import {
  TechnicalVisual,
  StatisticalVisual,
  TimeSeriesVisual,
  VolatilityVisual,
  OptionsVisual,
  FactorVisual,
} from "./QuantResearchVisuals";

interface QuantModule {
  num: string;
  title: string;
  subtitle: string;
  description: string;
  methods: string[];
  cta: string;
  href: string;
  accent: string;
  accentRgb: string;
  badge: string;
  VisualComponent: React.ComponentType<{ accentColor: string; isHovered?: boolean }>;
}

const MODULES: QuantModule[] = [
  {
    num: "01",
    title: "Technical Analysis",
    subtitle: "Market structure & price action",
    description:
      "Analyze price behavior through trend, momentum, volatility and market structure indicators across multi-timeframe OHLCV feeds.",
    methods: ["RSI", "MACD", "Bollinger Bands", "ATR", "ADX", "VWAP", "Ichimoku"],
    cta: "Explore Technical Analysis",
    href: "/research?module=technical",
    accent: "#3B82F6", // electric blue
    accentRgb: "59, 130, 246",
    badge: "MOMENTUM & TREND",
    VisualComponent: TechnicalVisual,
  },
  {
    num: "02",
    title: "Statistical Analysis",
    subtitle: "Relationships hidden in the data",
    description:
      "Measure relationships, dependence and dimensional structure across financial variables with rigorous hypothesis testing.",
    methods: ["Regression", "Correlation", "PCA", "Pearson", "Spearman", "Covariance", "OLS"],
    cta: "Explore Statistical Analysis",
    href: "/research?module=statistical",
    accent: "#8B5CF6", // violet
    accentRgb: "139, 92, 246",
    badge: "CROSS-SECTIONAL STATS",
    VisualComponent: StatisticalVisual,
  },
  {
    num: "03",
    title: "Time Series",
    subtitle: "Forecasting & temporal dynamics",
    description:
      "Study financial time series through forecasting, stationarity tests, autocorrelation structures, and state-space regime modeling.",
    methods: ["ARIMA", "SARIMA", "HMM", "Stationarity", "Unit Root", "ACF / PACF"],
    cta: "Explore Time Series",
    href: "/research?module=timeseries",
    accent: "#06B6D4", // cyan
    accentRgb: "6, 182, 212",
    badge: "TEMPORAL FORECASTING",
    VisualComponent: TimeSeriesVisual,
  },
  {
    num: "04",
    title: "Volatility",
    subtitle: "Model uncertainty and risk",
    description:
      "Analyze changing market volatility dynamics using autoregressive conditional heteroskedasticity and implied volatility surface analytics.",
    methods: ["GARCH", "EGARCH", "Historical Volatility", "Realized Volatility", "Volatility Surface"],
    cta: "Explore Volatility",
    href: "/research?module=volatility",
    accent: "#F59E0B", // amber/orange
    accentRgb: "245, 158, 11",
    badge: "CONDITIONAL RISK",
    VisualComponent: VolatilityVisual,
  },
  {
    num: "05",
    title: "Options",
    subtitle: "Derivatives, Greeks & implied volatility",
    description:
      "Explore option pricing mechanics, closed-form Black-Scholes formulas, dynamic sensitivity Greeks, and non-linear payoff surfaces.",
    methods: ["Delta", "Gamma", "Theta", "Vega", "Black-Scholes", "Implied Volatility", "Payoff"],
    cta: "Explore Options",
    href: "/research?module=options",
    accent: "#F43F5E", // rose/red
    accentRgb: "244, 63, 94",
    badge: "NON-LINEAR DERIVATIVES",
    VisualComponent: OptionsVisual,
  },
  {
    num: "06",
    title: "Factor Research",
    subtitle: "Systematic return drivers",
    description:
      "Research systematic sources of long-horizon alpha, construct multi-factor composite scores, and monitor factor decay over market regimes.",
    methods: ["Momentum", "Value", "Quality", "Fama-French", "Multi-Factor Ranking", "Factor Decay"],
    cta: "Explore Factor Research",
    href: "/research?module=factors",
    accent: "#10B981", // green/emerald
    accentRgb: "16, 185, 129",
    badge: "SYSTEMATIC ALPHA",
    VisualComponent: FactorVisual,
  },
];

export default function QuantResearchLabs() {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Directional navigation (loops 01 <-> 06)
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : MODULES.length - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % MODULES.length);
  }, []);

  // Auto-scroll timer (every 5.5 seconds, pauses when user hovers or prefers reduced motion)
  useEffect(() => {
    if (shouldReduceMotion || !isAutoPlaying || isHovered) return;

    const timer = setInterval(() => {
      handleNext();
    }, 5500);

    return () => clearInterval(timer);
  }, [shouldReduceMotion, isAutoPlaying, isHovered, handleNext]);

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not focused on input/textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // Drag / Swipe handling
  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 45;
    if (info.offset.x < -swipeThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold) {
      handlePrev();
    }
  };

  const activeModule = MODULES[activeIndex];

  return (
    <section
      id="quant-research"
      className="relative w-full border-t border-border/80 dark:border-border/50 bg-[var(--bg-labs)] py-20 lg:py-28 overflow-hidden transition-colors duration-500"
    >
      {/* Component-Specific Ambient Background */}
      <SectionBackground variant="labs" />

      {/* Subtle Institutional Grid Texture in Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(23,105,255,0.06),transparent_70%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        {/* ============================================================== */}
        {/* 1. SECTION HEADER                                              */}
        {/* ============================================================== */}
        <div className="mb-10 sm:mb-14 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#1769FF] dark:text-blue-400">
              QUANT RESEARCH
            </span>
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
              CATALOGUE
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
            Research tools &amp; methodologies
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Six institutional-grade research modules covering market microstructure, statistical dependence,
            predictive time-series, volatility dynamics, options derivatives, and multi-factor equity models.
          </p>
        </div>

        {/* ============================================================== */}
        {/* 2. LARGE HORIZONTAL CAROUSEL WITH SIDE BUTTONS & AUTO-PLAY    */}
        {/* ============================================================== */}
        <div
          ref={carouselRef}
          className="relative w-full overflow-visible select-none py-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Side Back Button (Left) */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous research module"
            className="absolute left-1 sm:left-2 lg:-left-5 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-border/80 bg-card/90 dark:bg-[#070D18]/90 text-foreground shadow-xl backdrop-blur-md transition-all duration-200 hover:border-primary hover:bg-card hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:-translate-x-0.5" />
          </button>

          {/* Side Next Button (Right) */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next research module"
            className="absolute right-1 sm:right-2 lg:-right-5 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-border/80 bg-card/90 dark:bg-[#070D18]/90 text-foreground shadow-xl backdrop-blur-md transition-all duration-200 hover:border-primary hover:bg-card hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Carousel Track */}
          <div className="overflow-hidden w-full rounded-2xl py-1">
            <motion.div
              className="flex items-stretch gap-5 sm:gap-6 cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.08}
              onDragEnd={handleDragEnd}
              animate={{
                // Desktop peek translation: offset by activeIndex * (card width % + gap)
                x: `-${activeIndex * 78}%`,
              }}
              transition={{
                duration: shouldReduceMotion ? 0.05 : 0.5,
                ease: [0.22, 1, 0.36, 1], // easeOut cubic
              }}
            >
              {MODULES.map((mod, idx) => {
                const isActive = idx === activeIndex;
                const VisualComponent = mod.VisualComponent;

                return (
                  <motion.div
                    key={mod.num}
                    onClick={() => {
                      if (!isActive) setActiveIndex(idx);
                    }}
                    className={`relative shrink-0 w-[95%] sm:w-[86%] lg:w-[76%] min-h-[460px] sm:min-h-[480px] lg:min-h-[500px] rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 sm:p-8 lg:p-10 ${
                      isActive
                        ? "bg-card dark:bg-[#070D18] shadow-2xl opacity-100 z-20 cursor-default scale-100"
                        : "bg-card/60 dark:bg-[#050912]/80 shadow-md opacity-45 hover:opacity-75 z-10 cursor-pointer scale-[0.985] filter blur-[0.3px]"
                    }`}
                    style={{
                      borderColor: isActive
                        ? `rgba(${mod.accentRgb}, 0.45)`
                        : "var(--border)",
                      boxShadow: isActive
                        ? `0 20px 40px -15px rgba(${mod.accentRgb}, 0.12), 0 0 0 1px rgba(${mod.accentRgb}, 0.2)`
                        : "none",
                    }}
                    whileHover={isActive ? { scale: 1.005 } : { scale: 0.99 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Subtle Accent Ambient Glow in Top Right Corner */}
                    {isActive && (
                      <div
                        className="pointer-events-none absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20"
                        style={{ backgroundColor: mod.accent }}
                      />
                    )}

                    {/* Top Bar: Module Number + Category Tag */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="font-mono text-xl sm:text-2xl font-bold tracking-wider"
                          style={{ color: mod.accent }}
                        >
                          {mod.num}
                        </span>
                        <span className="h-4 w-[1px] bg-border" />
                        <span
                          className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                          style={{
                            color: mod.accent,
                            backgroundColor: `rgba(${mod.accentRgb}, 0.08)`,
                            borderColor: `rgba(${mod.accentRgb}, 0.25)`,
                          }}
                        >
                          {mod.badge}
                        </span>
                      </div>

                      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70 hidden sm:inline-block">
                        QUANT RESEARCH MODULE
                      </span>
                    </div>

                    {/* Main Body: 60% Left Text / 40% Right Interactive Visualization */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center my-6 flex-1">
                      {/* Left 7 Columns: Text Content */}
                      <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
                        <div>
                          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                            {mod.title}
                          </h3>
                          <p
                            className="mt-1 text-sm sm:text-base font-medium tracking-tight"
                            style={{ color: mod.accent }}
                          >
                            {mod.subtitle}
                          </p>
                        </div>

                        <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-xl">
                          {mod.description}
                        </p>

                        {/* Methodology Tags */}
                        <div className="pt-2">
                          <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2">
                            SUPPORTED METHODOLOGIES &amp; MODELS:
                          </span>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {mod.methods.map((method) => (
                              <span
                                key={method}
                                className="px-2.5 py-1 rounded font-mono text-[11px] font-medium bg-muted/60 text-foreground border border-border/60 transition-colors"
                              >
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right 5 Columns: Visual Asset (Desktop & Tablet) */}
                      <div className="lg:col-span-5 h-[220px] sm:h-[260px] lg:h-[280px] w-full flex items-center justify-center rounded-xl bg-background/40 border border-border/40 p-2 sm:p-4 overflow-hidden relative">
                        <VisualComponent accentColor={mod.accent} isHovered={isActive} />
                      </div>
                    </div>

                    {/* Bottom Action Strip: CTA Button + Module Status */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                      <Link
                        href={mod.href}
                        className="group inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm"
                        style={{
                          backgroundColor: isActive ? mod.accent : "var(--muted)",
                          color: isActive ? "#ffffff" : "var(--foreground)",
                        }}
                      >
                        <span>{mod.cta}</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>

                      <div className="font-mono text-xs text-muted-foreground hidden sm:flex items-center gap-2">
                        <span>MODULE {mod.num} OF 06</span>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: mod.accent }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. PROGRESS INDICATORS & AUTO-PLAY STATUS                      */}
        {/* ============================================================== */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-border/60 pt-6">
          {/* Left: Module Counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
              <span style={{ color: activeModule.accent }}>{activeModule.num}</span>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-muted-foreground">06</span>
            </div>

            <span className="text-border text-xs">|</span>

            <span className="font-mono text-xs text-foreground font-semibold">
              {activeModule.title}
            </span>
          </div>

          {/* Center: 6 Interactive Progress Dots */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Module selection">
            {MODULES.map((m, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={m.num}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Jump to module ${m.num}: ${m.title}`}
                  onClick={() => setActiveIndex(idx)}
                  className="h-2.5 rounded-full transition-all duration-300 relative overflow-hidden"
                  style={{
                    width: isSelected ? "28px" : "8px",
                    backgroundColor: isSelected ? m.accent : "var(--border)",
                    opacity: isSelected ? 1 : 0.45,
                  }}
                />
              );
            })}
          </div>

          {/* Right: Auto-scroll status & Keyboard Hint */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground/75">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isHovered ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span>{isHovered ? "PAUSED ON HOVER" : "AUTO-ADVANCING"}</span>
            </div>

            <span className="text-border hidden lg:inline">·</span>

            <div className="hidden lg:flex items-center gap-1">
              <span>NAVIGATE VIA</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-mono text-[10px]">
                ←
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-mono text-[10px]">
                →
              </kbd>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. SUPPORTING EDITORIAL STRIP                                  */}
        {/* ============================================================== */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-muted-foreground/80 border-t border-border/40 pt-4">
          <p className="font-sans text-xs sm:text-[13px] text-muted-foreground">
            Six research environments for understanding markets, testing hypotheses and building systematic strategies.
          </p>
          <div className="flex items-center gap-2 text-[11px] shrink-0">
            <span className="text-foreground font-semibold">06 Modules</span>
            <span>·</span>
            <span>30+ Methodologies</span>
            <span>·</span>
            <span className="hidden md:inline">Technical → Statistical → Time Series → Risk → Options → Factors</span>
          </div>
        </div>
      </div>
    </section>
  );
}
