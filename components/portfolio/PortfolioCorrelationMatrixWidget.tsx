"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

const ASSETS = ["AAPL", "MSFT", "NVDA", "SPY", "TLT"];

const MATRIX: Record<string, Record<string, number>> = {
  AAPL: { AAPL: 1.0, MSFT: 0.72, NVDA: 0.61, SPY: 0.84, TLT: -0.12 },
  MSFT: { AAPL: 0.72, MSFT: 1.0, NVDA: 0.68, SPY: 0.79, TLT: -0.1 },
  NVDA: { AAPL: 0.61, MSFT: 0.68, NVDA: 1.0, SPY: 0.71, TLT: -0.18 },
  SPY: { AAPL: 0.84, MSFT: 0.79, NVDA: 0.71, SPY: 1.0, TLT: -0.2 },
  TLT: { AAPL: -0.12, MSFT: -0.1, NVDA: -0.18, SPY: -0.2, TLT: 1.0 },
};

function getCorrStyle(val: number): { bg: string; text: string } {
  if (val === 1.0) {
    return { bg: "bg-[#059669]/50", text: "text-[#6EE7B7]" };
  }
  if (val > 0) {
    if (val >= 0.8) return { bg: "bg-[#059669]/40", text: "text-[#34D399]" };
    if (val >= 0.6) return { bg: "bg-[#047857]/35", text: "text-[#10B981]" };
    return { bg: "bg-[#065F46]/25", text: "text-slate-200" };
  }
  // Negative correlations
  if (val <= -0.15) return { bg: "bg-[#991B1B]/40", text: "text-[#FCA5A5]" };
  return { bg: "bg-[#7F1D1D]/30", text: "text-[#F87171]" };
}

export default function PortfolioCorrelationMatrixWidget() {
  const [hoveredPair, setHoveredPair] = useState<{ a: string; b: string; val: number } | null>(null);

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-[#1A2230]">
        <h2 className="text-sm font-bold text-white tracking-tight font-sans">
          Correlation Matrix
        </h2>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Pairwise Pearson correlation matrix based on daily returns"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Matrix Grid + Vertical Scale Bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {/* 5x5 Matrix Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-center border-collapse text-[11px] font-mono">
            <thead>
              <tr>
                <th className="p-1 text-slate-500 font-sans text-[10px]" />
                {ASSETS.map((a) => (
                  <th key={a} className="p-1 font-sans font-semibold text-slate-300">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSETS.map((rowAsset) => (
                <tr key={rowAsset}>
                  <td className="p-1 text-left font-sans font-semibold text-slate-300">
                    {rowAsset}
                  </td>
                  {ASSETS.map((colAsset) => {
                    const val = MATRIX[rowAsset][colAsset];
                    const style = getCorrStyle(val);
                    return (
                      <td key={colAsset} className="p-0.5">
                        <div
                          onMouseEnter={() => setHoveredPair({ a: rowAsset, b: colAsset, val })}
                          onMouseLeave={() => setHoveredPair(null)}
                          className={`rounded py-1 px-1 transition-all border border-[#1E2B3E]/30 cursor-pointer ${style.bg} ${style.text} hover:scale-105 hover:border-[#38BDF8]`}
                        >
                          {val.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vertical Color Scale Bar on Right */}
        <div className="flex items-center space-x-1 pl-1 shrink-0">
          <div className="h-36 w-2 rounded-full bg-gradient-to-b from-[#10B981] via-[#090D14] to-[#EF4444]" />
          <div className="h-36 flex flex-col justify-between text-[10px] font-mono text-slate-400 py-0.5">
            <span className="text-[#34D399]">1.0</span>
            <span className="text-slate-400">0.0</span>
            <span className="text-[#F87171]">-1.0</span>
          </div>
        </div>
      </div>

      {/* Hover readout indicator */}
      <div className="text-[10px] text-slate-400 font-mono text-center pt-1">
        {hoveredPair ? (
          <span>
            {hoveredPair.a} ↔ {hoveredPair.b}:{" "}
            <span className="font-bold text-white">{hoveredPair.val.toFixed(2)}</span>
          </span>
        ) : (
          <span>Hover cell for pairwise correlation</span>
        )}
      </div>
    </div>
  );
}
