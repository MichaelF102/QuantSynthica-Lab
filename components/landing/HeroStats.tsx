"use client";

import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: "1,000+", label: "Assets" },
  { value: "50+", label: "Technical Indicators" },
  { value: "10+", label: "Research Modules" },
  { value: "2", label: "Markets", sublabel: "US + India" },
];

export default function HeroStats() {
  return (
    <div className="mt-6 sm:mt-8 flex flex-wrap items-center border-t border-slate-200/80 dark:border-slate-800 pt-4 sm:flex-nowrap">
      {STATS.map((stat, idx) => (
        <React.Fragment key={stat.label}>
          <div className="flex-1 min-w-[110px] py-1 px-2 first:pl-0">
            <div className="font-mono text-[26px] sm:text-[30px] font-bold tracking-tight text-[#0B1220] dark:text-white">
              {stat.value}
            </div>
            <div className="text-[12px] font-medium text-[#526174] dark:text-slate-400">
              {stat.label}
              {stat.sublabel && (
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  {stat.sublabel}
                </span>
              )}
            </div>
          </div>
          {idx < STATS.length - 1 && (
            <div className="hidden h-10 w-[1px] bg-slate-200/80 dark:bg-slate-800 sm:block" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
