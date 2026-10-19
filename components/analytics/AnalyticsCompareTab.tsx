"use client";

import React, { useMemo } from "react";
import { AlertTriangle, Columns3, LineChart as LineIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState } from "@/components/ui/Card";
import { AnalyticsFilters, btPoints, runName } from "@/lib/analyticsCalc";
import { BEST, compareRuns } from "@/lib/compareRuns";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { cn } from "@/lib/utils";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

/** Every selected run side by side across performance, risk, trades, regimes and robustness, with the reasons they may not be comparable. */
export default function AnalyticsCompareTab({ selectedBacktests, filters }: Props) {
  const names = useMemo(() => selectedBacktests.map((b) => runName(b, selectedBacktests)), [selectedBacktests]);
  const cmp = useMemo(() => (selectedBacktests.length ? compareRuns(selectedBacktests, filters, names) : null), [selectedBacktests, filters, names]);
  const growth = useMemo(() => {
    const series = selectedBacktests.map((b) => btPoints(b, { ...filters, frequency: "Daily" }));
    if (series.some((s) => s.length < 3)) return [];
    const maps = series.map((s) => new Map(s.map((p) => [p.date, p.value])));
    const common = series[0].map((p) => p.date).filter((d) => maps.every((m) => m.has(d)));
    return common.map((d) => { const row: Record<string, number | string> = { date: d }; maps.forEach((m, i) => (row[`r${i}`] = (m.get(d)! / m.get(common[0])! - 1) * 100)); return row; });
  }, [selectedBacktests, filters]);

  if (selectedBacktests.length < 2 || !cmp) return <EmptyState icon={Columns3} title="Select at least two strategies to compare" hint="Choose runs on the Overview tab; they are compared here across every dimension." />;
  const groups = [...new Set(cmp.rows.map((r) => r.group))];

  return (
    <div className="space-y-4" data-testid="compare-tab">
      {cmp.warnings.length > 0 && (
        <div role="note" data-testid="compare-warnings" className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          {cmp.warnings.map((w) => <p key={w} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{w}</p>)}
        </div>
      )}

      <Card title="Growth over the shared dates" subtitle="Each run from the same starting day, %" info="Cumulative return of each run over the dates they all cover, so the lines start together even if the runs began at different times." icon={LineIcon} tone="blue">
        {growth.length < 3 ? <p className="py-6 text-center text-xs text-slate-500">These runs share fewer than three dates in this window.</p> : (
          <div className="h-60" aria-label="Comparison growth chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={growth} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Number(v).toFixed(0)}%`} /><ReferenceLine y={0} stroke="#475569" />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toFixed(2)}%`} /><Legend wrapperStyle={{ fontSize: 11 }} />
            {selectedBacktests.map((b, i) => <Line key={b.id} dataKey={`r${i}`} name={names[i]} stroke={seriesColor(i)} strokeWidth={1.8} dot={false} isAnimationActive={false} />)}
          </LineChart></ResponsiveContainer></div>
        )}
      </Card>

      <Card title="Side by side" subtitle="Green marks the best value in each row" info="Statistics are computed over the date window set above, from each run's own equity curve and trades. Rows that need a benchmark are blank for runs without one." icon={Columns3} tone="purple">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-xs" aria-label="Side by side comparison">
            <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-2" />{names.map((n, i) => <th key={n + i} className="py-2 pl-3 text-right normal-case" style={{ color: seriesColor(i) }}>{n}</th>)}</tr></thead>
            <tbody className="font-mono">
              <tr className="bg-slate-800/30"><td colSpan={names.length + 1} className="px-1 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">Setup</td></tr>
              {cmp.setup.map((s) => (
                <tr key={s.label} className="border-b border-slate-800/40"><td className="py-1.5 font-sans text-slate-400">{s.label}</td>{s.values.map((v, i) => <td key={i} className={cn("py-1.5 pl-3 text-right", v === "not recorded" ? "text-amber-300" : "text-slate-200")}>{v}</td>)}</tr>
              ))}
              {groups.map((g) => (
                <React.Fragment key={g}>
                  <tr className="bg-slate-800/30"><td colSpan={names.length + 1} className="px-1 py-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{g}</td></tr>
                  {cmp.rows.filter((r) => r.group === g).map((r) => { const best = BEST(r); return (
                    <tr key={r.key} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                      <td className="py-1.5 font-sans text-slate-300">{r.label}</td>
                      {r.values.map((v, i) => <td key={i} className={cn("py-1.5 pl-3 text-right", v === null ? "text-slate-600" : best !== null && v === best ? "font-bold text-emerald-400" : "text-slate-200")}>{v === null ? "—" : r.fmt(v)}</td>)}
                    </tr>); })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
