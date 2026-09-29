"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import CapabilityStrip from "./CapabilityStrip";
import QuantEngineScene from "./QuantEngineScene";

interface StrategyBacktestHeroProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
}

export default function StrategyBacktestHero({
  activeStage,
  onSelectStage,
}: StrategyBacktestHeroProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center mb-10 lg:mb-14">
      {/* ============================================================ */}
      {/* LEFT COLUMN: Editorial Copy, CTAs & 4 Capability Cards (5 cols) */}
      {/* ============================================================ */}
      <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
        <div>
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-[#1769FF] animate-pulse" />
            <span className="text-[12px] font-bold tracking-[0.2em] text-[#1769FF] uppercase">
              03 — STRATEGY → BACKTEST
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-[40px] sm:text-[50px] lg:text-[56px] font-bold tracking-[-0.04em] text-[#0B1220] dark:text-white leading-[1.05]">
            Build the idea.
            <br />
            Test the hypothesis.
            <br />
            <span className="bg-gradient-to-r from-[#1769FF] via-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
              Evaluate the result.
            </span>
          </h2>

          {/* Supporting Copy */}
          <p className="mt-4 text-[15px] sm:text-[16px] leading-[1.65] text-[#526174] dark:text-slate-400 max-w-xl">
            Turn quantitative ideas into measurable evidence. Define rules, test them against historical data, and evaluate performance, risk and robustness.
          </p>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            <Link
              href="/strategies"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#1769FF] px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:bg-[#0f59e0] hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Explore Strategy Lab</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("strategy-details");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/85 dark:bg-[#0B1528] px-5 py-3 text-[14px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs backdrop-blur-xs transition-all hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
                <Play className="h-3 w-3 fill-current ml-0.5" />
              </div>
              <span>See How It Works</span>
            </button>
          </div>
        </div>

        {/* 4 Capability Cards in a 2x2 Grid */}
        <CapabilityStrip />
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: 3D QUANT ENGINE & INTERACTIVE WORKFLOW NODES (7 cols) */}
      {/* ============================================================ */}
      <div className="lg:col-span-7 flex flex-col justify-center">
        <QuantEngineScene
          activeStage={activeStage}
          onSelectStage={onSelectStage}
        />
      </div>
    </div>
  );
}
