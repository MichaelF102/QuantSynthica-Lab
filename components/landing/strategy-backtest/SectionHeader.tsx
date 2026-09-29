"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import CapabilityStrip from "./CapabilityStrip";

export default function SectionHeader() {
  return (
    <div className="relative mb-8 lg:mb-12">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        {/* Left Headline Area */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="h-2 w-2 rounded-full bg-[#1769FF]" />
            <span className="text-[12px] font-bold tracking-[0.2em] text-[#1769FF] uppercase">
              STRATEGY → BACKTEST
            </span>
          </div>

          <h2 className="text-[44px] sm:text-[54px] lg:text-[64px] font-bold tracking-[-0.045em] text-[#0B1220] leading-[1.03]">
            Build the idea.
            <br />
            Test the hypothesis.
            <br />
            <span className="bg-gradient-to-r from-[#1769FF] via-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
              Evaluate the result.
            </span>
          </h2>

          <p className="mt-4 text-[16px] sm:text-[17px] leading-[1.6] text-[#64748B] max-w-xl">
            Turn quantitative ideas into measurable evidence. Define rules,
            backtest them on historical data, and evaluate performance, risk and
            robustness.
          </p>

          {/* Action CTAs */}
          <div className="mt-7 flex flex-wrap items-center gap-3.5">
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-[14px] font-semibold text-slate-700 shadow-2xs backdrop-blur-xs transition-colors hover:bg-white hover:text-slate-900"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[#1769FF]">
                <Play className="h-3 w-3 fill-current ml-0.5" />
              </div>
              <span>See How It Works</span>
            </button>
          </div>
        </div>

        {/* Right Capability Strip */}
        <div className="w-full xl:max-w-xl">
          <CapabilityStrip />
        </div>
      </div>
    </div>
  );
}
