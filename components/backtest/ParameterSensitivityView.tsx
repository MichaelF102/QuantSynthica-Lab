"use client";

import React, { useMemo, useState } from "react";
import { Play, Sliders, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult, OptimizationIteration, OptimizationResult, StrategyConfig } from "@/types";
import { Card, EmptyState } from "@/components/ui/Card";
import { formatRatio } from "@/lib/formatters";
import { fmtPct, cn } from "@/lib/utils";

type Metric = "total_return" | "sharpe_ratio" | "max_drawdown";
const METRICS: { key: Metric; label: string }[] = [{ key: "total_return", label: "Total return" }, { key: "sharpe_ratio", label: "Sharpe" }, { key: "max_drawdown", label: "Max drawdown" }];

interface Axis { id: string; label: string; base: number }

/** Numeric indicator parameters we can sweep, e.g. the fast and slow SMA periods. */
function axesOf(s: StrategyConfig | null): Axis[] {
  if (!s) return [];
  return s.indicators.flatMap((ind) => Object.entries(ind.params).filter(([k, v]) => k === "period" && typeof v === "number" && v >= 3).map(([k, v]) => ({ id: ind.id, label: `${ind.name} ${k} (${ind.id})`, base: v as number })));
}
const gridOf = (base: number) => { const step = Math.max(1, Math.round(base * 0.2)); const min = Math.max(2, Math.round(base * 0.6)); return { min_val: min, max_val: min + 4 * step, step }; };

export default function ParameterSensitivityView({ bt, strategy }: { bt: BacktestResult; strategy: StrategyConfig | null }) {
  const axes = useMemo(() => axesOf(strategy), [strategy]);
  const [metric, setMetric] = useState<Metric>("total_return");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [xi, yi] = [axes[0], axes[1]];

  if (!strategy || !xi) return <EmptyState icon={Sliders} title="No sweepable parameters" hint="This strategy has no numeric indicator periods to vary, or its configuration could not be loaded." />;

  const run = async () => {
    setRunning(true); setError(null);
    try {
      const use = [xi, yi].filter(Boolean) as Axis[];
      setResult(await api.runOptimization({
        strategy: { ...strategy, asset: bt.ticker }, start_date: bt.start_date, end_date: bt.end_date, benchmark: bt.benchmark || "SPY",
        parameters: use.map((a) => ({ name: "period", target: "indicator", id: a.id, ...gridOf(a.base) })), method: "grid", max_iterations: 60, metric_target: "sharpe_ratio",
      } as any));
    } catch (e: any) { setError(e?.message || "The parameter sweep failed."); setResult(null); }
    finally { setRunning(false); }
  };

  const cell = (it?: OptimizationIteration) => (it ? it[metric] : undefined);
  const tone = (v: number | undefined) => {
    if (v === undefined) return "text-slate-600";
    if (metric === "max_drawdown") return v > -5 ? "bg-emerald-500/15 text-emerald-300" : v > -12 ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/25 font-semibold text-rose-300";
    if (metric === "sharpe_ratio") return v > 1 ? "bg-emerald-500/30 font-semibold text-emerald-200" : v > 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/20 text-rose-300";
    return v > 3 ? "bg-emerald-500/30 font-semibold text-emerald-200" : v > 0 ? "bg-emerald-500/10 text-emerald-300" : v < -2 ? "bg-rose-500/25 font-semibold text-rose-300" : "bg-rose-500/10 text-rose-300";
  };
  const show = (v: number | undefined) => (v === undefined ? "—" : metric === "sharpe_ratio" ? formatRatio(v) : fmtPct(v));
  const h = result?.heatmap_data;

  return (
    <div className="space-y-4 font-sans">
      <Card title="Parameter sensitivity" subtitle={`${bt.strategy_name} on ${bt.ticker}, ${bt.start_date} to ${bt.end_date}`} info="Re-runs the backtest across a grid of indicator periods around the current values (±40%). A broad region of similar results suggests a robust strategy; a lone hot cell suggests overfitting." icon={Sliders} tone="blue"
        action={<div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5">{METRICS.map((m) => <button key={m.key} onClick={() => setMetric(m.key)} className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold", metric === m.key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{m.label}</button>)}</div>
          <button onClick={run} disabled={running} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"><Play className="h-3 w-3 fill-current" />{running ? "Running sweep…" : result ? "Re-run sweep" : "Run sensitivity analysis"}</button>
        </div>}>
        {error && <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}</div>}
        {!result && !running && !error && <EmptyState icon={Sliders} title="Run the sweep to see the heatmap" hint={`Varies ${[xi, yi].filter(Boolean).map((a) => a!.label).join(" and ")} using real backtests. This can take up to a minute.`} />}
        {running && <div className="py-10 text-center text-xs text-slate-400">Running up to 25 backtests…</div>}
        {result && h && (
          <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-center font-mono text-xs">
            <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-2 text-left font-sans">{yi?.id} \ {xi.id}</th>{h.x_values.map((x: number) => <th key={x} className="py-2">{x}</th>)}</tr></thead>
            <tbody>{h.y_values.map((y: number) => (
              <tr key={y} className="border-b border-slate-800/50"><td className="py-2 text-left font-bold text-white">{y}</td>
                {h.x_values.map((x: number) => { const it = result.iterations.find((i) => i.params[h.x_param] === x && i.params[h.y_param] === y); const v = cell(it); return <td key={x} className={cn("px-2 py-2.5", tone(v))}>{show(v)}</td>; })}</tr>))}</tbody>
          </table></div>
        )}
        {result && !h && (
          <div className="w-full overflow-x-auto"><table className="w-full text-center font-mono text-xs"><thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-2 text-left font-sans">{xi.id}</th><th>{METRICS.find((m) => m.key === metric)!.label}</th></tr></thead>
            <tbody>{result.iterations.map((i) => <tr key={i.iteration} className="border-b border-slate-800/50"><td className="py-2 text-left font-bold text-white">{i.params[xi.id]}</td><td className={cn("py-2", tone(i[metric]))}>{show(i[metric])}</td></tr>)}</tbody></table></div>
        )}
        {result && <p className={cn("mt-3 rounded-lg border p-3 text-xs", result.overfitting_warning ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-slate-800 text-slate-400")}>{result.overfitting_notes} Best by Sharpe: {Object.entries(result.best_params).map(([k, v]) => `${k} = ${v}`).join(", ")}.</p>}
      </Card>
    </div>
  );
}
