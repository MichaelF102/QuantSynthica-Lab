"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface ReturnDistProps {
  distribution: { return_pct: number; frequency: number; normal_fit: number }[];
  var95?: number;
  var99?: number;
  height?: number;
}

export default function ReturnDistributionChart({
  distribution,
  var95,
  var99,
  height = 220,
}: ReturnDistProps) {
  if (!distribution || distribution.length === 0) return null;

  return (
    <div className="rounded border border-border-subtle bg-surface p-4">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle mb-3">
        <span className="font-mono text-xs font-bold text-white tracking-wide">
          DAILY RETURN DISTRIBUTION & VALUE AT RISK (VaR)
        </span>
        <div className="flex items-center space-x-3 font-mono text-[11px]">
          {var95 !== undefined && (
            <span className="text-amber-400">VaR 95%: -{var95.toFixed(2)}%</span>
          )}
          {var99 !== undefined && (
            <span className="text-market-down">VaR 99%: -{var99.toFixed(2)}%</span>
          )}
        </div>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart data={distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1c263b" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="return_pct"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded border border-border bg-surface-muted p-2 font-mono text-xs shadow-lg">
                    <div className="text-slate-400">Return Bin: {d.return_pct}%</div>
                    <div className="text-brand-cyan">Observed Days: {d.frequency}</div>
                    <div className="text-slate-400">Gaussian Fit: {d.normal_fit.toFixed(1)}</div>
                  </div>
                );
              }}
            />
            {var95 !== undefined && (
              <ReferenceLine
                x={-var95}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                label={{ value: "VaR 95%", fill: "#F59E0B", fontSize: 10, position: "insideTopLeft" }}
              />
            )}
            {var99 !== undefined && (
              <ReferenceLine
                x={-var99}
                stroke="#FF1744"
                strokeDasharray="3 3"
                label={{ value: "VaR 99%", fill: "#FF1744", fontSize: 10, position: "insideTopLeft" }}
              />
            )}
            <Bar dataKey="frequency" fill="#1E283D" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="normal_fit"
              stroke="#00F0FF"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
