"use client";

import React, { useState } from "react";
import { BacktestResult } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { X, Copy, Download, Check } from "lucide-react";

interface ReportModalProps {
  backtest: BacktestResult;
  onClose: () => void;
}

export default function ResearchReportModal({ backtest, onClose }: ReportModalProps) {
  const [copied, setCopied] = useState(false);
  const m = backtest.metrics;
  const r = backtest.risk;

  if (!m) return null;

  const reportText = `============================================================
ALGO LAB QUANTITATIVE RESEARCH TEARSHEET
============================================================
Strategy Name:       ${backtest.strategy_name}
Target Security:     ${backtest.ticker}
Benchmark:           ${backtest.benchmark}
Backtest Period:     ${backtest.start_date} to ${backtest.end_date}
Generated At:        ${backtest.created_at || new Date().toISOString()}

1. EXECUTIVE PERFORMANCE SUMMARY
------------------------------------------------------------
Total Return:        ${formatPercent(m.total_return)}
CAGR:                ${formatPercent(m.cagr)}
Annualized Return:   ${formatPercent(m.annualized_return)}
Annualized Vol:      ${m.annualized_volatility.toFixed(2)}%
Sharpe Ratio:        ${m.sharpe_ratio.toFixed(2)}
Sortino Ratio:       ${m.sortino_ratio.toFixed(2)}
Calmar Ratio:        ${m.calmar_ratio.toFixed(2)}
Max Drawdown:        -${Math.abs(m.max_drawdown).toFixed(2)}%
Max DD Duration:     ${m.max_drawdown_duration} bars

2. BENCHMARK ATTRIBUTION
------------------------------------------------------------
Alpha (Jensen's):    ${formatPercent(m.alpha)}
Beta:                ${m.beta.toFixed(2)}
Information Ratio:   ${m.information_ratio.toFixed(2)}
Tracking Error:      ${m.tracking_error.toFixed(2)}%

3. TRADE EXECUTION & FRICTION
------------------------------------------------------------
Total Trades:        ${m.num_trades}
Win Rate:            ${m.win_rate.toFixed(1)}% (${m.winning_trades} wins / ${m.losing_trades} losses)
Profit Factor:       ${m.profit_factor.toFixed(2)}
Expectancy:          ${formatPercent(m.expectancy)}
Average Trade:       ${formatPercent(m.avg_trade_return)}
Average Holding:     ${m.avg_holding_period.toFixed(1)} bars
Gross P&L:           ${formatCurrency(m.gross_pnl)}
Transaction Fees:    ${formatCurrency(m.total_fees)}
Net P&L:             ${formatCurrency(m.net_pnl)}

4. TAIL RISK & REGIMES
------------------------------------------------------------
Historical VaR 95%:  -${r?.var_95?.toFixed(2) || "0.00"}% daily
Historical VaR 99%:  -${r?.var_99?.toFixed(2) || "0.00"}% daily
Expected Shortfall:  -${r?.cvar_95?.toFixed(2) || "0.00"}% (CVaR 95%)
Downside Deviation:  ${r?.downside_deviation?.toFixed(2) || "0.00"}%
============================================================
ASSUMPTIONS & METHODOLOGY:
- Chronological execution: signal generated at bar t close, filled strictly at bar t+1 open.
- Intra-bar high/low stop-loss & take-profit execution to prevent intra-bar lookahead.
- Transaction cost model includes commission fees, linear slippage, and spread penalty.
============================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report_${backtest.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded border border-border bg-surface p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div>
            <h3 className="font-mono text-sm font-bold text-white tracking-wider">
              QUANTITATIVE RESEARCH TEARSHEET
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Strategy: {backtest.strategy_name} ({backtest.ticker})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 rounded border border-border-subtle bg-surface-muted hover:bg-surface-hover px-2.5 py-1 text-xs font-mono text-slate-300 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-market-up" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 rounded border border-brand-cyan/30 bg-brand-cyan/15 hover:bg-brand-cyan/25 px-2.5 py-1 text-xs font-mono text-brand-cyan transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Report Content Box */}
        <pre className="flex-1 overflow-auto rounded border border-border-subtle bg-surface-muted/70 p-4 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre selection:bg-brand-cyan/30">
          {reportText}
        </pre>
      </div>
    </div>
  );
}
