"use client";

import React, { useState, useRef } from "react";
import StrategyBacktestHero from "./StrategyBacktestHero";
import StageDetailPanels from "./StageDetailPanels";
import ResearchTransition from "./ResearchTransition";

export default function StrategyBacktestSection() {
  // activeStage: 1 = BUILD, 2 = TEST, 3 = EVALUATE
  const [activeStage, setActiveStage] = useState<number>(1);
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="strategy-backtest"
      aria-label="Strategy to Backtest Section"
      className="relative w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#070D18] py-14 sm:py-20 lg:py-24 overflow-hidden select-none"
    >
      {/* Subtle Technical Coordinate Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] -z-10" />

      {/* Subtle Radial Light Glows */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 select-none"
        style={{
          background: `
            radial-gradient(circle at 75% 20%, rgba(37,99,235,0.08), transparent 40%),
            radial-gradient(circle at 25% 65%, rgba(124,58,237,0.06), transparent 36%)
          `,
        }}
      />

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
