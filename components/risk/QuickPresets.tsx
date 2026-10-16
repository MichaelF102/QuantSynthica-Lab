"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useRisk } from "@/lib/risk/context";
import { PRESETS } from "@/lib/risk/presets";
import { cn } from "@/lib/utils";

/** One-click sources for the active market, plus the custom basket editor. */
export default function QuickPresets() {
  const { settings, update, sources } = useRisk();
  const list = [...PRESETS, ...sources.filter((s) => s.kind === "portfolio")].filter((s) => s.market === settings.market);
  const chip = "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors";
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Quick presets">
      <span className="mr-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400"><Sparkles className="h-3 w-3" /> Quick presets</span>
      {list.map((s) => (
        <button key={s.key} type="button" onClick={() => update({ sourceKey: s.key })} aria-pressed={settings.sourceKey === s.key}
          className={cn(chip, settings.sourceKey === s.key ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-slate-800 bg-[#0b1222] text-slate-300 hover:border-slate-600 hover:text-white")}>
          {s.kind === "portfolio" ? "★ " : ""}{s.label}
        </button>
      ))}
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("risk:open-basket"))}
        className={cn(chip, settings.sourceKey === "custom" ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-dashed border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white")}>
        Custom Portfolio…
      </button>
    </div>
  );
}
