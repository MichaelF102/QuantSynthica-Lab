"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  TrendingDown,
  Activity,
  PieChart,
} from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult } from "@/types";
import { formatPercent, formatRatio, formatCurrency } from "@/lib/formatters";
import ReturnDistributionChart from "@/components/charts/ReturnDistributionChart";
import UnderwaterDrawdownChart from "@/components/charts/UnderwaterDrawdownChart";

export default function RiskPortfolioPage() {
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [selectedBtId, setSelectedBtId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Portfolio construction weights state
  const [constructionMethod, setConstructionMethod] = useState<
    "equal" | "inv_vol" | "risk_parity"
  >("equal");

  useEffect(() => {
    api.getBacktests().then((bts) => {
      setBacktests(bts);
      if (bts.length > 0) {
        setSelectedBtId(bts[0].id);
      }
      setLoading(false);
    }).catch(console.error);
  }, []);

  const activeBt = backtests.find((b) => b.id === selectedBtId);
  const m = activeBt?.metrics;
  const r = activeBt?.risk;

  // Multi-asset universe weights calculator
  const mockUniverse = ["AAPL", "MSFT", "NVDA", "SPY", "TLT"];
  const assetVols: Record<string, number> = {
    AAPL: 24.5,
    MSFT: 21.2,
    NVDA: 42.0,
    SPY: 14.8,
    TLT: 16.5,
  };

  const portfolioWeights = React.useMemo(() => {
    if (constructionMethod === "equal") {
      const w = 100 / mockUniverse.length;
      return mockUniverse.map((asset) => ({ asset, weight: w, vol: assetVols[asset] }));
    } else if (constructionMethod === "inv_vol") {
      const invs = mockUniverse.map((a) => 1 / assetVols[a]);
      const sumInv = invs.reduce((a, b) => a + b, 0);
      return mockUniverse.map((asset, idx) => ({
        asset,
        weight: (invs[idx] / sumInv) * 100,
        vol: assetVols[asset],
      }));
    } else {
      // Risk parity approximation
      const invs = mockUniverse.map((a) => 1 / (assetVols[a] ** 1.5));
      const sumInv = invs.reduce((a, b) => a + b, 0);
      return mockUniverse.map((asset, idx) => ({
        asset,
        weight: (invs[idx] / sumInv) * 100,
        vol: assetVols[asset],
      }));
    }
  }, [constructionMethod]);

  return (
    <div className="p-5 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
            Portfolio & Tail Risk Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Value at Risk (VaR), Expected Shortfall (CVaR), and quantitative portfolio allocation
          </p>
        </div>

        {/* Backtest Selector */}
        {backtests.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Target Simulation:</span>
            <select
              value={selectedBtId}
              onChange={(e) => setSelectedBtId(e.target.value)}
              className="rounded bg-surface-muted border border-border px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              {backtests.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.strategy_name} ({b.ticker})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeBt && m && r ? (
        <>
          {/* Key Tail Risk Metrics Strip */}
          <div className="bg-surface border border-border rounded p-3 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <span className="text-slate-500 block text-[10px]">HISTORICAL VaR (95%)</span>
                <span className="font-semibold text-market-down text-sm tabular-nums">
                  -{r.var_95.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 block">1-day 95% threshold</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">HISTORICAL VaR (99%)</span>
                <span className="font-semibold text-market-down text-sm tabular-nums">
                  -{r.var_99.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 block">1-in-100 day tail</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">EXPECTED SHORTFALL (CVaR)</span>
                <span className="font-semibold text-market-down text-sm tabular-nums">
                  -{r.cvar_95.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 block">Loss beyond 95% VaR</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">MAX DRAWDOWN</span>
                <span className="font-semibold text-market-down text-sm tabular-nums">
                  -{m.max_drawdown.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 block">Duration: {m.max_drawdown_duration} bars</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">DOWNSIDE DEVIATION</span>
                <span className="font-semibold text-slate-200 text-sm tabular-nums">
                  {r.downside_deviation.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 block">Negative returns σ</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">CALMAR RATIO</span>
                <span className="font-semibold text-slate-200 text-sm tabular-nums">
                  {formatRatio(m.calmar_ratio)}
                </span>
                <span className="text-[10px] text-slate-500 block">CAGR / |MaxDD|</span>
              </div>
            </div>
          </div>

          {/* Charts: Return Distribution and Underwater Drawdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="border border-border rounded bg-surface p-3 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Daily Return Distribution & VaR Thresholds
              </span>
              <div className="h-[280px]">
                <ReturnDistributionChart
                  distribution={r.return_distribution || []}
                  var95={r.var_95}
                  var99={r.var_99}
                  height={280}
                />
              </div>
            </div>

            <div className="border border-border rounded bg-surface p-3 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Underwater Drawdown Profile
              </span>
              <div className="h-[280px]">
                <UnderwaterDrawdownChart data={activeBt.equity_curve} height={280} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-xs text-slate-500 rounded border border-border bg-surface">
          No simulations available to analyze risk. Execute a backtest from the Backtests page first.
        </div>
      )}

      {/* Portfolio Construction Framework */}
      <div className="border border-border rounded bg-surface p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Systematic Portfolio Weight Allocation Model
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Asset exposure weights under Equal Weight (1/N), Inverse Volatility, and Risk Parity
            </p>
          </div>

          <div className="flex rounded border border-border bg-surface-muted p-0.5 text-xs">
            <button
              onClick={() => setConstructionMethod("equal")}
              className={`px-3 py-1 rounded transition-colors ${
                constructionMethod === "equal"
                  ? "bg-surface text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Equal Weight (1/N)
            </button>
            <button
              onClick={() => setConstructionMethod("inv_vol")}
              className={`px-3 py-1 rounded transition-colors ${
                constructionMethod === "inv_vol"
                  ? "bg-surface text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Inverse Volatility
            </button>
            <button
              onClick={() => setConstructionMethod("risk_parity")}
              className={`px-3 py-1 rounded transition-colors ${
                constructionMethod === "risk_parity"
                  ? "bg-surface text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Risk Parity
            </button>
          </div>
        </div>

        {/* Weights Breakdown Table */}
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-[11px] text-slate-400 font-medium">
                <th className="py-2 px-3">Asset</th>
                <th className="py-2 px-3">Historical Volatility</th>
                <th className="py-2 px-3">Computed Weight</th>
                <th className="py-2 px-3">Allocation Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {portfolioWeights.map((w) => (
                <tr key={w.asset} className="hover:bg-surface-hover/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{w.asset}</td>
                  <td className="py-2.5 px-3 text-slate-400">{w.vol.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-slate-100 font-semibold">{w.weight.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 w-1/3">
                    <div className="h-2 w-full rounded bg-surface-muted overflow-hidden">
                      <div
                        className="h-full bg-brand-blue rounded transition-all duration-300"
                        style={{ width: `${Math.min(100, w.weight * 2.5)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
