"use client";

import React from "react";
import { Database, BarChart3, Sliders, Users } from "lucide-react";

export default function CapabilityStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {/* 1. 1,000+ Global Assets */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0B1528]/90 p-3.5 shadow-2xs backdrop-blur-xs transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
          <Database className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight truncate">
            1,000+ Global Assets
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
            Equities, ETFs, Options, Crypto.
          </div>
        </div>
      </div>

      {/* 2. Historical Data */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0B1528]/90 p-3.5 shadow-2xs backdrop-blur-xs transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight truncate">
            Historical Data
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
            Multi-market coverage
          </div>
        </div>
      </div>

      {/* 3. Robust Analysis */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0B1528]/90 p-3.5 shadow-2xs backdrop-blur-xs transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
          <Sliders className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight truncate">
            Robust Analysis
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
            Performance, risk & stability
          </div>
        </div>
      </div>

      {/* 4. Built for Everyone */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#0B1528]/90 p-3.5 shadow-2xs backdrop-blur-xs transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#0B1220] dark:text-white leading-tight truncate">
            Built for Everyone
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
            Students, Researchers, Practitioners
          </div>
        </div>
      </div>
    </div>
  );
}
