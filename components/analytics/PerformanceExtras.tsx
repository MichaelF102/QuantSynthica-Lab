"use client";

import React, { useMemo, useState } from "react";
import { Activity, Crosshair, Gauge, Trophy } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { Pt, bestWorstPeriods, captureRatios, distStats, rollingBeta, rollingSharpe } from "@/lib/analyticsCalc";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";

/** How the return stream behaves over time and relative to the benchmark: rolling Sharpe and beta, capture, shape and extremes. */
export default function PerformanceExtras({ pts, hasBenchmark }: { pts: Pt[]; hasBenchmark: boolean }) {
  const [win, setWin] = useState(60);
  const sharpe = useMemo(() => rollingSharpe(pts, win), [pts, win]);
  const beta = useMemo(() => rollingBeta(pts, win), [pts, win]);
  const cap = useMemo(() => (hasBenchmark ? captureRatios(pts) : null), [pts, hasBenchmark]);
  const dist = useMemo(() => distStats(pts), [pts]);
  const periods = useMemo(() => bestWorstPeriods(pts), [pts]);
  const cp = (v: number) => fmtPct(Math.abs(v) < 0.05 ? 0 : v, Math.abs(v) < 10 ? 1 : 0, false); // never "-0%"
  const dash = (v: number | null | undefined, d = 2) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(d) : "—");

  const toggle = (
    <div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5 text-[11px]" role="group" aria-label="Rolling window">
      {[30, 60, 90, 126].map((w) => <button key={w} type="button" aria-pressed={win === w} onClick={() => setWin(w)} className={cn("rounded-md px-2.5 py-1 font-semibold", win === w ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{w}d</button>)}
    </div>
  );
  const fmtDate = (d: string, e: string) => (d === e ? d : `${d} → ${e}`);

  return (
    <div className="space-y-4" data-testid="performance-extras">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Up capture" value={cap ? cp(cap.up) : "—"} tone={cap && cap.up >= 100 ? "text-emerald-400" : "text-white"} sub={cap ? `${cap.upN} ${cap.basis === "monthly" ? "up months" : "up days"}` : "Needs up and down periods"} />
        <Kpi label="Down capture" value={cap ? cp(cap.down) : "—"} tone={cap && cap.down <= 100 ? "text-emerald-400" : "text-rose-400"} sub={cap ? `${cap.downN} ${cap.basis === "monthly" ? "down months" : "down days"}` : "Lower is better"} />
        <Kpi label="Capture ratio" value={cap?.ratio == null ? "—" : cap.ratio.toFixed(2)} tone={cap?.ratio != null && cap.ratio > 1 ? "text-emerald-400" : "text-white"} sub="Up ÷ down; above 1 is good" />
        <Kpi label="Skew" value={dist ? dash(dist.skew) : "—"} tone={dist ? signTone(dist.skew) : undefined} sub={dist ? `Excess kurtosis ${dash(dist.kurtosis)}` : undefined} />
        <Kpi label="Positive days" value={dist?.positiveActive == null ? "—" : fmtPct(dist.positiveActive, 0, false)} sub={dist ? `of ${dist.activeDays} days with a move` : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Rolling Sharpe" subtitle={`${win}-day window, risk-free 0%`} info="Annualised Sharpe over a trailing window. Gaps appear where the strategy was flat for the whole window, because there is no variance to divide by. A line that swings between strongly positive and negative says the average hides unstable behaviour." icon={Activity} tone="blue" action={toggle}>
          {sharpe.length === 0 ? <EmptyState icon={Activity} title="Not enough history" hint={`Needs more than ${win} trading days.`} /> : (
            <div className="h-52" aria-label="Rolling Sharpe"><ResponsiveContainer width="100%" height="100%"><LineChart data={sharpe} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} />
              <ReferenceLine y={0} stroke="#475569" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => (typeof v === "number" ? v.toFixed(2) : "—")} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="strat" name="Strategy" stroke="#2563EB" strokeWidth={1.8} dot={false} connectNulls={false} isAnimationActive={false} />
              {hasBenchmark && <Line dataKey="bench" name="Benchmark" stroke="#64748B" strokeDasharray="4 4" strokeWidth={1.3} dot={false} isAnimationActive={false} />}
            </LineChart></ResponsiveContainer></div>
          )}
        </Card>
        <Card title="Rolling beta" subtitle={`${win}-day window vs the benchmark`} info="Sensitivity of the strategy's daily returns to the benchmark's over a trailing window. Near zero while the strategy holds nothing, near 1 when it moves with the market." icon={Gauge} tone="purple" action={toggle}>
          {!hasBenchmark ? <EmptyState icon={Gauge} title="No benchmark data" /> : beta.length === 0 ? <EmptyState icon={Gauge} title="Not enough history" hint={`Needs more than ${win} trading days.`} /> : (
            <div className="h-52" aria-label="Rolling beta"><ResponsiveContainer width="100%" height="100%"><LineChart data={beta} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} />
              <ReferenceLine y={0} stroke="#475569" /><ReferenceLine y={1} stroke="#475569" strokeDasharray="3 3" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => (typeof v === "number" ? v.toFixed(2) : "—")} />
              <Line dataKey="beta" name="Beta" stroke="#7C3AED" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart></ResponsiveContainer></div>
          )}
        </Card>
      </div>

      <Card title="Best and worst periods" subtitle="Rolling returns over fixed lengths" info="The strongest and weakest stretch of each length in this window, and when they happened." icon={Trophy} tone="amber">
        {periods.length === 0 ? <EmptyState icon={Trophy} title="Not enough history" /> : (
          <div className="w-full overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-left text-xs" aria-label="Best and worst periods">
            <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">Period</th><th className="py-1.5">Best</th><th className="py-1.5 text-right">Return</th><th className="py-1.5 pl-6">Worst</th><th className="py-1.5 text-right">Return</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">{periods.map((p) => (
              <tr key={p.label} className="hover:bg-slate-800/30">
                <td className="py-2 font-sans font-medium text-slate-200">{p.label}</td>
                <td className="py-2 text-slate-400">{fmtDate(p.best.start, p.best.end)}</td><td className={cn("py-2 text-right font-semibold", signTone(p.best.ret))}>{fmtPct(p.best.ret)}</td>
                <td className="py-2 pl-6 text-slate-400">{fmtDate(p.worst.start, p.worst.end)}</td><td className={cn("py-2 text-right font-semibold", signTone(p.worst.ret))}>{fmtPct(p.worst.ret)}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Card>
      <p className="flex items-start gap-2 text-[11px] text-slate-500"><Crosshair className="mt-0.5 h-3 w-3 shrink-0" />Capture uses calendar months when the window has at least 12, otherwise days. A strategy that holds cash captures little in either direction.</p>
    </div>
  );
}
