"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Play,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  StrategyConfig,
  OptimizationResult,
  WalkForwardResult,
  OptimizationParamRange,
} from "@/types";
import { formatPercent, formatRatio, formatCurrency } from "@/lib/formatters";
import OptimizationHeatmap from "@/components/charts/OptimizationHeatmap";
import EquityCurveChart from "@/components/charts/EquityCurveChart";

export default function OptimizationPage() {
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [selectedStratId, setSelectedStratId] = useState<string>("");
  const [activeMode, setActiveMode] = useState<"grid" | "walk_forward">("grid");

  // Grid params
  const [fastMin, setFastMin] = useState(8);
  const [fastMax, setFastMax] = useState(20);
  const [fastStep, setFastStep] = useState(4);
  const [slowMin, setSlowMin] = useState(24);
  const [slowMax, setSlowMax] = useState(40);
  const [slowStep, setSlowStep] = useState(8);

  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [wfResult, setWfResult] = useState<WalkForwardResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    api.getStrategies().then((strats) => {
      setStrategies(strats);
      if (strats.length > 0) {
        setSelectedStratId(strats[1]?.id || strats[0]?.id);
      }
    }).catch(console.error);
  }, []);

  const handleRunOptimization = async () => {
    const strat = strategies.find((s) => s.id === selectedStratId);
    if (!strat) return;

    setIsProcessing(true);
    try {
      const params: OptimizationParamRange[] = [
        {
          name: "period",
          target: "indicator",
          id: strat.indicators[0]?.id || "fast_ema",
          min_val: fastMin,
          max_val: fastMax,
          step: fastStep,
        },
        {
          name: "period",
          target: "indicator",
          id: strat.indicators[1]?.id || "slow_ema",
          min_val: slowMin,
          max_val: slowMax,
          step: slowStep,
        },
      ];

      const res = await api.runOptimization({
        strategy: strat,
        start_date: "2023-01-01",
        end_date: "2023-12-01",
        parameters: params,
        method: "grid",
        max_iterations: 16,
        metric_target: "sharpe_ratio",
      });
      setOptResult(res);
    } catch (err: any) {
      alert(`Optimization failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunWalkForward = async () => {
    const strat = strategies.find((s) => s.id === selectedStratId);
    if (!strat) return;

    setIsProcessing(true);
    try {
      const params: OptimizationParamRange[] = [
        {
          name: "period",
          target: "indicator",
          id: strat.indicators[0]?.id || "fast_ema",
          min_val: 10,
          max_val: 18,
          step: 4,
        },
      ];

      const res = await api.runWalkForward({
        strategy: strat,
        start_date: "2022-01-01",
        end_date: "2024-01-01",
        train_window_bars: 140,
        test_window_bars: 50,
        parameters: params,
        metric_target: "sharpe_ratio",
      });
      setWfResult(res);
    } catch (err: any) {
      alert(`Walk-forward failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-5 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
            Parameter Optimization & Walk-Forward Validation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate parameter stability surface and out-of-sample walk-forward degradation
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded border border-border bg-surface-muted p-0.5 text-xs">
          <button
            onClick={() => setActiveMode("grid")}
            className={`px-3 py-1 rounded transition-colors ${
              activeMode === "grid"
                ? "bg-surface text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Parameter Grid Search
          </button>
          <button
            onClick={() => setActiveMode("walk_forward")}
            className={`px-3 py-1 rounded transition-colors ${
              activeMode === "walk_forward"
                ? "bg-surface text-white font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Walk-Forward (WFO)
          </button>
        </div>
      </div>

      {/* Target Strategy Selector & Parameter Controls */}
      <div className="border border-border rounded bg-surface p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-sans">
              TARGET STRATEGY
            </label>
            <select
              value={selectedStratId}
              onChange={(e) => setSelectedStratId(e.target.value)}
              className="w-full rounded bg-surface-muted border border-border px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.asset})
                </option>
              ))}
            </select>
          </div>

          {activeMode === "grid" ? (
            <>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-sans">
                  PARAM 1: FAST PERIOD (MIN → MAX, STEP)
                </label>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    value={fastMin}
                    onChange={(e) => setFastMin(Number(e.target.value))}
                    className="w-full rounded bg-surface-muted border border-border px-2 py-1 text-center text-slate-200"
                  />
                  <span className="text-slate-500 self-center">→</span>
                  <input
                    type="number"
                    value={fastMax}
                    onChange={(e) => setFastMax(Number(e.target.value))}
                    className="w-full rounded bg-surface-muted border border-border px-2 py-1 text-center text-slate-200"
                  />
                  <input
                    type="number"
                    value={fastStep}
                    onChange={(e) => setFastStep(Number(e.target.value))}
                    className="w-16 rounded bg-surface-muted border border-border px-1 py-1 text-center text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-sans">
                  PARAM 2: SLOW PERIOD (MIN → MAX, STEP)
                </label>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    value={slowMin}
                    onChange={(e) => setSlowMin(Number(e.target.value))}
                    className="w-full rounded bg-surface-muted border border-border px-2 py-1 text-center text-slate-200"
                  />
                  <span className="text-slate-500 self-center">→</span>
                  <input
                    type="number"
                    value={slowMax}
                    onChange={(e) => setSlowMax(Number(e.target.value))}
                    className="w-full rounded bg-surface-muted border border-border px-2 py-1 text-center text-slate-200"
                  />
                  <input
                    type="number"
                    value={slowStep}
                    onChange={(e) => setSlowStep(Number(e.target.value))}
                    className="w-16 rounded bg-surface-muted border border-border px-1 py-1 text-center text-slate-100 font-semibold"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 flex items-center space-x-3 text-xs text-slate-400">
              <span className="rounded bg-surface-muted px-2.5 py-1 text-slate-200 border border-border">
                In-Sample Train: 140 bars (~7 mos)
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <span className="rounded bg-surface-muted px-2.5 py-1 text-slate-200 border border-border">
                Out-Of-Sample Test: 50 bars (~2.5 mos)
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={activeMode === "grid" ? handleRunOptimization : handleRunWalkForward}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 rounded bg-brand-blue hover:bg-sky-600 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${isProcessing ? "animate-spin" : ""}`} />
            <span>
              {isProcessing
                ? "Evaluating Model Space..."
                : activeMode === "grid"
                ? "Execute Grid Search"
                : "Run Walk-Forward Validation"}
            </span>
          </button>
        </div>
      </div>

      {/* Grid Mode Results */}
      {activeMode === "grid" && optResult && (
        <div className="space-y-4">
          {/* Overfitting Diagnostic Banner */}
          <div
            className={`border rounded p-3 text-xs flex items-start space-x-3 ${
              optResult.overfitting_warning
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {optResult.overfitting_warning ? (
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold block">
                {optResult.overfitting_warning
                  ? "Overfitting Vulnerability Detected"
                  : "Parameter Robustness Confirmed"}
              </span>
              <p className="mt-0.5 text-[11px] text-slate-300">
                {optResult.overfitting_notes}
              </p>
            </div>
          </div>

          {/* Optimal Parameters Ribbon */}
          <div className="border border-border rounded bg-surface p-3 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-500 block text-[10px]">OPTIMAL SHARPE</span>
                <span className="text-lg font-semibold text-slate-100">
                  {optResult.best_metrics.sharpe_ratio?.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">OPTIMAL CAGR</span>
                <span className="text-lg font-semibold text-market-up">
                  {formatPercent(optResult.best_metrics.cagr)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MAX DRAWDOWN</span>
                <span className="text-lg font-semibold text-market-down">
                  -{optResult.best_metrics.max_drawdown?.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">OPTIMAL PARAMS</span>
                <span className="text-xs text-slate-300 block mt-1">
                  {JSON.stringify(optResult.best_params)}
                </span>
              </div>
            </div>
          </div>

          {/* 2D Heatmap */}
          {optResult.heatmap_data && (
            <OptimizationHeatmap data={optResult.heatmap_data} />
          )}
        </div>
      )}

      {/* Walk Forward Mode Results */}
      {activeMode === "walk_forward" && wfResult && (
        <div className="space-y-4">
          {/* Stitched OOS Performance Metrics */}
          <div className="border border-border rounded bg-surface p-3 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-500 block text-[10px]">OOS STITCHED SHARPE</span>
                <span className="text-lg font-semibold text-slate-100">
                  {formatRatio(wfResult.stitched_metrics.sharpe_ratio)}
                </span>
                <span className="text-[10px] text-slate-500 block">Out-of-sample alpha</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">OOS CAGR</span>
                <span className="text-lg font-semibold text-market-up">
                  {formatPercent(wfResult.stitched_metrics.cagr)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">DEGRADATION %</span>
                <span
                  className={`text-lg font-semibold ${
                    wfResult.degradation_pct > 30 ? "text-market-down" : "text-slate-200"
                  }`}
                >
                  {wfResult.degradation_pct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 block">In-sample vs out-of-sample</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">ROLLING FOLDS</span>
                <span className="text-lg font-semibold text-slate-200">
                  {wfResult.folds?.length || 0} Periods
                </span>
              </div>
            </div>
          </div>

          {/* Stitched Equity Curve */}
          {wfResult.stitched_equity_curve && (
            <div className="border border-border rounded bg-surface p-4 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Stitched Out-Of-Sample Equity Curve
              </span>
              <div className="h-[300px]">
                <EquityCurveChart data={wfResult.stitched_equity_curve} benchmarkSymbol="SPY" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
