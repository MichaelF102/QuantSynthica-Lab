import React from "react";
import { Spark } from "./charts";
import { cn } from "@/lib/utils";

interface Props { label: string; value: string; sub?: React.ReactNode; amount?: string; tone?: string; data?: number[]; color?: string; hint?: string }

/** KPI tile with a real rolling-series sparkline (DESIGN.md 7.8 + mockup). `—` values are muted. */
export default function SparkKpi({ label, value, sub, amount, tone = "text-white", data, color, hint }: Props) {
  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-3.5" title={hint}>
      <div className="mb-1 text-[11px] text-slate-400">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={cn("truncate font-mono text-xl font-bold", value === "—" ? "text-slate-500" : tone)}>{value}</div>
          {amount && <div className={cn("font-mono text-xs font-semibold", amount === "—" ? "text-slate-500" : tone)}>{amount}</div>}
          {sub && <div className="mt-0.5 font-mono text-[11px] text-slate-400">{sub}</div>}
        </div>
        <Spark data={data} color={color} />
      </div>
    </div>
  );
}
