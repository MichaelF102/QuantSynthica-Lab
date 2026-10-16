// DESIGN.md §4.4 / §8 — fixed series palette and shared Recharts styling.
export const SERIES_COLORS = [
  "#2563EB", // blue
  "#16A34A", // green
  "#D97706", // amber
  "#7C3AED", // purple
  "#DC2626", // red
  "#0891B2", // cyan
  "#64748B", // slate
  "#EA580C", // orange
] as const;

export const seriesColor = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length];

export const UP_COLOR = "#10b981";
export const DOWN_COLOR = "#f43f5e";

export const GRID_PROPS = {
  stroke: "var(--border-color)",
  strokeDasharray: "3 3",
  vertical: false,
} as const;

export const AXIS_PROPS = {
  tick: { fontSize: 10, fill: "#64748b" },
  axisLine: false,
  tickLine: false,
} as const;

export const TOOLTIP_STYLE = {
  backgroundColor: "var(--bg-surface)",
  borderColor: "var(--border-color)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "var(--text-primary)",
} as const;
