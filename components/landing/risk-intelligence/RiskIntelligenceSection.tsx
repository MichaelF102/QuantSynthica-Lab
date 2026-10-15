"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import RiskIntelligenceShowcase from "./RiskIntelligenceShowcase";
import SectionBackground from "@/components/backgrounds/SectionBackground";

export default function RiskIntelligenceSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="risk-intelligence"
      ref={sectionRef}
      className="relative w-full bg-[var(--bg-risk)] py-16 sm:py-20 lg:py-28 overflow-hidden border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-500"
    >
      {/* Component-Specific Semantic Risk Background */}
      <SectionBackground variant="risk" />

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 1. Quantiphi-Style Risk Regimes & Stress Scenarios Showcase */}
        <RiskIntelligenceShowcase />

        {/* 2. Section Narrative Thesis & Transition */}
        <div className="p-8 sm:p-10 rounded-xl bg-white dark:bg-[#0B1528] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>THE QUANTITATIVE THESIS</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-white tracking-tight">
              &ldquo;Risk isn&apos;t a single number.&rdquo;
            </h3>
            <p className="mt-1 text-sm sm:text-base text-[#64748B] dark:text-slate-400">
              Understand the distribution of outcomes before you make the capital allocation decision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/risk"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0B1220] dark:bg-blue-600 hover:bg-[#1e293b] dark:hover:bg-blue-500 text-white text-sm font-semibold shadow-sm transition-all group"
            >
              Explore Risk Analytics
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/risk"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0B1220] dark:text-white text-sm font-semibold transition-colors"
            >
              Stress Test a Portfolio →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
