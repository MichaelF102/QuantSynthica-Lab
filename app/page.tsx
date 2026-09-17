"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  LineChart,
  Code2,
  Play,
  ArrowRight,
  GitCompare,
  Plus,
  Sliders,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import { StrategyConfig, BacktestResult } from "@/types";
import { formatCurrency, formatPercent, formatRatio } from "@/lib/formatters";
import EquityCurveChart from "@/components/charts/EquityCurveChart";

// Core market snapshot securities
const CORE_MARKET_TAPE = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF", market: "US", price: 588.45, change: 0.42 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", market: "US", price: 509.12, change: 0.85 },
  { symbol: "NVDA", name: "NVIDIA Corporation", market: "US", price: 138.25, change: 2.15 },
  { symbol: "AAPL", name: "Apple Inc.", market: "US", price: 232.10, change: -0.34 },
  { symbol: "RELIANCE", name: "Reliance Industries", market: "India", price: 1290.90, change: -2.13 },
  { symbol: "TCS", name: "Tata Consultancy Services", market: "India", price: 3840.00, change: 0.65 },
];

export default function WorkspaceHome() {
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [activeBt, setActiveBt] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadWorkspace = async () => {
      try {
        const [strats, bts] = await Promise.all([
          api.getStrategies(),
          api.getBacktests(),
        ]);
        if (!isMounted) return;
        setStrategies(strats);
        setBacktests(bts);

        if (bts.length > 0) {
          setActiveBt(bts[0]);
        } else if (strats.length > 0) {
          try {
            const bt = await api.runBacktest(
              strats[1] || strats[0],
              "2022-01-01",
              "2024-01-01",
              "SPY"
            );
            if (isMounted) {
              setActiveBt(bt);
              setBacktests([bt]);
            }
          } catch (e) {
            console.error("Initial simulation run error:", e);
          }
        }
      } catch (err) {
        console.error("Workspace data loading error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadWorkspace();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-5 space-y-6 max-w-[1600px] mx-auto">
      {/* Workspace Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
            Quantitative Research Workstation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            18,547 equities across US and India markets &bull; Zero look-ahead simulation engine
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center space-x-2">
          <Link
            href="/research"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-surface-muted hover:bg-surface-hover text-xs font-medium text-slate-200 border border-border transition-colors"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search Security</span>
          </Link>
          <Link
            href="/strategies/builder"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-brand-blue hover:bg-sky-600 text-xs font-medium text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Strategy</span>
          </Link>
          <Link
            href="/pairs"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-surface-muted hover:bg-surface-hover text-xs font-medium text-slate-200 border border-border transition-colors"
          >
            <GitCompare className="h-3.5 w-3.5 text-slate-400" />
            <span>Pairs Lab</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: MARKET OVERVIEW TAPE */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Market Overview
          </span>
          <Link
            href="/research"
            className="text-xs text-brand-cyan hover:underline flex items-center space-x-1"
          >
            <span>Full Research Terminal</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CORE_MARKET_TAPE.map((item) => {
            const isUp = item.change >= 0;
            return (
              <Link
                key={item.symbol}
                href={`/research?ticker=${item.symbol}`}
                className="p-2.5 bg-surface hover:bg-surface-hover border border-border rounded transition-colors block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-200">
                    {item.symbol}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {item.market}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {item.name}
                </div>
                <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-border/50">
                  <span className="font-mono text-xs text-slate-100 tabular-nums">
                    {item.price.toFixed(2)}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-medium tabular-nums ${
                      isUp ? "text-market-up" : "text-market-down"
                    }`}
                  >
                    {isUp ? "+" : ""}
                    {item.change.toFixed(2)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: WORKSPACE DUAL COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Strategy Activity & Benchmark Equity Curve */}
        <div className="lg:col-span-8 space-y-6">
          {/* Strategy Activity Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Strategy Activity
              </span>
              <Link
                href="/strategies"
                className="text-xs text-brand-cyan hover:underline flex items-center space-x-1"
              >
                <span>View All ({strategies.length})</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="border border-border rounded overflow-x-auto bg-surface">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50 text-[11px] text-slate-400 font-medium">
                    <th className="py-2 px-3">Strategy</th>
                    <th className="py-2 px-3">Asset</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Entry Rule</th>
                    <th className="py-2 px-3">Exit Rule</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {strategies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Sliders className="h-6 w-6 text-brand-cyan/60" />
                          <p className="text-slate-200 font-medium text-xs">
                            You haven&apos;t created a strategy yet — start with a quantitative template.
                          </p>
                          <p className="text-slate-500 text-[11px] max-w-md">
                            Formulate quantitative entry/exit signals, specify indicators, or clone institutional momentum models.
                          </p>
                          <div className="flex items-center space-x-2 pt-2">
                            <Link
                              href="/strategies/builder"
                              className="px-3 py-1.5 bg-brand-cyan text-background font-semibold rounded text-xs hover:bg-brand-cyan/90 transition-colors"
                            >
                              New Strategy Builder
                            </Link>
                            <Link
                              href="/strategies"
                              className="px-3 py-1.5 bg-surface-muted text-slate-300 rounded text-xs hover:text-white border border-border transition-colors"
                            >
                              Browse 6 Templates
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    strategies.slice(0, 6).map((strat) => {
                      const entryRule = strat.entry_rules[0]
                        ? `${strat.entry_rules[0].left_indicator} ${strat.entry_rules[0].operator} ${
                            strat.entry_rules[0].right_indicator ||
                            strat.entry_rules[0].threshold
                          }`
                        : "—";
                      const exitRule = strat.exit_rules[0]
                        ? `${strat.exit_rules[0].left_indicator} ${strat.exit_rules[0].operator} ${
                            strat.exit_rules[0].right_indicator ||
                            strat.exit_rules[0].threshold
                          }`
                        : "—";

                      return (
                        <tr
                          key={strat.id}
                          className="hover:bg-surface-hover/70 transition-colors cursor-pointer group"
                          onClick={() => {
                            window.location.href = `/strategies/${strat.id}`;
                          }}
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-200 group-hover:text-brand-cyan transition-colors">
                              {strat.name}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {strat.asset}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 capitalize">
                            {(strat.strategy_type || "quantitative").replace(/_/g, " ")}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                            {entryRule}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                            {exitRule}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-surface-muted text-slate-300">
                              Ready
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Strategy Simulation Preview */}
          {activeBt && activeBt.equity_curve && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Simulation Equity Curve: {activeBt.strategy_name}
                  </span>
                  <span className="text-xs text-slate-500 ml-2 font-mono">
                    ({activeBt.asset} &bull; {activeBt.start_date} to {activeBt.end_date})
                  </span>
                </div>
                <Link
                  href={`/backtests/${activeBt.id}`}
                  className="text-xs text-brand-cyan hover:underline flex items-center space-x-1"
                >
                  <span>Detailed Tearsheet</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="border border-border rounded bg-surface p-4">
                {/* Compact KPI Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pb-3 mb-3 border-b border-border/60 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-500">Total Return</div>
                    <div
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        (activeBt.metrics?.total_return || 0) >= 0
                          ? "text-market-up"
                          : "text-market-down"
                      }`}
                    >
                      {formatPercent(activeBt.metrics?.total_return)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">CAGR</div>
                    <div className="font-mono text-sm font-semibold text-slate-200 tabular-nums">
                      {formatPercent(activeBt.metrics?.cagr)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Sharpe Ratio</div>
                    <div className="font-mono text-sm font-semibold text-slate-200 tabular-nums">
                      {formatRatio(activeBt.metrics?.sharpe_ratio)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Max Drawdown</div>
                    <div className="font-mono text-sm font-semibold text-market-down tabular-nums">
                      {formatPercent(activeBt.metrics?.max_drawdown)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Win Rate</div>
                    <div className="font-mono text-sm font-semibold text-slate-200 tabular-nums">
                      {formatPercent(activeBt.metrics?.win_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Trades</div>
                    <div className="font-mono text-sm font-semibold text-slate-200 tabular-nums">
                      {activeBt.metrics?.total_trades || 0}
                    </div>
                  </div>
                </div>

                <div className="h-[280px]">
                  <EquityCurveChart
                    data={activeBt.equity_curve}
                    benchmarkSymbol={activeBt.benchmark}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Research & Recent Backtests */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Research Watchlist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Security Universe
              </span>
              <Link
                href="/research"
                className="text-xs text-brand-cyan hover:underline"
              >
                Explore 18.5k
              </Link>
            </div>

            <div className="border border-border rounded bg-surface divide-y divide-border/60">
              {[
                { sym: "RELIANCE", name: "Reliance Industries", ex: "NSE", country: "India" },
                { sym: "TCS", name: "Tata Consultancy", ex: "NSE", country: "India" },
                { sym: "INFY", name: "Infosys Limited", ex: "NSE", country: "India" },
                { sym: "NVDA", name: "NVIDIA Corporation", ex: "NASDAQ", country: "US" },
                { sym: "AAPL", name: "Apple Inc.", ex: "NASDAQ", country: "US" },
                { sym: "MSFT", name: "Microsoft Corporation", ex: "NASDAQ", country: "US" },
              ].map((stock) => (
                <Link
                  key={stock.sym}
                  href={`/research?ticker=${stock.sym}`}
                  className="flex items-center justify-between p-2.5 hover:bg-surface-hover transition-colors text-xs"
                >
                  <div>
                    <div className="font-mono font-semibold text-slate-200">
                      {stock.sym}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                      {stock.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-slate-400 bg-surface-muted px-1.5 py-0.5 rounded">
                      {stock.ex} &bull; {stock.country}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Backtests Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recent Backtests
              </span>
              <Link
                href="/backtests"
                className="text-xs text-brand-cyan hover:underline flex items-center space-x-1"
              >
                <span>All Backtests</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="border border-border rounded bg-surface divide-y divide-border/60">
              {backtests.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <Play className="h-6 w-6 text-brand-cyan/40 mx-auto" />
                  <p className="text-xs text-slate-200 font-medium">
                    No backtest executions yet.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Test your algorithms with zero lookahead bias and realistic commission modeling.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/backtests"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 text-xs font-semibold rounded transition-colors"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Launch First Simulation</span>
                    </Link>
                  </div>
                </div>
              ) : (
                backtests.slice(0, 5).map((bt) => (
                  <Link
                    key={bt.id}
                    href={`/backtests/${bt.id}`}
                    className="p-2.5 hover:bg-surface-hover transition-colors block text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200 truncate max-w-[180px]">
                        {bt.strategy_name}
                      </span>
                      <span
                        className={`font-mono font-semibold tabular-nums text-xs ${
                          (bt.metrics?.total_return || 0) >= 0
                            ? "text-market-up"
                            : "text-market-down"
                        }`}
                      >
                        {formatPercent(bt.metrics?.total_return)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="font-mono">{bt.asset}</span>
                      <span className="font-mono">
                        Sharpe: {formatRatio(bt.metrics?.sharpe_ratio)} &bull; MaxDD:{" "}
                        {formatPercent(bt.metrics?.max_drawdown)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quantitative Execution Constraints */}
          <div className="border border-border rounded bg-surface p-3 text-xs space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Engine Parameters
            </span>
            <div className="space-y-1 text-slate-300 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Fill Timing:</span>
                <span>t+1 Open (No lookahead)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stop/Limit Execution:</span>
                <span>Intra-bar High/Low</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Default Commission:</span>
                <span>0.05% per trade</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Default Slippage:</span>
                <span>0.05% linear</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
