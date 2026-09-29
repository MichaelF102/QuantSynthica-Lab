"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Activity } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import RiskHeader from "./RiskHeader";
import RiskNavigation, { RiskState } from "./RiskNavigation";
import RiskObservatory from "./RiskObservatory";
import RiskProfile from "./RiskProfile";
import RiskMetrics from "./RiskMetrics";
import RiskProgress from "./RiskProgress";
import StressScenarioPanel from "./StressScenarioPanel";

export default function RiskIntelligenceSection() {
  const [activeRisk, setActiveRisk] = useState<RiskState>("overview");
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const handleSelectRisk = (state: RiskState) => {
    setActiveRisk(state);
  };

  const handleTriggerScenario = (scenarioId: string) => {
    setActiveRisk("stress");
  };

  return (
    <section
      id="risk-intelligence"
      ref={sectionRef}
      className="relative w-full bg-[#F8FAFC] dark:bg-[#070D18] py-20 lg:py-28 overflow-hidden border-t border-slate-200/80 dark:border-slate-800"
    >
      {/* Subtle Atmospheric Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(23,105,255,0.035),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.025),transparent_70%)] pointer-events-none" />

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        {/* 1. Header & Capability Strip */}
        <RiskHeader />

        {/* 2. Interactive Stage Progress Navigator */}
        <div className="mt-8">
          <RiskProgress activeRisk={activeRisk} onSelectRisk={handleSelectRisk} />
        </div>

        {/* 3. Main Visual Tripartite Workspace (Left Nav - Center 3D Observatory - Right Risk Profile) */}
        <div className="mt-6 flex flex-col lg:flex-row items-center lg:items-stretch gap-6">
          {/* Left: Vertical Risk Navigation */}
          <div className="w-full lg:w-auto flex flex-col justify-center">
            <RiskNavigation activeRisk={activeRisk} onSelectRisk={handleSelectRisk} />
          </div>

          {/* Center: 3D Risk Observatory Hero Visual */}
          <div className="flex-1 w-full min-w-0">
            <RiskObservatory activeRisk={activeRisk} onSelectRisk={handleSelectRisk} />
          </div>

          {/* Right: Portfolio Risk Profile Radar */}
          <div className="w-full lg:w-auto flex flex-col justify-center">
            <RiskProfile activeRisk={activeRisk} />
          </div>
        </div>

        {/* 4. Bottom 4 Analytical Cards */}
        <div id="risk-analytics-cards">
          <RiskMetrics activeRisk={activeRisk} onSelectRisk={handleSelectRisk} />
        </div>

        {/* 5. "What If?" Scenario Stress Simulator */}
        <StressScenarioPanel onTriggerScenario={handleTriggerScenario} />

        {/* 6. Section Narrative Transition */}
        <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B1528] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
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
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0B1220] dark:bg-blue-600 hover:bg-[#1e293b] dark:hover:bg-blue-500 text-white text-sm font-semibold shadow-sm transition-all group"
            >
              Explore Risk Analytics
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/risk"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0B1220] dark:text-white text-sm font-semibold transition-colors"
            >
              Stress Test a Portfolio →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
