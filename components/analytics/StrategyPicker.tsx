"use client";

import React, { useState } from "react";
import { BacktestResult } from "@/types";
import { cn } from "@/lib/utils";
import { seriesColor } from "@/lib/chartTheme";
import { runName } from "@/lib/analyticsCalc";

/** Per-strategy tabs analyse one run at a time; this switches between the selected runs. */
export function usePrimaryBacktest(selected: BacktestResult[]) {
  const [pickedId, setPickedId] = useState<string>("");
  const bt = selected.find((b) => b.id === pickedId) ?? selected[0] ?? null;
  const picker =
    selected.length > 1 ? (
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-slate-400">Strategy</span>
        <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-slate-800 bg-[#0b1222] p-0.5">
          {selected.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setPickedId(b.id)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors",
                bt?.id === b.id ? "bg-blue-600 font-semibold text-white shadow-sm" : "font-medium text-slate-400 hover:text-white"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: seriesColor(i) }} />
              {runName(b, selected)} <span className="font-mono text-[10px] opacity-70">({b.ticker})</span>
            </button>
          ))}
        </div>
      </div>
    ) : null;
  return { bt, picker };
}
