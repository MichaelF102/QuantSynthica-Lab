"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Info } from "lucide-react";

interface PortfolioEquityCurveWidgetProps {
  portfolioName?: string;
  benchmarkSymbol?: string;
  initialCapital?: number;
  currency?: "USD" | "INR" | "EUR" | "GBP";
}

// Generate realistic daily-like equity data matching the screenshot trajectory
function generateEquityData(initial: number = 100000) {
  const points: { date: string; displayDate: string; portfolio: number; benchmark: number; drawdown: number }[] = [];
  
  // Date range Jan 1 2023 to Jan 1 2024 (approx 52 weekly data points)
  const start = new Date(2023, 0, 1);
  const end = new Date(2024, 0, 1);
  const totalSteps = 53;
  
  let pVal = initial;
  let bVal = initial;
  let peak = pVal;

  for (let i = 0; i < totalSteps; i++) {
    const curDate = new Date(start.getTime() + (end.getTime() - start.getTime()) * (i / (totalSteps - 1)));
    const month = curDate.toLocaleString("default", { month: "short" });
    const year = curDate.getFullYear();
    const day = curDate.getDate();

    const t = i / (totalSteps - 1);

    // Shape synthetic path proportional to initial capital
    const seasonal = Math.sin(t * Math.PI * 4) * (initial * 0.06);
    const trend = t * (initial * 0.2234);
    const noise = ((i * 17) % 19 - 9) * (initial * 0.0045);
    
    // October dip around t ~ 0.8
    let dip = 0;
    if (t > 0.7 && t < 0.88) {
      dip = -Math.sin(((t - 0.7) / 0.18) * Math.PI) * (initial * 0.125);
    }

    if (i === totalSteps - 1) {
      pVal = Math.round(initial * 1.2234);
      bVal = Math.round(initial * 1.0952);
    } else {
      pVal = Math.round(initial + trend + seasonal + noise + dip);
      const bTrend = t * (initial * 0.0952);
      const bSeasonal = Math.sin(t * Math.PI * 3) * (initial * 0.032);
      bVal = Math.round(initial + bTrend + bSeasonal + noise * 0.4);
    }

    if (pVal > peak) peak = pVal;
    const dd = ((pVal - peak) / peak) * 100;

    const displayDate =
      day <= 7 || i === 0 || i === totalSteps - 1
        ? `${month} ${year}`
        : `${month} ${day}`;

    points.push({
      date: curDate.toISOString().split("T")[0],
      displayDate,
      portfolio: pVal,
      benchmark: bVal,
      drawdown: Number(dd.toFixed(2)),
    });
  }

  return points;
}

export default function PortfolioEquityCurveWidget({
  portfolioName = "Dual MA Crossover",
  benchmarkSymbol = "SPY",
  initialCapital = 100000,
  currency = "USD",
}: PortfolioEquityCurveWidgetProps) {
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL">("ALL");
  const [logScale, setLogScale] = useState(false);
  const [showDrawdownRightAxis, setShowDrawdownRightAxis] = useState(false);

  const currSymbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const rawData = useMemo(() => generateEquityData(initialCapital), [initialCapital]);

  const filteredData = useMemo(() => {
    if (timeframe === "ALL" || timeframe === "1Y") return rawData;
    if (timeframe === "6M") return rawData.slice(Math.floor(rawData.length / 2));
    if (timeframe === "3M") return rawData.slice(Math.floor(rawData.length * 0.75));
    if (timeframe === "1M") return rawData.slice(Math.floor(rawData.length * 0.9));
    if (timeframe === "YTD") return rawData.slice(Math.floor(rawData.length * 0.5));
    return rawData;
  }, [rawData, timeframe]);

  const lastPoint = filteredData[filteredData.length - 1] || {
    portfolio: 122340,
    benchmark: 109520,
  };

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between">
      {/* 1. Header & Inline Stats & Controls */}
      <div className="space-y-2.5 pb-2 border-b border-[#1A2230]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Info icon */}
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">
              Portfolio Equity Curve
            </h2>
            <button
              type="button"
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Interactive compounded equity trajectory vs benchmark"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Controls: Timeframe Pills & Log Scale Switch */}
          <div className="flex items-center space-x-3">
            {/* Timeframe Pills */}
            <div className="flex items-center bg-[#111722] border border-[#1F2B3E] rounded p-0.5 text-[11px] font-mono">
              {(["1M", "3M", "6M", "YTD", "1Y", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    timeframe === tf
                      ? "bg-[#0284C7] text-white font-bold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Log Scale Toggle */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="text-[11px]">Log Scale</span>
              <button
                type="button"
                onClick={() => setLogScale(!logScale)}
                className={`w-7 h-4 rounded-full transition-colors relative p-0.5 ${
                  logScale ? "bg-[#0284C7]" : "bg-[#1E293B]"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    logScale ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Inline KPI stats ribbon matching screenshot */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block">Final Value</span>
            <span className="text-white font-bold font-mono text-sm sm:text-base">
              {currSymbol}{lastPoint.portfolio.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Total Return</span>
            <span className="text-[#10B981] font-bold font-mono text-sm sm:text-base">
              +22.34%
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">CAGR</span>
            <span className="text-[#10B981] font-bold font-mono text-sm sm:text-base">
              20.12%
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Volatility</span>
            <span className="text-white font-bold font-mono text-sm sm:text-base">
              18.43%
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Max Drawdown</span>
            <span className="text-[#F43F5E] font-bold font-mono text-sm sm:text-base">
              -14.93%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Chart Area with Floating Endpoint Badges */}
      <div className="relative h-64 w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 12, right: 90, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#161E2C" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#475569"
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
              tickFormatter={(val: string) => {
                // e.g. "2023-01-01" -> "Jan 2023"
                const parts = val.split("-");
                const mIdx = parseInt(parts[1], 10) - 1;
                const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                // Only show every other month
                if (mIdx % 2 === 0) {
                  return `${mNames[mIdx]} ${parts[0]}`;
                }
                return "";
              }}
            />
            <YAxis
              scale={logScale ? "log" : "auto"}
              domain={["auto", "auto"]}
              stroke="#475569"
              tickLine={false}
              orientation="left"
              tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
              tickFormatter={(v: number) => {
                if (currency === "INR") {
                  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                  return `₹${Math.round(v / 1000)}k`;
                }
                if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                return `$${Math.round(v / 1000)}K`;
              }}
            />
            {showDrawdownRightAxis && (
              <YAxis
                yAxisId="dd"
                orientation="right"
                domain={[-30, 0]}
                stroke="#F43F5E"
                tickLine={false}
                tick={{ fontSize: 9, fill: "#F43F5E", fontFamily: "monospace" }}
                tickFormatter={(v: number) => `${v}%`}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "#0C1017",
                borderColor: "#202C3F",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#E2E8F0",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
              formatter={(val: any, name: string) => {
                if (name === "drawdown") return [`${val}%`, "Drawdown"];
                return [`${currSymbol}${Number(val).toLocaleString()}`, name === "portfolio" ? "Portfolio" : benchmarkSymbol];
              }}
              labelFormatter={(label: any) => `Date: ${label}`}
            />
            {/* Portfolio Line */}
            <Line
              type="monotone"
              dataKey="portfolio"
              name="portfolio"
              stroke="#38BDF8"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, fill: "#38BDF8", stroke: "#0C1017", strokeWidth: 2 }}
            />
            {/* Benchmark Line */}
            <Line
              type="monotone"
              dataKey="benchmark"
              name="benchmark"
              stroke="#64748B"
              strokeWidth={1.8}
              strokeDasharray="3 3"
              dot={false}
              activeDot={{ r: 3, fill: "#94A3B8" }}
            />
            {/* Optional Drawdown right-axis line */}
            {showDrawdownRightAxis && (
              <Line
                yAxisId="dd"
                type="monotone"
                dataKey="drawdown"
                name="drawdown"
                stroke="#F43F5E"
                strokeWidth={1.2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Floating Endpoint Badges matching screenshot */}
        <div className="absolute right-1.5 top-14 flex flex-col items-end space-y-3 pointer-events-none">
          {/* Top Badge: Portfolio */}
          <div className="bg-[#0284C7] text-white px-2.5 py-1 rounded shadow-lg border border-[#38BDF8]/40 text-right">
            <div className="text-[11px] font-bold font-mono leading-none">
              {currSymbol}{lastPoint.portfolio.toLocaleString()}
            </div>
            <div className="text-[9px] font-mono text-[#E0F2FE] leading-none mt-0.5">
              (+22.34%)
            </div>
          </div>

          {/* Bottom Badge: Benchmark */}
          <div className="bg-[#182232] text-slate-200 px-2.5 py-1 rounded shadow-lg border border-[#2B3B52] text-right">
            <div className="text-[11px] font-bold font-mono leading-none text-slate-100">
              {currSymbol}{lastPoint.benchmark.toLocaleString()}
            </div>
            <div className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
              (+9.52%)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legend Strip */}
      <div className="flex flex-wrap items-center justify-start gap-4 pt-2 border-t border-[#161F2C] text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="w-4 h-0.5 bg-[#38BDF8] inline-block rounded" />
          <span className="text-[11px] font-medium">Portfolio ({portfolioName})</span>
        </div>

        <div className="flex items-center space-x-2 text-slate-400">
          <span className="w-4 h-0.5 border-t border-dashed border-[#64748B] inline-block" />
          <span className="text-[11px] font-medium">{benchmarkSymbol} (Benchmark)</span>
        </div>

        <button
          type="button"
          onClick={() => setShowDrawdownRightAxis(!showDrawdownRightAxis)}
          className={`flex items-center space-x-1.5 text-[11px] px-2 py-0.5 rounded border transition-colors ${
            showDrawdownRightAxis
              ? "bg-[#F43F5E]/10 border-[#F43F5E]/40 text-[#F43F5E]"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E]/30 inline-block border border-[#F43F5E]" />
          <span>Drawdown (Right Axis)</span>
        </button>
      </div>
    </div>
  );
}
