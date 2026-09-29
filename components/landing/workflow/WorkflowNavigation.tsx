"use client";

import React from "react";
import { motion } from "framer-motion";

export interface WorkflowNavStage {
  id: number;
  num: string;
  label: string;
  descriptor: string;
}

export const NAV_STAGES: WorkflowNavStage[] = [
  { id: 0, num: "01", label: "DATA", descriptor: "Discover the universe" },
  { id: 1, num: "02", label: "ANALYSE", descriptor: "Understand the signal" },
  { id: 2, num: "03", label: "STRATEGY", descriptor: "Define the rules" },
  { id: 3, num: "04", label: "BACKTEST", descriptor: "Test the hypothesis" },
  { id: 4, num: "05", label: "RISK", descriptor: "Measure uncertainty" },
  { id: 5, num: "06", label: "PORTFOLIO", descriptor: "Construct the book" },
];

interface WorkflowNavigationProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
}

export default function WorkflowNavigation({
  activeStage,
  onSelectStage,
}: WorkflowNavigationProps) {
  // Compute progress ratio (0 to 1) based on activeStage (0 to 5)
  const progressPercent = Math.min(100, Math.max(0, (activeStage / 5) * 100));

  return (
    <div className="relative w-full py-3" role="tablist" aria-label="Quantitative Workflow Stages">
      {/* Horizontal Connector Line Container (Desktop) */}
      <div className="relative hidden md:block w-full">
        {/* Inactive Base Rail */}
        <div className="absolute top-4 left-8 right-8 h-[2px] bg-slate-200/90 dark:bg-slate-800 -translate-y-1/2 z-0 pointer-events-none" />

        {/* Active Progress Fill Line */}
        <motion.div
          className="absolute top-4 left-8 h-[2.5px] bg-[#1769FF] -translate-y-1/2 z-0 origin-left pointer-events-none shadow-[0_0_8px_rgba(23,105,255,0.4)]"
          initial={false}
          animate={{
            width: `calc(${progressPercent}% * 0.90)`,
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      {/* Stage Nodes Grid */}
      <div className="relative z-10 flex items-start justify-between overflow-x-auto no-scrollbar gap-2 md:gap-0 pb-1">
        {NAV_STAGES.map((s) => {
          const isActive = activeStage === s.id;
          const isCompleted = activeStage > s.id;

          return (
            <button
              key={s.id}
              role="tab"
              id={`workflow-tab-${s.id}`}
              aria-selected={isActive}
              aria-controls={`workflow-panel-${s.id}`}
              aria-label={`Stage ${s.num}: ${s.label} — ${s.descriptor}`}
              tabIndex={0}
              onClick={() => onSelectStage(s.id)}
              className="group relative flex flex-col items-center text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769FF] focus-visible:ring-offset-2 rounded-xl py-1 px-1.5 min-w-[95px] md:min-w-0 md:flex-1 cursor-pointer select-none"
            >
              {/* Milestone Indicator Node Circle */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-mono font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-[#1769FF] text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-100 dark:ring-blue-950/60 scale-105"
                      : isCompleted
                      ? "bg-blue-50 text-[#1769FF] border border-blue-200 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/60"
                      : "bg-white text-slate-400 border border-slate-200 group-hover:border-slate-300 group-hover:text-slate-600 dark:bg-[#0B1528] dark:text-slate-500 dark:border-slate-800 dark:group-hover:border-slate-700 dark:group-hover:text-slate-300"
                  }`}
                >
                  {s.num}
                </div>
              </div>

              {/* Stage Label & Subtext */}
              <div className="mt-2 space-y-0.5">
                <div
                  className={`text-[12px] font-extrabold tracking-wide transition-colors ${
                    isActive
                      ? "text-[#0B1220] dark:text-white"
                      : isCompleted
                      ? "text-slate-700 dark:text-slate-300 font-semibold"
                      : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                  }`}
                >
                  {s.label}
                </div>
                <div
                  className={`text-[11px] leading-tight transition-colors hidden sm:block ${
                    isActive
                      ? "text-[#1769FF] dark:text-blue-400 font-semibold"
                      : "text-slate-400 dark:text-slate-500 opacity-80"
                  }`}
                >
                  {s.descriptor}
                </div>
              </div>

              {/* Active Indicator Underneath */}
              <div className="h-1 mt-1.5 w-8 flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="workflow-active-tab-bar"
                    className="h-1 w-8 rounded-full bg-[#1769FF]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
