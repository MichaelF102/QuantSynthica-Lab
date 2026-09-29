"use client";

import React from "react";

interface WorkflowProgressProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
}

const MILESTONES = [
  { id: 0, num: "01", name: "Data", desc: "Universe" },
  { id: 1, num: "02", name: "Analyse", desc: "Signals" },
  { id: 2, num: "03", name: "Strategy", desc: "Rules" },
  { id: 3, num: "04", name: "Backtest", desc: "Simulation" },
  { id: 4, num: "05", name: "Risk", desc: "Limits" },
  { id: 5, num: "06", name: "Portfolio", desc: "Allocation" },
];

export default function WorkflowProgress({
  activeStage,
  onSelectStage,
}: WorkflowProgressProps) {
  return (
    <div
      className="hidden lg:flex flex-col items-start justify-center h-full py-4 pl-4 border-l border-slate-200/80"
      role="tablist"
      aria-label="Workflow progress milestone list"
    >
      <div className="relative flex flex-col items-start space-y-2 w-full">
        {/* Subtle connecting vertical track */}
        <div className="absolute top-4 bottom-4 left-[15px] w-[1.5px] bg-slate-200/90 -translate-x-1/2 z-0 pointer-events-none" />

        {MILESTONES.map((m) => {
          const isActive = activeStage === m.id;
          const isPast = activeStage > m.id;

          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`Jump to stage ${m.num}: ${m.name}`}
              onClick={() => onSelectStage(m.id)}
              className={`group relative z-10 flex items-center gap-3 w-full min-h-[44px] px-2 py-1.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769FF] cursor-pointer text-left ${
                isActive
                  ? "bg-blue-50/80 text-[#0B1220] shadow-xs"
                  : "hover:bg-slate-100/70 text-slate-500"
              }`}
            >
              {/* Node indicator */}
              <div
                className={`h-4 w-4 shrink-0 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? "border-[#1769FF] bg-white ring-4 ring-blue-100/80 scale-110"
                    : isPast
                    ? "border-blue-500 bg-[#1769FF]"
                    : "border-slate-300 bg-white group-hover:border-slate-400"
                }`}
              >
                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#1769FF]" />}
              </div>

              {/* Text label */}
              <div className="flex flex-col leading-tight">
                <span
                  className={`text-[10px] font-mono font-bold transition-colors ${
                    isActive
                      ? "text-[#1769FF]"
                      : isPast
                      ? "text-slate-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {m.num}
                </span>
                <span
                  className={`text-[12px] font-medium transition-colors ${
                    isActive
                      ? "text-[#0B1220] font-bold"
                      : isPast
                      ? "text-slate-700 font-semibold"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {m.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
