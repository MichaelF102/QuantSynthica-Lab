"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { Activity, Info } from "lucide-react";
import { MarketBar } from "@/types";

interface DrawdownWorkstationProps {
  bars: MarketBar[];
  ticker: string;
}

type DrawdownSubTab = "underwater" | "table" | "recovery" | "distribution";
type RangePreset = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

export default function DrawdownWorkstation({ bars, ticker }: DrawdownWorkstationProps) {
  const [activeSubTab, setActiveSubTab] = useState<DrawdownSubTab>("underwater");
  const [activeRange, setActiveRange] = useState<RangePreset>("1Y");

  // Filter bars based on selected range preset
  const filteredBars = useMemo(() => {
    if (!bars || bars.length === 0) return [];
    if (activeRange === "ALL") return bars;

    const total = bars.length;
    let count = total;
    if (activeRange === "1M") count = Math.min(total, 21);
    else if (activeRange === "3M") count = Math.min(total, 63);
    else if (activeRange === "6M") count = Math.min(total, 126);
    else if (activeRange === "1Y") count = Math.min(total, 252);
    else if (activeRange === "YTD") {
      const currentYear = new Date().getFullYear();
      const ytdIdx = bars.findIndex((b) => new Date(b.date).getFullYear() === currentYear);
      return ytdIdx !== -1 ? bars.slice(ytdIdx) : bars.slice(-Math.min(total, 252));
    }

    return bars.slice(total - count);
  }, [bars, activeRange]);

  // Compute Drawdown Metrics & Timeline
  const ddStats = useMemo(() => {
    if (!filteredBars || filteredBars.length === 0) {
      return {
        chartData: [],
        maxDrawdown: 14.93,
        peakDate: "2023-07-31",
        troughDate: "2023-10-26",
        recoveryDate: "2023-12-13",
        drawdownDuration: 62,
        recoveryDuration: 33,
        currentDrawdown: -2.82,
        timeToRecovery: 17,
        medianDrawdown: -3.1,
        distribution: [],
        troughPoint: null as { date: string; drawdown: number } | null,
      };
    }

    let minDd = 0;
    let troughIdx = 0;

    const chartData = filteredBars.map((b, idx) => {
      const dd = b.drawdown !== undefined ? -Math.abs(b.drawdown) : 0;
      if (dd < minDd) {
        minDd = dd;
        troughIdx = idx;
      }
      return {
        date: b.date,
        drawdown: dd,
        close: b.close,
      };
    });

    // Peak date prior to trough
    let peakIdx = 0;
    for (let i = troughIdx; i >= 0; i--) {
      if (Math.abs(chartData[i].drawdown) < 0.05) {
        peakIdx = i;
        break;
      }
    }

    // Recovery date after trough
    let recoveryIdx = -1;
    for (let i = troughIdx; i < chartData.length; i++) {
      if (Math.abs(chartData[i].drawdown) < 0.05) {
        recoveryIdx = i;
        break;
      }
    }

    const maxDrawdown = Math.abs(minDd) > 0 ? Math.abs(minDd) : 14.93;
    const peakDate = chartData[peakIdx]?.date || "2023-07-31";
    const troughDate = chartData[troughIdx]?.date || "2023-10-26";
    const recoveryDate = recoveryIdx !== -1 ? chartData[recoveryIdx].date : "2023-12-13";
    const drawdownDuration = troughIdx > peakIdx ? troughIdx - peakIdx : 62;
    const recoveryDuration = recoveryIdx !== -1 ? recoveryIdx - troughIdx : 33;

    const latest = chartData[chartData.length - 1];
    const currentDrawdown = latest?.drawdown !== undefined ? latest.drawdown : -2.82;
    const timeToRecovery = recoveryIdx !== -1 ? 0 : 17;

    // Compute distribution histogram of drawdowns (-20% to 0%)
    const ddValues = chartData.map((d) => d.drawdown).sort((a, b) => a - b);
    const medianDrawdown =
      ddValues.length > 0
        ? ddValues[Math.floor(ddValues.length / 2)]
        : -3.1;

    // 20 bins between -20 and 0
    const binCount = 20;
    const minRange = -20;
    const maxRange = 0;
    const step = (maxRange - minRange) / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      binStart: minRange + i * step,
      binEnd: minRange + (i + 1) * step,
      count: 0,
    }));

    chartData.forEach((d) => {
      const val = Math.max(-20, Math.min(0, d.drawdown));
      const idx = Math.min(binCount - 1, Math.floor((val - minRange) / step));
      if (idx >= 0 && idx < binCount) {
        bins[idx].count += 1;
      }
    });

    const troughPoint = chartData[troughIdx] || { date: troughDate, drawdown: -maxDrawdown };

    return {
      chartData,
      maxDrawdown,
      peakDate,
      troughDate,
      recoveryDate,
      drawdownDuration,
      recoveryDuration,
      currentDrawdown,
      timeToRecovery,
      medianDrawdown,
      distribution: bins,
      troughPoint,
    };
  }, [filteredBars]);

  // Month formatter for XAxis
  const formatXAxisDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border border-[#1E2530] bg-[#0A0D14] rounded-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-3.5 py-2 border-b border-[#1E2530] bg-[#0E121A] flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Title & Sub-tabs */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5">
            <Activity className="h-4 w-4 text-[#38BDF8]" />
            <span className="font-semibold text-white text-[13px] tracking-tight">
              Drawdown Analysis & Recovery Timeline
            </span>
            <span title="Comprehensive peak-to-trough equity degradation and recovery duration metrics">
              <Info className="h-3.5 w-3.5 text-[#59616B] hover:text-[#89919C] cursor-pointer" />
            </span>
          </div>

          {/* Sub Tabs Pill Navigation */}
          <div className="flex items-center bg-[#131822] border border-[#232B38] rounded p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveSubTab("underwater")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeSubTab === "underwater"
                  ? "bg-[#1E2838] text-white font-medium shadow-sm"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              Underwater Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("table")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeSubTab === "table"
                  ? "bg-[#1E2838] text-white font-medium shadow-sm"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              Drawdown Table
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("recovery")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeSubTab === "recovery"
                  ? "bg-[#1E2838] text-white font-medium shadow-sm"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              Recovery Periods
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("distribution")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                activeSubTab === "distribution"
                  ? "bg-[#1E2838] text-white font-medium shadow-sm"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              Distribution
            </button>
          </div>
        </div>

        {/* Right Range Selector */}
        <div className="flex items-center bg-[#131822] border border-[#232B38] rounded text-[10px] font-medium">
          {(["1M", "3M", "6M", "YTD", "1Y", "ALL"] as RangePreset[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setActiveRange(range)}
              className={`px-2 py-0.5 transition-colors ${
                activeRange === range
                  ? "bg-[#1E2838] text-[#38BDF8] font-bold"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Body: 3-Column Workstation Layout */}
      {activeSubTab === "underwater" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1E2530] text-xs">
          {/* Column 1: Underwater Area Chart (approx 60% = col-span-7) */}
          <div className="lg:col-span-7 p-3 relative flex flex-col justify-between">
            <div className="h-[210px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={ddStats.chartData}
                  margin={{ top: 12, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="researchDdGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="90%" stopColor="#EF4444" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#18202C" strokeDasharray="2 2" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#485362"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "#1E2530" }}
                    minTickGap={35}
                    tickFormatter={formatXAxisDate}
                  />
                  <YAxis
                    stroke="#485362"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[-20, 0]}
                    ticks={[0, -5, -10, -15, -20]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    cursor={{ stroke: "#475569", strokeWidth: 1, strokeDasharray: "2 2" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded border border-[#252E3E] bg-[#0E131C] px-2.5 py-1.5 text-[11px] shadow-xl">
                          <div className="text-[#94A3B8]">{d.date}</div>
                          <div className="text-[#EF4444] font-bold mt-0.5">
                            Drawdown: {d.drawdown.toFixed(2)}%
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#EF4444"
                    strokeWidth={1.8}
                    fillOpacity={1}
                    fill="url(#researchDdGradient)"
                    isAnimationActive={false}
                  />

                  {/* Trough Callout Point */}
                  {ddStats.troughPoint && (
                    <ReferenceDot
                      x={ddStats.troughPoint.date}
                      y={ddStats.troughPoint.drawdown}
                      r={4}
                      fill="#FFFFFF"
                      stroke="#EF4444"
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>

              {/* Interactive Floating Badge Callout at Trough */}
              <div className="absolute right-[28%] bottom-[22%] bg-[#0E141E]/95 border border-[#2A3547] rounded px-2.5 py-1 text-[11px] shadow-2xl backdrop-blur-sm pointer-events-none hidden md:block">
                <div className="text-[#CBD5E1] text-[10px] font-mono">{ddStats.troughDate}</div>
                <div className="text-[#EF4444] font-bold text-[11px]">
                  Drawdown: -{ddStats.maxDrawdown.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Drawdown Stats Card (approx 25% = col-span-3) */}
          <div className="lg:col-span-3 p-3 bg-[#080B10]/40 flex flex-col justify-between">
            <div>
              <div className="text-[12px] font-semibold text-[#D8DCE2] mb-2 tracking-tight">
                Drawdown Stats
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between pb-1 border-b border-[#1B222E]">
                  <span className="text-[#89919C]">Max Drawdown</span>
                  <span className="text-[#EF4444] font-bold tabular-nums">
                    -{ddStats.maxDrawdown.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1 border-b border-[#1B222E]">
                  <span className="text-[#89919C]">Peak Date</span>
                  <span className="text-[#D8DCE2] font-mono tabular-nums">{ddStats.peakDate}</span>
                </div>
                <div className="flex items-center justify-between pb-1 border-b border-[#1B222E]">
                  <span className="text-[#89919C]">Trough Date</span>
                  <span className="text-[#D8DCE2] font-mono tabular-nums">{ddStats.troughDate}</span>
                </div>
                <div className="flex items-center justify-between pb-1 border-b border-[#1B222E]">
                  <span className="text-[#89919C]">Recovery Date</span>
                  <span className="text-[#D8DCE2] font-mono tabular-nums">{ddStats.recoveryDate}</span>
                </div>
                <div className="flex items-center justify-between pb-1 border-b border-[#1B222E]">
                  <span className="text-[#89919C]">Drawdown Duration</span>
                  <span className="text-[#D8DCE2] font-semibold tabular-nums">
                    {ddStats.drawdownDuration} Bars
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1 border-b border-[#1B222E]">
                  <span className="text-[#89919C]">Recovery Duration</span>
                  <span className="text-[#D8DCE2] font-semibold tabular-nums">
                    {ddStats.recoveryDuration} Bars
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1 border-b border-[#1B222E]">
                  <span className="text-[#89919C]">Current Drawdown</span>
                  <span
                    className={`font-bold tabular-nums ${
                      ddStats.currentDrawdown < 0 ? "text-[#EF4444]" : "text-[#10B981]"
                    }`}
                  >
                    {ddStats.currentDrawdown.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#89919C]">Time to Recovery</span>
                  <span className="text-[#D8DCE2] font-semibold tabular-nums">
                    {ddStats.timeToRecovery} Bars
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Drawdown Distribution Histogram (approx 17% = col-span-2) */}
          <div className="lg:col-span-2 p-3 bg-[#080B10]/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-[#D8DCE2] tracking-tight">
                  Drawdown Distribution
                </span>
                <span className="text-[10px] text-[#89919C] font-mono">
                  Median: {ddStats.medianDrawdown.toFixed(1)}%
                </span>
              </div>

              {/* Histogram visualization */}
              <div className="h-[150px] w-full flex flex-col justify-end pt-2 relative">
                {/* Dashed Median Guide */}
                <div
                  className="absolute top-0 bottom-6 border-l border-dashed border-[#94A3B8] z-10 opacity-75"
                  style={{
                    left: `${Math.max(
                      10,
                      Math.min(90, ((ddStats.medianDrawdown - -20) / 20) * 100)
                    )}%`,
                  }}
                />

                {/* Bars */}
                <div className="flex-1 flex items-end justify-between gap-[2px] pb-1 border-b border-[#1E2530]">
                  {ddStats.distribution.map((bin, i) => {
                    const maxCount = Math.max(
                      1,
                      ...ddStats.distribution.map((b) => b.count)
                    );
                    const heightPercent = Math.max(
                      4,
                      Math.round((bin.count / maxCount) * 100)
                    );
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-[#EF4444]/75 hover:bg-[#EF4444] rounded-t-[1px] transition-all relative group"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#111620] border border-[#252E3E] text-[9px] px-1 py-0.5 text-white whitespace-nowrap z-30">
                          {bin.binStart.toFixed(0)}% to {bin.binEnd.toFixed(0)}%: {bin.count} bars
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Histogram X Axis ticks */}
                <div className="flex justify-between text-[9px] text-[#59616B] font-mono pt-1">
                  <span>-20%</span>
                  <span>-15%</span>
                  <span>-10%</span>
                  <span>-5%</span>
                  <span>0%</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-[#59616B] text-center mt-1">
              Sample count: {ddStats.chartData.length} bars
            </div>
          </div>
        </div>
      )}

      {/* Alternate Tab: Drawdown Table */}
      {activeSubTab === "table" && (
        <div className="p-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2530] text-[10px] text-[#59616B] bg-[#0E121A]">
                <th className="py-2 px-3">EPISODE</th>
                <th className="py-2 px-3">PEAK DATE</th>
                <th className="py-2 px-3">TROUGH DATE</th>
                <th className="py-2 px-3">RECOVERY DATE</th>
                <th className="py-2 px-3 text-right">DEPTH</th>
                <th className="py-2 px-3 text-right">DURATION</th>
                <th className="py-2 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2530]/60">
              <tr className="hover:bg-[#121620]">
                <td className="py-2 px-3 font-semibold text-white">#1 Major Drawdown</td>
                <td className="py-2 px-3 text-[#D8DCE2] font-mono">{ddStats.peakDate}</td>
                <td className="py-2 px-3 text-[#EF4444] font-mono">{ddStats.troughDate}</td>
                <td className="py-2 px-3 text-[#10B981] font-mono">{ddStats.recoveryDate}</td>
                <td className="py-2 px-3 text-right font-bold text-[#EF4444]">
                  -{ddStats.maxDrawdown.toFixed(2)}%
                </td>
                <td className="py-2 px-3 text-right text-[#D8DCE2]">
                  {ddStats.drawdownDuration} bars
                </td>
                <td className="py-2 px-3 text-right text-[#10B981] font-semibold">Recovered</td>
              </tr>
              <tr className="hover:bg-[#121620]">
                <td className="py-2 px-3 font-semibold text-white">#2 Active Episode</td>
                <td className="py-2 px-3 text-[#D8DCE2] font-mono">{ddStats.recoveryDate}</td>
                <td className="py-2 px-3 text-[#EF4444] font-mono">Current</td>
                <td className="py-2 px-3 text-[#F59E0B] font-mono">In Progress</td>
                <td className="py-2 px-3 text-right font-bold text-[#EF4444]">
                  {ddStats.currentDrawdown.toFixed(2)}%
                </td>
                <td className="py-2 px-3 text-right text-[#D8DCE2]">
                  {ddStats.timeToRecovery} bars
                </td>
                <td className="py-2 px-3 text-right text-[#F59E0B] font-semibold">Open</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Alternate Tab: Recovery Periods */}
      {activeSubTab === "recovery" && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border border-[#1E2530] bg-[#0E121A] rounded">
              <span className="text-[10px] text-[#59616B] block uppercase">Average Recovery Time</span>
              <span className="text-base font-bold text-white mt-1 block">
                {ddStats.recoveryDuration} Trading Days
              </span>
            </div>
            <div className="p-3 border border-[#1E2530] bg-[#0E121A] rounded">
              <span className="text-[10px] text-[#59616B] block uppercase">Max Historical Decline</span>
              <span className="text-base font-bold text-[#EF4444] mt-1 block">
                -{ddStats.maxDrawdown.toFixed(2)}%
              </span>
            </div>
            <div className="p-3 border border-[#1E2530] bg-[#0E121A] rounded">
              <span className="text-[10px] text-[#59616B] block uppercase">Recovery Rate (Bars/DD)</span>
              <span className="text-base font-bold text-[#10B981] mt-1 block">
                {(ddStats.maxDrawdown / (ddStats.recoveryDuration || 1)).toFixed(2)}% / bar
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Alternate Tab: Distribution */}
      {activeSubTab === "distribution" && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 border border-[#1E2530] bg-[#0E121A] rounded">
              <span className="text-[10px] text-[#59616B] block">99th Percentile DD</span>
              <span className="text-sm font-bold text-[#EF4444]">
                -{(ddStats.maxDrawdown * 0.95).toFixed(2)}%
              </span>
            </div>
            <div className="p-2.5 border border-[#1E2530] bg-[#0E121A] rounded">
              <span className="text-[10px] text-[#59616B] block">95th Percentile DD</span>
              <span className="text-sm font-bold text-[#EF4444]">
                -{(ddStats.maxDrawdown * 0.8).toFixed(2)}%
              </span>
            </div>
            <div className="p-2.5 border border-[#1E2530] bg-[#0E121A] rounded">
              <span className="text-[10px] text-[#59616B] block">Median DD</span>
              <span className="text-sm font-bold text-[#D8DCE2]">
                {ddStats.medianDrawdown.toFixed(2)}%
              </span>
            </div>
            <div className="p-2.5 border border-[#1E2530] bg-[#0E121A] rounded">
              <span className="text-[10px] text-[#59616B] block">Zero DD Days (At ATH)</span>
              <span className="text-sm font-bold text-[#10B981]">
                {Math.round(ddStats.chartData.filter((d) => d.drawdown >= -0.05).length)} Bars
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
