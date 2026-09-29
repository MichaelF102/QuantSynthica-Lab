"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  ChevronRight,
  Sliders,
  Database,
  TrendingUp,
  Shield,
  Briefcase,
} from "lucide-react";

const MILESTONES = [
  {
    label: "Strategy",
    sub: "From idea to rules",
    icon: Sliders,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    label: "Backtest",
    sub: "Test on historical data",
    icon: Database,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    label: "Evaluate",
    sub: "Measure performance",
    icon: TrendingUp,
    color: "text-teal-600 bg-teal-50 border-teal-200",
  },
  {
    label: "Risk",
    sub: "Stress test and analyse",
    icon: Shield,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    label: "Portfolio",
    sub: "Build and allocate",
    icon: Briefcase,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
];

export default function ResearchTransition() {
  return (
    <div className="mt-12 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B1528] p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Left: Research Story */}
        <div className="flex items-start gap-3.5 max-w-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-[#1769FF] dark:text-blue-400 mt-0.5">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-[#1769FF] dark:text-blue-400">
              RESEARCH CONNECTION
            </div>
            <h4 className="text-[16px] sm:text-[17px] font-bold text-[#0B1220] dark:text-white leading-snug mt-0.5">
              Every strategy tells a story.
            </h4>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
              QuantSynthica helps you find out whether the story survives the data.
            </p>
          </div>
        </div>

        {/* Middle: Horizontal Research Narrative Flow Rail */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-2 py-1">
          {MILESTONES.map((item, idx) => {
            const Icon = item.icon;
            const isLast = idx === MILESTONES.length - 1;

            return (
              <React.Fragment key={item.label}>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shrink-0">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs ${item.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-[#0B1220] dark:text-white leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      {item.sub}
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: CTA Button to Next Section */}
        <Link
          href="#risk-intelligence"
          className="group inline-flex items-center gap-2 rounded-xl bg-[#0B1220] dark:bg-blue-600 px-5 py-3 text-[13px] font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#1769FF] dark:hover:bg-blue-500 hover:shadow-blue-500/25 shrink-0 self-start xl:self-auto cursor-pointer"
        >
          <span>Continue to Risk Analytics</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
