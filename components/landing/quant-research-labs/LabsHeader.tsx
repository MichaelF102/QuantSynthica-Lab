"use client";

import React from "react";
import { Database, Globe, BarChart3, Users } from "lucide-react";

export default function LabsHeader() {
  return (
    <div className="relative mb-12">
      {/* Decorative Network Flow Curve with Pin */}
      <div className="pointer-events-none absolute right-16 -top-8 hidden lg:block select-none">
        <svg
          width="480"
          height="90"
          viewBox="0 0 480 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M 10 70 C 140 20, 320 85, 460 25"
            stroke="url(#flowGradient)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1769FF" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <circle cx="460" cy="25" r="4" fill="#1769FF" />
          <circle cx="460" cy="25" r="8" fill="#1769FF" opacity="0.25" />
        </svg>
        <div className="absolute right-0 top-0 translate-y-[-14px] text-[12px] font-medium italic text-slate-500 font-sans">
          Ideas → Models → Insights
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        {/* Left Headline Area */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="h-2 w-2 rounded-full bg-[#1769FF]" />
            <span className="text-[12px] font-bold tracking-[0.18em] text-[#1769FF] uppercase">
              QUANT RESEARCH LABS
            </span>
          </div>

          <h2 className="text-[44px] sm:text-[54px] lg:text-[62px] font-bold tracking-[-0.04em] text-[#0B1220] dark:text-white leading-[1.04]">
            Research deeper.{" "}
            <span className="bg-gradient-to-r from-[#1769FF] via-[#4F46E5] to-[#6366F1] bg-clip-text text-transparent block sm:inline">
              Test smarter.
            </span>
          </h2>

          <p className="mt-4 text-[16px] sm:text-[17px] leading-[1.6] text-[#64748B] dark:text-slate-400 max-w-xl">
            Explore specialized research labs designed for quantitative analysis.
            From technical and statistical methods to time series, volatility,
            options and factor models — everything in one place.
          </p>
        </div>

        {/* Top Right Capability Strip (4 cards matching reference image) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:gap-2">
          {/* 1. 100+ Indicators & Models */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0B1528]/80 p-3 shadow-2xs backdrop-blur-xs">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
              <Database className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight">
                100+
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Indicators &amp; Models
              </div>
            </div>
          </div>

          {/* 2. Multiple Data Sources */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0B1528]/80 p-3 shadow-2xs backdrop-blur-xs">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight">
                Multiple
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Data Sources
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                US &amp; Indian Markets
              </div>
            </div>
          </div>

          {/* 3. Research Ready */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0B1528]/80 p-3 shadow-2xs backdrop-blur-xs">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight">
                Research Ready
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Tools
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                From theory to practice
              </div>
            </div>
          </div>

          {/* 4. For Everyone */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0B1528]/80 p-3 shadow-2xs backdrop-blur-xs">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight">
                For Everyone
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Quants, Investors
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                Students &amp; Researchers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
