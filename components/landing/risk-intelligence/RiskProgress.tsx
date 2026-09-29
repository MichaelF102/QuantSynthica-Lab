"use client";

import React from "react";
import { motion } from "framer-motion";
import { RiskState } from "./RiskNavigation";

interface RiskProgressProps {
  activeRisk: RiskState;
  onSelectRisk: (state: RiskState) => void;
}

const STAGES: { id: RiskState; label: string; step: string }[] = [
  { id: "overview", label: "OVERVIEW", step: "01" },
  { id: "var", label: "VaR", step: "02" },
  { id: "volatility", label: "VOLATILITY", step: "03" },
  { id: "drawdown", label: "DRAWDOWN", step: "04" },
  { id: "stress", label: "STRESS", step: "05" },
];

export default function RiskProgress({ activeRisk, onSelectRisk }: RiskProgressProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="inline-flex items-center gap-1 sm:gap-2 p-1.5 rounded-full bg-white/90 dark:bg-[#0B1528]/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {STAGES.map((s, idx) => {
          const isActive = activeRisk === s.id;
          const isStress = s.id === "stress";

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectRisk(s.id)}
              className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-colors select-none ${
                isActive
                  ? isStress
                    ? "text-white"
                    : "text-white"
                  : "text-[#64748B] dark:text-slate-400 hover:text-[#0B1220] dark:hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="risk-progress-pill"
                  className={`absolute inset-0 rounded-full shadow-xs ${
                    isStress ? "bg-[#EF4444]" : "bg-[#1769FF]"
                  }`}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span className="text-[10px] opacity-70">{s.step}</span>
                <span>{s.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
