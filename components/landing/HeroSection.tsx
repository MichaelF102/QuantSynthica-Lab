"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import HeroCopy from "./HeroCopy";
import HeroStats from "./HeroStats";
import MarketCards from "./MarketCards";
import ProductPreview from "./ProductPreview";
import SectionBackground from "@/components/backgrounds/SectionBackground";

// Dynamically import Three.js Globe with SSR disabled
const QuantMarketGlobe = dynamic(
  () => import("@/components/three/QuantMarketGlobe"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-64 w-64 rounded-full border border-blue-200/40 bg-blue-50/20 animate-pulse" />
      </div>
    ),
  }
);

// Satellite data nodes displayed around globe matching reference
const SATELLITE_NODES = [
  { label: "US MARKETS", isBadge: true, top: "20%", left: "12%", dotColor: "#1769FF" },
  { label: "INDIAN MARKETS", isBadge: true, top: "21%", right: "8%", dotColor: "#10B981" },
  { label: "INDICES", top: "30%", left: "16%" },
  { label: "MACRO DATA", top: "38%", left: "14%" },
  { label: "ALTERNATIVE DATA", top: "44%", left: "16%" },
  { label: "EQUITIES", top: "11%", right: "16%" },
  { label: "ETFS", top: "16%", right: "7%" },
  { label: "OPTIONS", top: "29%", right: "5%" },
];

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
      className="relative min-h-[780px] w-full overflow-hidden bg-[var(--bg-hero)] pb-16 pt-8 sm:pt-12 lg:pb-24 lg:pt-14 transition-colors duration-500"
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
        {/* Dotted Global Orbit Guides */}
        <div className="absolute right-[5%] top-[10%] h-[560px] w-[700px] opacity-35 pointer-events-none">
          <svg viewBox="0 0 700 560" fill="none" className="h-full w-full">
            <ellipse
              cx="350"
              cy="280"
              rx="320"
              ry="160"
              stroke="#94A3B8"
              strokeWidth="1"
              strokeDasharray="4 6"
              transform="rotate(-15 350 280)"
            />
            <ellipse
              cx="350"
              cy="280"
              rx="280"
              ry="120"
              stroke="#3B82F6"
              strokeWidth="0.8"
              strokeDasharray="3 5"
              transform="rotate(18 350 280)"
            />
          </svg>
        </div>
      </SectionBackground>

      {/* 2. Main Two-Column Content Grid */}
      <div className="relative z-10 mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Copy & Stats (approx 45% width = 5.5 cols out of 12) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center">
            <HeroCopy />
            <HeroStats />
          </div>

          {/* Right Column: 3D Visualization + Terminal Preview (approx 55% width = 6.5-7 cols) */}
          <div className="relative lg:col-span-6 xl:col-span-7 flex flex-col items-center justify-center">
            {/* Visual Centerpiece Container */}
            <div
              className="relative w-full max-w-[880px]"
              style={{
                transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
                transition: "transform 0.25s ease-out",
              }}
            >
              {/* Top Area: 3D Market Globe & Floating Satellite Nodes */}
              <div className="relative h-[280px] sm:h-[340px] md:h-[380px] w-full">
                {/* Three.js Canvas */}
                {mounted ? (
                  <QuantMarketGlobe />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-64 w-64 rounded-full border border-blue-200/40 bg-blue-50/20 animate-pulse" />
                  </div>
                )}

                {/* Floating Satellite Category Nodes */}
                {SATELLITE_NODES.map((node, i) => (
                  <div
                    key={i}
                    style={{
                      top: node.top,
                      left: node.left,
                      right: node.right,
                    }}
                    className={`absolute hidden md:flex items-center gap-1.5 pointer-events-none select-none ${
                      node.isBadge
                        ? "rounded-full border border-blue-200/90 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#1769FF] shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-[#0B1528]/90 dark:text-blue-400"
                        : "text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: node.dotColor || "#94A3B8" }}
                    />
                    <span>{node.label}</span>
                  </div>
                ))}

                {/* Floating Market Cards Layer (S&P 500, NIFTY 50, NASDAQ 100) */}
                <MarketCards />
              </div>

              {/* Bottom Area: Tilted Real QuantSynthica Terminal Display */}
              <div className="relative -mt-16 sm:-mt-24 md:-mt-28 z-20">
                <ProductPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
