"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, Sliders } from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult, StrategyConfig } from "@/types";
import { Card, EmptyState } from "@/components/ui/Card";
import ParamSweep, { applySweepValues, defaultSweepRange, sweepCandidates } from "@/components/builder/ParamSweep";

/**
 * Sweep any indicator parameter or risk limit of the strategy behind this run, on the same security and window,
 * then apply the best values and run a real backtest with them.
 */
export default function ParameterSensitivityView({ bt, strategy }: { bt: BacktestResult; strategy: StrategyConfig | null }) {
  const router = useRouter();
  const original = useMemo<StrategyConfig | null>(() => {
    if (!strategy) return null;
    const base: StrategyConfig = { ...strategy, asset: bt.ticker, param_ranges: {} };
    // start with the first two indicator periods ticked, which is the classic fast/slow grid
    const ranges: Record<string, { min: number; max: number; step: number }> = {};
    sweepCandidates(base).filter((c) => c.spec.target === "indicator" && c.integer).slice(0, 2).forEach((c) => { ranges[c.key] = defaultSweepRange(c); });
    return { ...base, param_ranges: ranges };
  }, [strategy, bt.ticker]);
  const [local, setLocal] = useState<StrategyConfig | null>(original);
  const [applied, setApplied] = useState<Record<string, number> | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!original || !local) return <EmptyState icon={Sliders} title="No sweepable parameters" hint="The strategy behind this run could not be loaded, so there is nothing to vary." />;

  const runWithApplied = async () => {
    setRunning(true); setError(null);
    try {
      const res = await api.runBacktest({ ...local, id: original.id, name: original.name }, bt.start_date, bt.end_date, bt.benchmark || "SPY");
      router.push(`/backtests/${res.id}`);
    } catch (e: any) { setError(e?.message || "The backtest failed."); setRunning(false); }
  };

  return (
    <div className="space-y-4 font-sans">
      <Card title="Parameter sensitivity" subtitle={`${bt.strategy_name} on ${bt.ticker}, ${bt.start_date} to ${bt.end_date}`} info="Re-runs the real backtest across a grid of values. A broad region of similar results suggests a robust choice; a lone hot cell suggests the best value is luck. Tick any indicator parameter or risk limit and set its range." icon={Sliders} tone="blue">
        <ParamSweep strategy={local} start={bt.start_date} end={bt.end_date} benchmark={bt.benchmark || "SPY"} valid
          onRanges={(r) => setLocal((s) => (s ? { ...s, param_ranges: r } : s))}
          onApply={(vals) => { setLocal((s) => (s ? applySweepValues(s, vals) : s)); setApplied(vals); }} />
      </Card>

      {applied && (
        <div role="status" data-testid="applied-bar" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          <span>Best values applied to a copy of the strategy: <span className="font-mono">{Object.entries(applied).map(([k, v]) => `${k.split(".").pop()}=${Math.round(v * 100) / 100}`).join(", ")}</span>. Run it to see the real result; this run is not changed.</span>
          <span className="flex gap-2">
            <button type="button" onClick={() => { setLocal(original); setApplied(null); }} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 font-semibold text-slate-200 hover:bg-slate-800"><RotateCcw className="h-3 w-3" />Reset</button>
            <button type="button" onClick={runWithApplied} disabled={running} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"><Play className="h-3 w-3 fill-current" />{running ? "Running…" : "Run backtest with these values"}</button>
          </span>
        </div>
      )}
      {error && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}
    </div>
  );
}
