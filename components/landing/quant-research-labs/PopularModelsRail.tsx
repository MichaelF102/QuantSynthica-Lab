"use client";

import React from "react";
import {
  ArrowRight,
  Activity,
  RotateCw,
  Cpu,
  Hourglass,
  Compass,
  GitBranch,
} from "lucide-react";

const MODELS = [
  {
    name: "ARIMA",
    sub: "Forecasting",
    icon: Activity,
  },
  {
    name: "GARCH",
    sub: "Volatility Modelling",
    icon: RotateCw,
  },
  {
    name: "LSTM",
    sub: "Deep Learning",
    icon: Cpu,
  },
  {
    name: "HMM",
    sub: "Regime Detection",
    icon: Hourglass,
  },
  {
    name: "PCA",
    sub: "Dimensionality Reduction",
    icon: Compass,
  },
  {
    name: "Black-Scholes",
    sub: "Options Pricing",
    icon: GitBranch,
  },
];

export default function PopularModelsRail() {
  return (
    <div className="mt-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B1528] p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Label */}
        <div className="flex items-center gap-3 flex-shrink-0 pr-4 lg:border-r border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500 uppercase">
              POPULAR
            </div>
            <div className="text-[13px] font-bold text-[#0B1220] dark:text-white">
              MODELS &amp; TECHNIQUES
            </div>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Models Pills / Items Horizontal Rail */}
        <div className="flex flex-1 items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
          {MODELS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 flex-shrink-0 cursor-default"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400 group-hover:bg-[#1769FF] group-hover:text-white transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0B1220] dark:text-white tracking-tight group-hover:text-[#1769FF] dark:group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                    {item.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
