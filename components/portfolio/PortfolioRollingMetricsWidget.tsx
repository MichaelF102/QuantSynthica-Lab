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

type RollingMetric = "Rolling Return" | "Rolling Sharpe" | "Rolling Volatility" | "Rolling Beta";
type RollingTimeframe = "3M" | "6M" | "1Y" | "ALL";

interface RollingDataPoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

// Generate realistic rolling metrics time series data matching the screenshot trajectory
function generateRollingData(metric: RollingMetric): RollingDataPoint[] {
  const points: RollingDataPoint[] = [];
  const start = new Date(2023, 0, 1);
  const end = new Date(2024, 0, 1);
  const totalSteps = 45;

  for (let i = 0; i < totalSteps; i++) {
    const curDate = new Date(start.getTime() + (end.getTime() - start.getTime()) * (i / (totalSteps - 1)));
    const dateStr = curDate.toISOString().split("T")[0];
    const t = i / (totalSteps - 1);

    let p = 0;
    let b = 0;

    if (metric === "Rolling Return") {
      // Portfolio moves from ~ -5% in early 2023 up to ~+35% by year-end, finishing around 22.34%
      p = -8 + t * 34 + Math.sin(t * Math.PI * 3.5) * 8 + ((i * 7) % 5 - 2) * 1.5;
      b = -4 + t * 14 + Math.sin(t * Math.PI * 2.8) * 4 + ((i * 5) % 4 - 2) * 0.8;
      if (i === totalSteps - 1) {
        p = 22.34;
        b = 9.52;
      }
    } else if (metric === "Rolling Sharpe") {
      p = 0.6 + t * 0.7 + Math.sin(t * Math.PI * 3) * 0.25;
      b = 0.5 + t * 0.3 + Math.sin(t * Math.PI * 2) * 0.15;
      if (i === totalSteps - 1) {
        p = 1.21;
        b = 0.75;
      }
    } else if (metric === "Rolling Volatility") {
      p = 22 - t * 4 + Math.sin(t * Math.PI * 3.2) * 2;
      b = 24 - t * 2 + Math.sin(t * Math.PI * 2.5) * 1.5;
      if (i === totalSteps - 1) {
        p = 18.43;
        b = 22.63;
      }
    } else {
      // Rolling Beta
      p = 0.95 - t * 0.2 + Math.sin(t * Math.PI * 2.8) * 0.08;
      b = 1.0;
      if (i === totalSteps - 1) {
        p = 0.78;
        b = 1.0;
      }
    }

    points.push({
      date: dateStr,
      portfolio: Number(p.toFixed(2)),
      benchmark: Number(b.toFixed(2)),
    });
  }

  return points;
}

export default function PortfolioRollingMetricsWidget({
  benchmarkSymbol = "SPY",
}: {
  benchmarkSymbol?: string;
}) {
  const [activeMetric, setActiveMetric] = useState<RollingMetric>("Rolling Return");
  const [timeframe, setTimeframe] = useState<RollingTimeframe>("1Y");

  const data = useMemo(() => generateRollingData(activeMetric), [activeMetric]);

  const stats = useMemo(() => {
    switch (activeMetric) {
      case "Rolling Return":
        return {
          portfolio: "22.34%",
          benchmark: "9.52%",
          diff: "+12.82%",
          label: "Outperformance",
          unit: "%",
        };
      case "Rolling Sharpe":
        return {
          portfolio: "1.21",
          benchmark: "0.75",
          diff: "+0.46",
          label: "Sharpe Spread",
          unit: "",
        };
      case "Rolling Volatility":
        return {
          portfolio: "18.43%",
          benchmark: "22.63%",
          diff: "-4.20%",
          label: "Vol Reduction",
          unit: "%",
        };
      case "Rolling Beta":
        return {
          portfolio: "0.78",
          benchmark: "1.00",
          diff: "-0.22",
          label: "Beta Delta",
          unit: "",
        };
    }
  }, [activeMetric]);

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between">
      {/* 1. Header & Controls */}
      <div className="space-y-2.5 pb-2 border-b border-[#1A2230]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Title */}
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">
              Rolling Performance Metrics
            </h2>
            <button
              type="button"
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Rolling risk-adjusted metrics calculated across shifting windows"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeframe pills */}
          <div className="flex items-center bg-[#111722] border border-[#1F2B3E] rounded p-0.5 text-[11px] font-mono">
            {(["3M", "6M", "1Y", "ALL"] as const).map((tf) => (
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
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {(["Rolling Return", "Rolling Sharpe", "Rolling Volatility", "Rolling Beta"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setActiveMetric(m)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeMetric === m
                  ? "bg-[#0284C7] text-white font-semibold shadow-sm"
                  : "bg-[#111722] text-slate-400 hover:text-slate-200 border border-[#1C2636]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Chart Area + Right Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 pt-3">
        {/* Left 3 cols: Line Chart */}
        <div className="lg:col-span-3 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 10, left: -10, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#161E2C" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#475569"
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
                tickFormatter={(val: string) => {
                  const parts = val.split("-");
                  const mIdx = parseInt(parts[1], 10) - 1;
                  const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  if (mIdx % 2 === 0) {
                    return `${mNames[mIdx]} ${parts[0]}`;
                  }
                  return "";
                }}
              />
              <YAxis
                domain={activeMetric === "Rolling Return" ? [-20, 60] : ["auto", "auto"]}
                stroke="#475569"
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
                tickFormatter={(v: number) =>
                  activeMetric === "Rolling Return" || activeMetric === "Rolling Volatility"
                    ? `${v}%`
                    : `${v}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0C1017",
                  borderColor: "#202C3F",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#E2E8F0",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
                formatter={(val: any, name: string) => [
                  `${val}${stats.unit}`,
                  name === "portfolio" ? "Portfolio" : benchmarkSymbol,
                ]}
                labelFormatter={(label: any) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="portfolio"
                name="portfolio"
                stroke="#38BDF8"
                strokeWidth={2.2}
                dot={false}
                activeDot={{ r: 4, fill: "#38BDF8", stroke: "#0C1017", strokeWidth: 2 }}
              />
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
            </LineChart>
          </ResponsiveContainer>

          {/* Bottom Chart Legend */}
          <div className="flex items-center space-x-4 pt-1 text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3.5 h-0.5 bg-[#38BDF8] inline-block rounded" />
              <span>Portfolio</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-3.5 h-0.5 border-t border-dashed border-[#64748B] inline-block" />
              <span>{benchmarkSymbol}</span>
            </div>
          </div>
        </div>

        {/* Right 1 col: Current (1Y) Stat Panel */}
        <div className="bg-[#0D131D] border border-[#1F2B3E] rounded-lg p-3 flex flex-col justify-between self-center h-44 w-full">
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Current ({timeframe})
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Portfolio</span>
                <span className="font-mono font-bold text-[#10B981]">
                  {stats.portfolio}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{benchmarkSymbol}</span>
                <span className="font-mono font-semibold text-slate-200">
                  {stats.benchmark}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1C2636]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">{stats.label}</span>
              <span className="font-mono font-bold text-[#10B981]">
                {stats.diff}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
