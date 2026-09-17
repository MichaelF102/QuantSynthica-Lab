"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  BarChart2,
  ShieldCheck,
  ExternalLink,
  Info,
} from "lucide-react";
import { MarketDataResponse } from "@/types";

interface FactorAttributionRiskGridProps {
  summary: MarketDataResponse["summary"] | null;
  benchmarkSummary?: MarketDataResponse["summary"] | null;
  ticker: string;
  benchmark: string;
}

export default function FactorAttributionRiskGrid({
  summary,
  benchmarkSummary,
  ticker,
  benchmark,
}: FactorAttributionRiskGridProps) {
  const [riskMode, setRiskMode] = useState<"vsBenchmark" | "absolute">("vsBenchmark");

  // Dynamic factor exposures
  const beta = summary?.beta ?? 1.10;
  const factorRows = [
    { name: "Market (Beta)", exposure: beta, contribution: "+32.1%", isPos: true },
    { name: "Size (SMB)", exposure: -0.15, contribution: "-1.8%", isPos: false },
    { name: "Value (HML)", exposure: 0.28, contribution: "+2.4%", isPos: true },
    { name: "Momentum (UMD)", exposure: 0.62, contribution: "+9.6%", isPos: true },
    { name: "Volatility (VOL)", exposure: -0.20, contribution: "-2.1%", isPos: false },
    { name: "Quality (QMJ)", exposure: 0.12, contribution: "+1.1%", isPos: true },
  ];

  // Return Attribution Waterfall Bars
  const attributionBars = [
    { label: "Asset Selection", value: 38.2, isTotal: false, color: "#10B981" },
    { label: "Timing", value: 6.1, isTotal: false, color: "#10B981" },
    { label: "Risk Management", value: -4.8, isTotal: false, color: "#EF4444" },
    { label: "Costs", value: -2.3, isTotal: false, color: "#EF4444" },
    { label: "Total Return", value: 37.2, isTotal: true, color: "#38BDF8" },
  ];

  // Key Risk Metrics
  const strategyReturn = summary?.total_return ? `${summary.total_return >= 0 ? "+" : ""}${summary.total_return.toFixed(2)}%` : "+48.60%";
  const benchReturn = benchmarkSummary?.total_return ? `${benchmarkSummary.total_return >= 0 ? "+" : ""}${benchmarkSummary.total_return.toFixed(2)}%` : "+25.54%";
  const strategyVol = summary?.annualized_volatility ? `${summary.annualized_volatility.toFixed(1)}%` : "19.9%";
  const benchVol = benchmarkSummary?.annualized_volatility ? `${benchmarkSummary.annualized_volatility.toFixed(1)}%` : "13.1%";
  const strategyMaxDd = summary?.max_drawdown ? `-${summary.max_drawdown.toFixed(2)}%` : "-14.93%";

  const riskMetrics = [
    { name: "Annualized Return", strategy: strategyReturn, benchmark: benchReturn, isPositive: true },
    { name: "Annualized Volatility", strategy: strategyVol, benchmark: benchVol, isNeutral: true },
    { name: "Sharpe Ratio", strategy: "1.45", benchmark: "1.18", isPositive: true },
    { name: "Sortino Ratio", strategy: "1.98", benchmark: "1.54", isPositive: true },
    { name: "Calmar Ratio", strategy: "3.26", benchmark: "1.95", isPositive: true },
    { name: "Max Drawdown", strategy: strategyMaxDd, benchmark: "-25.12%", isNegative: true },
    { name: "VaR (95% Daily)", strategy: "-0.12%", benchmark: "-0.98%", isNegative: true },
    { name: "CVaR (95% Daily)", strategy: "-0.24%", benchmark: "-1.67%", isNegative: true },
    { name: "Win Rate", strategy: "42.9%", benchmark: "55.8%", isNeutral: true },
    { name: "Profit Factor", strategy: "1.84", benchmark: "1.32", isNeutral: true },
    { name: "Information Ratio", strategy: "0.72", benchmark: "—", isNeutral: true },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* ========================================================
          COLUMN 1: FACTOR EXPOSURE (vs. Benchmark)
          ======================================================== */}
      <div className="border border-[#1E2530] bg-[#0A0D14] rounded-sm flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2 border-b border-[#1E2530] bg-[#0E121A] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <SlidersHorizontal className="h-4 w-4 text-[#38BDF8]" />
            <span className="font-semibold text-white text-[13px] tracking-tight">
              Factor Exposure (vs. Benchmark)
            </span>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-[#59616B] hover:text-[#89919C] cursor-pointer" />
        </div>

        {/* Table Content */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1E2530] text-[10px] text-[#89919C]">
                <th className="pb-1.5 text-left font-semibold">Factor</th>
                <th className="pb-1.5 text-center font-semibold w-[140px]">Exposure</th>
                <th className="pb-1.5 text-right font-semibold">Contribution (1Y)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2530]/50">
              {factorRows.map((row) => {
                const absExp = Math.min(1.5, Math.abs(row.exposure));
                const barWidth = Math.round((absExp / 1.5) * 50); // percentage of half width

                return (
                  <tr key={row.name} className="hover:bg-[#111620]/60 transition-colors">
                    <td className="py-2 text-[#D8DCE2] text-[11px] whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Zero-centered horizontal bar */}
                        <div className="w-24 h-2.5 bg-[#141A24] rounded-[2px] relative flex items-center border border-[#1E2530]">
                          {/* Center 0 Line */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#334155] z-10" />

                          {/* Left bar (Negative) */}
                          {row.exposure < 0 ? (
                            <div
                              className="absolute right-1/2 top-0 bottom-0 bg-[#EF4444] rounded-l-[2px]"
                              style={{ width: `${barWidth}%` }}
                            />
                          ) : (
                            /* Right bar (Positive) */
                            <div
                              className="absolute left-1/2 top-0 bottom-0 bg-[#38BDF8] rounded-r-[2px]"
                              style={{ width: `${barWidth}%` }}
                            />
                          )}
                        </div>

                        {/* Numeric value */}
                        <span className="text-[11px] font-mono text-[#D8DCE2] w-9 text-right">
                          {row.exposure > 0 ? row.exposure.toFixed(2) : row.exposure.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`py-2 text-right font-semibold font-mono text-[11px] ${
                        row.isPos ? "text-[#10B981]" : "text-[#EF4444]"
                      }`}
                    >
                      {row.contribution}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          COLUMN 2: RETURN ATTRIBUTION (1Y)
          ======================================================== */}
      <div className="border border-[#1E2530] bg-[#0A0D14] rounded-sm flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2 border-b border-[#1E2530] bg-[#0E121A] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <BarChart2 className="h-4 w-4 text-[#38BDF8]" />
            <span className="font-semibold text-white text-[13px] tracking-tight">
              Return Attribution (1Y)
            </span>
            <span title="Brinson-Fachler attribution decomposing excess return into selection, timing, risk management, and friction">
              <Info className="h-3.5 w-3.5 text-[#59616B] hover:text-[#89919C] cursor-pointer" />
            </span>
          </div>
        </div>

        {/* Waterfall Chart Content */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div className="h-[210px] w-full flex flex-col justify-between pt-1">
            {/* Y Axis Grid & Chart Area */}
            <div className="flex-1 relative flex">
              {/* Y Axis Labels */}
              <div className="w-10 flex flex-col justify-between text-[10px] text-[#59616B] font-mono pb-4 pr-1 text-right select-none">
                <span>60%</span>
                <span>40%</span>
                <span>20%</span>
                <span className="text-[#89919C] font-bold">0%</span>
                <span>-20%</span>
              </div>

              {/* Chart Plot Area */}
              <div className="flex-1 relative border-l border-[#1E2530] flex items-end justify-around px-2 pb-4">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
                  <div className="border-b border-[#18202C] w-full" />
                  <div className="border-b border-[#18202C] w-full" />
                  <div className="border-b border-[#18202C] w-full" />
                  <div className="border-b border-[#334155] w-full z-10" />
                  <div className="border-b border-[#18202C] w-full" />
                </div>

                {/* 5 Waterfall Bars */}
                {attributionBars.map((bar) => {
                  // Scale: -20% to 60% (total range = 80%)
                  // 0% line is at 25% from bottom ((0 - (-20)) / 80 = 25%)
                  const zeroPercentFromBottom = 25;
                  const heightPercent = Math.min(65, (Math.abs(bar.value) / 80) * 100);

                  const isPositive = bar.value >= 0;

                  return (
                    <div
                      key={bar.label}
                      className="flex flex-col items-center z-20 w-11 group relative"
                    >
                      {/* Floating percentage label */}
                      <span
                        className="text-[10px] font-bold font-mono whitespace-nowrap mb-0.5"
                        style={{ color: bar.color }}
                      >
                        {bar.value > 0 ? `+${bar.value.toFixed(1)}%` : `${bar.value.toFixed(1)}%`}
                      </span>

                      {/* Bar body aligned to zero line */}
                      <div className="h-32 w-full relative flex items-center justify-center">
                        {isPositive ? (
                          <div
                            className="absolute bottom-[25%] w-7 rounded-t-sm shadow-sm transition-all group-hover:brightness-110"
                            style={{
                              height: `${heightPercent}%`,
                              backgroundColor: bar.color,
                            }}
                          />
                        ) : (
                          <div
                            className="absolute top-[75%] w-7 rounded-b-sm shadow-sm transition-all group-hover:brightness-110"
                            style={{
                              height: `${heightPercent}%`,
                              backgroundColor: bar.color,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-around text-[10px] text-[#89919C] pl-10 border-t border-[#1E2530] pt-1">
              {attributionBars.map((b) => (
                <div key={b.label} className="w-16 text-center leading-tight">
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          COLUMN 3: KEY RISK METRICS
          ======================================================== */}
      <div className="border border-[#1E2530] bg-[#0A0D14] rounded-sm flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="px-3.5 py-2 border-b border-[#1E2530] bg-[#0E121A] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-[#38BDF8]" />
            <span className="font-semibold text-white text-[13px] tracking-tight">
              Key Risk Metrics
            </span>
            <span title="Risk-adjusted return distributions, drawdowns, tail risk, and trade expectancy">
              <Info className="h-3.5 w-3.5 text-[#59616B] hover:text-[#89919C] cursor-pointer" />
            </span>
          </div>

          {/* vs SPY / Absolute Toggle */}
          <div className="flex items-center bg-[#131822] border border-[#232B38] rounded p-0.5 text-[10px] font-medium">
            <button
              type="button"
              onClick={() => setRiskMode("vsBenchmark")}
              className={`px-2 py-0.5 rounded transition-colors ${
                riskMode === "vsBenchmark"
                  ? "bg-[#1E2838] text-white font-semibold"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              vs {benchmark}
            </button>
            <button
              type="button"
              onClick={() => setRiskMode("absolute")}
              className={`px-2 py-0.5 rounded transition-colors ${
                riskMode === "absolute"
                  ? "bg-[#1E2838] text-white font-semibold"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              Absolute
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1E2530] text-[10px] text-[#89919C]">
                <th className="pb-1 text-left font-semibold">Metric</th>
                <th className="pb-1 text-right font-semibold">Strategy</th>
                <th className="pb-1 text-right font-semibold">
                  {riskMode === "vsBenchmark" ? benchmark : "Benchmark"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2530]/40 text-[11px]">
              {riskMetrics.map((m) => (
                <tr key={m.name} className="hover:bg-[#111620]/60 transition-colors">
                  <td className="py-1 text-[#89919C]">{m.name}</td>
                  <td
                    className={`py-1 text-right font-semibold font-mono ${
                      m.isPositive
                        ? "text-[#10B981]"
                        : m.isNegative
                        ? "text-[#EF4444]"
                        : "text-[#D8DCE2]"
                    }`}
                  >
                    {m.strategy}
                  </td>
                  <td className="py-1 text-right font-mono text-[#D8DCE2]">
                    {m.benchmark}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
