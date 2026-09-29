"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";

export default function MarketSectionHeader() {
  return (
    <div className="relative mb-8 sm:mb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        {/* Left Column: Eyebrow, Title, Description */}
        <div className="max-w-[720px]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-[12px] font-bold tracking-[0.18em] text-[#1769FF] uppercase">
              SECURITY UNIVERSE
            </span>
          </div>

          <h2 className="mt-2 text-[38px] sm:text-[50px] lg:text-[58px] font-semibold leading-[1.0] tracking-[-0.04em] text-[#0B1220] dark:text-white">
            Covered Markets & Assets
          </h2>

          <p className="mt-4 text-[16px] sm:text-[17px] leading-[1.6] text-[#64748B] dark:text-slate-400 max-w-[680px]">
            Explore a comprehensive universe of global and Indian markets including equities, ETFs,
            indices, options and economic data — all in one place.
          </p>
        </div>

        {/* Right Column: Editorial Asset Badge & Navigation Link */}
        <div className="flex flex-row lg:flex-col items-start lg:items-end justify-between lg:justify-end gap-3 shrink-0">
          {/* Editorial Badge */}
          <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0B1528]/95 px-3.5 py-1.5 shadow-2xs backdrop-blur-xs">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400">
              <Globe className="h-3.5 w-3.5" />
            </div>
            <div className="text-[12px] leading-tight">
              <span className="font-bold text-[#0B1220] dark:text-white">1,000+ Assets</span>{" "}
              <span className="text-[#64748B] dark:text-slate-400">Across US + Indian markets</span>
            </div>
          </div>

          {/* Action Link */}
          <Link
            href="/research"
            className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#1769FF] transition-all hover:text-[#1258db]"
          >
            <span className="underline-offset-4 group-hover:underline">
              Browse complete 1,000+ asset universe
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
