"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TradeDirectionDonutProps {
  longs?: number;
  shorts?: number;
}

export default function TradeDirectionDonut({
  longs = 7,
  shorts = 0,
}: TradeDirectionDonutProps) {
  const total = longs + shorts || 1;
  const longPct = Math.round((longs / total) * 100);
  const shortPct = Math.round((shorts / total) * 100);

  const data = [
    { name: "Long", value: longs || (shorts === 0 ? 1 : 0), color: "#10B981" },
    { name: "Short", value: shorts, color: "#EF4444" },
  ];

  return (
    <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-3 flex flex-col justify-between select-none font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#252A31]">
        <span className="font-bold text-[#D8DCE2] uppercase tracking-wider text-[11px]">
          Trade Direction
        </span>
      </div>

      <div className="flex items-center justify-around py-1">
        {/* Donut Chart with Center Number */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={30}
                outerRadius={42}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-sm font-bold text-white">{total}</span>
            <span className="text-[9px] text-[#89919C]">Trades</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-[#10B981] inline-block"></span>
            <span className="text-[#D8DCE2]">Long</span>
            <span className="text-[#89919C]">{longs} ({longPct}%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-[#EF4444] inline-block"></span>
            <span className="text-[#D8DCE2]">Short</span>
            <span className="text-[#89919C]">{shorts} ({shortPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
