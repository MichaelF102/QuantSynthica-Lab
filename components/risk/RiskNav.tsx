"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RISK_TABS, RiskTabKey } from "./tabs";

/** DESIGN.md 7.3 pill tab track; state lives in `?tab=`. */
export default function RiskNav({ active, onChange }: { active: RiskTabKey; onChange: (t: RiskTabKey) => void }) {
  return (
    <div className="no-scrollbar w-full overflow-x-auto py-2">
      <nav className="flex min-w-max items-center gap-1.5 rounded-xl border border-slate-800/80 bg-[#0b1120]/80 p-1 backdrop-blur-md" aria-label="Risk sections">
        {RISK_TABS.map(({ key, label, icon: Icon }) => {
          const on = key === active;
          return (
            <button key={key} type="button" onClick={() => onChange(key)} aria-current={on ? "page" : undefined}
              className={cn("flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70",
                on ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/30" : "font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
