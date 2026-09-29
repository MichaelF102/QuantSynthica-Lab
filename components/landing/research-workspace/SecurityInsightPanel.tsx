"use client";

import React, { useState } from "react";

export default function SecurityInsightPanel() {
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Fundamentals" | "Technicals" | "News"
  >("Overview");

  return (
    <div className="flex h-full w-full flex-col border-l border-white/[0.06] bg-[#070D18]/90 text-slate-200">
      {/* Top Tabs */}
      <div className="flex border-b border-white/[0.06] px-3 text-[11px] font-medium">
        {(["Overview", "Fundamentals", "Technicals", "News"] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative py-2 px-2.5 transition-colors ${
                activeTab === tab
                  ? "text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1769FF]" />
              )}
            </button>
          )
        )}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === "Overview" && (
          <>
            {/* Key Stats Section */}
            <div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Key Stats
              </div>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Market Cap</span>
                  <span className="font-semibold text-white">3.41T</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">PE Ratio</span>
                  <span className="font-semibold text-white">34.2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">EPS</span>
                  <span className="font-semibold text-white">6.52</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dividend Yield</span>
                  <span className="font-semibold text-white">0.46%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">52W High</span>
                  <span className="font-semibold text-white">237.23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">52W Low</span>
                  <span className="font-semibold text-white">164.08</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Avg Volume</span>
                  <span className="font-semibold text-white">52.3M</span>
                </div>
              </div>
            </div>

            {/* Analyst Consensus */}
            <div className="pt-2 border-t border-white/[0.05]">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Analyst Consensus
              </div>

              {/* Progress Stack Bar */}
              <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div style={{ width: "62%" }} className="bg-[#00C896]" />
                <div style={{ width: "28%" }} className="bg-[#38BDF8]" />
                <div style={{ width: "10%" }} className="bg-[#FF4D5A]" />
              </div>

              {/* Legend */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00C896]" />
                  Buy 62%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                  Hold 28%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D5A]" />
                  Sell 10%
                </span>
              </div>
            </div>

            {/* Revenue & Profit (TTM) */}
            <div className="pt-2 border-t border-white/[0.05]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Revenue & Profit (TTM)
                </span>
              </div>

              {/* Legend */}
              <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-xs bg-[#1769FF]" />
                  Revenue
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-xs bg-[#8B5CF6]" />
                  Net Income
                </span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="mt-2.5 flex items-end justify-between gap-2 h-20 pt-1 border-b border-white/[0.08] relative">
                {/* Y-axis guidelines */}
                <span className="absolute top-0 left-0 text-[8px] text-slate-500">
                  400B
                </span>
                <span className="absolute top-1/2 left-0 text-[8px] text-slate-500">
                  200B
                </span>
                <span className="absolute bottom-0 left-0 text-[8px] text-slate-500">
                  0
                </span>

                <div className="w-6" />

                {/* Quarters Q1 to Q4 */}
                {[
                  { q: "Q1", revH: 52, incH: 26 },
                  { q: "Q2", revH: 58, incH: 30 },
                  { q: "Q3", revH: 66, incH: 34 },
                  { q: "Q4", revH: 74, incH: 40 },
                ].map((item) => (
                  <div
                    key={item.q}
                    className="flex flex-1 flex-col items-center justify-end h-full"
                  >
                    <div className="flex items-end gap-1 h-full">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${item.revH}%` }}
                        className="w-2.5 rounded-t-xs bg-[#1769FF]"
                      />
                      {/* Income Bar */}
                      <div
                        style={{ height: `${item.incH}%` }}
                        className="w-2.5 rounded-t-xs bg-[#8B5CF6]"
                      />
                    </div>
                    <span className="mt-1 text-[9px] text-slate-400">
                      {item.q}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Snapshot */}
            <div className="pt-2 border-t border-white/[0.05]">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Technical Snapshot
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded border border-white/[0.06] bg-white/[0.02] p-1.5">
                  <div className="text-[9px] text-slate-400">Trend</div>
                  <div className="text-[10px] font-bold text-[#00C896]">
                    Bullish
                  </div>
                </div>
                <div className="rounded border border-white/[0.06] bg-white/[0.02] p-1.5">
                  <div className="text-[9px] text-slate-400">Momentum</div>
                  <div className="text-[10px] font-bold text-[#38BDF8]">
                    Neutral
                  </div>
                </div>
                <div className="rounded border border-white/[0.06] bg-white/[0.02] p-1.5">
                  <div className="text-[9px] text-slate-400">Volatility</div>
                  <div className="text-[10px] font-bold text-amber-400">
                    Moderate
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "Fundamentals" && (
          <div className="space-y-3 text-[11px]">
            <div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Financial Health
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">ROIC (Invested Capital)</span>
                  <span className="font-semibold text-emerald-400">54.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Free Cash Flow (TTM)</span>
                  <span className="font-semibold text-white">$108.8B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operating Margin</span>
                  <span className="font-semibold text-white">30.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Net Debt / EBITDA</span>
                  <span className="font-semibold text-emerald-400">0.42x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gross Margin</span>
                  <span className="font-semibold text-white">46.2%</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.05]">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Valuation Multiples
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">EV / EBITDA</span>
                  <span className="font-semibold text-white">26.8x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price / Free Cash Flow</span>
                  <span className="font-semibold text-white">31.4x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forward P/E</span>
                  <span className="font-semibold text-white">29.1x</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Technicals" && (
          <div className="space-y-3 text-[11px]">
            <div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Moving Averages
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">EMA 20</span>
                  <span className="font-semibold text-[#38BDF8]">221.14</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">EMA 50</span>
                  <span className="font-semibold text-[#818CF8]">217.83</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">EMA 200</span>
                  <span className="font-semibold text-[#C084FC]">203.45</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.05]">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Oscillators (14D)
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">RSI (14)</span>
                  <span className="font-semibold text-white">58.23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stochastic %K</span>
                  <span className="font-semibold text-white">64.10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MACD Level</span>
                  <span className="font-semibold text-[#00C896]">+1.23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MACD Signal</span>
                  <span className="font-semibold text-slate-300">+2.56</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "News" && (
          <div className="space-y-2.5 text-[11px]">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Institutional Wire
            </div>
            {[
              {
                time: "14m ago",
                source: "Bloomberg",
                title: "Apple Supply Chain Expands Advanced Silicon Fabrication",
              },
              {
                time: "1h ago",
                source: "Reuters",
                title: "Services Revenue Growth Accelerates in Enterprise Cloud",
              },
              {
                time: "3h ago",
                source: "SEC Filing",
                title: "Form 8-K: Shareholder Capital Return Authorization",
              },
            ].map((n, i) => (
              <div
                key={i}
                className="rounded border border-white/[0.05] bg-white/[0.02] p-2 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span className="font-medium text-blue-400">{n.source}</span>
                  <span>{n.time}</span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-200">
                  {n.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
