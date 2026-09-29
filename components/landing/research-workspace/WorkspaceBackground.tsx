"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ResearchAtmosphere = dynamic(
  () => import("@/components/three/ResearchAtmosphere"),
  { ssr: false }
);

export default function WorkspaceBackground() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
      {/* Primary Radial Glow Behind Terminal & Top Right */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 75% 22%, rgba(37,99,235,0.09), transparent 36%),
            radial-gradient(circle at 20% 75%, rgba(99,102,241,0.05), transparent 30%),
            radial-gradient(circle at 50% 50%, rgba(241,245,249,0.5), transparent 70%)
          `,
        }}
      />

      {/* Decorative Network Grid & Arcs (matching reference image) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="orbit-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="orbit-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Global Arc 1 over terminal */}
        <path
          d="M 600,100 C 950,-20 1400,60 1700,240"
          fill="none"
          stroke="url(#orbit-grad-1)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
        />

        {/* Global Arc 2 */}
        <path
          d="M 750,160 C 1100,50 1500,140 1800,380"
          fill="none"
          stroke="url(#orbit-grad-2)"
          strokeWidth="1"
        />

        {/* Connecting node points */}
        <circle cx="940" cy="46" r="3" fill="#3B82F6" opacity="0.6" />
        <circle cx="1320" cy="98" r="3.5" fill="#2563EB" opacity="0.5" />
        <circle cx="1560" cy="184" r="2.5" fill="#6366F1" opacity="0.7" />
        <circle cx="780" cy="148" r="3" fill="#60A5FA" opacity="0.5" />
      </svg>

      {/* Floating Institutional Market Metadata Badges (as in reference image) */}
      <div className="hidden lg:block">
        {/* US MARKETS Badge */}
        <div className="absolute top-10 right-[38%] rounded-full border border-blue-200/60 bg-white/70 px-3.5 py-1 text-[11px] font-semibold text-blue-600 shadow-sm backdrop-blur-md transition-all hover:bg-white">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 mr-2 animate-pulse" />
          US MARKETS
        </div>

        {/* 100+ Indicators Badge */}
        <div className="absolute top-20 right-[52%] rounded-full border border-slate-200/80 bg-white/75 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur-md">
          100+ Indicators
        </div>

        {/* Real-time & Historical Data Badge */}
        <div className="absolute top-8 right-[14%] rounded-full border border-blue-100 bg-white/75 px-3.5 py-1 text-[11px] font-semibold text-blue-700 shadow-sm backdrop-blur-md">
          Real-time & Historical Data
        </div>

        {/* Global Market Coverage Badge */}
        <div className="absolute top-24 right-[4%] rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur-md">
          Global Market Coverage
        </div>
      </div>

      {/* Subtle R3F Atmosphere */}
      {mounted && !isMobile && <ResearchAtmosphere />}
    </div>
  );
}
