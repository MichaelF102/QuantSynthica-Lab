"use client";

import React from "react";
import { Search, Lightbulb, BarChart2, Shield, Target } from "lucide-react";

export default function ResearchJourney() {
  const steps = [
    {
      num: "01",
      title: "RESEARCH",
      desc: "Explore markets and data",
      icon: Search,
    },
    {
      num: "02",
      title: "BUILD",
      desc: "Turn ideas into strategies",
      icon: Lightbulb,
    },
    {
      num: "03",
      title: "TEST",
      desc: "Validate with historical data",
      icon: BarChart2,
    },
    {
      num: "04",
      title: "UNDERSTAND",
      desc: "Analyze risk and stress scenarios",
      icon: Shield,
    },
    {
      num: "05",
      title: "DECIDE",
      desc: "Construct portfolios with confidence",
      icon: Target,
    },
  ];

  return (
    <div className="relative z-20 py-8 px-4 max-w-6xl mx-auto">
      <div className="relative grid grid-cols-2 md:grid-cols-5 gap-6">
        {/* Connecting Line Across Steps (Hidden on mobile) */}
        <div className="hidden md:block absolute top-4 left-10 right-10 h-0.5 bg-gradient-to-r from-blue-500/30 via-cyan-400/50 to-indigo-500/30 -z-0" />

        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              {/* Icon Circle */}
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700/80 group-hover:border-cyan-400 group-hover:bg-slate-800 text-slate-300 group-hover:text-cyan-400 flex items-center justify-center transition-all shadow-md shadow-black/40">
                <Icon className="w-4 h-4" />
              </div>

              {/* Number & Title */}
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-cyan-400">{s.num}</span>
                <span className="text-xs font-black text-white tracking-wider">{s.title}</span>
              </div>

              {/* Subtext */}
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[150px] leading-tight">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
