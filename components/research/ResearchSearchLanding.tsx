"use client";

import React from "react";
import HeroVisualBackground from "@/components/research/search/HeroVisualBackground";
import ResearchSearchBox from "@/components/research/search/ResearchSearchBox";
import SearchChips from "@/components/research/search/SearchChips";
import ResearchFeatureCards from "@/components/research/search/ResearchFeatureCards";
import { BarChart3 } from "lucide-react";

export default function ResearchSearchLanding() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#06090E] text-slate-100 flex flex-col justify-between select-none">
      {/* Visual Canvas: Candlestick Landscape + 3D Illuminated Digital Globe */}
      <HeroVisualBackground />

      {/* Main Center Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-10 sm:pt-14 pb-8 max-w-5xl mx-auto w-full text-center">
        {/* Eyebrow Pill Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-[#0B1528]/85 px-4 py-1.5 text-[11px] font-mono font-semibold tracking-wider text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md">
          <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
          <span>DATA · MODELS · INSIGHTS · OPPORTUNITIES</span>
        </div>

        {/* Large QuantSynthica LABS Typography */}
        <div className="mt-5 space-y-1">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            <span className="text-white drop-shadow-sm">Quant</span>
            <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(129,140,248,0.35)]">
              Synthica
            </span>
          </h1>

          {/* — L A B S — */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="h-[1px] w-10 sm:w-16 bg-gradient-to-r from-transparent to-slate-500" />
            <span className="text-xs sm:text-sm font-semibold tracking-[0.4em] text-slate-400 uppercase">
              L A B S
            </span>
            <div className="h-[1px] w-10 sm:w-16 bg-gradient-to-l from-transparent to-slate-500" />
          </div>
        </div>

        {/* Main Subtitle */}
        <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
          A comprehensive platform for stock analysis, screening, quantitative research and
          financial insights.
        </p>

        {/* Dominant Centered Search Box */}
        <div className="mt-8 w-full max-w-2xl">
          <ResearchSearchBox />
        </div>

        {/* Popular Examples & Categorical Discovery Chips */}
        <SearchChips />
      </div>

      {/* Bottom Discovery Feature Cards */}
      <div className="relative z-10">
        <ResearchFeatureCards />
      </div>
    </div>
  );
}
