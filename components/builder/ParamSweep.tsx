"use client";

import React, { useMemo, useState } from "react";
import { Check, Loader2, Play } from "lucide-react";
import { api } from "@/lib/api";
import { StrategyConfig, OptimizationResult } from "@/types";
import Select from "@/components/ui/Select";
import { INPUT } from "./fields";
import { cn } from "@/lib/utils";

type Range = { min: number; max: number; step: number };
interface Candidate { key: string; label: string; value: number; integer: boolean; spec: { name: string; target: "indicator" | "risk"; id?: string } }

const MAX_COMBOS = 60;
const RISK_FIELDS: [keyof StrategyConfig["risk"], string][] = [
  ["stop_loss_pct", "Stop loss %"], ["take_profit_pct", "Take profit %"], ["trailing_stop_pct", "Trailing stop %"],
  ["stop_atr_mult", "Stop ATR ×"], ["take_profit_atr_mult", "Target ATR ×"],
];

/** Every number in the strategy that can be swept: indicator parameters plus the risk limits that are switched on. */
export function sweepCandidates(s: StrategyConfig): Candidate[] {
  const out: Candidate[] = [];
  s.indicators.forEach((ind) => Object.entries(ind.params ?? {}).forEach(([k, v]) => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) out.push({ key: `${ind.id}.${k}`, label: `${ind.name} (${ind.id}) · ${k.replace(/_/g, " ")}`, value: n, integer: /period/i.test(k), spec: { name: k, target: "indicator", id: ind.id } });
  }));
  RISK_FIELDS.forEach(([f, label]) => {
    const v = s.risk[f];
    if (typeof v === "number" && v > 0) out.push({ key: `risk.${f}`, label, value: v, integer: false, spec: { name: f, target: "risk" } });
  });
  return out;
}

const defaultRange = (c: Candidate): Range => {
  if (c.integer) { const min = Math.max(2, Math.round(c.value * 0.6)); const max = Math.round(c.value * 1.4); return { min, max: Math.max(max, min + 2), step: Math.max(1, Math.round((max - min) / 4)) }; }
  const r = (x: number) => Math.round(x * 100) / 100;
  return { min: r(c.value * 0.5), max: r(c.value * 1.5), step: r(Math.max(0.05, c.value * 0.25)) };
};
const countOf = (r: Range) => (r.step > 0 && r.max >= r.min ? Math.floor((r.max - r.min) / r.step + 1e-9) + 1 : 0);

const METRICS = [{ value: "sharpe_ratio", label: "Sharpe ratio" }, { value: "total_return", label: "Total return" }, { value: "calmar_ratio", label: "Calmar ratio" }, { value: "win_rate", label: "Win rate" }];

export default function ParamSweep({ strategy, start, end, benchmark, valid, onRanges, onApply }: {
  strategy: StrategyConfig; start: string; end: string; benchmark: string; valid: boolean;
  onRanges: (r: Record<string, Range>) => void;
  onApply: (best: Record<string, number>) => void;
}) {
  const cands = useMemo(() => sweepCandidates(strategy), [strategy]);
  const ranges = strategy.param_ranges ?? {};
  const active = cands.filter((c) => ranges[c.key]);
  const combos = active.reduce((n, c) => n * Math.max(0, countOf(ranges[c.key])), 1);
  const [metric, setMetric] = useState("sharpe_ratio");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (c: Candidate) => {
    const next = { ...ranges };
    if (next[c.key]) delete next[c.key]; else next[c.key] = defaultRange(c);
    onRanges(next);
  };
  const setField = (c: Candidate, f: keyof Range, v: string) => onRanges({ ...ranges, [c.key]: { ...ranges[c.key], [f]: Number(v) } });

  const why = !valid ? "Fix the strategy's issues first." : active.length === 0 ? "Tick at least one parameter to sweep." : combos < 2 ? "The ranges give a single combination." : combos > MAX_COMBOS ? `${combos} combinations is too many (max ${MAX_COMBOS}). Widen a step or narrow a range.` : null;

  const run = async () => {
    if (why) return;
    setRunning(true); setError(null); setResult(null);
    try {
      const res = await api.runOptimization({
        strategy, start_date: start, end_date: end, benchmark, method: "grid", max_iterations: MAX_COMBOS, metric_target: metric,
        parameters: active.map((c) => ({ ...c.spec, min_val: ranges[c.key].min, max_val: ranges[c.key].max, step: ranges[c.key].step })) as any,
      });
      setResult(res);
    } catch (e: any) {
      setError(/503|unavailable/i.test(e?.message || "") ? "No market data is available for this window, so the sweep can't run." : e?.message || "The sweep failed.");
    } finally { setRunning(false); }
  };

  // the engine keys an indicator's param by the indicator id, or "<id>.<param>" when one indicator has several swept params
  const keyOf = (c: Candidate) => (c.spec.target === "indicator" && c.spec.id ? (active.filter((x) => x.spec.id === c.spec.id).length > 1 ? `${c.spec.id}.${c.spec.name}` : c.spec.id) : c.spec.name);
  const labelForParam = (k: string) => (active.find((c) => keyOf(c) === k) ?? cands.find((c) => keyOf(c) === k))?.label ?? k;

  const hm = result?.heatmap_data;
  const flat = hm ? hm.z_values.flat().filter((v): v is number => v !== null) : [];
  const lo = Math.min(...flat), hi = Math.max(...flat);
  const shade = (v: number | null) => (v === null || hi === lo ? "transparent" : `rgba(${v >= 0 ? "16,185,129" : "244,63,94"},${(0.12 + 0.55 * Math.abs((v - lo) / (hi - lo || 1))).toFixed(2)})`);
  const top = result ? [...result.iterations].sort((a, b) => ((b as any)[metric] ?? b.sharpe_ratio) - ((a as any)[metric] ?? a.sharpe_ratio)).slice(0, 8) : [];

  const num = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : String(Math.round(v * 100) / 100));

  return (
    <div className="space-y-3" data-testid="param-sweep">
      {cands.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">Add an indicator or switch on a stop to have something to sweep.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[460px] text-left text-xs">
            <thead><tr className="border-b border-slate-800 bg-[#080d1a] text-[10px] uppercase tracking-wider text-slate-400"><th className="px-3 py-2">Sweep</th><th className="px-3 py-2">Parameter</th><th className="px-3 py-2 text-right">Now</th><th className="px-2 py-2">Min</th><th className="px-2 py-2">Max</th><th className="px-2 py-2">Step</th></tr></thead>
            <tbody className="divide-y divide-slate-800/60">
              {cands.map((c) => {
                const r = ranges[c.key];
                return (
                  <tr key={c.key}>
                    <td className="px-3 py-1.5"><input type="checkbox" aria-label={`Sweep ${c.label}`} checked={!!r} onChange={() => toggle(c)} className="accent-blue-600" /></td>
                    <td className="px-3 py-1.5 text-slate-200">{c.label}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-400">{num(c.value)}</td>
                    {(["min", "max", "step"] as const).map((f) => (
                      <td key={f} className="px-2 py-1.5"><input type="number" step="any" disabled={!r} aria-label={`${c.label} ${f}`} value={r ? r[f] : ""} onChange={(e) => setField(c, f, e.target.value)} className={cn(INPUT, "w-20 px-2 py-1 font-mono disabled:opacity-30")} /></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="w-40"><Select label="Optimise for" value={metric} onChange={setMetric} options={METRICS} /></div>
        <button type="button" onClick={run} disabled={!!why || running} title={why ?? "Run the sweep on the real engine"} className={cn("flex items-center gap-1.5 rounded-lg px-4 py-2 font-semibold text-white transition-colors", why || running ? "cursor-not-allowed bg-slate-700 opacity-70" : "bg-blue-600 hover:bg-blue-500")}>
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}{running ? "Running…" : `Run sweep${combos > 1 && active.length ? ` (${combos})` : ""}`}
        </button>
        <span className="text-slate-500">{why ?? `${combos} combinations on ${strategy.asset}, ${start} → ${end}`}</span>
      </div>
      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-300">{error}</p>}

      {result && (
        <div className="space-y-3 rounded-xl border border-slate-800 bg-[#080d1a] p-3" data-testid="sweep-result">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs"><span className="text-slate-400">Best </span>
              {Object.entries(result.best_params).map(([k, v]) => <span key={k} className="mr-2 font-mono text-blue-300">{labelForParam(k).split(" · ").pop()}={num(v)}</span>)}
              <span className="text-slate-400">· Sharpe </span><span className="font-mono text-white">{num(result.best_metrics.sharpe_ratio ?? 0)}</span>
              <span className="text-slate-400"> · {result.best_metrics.num_trades ?? 0} trades</span>
            </div>
            <button type="button" onClick={() => onApply(Object.fromEntries(active.map((c) => [c.key, result.best_params[keyOf(c)]]).filter(([, v]) => typeof v === "number")))} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20"><Check className="h-3.5 w-3.5" />Apply best</button>
          </div>
          <p className={cn("rounded-md border px-2 py-1 text-[11px]", result.overfitting_warning ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-slate-800 text-slate-400")}>{result.overfitting_notes}</p>

          {hm && (
            <div className="overflow-x-auto">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">Sharpe · {labelForParam(hm.x_param).split(" · ").pop()} (across) vs {labelForParam(hm.y_param).split(" · ").pop()} (down)</div>
              <table className="border-collapse text-[11px]" aria-label="Sharpe heatmap">
                <thead><tr><th />{hm.x_values.map((x) => <th key={x} className="px-2 py-1 font-mono text-slate-400">{num(x)}</th>)}</tr></thead>
                <tbody>{hm.y_values.map((y, yi) => (
                  <tr key={y}><th className="px-2 py-1 text-right font-mono text-slate-400">{num(y)}</th>
                    {hm.x_values.map((x, xi) => { const v = hm.z_values[yi][xi]; return <td key={x} style={{ background: shade(v) }} className="border border-slate-800 px-2 py-1 text-center font-mono text-slate-100">{v === null ? "—" : v.toFixed(2)}</td>; })}
                  </tr>))}</tbody>
              </table>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[11px]">
              <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1 pr-2">Parameters</th><th className="py-1 text-right">Sharpe</th><th className="py-1 text-right">Return</th><th className="py-1 text-right">Max DD</th><th className="py-1 text-right">Trades</th></tr></thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {top.map((it) => (
                  <tr key={it.iteration}>
                    <td className="py-1 pr-2 text-slate-300">{Object.entries(it.params).map(([k, v]) => `${labelForParam(k).split(" · ").pop()}=${num(v)}`).join(", ")}</td>
                    <td className="py-1 text-right text-slate-200">{it.sharpe_ratio.toFixed(2)}</td>
                    <td className={cn("py-1 text-right", it.total_return >= 0 ? "text-emerald-400" : "text-rose-400")}>{it.total_return.toFixed(1)}%</td>
                    <td className="py-1 text-right text-rose-400">{Math.abs(it.max_drawdown).toFixed(1)}%</td>
                    <td className="py-1 text-right text-slate-400">{it.num_trades}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
