"use client";

import React, { useMemo } from "react";
import { TrendingDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";
import { fmtPct, fmtInt } from "@/lib/utils";
import { PortfolioResult } from "@/lib/portfolio/engine";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";

/** Counts distinct drawdown episodes (peak -> new peak) and the longest/avg recovery in trading days. */
function episodes(dd: number[]) {
  const out: { depth: number; len: number }[] = [];
  let depth = 0, len = 0;
  dd.forEach((d) => {
    if (d > 0) { depth = Math.max(depth, d); len++; }
    else if (len > 0) { out.push({ depth, len }); depth = 0; len = 0; }
  });
  if (len > 0) out.push({ depth, len });
  return out;
}

export default function PortfolioDrawdownWidget({ result }: { result: PortfolioResult }) {
  const { data, maxDD, cur, longest, avgLen, count, worstDate } = useMemo(() => {
    const dd = result.pts.map((p) => p.dd);
    const ep = episodes(dd);
    const max = Math.max(...dd);
    return {
      data: result.pts.map((p) => ({ date: p.date, drawdown: -p.dd })),
      maxDD: max, cur: dd[dd.length - 1],
      longest: ep.length ? Math.max(...ep.map((e) => e.len)) : 0,
      avgLen: ep.length ? ep.reduce((s, e) => s + e.len, 0) / ep.length : 0,
      count: ep.length, worstDate: result.pts[dd.indexOf(max)]?.date,
    };
  }, [result]);

  return (
    <Card title="Drawdown analysis" subtitle={`Worst ${fmtPct(-maxDD)} on ${worstDate ?? "—"}`} info="Percentage below the running peak. An episode starts when value falls below a prior peak and ends when that peak is regained." icon={TrendingDown} tone="rose">
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {([
          ["Max drawdown", fmtPct(-maxDD), "text-rose-400"],
          ["Current", fmtPct(-cur), cur > 0 ? "text-rose-400" : "text-emerald-400"],
          ["Longest", `${fmtInt(longest)} d`, "text-white"],
          ["Avg episode", `${avgLen.toFixed(0)} d`, "text-white"],
          ["Episodes", fmtInt(count), "text-white"],
        ] as [string, string, string][]).map(([k, v, t]) => (
          <div key={k}><div className="text-[10px] text-slate-400">{k}</div><div className={`font-mono text-sm font-bold ${t}`}>{v}</div></div>
        ))}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs><linearGradient id="pfDd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0.35} /></linearGradient></defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} />
            <YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), "Drawdown"]} />
            <Area type="monotone" dataKey="drawdown" stroke="#EF4444" strokeWidth={2} fill="url(#pfDd)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
