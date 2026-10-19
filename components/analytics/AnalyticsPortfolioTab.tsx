"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Grid3x3, LineChart as LineIcon, PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { AnalyticsFilters, btPoints, runName } from "@/lib/analyticsCalc";
import { WeightMode, alignRunReturns, corrMatrix, diversificationRatio, equityFrom, maxDrawdown, portfolioReturns, riskContributions, sd, weightsFor } from "@/lib/portfolioOfRuns";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

const MODES: [WeightMode, string][] = [["equal", "Equal"], ["inverse_vol", "Inverse volatility"], ["custom", "Custom"]];
const shade = (c: number | null) => (c === null ? "transparent" : `rgba(${c >= 0 ? "37,99,235" : "244,63,94"},${(0.08 + 0.5 * Math.abs(c)).toFixed(2)})`);

/** What happens if the selected runs are held together: combined return and risk, how much each adds, and whether they really diversify. */
export default function AnalyticsPortfolioTab({ selectedBacktests, filters }: Props) {
  const [mode, setMode] = useState<WeightMode>("equal");
  const [custom, setCustom] = useState<number[]>([]);
  const names = useMemo(() => selectedBacktests.map((b) => runName(b, selectedBacktests)), [selectedBacktests]);
  const al = useMemo(() => alignRunReturns(selectedBacktests.map((b) => btPoints(b, { ...filters, frequency: "Daily" }))), [selectedBacktests, filters]);
  const w = useMemo(() => (al ? weightsFor(mode, al.returns, custom.length ? custom : selectedBacktests.map(() => 1)) : []), [al, mode, custom, selectedBacktests]);

  if (selectedBacktests.length < 2) return <EmptyState icon={PieIcon} title="Select at least two strategies to combine" hint="Choose runs on the Overview tab; this tab shows what holding them together would have done." />;
  if (!al) return <EmptyState icon={PieIcon} title="These runs share too few dates" hint="Combining runs needs at least three trading days that every selected run covers in the chosen window." />;

  const pr = portfolioReturns(al.returns, w), eq = equityFrom(pr, 100);
  const corr = corrMatrix(al.returns), rc = riskContributions(al.returns, w), dr = diversificationRatio(al.returns, w);
  const runEq = al.returns.map((r) => equityFrom(r, 100));
  const chart = al.dates.map((d, i) => { const row: Record<string, number | string> = { date: d, Portfolio: eq[i + 1] - 100 }; runEq.forEach((e, k) => (row[`r${k}`] = e[i + 1] - 100)); return row; });
  const pvol = sd(pr) * Math.sqrt(252) * 100, psh = sd(pr) > 1e-12 ? (pr.reduce((a, b) => a + b, 0) / pr.length / sd(pr)) * Math.sqrt(252) : null;
  const dupPairs: string[] = [];
  corr.forEach((row, i) => row.forEach((c, j) => { if (j > i && c !== null && c > 0.999) dupPairs.push(`${names[i]} and ${names[j]}`); }));
  const warnings: string[] = [];
  if (dupPairs.length) warnings.push(`${dupPairs.join("; ")} move identically (correlation 1.00). They are probably the same run, so combining them adds no diversification.`);
  if (al.sharedDays < 60) warnings.push(`The runs share only ${al.sharedDays} trading days, so every figure here rests on a very short history.`);
  if (new Set(selectedBacktests.map((b) => b.ticker)).size < selectedBacktests.length) warnings.push("Some runs trade the same security, so they will be correlated by construction.");
  if (corr.some((r) => r.some((c) => c === null))) warnings.push("A run with no variance in this window (it held nothing) has no correlation and adds nothing to the portfolio's risk.");
  warnings.push("Daily rebalanced to the weights above, ignoring rebalancing costs and any currency differences between the runs.");

  const setW = (i: number, v: string) => setCustom((c) => { const n = selectedBacktests.map((_, k) => c[k] ?? 1); n[i] = Number(v); return n; });

  return (
    <div className="space-y-4" data-testid="portfolio-tab">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-slate-400">Weights</span>
        <div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5" role="group" aria-label="Weighting">
          {MODES.map(([m, l]) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("rounded-md px-2.5 py-1 font-semibold", mode === m ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{l}</button>)}
        </div>
        <span className="text-slate-500">{al.window.start} → {al.window.end} · {fmtInt(al.sharedDays)} shared days</span>
      </div>
      <div role="note" data-testid="portfolio-warnings" className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        {warnings.map((x) => <p key={x} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{x}</p>)}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Combined return" value={fmtPct(eq[eq.length - 1] - 100)} tone={signTone(eq[eq.length - 1] - 100)} sub="Over the shared window" />
        <Kpi label="Volatility (ann.)" value={fmtPct(pvol, 1, false)} sub={`Weighted avg of runs ${fmtPct(al.returns.reduce((s, r, i) => s + w[i] * sd(r), 0) * Math.sqrt(252) * 100, 1, false)}`} />
        <Kpi label="Sharpe" value={psh === null ? "—" : psh.toFixed(2)} tone={psh === null ? undefined : signTone(psh)} sub="Risk-free 0%" />
        <Kpi label="Max drawdown" value={fmtPct(-maxDrawdown(eq), 1)} tone="text-rose-400" sub="Combined portfolio" />
        <Kpi label="Diversification ratio" value={dr === null ? "—" : dr.toFixed(2)} tone={dr !== null && dr > 1.2 ? "text-emerald-400" : "text-amber-300"} sub="1 = no benefit; higher is better" />
      </div>

      <Card title="Combined growth" subtitle="Each run and the portfolio, % over the shared dates" info="The portfolio line applies the weights to each day's returns. If it sits well above the average of the runs with a shallower drawdown, the runs are genuinely diversifying." icon={LineIcon} tone="blue">
        <div className="h-60" aria-label="Portfolio growth chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Number(v).toFixed(0)}%`} /><ReferenceLine y={0} stroke="#475569" />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toFixed(2)}%`} /><Legend wrapperStyle={{ fontSize: 11 }} />
          {selectedBacktests.map((b, i) => <Line key={b.id} dataKey={`r${i}`} name={names[i]} stroke={seriesColor(i)} strokeWidth={1.2} strokeOpacity={0.7} dot={false} isAnimationActive={false} />)}
          <Line dataKey="Portfolio" name="Portfolio" stroke="#F8FAFC" strokeWidth={2.6} dot={false} isAnimationActive={false} />
        </LineChart></ResponsiveContainer></div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Contribution" subtitle="Weight, stand-alone figures and share of portfolio risk" info="Risk share is each run's contribution to the portfolio's variance (weight × covariance with the portfolio ÷ portfolio variance). A run with a small weight can still carry most of the risk." icon={PieIcon} tone="purple">
          <div className="w-full overflow-x-auto"><table className="w-full min-w-[460px] border-collapse text-left text-xs" aria-label="Portfolio contribution">
            <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">Run</th><th className="py-1.5 text-right">Weight</th><th className="py-1.5 text-right">Return</th><th className="py-1.5 text-right">Vol</th><th className="py-1.5 text-right">Risk share</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">{selectedBacktests.map((b, i) => (
              <tr key={b.id}>
                <td className="py-2 font-sans text-slate-200"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: seriesColor(i) }} />{names[i]}</td>
                <td className="py-2 text-right text-slate-200">{mode === "custom" ? <input type="number" min="0" step="any" aria-label={`Weight for ${names[i]}`} value={custom[i] ?? 1} onChange={(e) => setW(i, e.target.value)} className="w-14 rounded border border-slate-700 bg-[#080d1a] px-1 py-0.5 text-right text-xs text-white" /> : null}<span className={mode === "custom" ? "ml-2 text-slate-400" : ""}>{fmtPct(w[i] * 100, 1, false)}</span></td>
                <td className={cn("py-2 text-right", signTone(runEq[i][runEq[i].length - 1] - 100))}>{fmtPct(runEq[i][runEq[i].length - 1] - 100)}</td>
                <td className="py-2 text-right text-slate-300">{rc.vol[i] > 1e-12 ? fmtPct(rc.vol[i] * Math.sqrt(252) * 100, 1, false) : "—"}</td>
                <td className="py-2 text-right text-slate-200">{fmtPct(rc.pct[i], 0, false)}</td>
              </tr>))}</tbody>
          </table></div>
        </Card>
        <Card title="Correlation" subtitle="Daily returns over the shared dates" info="Pearson correlation of the runs' daily returns. Values near 1 mean the runs rise and fall together and add little diversification; near 0 or negative is what makes combining worthwhile. Blank where a run did not move." icon={Grid3x3} tone="amber">
          <div className="w-full overflow-x-auto"><table className="border-collapse text-center text-[11px]" aria-label="Correlation matrix">
            <thead><tr><th />{names.map((n, i) => <th key={n + i} className="max-w-[110px] truncate px-2 py-1 font-normal text-slate-400" title={n}>{String.fromCharCode(65 + i)}</th>)}</tr></thead>
            <tbody>{corr.map((row, i) => (
              <tr key={i}><th className="whitespace-nowrap px-2 py-1 text-right font-normal text-slate-400" title={names[i]}>{String.fromCharCode(65 + i)} <span className="text-slate-600">{names[i].slice(0, 22)}</span></th>
                {row.map((c, j) => <td key={j} style={{ background: shade(c) }} className="border border-slate-800 px-3 py-1.5 font-mono text-slate-100">{c === null ? "—" : c.toFixed(2)}</td>)}</tr>))}</tbody>
          </table></div>
        </Card>
      </div>
    </div>
  );
}
