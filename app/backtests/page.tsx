"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  ArrowRight,
  RefreshCw,
  Search,
  Trash2,
  Zap,
  History,
  FlaskConical,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult, StrategyConfig } from "@/types";
import { SEED_STRATEGIES } from "@/lib/seedData";
import { fmtPct, fmtInt, isNum, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { BENCHMARKS } from "@/lib/constants";
import { loadSystemSettings } from "@/lib/settings";
import { alignBenchmark, isIndianTicker, marketOfTicker } from "@/lib/market";
import { Card, CardSkeleton, EmptyState } from "@/components/ui/Card";
import TestStrategyModal from "@/components/strategies/TestStrategyModal";

const INDIA_QUICK = ["GENUSPOWER", "BHARTIARTL", "RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "SBIN"];
const US_QUICK = ["AAPL", "NVDA", "TSLA", "MSFT", "SPY", "QQQ"];

const INPUT =
  "w-full rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2.5 py-1.5 text-xs text-slate-100 outline-none transition-colors hover:border-slate-600 focus:border-blue-500";
const LABEL = "mb-1 block text-[10px] uppercase tracking-wider text-slate-400";

const RUN_STEPS = ["Loading price history", "Evaluating entry / exit rules", "Simulating fills at next open", "Computing risk & attribution"];

function BacktestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runStrategyId = searchParams.get("strategy") || searchParams.get("run");
  const tickerParam = searchParams.get("ticker")?.toUpperCase() || null;
  const autolaunch = searchParams.get("autolaunch") === "true";
  const benchmarkParam = searchParams.get("benchmark");
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [strategies, setStrategies] = useState<StrategyConfig[]>(() => SEED_STRATEGIES);
  const [loading, setLoading] = useState(true);
  const [loadNotice, setLoadNotice] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAsset, setFilterAsset] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const initialStrat = runStrategyId ? SEED_STRATEGIES.find((s) => s.id === runStrategyId) : undefined;
  const [selectedStratId, setSelectedStratId] = useState<string>(runStrategyId || SEED_STRATEGIES[0]?.id || "");
  const [targetAsset, setTargetAsset] = useState<string>(tickerParam || initialStrat?.asset || SEED_STRATEGIES[0]?.asset || "AAPL");
  const [startDate, setStartDate] = useState(startParam || "2023-01-01");
  const [endDate, setEndDate] = useState(endParam || "2024-01-01");
  // Benchmark is derived from the asset's market on first render, so a stale/foreign default never flashes.
  const [benchmark, setBenchmark] = useState(() => {
    const settingsBench = typeof window !== "undefined" ? loadSystemSettings().research.defaultBenchmark : null;
    return alignBenchmark(tickerParam || initialStrat?.asset || "AAPL", benchmarkParam || settingsBench);
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [runStep, setRunStep] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [terminalTicker, setTerminalTicker] = useState<string | null>(null);
  const launched = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("algolab_active_ticker");
    if (saved) setTerminalTicker(saved.toUpperCase());
  }, []);

  const isTargetIndia = useMemo(() => isIndianTicker(targetAsset), [targetAsset]);

  // Prevent cross-market mismatches whenever the asset changes (form edits, quick picks, query params).
  useEffect(() => {
    setBenchmark((b) => alignBenchmark(targetAsset, b));
  }, [targetAsset]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadNotice(null);
    try {
      const [bts, strats] = await Promise.all([api.getBacktests(), api.getStrategies()]);
      setBacktests([...(bts ?? [])].reverse());
      if (strats?.length) setStrategies(strats);
      const health = await api.getHealth();
      if (health.status === "offline") {
        setLoadNotice("Backtest engine offline: runs execute in a local simulator on seeded prices and are marked SIMULATED.");
      }
    } catch (err) {
      console.warn("Backtests registry load notice:", err);
      setLoadNotice("Backtest engine unreachable — showing saved runs only.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (runStrategyId) setSelectedStratId(runStrategyId);
    if (tickerParam) setTargetAsset(tickerParam);
  }, [runStrategyId, tickerParam]);

  const handleLaunchBacktest = useCallback(async () => {
    const strat = strategies.find((s) => s.id === selectedStratId);
    if (!strat) return;
    const effectiveAsset = (targetAsset || strat.asset).trim().toUpperCase();
    const effectiveBenchmark = alignBenchmark(effectiveAsset, benchmark);
    const india = isIndianTicker(effectiveAsset);

    setRunError(null);
    setRunStep(0);
    setIsExecuting(true);
    const ticker = setInterval(() => setRunStep((s) => Math.min(s + 1, RUN_STEPS.length - 1)), 700);
    try {
      const modified: StrategyConfig = {
        ...strat,
        asset: effectiveAsset,
        universe: [effectiveAsset],
        execution: { ...strat.execution, initial_capital: india ? Math.max(strat.execution.initial_capital, 1000000) : strat.execution.initial_capital },
      };
      const res = await api.runBacktest(modified, startDate, endDate, effectiveBenchmark);
      router.push(`/backtests/${res.id}`);
    } catch (err: any) {
      setRunError(err?.message || "Simulation failed");
      setIsExecuting(false);
    } finally {
      clearInterval(ticker);
    }
  }, [strategies, selectedStratId, targetAsset, benchmark, startDate, endDate, router]);

  // ?autolaunch=true — run once, as soon as the referenced strategy is known.
  useEffect(() => {
    if (!autolaunch || launched.current || loading) return;
    if (!strategies.some((s) => s.id === selectedStratId)) return;
    launched.current = true;
    handleLaunchBacktest();
  }, [autolaunch, loading, strategies, selectedStratId, handleLaunchBacktest]);

  const handleDeleteBacktest = async (e: React.MouseEvent, bt: BacktestResult) => {
    e.stopPropagation();
    if (bt.is_sample) return;
    if (confirm(`Delete backtest simulation ${bt.id}? This cannot be undone.`)) {
      try {
        await api.deleteBacktest(bt.id);
        setBacktests((prev) => prev.filter((b) => b.id !== bt.id));
      } catch (err: any) {
        setRunError(`Failed to delete backtest: ${err.message}`);
      }
    }
  };

  const distinctAssets = useMemo(() => {
    const set = new Set<string>();
    backtests.forEach((b) => {
      const a = b.ticker || b.asset;
      if (a) set.add(a);
    });
    return Array.from(set).sort();
  }, [backtests]);

  const filteredBacktests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return backtests.filter((b) => {
      const asset = b.ticker || b.asset || "";
      if (filterAsset !== "ALL" && asset !== filterAsset) return false;
      if (filterStatus !== "ALL" && b.status !== filterStatus) return false;
      if (!q) return true;
      return [b.id, b.strategy_name, asset, b.benchmark].some((v) => v.toLowerCase().includes(q));
    });
  }, [backtests, filterAsset, filterStatus, searchQuery]);

  const onlySamples = backtests.length > 0 && backtests.every((b) => b.is_sample);
  const quickChip = (sym: string, india: boolean) => (
    <button
      key={sym}
      type="button"
      onClick={() => setTargetAsset(sym)}
      className={cn(
        "rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
        targetAsset === sym
          ? india
            ? "border-emerald-500/40 bg-emerald-500/15 font-bold text-emerald-400"
            : "border-blue-500/40 bg-blue-500/15 font-bold text-blue-400"
          : "border-slate-800 bg-[#080d1a] text-slate-400 hover:text-white"
      )}
    >
      {sym}
    </button>
  );

  return (
    <main className="app-container min-h-screen animate-fade-up space-y-6 py-6 font-sans text-xs">
      {/* Page header */}
      <header className="relative flex flex-col justify-between gap-3 border-b border-slate-800/60 pb-5 sm:flex-row sm:items-end">
        <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            Backtest{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Registry
            </span>
          </h1>
          <p className="mt-1 text-xs text-secondary">
            <span className="font-mono">{fmtInt(backtests.length)}</span> run{backtests.length === 1 ? "" : "s"} · signals at close, fills at next open
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </header>

      {loadNotice && (
        <div role="status" className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <span>{loadNotice}</span>
          <button onClick={loadData} className="font-medium text-amber-200 hover:text-white">Retry</button>
        </div>
      )}
      {runError && (
        <div role="alert" className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <span>{runError}</span>
          <button onClick={() => setRunError(null)} className="font-medium text-rose-200 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Quick simulation control strip */}
      <Card
        title="New simulation"
        subtitle="Pick a strategy and a security; the benchmark follows the market"
        info="Runs the selected strategy on the chosen security. Signals are generated at bar close and filled at the next open, with commission, slippage and spread applied."
        icon={FlaskConical}
        tone="blue"
        action={<span className="font-mono text-[10px] text-slate-500">Fills at next open</span>}
      >
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className={LABEL}>Strategy model</label>
            <select
              value={selectedStratId}
              onChange={(e) => {
                setSelectedStratId(e.target.value);
                const s = strategies.find((item) => item.id === e.target.value);
                if (s && !targetAsset) setTargetAsset(s.asset);
              }}
              className={INPUT}
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.strategy_type || "trend"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider text-slate-400">Target stock</label>
              <span
                className={cn(
                  "rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-bold",
                  isTargetIndia ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                )}
              >
                {isTargetIndia ? "🇮🇳 INDIA" : "🇺🇸 US"}
              </span>
            </div>
            <input
              type="text"
              value={targetAsset}
              placeholder="GENUSPOWER, RELIANCE, AAPL…"
              onChange={(e) => setTargetAsset(e.target.value.toUpperCase())}
              className={cn(INPUT, "font-mono font-bold text-white")}
            />
          </div>

          <div>
            <label className={LABEL}>Benchmark</label>
            <select value={benchmark} onChange={(e) => setBenchmark(e.target.value)} className={INPUT}>
              {BENCHMARKS.filter((b) => b.region === marketOfTicker(targetAsset)).map((b) => (
                <option key={b.symbol} value={b.symbol}>
                  {b.symbol} ({b.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL}>Date window</label>
            <div className="flex items-center gap-1">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(INPUT, "px-1.5 font-mono text-[10px]")} title="Start date" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={cn(INPUT, "px-1.5 font-mono text-[10px]")} title="End date" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLaunchBacktest}
              disabled={isExecuting || !selectedStratId}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {isExecuting ? "Running…" : `Run ${targetAsset || "symbol"}`}
            </button>
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-2 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              title="Open guided stock testing"
            >
              <Zap className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-3 text-[10px]">
          <span className="font-mono uppercase tracking-wider text-slate-400">Quick</span>
          {terminalTicker && (
            <button
              type="button"
              onClick={() => setTargetAsset(terminalTicker)}
              className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono font-bold text-amber-400 hover:bg-amber-500/20"
            >
              ⚡ {terminalTicker}
            </button>
          )}
          <span className="text-slate-500">🇮🇳</span>
          {INDIA_QUICK.map((s) => quickChip(s, true))}
          <span className="mx-1 text-slate-700">|</span>
          <span className="text-slate-500">🇺🇸</span>
          {US_QUICK.map((s) => quickChip(s, false))}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-2.5">
        <div className="flex max-w-md flex-1 items-center rounded-lg border border-slate-700/50 bg-[#0F172A]/70 focus-within:border-blue-500">
          <Search className="ml-3 mr-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by strategy, run id, asset or benchmark"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent py-1.5 pr-3 text-xs text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <label className="flex items-center gap-1.5">
            Asset
            <select value={filterAsset} onChange={(e) => setFilterAsset(e.target.value)} className="rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2 py-1 text-slate-200 outline-none focus:border-blue-500">
              <option value="ALL">All</option>
              {distinctAssets.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Status
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2 py-1 text-slate-200 outline-none focus:border-blue-500">
              <option value="ALL">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </label>
        </div>
      </div>

      {onlySamples && (
        <div role="note" className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
          <span className="font-mono font-bold uppercase tracking-wider">Sample</span>
          <span>These runs use seeded, illustrative prices so the registry is never empty. Run a backtest above to create real results.</span>
        </div>
      )}

      {/* Registry table */}
      {loading && backtests.length === 0 ? (
        <CardSkeleton rows={5} />
      ) : filteredBacktests.length === 0 ? (
        <EmptyState icon={History} title="No backtest runs found" hint="Adjust the filters, or select a strategy and security above and click Run." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b1222]/95 shadow-lg shadow-black/20">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#080d1a]/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2.5">Run</th>
                  <th className="px-3 py-2.5">Strategy</th>
                  <th className="px-3 py-2.5">Asset</th>
                  <th className="px-3 py-2.5">Period</th>
                  <th className="px-3 py-2.5">Benchmark</th>
                  <th className="px-3 py-2.5 text-right">Return</th>
                  <th className="px-3 py-2.5 text-right">CAGR</th>
                  <th className="px-3 py-2.5 text-right">Sharpe</th>
                  <th className="px-3 py-2.5 text-right">Max DD</th>
                  <th className="px-3 py-2.5 text-right">Trades</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredBacktests.map((bt) => {
                  const m = bt.metrics;
                  const ret = m?.total_return;
                  return (
                    <tr key={bt.id} onClick={() => router.push(`/backtests/${bt.id}`)} className="group cursor-pointer transition-colors hover:bg-slate-800/30">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400 group-hover:text-blue-400">{bt.id}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-200 group-hover:text-white">
                        <div className="flex items-center gap-1.5">
                          {bt.strategy_name}
                          {bt.is_sample ? (
                            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-400">SAMPLE</span>
                          ) : bt.is_synthetic ? (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400" title="Computed on locally generated prices, not real market data">SIMULATED</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-slate-200">{bt.ticker || bt.asset}</td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{bt.start_date} → {bt.end_date}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">{bt.benchmark}</td>
                      <td className={cn("px-3 py-2.5 text-right font-mono font-bold", !isNum(ret) ? "text-slate-500" : ret >= 0 ? "text-emerald-400" : "text-rose-400")}>{fmtPct(ret)}</td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", !isNum(m?.cagr) ? "text-slate-500" : m!.cagr >= 0 ? "text-emerald-400" : "text-rose-400")}>{fmtPct(m?.cagr)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-white">{m ? formatRatio(m.sharpe_ratio) : "—"}</td>
                      <td className={cn("px-3 py-2.5 text-right font-mono font-semibold", isNum(m?.max_drawdown) ? "text-rose-400" : "text-slate-500")}>{isNum(m?.max_drawdown) ? fmtPct(-Math.abs(m!.max_drawdown), 1) : "—"}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-blue-400">{fmtInt(m ? m.num_trades : bt.trades.length)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold", bt.status === "COMPLETED" ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "border-rose-500/40 bg-rose-500/15 text-rose-400")}>
                          {bt.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!bt.is_sample && (
                            <button onClick={(e) => handleDeleteBacktest(e, bt)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-rose-400" title="Delete backtest">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <span className="flex items-center gap-0.5 text-[11px] font-medium text-blue-400">
                            Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Execution progress overlay */}
      {isExecuting && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[70] flex items-center justify-center bg-[#080d1a]/80 backdrop-blur-sm">
          <div className="w-80 space-y-4 rounded-xl border border-slate-800/90 bg-[#0b1222] p-5 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <h3 className="text-sm font-bold text-white">Running {targetAsset}</h3>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${((runStep + 1) / RUN_STEPS.length) * 100}%` }} />
            </div>
            <ul className="space-y-1.5">
              {RUN_STEPS.map((label, i) => (
                <li key={label} className={cn("flex items-center gap-2 text-[11px]", i <= runStep ? "text-slate-200" : "text-slate-600")}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", i < runStep ? "bg-emerald-400" : i === runStep ? "animate-pulse bg-blue-400" : "bg-slate-700")} />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <TestStrategyModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        strategy={strategies.find((s) => s.id === selectedStratId) || strategies[0] || null}
        initialStock={targetAsset}
      />
    </main>
  );
}

export default function BacktestsPage() {
  return (
    <Suspense
      fallback={
        <main className="app-container space-y-4 py-6">
          <CardSkeleton rows={2} className="h-28" />
          <CardSkeleton rows={5} />
        </main>
      }
    >
      <BacktestsContent />
    </Suspense>
  );
}
