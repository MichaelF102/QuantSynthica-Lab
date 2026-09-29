"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, ShieldAlert, Database, BarChart3, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RiskHeader() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="relative z-10">
      {/* Top Header Row: Title & Capabilities */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
        {/* Left Column: Eyebrow, Headline, Subtext, CTAs */}
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#1769FF] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1769FF] animate-pulse" />
            RISK INTELLIGENCE
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.045em] text-[#0B1220] dark:text-white leading-[1.08]">
            Understand{" "}
            <span className="bg-gradient-to-r from-[#1769FF] via-[#4338CA] to-[#6366F1] bg-clip-text text-transparent">
              what can go wrong.
            </span>
          </h2>

          {/* Description */}
          <p className="mt-4 text-base sm:text-lg text-[#64748B] dark:text-slate-400 leading-relaxed max-w-xl font-normal">
            Measure downside risk, analyze volatility, stress-test extreme scenarios and understand the full risk profile of your portfolio.
          </p>

          {/* CTA Group */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/risk"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1769FF] hover:bg-[#1255cc] text-white text-sm font-semibold shadow-sm shadow-[#1769FF]/20 hover:shadow-md hover:shadow-[#1769FF]/30 transition-all group"
            >
              Explore Risk Analytics
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1528] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0B1220] dark:text-slate-200 text-sm font-medium shadow-2xs transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 flex items-center justify-center">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right Column: 4 Capability Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:self-start">
          {/* Capability 1 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0B1528]/95 shadow-2xs backdrop-blur-xs">
            <div className="w-9 h-9 rounded-lg bg-blue-50/80 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Comprehensive Risk</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-tight">VaR · Drawdown · Vol · Stress</div>
            </div>
          </div>

          {/* Capability 2 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0B1528]/95 shadow-2xs backdrop-blur-xs">
            <div className="w-9 h-9 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Multiple Asset Classes</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-tight">Equity, Options, Multi-Asset</div>
            </div>
          </div>

          {/* Capability 3 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0B1528]/95 shadow-2xs backdrop-blur-xs">
            <div className="w-9 h-9 rounded-lg bg-sky-50/80 dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/60">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Scenario Analysis</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-tight">Stress Testing & Monte Carlo</div>
            </div>
          </div>

          {/* Capability 4 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0B1528]/95 shadow-2xs backdrop-blur-xs">
            <div className="w-9 h-9 rounded-lg bg-teal-50/80 dark:bg-teal-950/60 text-[#0D9488] dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/60">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Built for Everyone</div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-tight">Quants · Investors · Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0B1528] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1769FF]" />
                  <h3 className="font-bold text-[#0B1220] dark:text-white">Risk Intelligence Architecture</h3>
                </div>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-sm text-[#526174] dark:text-slate-300">
                <p>
                  QuantSynthica&apos;s Risk Observatory calculates full portfolio probability distributions, conditional tail risks (Expected Shortfall), multi-horizon drawdown dynamics, and parametric scenario shocks across global asset classes.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-xs font-bold text-[#1769FF] dark:text-blue-400">Parametric & Historical VaR</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily 95% & 99% critical horizons with decay-weighted covariance.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="text-xs font-bold text-[#EF4444] dark:text-rose-400">Extreme Scenario Engine</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">2008 liquidity crisis, pandemic shocks, and interest rate spikes.</div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Link
                    href="/risk"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769FF] text-white text-xs font-semibold"
                  >
                    Open Live Risk Engine <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
