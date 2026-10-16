"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { histogram } from "@/lib/risk/var";
import { fmtPct } from "@/lib/utils";

/** Tiny SVG sparkline for KPI tiles; renders nothing when there is no series. */
export function Spark({ data, color = "#EF4444", width = 96, height = 34 }: { data?: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const lo = Math.min(...data), hi = Math.max(...data), span = hi - lo || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * (width - 2) + 1).toFixed(1)},${(height - 3 - ((v - lo) / span) * (height - 6)).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export interface Mark { x: number; label: string; color: string }

/** Histogram of returns (in %) with vertical markers at VaR / ES. Marker x values are returns in % (negative). */
export function ReturnHistogram({ returns, marks, color = "#2563EB", height = 220, bins = 40 }: { returns: number[]; marks?: Mark[]; color?: string; height?: number; bins?: number }) {
  const { data, centers } = useMemo(() => {
    const pct = returns.map((r) => r * 100);
    if (pct.length < 10) return { data: [], centers: [] as number[] };
    const lo = Math.min(...pct, ...(marks?.map((m) => m.x) ?? [])), hi = Math.max(...pct);
    const h = histogram(pct, bins, lo, hi);
    return { data: h.map((b) => ({ label: b.x.toFixed(2), x: b.x, count: b.count })), centers: h.map((b) => b.x) };
  }, [returns, marks, bins]);
  if (!data.length) return <div className="flex items-center justify-center text-xs text-slate-500" style={{ height }}>Not enough observations.</div>;
  const nearest = (x: number) => data[centers.reduce((best, c, i) => (Math.abs(c - x) < Math.abs(centers[best] - x) ? i : best), 0)].label;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }} barCategoryGap={0}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="label" {...AXIS_PROPS} interval={Math.max(0, Math.floor(data.length / 7))} tickFormatter={(v) => `${Number(v).toFixed(0)}`} />
          <YAxis {...AXIS_PROPS} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [v, "Days"]} labelFormatter={(l) => `Return ≈ ${l}%`} />
          <Bar dataKey="count" isAnimationActive={false}>
            {data.map((d, i) => <Cell key={i} fill={marks?.some((m) => d.x <= m.x) ? "#DC2626" : color} />)}
          </Bar>
          {marks?.map((m) => (
            <ReferenceLine key={m.label} x={nearest(m.x)} stroke={m.color} strokeDasharray="4 3" label={{ value: `${m.label}: ${fmtPct(m.x, 2)}`, position: "top", fill: m.color, fontSize: 10 }} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Diverging heatmap for correlation-style matrices (values in [-1, 1]). */
export function HeatmapMatrix({ labels, matrix, digits = 2, rotate = false }: { labels: string[]; matrix: number[][]; digits?: number; rotate?: boolean }) {
  const color = (v: number) => {
    const a = Math.min(1, Math.abs(v));
    return v >= 0 ? `rgba(37,99,235,${0.12 + a * 0.75})` : `rgba(220,38,38,${0.12 + a * 0.75})`;
  };
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-center font-mono text-[11px]">
        <thead>
          <tr><th />{labels.map((l) => <th key={l} className={cn2(rotate)}>{l.replace(".NS", "")}</th>)}</tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={labels[i]}>
              <th className="whitespace-nowrap pr-2 text-right text-[10px] font-semibold text-slate-400">{labels[i].replace(".NS", "")}</th>
              {row.map((v, j) => (
                <td key={j} className="border border-[#0b1222] px-1 py-1.5 text-white" style={{ backgroundColor: color(v) }} title={`${labels[i]} × ${labels[j]}: ${v.toFixed(3)}`}>
                  {Number.isFinite(v) ? v.toFixed(digits) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const cn2 = (rot: boolean) => `px-1 py-1 text-[10px] font-semibold text-slate-400 ${rot ? "[writing-mode:vertical-rl]" : ""}`;
