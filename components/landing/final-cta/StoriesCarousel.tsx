"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Search,
  Lightbulb,
  BarChart2,
  Shield,
  Target,
  Layers,
  BarChart3,
  LayoutGrid,
  Globe,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CarouselCard {
  id: string;
  stepNumber: string;
  category: "journey" | "capability";
  categoryLabel: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  tags: string[];
}

const CAROUSEL_ITEMS: CarouselCard[] = [
  // 5-STAGE RESEARCH JOURNEY
  {
    id: "research",
    stepNumber: "01",
    category: "journey",
    categoryLabel: "Workflow Phase 1",
    title: "Research Markets",
    tagline: "Market Data & Fundamentals",
    description:
      "Explore daily price history, technicals, fundamentals, options chains, news and filings across US and Indian markets.",
    icon: Search,
    accentColor: "text-sky-400",
    accentBg: "bg-sky-500/15",
    accentBorder: "border-sky-500/30",
    tags: ["Daily Bars", "US & Indian Stocks", "Options"],
  },
  {
    id: "build",
    stepNumber: "02",
    category: "journey",
    categoryLabel: "Workflow Phase 2",
    title: "Build Strategies",
    tagline: "Rule-Based Alpha Modeling",
    description:
      "Formulate technical indicators, multi-condition entry and exit rules, and position sizing with a visual rule builder.",
    icon: Lightbulb,
    accentColor: "text-indigo-400",
    accentBg: "bg-indigo-500/15",
    accentBorder: "border-indigo-500/30",
    tags: ["Visual Rule Builder", "Multi-Rule", "Trailing Stops"],
  },
  {
    id: "test",
    stepNumber: "03",
    category: "journey",
    categoryLabel: "Workflow Phase 3",
    title: "Test Hypotheses",
    tagline: "Event-Driven Backtest Matrix",
    description:
      "Simulate strategy performance with next-open execution (t+1), realistic slippage modeling, and fee friction to eliminate lookahead bias.",
    icon: BarChart2,
    accentColor: "text-purple-400",
    accentBg: "bg-purple-500/15",
    accentBorder: "border-purple-500/30",
    tags: ["Zero Lookahead", "Friction Modeling", "Daily Bars"],
  },
  {
    id: "understand",
    stepNumber: "04",
    category: "journey",
    categoryLabel: "Workflow Phase 4",
    title: "Understand Risk",
    tagline: "Non-Linear Tail Shock Engine",
    description:
      "Measure drawdowns and Value at Risk using parametric, historical, Monte Carlo and Cornish-Fisher methods.",
    icon: Shield,
    accentColor: "text-rose-400",
    accentBg: "bg-rose-500/15",
    accentBorder: "border-rose-500/30",
    tags: ["99% VaR & CVaR", "Historical Shocks", "Drawdown Curves"],
  },
  {
    id: "decide",
    stepNumber: "05",
    category: "journey",
    categoryLabel: "Workflow Phase 5",
    title: "Decide & Allocate",
    tagline: "Multi-Asset Portfolio Construction",
    description:
      "Build portfolios, compare weighting methods and check allocation, correlation and risk across US and Indian holdings.",
    icon: Target,
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500/15",
    accentBorder: "border-emerald-500/30",
    tags: ["Min Variance", "Risk Parity", "Rebalancing"],
  },

  // 5 CORE CAPABILITIES & SCALE
  {
    id: "assets",
    stepNumber: "06",
    category: "capability",
    categoryLabel: "Market Coverage",
    title: "18,500+ Stocks",
    tagline: "Global Multi-Asset Universe",
    description:
      "Coverage across US equities, Indian equities listed on NSE and BSE, broad-market ETFs and equity options.",
    icon: Layers,
    accentColor: "text-cyan-400",
    accentBg: "bg-cyan-500/15",
    accentBorder: "border-cyan-500/30",
    tags: ["US & Indian Equities", "Index ETFs", "Options"],
  },
  {
    id: "indicators",
    stepNumber: "07",
    category: "capability",
    categoryLabel: "Quantitative Library",
    title: "24 Indicators",
    tagline: "Mathematical Signal Suite",
    description:
      "Built-in library including RSI, SMA, EMA, MACD, Bollinger Bands, ATR, ADX, Stochastic, VWAP and Donchian channels.",
    icon: BarChart3,
    accentColor: "text-blue-400",
    accentBg: "bg-blue-500/15",
    accentBorder: "border-blue-500/30",
    tags: ["Momentum & Trend", "Mean-Reversion", "Volatility Filters"],
  },
  {
    id: "modules",
    stepNumber: "08",
    category: "capability",
    categoryLabel: "Integrated Platform",
    title: "11 Research Tabs",
    tagline: "Full-Lifecycle Quant Suite",
    description:
      "Research, Strategy Lab, Backtests, Analytics, Portfolio and Risk in one workspace.",
    icon: LayoutGrid,
    accentColor: "text-fuchsia-400",
    accentBg: "bg-fuchsia-500/15",
    accentBorder: "border-fuchsia-500/30",
    tags: ["End-to-End Suite", "Unified Telemetry", "Cross-Asset"],
  },
  {
    id: "markets",
    stepNumber: "09",
    category: "capability",
    categoryLabel: "Cross-Border Coverage",
    title: "US + INDIA Markets",
    tagline: "Dual-Market Global Reach",
    description:
      "Cross-analyze S&P 500 and NASDAQ leaders alongside Indian NSE / BSE giants like Reliance and TCS with native dual-currency pricing.",
    icon: Globe,
    accentColor: "text-teal-400",
    accentBg: "bg-teal-500/15",
    accentBorder: "border-teal-500/30",
    tags: ["NYSE · NASDAQ", "NSE · BSE", "USD & INR Support"],
  },
  {
    id: "risk-engine",
    stepNumber: "10",
    category: "capability",
    categoryLabel: "Capital Safeguard",
    title: "Risk Engine",
    tagline: "Risk Analytics",
    description:
      "Measure parametric, historical, and Monte Carlo Value at Risk with Expected Shortfall, drawdown recovery, and historical scenario replay.",
    icon: ShieldCheck,
    accentColor: "text-rose-400",
    accentBg: "bg-rose-500/15",
    accentBorder: "border-rose-500/30",
    tags: ["Cornish-Fisher VaR", "Scenario Shocks", "Drawdown Guard"],
  },
];

export default function StoriesCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | "journey" | "capability">("all");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredItems = CAROUSEL_ITEMS.filter((item) => {
    if (filter === "all") return true;
    return item.category === filter;
  });

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);

    const cardWidth = 340;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(filteredItems.length - 1, Math.max(0, index)));
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScrollability);
    window.addEventListener("resize", checkScrollability);
    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [filteredItems.length]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -360 : 360;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="relative z-20 w-full select-none">
      {/* Top Header: Filter Pills + Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-white text-slate-900 shadow-md scale-105"
                : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800"
            }`}
          >
            All 10 Milestones
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("journey");
              if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === "journey"
                ? "bg-white text-slate-900 shadow-md scale-105"
                : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800"
            }`}
          >
            5-Stage Journey
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("capability");
              if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === "capability"
                ? "bg-white text-slate-900 shadow-md scale-105"
                : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800"
            }`}
          >
            5 Core Capabilities
          </button>
        </div>

        {/* Counter */}
        <div className="text-[12px] font-mono font-bold text-slate-400">
          <span className="text-white">{activeIndex + 1}</span> / {filteredItems.length}
        </div>
      </div>

      {/* Relative Carousel Wrapper with Extreme Left & Right Floating Arrows */}
      <div className="relative w-full group/carousel">
        {/* Extreme Left Arrow (Bigger, High-Contrast) */}
        <button
          type="button"
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Previous Slide"
          className={`absolute -left-3 sm:-left-5 lg:-left-7 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-slate-700/90 bg-[#070E1C]/95 text-white shadow-2xl shadow-black/90 backdrop-blur-md transition-all duration-200 ${
            canScrollLeft
              ? "hover:border-cyan-400 hover:text-cyan-300 hover:bg-[#0C1A30] hover:scale-110 active:scale-95 cursor-pointer ring-1 ring-white/10"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.2]" />
        </button>

        {/* Extreme Right Arrow (Bigger, High-Contrast) */}
        <button
          type="button"
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Next Slide"
          className={`absolute -right-3 sm:-right-5 lg:-right-7 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-slate-700/90 bg-[#070E1C]/95 text-white shadow-2xl shadow-black/90 backdrop-blur-md transition-all duration-200 ${
            canScrollRight
              ? "hover:border-cyan-400 hover:text-cyan-300 hover:bg-[#0C1A30] hover:scale-110 active:scale-95 cursor-pointer ring-1 ring-white/10"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.2]" />
        </button>

        {/* Scrollable Card Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 snap-x snap-mandatory px-1 sm:px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filteredItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="snap-start shrink-0 w-[300px] sm:w-[330px] lg:w-[350px] rounded-3xl border border-slate-800/90 bg-gradient-to-b from-[#0B1528]/95 via-[#091120]/95 to-[#050C18]/95 p-5 sm:p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Header: Step Number / Badge + Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono font-black text-white border border-slate-700/60">
                        {item.stepNumber}
                      </span>
                      <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${item.accentBg} ${item.accentBorder} ${item.accentColor} shadow-md transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h4 className="text-xl font-bold text-white tracking-tight leading-snug group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className={`text-[12px] font-semibold mt-0.5 ${item.accentColor} font-mono uppercase tracking-wider`}>
                    {item.tagline}
                  </p>

                  {/* Description Paragraph */}
                  <p className="mt-3 text-[13.5px] leading-[1.65] text-slate-300/85 font-normal">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Feature Tags */}
                <div className="pt-5 mt-5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-lg bg-slate-900/80 text-[10px] font-mono text-slate-400 border border-slate-800 group-hover:border-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll Indicators / Dots Bar */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {filteredItems.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const el = scrollContainerRef.current;
              if (el) {
                el.scrollTo({ left: idx * 340, behavior: "smooth" });
              }
            }}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === idx
                ? "w-8 bg-gradient-to-r from-cyan-400 to-blue-500"
                : "w-2 bg-slate-800 hover:bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
