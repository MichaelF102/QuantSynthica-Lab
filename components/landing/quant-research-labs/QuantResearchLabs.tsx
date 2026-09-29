"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Sigma,
  TrendingUp,
  Waves,
  Layers,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import SectionBackground from "@/components/backgrounds/SectionBackground";

interface ResearchArea {
  num: string;
  title: string;
  description: string;
  methods: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const RESEARCH_AREAS: ResearchArea[] = [
  {
    num: "01",
    title: "Technical Analysis",
    description: "Market structure & price action",
    methods: "RSI · MACD · Bollinger · ATR · ADX",
    icon: Activity,
    href: "/research?module=technical",
  },
  {
    num: "02",
    title: "Statistical Analysis",
    description: "Regression · Correlation · PCA",
    methods: "OLS · PCA · Pearson · Spearman · Covariance",
    icon: Sigma,
    href: "/research?module=statistical",
  },
  {
    num: "03",
    title: "Time Series",
    description: "Forecasting & temporal dynamics",
    methods: "ARIMA · SARIMA · HMM · Stationarity · Unit Root",
    icon: TrendingUp,
    href: "/research?module=timeseries",
  },
  {
    num: "04",
    title: "Volatility",
    description: "GARCH · EGARCH · Realized Volatility",
    methods: "GARCH(1,1) · EGARCH · Historical Vol · Vol Surface",
    icon: Waves,
    href: "/research?module=volatility",
  },
  {
    num: "05",
    title: "Options",
    description: "Greeks · IV · Payoff",
    methods: "Delta · Gamma · Vega · Theta · Black-Scholes",
    icon: Layers,
    href: "/research?module=options",
  },
  {
    num: "06",
    title: "Factor Research",
    description: "Momentum · Value · Quality",
    methods: "Fama-French · Multi-Factor Ranking · Factor Decay",
    icon: BarChart3,
    href: "/research?module=factors",
  },
];

const EASE_CUBIC: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function QuantResearchLabs() {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Stagger delays matching prompt specifications
  const getRowDelay = (index: number) => {
    if (shouldReduceMotion) return 0;
    return 0.12 + index * 0.05;
  };

  return (
    <section
      id="quant-research"
      className="relative w-full border-t border-slate-200/80 dark:border-slate-800 bg-[var(--bg-labs)] py-20 lg:py-28 overflow-hidden transition-colors duration-500"
    >
      {/* Component-Specific Semantic Labs Background */}
      <SectionBackground variant="labs" />

      <div className="relative mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
        {/* ============================================================== */}
        {/* 1. SECTION HEADER (Editorial Reveal)                           */}
        {/* ============================================================== */}
        <div className="mb-10 sm:mb-12">
          {/* Eyebrow */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.45,
              ease: EASE_CUBIC,
              delay: 0,
            }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1769FF] dark:text-blue-400">
              QUANT RESEARCH
            </span>
          </motion.div>

          {/* Main Description */}
          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.45,
              ease: EASE_CUBIC,
              delay: shouldReduceMotion ? 0 : 0.08,
            }}
            className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            Research tools &amp; methodologies
          </motion.h2>
        </div>

        {/* ============================================================== */}
        {/* 2. RESEARCH ROWS 01–06 (Editorial Index with Stagger)          */}
        {/* ============================================================== */}
        <div className="relative border-t border-slate-200/70 dark:border-slate-800/80">
          {RESEARCH_AREAS.map((area, idx) => {
            const Icon = area.icon;
            const isHovered = hoveredIdx === idx;

            return (
              <motion.div
                key={area.num}
                initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  ease: EASE_CUBIC,
                  delay: getRowDelay(idx),
                }}
                className="relative border-b border-slate-200/70 dark:border-slate-800/80 transition-colors"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <Link
                  href={area.href}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between py-5 sm:py-6 px-3 sm:px-4 rounded-lg transition-colors duration-200 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 outline-none focus-visible:ring-2 focus-visible:ring-[#1769FF]"
                >
                  {/* Active / Hover Left Vertical Indicator (subtle scaleY: 0 -> 1) */}
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      scaleY: isHovered ? 1 : 0,
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ transformOrigin: "top" }}
                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#1769FF] rounded-r"
                  />

                  {/* Left: Number + Title + Description */}
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                    {/* Monospace 2-Digit Number */}
                    <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors duration-200 shrink-0 pt-0.5 sm:pt-0">
                      {area.num}
                    </span>

                    {/* Small Monochrome Icon (16-18px, no colored square) */}
                    <div className="text-slate-400 dark:text-slate-500 group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors duration-200 shrink-0 pt-0.5 sm:pt-0">
                      <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                    </div>

                    {/* Title & Editorial Description */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 min-w-0">
                      <h3 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200 whitespace-nowrap">
                        {area.title}
                      </h3>

                      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                        {area.description}
                      </span>
                    </div>
                  </div>

                  {/* Right: Methodology Tags + Editorial Arrow */}
                  <div className="mt-2.5 sm:mt-0 flex items-center justify-between sm:justify-end gap-5 pl-8 sm:pl-0">
                    {/* Method Tags (reveal slightly on hover: opacity 0.45 -> 1) */}
                    <span
                      className={`text-[11px] sm:text-xs font-mono transition-all duration-200 ${
                        isHovered
                          ? "opacity-100 text-[#1769FF] dark:text-blue-400 translate-y-0"
                          : "opacity-45 text-slate-500 dark:text-slate-400 translate-y-[1px]"
                      }`}
                    >
                      {area.methods}
                    </span>

                    {/* Editorial Subtle Arrow (x: 0 -> 4px on hover) */}
                    <motion.div
                      animate={{
                        x: isHovered ? 4 : 0,
                        opacity: isHovered ? 1 : 0.4,
                      }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="text-slate-400 group-hover:text-[#1769FF] dark:group-hover:text-blue-400 shrink-0"
                    >
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
