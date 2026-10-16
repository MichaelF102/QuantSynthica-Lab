interface SparklineProps {
  /** Real series to plot. When omitted a decorative direction glyph is drawn (market desk only). */
  data?: number[];
  positive?: boolean;
  width?: number;
  height?: number;
}

export default function MiniSparkline({
  data,
  positive = true,
  width = 64,
  height = 18,
}: SparklineProps) {
  const color = positive ? "#10b981" : "#f43f5e";
  let points = positive
    ? "2,15 14,12 26,14 38,8 50,9 62,3"
    : "2,4 14,7 26,5 38,11 50,10 62,15";
  if (data && data.length >= 2) {
    const lo = Math.min(...data), hi = Math.max(...data), span = hi - lo || 1;
    points = data
      .map((v, i) => `${(2 + (i / (data.length - 1)) * 60).toFixed(1)},${(16 - ((v - lo) / span) * 14).toFixed(1)}`)
      .join(" ");
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 18"
      preserveAspectRatio="none"
      className="inline-block shrink-0"
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
