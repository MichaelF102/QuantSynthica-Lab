"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Layers, ArrowDown } from "lucide-react";
import QuantSynthicaLogo from "@/components/branding/QuantSynthicaLogo";

export default function QuantSynthicaConnection() {
  const WORKFLOW_STEPS = [
    { num: "01", label: "Research", desc: "Dual-market price feeds, fundamental ratios, cross-asset returns", href: "/research" },
    { num: "02", label: "Models", desc: "Statistical factors, mean-reversion signals, trend indicators", href: "/research" },
    { num: "03", label: "Strategies", desc: "Rule-based signal generation, parameter optimization", href: "/strategies" },
    { num: "04", label: "Backtesting", desc: "0-lookahead execution, next-open fills, realistic slippage", href: "/backtests" },
    { num: "05", label: "Risk", desc: "Value at Risk (VaR), Expected Shortfall, tail-risk observatory", href: "/risk" },
    { num: "06", label: "Portfolio", desc: "Covariance matrices, quadratic optimization, efficient frontier", href: "/portfolio" },
  ];

  return (
    <section className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#070D18]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-[#0A101D] p-8 sm:p-12 relative overflow-hidden">
          {/* Background subtle radial glow */}
          <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-600/10 blur-[120px] rounded-full" />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-4">
              <QuantSynthicaLogo variant="full" size="default" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Why QuantSynthicaLab?
            </h2>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
              &ldquo;QuantSynthicaLab is my research environment for exploring quantitative finance, data engineering, machine learning, and financial analytics.&rdquo;
            </p>

            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Designed from first principles to bridge the gap between abstract academic statistics and live-trading friction. It serves as an integrated laboratory for testing quantitative hypotheses across both mature US equities and high-volatility Indian markets.
            </p>
          </div>

          {/* Workflow Sequence: Research -> Models -> Strategies -> Backtesting -> Risk -> Portfolio */}
          <div className="relative z-10 mt-10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400 mb-4">
              THE SYSTEMATIC RESEARCH LIFECYCLE
            </div>

            {/* Desktop Horizontal Stepper */}
            <div className="hidden lg:grid grid-cols-6 gap-3">
              {WORKFLOW_STEPS.map((step, idx) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-2">
                    <span>{step.num}</span>
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors">
                    {step.label}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {step.desc}
                  </p>
                </Link>
              ))}
            </div>

            {/* Mobile / Tablet Vertical Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
              {WORKFLOW_STEPS.map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#1769FF] dark:text-blue-400">
                        {step.num}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {step.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {step.desc}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
