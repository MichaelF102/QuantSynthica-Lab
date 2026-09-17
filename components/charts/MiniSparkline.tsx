"use client";

import React from "react";

interface SparklineProps {
  positive?: boolean;
  width?: number;
  height?: number;
}

export default function MiniSparkline({
  positive = true,
  width = 64,
  height = 18,
}: SparklineProps) {
  // Deterministic gentle trend line
  const color = positive ? "#10B981" : "#EF4444";
  const points = positive
    ? "2,15 14,12 26,14 38,8 50,9 62,3"
    : "2,4 14,7 26,5 38,11 50,10 62,15";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible inline-block shrink-0"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
