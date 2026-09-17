"use client";

import React, { useState } from "react";
import { Info, Settings2, Check } from "lucide-react";

export type OptimizationMethod =
  | "Equal Weight"
  | "Inv Volatility"
  | "Risk Parity"
  | "Min Variance"
  | "Max Sharpe";

const METHOD_WEIGHTS: Record<OptimizationMethod, Record<string, number>> = {
  "Equal Weight": { AAPL: 20.0, MSFT: 20.0, NVDA: 20.0, SPY: 20.0, TLT: 20.0 },
  "Inv Volatility": { AAPL: 19.5, MSFT: 22.8, NVDA: 11.5, SPY: 26.2, TLT: 20.0 },
  "Risk Parity": { AAPL: 18.4, MSFT: 16.7, NVDA: 28.2, SPY: 22.1, TLT: 14.6 },
  "Min Variance": { AAPL: 12.0, MSFT: 14.5, NVDA: 8.5, SPY: 38.0, TLT: 27.0 },
  "Max Sharpe": { AAPL: 24.0, MSFT: 26.0, NVDA: 32.0, SPY: 18.0, TLT: 0.0 },
};

interface PortfolioOptimizationWidgetProps {
  onApplyOptimization?: (method: OptimizationMethod, weights: Record<string, number>) => void;
}

export default function PortfolioOptimizationWidget({
  onApplyOptimization,
}: PortfolioOptimizationWidgetProps) {
  const [method, setMethod] = useState<OptimizationMethod>("Risk Parity");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [appliedToast, setAppliedToast] = useState(false);

  const weights = METHOD_WEIGHTS[method];
  const assets = ["AAPL", "MSFT", "NVDA", "SPY", "TLT"];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setAppliedToast(true);
      if (onApplyOptimization) {
        onApplyOptimization(method, weights);
      }
      setTimeout(() => setAppliedToast(false), 2200);
    }, 600);
  };

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header & Tabs */}
      <div className="space-y-2 pb-2 border-b border-[#1A2230]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">
              Portfolio Optimization
            </h2>
            <button
              type="button"
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Algorithmic asset allocation optimization solving for convex risk/return objectives"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Method selector pills */}
        <div className="flex items-center space-x-1 overflow-x-auto bg-[#111722] border border-[#1F2B3E] rounded p-0.5 text-[11px] font-mono scrollbar-none">
          {(
            [
              "Equal Weight",
              "Inv Volatility",
              "Risk Parity",
              "Min Variance",
              "Max Sharpe",
            ] as const
          ).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`px-2 py-0.5 rounded whitespace-nowrap transition-all ${
                method === m
                  ? "bg-[#0284C7] text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Bars Area + Action Button */}
      <div className="grid grid-cols-12 gap-3 items-center pt-2">
        {/* Bars (8 cols) */}
        <div className="col-span-8 space-y-1.5">
          {assets.map((a) => {
            const w = weights[a] || 0;
            return (
              <div key={a} className="flex items-center space-x-2 text-xs">
                <span className="w-10 font-sans font-bold text-slate-200 text-[11px]">
                  {a}
                </span>
                <div className="flex-1 bg-[#141C28] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#38BDF8] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, w * 2.5)}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-slate-300 w-10 text-right">
                  {w.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Button (4 cols) */}
        <div className="col-span-4 flex flex-col items-center justify-center pl-2 border-l border-[#1A2230]">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-[#0284C7]/60 hover:border-[#38BDF8] bg-[#0C1523] hover:bg-[#121F33] text-white transition-all w-full shadow-md group disabled:opacity-60"
          >
            {appliedToast ? (
              <Check className="w-5 h-5 text-[#10B981] mb-1" />
            ) : (
              <Settings2
                className={`w-5 h-5 text-[#38BDF8] mb-1 group-hover:rotate-45 transition-transform ${
                  isOptimizing ? "animate-spin" : ""
                }`}
              />
            )}
            <span className="text-xs font-semibold tracking-tight text-center">
              {appliedToast ? "Applied!" : isOptimizing ? "Solving..." : "Optimize Portfolio"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
