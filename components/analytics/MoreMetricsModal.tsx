"use client";

import React from "react";
import { X, TrendingUp, ShieldAlert, BarChart3, Activity } from "lucide-react";
import { formatPercent, formatRatio } from "@/lib/formatters";

interface MoreMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics?: any;
  strategyName?: string;
}

export default function MoreMetricsModal({
  isOpen,
  onClose,
  metrics,
  strategyName = "Selected Portfolio",
}: MoreMetricsModalProps) {
  if (!isOpen) return null;

  const m = metrics || {};

  const returnMetrics = [
    { label: "Total Cumulative Return", value: "+22.34%" },
    { label: "CAGR (Compound Annual Growth)", value: "10.67%" },
    { label: "Annualized Return", value: "11.20%" },
    { label: "Monthly Mean Return", value: "0.89%" },
    { label: "Best Month", value: "+7.42%" },
    { label: "Worst Month", value: "-4.18%" },
    { label: "Positive Months", value: "68.2%" },
  ];

  const riskAdjustedMetrics = [
    { label: "Sharpe Ratio (Rf=2%)", value: "1.32" },
    { label: "Sortino Ratio", value: "1.87" },
    { label: "Calmar Ratio", value: "0.71" },
    { label: "Omega Ratio", value: "1.45" },
    { label: "Information Ratio", value: "0.64" },
    { label: "Treynor Ratio", value: "11.84%" },
    { label: "Gain-to-Pain Ratio", value: "1.62" },
  ];

  const riskVolMetrics = [
    { label: "Annualized Volatility", value: "14.28%" },
    { label: "Downside Deviation", value: "9.84%" },
    { label: "Daily VaR (95% CI)", value: "1.42%" },
    { label: "Daily VaR (99% CI)", value: "2.18%" },
    { label: "CVaR / Expected Shortfall (95%)", value: "1.96%" },
    { label: "CVaR / Expected Shortfall (99%)", value: "2.84%" },
    { label: "Tail Ratio (95 / 5)", value: "1.18" },
  ];

  const drawdownMetrics = [
    { label: "Maximum Peak-to-Trough Drawdown", value: "-14.93%" },
    { label: "Average Drawdown", value: "-4.56%" },
    { label: "Longest Drawdown Duration", value: "62 days" },
    { label: "Average Recovery Time", value: "37 days" },
    { label: "Ulcer Index", value: "3.42" },
    { label: "Pain Index", value: "2.81" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0A0D14] border border-[#202C3F] rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2530]">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#38BDF8]" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Comprehensive Quantitative Metric Suite
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Extended statistical performance, downside tail risk, and factor characteristics for{" "}
              <span className="text-[#38BDF8] font-semibold">{strategyName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#131822]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Category Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Return Metrics */}
          <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-white font-semibold pb-1 border-b border-[#1E2530]">
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
              <span>Return Performance Profile</span>
            </div>
            <div className="space-y-2 font-mono">
              {returnMetrics.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 text-[11px] font-sans">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk-Adjusted Ratios */}
          <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-white font-semibold pb-1 border-b border-[#1E2530]">
              <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
              <span>Risk-Adjusted Efficiency</span>
            </div>
            <div className="space-y-2 font-mono">
              {riskAdjustedMetrics.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 text-[11px] font-sans">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volatility & Downside Risk */}
          <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-white font-semibold pb-1 border-b border-[#1E2530]">
              <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
              <span>Tail Risk & Volatility Metrics</span>
            </div>
            <div className="space-y-2 font-mono">
              {riskVolMetrics.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 text-[11px] font-sans">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drawdown Profile */}
          <div className="bg-[#0F141D] border border-[#1E2530] rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-white font-semibold pb-1 border-b border-[#1E2530]">
              <Activity className="w-4 h-4 text-[#EF4444]" />
              <span>Drawdown & Recovery Profile</span>
            </div>
            <div className="space-y-2 font-mono">
              {drawdownMetrics.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-400 text-[11px] font-sans">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#1E2530]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
