"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, X, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PortfolioCapabilities from "./PortfolioCapabilities";

export default function PortfolioHeader() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="relative z-10">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
        {/* Left Column: Eyebrow, Headline, Subtext, CTAs */}
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#1769FF] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1769FF] animate-pulse" />
            PORTFOLIO INTELLIGENCE
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.045em] text-[#0B1220] dark:text-white leading-[1.08]">
            Build portfolios,{" "}
            <span className="bg-gradient-to-r from-[#1769FF] via-[#4338CA] to-[#6366F1] bg-clip-text text-transparent">
              not just strategies.
            </span>
          </h2>

          {/* Description */}
          <p className="mt-4 text-base sm:text-lg text-[#64748B] dark:text-slate-400 leading-relaxed max-w-xl font-normal">
            Combine assets, strategies and risk controls to create well-structured portfolios. Optimize for your objectives and analyze performance, risk and diversification.
          </p>

          {/* CTA Group */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1769FF] hover:bg-[#1255cc] text-white text-sm font-semibold shadow-sm shadow-[#1769FF]/20 hover:shadow-md hover:shadow-[#1769FF]/30 transition-all group"
            >
              Explore Portfolio Lab
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
        <div className="lg:self-start">
          <PortfolioCapabilities />
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
                  <h3 className="font-bold text-[#0B1220] dark:text-white">Portfolio Construction Engine</h3>
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
                  QuantSynthica’s Portfolio Intelligence module empowers researchers to model cross-asset covariance structures, enforce non-negative and sector budget constraints, execute mean-variance quadratic optimization, and stress-test composite multi-strategy allocations.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200/80 dark:border-slate-800">
                    <div className="text-xs font-bold text-[#1769FF]">Efficient Frontier Solver</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Markowitz convex quadratic solver with Ledoit-Wolf shrinkage covariance.</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200/80 dark:border-slate-800">
                    <div className="text-xs font-bold text-[#10B981]">Hierarchical Risk Parity</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Machine learning tree-clustering risk parity without matrix inversion instability.</div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Link
                    href="/portfolio"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769FF] text-white text-xs font-semibold"
                  >
                    Open Live Portfolio Lab <ArrowRight className="w-3.5 h-3.5" />
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
