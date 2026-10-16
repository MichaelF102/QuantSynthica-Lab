"use client";

import React, { useState, useEffect } from "react";
import HeroCopy from "./HeroCopy";
import HeroStats from "./HeroStats";
import MarketCards from "./MarketCards";
import ProductPreview from "./ProductPreview";
import SectionBackground from "@/components/backgrounds/SectionBackground";
import HeroWavesBackground from "./HeroWavesBackground";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width - 0.5) * 16;
    const y = ((clientY - top) / height - 0.5) * 16;
    setMouseOffset({ x, y });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-[720px] w-full overflow-hidden bg-[var(--bg-hero)] pb-16 pt-8 sm:pt-12 lg:pb-20 lg:pt-14 transition-colors duration-500"
    >
      {/* 1. Component-Specific Semantic Hero Background */}
      <SectionBackground variant="hero">
        {/* Faint Candlestick Silhouettes */}
        <div className="absolute right-0 top-1/4 h-80 w-72 opacity-[0.03] dark:opacity-[0.04] mix-blend-multiply dark:mix-blend-screen pointer-events-none">
          <svg viewBox="0 0 200 240" fill="currentColor" className="h-full w-full text-slate-800 dark:text-slate-400">
            <rect x="20" y="40" width="10" height="80" />
            <line x1="25" y1="20" x2="25" y2="140" stroke="currentColor" strokeWidth="2" />
            <rect x="50" y="70" width="10" height="90" />
            <line x1="55" y1="50" x2="55" y2="180" stroke="currentColor" strokeWidth="2" />
            <rect x="80" y="30" width="10" height="110" />
            <line x1="85" y1="10" x2="85" y2="160" stroke="currentColor" strokeWidth="2" />
            <rect x="110" y="60" width="10" height="70" />
            <line x1="115" y1="40" x2="115" y2="150" stroke="currentColor" strokeWidth="2" />
            <rect x="140" y="20" width="10" height="120" />
            <line x1="145" y1="5" x2="145" y2="170" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </SectionBackground>

      {/* 2. Interactive Animated Financial Waves (Green Bullish & Red Bearish with mouse interaction) */}
      <HeroWavesBackground />

      {/* 3. Main Two-Column Content Grid */}
      <div className="relative z-10 mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Copy & Stats (approx 45% width = 5.5 cols out of 12) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center">
            <HeroCopy />
            <HeroStats />
          </div>

          {/* Right Column: Terminal Preview + Floating Market Cards */}
          <div className="relative lg:col-span-6 xl:col-span-7 flex flex-col items-center justify-center">
            {/* Visual Centerpiece Container */}
            <div
              className="relative w-full max-w-[880px]"
              style={{
                transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
                transition: "transform 0.25s ease-out",
              }}
            >
              {/* Floating Market Cards Layer (S&P 500, NIFTY 50, NASDAQ 100) */}
              <div className="relative w-full sm:h-[105px]">
                <MarketCards />
              </div>

              {/* Tilted QuantSynthica Terminal Display */}
              <div className="relative z-20">
                <ProductPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
