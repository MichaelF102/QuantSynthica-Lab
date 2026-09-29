"use client";

import React from "react";

interface MetricsProps {
  metrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    var95: number;
    sortinoRatio: number;
  };
}

export default function PortfolioMetrics({ metrics }: MetricsProps) {
  return (
    <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Portfolio Metrics</h4>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">(Illustrative)</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {/* Expected Return */}
        <div>
          <div className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 truncate">Expected Return</div>
          <div className="text-base font-black text-teal-600 dark:text-teal-400 tracking-tight mt-0.5">
            {metrics.expectedReturn.toFixed(1)}%
          </div>
        </div>

        {/* Volatility */}
        <div>
          <div className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 truncate">Volatility</div>
          <div className="text-base font-black text-[#0B1220] dark:text-white tracking-tight mt-0.5">
            {metrics.volatility.toFixed(1)}%
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div>
          <div className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 truncate">Sharpe Ratio</div>
          <div className="text-base font-black text-[#1769FF] dark:text-blue-400 tracking-tight mt-0.5">
            {metrics.sharpeRatio.toFixed(2)}
          </div>
        </div>

        {/* Max Drawdown */}
        <div>
          <div className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 truncate">Max Drawdown</div>
          <div className="text-base font-black text-rose-500 dark:text-rose-400 tracking-tight mt-0.5">
            {metrics.maxDrawdown.toFixed(1)}%
          </div>
        </div>

        {/* VaR (95%) */}
        <div>
          <div className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 truncate">VaR (95%)</div>
          <div className="text-base font-black text-rose-500 dark:text-rose-400 tracking-tight mt-0.5">
            {metrics.var95.toFixed(1)}%
          </div>
        </div>

        {/* Sortino Ratio */}
        <div>
          <div className="text-[10px] font-semibold text-[#64748B] dark:text-slate-400 truncate">Sortino Ratio</div>
          <div className="text-base font-black text-[#1769FF] dark:text-blue-400 tracking-tight mt-0.5">
            {metrics.sortinoRatio.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
