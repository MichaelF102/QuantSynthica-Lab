"use client";

import React from "react";

interface RiskReturnProps {
  volatility: number;
  expectedReturn: number;
}

export default function RiskReturnProfile({ volatility, expectedReturn }: RiskReturnProps) {
  // Chart dimensions
  const width = 280;
  const height = 145;
  const padding = { top: 15, right: 15, bottom: 25, left: 32 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // X domain: 0% to 25% volatility
  // Y domain: 0% to 30% expected return
  const xToPx = (v: number) => padding.left + (v / 25) * plotW;
  const yToPx = (r: number) => padding.top + plotH - (r / 30) * plotH;

  // Efficient Frontier parametric curve points
  const frontierPoints: [number, number][] = [
    [5, 4],
    [7, 9],
    [9, 13],
    [12, 17.5],
    [15, 21.5],
    [18, 24.5],
    [22, 27.5],
    [25, 29.5],
  ];

  const frontierPath = frontierPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xToPx(p[0])},${yToPx(p[1])}`)
    .join(" ");

  // Background random cloud points
  const cloudPoints: [number, number][] = [
    [8, 5], [10, 8], [11, 7], [13, 11], [14, 10], [15, 13],
    [16, 12], [17, 15], [18, 14], [19, 16], [20, 15], [21, 18],
    [22, 17], [23, 20], [24, 19], [12, 9], [14, 8], [16, 10],
    [18, 11], [20, 13], [22, 14], [10, 6], [15, 9], [17, 11]
  ];

  const currentX = xToPx(Math.min(24.5, Math.max(1, volatility)));
  const currentY = yToPx(Math.min(29.5, Math.max(1, expectedReturn)));

  return (
    <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-[#0B1220] dark:text-white leading-tight">Risk / Return Profile</h4>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 font-semibold text-[#1769FF] dark:text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1769FF] dark:bg-blue-400" />
            Current Portfolio
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-400 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            Efficient Frontier
          </span>
        </div>
      </div>

      <div className="relative mt-2 flex justify-center">
        <svg width={width} height={height} className="overflow-visible">
          {/* Y Axis Grid lines */}
          {[0, 10, 20, 30].map((r) => (
            <g key={r}>
              <line
                x1={padding.left}
                y1={yToPx(r)}
                x2={width - padding.right}
                y2={yToPx(r)}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/80"
                strokeWidth="1"
              />
              <text
                x={padding.left - 4}
                y={yToPx(r)}
                fontSize="8"
                fill="currentColor"
                className="text-slate-400 dark:text-slate-500"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {r}%
              </text>
            </g>
          ))}

          {/* X Axis ticks */}
          {[0, 5, 10, 15, 20, 25].map((v) => (
            <g key={v}>
              <text
                x={xToPx(v)}
                y={height - padding.bottom + 12}
                fontSize="8"
                fill="currentColor"
                className="text-slate-400 dark:text-slate-500"
                textAnchor="middle"
              >
                {v}%
              </text>
            </g>
          ))}

          {/* Scatter Cloud */}
          {cloudPoints.map(([vx, ry], idx) => (
            <circle
              key={idx}
              cx={xToPx(vx)}
              cy={yToPx(ry)}
              r="2"
              fill="currentColor"
              className="text-slate-300 dark:text-slate-700"
              opacity="0.6"
            />
          ))}

          {/* Efficient Frontier Curve */}
          <path
            d={frontierPath}
            fill="none"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeDasharray="3,3"
            className="dark:stroke-blue-400/70"
          />

          {/* Current Portfolio Highlight Node */}
          <circle
            cx={currentX}
            cy={currentY}
            r="6"
            fill="#1769FF"
            opacity="0.25"
            className="animate-ping"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r="4.5"
            fill="#1769FF"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white dark:text-[#0B1528] transition-all duration-300 shadow-md"
          />

          {/* Axis Labels */}
          <text
            x={width / 2 + 10}
            y={height - 2}
            fontSize="8"
            fill="currentColor"
            className="text-slate-500 dark:text-slate-400"
            textAnchor="middle"
            fontWeight="600"
          >
            Volatility (Annualized)
          </text>
        </svg>
      </div>
    </div>
  );
}
