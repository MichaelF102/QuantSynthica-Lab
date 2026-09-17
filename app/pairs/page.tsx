"use client";

import React, { useState } from "react";
import {
  GitCompare,
  Play,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { PairsTradingResult } from "@/types";
import { formatCurrency, formatPercent, formatRatio } from "@/lib/formatters";
import SpreadZScoreChart from "@/components/charts/SpreadZScoreChart";
import EquityCurveChart from "@/components/charts/EquityCurveChart";
import TradeTable from "@/components/tables/TradeTable";

export default function PairsTradingPage() {
  const [tickerA, setTickerA] = useState("KO");
  const [tickerB, setTickerB] = useState("PEP");
  const [startDate, setStartDate] = useState("2022-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [lookbackWindow, setLookbackWindow] = useState(60);
  const [entryZ, setEntryZ] = useState(2.0);
  const [exitZ, setExitZ] = useState(0.5);
  const [stopZ, setStopZ] = useState(3.5);

  const [pairsResult, setPairsResult] = useState<PairsTradingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunPairs = async () => {
    setIsProcessing(true);
    try {
      const res = await api.runPairsTrading({
        ticker_a: tickerA,
        ticker_b: tickerB,
        start_date: startDate,
        end_date: endDate,
        lookback_window: lookbackWindow,
        entry_z_score: entryZ,
        exit_z_score: exitZ,
        stop_z_score: stopZ,
        initial_capital: 100000.0,
        commission_pct: 0.05,
        slippage_pct: 0.05,
      });
      setPairsResult(res);
    } catch (err: any) {
      alert(`Pairs simulation failed: ${err.message}`);
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
            Statistical Arbitrage & Pairs Trading
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Engle-Granger cointegration test, OLS hedge ratio (&beta;), and mean-reverting spread execution
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="border border-border rounded bg-surface p-4 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Model Parameters
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-sans">LEG A TICKER</label>
            <input
              type="text"
              value={tickerA}
              onChange={(e) => setTickerA(e.target.value.toUpperCase())}
              className="w-full rounded bg-surface-muted border border-border px-2.5 py-1.5 text-slate-100 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-sans">LEG B TICKER</label>
            <input
              type="text"
              value={tickerB}
              onChange={(e) => setTickerB(e.target.value.toUpperCase())}
              className="w-full rounded bg-surface-muted border border-border px-2.5 py-1.5 text-slate-100 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-sans">START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded bg-surface-muted border border-border px-2 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-sans">END DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded bg-surface-muted border border-border px-2 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-sans">LOOKBACK (BARS)</label>
            <input
              type="number"
              value={lookbackWindow}
              onChange={(e) => setLookbackWindow(Number(e.target.value))}
              className="w-full rounded bg-surface-muted border border-border px-2 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-sans">ENTRY / EXIT Z</label>
            <div className="flex space-x-1">
              <input
                type="number"
                step="0.1"
                value={entryZ}
                onChange={(e) => setEntryZ(Number(e.target.value))}
                className="w-full rounded bg-surface-muted border border-border px-1.5 py-1.5 text-center text-slate-100"
                title="Entry Z"
              />
              <input
                type="number"
                step="0.1"
                value={exitZ}
                onChange={(e) => setExitZ(Number(e.target.value))}
                className="w-full rounded bg-surface-muted border border-border px-1.5 py-1.5 text-center text-slate-100"
                title="Exit Z"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunPairs}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-1.5 rounded bg-brand-blue hover:bg-sky-600 px-3 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 ${isProcessing ? "animate-spin" : ""}`} />
              <span>{isProcessing ? "Evaluating..." : "Run Pairs Model"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Workspace */}
      {pairsResult && (
        <div className="space-y-4">
          {/* Cointegration & Statistical Summary Banner */}
          <div className="border border-border rounded bg-surface p-3 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-center">
              <div>
                <span className="text-slate-500 block text-[10px]">COINTEGRATION STATUS</span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  {pairsResult.is_cointegrated ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-market-up" />
                      <span className="font-semibold text-market-up">COINTEGRATED (p &lt; 0.05)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-market-down" />
                      <span className="font-semibold text-market-down">NOT COINTEGRATED</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">ADF STATISTIC</span>
                <span className="text-sm font-semibold text-slate-100 mt-0.5 block">
                  {pairsResult.adf_statistic.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-500">p-value: {pairsResult.p_value.toFixed(4)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">OLS HEDGE RATIO (&beta;)</span>
                <span className="text-sm font-semibold text-slate-100 mt-0.5 block">
                  {pairsResult.hedge_ratio.toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-500">1 unit A = {pairsResult.hedge_ratio.toFixed(2)} units B</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">TOTAL RETURN</span>
                <span
                  className={`text-sm font-semibold mt-0.5 block ${
                    pairsResult.metrics.total_return >= 0 ? "text-market-up" : "text-market-down"
                  }`}
                >
                  {formatPercent(pairsResult.metrics.total_return)}
                </span>
                <span className="text-[10px] text-slate-500">Net P&L: {formatCurrency(pairsResult.metrics.net_pnl)}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">SHARPE RATIO</span>
                <span className="text-sm font-semibold text-slate-100 mt-0.5 block">
                  {formatRatio(pairsResult.metrics.sharpe_ratio)}
                </span>
                <span className="text-[10px] text-slate-500">{pairsResult.metrics.total_trades} pair trades</span>
              </div>
            </div>
          </div>

          {/* Spread & Z-Score Chart */}
          <div className="border border-border rounded bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Rolling Spread Z-Score & Arbitrage Thresholds (&plusmn;{entryZ}&sigma;)
            </span>
            <div className="h-[280px]">
              <SpreadZScoreChart
                data={pairsResult.spread_series}
                tickerA={tickerA}
                tickerB={tickerB}
                height={280}
              />
            </div>
          </div>

          {/* Pairs Cumulative Equity Curve */}
          <div className="border border-border rounded bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Cumulative Equity Curve ($100,000 Initial Capital)
            </span>
            <div className="h-[280px]">
              <EquityCurveChart
                data={pairsResult.equity_curve}
                benchmarkSymbol="SPY"
              />
            </div>
          </div>

          {/* Trade Table */}
          <div className="border border-border rounded bg-surface p-4 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Arbitrage Execution Log ({pairsResult.trades.length} round-trips)
            </span>
            <TradeTable trades={pairsResult.trades} />
          </div>
        </div>
      )}
    </div>
  );
}
