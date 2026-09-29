"use client";

import React from "react";
import { Layers, BarChart3, LayoutGrid, Globe, ShieldCheck } from "lucide-react";

export default function CTAStats() {
  const stats = [
    {
      value: "1,000+",
      label: "Assets",
      detail: "Equities · ETFs · Options · Futures",
      icon: Layers,
      color: "text-blue-400",
    },
    {
      value: "50+",
      label: "Technical Indicators",
      detail: "Built for quantitative research",
      icon: BarChart3,
      color: "text-cyan-400",
    },
    {
      value: "10+",
      label: "Research Modules",
      detail: "Strategies · Backtests · Risk · Portfolio",
      icon: LayoutGrid,
      color: "text-purple-400",
    },
    {
      value: "US + INDIA",
      label: "Markets",
      detail: "Global research coverage",
      icon: Globe,
      color: "text-teal-400",
    },
    {
      value: "RISK",
      label: "Analytics & Stress Testing",
      detail: "VaR · Drawdown · Scenario Analysis",
      icon: ShieldCheck,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="relative z-20 py-8 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xs hover:border-slate-700 transition-colors flex items-start gap-3.5"
            >
              <div className={`w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0 border border-slate-700 ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-white leading-tight">
                  {s.value}
                </div>
                <div className="text-xs font-bold text-slate-300 mt-0.5 leading-tight">
                  {s.label}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight truncate">
                  {s.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
