"use client";

import React, { useState, useRef } from "react";
import StrategyBacktestHero from "./StrategyBacktestHero";
import StageDetailPanels from "./StageDetailPanels";
import ResearchTransition from "./ResearchTransition";
import SectionBackground from "@/components/backgrounds/SectionBackground";

export default function StrategyBacktestSection() {
  // activeStage: 1 = BUILD, 2 = TEST, 3 = EVALUATE
  const [activeStage, setActiveStage] = useState<number>(1);
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

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        {/* 1. Hero 2-Column: Left (Headline, Copy, CTAs, 4 Capability Cards) & Right (3D Quant Engine) */}
        <StrategyBacktestHero
          activeStage={activeStage}
          onSelectStage={setActiveStage}
        />

        {/* 2. Lower Detail Stage Panels (3 Cards: Build, Test, Evaluate) */}
        <StageDetailPanels
          activeStage={activeStage}
          onSelectStage={setActiveStage}
        />

        {/* 3. Narrative Research Connection & Transition Link to Risk Analytics */}
        <ResearchTransition />
      </div>
    </section>
  );
}
