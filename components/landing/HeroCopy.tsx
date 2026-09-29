"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Globe, Cpu, ShieldCheck, BarChart3, X } from "lucide-react";

export default function HeroCopy() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="flex flex-col justify-center py-4 lg:py-6 max-w-[660px]">
      {/* Eyebrow */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[12px] font-bold tracking-[0.2em] text-[#1769FF] uppercase">
          QUANTITATIVE RESEARCH PLATFORM
        </span>
      </div>

      {/* Large Headline */}
      <h1 className="text-[44px] sm:text-[60px] lg:text-[76px] font-bold leading-[0.98] tracking-[-0.045em] text-[#0B1220] dark:text-white">
        Research markets.
        <br />
        Build strategies.
        <br />
        Simulate and
        <br />
        <span className="bg-gradient-to-r from-[#1769FF] via-[#3B82F6] to-[#4F46E5] bg-clip-text text-transparent">
          invest with conviction.
        </span>
      </h1>

      {/* Description */}
      <p className="mt-6 max-w-[580px] text-[17px] sm:text-[18px] leading-[1.62] text-[#526174] dark:text-slate-400">
        A unified quantitative research environment for global and Indian markets.
        Explore data, develop systematic strategies, run backtests, and understand portfolio risk
        — all in one platform.
      </p>

      {/* CTA Buttons */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        {/* Primary CTA */}
        <Link
          href="/research"
          className="group relative inline-flex h-[52px] items-center justify-center gap-2.5 rounded-[10px] bg-[#1769FF] px-7 text-[15px] font-semibold text-white shadow-lg shadow-[#1769FF]/25 transition-all duration-200 hover:bg-[#1258db] hover:shadow-xl hover:shadow-[#1769FF]/30 active:scale-[0.98]"
        >
          <BarChart3 className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>Explore the Platform</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Secondary CTA */}
        <button
          type="button"
          onClick={() => setDemoOpen(true)}
          className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-[10px] border border-slate-200/90 bg-white px-6 text-[15px] font-semibold text-[#0B1220] shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] dark:border-slate-800 dark:bg-[#0B1528] dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 dark:bg-[#1769FF] text-white">
            <Play className="h-2.5 w-2.5 fill-white ml-0.5" />
          </div>
          <span>Watch Demo</span>
        </button>
      </div>

      {/* Value Proposition Row */}
      <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {/* Feature 1 */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white/90 p-2.5 shadow-2xs backdrop-blur-xs transition-colors hover:border-blue-100 dark:border-slate-800 dark:bg-[#0B1528]/90 dark:hover:border-slate-700">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50/90 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
            <Globe className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-[#0B1220] dark:text-white leading-tight">
              Global + Indian Markets
            </div>
            <div className="text-[10.5px] text-[#526174] dark:text-slate-400 whitespace-nowrap mt-0.5">
              US • India • 1,000+ Assets
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white/90 p-2.5 shadow-2xs backdrop-blur-xs transition-colors hover:border-blue-100 dark:border-slate-800 dark:bg-[#0B1528]/90 dark:hover:border-slate-700">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50/90 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
            <Cpu className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-[#0B1220] dark:text-white leading-tight">
              End-to-End Research
            </div>
            <div className="text-[10.5px] text-[#526174] dark:text-slate-400 whitespace-nowrap mt-0.5">
              Data → Strategy → Backtest
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white/90 p-2.5 shadow-2xs backdrop-blur-xs transition-colors hover:border-blue-100 dark:border-slate-800 dark:bg-[#0B1528]/90 dark:hover:border-slate-700">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50/90 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-[#0B1220] dark:text-white leading-tight">
              Risk Focused
            </div>
            <div className="text-[10.5px] text-[#526174] dark:text-slate-400 whitespace-nowrap mt-0.5">
              Analytics • Portfolio • Risk
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0B1528] dark:border dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-[#0B1220] dark:text-white">
                QuantSynthica Lab Interactive Walkthrough
              </h3>
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 aspect-video rounded-xl bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-[#1769FF] flex items-center justify-center text-white mb-3 shadow-lg">
                <Play className="h-6 w-6 fill-white ml-0.5" />
              </div>
              <p className="font-semibold text-base">QuantSynthica Terminal Demo</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Tour charting, strategy backtesting with 0-lookahead bias, institutional fundamental analysis, and risk models.
              </p>
              <Link
                href="/research"
                onClick={() => setDemoOpen(false)}
                className="mt-4 rounded-lg bg-[#1769FF] px-4 py-2 text-xs font-semibold text-white"
              >
                Launch Terminal Directly →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
