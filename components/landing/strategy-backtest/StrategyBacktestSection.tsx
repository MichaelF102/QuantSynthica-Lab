"use client";

import React, { useRef } from "react";
import StrategyBacktestShowcase from "./StrategyBacktestShowcase";
import CapabilityStrip from "./CapabilityStrip";
import ResearchTransition from "./ResearchTransition";
import SectionBackground from "@/components/backgrounds/SectionBackground";

export default function StrategyBacktestSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="strategy-backtest"
      aria-label="Strategy to Backtest Section"
      className="relative w-full border-t border-slate-200/80 dark:border-slate-800 bg-[var(--bg-strategy)] py-14 sm:py-20 lg:py-24 overflow-hidden select-none transition-colors duration-500"
    >
      {/* Component-Specific Semantic Strategy & Backtest Background */}
      <SectionBackground variant="strategy-backtest" />

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8 space-y-10">
        {/* 1. Quantiphi-Style Product Portfolio Tabbed Showcase (No 3JS Globe) */}
        <StrategyBacktestShowcase />

        {/* 2. Institutional Capabilities 4-Card Strip */}
        <CapabilityStrip />

        {/* 3. Narrative Research Connection & Transition Link to Risk Analytics */}
        <ResearchTransition />
      </div>
    </section>
  );
}
