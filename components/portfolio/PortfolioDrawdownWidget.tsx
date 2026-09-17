"use client";

import React, { useMemo } from "react";
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
import { Info } from "lucide-react";

interface DrawdownPoint {
  date: string;
  drawdown: number;
}

// Generate realistic underwater drawdown path with deepest trough at -14.93% on 2023-10-26
function generateDrawdownData(): DrawdownPoint[] {
  const points: DrawdownPoint[] = [];
  const start = new Date(2023, 0, 1);
  const end = new Date(2024, 0, 1);
  const totalSteps = 60;

  for (let i = 0; i < totalSteps; i++) {
    const curDate = new Date(start.getTime() + (end.getTime() - start.getTime()) * (i / (totalSteps - 1)));
    const dateStr = curDate.toISOString().split("T")[0];
    const t = i / (totalSteps - 1);

    let dd = 0;
    // Mild drawdowns throughout the year
    if (t < 0.15) {
      // Jan dip
      dd = -Math.sin((t / 0.15) * Math.PI) * 2.8;
    } else if (t >= 0.15 && t < 0.35) {
      // Feb-Mar dip
      dd = -Math.sin(((t - 0.15) / 0.2) * Math.PI) * 4.5;
    } else if (t >= 0.35 && t < 0.6) {
      // May-Jul dip
      dd = -Math.sin(((t - 0.35) / 0.25) * Math.PI) * 6.2;
    } else if (t >= 0.65 && t < 0.92) {
      // Aug - Nov major drawdown cycle peaking around late October (t = 0.81)
      const dist = Math.abs(t - 0.81);
      if (dist < 0.02) {
        dd = -14.93; // Deepest trough
      } else {
        dd = -14.93 * Math.exp(-Math.pow(dist / 0.08, 2));
      }
    } else if (t >= 0.92) {
      // Year-end recovery with minor -2.82% current DD
      dd = -2.82 * ((t - 0.92) / 0.08);
    }

    // Add mild micro-variations
    const jitter = ((i * 13) % 7 - 3) * 0.25;
    let finalDd = Math.min(0, Math.max(-14.93, dd + jitter));

    // Force exact trough on 2023-10-26
    if (dateStr >= "2023-10-24" && dateStr <= "2023-10-28") {
      finalDd = -14.93;
    }
    // Force final point to -2.82%
    if (i === totalSteps - 1) {
      finalDd = -2.82;
    }

    points.push({
      date: dateStr,
      drawdown: Number(finalDd.toFixed(2)),
    });
  }

  return points;
}

export default function PortfolioDrawdownWidget() {
  const data = useMemo(() => generateDrawdownData(), []);

  // Trough point for annotation
  const troughPoint = data.find((d) => d.drawdown <= -14.9) || {
    date: "2023-10-26",
    drawdown: -14.93,
  };

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between">
      {/* 1. Header & Inline Stats */}
      <div className="space-y-2.5 pb-2 border-b border-[#1A2230]">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold text-white tracking-tight font-sans">
            Drawdown Analysis
          </h2>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Underwater drawdown history, depth, and duration metrics"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inline KPI stats matching screenshot */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block">Max Drawdown</span>
            <span className="text-[#F43F5E] font-bold font-mono text-sm sm:text-base">
              -14.93%
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Current Drawdown</span>
            <span className="text-[#F43F5E] font-bold font-mono text-sm sm:text-base">
              -2.82%
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Longest Drawdown</span>
            <span className="text-white font-bold font-mono text-sm sm:text-base">
              62 days
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Recovery Time</span>
            <span className="text-white font-bold font-mono text-sm sm:text-base">
              37 days
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">Number of Drawdowns</span>
            <span className="text-white font-bold font-mono text-sm sm:text-base">
              14
            </span>
          </div>
        </div>
      </div>

      {/* 2. Underwater Area Chart with Callout Trough Badge */}
      <div className="relative h-64 w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 10, left: -10, bottom: 4 }}
          >
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.65} />
                <stop offset="70%" stopColor="#991B1B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#450A0A" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
              domain={[-20, 0]}
              stroke="#475569"
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
              tickFormatter={(v: number) => `${v}%`}
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
              formatter={(val: any) => [`${val}%`, "Underwater Depth"]}
              labelFormatter={(label: any) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#EF4444"
              strokeWidth={1.8}
              fill="url(#drawdownGradient)"
              activeDot={{ r: 4, fill: "#EF4444", stroke: "#0C1017", strokeWidth: 2 }}
            />
            {/* Dot at the deepest trough */}
            <ReferenceDot
              x={troughPoint.date}
              y={troughPoint.drawdown}
              r={4}
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Deepest trough callout badge: "-14.93% \n 2023-10-26" */}
        <div
          className="absolute pointer-events-none text-center"
          style={{ right: "18%", bottom: "24%" }}
        >
          <div className="bg-[#1C0F14] border border-[#DC2626]/70 rounded px-2 py-0.5 shadow-xl backdrop-blur-sm">
            <div className="text-[11px] font-bold font-mono text-[#F87171] leading-tight">
              -14.93%
            </div>
            <div className="text-[9px] font-mono text-slate-400 leading-tight">
              2023-10-26
            </div>
          </div>
          {/* Arrow pointer down */}
          <div className="w-1.5 h-1.5 bg-[#1C0F14] border-r border-b border-[#DC2626]/70 transform rotate-45 mx-auto -mt-1" />
        </div>
      </div>

      {/* 3. Bottom padding spacer to align with left card */}
      <div className="h-6" />
    </div>
  );
}
