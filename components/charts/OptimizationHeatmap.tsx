"use client";

import React from "react";

interface HeatmapProps {
  data: {
    x_param: string;
    y_param: string;
    x_values: number[];
    y_values: number[];
    z_values: (number | null)[][];
  };
}

export default function OptimizationHeatmap({ data }: HeatmapProps) {
  if (!data || !data.z_values || data.z_values.length === 0) {
    return (
      <div className="rounded border border-border-subtle bg-surface p-4 text-center font-mono text-xs text-slate-400">
        Heatmap requires at least 2 parameter ranges to render 2D surface.
      </div>
    );
  }

  // Find min/max Z to calibrate color scale
  const flatVals = data.z_values.flat().filter((v): v is number => v !== null && !isNaN(v));
  const minZ = flatVals.length > 0 ? Math.min(...flatVals) : 0;
  const maxZ = flatVals.length > 0 ? Math.max(...flatVals) : 2.0;
  const rangeZ = Math.max(maxZ - minZ, 0.1);

  const getCellColor = (val: number | null) => {
    if (val === null) return "bg-surface-muted text-slate-400";
    const norm = (val - minZ) / rangeZ; // 0 to 1
    if (val < 0) {
      return "bg-rose-900/60 text-rose-300 font-medium";
    }
    if (norm > 0.8) {
      return "bg-emerald-500/80 text-white font-bold border border-emerald-400/40";
    } else if (norm > 0.5) {
      return "bg-emerald-600/50 text-emerald-200";
    } else if (norm > 0.2) {
      return "bg-brand-cyan/30 text-cyan-200";
    } else {
      return "bg-surface-hover text-slate-300";
    }
  };

  return (
    <div className="rounded border border-border-subtle bg-surface p-4">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle mb-3">
        <div>
          <span className="font-mono text-xs font-bold text-white tracking-wide">
            2D PARAMETER SHARPE HEATMAP
          </span>
          <div className="text-[10px] font-mono text-slate-400">
            {data.x_param} (Columns) vs {data.y_param} (Rows)
          </div>
        </div>
        <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
          <span className="h-2 w-2 rounded bg-rose-900/60" />
          <span>Low/Neg</span>
          <span className="h-2 w-2 rounded bg-brand-cyan/30" />
          <span>Med</span>
          <span className="h-2 w-2 rounded bg-emerald-500/80" />
          <span>Optimal Sharpe</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-400 text-[10px] border-b border-r border-border-subtle">
                {data.y_param} \ {data.x_param}
              </th>
              {data.x_values.map((x) => (
                <th
                  key={x}
                  className="p-2 text-[11px] font-semibold text-slate-300 border-b border-border-subtle"
                >
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.y_values.map((y, yIdx) => (
              <tr key={y}>
                <td className="p-2 text-left text-[11px] font-semibold text-slate-300 border-r border-border-subtle bg-surface-muted/40">
                  {y}
                </td>
                {data.x_values.map((_, xIdx) => {
                  const z = data.z_values[yIdx]?.[xIdx] ?? null;
                  return (
                    <td
                      key={xIdx}
                      className={`p-2.5 transition-all hover:scale-105 cursor-pointer rounded-sm ${getCellColor(
                        z
                      )}`}
                      title={`${data.x_param}: ${data.x_values[xIdx]}, ${data.y_param}: ${y}, Sharpe: ${z !== null ? z : "N/A"}`}
                    >
                      {z !== null ? z.toFixed(2) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
