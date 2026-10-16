"use client";

import React, { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ReturnDistributionWidgetProps {
  distribution?: { return_pct: number; frequency: number; normal_fit?: number }[];
}

export default function ReturnDistributionWidget({
  distribution,
}: ReturnDistributionWidgetProps) {
  const [period, setPeriod] = useState<"Daily" | "Weekly" | "Monthly">("Daily");

  // Synthetic/calculated distribution histogram data
  const data = useMemo(() => {
    if (distribution && distribution.length > 0) {
      return distribution.map((d) => ({
        range: `${d.return_pct > 0 ? "+" : ""}${d.return_pct.toFixed(1)}%`,
        val: d.return_pct,
        count: d.frequency,
        isPositive: d.return_pct >= 0,
      }));
    }
    // Standard realistic distribution shape matching screenshot
    const bins = [
      { range: "-3%", val: -3, count: 2, isPositive: false },
      { range: "-2.5%", val: -2.5, count: 5, isPositive: false },
      { range: "-2%", val: -2, count: 9, isPositive: false },
      { range: "-1.5%", val: -1.5, count: 18, isPositive: false },
      { range: "-1%", val: -1, count: 32, isPositive: false },
      { range: "-0.5%", val: -0.5, count: 48, isPositive: false },
      { range: "0%", val: 0, count: 68, isPositive: true },
      { range: "+0.5%", val: 0.5, count: 52, isPositive: true },
      { range: "+1%", val: 1, count: 36, isPositive: true },
      { range: "+1.5%", val: 1.5, count: 22, isPositive: true },
      { range: "+2%", val: 2, count: 11, isPositive: true },
      { range: "+2.5%", val: 2.5, count: 6, isPositive: true },
      { range: "+3%", val: 3, count: 3, isPositive: true },
    ];
    return bins;
  }, [distribution]);

  return (
    <div className="border border-[#1e293b] bg-[#0b1222] rounded-[2px] p-3 flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1e293b] text-xs font-mono">
        <span className="font-bold text-[#cbd5e1] uppercase tracking-wider text-[11px]">
          Return Distribution
        </span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="bg-[#080d1a] border border-[#1e293b] rounded-[2px] px-1.5 py-0.5 text-[10px] text-[#94a3b8] focus:outline-none"
        >
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      <div className="grid grid-cols-12 gap-2 pt-2 items-center font-mono">
        {/* Histogram Canvas */}
        <div className="col-span-8 h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 2, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" stroke="#64748b" fontSize={8} tickLine={false} interval={2} />
              <YAxis stroke="#64748b" fontSize={8} tickLine={false} />
              <Tooltip
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="border border-[#1e293b] bg-[#0b1222] p-1.5 rounded-[2px] text-[10px] shadow-lg">
                      <div className="text-[#94a3b8]">Bin: {d.range}</div>
                      <div className="text-[#cbd5e1] font-bold">Frequency: {d.count} days</div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[1, 1, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statistical Summary Column */}
        <div className="col-span-4 border-l border-[#1e293b] pl-2 text-[10px] space-y-1 text-[#94a3b8]">
          <div className="flex justify-between">
            <span>Mean</span>
            <span className="text-[#cbd5e1] font-semibold">-0.01%</span>
          </div>
          <div className="flex justify-between">
            <span>Std Dev</span>
            <span className="text-[#cbd5e1] font-semibold">0.09%</span>
          </div>
          <div className="flex justify-between">
            <span>Skewness</span>
            <span className="text-[#EF4444] font-semibold">-0.42</span>
          </div>
          <div className="flex justify-between">
            <span>Kurtosis</span>
            <span className="text-[#cbd5e1] font-semibold">2.8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
