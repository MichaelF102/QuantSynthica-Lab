"use client";

import React from "react";
import { Database, Sliders, BarChart3, GitFork } from "lucide-react";

export default function PortfolioCapabilities() {
  const capabilities = [
    {
      title: "Multi-Asset Support",
      desc: "Equity, Options, ETFs, Futures",
      icon: Database,
      color: "text-[#1769FF] dark:text-blue-400",
      bg: "bg-blue-50/80 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50",
    },
    {
      title: "Advanced Optimization",
      desc: "Mean-Variance, Risk Parity, Factor",
      icon: Sliders,
      color: "text-[#6366F1] dark:text-indigo-400",
      bg: "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50",
    },
    {
      title: "Risk-Aware Allocation",
      desc: "Constraints, Hedging, Exposure",
      icon: BarChart3,
      color: "text-[#0284C7] dark:text-sky-400",
      bg: "bg-sky-50/80 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900/50",
    },
    {
      title: "Research to Portfolio",
      desc: "Strategies → Portfolio → Insights",
      icon: GitFork,
      color: "text-[#0D9488] dark:text-teal-400",
      bg: "bg-teal-50/80 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
      {capabilities.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0B1528]/95 shadow-2xs backdrop-blur-xs"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${c.bg} ${c.color}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">
                {c.title}
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-tight">
                {c.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
