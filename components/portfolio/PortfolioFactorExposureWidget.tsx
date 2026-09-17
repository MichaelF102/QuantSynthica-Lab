"use client";

import React from "react";
import { Info } from "lucide-react";

interface FactorExposureItem {
  factor: string;
  exposure: number;
  relativeToSpy: number;
}

const DEFAULT_FACTORS: FactorExposureItem[] = [
  { factor: "Market Beta", exposure: 0.78, relativeToSpy: -0.22 },
  { factor: "Momentum", exposure: 0.62, relativeToSpy: 0.31 },
  { factor: "Value", exposure: 0.18, relativeToSpy: -0.12 },
  { factor: "Size (SMB)", exposure: 0.21, relativeToSpy: 0.05 },
  { factor: "Quality (QMJ)", exposure: 0.48, relativeToSpy: 0.2 },
  { factor: "Low Volatility", exposure: -0.31, relativeToSpy: -0.45 },
];

export default function PortfolioFactorExposureWidget({
  factors = DEFAULT_FACTORS,
}: {
  factors?: FactorExposureItem[];
}) {
  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-[#1A2230]">
        <h2 className="text-sm font-bold text-white tracking-tight font-sans">
          Factor Exposure (vs SPY)
        </h2>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Fama-French 5-factor regression exposures relative to S&P 500 benchmark"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Header */}
      <div className="pt-2 space-y-2">
        <div className="grid grid-cols-12 text-[11px] text-[#717E90] font-sans font-medium px-1">
          <div className="col-span-4">Factor</div>
          <div className="col-span-5">Exposure</div>
          <div className="col-span-3 text-right">Relative to SPY</div>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {factors.map((f) => {
            const isPos = f.exposure >= 0;
            const barWidth = Math.min(100, Math.abs(f.exposure) * 100);
            const isRelPos = f.relativeToSpy >= 0;

            return (
              <div
                key={f.factor}
                className="grid grid-cols-12 items-center text-xs py-1 px-1 rounded hover:bg-[#0E1522] transition-colors"
              >
                <div className="col-span-4 font-sans font-medium text-slate-200 truncate">
                  {f.factor}
                </div>

                <div className="col-span-5 flex items-center space-x-2 pr-2">
                  <div className="w-20 bg-[#141C28] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPos ? "bg-[#38BDF8]" : "bg-[#EF4444]"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-slate-300">
                    {f.exposure.toFixed(2)}
                  </span>
                </div>

                <div
                  className={`col-span-3 text-right font-mono font-bold text-xs ${
                    isRelPos ? "text-[#10B981]" : "text-[#EF4444]"
                  }`}
                >
                  {isRelPos ? `+${f.relativeToSpy.toFixed(2)}` : f.relativeToSpy.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
