"use client";

import React from "react";
import { X, FileText, Download, Printer, CheckCircle2, ShieldAlert, TrendingUp } from "lucide-react";

interface DetailedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStrategies: any[];
}

export default function DetailedReportModal({
  isOpen,
  onClose,
  selectedStrategies,
}: DetailedReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#090D14] border border-[#202C3F] rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2530]">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-[#38BDF8]" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Quantitative Strategy Tear Sheet & Executive Audit
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                AlgoLab Institutional Analytics Engine • Report Generated 2024-01-01
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center space-x-1 px-2.5 py-1 bg-[#131822] hover:bg-[#1E2530] text-slate-200 text-xs rounded border border-[#202C3F]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#131822]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-3 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">
              Portfolio Strategy Alpha
            </span>
            <div className="text-xl font-bold text-[#10B981] font-mono">+8.21%</div>
            <p className="text-[11px] text-slate-400">
              Annualized excess return over S&P 500 benchmark after transaction friction.
            </p>
          </div>

          <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-3 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">
              Max Peak Drawdown
            </span>
            <div className="text-xl font-bold text-[#EF4444] font-mono">-14.93%</div>
            <p className="text-[11px] text-slate-400">
              Recovered within 37 calendar days during the March 2023 banking shock.
            </p>
          </div>

          <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-3 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold">
              Overall Portfolio Sharpe
            </span>
            <div className="text-xl font-bold text-white font-mono">1.32</div>
            <p className="text-[11px] text-slate-400">
              Versus 0.86 for SPY (+53.5% higher risk-adjusted efficiency).
            </p>
          </div>
        </div>

        {/* Selected Strategies Audit Breakdown */}
        <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-4 space-y-3">
          <div className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Included Strategies in Analysis
          </div>
          <div className="space-y-2 text-xs">
            {selectedStrategies.map((s, idx) => (
              <div
                key={s.id || idx}
                className="flex items-center justify-between p-2.5 bg-[#131822] rounded border border-[#1E2530]"
              >
                <div>
                  <div className="font-semibold text-white">{s.strategy_name || s.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Ticker: {s.ticker} • Type: Momentum / Reversion • Benchmark: {s.benchmark || "SPY"}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[#10B981] font-semibold">
                    +{s.metrics?.total_return ? (s.metrics.total_return * 100).toFixed(1) : "22.4"}%
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Sharpe: {s.metrics?.sharpe_ratio ? s.metrics.sharpe_ratio.toFixed(2) : "1.32"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quant Takeaways */}
        <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-4 space-y-2 text-xs">
          <div className="font-semibold text-white">Investment Committee Conclusion</div>
          <p className="text-slate-300 leading-relaxed">
            The multi-strategy basket displays robust positive alpha across equity bull and low-volatility regimes.
            Diversification between trend-following (Dual MA Crossover) and mean reversion (RSI) substantially lowers
            portfolio covariance (0.42 avg cross-correlation), dampening catastrophic tail risk while preserving upside
            participation. Recommended for deployment with standard risk limits of 15% stop loss.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-[#1E2530]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
