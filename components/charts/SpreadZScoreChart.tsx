"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface SpreadChartProps {
  data: {
    date: string;
    spread: number;
    z_score: number;
    upper_entry: number;
    lower_entry: number;
    upper_exit: number;
    lower_exit: number;
  }[];
  tickerA: string;
  tickerB: string;
  height?: number;
}

export default function SpreadZScoreChart({
  data,
  tickerA,
  tickerB,
  height = 300,
}: SpreadChartProps) {
  if (!data || data.length === 0) return null;

  const entryZ = data[0]?.upper_entry ?? 2.0;
  const exitZ = data[0]?.upper_exit ?? 0.5;

  return (
    <div className="rounded border border-border-subtle bg-surface p-4">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle mb-3">
        <div>
          <span className="font-mono text-xs font-bold text-white tracking-wide">
            PAIRS SPREAD Z-SCORE & DYNAMIC BANDS
          </span>
          <span className="text-[10px] font-mono text-slate-400 block">
            {tickerA} vs {tickerB}
          </span>
        </div>
        <div className="flex items-center space-x-3 font-mono text-[10px]">
          <span className="text-market-down">Short Entry (+{entryZ}σ)</span>
          <span className="text-market-up">Long Entry (-{entryZ}σ)</span>
          <span className="text-slate-400">Exit (±{exitZ}σ)</span>
        </div>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1c263b" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              domain={[-4, 4]}
              tickFormatter={(v) => `${v.toFixed(1)}σ`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded border border-border bg-surface-muted p-2 font-mono text-xs shadow-xl">
                    <div className="text-slate-400">{d.date}</div>
                    <div className="text-brand-cyan font-bold">Z-Score: {d.z_score.toFixed(2)}σ</div>
                    <div className="text-slate-300">Spread: ${d.spread.toFixed(2)}</div>
                  </div>
                );
              }}
            />

            {/* Reference Threshold Lines */}
            <ReferenceLine y={entryZ} stroke="#FF1744" strokeDasharray="3 3" label={{ value: `+${entryZ}σ Entry`, fill: "#FF1744", fontSize: 10 }} />
            <ReferenceLine y={-entryZ} stroke="#00E676" strokeDasharray="3 3" label={{ value: `-${entryZ}σ Entry`, fill: "#00E676", fontSize: 10 }} />
            <ReferenceLine y={exitZ} stroke="#94A3B8" strokeDasharray="2 2" />
            <ReferenceLine y={-exitZ} stroke="#94A3B8" strokeDasharray="2 2" />
            <ReferenceLine y={0} stroke="#475569" />

            <Line
              type="monotone"
              dataKey="z_score"
              stroke="#00F0FF"
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
