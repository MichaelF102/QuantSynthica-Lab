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
} from "recharts";
import { EquityPoint } from "@/types";

interface DrawdownProps {
  data: EquityPoint[];
  height?: number;
  hideHeader?: boolean;
  hideBorder?: boolean;
}

export default function UnderwaterDrawdownChart({
  data,
  height = 150,
  hideHeader = false,
  hideBorder = false,
}: DrawdownProps) {
  const analysis = useMemo(() => {
    if (!data || data.length === 0) return null;

    let peakVal = -Infinity;
    let peakDate = data[0].date;
    let maxDd = 0;
    let troughDate = data[0].date;
    let troughIdx = 0;
    let maxDdDuration = 0;
    let currentDdDuration = 0;
    let isRecovered = false;

    const chartData = data.map((d, idx) => {
      const dd = -Math.abs(d.drawdown);
      if (d.portfolio_value > peakVal) {
        peakVal = d.portfolio_value;
        peakDate = d.date;
      }
      if (dd < maxDd) {
        maxDd = dd;
        troughDate = d.date;
        troughIdx = idx;
      }
      if (dd < -0.001) {
        currentDdDuration++;
        if (currentDdDuration > maxDdDuration) {
          maxDdDuration = currentDdDuration;
        }
      } else {
        currentDdDuration = 0;
      }
      return {
        date: d.date,
        drawdown: dd,
        portfolio_value: d.portfolio_value,
      };
    });

    // Check if strategy recovered after the trough
    for (let i = troughIdx + 1; i < chartData.length; i++) {
      if (chartData[i].drawdown >= -0.05) {
        isRecovered = true;
        break;
      }
    }

    return {
      chartData,
      maxDd,
      peakDate,
      troughDate,
      isRecovered,
      maxDdDuration,
    };
  }, [data]);

  if (!analysis || analysis.chartData.length === 0) return null;

  return (
    <div className={`bg-[#0b1222] ${hideBorder ? "" : "border border-[#1e293b] rounded-[2px]"}`}>
      {!hideHeader && (
        <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-[#1e293b] bg-[#080d1a] text-xs font-mono gap-2">
          <span className="font-semibold text-[#cbd5e1] uppercase tracking-wider text-[11px]">
            Underwater Drawdown Profile
          </span>
          <div className="flex items-center space-x-3 text-[10px]">
            <div>
              <span className="text-[#64748b]">PEAK: </span>
              <span className="text-[#94a3b8]">{analysis.peakDate}</span>
            </div>
            <div>
              <span className="text-[#64748b]">TROUGH: </span>
              <span className="text-[#94a3b8]">{analysis.troughDate}</span>
            </div>
            <div>
              <span className="text-[#64748b]">STATUS: </span>
              <span className={analysis.isRecovered ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"}>
                {analysis.isRecovered ? "RECOVERED" : "NOT RECOVERED"}
              </span>
            </div>
            <div className="text-[#EF4444] font-bold tabular-nums">
              MAX DD: {analysis.maxDd.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      <div style={{ width: "100%", height }} className="pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analysis.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={["auto", 0]}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "#64748b", strokeWidth: 1, strokeDasharray: "2 2" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-[2px] border border-[#1e293b] bg-[#0b1222] p-1.5 font-mono text-[11px] shadow-none">
                    <div className="text-[#94a3b8]">{d.date}</div>
                    <div className="text-[#EF4444] font-bold">
                      DRAWDOWN: {d.drawdown.toFixed(2)}%
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#EF4444"
              strokeWidth={1.2}
              fillOpacity={1}
              fill="url(#ddGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
