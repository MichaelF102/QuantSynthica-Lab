import React from "react";
import { cn } from "@/lib/utils";

export const INPUT = "w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 transition-colors hover:border-slate-700 focus:border-blue-500 focus:outline-none";
export const SELECT = cn(INPUT, "cursor-pointer");

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>{label}</span>{hint && <span className={cn("font-normal normal-case tracking-normal", error ? "text-rose-400" : "text-slate-500")}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}
