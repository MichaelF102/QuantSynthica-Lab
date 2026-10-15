"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkspaceIntro() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
      {/* Eyebrow with blue indicator tick */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="h-3 w-0.5 rounded-full bg-[#1769FF]" />
        <span className="text-[12px] font-bold tracking-[0.22em] text-[#1769FF] uppercase">
          RESEARCH ENVIRONMENT
        </span>
      </div>

      {/* Main Headline */}
      <h2 className="text-[38px] sm:text-[48px] lg:text-[56px] font-bold tracking-[-0.04em] text-[#0B1220] dark:text-white leading-[1.08] text-center">
        Everything you need{" "}
        <span className="bg-gradient-to-r from-[#1769FF] via-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent">
          to research a market.
        </span>
      </h2>

      {/* Subtitle / Description */}
      <p className="mt-4 max-w-2xl text-[16px] sm:text-[18px] leading-[1.6] text-[#64748B] dark:text-slate-400 text-center">
        A complete quantitative research environment — from charts and strategy
        development to backtesting, risk analysis and portfolio construction.
      </p>

      {/* CTA Button */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/research"
          className="group inline-flex items-center gap-2.5 rounded-xl bg-[#1769FF] px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:bg-[#0f59e0] hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Explore the full research environment</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
