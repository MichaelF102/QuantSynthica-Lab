"use client";

import React, { useMemo } from "react";
import { CalendarDays, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { MONTH_NAMES, monthlyMatrix, toPts } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";

const heat = (v?: number) => {
  if (typeof v !== "number") return "text-slate-600";
  if (v > 5) return "bg-emerald-500/50 font-semibold text-white";
  if (v > 2) return "bg-emerald-500/30 text-emerald-200";
  if (v > 0) return "bg-emerald-500/15 text-slate-200";
  if (v > -2) return "bg-rose-500/20 text-rose-200";
  return "bg-rose-500/45 font-semibold text-white";
};

export function MonthlyMatrixCard({ matrix }: { matrix: ReturnType<typeof monthlyMatrix> }) {
  return (
      <Card title="Monthly returns" subtitle="Calendar-month return of the portfolio" info="Percent change in portfolio value over each calendar month, compounded from the equity curve. YTD compounds the months shown for that year." icon={CalendarDays} tone="blue">
        <div className="w-full overflow-x-auto"><table className="w-full text-center font-mono text-xs">
          <thead><tr className="border-b border-slate-800 font-sans text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 pl-2 text-left">Year</th>{MONTH_NAMES.map((m) => <th key={m} className="py-1.5">{m}</th>)}<th className="py-1.5 pr-2 text-right">YTD</th></tr></thead>
          <tbody className="divide-y divide-slate-800/50">{matrix.map((row) => (
            <tr key={row.year} className="transition-colors hover:bg-slate-800/30">
              <td className="py-2 pl-2 text-left font-bold text-white">{row.year}</td>
              {MONTH_NAMES.map((m) => { const v = row[m] as number | undefined; return <td key={m} className={cn("rounded-sm px-1 py-2", heat(v))}>{typeof v === "number" ? v.toFixed(1) : "—"}</td>; })}
              <td className={cn("py-2 pr-2 text-right font-bold", signTone(row.YTD))}>{fmtPct(row.YTD, 1)}</td>
            </tr>))}</tbody>
        </table></div>
      </Card>
  );
}

export default function MonthlyTab({ bt }: { bt: BacktestResult }) {
  const matrix = useMemo(() => monthlyMatrix(toPts(bt.equity_curve)), [bt]);
  const cells = useMemo(() => matrix.flatMap((r) => MONTH_NAMES.filter((m) => typeof r[m] === "number").map((m) => ({ year: r.year, month: m, v: r[m] as number }))), [matrix]);
  const seasonal = useMemo(() => MONTH_NAMES.map((m) => { const vals = cells.filter((c) => c.month === m).map((c) => c.v); return { month: m, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, n: vals.length }; }), [cells]);

  if (cells.length < 2) return <EmptyState icon={CalendarDays} title="Fewer than two months of data" hint="Run a longer backtest to see monthly returns." />;
  const best = cells.reduce((a, b) => (b.v > a.v ? b : a)), worst = cells.reduce((a, b) => (b.v < a.v ? b : a));
  const pos = cells.filter((c) => c.v > 0).length, avg = cells.reduce((s, c) => s + c.v, 0) / cells.length;

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Best month" value={fmtPct(best.v)} tone="text-emerald-400" sub={`${best.month} ${best.year}`} />
        <Kpi label="Worst month" value={fmtPct(worst.v)} tone="text-rose-400" sub={`${worst.month} ${worst.year}`} />
        <Kpi label="Average month" value={fmtPct(avg)} tone={signTone(avg)} />
        <Kpi label="Positive months" value={fmtPct((pos / cells.length) * 100, 0, false)} sub={`${pos} of ${cells.length}`} />
        <Kpi label="Months analysed" value={String(cells.length)} />
      </div>
      <MonthlyMatrixCard matrix={matrix} />
      <Card title="Seasonality" subtitle="Average return by calendar month" info="Mean return for each calendar month across the years in this run. With only a few years the averages are noisy; the count of observations is in the tooltip." icon={BarChart3} tone="purple">
        <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={seasonal} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="month" {...AXIS_PROPS} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><ReferenceLine y={0} stroke="#475569" />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${fmtPct(Number(v))} (n = ${p.payload.n})`, "Average"]} />
          <Bar dataKey="avg" radius={[3, 3, 0, 0]} isAnimationActive={false}>{seasonal.map((s) => <Cell key={s.month} fill={(s.avg ?? 0) >= 0 ? UP_COLOR : DOWN_COLOR} />)}</Bar>
        </BarChart></ResponsiveContainer></div>
      </Card>
    </div>
  );
}
