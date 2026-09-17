"use client";

import React, { useState } from "react";
import { Info, Sliders } from "lucide-react";

interface Scenario {
  name: string;
  portfolioReturn: number;
  benchmarkReturn: number;
}

const HISTORICAL_SCENARIOS: Scenario[] = [
  { name: "2008 Financial Crisis", portfolioReturn: -28.4, benchmarkReturn: -37.0 },
  { name: "COVID-19 Crash (2020)", portfolioReturn: -23.2, benchmarkReturn: -33.8 },
  { name: "2022 Rate Hike Shock", portfolioReturn: -14.8, benchmarkReturn: -19.4 },
  { name: "Tech Selloff (2022)", portfolioReturn: -17.6, benchmarkReturn: -24.1 },
  { name: "Inflation Shock", portfolioReturn: -12.3, benchmarkReturn: -16.7 },
  { name: "Volatility Spike", portfolioReturn: -11.9, benchmarkReturn: -15.6 },
];

export default function PortfolioTailRiskWidget({
  benchmarkSymbol = "SPY",
}: {
  benchmarkSymbol?: string;
}) {
  const [activeTab, setActiveTab] = useState<
    "Historical Scenarios" | "Custom Stress Test" | "Monte Carlo" | "VaR / CVaR"
  >("Historical Scenarios");

  // Custom stress test sliders
  const [equityShock, setEquityShock] = useState(-15);
  const [volSpike, setVolSpike] = useState(40);

  const customLoss = (equityShock * 0.78 - (volSpike / 100) * 2.5).toFixed(1);

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header & Tabs */}
      <div className="space-y-2 pb-2 border-b border-[#1A2230]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">
              Tail Risk &amp; Stress Testing
            </h2>
            <button
              type="button"
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Hypothetical macro crisis shocks and historical tail risk simulations"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto bg-[#111722] border border-[#1F2B3E] rounded p-0.5 text-[11px] font-mono scrollbar-none">
          {(
            [
              "Historical Scenarios",
              "Custom Stress Test",
              "Monte Carlo",
              "VaR / CVaR",
            ] as const
          ).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`px-2 py-0.5 rounded whitespace-nowrap transition-all ${
                activeTab === t
                  ? "bg-[#0284C7] text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "Historical Scenarios" ? (
        <div className="pt-2 space-y-1.5">
          <div className="grid grid-cols-12 text-[11px] text-[#717E90] font-sans font-medium px-1">
            <div className="col-span-6">Scenario</div>
            <div className="col-span-3 text-right">Portfolio Return</div>
            <div className="col-span-3 text-right">Benchmark ({benchmarkSymbol})</div>
          </div>

          <div className="space-y-1.5">
            {HISTORICAL_SCENARIOS.map((s) => (
              <div
                key={s.name}
                className="grid grid-cols-12 items-center text-xs py-1 px-1 rounded hover:bg-[#0E1522] transition-colors"
              >
                <div className="col-span-6 font-sans text-slate-300 truncate">
                  {s.name}
                </div>

                <div className="col-span-3 text-right font-mono font-bold text-[#F43F5E]">
                  {s.portfolioReturn.toFixed(1)}%
                </div>

                <div className="col-span-3 text-right font-mono text-slate-400">
                  {s.benchmarkReturn.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === "Custom Stress Test" ? (
        <div className="pt-3 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">S&amp;P 500 Market Shock</span>
              <span className="font-mono text-red-400 font-bold">{equityShock}%</span>
            </div>
            <input
              type="range"
              min="-40"
              max="0"
              value={equityShock}
              onChange={(e) => setEquityShock(Number(e.target.value))}
              className="w-full h-1.5 bg-[#141C28] rounded-lg appearance-none cursor-pointer accent-[#EF4444]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">VIX Volatility Surge</span>
              <span className="font-mono text-amber-400 font-bold">+{volSpike}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={volSpike}
              onChange={(e) => setVolSpike(Number(e.target.value))}
              className="w-full h-1.5 bg-[#141C28] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
            />
          </div>

          <div className="p-2.5 rounded bg-[#101724] border border-[#1E2C40] flex items-center justify-between text-xs">
            <span className="text-slate-300">Simulated Portfolio Impact:</span>
            <span className="font-mono font-bold text-red-400 text-sm">
              {customLoss}%
            </span>
          </div>
        </div>
      ) : (
        <div className="pt-3 text-xs text-slate-400 space-y-2">
          <div className="flex justify-between py-1 border-b border-[#1A2230]">
            <span>Parametric VaR (99%, 10-day)</span>
            <span className="font-mono font-bold text-red-400">-5.82%</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#1A2230]">
            <span>Historical VaR (99%, 10-day)</span>
            <span className="font-mono font-bold text-red-400">-6.14%</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#1A2230]">
            <span>Expected Shortfall (CVaR 99%)</span>
            <span className="font-mono font-bold text-red-400">-8.45%</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Cornish-Fisher Tail VaR</span>
            <span className="font-mono font-bold text-red-400">-7.02%</span>
          </div>
        </div>
      )}
    </div>
  );
}
