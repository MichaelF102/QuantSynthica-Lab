"use client";

import React from "react";
import { RiskState } from "./RiskNavigation";

interface RiskProfileProps {
  activeRisk: RiskState;
}

interface AxisPoint {
  key: string;
  label: string;
  portfolioValue: number; // 0 to 1
  benchmarkValue: number; // 0 to 1
  angle: number; // in radians
}

export default function RiskProfile({ activeRisk }: RiskProfileProps) {
  // 5 dimensions: VaR, Volatility, Stress, Liquidity, Drawdown
  // 0 rad is at top (-PI/2)
  const dimensions: { key: RiskState | "liquidity"; label: string }[] = [
    { key: "var", label: "VaR" },
    { key: "volatility", label: "Volatility" },
    { key: "stress", label: "Stress" },
    { key: "liquidity", label: "Liquidity" },
    { key: "drawdown", label: "Drawdown" },
  ];

  const size = 260;
  const center = size / 2;
  const radius = 80;

  const points: AxisPoint[] = dimensions.map((dim, i) => {
    const angle = (i * 2 * Math.PI) / dimensions.length - Math.PI / 2;
    // Values matching the reference visual
    let pVal = 0.72;
    let bVal = 0.58;

    if (dim.key === "var") {
      pVal = 0.88;
      bVal = 0.62;
    } else if (dim.key === "volatility") {
      pVal = 0.68;
      bVal = 0.74;
    } else if (dim.key === "stress") {
      pVal = 0.55;
      bVal = 0.45;
    } else if (dim.key === "liquidity") {
      pVal = 0.82;
      bVal = 0.7;
    } else if (dim.key === "drawdown") {
      pVal = 0.78;
      bVal = 0.52;
    }

    return {
      key: dim.key,
      label: dim.label,
      portfolioValue: pVal,
      benchmarkValue: bVal,
      angle,
    };
  });

  // Calculate polygon coordinates
  const getCoords = (val: number, angle: number) => {
    const r = radius * val;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const portfolioPath = points
    .map((p, i) => {
      const c = getCoords(p.portfolioValue, p.angle);
      return `${i === 0 ? "M" : "L"} ${c.x},${c.y}`;
    })
    .join(" ") + " Z";

  const benchmarkPath = points
    .map((p, i) => {
      const c = getCoords(p.benchmarkValue, p.angle);
      return `${i === 0 ? "M" : "L"} ${c.x},${c.y}`;
    })
    .join(" ") + " Z";

  // Grid concentric rings
  const ringLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full lg:w-[280px] shrink-0">
      <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="w-2 h-2 rounded-full bg-[#1769FF]" />
          <h4 className="text-xs font-bold text-[#0B1220] dark:text-white">Portfolio Risk Profile</h4>
        </div>

        {/* Radar SVG */}
        <div className="relative flex justify-center py-1">
          <svg width={size} height={size} className="overflow-visible">
            {/* Concentric Grid Polygons */}
            {ringLevels.map((lvl) => {
              const ringPath = points
                .map((p, i) => {
                  const c = getCoords(lvl, p.angle);
                  return `${i === 0 ? "M" : "L"} ${c.x},${c.y}`;
                })
                .join(" ") + " Z";
              return (
                <path
                  key={lvl}
                  d={ringPath}
                  fill="none"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="1"
                  strokeDasharray={lvl === 1 ? "none" : "2,2"}
                />
              );
            })}

            {/* Axis Lines */}
            {points.map((p) => {
              const outer = getCoords(1, p.angle);
              const isActive = activeRisk === p.key;
              return (
                <line
                  key={p.key}
                  x1={center}
                  y1={center}
                  x2={outer.x}
                  y2={outer.y}
                  className={isActive ? "stroke-blue-500" : "stroke-slate-200 dark:stroke-slate-700"}
                  strokeWidth={isActive ? 1.5 : 1}
                />
              );
            })}

            {/* Benchmark Polygon */}
            <path
              d={benchmarkPath}
              fill="rgba(148, 163, 184, 0.12)"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />

            {/* Portfolio Polygon */}
            <path
              d={portfolioPath}
              fill="rgba(23, 105, 255, 0.18)"
              stroke="#1769FF"
              strokeWidth="2"
            />

            {/* Portfolio Points */}
            {points.map((p) => {
              const c = getCoords(p.portfolioValue, p.angle);
              const isActive = activeRisk === p.key;
              return (
                <circle
                  key={p.key}
                  cx={c.x}
                  cy={c.y}
                  r={isActive ? 4.5 : 3}
                  fill={isActive ? "#2563EB" : "#1769FF"}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Axis Labels */}
            {points.map((p) => {
              const labelRadius = radius + 22;
              const x = center + labelRadius * Math.cos(p.angle);
              const y = center + labelRadius * Math.sin(p.angle);
              const isActive = activeRisk === p.key;

              return (
                <text
                  key={p.key}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isActive ? "10.5" : "9.5"}
                  fontWeight={isActive ? "700" : "500"}
                  className={`select-none font-sans ${
                    isActive ? "fill-blue-500 font-bold" : "fill-slate-500 dark:fill-slate-400"
                  }`}
                >
                  {p.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 font-medium text-[#0B1220] dark:text-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#1769FF]" />
            Portfolio
          </div>
          <div className="flex items-center gap-1.5 font-medium text-[#64748B] dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Benchmark
          </div>
        </div>
      </div>
    </div>
  );
}
