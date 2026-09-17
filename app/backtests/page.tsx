"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  ArrowRight,
  RefreshCw,
  Search,
  Trash2,
  Copy,
  ExternalLink,
  Sliders,
  Filter,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult, StrategyConfig } from "@/types";
import { formatCurrency, formatPercent, formatRatio } from "@/lib/formatters";
import { BENCHMARKS } from "@/lib/constants";
import { loadSystemSettings } from "@/lib/settings";
import TestStrategyModal from "@/components/strategies/TestStrategyModal";

function BacktestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runStrategyId = searchParams.get("run");

  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAsset, setFilterAsset] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Quick Run Form states
  const tickerParam = searchParams.get("ticker");
  const [selectedStratId, setSelectedStratId] = useState<string>(runStrategyId || "");
  const [targetAsset, setTargetAsset] = useState<string>(tickerParam || "");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [benchmark, setBenchmark] = useState(() => {
    if (typeof window !== "undefined") {
      const cfg = loadSystemSettings();
      return cfg.research.defaultBenchmark || "SPY";
    }
    return "SPY";
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [terminalTicker, setTerminalTicker] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_ticker");
      if (saved) setTerminalTicker(saved.toUpperCase());
    }
  }, []);

  const isTargetIndia = useMemo(() => {
    const a = (targetAsset || "").toUpperCase().trim();
    return (
      a.endsWith(".NS") ||
      a.endsWith(".BO") ||
      ["GENUSPOWER", "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "TATAMOTORS", "SBIN", "BHARTIARTL", "ITC", "WIPRO"].includes(a)
    );
  }, [targetAsset]);

  // Auto-switch benchmark when stock market changes
  useEffect(() => {
    if (isTargetIndia && benchmark === "SPY") {
      setBenchmark("^NSEI");
    } else if (!isTargetIndia && benchmark === "^NSEI") {
      setBenchmark("SPY");
    }
  }, [isTargetIndia, benchmark]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bts, strats] = await Promise.all([
        api.getBacktests(),
        api.getStrategies(),
      ]);
      setBacktests(bts.reverse());
      setStrategies(strats);
      if (!selectedStratId && strats.length > 0) {
        setSelectedStratId(strats[0].id);
        if (!targetAsset && !tickerParam) {
          setTargetAsset(strats[0].asset);
        }
      }
    } catch (err) {
      console.error("Failed to load backtests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (runStrategyId) {
      setSelectedStratId(runStrategyId);
    }
    if (tickerParam) {
      setTargetAsset(tickerParam.toUpperCase());
    }
  }, [runStrategyId, tickerParam]);

  const handleLaunchBacktest = async () => {
    if (!selectedStratId) return;
    const strat = strategies.find((s) => s.id === selectedStratId);
    if (!strat) return;

    const effectiveAsset = (targetAsset || strat.asset).trim().toUpperCase();
    const effectiveBenchmark = isTargetIndia && benchmark === "SPY" ? "^NSEI" : benchmark;

    setIsExecuting(true);
    try {
      const modifiedStrat: StrategyConfig = {
        ...strat,
        asset: effectiveAsset,
        universe: [effectiveAsset],
      };
      const res = await api.runBacktest(modifiedStrat, startDate, endDate, effectiveBenchmark);
      router.push(`/backtests/${res.id}`);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
      setIsExecuting(false);
    }
  };

  const handleDeleteBacktest = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(`Delete backtest simulation ${id}? This cannot be undone.`)) {
      try {
        await api.deleteBacktest(id);
        setBacktests(backtests.filter((b) => b.id !== id));
      } catch (err: any) {
        alert(`Failed to delete backtest: ${err.message}`);
      }
    }
  };

  // Distinct Assets for filtering
  const distinctAssets = useMemo(() => {
    const set = new Set<string>();
    backtests.forEach((b) => {
      const a = b.ticker || b.asset;
      if (a) set.add(a);
    });
    return Array.from(set).sort();
  }, [backtests]);

  // Filtered Backtests
  const filteredBacktests = useMemo(() => {
    return backtests.filter((b) => {
      const asset = b.ticker || b.asset || "";
      if (filterAsset !== "ALL" && asset !== filterAsset) return false;
      if (filterStatus !== "ALL" && b.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          b.id.toLowerCase().includes(q) ||
          b.strategy_name.toLowerCase().includes(q) ||
          asset.toLowerCase().includes(q) ||
          b.benchmark.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [backtests, filterAsset, filterStatus, searchQuery]);

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono text-xs select-none">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#252A31] bg-[#101318] p-3 rounded-[2px] gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-white tracking-wide uppercase">
              BACKTEST SIMULATION REGISTRY
            </span>
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#252A31] text-[#38BDF8] text-[10px]">
              {backtests.length} RUNS
            </span>
          </div>
          <p className="text-[11px] text-[#59616B] mt-0.5">
            Zero-lookahead event execution &bull; Strict t+1 fill modeling &bull; Empirical trade attribution
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] bg-[#141820] hover:bg-[#252A31] text-xs text-[#89919C] hover:text-[#D8DCE2] border border-[#252A31] transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#38BDF8]" : ""}`} />
          <span>REFRESH REGISTRY</span>
        </button>
      </div>

      {/* Execution Launcher Strip */}
      <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-[#252A31] pb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#89919C]">
            DISPATCH NEW STRATEGY SIMULATION
          </span>
          <span className="text-[10px] text-[#59616B]">LOOKAHEAD: ZERO BIAS (NEXT BAR OPEN FILLS)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end text-xs">
          <div className="lg:col-span-2">
            <label className="block text-[10px] text-[#59616B] uppercase mb-1">
              Select Strategy Model
            </label>
            <select
              value={selectedStratId}
              onChange={(e) => {
                setSelectedStratId(e.target.value);
                const s = strategies.find((item) => item.id === e.target.value);
                if (s && !targetAsset) {
                  setTargetAsset(s.asset);
                }
              }}
              className="w-full rounded-[2px] bg-[#0B0D10] border border-[#252A31] px-2.5 py-1.5 text-xs text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.strategy_type || "Trend"})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-[#59616B] uppercase">
                Target Stock
              </label>
              <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isTargetIndia ? "text-[#10B981] bg-[#10B981]/15" : "text-[#38BDF8] bg-[#38BDF8]/15"}`}>
                {isTargetIndia ? "🇮🇳 INDIA" : "🇺🇸 US"}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={targetAsset}
                placeholder="e.g. GENUSPOWER, RELIANCE, AAPL..."
                onChange={(e) => setTargetAsset(e.target.value.toUpperCase())}
                className="w-full rounded-[2px] bg-[#0B0D10] border border-[#252A31] px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[#59616B] uppercase mb-1">
              Benchmark
            </label>
            <select
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
              className="w-full rounded-[2px] bg-[#0B0D10] border border-[#252A31] px-2.5 py-1.5 text-xs text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
            >
              {BENCHMARKS.map((b) => (
                <option key={b.symbol} value={b.symbol}>
                  {b.symbol} ({b.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#59616B] uppercase mb-1">
              Date Window
            </label>
            <div className="flex items-center space-x-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 rounded-[2px] bg-[#0B0D10] border border-[#252A31] px-1.5 py-1.5 text-[10px] text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
                title="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 rounded-[2px] bg-[#0B0D10] border border-[#252A31] px-1.5 py-1.5 text-[10px] text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
                title="End Date"
              />
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleLaunchBacktest}
              disabled={isExecuting || !selectedStratId}
              className="flex-1 flex items-center justify-center space-x-1.5 rounded-[2px] bg-[#38BDF8] hover:bg-sky-500 px-3 py-1.5 text-xs font-bold text-[#0B0D10] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isExecuting ? "SIMULATING..." : `RUN ON ${targetAsset || "STOCK"}`}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="px-2 py-1.5 rounded-[2px] border border-[#252A31] bg-[#141820] text-[#D8DCE2] hover:text-white hover:border-[#10B981] transition-colors cursor-pointer text-xs"
              title="Open Easy Stock Testing Modal"
            >
              ⚡ Modal
            </button>
          </div>
        </div>

        {/* Quick Stock Suggestions Bar */}
        <div className="pt-1.5 border-t border-[#1C222C] flex flex-wrap items-center justify-between text-[10px] gap-2">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[#59616B] font-mono">Quick Stocks:</span>
            {terminalTicker && (
              <button
                type="button"
                onClick={() => setTargetAsset(terminalTicker)}
                className={`px-1.5 py-0.5 rounded-[2px] border text-[9px] font-mono font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                  targetAsset === terminalTicker
                    ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]"
                    : "bg-[#141820] border-[#F59E0B]/50 text-[#F59E0B] hover:bg-[#F59E0B]/10"
                }`}
              >
                <span>⚡ Active: {terminalTicker}</span>
              </button>
            )}
            <span className="text-[#89919C] font-semibold">🇮🇳 India:</span>
            {["GENUSPOWER", "BHARTIARTL", "RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "SBIN"].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setTargetAsset(sym)}
                className={`px-1.5 py-0.5 rounded-[2px] border text-[9px] font-mono transition-colors cursor-pointer ${
                  targetAsset === sym
                    ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold"
                    : "bg-[#0B0D10] border-[#252A31] text-[#89919C] hover:text-white"
                }`}
              >
                {sym}
              </button>
            ))}
            <span className="text-[#59616B] mx-1">|</span>
            <span className="text-[#89919C] font-semibold">🇺🇸 US:</span>
            {["AAPL", "NVDA", "TSLA", "MSFT", "SPY", "QQQ"].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setTargetAsset(sym)}
                className={`px-1.5 py-0.5 rounded-[2px] border text-[9px] font-mono transition-colors cursor-pointer ${
                  targetAsset === sym
                    ? "bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8] font-bold"
                    : "bg-[#0B0D10] border-[#252A31] text-[#89919C] hover:text-white"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="text-[#38BDF8] hover:text-[#7DD3FC] underline font-mono text-[10px] flex items-center space-x-1 cursor-pointer"
          >
            <span>Browse Full Stock Universe (18,500+) →</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-[#252A31] bg-[#101318] p-2.5 rounded-[2px]">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-[#59616B]" />
          <input
            type="text"
            placeholder="Filter by strategy, run id, asset, or benchmark... (/)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[#D8DCE2] placeholder-[#59616B] text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <div className="flex items-center space-x-1">
            <span className="text-[#59616B]">ASSET:</span>
            <select
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value)}
              className="bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2 py-1 text-[#D8DCE2] focus:outline-none"
            >
              <option value="ALL">All Assets</option>
              {distinctAssets.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-[#59616B]">STATUS:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2 py-1 text-[#D8DCE2] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historical Backtests Execution Table */}
      <div className="border border-[#252A31] bg-[#101318] rounded-[2px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#252A31] bg-[#0B0D10] text-[10px] text-[#89919C] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">RUN ID</th>
                <th className="py-2.5 px-3">STRATEGY</th>
                <th className="py-2.5 px-3">ASSET</th>
                <th className="py-2.5 px-3">PERIOD</th>
                <th className="py-2.5 px-3">BENCHMARK</th>
                <th className="py-2.5 px-3 text-right">RETURN</th>
                <th className="py-2.5 px-3 text-right">CAGR</th>
                <th className="py-2.5 px-3 text-right">SHARPE</th>
                <th className="py-2.5 px-3 text-right">MAX DD</th>
                <th className="py-2.5 px-3 text-right">TRADES</th>
                <th className="py-2.5 px-3 text-center">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252A31]/50">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-[#59616B]">
                    Loading simulation history from quantitative repository...
                  </td>
                </tr>
              ) : filteredBacktests.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-[#59616B]">
                    NO BACKTESTS FOUND: Launch a strategy simulation above to generate empirical results.
                  </td>
                </tr>
              ) : (
                filteredBacktests.map((bt) => {
                  const m = bt.metrics;
                  const isUp = (m?.total_return || 0) >= 0;

                  return (
                    <tr
                      key={bt.id}
                      onClick={() => router.push(`/backtests/${bt.id}`)}
                      className="hover:bg-[#141820]/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 text-[#59616B] font-semibold group-hover:text-[#38BDF8]">
                        {bt.id}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#D8DCE2] group-hover:text-white">
                        {bt.strategy_name}
                      </td>
                      <td className="py-2.5 px-3 text-[#D8DCE2]">
                        {bt.ticker || bt.asset}
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-[#89919C]">
                        {bt.start_date} &rarr; {bt.end_date}
                      </td>
                      <td className="py-2.5 px-3 text-[#89919C]">
                        {bt.benchmark}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                        <span className={isUp ? "text-[#10B981]" : "text-[#EF4444]"}>
                          {m ? formatPercent(m.total_return) : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#D8DCE2] tabular-nums">
                        {m ? formatPercent(m.cagr) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums">
                        {m ? formatRatio(m.sharpe_ratio) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#EF4444] tabular-nums font-semibold">
                        {m ? `-${m.max_drawdown.toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#38BDF8] tabular-nums">
                        {m ? m.num_trades : bt.trades.length}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold ${
                            bt.status === "COMPLETED"
                              ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                              : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                          }`}
                        >
                          {bt.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => handleDeleteBacktest(e, bt.id)}
                            className="p-1 rounded-[2px] text-[#59616B] hover:text-[#EF4444] hover:bg-[#252A31] transition-colors"
                            title="Delete Backtest"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[#38BDF8] flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                            <span>OPEN</span>
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Strategy Modal */}
      <TestStrategyModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        strategy={strategies.find((s) => s.id === selectedStratId) || (strategies.length > 0 ? strategies[0] : null)}
        initialStock={targetAsset}
      />
    </div>
  );
}

export default function BacktestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#89919C] font-mono">Loading Backtest Registry...</div>}>
      <BacktestsContent />
    </Suspense>
  );
}
