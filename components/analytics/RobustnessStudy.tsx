"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FlaskConical, Loader2, Play, ShieldCheck, Sliders, Footprints } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { api } from "@/lib/api";
import { BacktestResult, OptimizationResult, StrategyConfig, WalkForwardResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import ParamSweep, { applySweepValues, defaultSweepRange, rangesToParams, sweepCandidates } from "@/components/builder/ParamSweep";
import { AnalyticsFilters, btPoints } from "@/lib/analyticsCalc";
import { dsr, psr, sharpeStats, sweepStability } from "@/lib/overfit";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

const ANN = Math.sqrt(252);
const opts = (xs: [string, string][]) => xs.map(([value, label]) => ({ value, label }));

/** The saved copy of the strategy when the run has one; otherwise the current version, fetched once. */
function useRunStrategy(bt: BacktestResult | null) {
  const [s, setS] = useState<StrategyConfig | null>(bt?.strategy_config ?? null);
  useEffect(() => {
    if (!bt) { setS(null); return; }
    if (bt.strategy_config) { setS(bt.strategy_config); return; }
    let live = true;
    api.getStrategy(bt.strategy_id).then((x) => live && setS(x)).catch(() => live && setS(null));
    return () => { live = false; };
  }, [bt?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return { strategy: s, snapshot: !!bt?.strategy_config };
}

/**
 * Three questions about whether a result is robust: could the Sharpe be luck (probabilistic and deflated Sharpe),
 * does it sit on a plateau of parameter settings (sweep), and does re-optimising on the past still work on unseen data (walk-forward).
 */
export default function RobustnessStudy({ bt, filters }: { bt: BacktestResult; filters: AnalyticsFilters }) {
  const { strategy, snapshot } = useRunStrategy(bt);
  const pts = useMemo(() => btPoints(bt, { ...filters, frequency: "Daily" }), [bt, filters]);
  const returns = useMemo(() => pts.slice(1).map((p, i) => (pts[i].value > 0 ? p.value / pts[i].value - 1 : 0)), [pts]);
  const st = useMemo(() => sharpeStats(returns), [returns]);
  const start = pts[0]?.date ?? bt.start_date, end = pts[pts.length - 1]?.date ?? bt.end_date;

  const base = useMemo<StrategyConfig | null>(() => {
    if (!strategy) return null;
    const b: StrategyConfig = { ...strategy, asset: bt.ticker, param_ranges: {} };
    const ranges: Record<string, { min: number; max: number; step: number }> = {};
    sweepCandidates(b).filter((c) => c.spec.target === "indicator" && c.integer).slice(0, 2).forEach((c) => { ranges[c.key] = defaultSweepRange(c); });
    return { ...b, param_ranges: ranges };
  }, [strategy, bt.ticker]);
  const [local, setLocal] = useState<StrategyConfig | null>(base);
  useEffect(() => setLocal(base), [base]);
  const [sweep, setSweep] = useState<OptimizationResult | null>(null);

  const stab = useMemo(() => (sweep ? sweepStability(sweep.iterations.map((i) => i.sharpe_ratio)) : null), [sweep]);
  const deflated = useMemo(() => {
    if (!st || !sweep) return null;
    const trialsDaily = sweep.iterations.map((i) => i.sharpe_ratio / ANN);
    return { ...dsr(st, trialsDaily, sweep.total_evaluations), trials: sweep.total_evaluations };
  }, [st, sweep]);

  // ---- walk-forward ----
  const bars = pts.length;
  const [train, setTrain] = useState(126);
  const [test, setTest] = useState(42);
  const [wf, setWf] = useState<WalkForwardResult | null>(null);
  const [wfBusy, setWfBusy] = useState(false);
  const [wfErr, setWfErr] = useState<string | null>(null);
  const params = local ? rangesToParams(local) : { combos: 0, parameters: [] };
  const folds = Math.max(0, Math.floor((bars - train) / test));
  const wfWhy = !local ? "The strategy behind this run could not be loaded." : params.parameters.length === 0 ? "Tick at least one parameter to optimise in the sweep above." : params.combos > 20 ? `${params.combos} combinations per fold is too many; walk-forward tries at most 20. Narrow a range or widen a step.` : bars < train + test ? `The window has ${fmtInt(bars)} bars; ${train + test} are needed for one train and test period.` : null;
  const runWf = async () => {
    if (wfWhy || !local) return;
    setWfBusy(true); setWfErr(null); setWf(null);
    try {
      setWf(await api.runWalkForward({ strategy: local, start_date: start, end_date: end, benchmark: bt.benchmark || "SPY", train_window_bars: train, test_window_bars: test, parameters: params.parameters as any, metric_target: "sharpe_ratio" }));
    } catch (e: any) { setWfErr(/Insufficient/i.test(e?.message || "") ? "There are not enough price bars for those windows." : e?.message || "Walk-forward failed."); }
    finally { setWfBusy(false); }
  };

  const verdict = (() => {
    if (!st) return null;
    const p = deflated ? deflated.value : psr(st);
    return p >= 0.95 ? { tone: "text-emerald-300", text: "Strong evidence the Sharpe is real" } : p >= 0.75 ? { tone: "text-amber-300", text: "Some evidence, but not conclusive" } : { tone: "text-rose-300", text: "Weak evidence: this could easily be luck" };
  })();

  return (
    <div className="space-y-4" data-testid="robustness-study">
      <Card title="Is the Sharpe real?" subtitle="Probabilistic and deflated Sharpe ratio" info="The probability that the true Sharpe is above zero given how long the sample is and how skewed and fat-tailed the returns are. After a parameter sweep it is deflated for the number of settings tried, because the best of many tries looks good by chance. Both use per-day Sharpe ratios internally." icon={ShieldCheck} tone="emerald">
        {!st ? <EmptyState icon={ShieldCheck} title="Not enough variation" hint="At least 30 daily returns with some movement are needed." /> : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Kpi label="Sharpe (annualised)" value={(st.sr * ANN).toFixed(2)} tone={signTone(st.sr)} sub={`${fmtInt(st.n)} daily returns`} />
              <Kpi label="Probability Sharpe > 0" value={fmtPct(psr(st) * 100, 0, false)} tone={psr(st) >= 0.95 ? "text-emerald-400" : psr(st) >= 0.75 ? "text-amber-400" : "text-rose-400"} sub="PSR, no trials counted" />
              <Kpi label="Luck threshold" value={deflated ? (deflated.threshold * ANN).toFixed(2) : "—"} sub={deflated ? `Best of ${fmtInt(deflated.trials)} trials by chance` : "Run the sweep below"} />
              <Kpi label="Deflated Sharpe" value={deflated ? fmtPct(deflated.value * 100, 0, false) : "—"} tone={deflated ? (deflated.value >= 0.95 ? "text-emerald-400" : deflated.value >= 0.75 ? "text-amber-400" : "text-rose-400") : undefined} sub={deflated ? "Probability it beats luck" : "Needs the sweep"} />
              <Kpi label="Skew / kurtosis" value={`${st.skew.toFixed(2)} / ${st.kurt.toFixed(1)}`} sub="Raw kurtosis (normal = 3)" />
            </div>
            {verdict && <p data-testid="sharpe-verdict" className={cn("text-xs font-semibold", verdict.tone)}>{verdict.text}{deflated ? " (after deflating for the sweep)" : ""}.</p>}
          </div>
        )}
      </Card>

      <Card title="Parameter stability" subtitle="Does the result survive nearby settings?" info="Re-runs the real backtest across a grid of parameter values on this security and window. A broad plateau of similar results suggests a robust choice; a lone peak suggests the chosen value is luck. The number of settings tried feeds the deflated Sharpe above." icon={Sliders} tone="blue">
        {!local ? <EmptyState icon={Sliders} title="No sweepable parameters" hint="The strategy behind this run could not be loaded." /> : (
          <div className="space-y-3">
            {!snapshot && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-300">This run did not save a copy of its strategy, so the current version is swept.</p>}
            <ParamSweep strategy={local} start={start} end={end} benchmark={bt.benchmark || "SPY"} valid onResult={setSweep}
              onRanges={(r) => setLocal((s) => (s ? { ...s, param_ranges: r } : s))}
              onApply={(vals) => setLocal((s) => (s ? applySweepValues(s, vals) : s))} />
            {stab && (
              <div data-testid="stability" className={cn("grid grid-cols-2 gap-3 rounded-xl border p-3 lg:grid-cols-4", stab.verdict === "stable" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")}>
                <Kpi label="Verdict" value={stab.verdict === "stable" ? "Stable plateau" : stab.verdict === "fragile" ? "Fragile peak" : "Unprofitable"} tone={stab.verdict === "stable" ? "text-emerald-400" : "text-amber-300"} sub={`${fmtInt(stab.cells)} settings tested`} />
                <Kpi label="Settings near the best" value={fmtPct(stab.plateauShare, 0, false)} sub="Within 25% of the best Sharpe" />
                <Kpi label="Best vs median Sharpe" value={`${stab.best.toFixed(2)} / ${stab.median.toFixed(2)}`} sub={stab.bestVsMedian ? `${stab.bestVsMedian.toFixed(1)}× the median` : "Median is not positive"} />
                <div className="text-[11px] text-slate-400">{stab.verdict === "fragile" ? "Only a few settings come close to the best. The chosen parameters are probably overfitted to this window." : stab.verdict === "stable" ? "Many settings perform similarly, so small changes to the parameters should not break the strategy." : "No tested setting has a positive Sharpe on this window."}</div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card title="Walk-forward validation" subtitle="Optimise on the past, test on what came next" info="The window is cut into rolling train and test periods. In each fold the parameters are optimised on the training bars only and then used, unchanged, on the following test bars. Stitching the test periods together gives a result that never saw its own optimisation data. A large drop from in-sample to out-of-sample Sharpe means the optimisation is fitting noise." icon={Footprints} tone="purple">
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3 text-xs">
            <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Train bars</span><div className="w-32"><Select label="Train bars" value={String(train)} onChange={(v) => { setTrain(Number(v)); setWf(null); }} options={opts([["63", "63 (3 months)"], ["126", "126 (6 months)"], ["252", "252 (1 year)"]])} /></div></label>
            <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Test bars</span><div className="w-32"><Select label="Test bars" value={String(test)} onChange={(v) => { setTest(Number(v)); setWf(null); }} options={opts([["21", "21 (1 month)"], ["42", "42 (2 months)"], ["63", "63 (3 months)"]])} /></div></label>
            <button type="button" onClick={runWf} disabled={!!wfWhy || wfBusy} title={wfWhy ?? "Run walk-forward on the real engine"} className={cn("flex items-center gap-1.5 rounded-lg px-4 py-2 font-semibold text-white", wfWhy || wfBusy ? "cursor-not-allowed bg-slate-700 opacity-70" : "bg-blue-600 hover:bg-blue-500")}>{wfBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}{wfBusy ? "Running…" : `Run walk-forward${folds > 0 && !wfWhy ? ` (${folds} folds)` : ""}`}</button>
            <span className="text-slate-500">{wfWhy ?? `${folds} folds over ${fmtInt(bars)} bars, up to ${params.combos} settings tried per fold`}</span>
          </div>
          {wfErr && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-300">{wfErr}</p>}
          {wf && (
            <div data-testid="walkforward-result" className="space-y-3">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Out-of-sample Sharpe" value={wf.stitched_metrics.sharpe_ratio.toFixed(2)} tone={signTone(wf.stitched_metrics.sharpe_ratio)} sub="Test periods stitched together" />
                <Kpi label="In-sample Sharpe" value={(wf.folds.reduce((s, f) => s + f.in_sample_sharpe, 0) / Math.max(1, wf.folds.length)).toFixed(2)} sub="Average across folds" />
                <Kpi label="Degradation" value={fmtPct(wf.degradation_pct, 0, false)} tone={wf.degradation_pct > 50 ? "text-rose-400" : wf.degradation_pct > 25 ? "text-amber-300" : "text-emerald-400"} sub="Sharpe lost out of sample" />
                <Kpi label="Parameter stability" value={wf.parameter_stability_score.toFixed(2)} sub="Higher: same settings keep winning" />
              </div>
              {wf.degradation_pct > 50 && <p className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-300"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />More than half the in-sample Sharpe disappears on unseen data. The optimised parameters are mostly fitting noise.</p>}
              <div className="h-48" aria-label="Out-of-sample equity"><ResponsiveContainer width="100%" height="100%"><LineChart data={wf.stitched_equity_curve} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                <ReferenceLine y={wf.stitched_equity_curve[0]?.portfolio_value} stroke="#475569" strokeDasharray="3 3" />
                <Tooltip contentStyle={TOOLTIP_STYLE} /><Line dataKey="portfolio_value" name="Out-of-sample equity" stroke="#2563EB" strokeWidth={1.8} dot={false} isAnimationActive={false} />
              </LineChart></ResponsiveContainer></div>
              <div className="w-full overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left text-xs" aria-label="Walk-forward folds">
                <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">Fold</th><th className="py-1.5">Train</th><th className="py-1.5">Test</th><th className="py-1.5">Chosen</th><th className="py-1.5 text-right">In-sample</th><th className="py-1.5 text-right">Out-of-sample</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">{wf.folds.map((f) => (
                  <tr key={f.fold}><td className="py-1.5 text-slate-300">{f.fold}</td><td className="py-1.5 text-slate-400">{f.train_start} → {f.train_end}</td><td className="py-1.5 text-slate-400">{f.test_start} → {f.test_end}</td>
                    <td className="py-1.5 text-slate-300">{Object.entries(f.best_params).map(([k, v]) => `${k.split(".").pop()}=${Math.round(v * 100) / 100}`).join(", ")}</td>
                    <td className="py-1.5 text-right text-slate-300">{f.in_sample_sharpe.toFixed(2)}</td><td className={cn("py-1.5 text-right font-semibold", signTone(f.out_of_sample_sharpe))}>{f.out_of_sample_sharpe.toFixed(2)}</td></tr>))}</tbody>
              </table></div>
            </div>
          )}
        </div>
      </Card>
      <p className="flex items-start gap-2 text-[11px] text-slate-500"><FlaskConical className="mt-0.5 h-3 w-3 shrink-0" />Sweeps and walk-forward re-run the backtest engine, so they use the current simulation rules and the prices available now.</p>
    </div>
  );
}
