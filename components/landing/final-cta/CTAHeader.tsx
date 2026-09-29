"use client";

import React from "react";
import CTAButtons from "./CTAButtons";

export default function CTAHeader() {
  return (
    <div className="relative z-20 text-center max-w-4xl mx-auto px-4">
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.24em] uppercase text-[#38BDF8] mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
        QUANTSYNTHICA LAB
      </div>

      {/* Editorial Headline */}
      <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-[-0.045em] text-white leading-[1.05]">
        Research with purpose.
        <br />
        <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(56,189,248,0.25)]">
          Decide with evidence.
        </span>
      </h2>

      {/* Supporting Copy */}
      <p className="mt-6 text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
        Explore markets, test quantitative ideas, understand risk, and construct portfolios — all within one research environment.
      </p>

      {/* CTA Buttons */}
      <CTAButtons />
    </div>
  );
}
