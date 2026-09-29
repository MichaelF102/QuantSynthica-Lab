"use client";

import React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Database,
  BarChart3,
  Sliders,
  PlayCircle,
  Shield,
  Briefcase,
  Layers,
  LineChart,
  Activity,
  Zap,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface StageData {
  index: number;
  tag: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  highlights: {
    icon: LucideIcon;
    title: string;
    detail: string;
  }[];
}

export const STAGES: StageData[] = [
  {
    index: 0,
    tag: "01 / DATA",
    headline: "Build the research universe.",
    description:
      "Start with market, financial and economic data across US and Indian markets.",
    ctaText: "Explore market universe",
    ctaHref: "/research",
    highlights: [
      {
        icon: Database,
        title: "Global & Indian equities",
        detail: "US (NYSE, NASDAQ) + India (NSE, BSE)",
      },
      {
        icon: Layers,
        title: "ETFs & indices",
        detail: "Broad market and sector coverage",
      },
      {
        icon: Activity,
        title: "Options data",
        detail: "Chains, Greeks and historical data",
      },
      {
        icon: BarChart3,
        title: "Economic data",
        detail: "Macro indicators from global sources",
      },
    ],
  },
  {
    index: 1,
    tag: "02 / ANALYSE",
    headline: "Turn data into insight.",
    description:
      "Explore technical, statistical and fundamental relationships across high-resolution series.",
    ctaText: "Open analytical charts",
    ctaHref: "/research",
    highlights: [
      {
        icon: LineChart,
        title: "Multi-timeframe OHLCV",
        detail: "Daily, weekly, and intraday historical series",
      },
      {
        icon: Activity,
        title: "Algorithmic overlays",
        detail: "EMA (20, 50, 200), SMA, Bollinger Bands, ATR",
      },
      {
        icon: BarChart3,
        title: "Momentum & Oscillators",
        detail: "RSI (14), MACD histogram, Stochastic & Volume",
      },
      {
        icon: Layers,
        title: "Statistical depth",
        detail: "Rolling volatility, beta vs S&P 500, correlation",
      },
    ],
  },
  {
    index: 2,
    tag: "03 / STRATEGY",
    headline: "Turn hypotheses into rules.",
    description:
      "Translate research ideas into explicit systematic signals without black-box opacity.",
    ctaText: "Launch Strategy Builder",
    ctaHref: "/strategies",
    highlights: [
      {
        icon: Sliders,
        title: "Deterministic signals",
        detail: "No black-box guesses — explicit Boolean logic",
      },
      {
        icon: Zap,
        title: "Multi-factor filters",
        detail: "Combine price action with momentum & volume gates",
      },
      {
        icon: PlayCircle,
        title: "Execution triggers",
        detail: "Next-open t+1 fill modeling on candle close",
      },
      {
        icon: Shield,
        title: "Dynamic risk boundaries",
        detail: "Configurable trailing stops & profit targets",
      },
    ],
  },
  {
    index: 3,
    tag: "04 / BACKTEST",
    headline: "Test the idea before trusting it.",
    description:
      "Evaluate strategy behaviour across historical periods with rigorous institutional simulation.",
    ctaText: "Run Backtest Engine",
    ctaHref: "/backtests",
    highlights: [
      {
        icon: PlayCircle,
        title: "Zero lookahead bias",
        detail: "Signal evaluated on close, filled on subsequent open",
      },
      {
        icon: Activity,
        title: "Institutional friction",
        detail: "Slippage model and per-share commission drag",
      },
      {
        icon: BarChart3,
        title: "Trade logs & metrics",
        detail: "Win rate, profit factor, Kelly criterion, equity path",
      },
      {
        icon: LineChart,
        title: "Benchmark comparison",
        detail: "Real-time alpha vs S&P 500 / NIFTY 50",
      },
    ],
  },
  {
    index: 4,
    tag: "05 / RISK",
    headline: "Understand what can go wrong.",
    description:
      "Measure volatility, drawdowns, exposure and downside risk across changing regimes.",
    ctaText: "Inspect Risk Analytics",
    ctaHref: "/risk",
    highlights: [
      {
        icon: Shield,
        title: "Value at Risk (VaR)",
        detail: "Parametric & Historical VaR at 95% & 99% confidence",
      },
      {
        icon: Activity,
        title: "Maximum drawdown",
        detail: "Underwater duration, recovery time, peak-to-trough",
      },
      {
        icon: Zap,
        title: "Conditional VaR (CVaR)",
        detail: "Expected Shortfall in extreme tail risk regimes",
      },
      {
        icon: Layers,
        title: "Capital preservation",
        detail: "Gross and net exposure limits with margin guardrails",
      },
    ],
  },
  {
    index: 5,
    tag: "06 / PORTFOLIO",
    headline: "Turn research into a portfolio.",
    description:
      "Combine tested ideas into a structured investment framework with optimal asset allocation.",
    ctaText: "Construct Portfolio Book",
    ctaHref: "/portfolio",
    highlights: [
      {
        icon: Briefcase,
        title: "Mean-variance optimization",
        detail: "Markowitz efficient frontier & Sharpe maximization",
      },
      {
        icon: Layers,
        title: "Cross-asset weighting",
        detail: "US & Indian dual-currency allocation balancing",
      },
      {
        icon: Activity,
        title: "Volatility parity",
        detail: "Risk budgeting across uncorrelated strategy books",
      },
      {
        icon: BarChart3,
        title: "Drift & rebalancing",
        detail: "Automated rebalancing triggers with transaction costs",
      },
    ],
  },
];

interface WorkflowStageProps {
  activeStage: number;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function WorkflowStage({
  activeStage,
  onPrev,
  onNext,
}: WorkflowStageProps) {
  const current = STAGES[activeStage] || STAGES[0];
  const isFirst = activeStage === 0;
  const isLast = activeStage === STAGES.length - 1;

  return (
    <div
      id={`workflow-panel-${activeStage}`}
      role="tabpanel"
      aria-labelledby={`workflow-tab-${activeStage}`}
      className="relative flex flex-col justify-between py-1"
    >
      <motion.div
        key={current.index}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="space-y-4"
      >
          {/* Eyebrow Tag + Stepper Controls */}
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-mono font-bold tracking-[0.2em] text-[#1769FF] uppercase">
              {current.tag}
            </div>

            {/* Stage Counter & Step Navigation */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {String(activeStage + 1).padStart(2, "0")}
              </span>
              <span className="text-slate-400 dark:text-slate-500">/</span>
              <span>{String(STAGES.length).padStart(2, "0")}</span>

              {onPrev && onNext && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={onPrev}
                    disabled={isFirst}
                    aria-label="Previous workflow stage"
                    className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0B1220] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onNext}
                    disabled={isLast}
                    aria-label="Next workflow stage"
                    className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0B1220] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Big Bold Headline */}
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0B1220] dark:text-white leading-[1.15]">
            {current.headline}
          </h3>

          {/* Supporting Copy */}
          <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#526174] dark:text-slate-400">
            {current.description}
          </p>

          {/* Highlights Grid with Icons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {current.highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/80 border border-slate-100/90 dark:bg-[#0B1528] dark:border-slate-800"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-[#1769FF] dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400 mt-0.5">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[#0B1220] dark:text-white truncate">
                      {h.title}
                    </div>
                    <div className="text-[11px] text-[#526174] dark:text-slate-400 leading-snug line-clamp-2">
                      {h.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row: Primary CTA & Next Stage Link */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={current.ctaHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1769FF] px-4.5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {onNext && !isLast && (
              <button
                onClick={onNext}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-[#1769FF] dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <span>Next: {STAGES[activeStage + 1].tag.split("/")[1]?.trim()}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
    </div>
  );
}
