"use client";

import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: "18,500+", label: "Stocks" },
  { value: "24", label: "Technical Indicators" },
  { value: "11", label: "Research Tabs" },
  { value: "2", label: "Markets", sublabel: "US + India" },
];

export default function HeroStats() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-y-3 border-t border-slate-200/80 pt-4 dark:border-slate-800 sm:mt-8 sm:flex sm:flex-nowrap sm:items-center">
      {STATS.map((stat, idx) => (
        <React.Fragment key={stat.label}>
          <div className="min-w-[110px] py-1 sm:flex-1 sm:px-2 sm:first:pl-0">
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
