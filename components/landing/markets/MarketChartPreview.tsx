"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Sliders, GitCompare, Maximize2, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TickerUniverseItem, MarketBar, formatPrice, formatVolume, REAL_UNIVERSE_MAP } from "@/lib/marketUniverseData";

export type { TickerUniverseItem, MarketBar };

interface MarketChartPreviewProps {
  instrument?: TickerUniverseItem;
}

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

export default function MarketChartPreview({
  instrument = REAL_UNIVERSE_MAP["SPY"],
}: MarketChartPreviewProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("6M");
  const [showIndicators, setShowIndicators] = useState(true);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter bars based on timeframe
  const rawBars = instrument.bars || [];
  const visibleBars = useMemo(() => {
    if (!rawBars.length) return [];
    switch (activeTimeframe) {
      case "1D":
        return rawBars.slice(-2);
      case "1W":
        return rawBars.slice(-6);
      case "1M":
        return rawBars.slice(-22);
      case "3M":
        return rawBars.slice(-64);
      case "6M":
        return rawBars.slice(-130);
      case "1Y":
        return rawBars.slice(-252);
      case "ALL":
      default:
        return rawBars;
    }
  }, [rawBars, activeTimeframe]);

  // Compute price bounds & scale
  const { minPrice, maxPrice, maxVolume, priceRange } = useMemo(() => {
    if (!visibleBars.length) {
      return { minPrice: 100, maxPrice: 110, maxVolume: 1000, priceRange: 10 };
    }
    let low = Infinity;
    let high = -Infinity;
    let vol = 0;
    for (const b of visibleBars) {
      if (b.low < low) low = b.low;
      if (b.high > high) high = b.high;
      if (b.volume > vol) vol = b.volume;
    }
    const pad = Math.max(0.5, (high - low) * 0.06);
    return {
      minPrice: low - pad,
      maxPrice: high + pad,
      maxVolume: Math.max(1, vol),
      priceRange: Math.max(1, (high + pad) - (low - pad)),
    };
  }, [visibleBars]);

  // Active bar for OHLCV stats header (hovered bar or latest bar)
  const activeBar = useMemo(() => {
    if (hoveredIndex !== null && visibleBars[hoveredIndex]) {
      return visibleBars[hoveredIndex];
    }
    return visibleBars[visibleBars.length - 1] || null;
  }, [hoveredIndex, visibleBars]);

  const activeBarChange = useMemo(() => {
    if (!activeBar || visibleBars.length < 2) return { val: 0, pct: 0, isPos: true };
    const idx = hoveredIndex !== null ? hoveredIndex : visibleBars.length - 1;
    const prev = visibleBars[Math.max(0, idx - 1)];
    const val = activeBar.close - prev.close;
    const pct = prev.close > 0 ? (val / prev.close) * 100 : 0;
    return {
      val,
      pct,
      isPos: val >= 0,
    };
  }, [activeBar, hoveredIndex, visibleBars]);

  // SVG Geometry Dimensions
  const svgW = 760;
  const svgH = 360;
  const chartPadLeft = 14;
  const chartPadRight = 68; // Space for price labels on right
  const chartTop = 32;
  const chartBottom = 265;
  const chartHeight = chartBottom - chartTop;

  const volTop = 280;
  const volBottom = 338;
  const volHeight = volBottom - volTop;

  const plotWidth = svgW - chartPadLeft - chartPadRight;
  const numBars = visibleBars.length;
  const barStep = numBars > 1 ? plotWidth / (numBars - 1) : plotWidth;
  const barWidth = Math.max(2, Math.min(10, (plotWidth / Math.max(1, numBars)) * 0.68));

  // Helper coordinate mappers
  const getY = (price: number) => {
    return chartTop + (1 - (price - minPrice) / priceRange) * chartHeight;
  };

  const getVolY = (vol: number) => {
    const h = (vol / maxVolume) * volHeight;
    return volBottom - h;
  };

  // SVG grid lines (5 levels)
  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const p = minPrice + (priceRange * (steps - i)) / steps;
      const y = chartTop + (i / steps) * chartHeight;
      lines.push({ y, price: p });
    }
    return lines;
  }, [minPrice, priceRange, chartTop, chartHeight]);

  // Date labels along X axis (up to 5 labels)
  const dateLabels = useMemo(() => {
    if (visibleBars.length < 2) return [];
    const count = Math.min(5, visibleBars.length);
    const step = Math.floor((visibleBars.length - 1) / (count - 1));
    const labels = [];
    for (let i = 0; i < count; i++) {
      const idx = i === count - 1 ? visibleBars.length - 1 : i * step;
      const bar = visibleBars[idx];
      const x = chartPadLeft + idx * barStep;
      // Format YYYY-MM-DD to MMM DD
      const d = new Date(bar.date);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      labels.push({ x, text: dateStr });
    }
    return labels;
  }, [visibleBars, barStep, chartPadLeft]);

  // Moving Average Paths
  const emaPaths = useMemo(() => {
    if (!showIndicators || visibleBars.length < 2) return { ema20: "", ema50: "" };

    const pts20: string[] = [];
    const pts50: string[] = [];

    visibleBars.forEach((b, i) => {
      const x = chartPadLeft + i * barStep;
      if (b.ema_20 != null && b.ema_20 >= minPrice && b.ema_20 <= maxPrice) {
        pts20.push(`${x.toFixed(1)},${getY(b.ema_20).toFixed(1)}`);
      }
      if (b.ema_50 != null && b.ema_50 >= minPrice && b.ema_50 <= maxPrice) {
        pts50.push(`${x.toFixed(1)},${getY(b.ema_50).toFixed(1)}`);
      }
    });

    return {
      ema20: pts20.length > 1 ? "M " + pts20.join(" L ") : "",
      ema50: pts50.length > 1 ? "M " + pts50.join(" L ") : "",
    };
  }, [showIndicators, visibleBars, minPrice, maxPrice, barStep, chartPadLeft]);

  // Handle Mouse Hover on SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * svgW;
    const relativeX = svgX - chartPadLeft;
    if (relativeX < 0 || relativeX > plotWidth || numBars === 0) {
      setHoveredIndex(null);
      return;
    }
    const idx = Math.round(relativeX / barStep);
    const clamped = Math.max(0, Math.min(numBars - 1, idx));
    setHoveredIndex(clamped);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // 52-Week Range position percentage
  const range52wPct = useMemo(() => {
    if (instrument.high_52w <= instrument.low_52w) return 50;
    const pct = ((instrument.price - instrument.low_52w) / (instrument.high_52w - instrument.low_52w)) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [instrument]);

  const currencySymbol = instrument.currency || "$";

  return (
    <div ref={containerRef} className="flex h-full flex-col justify-between">
      {/* 1. TOP HEADER ROW: Symbol, Price, Key Stats, Timeframe Selector */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Ticker identity & real price */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[17px] leading-none">{instrument.flag}</span>
              <h3 className="font-bold text-[18px] sm:text-[20px] text-[#0B1220] dark:text-white tracking-tight">
                {instrument.name}
              </h3>
              <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[12px] font-bold text-[#1769FF] dark:text-blue-400">
                {instrument.symbol}
              </span>
              <span className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {instrument.exchange}
              </span>
              <span className="hidden sm:inline-block rounded bg-blue-50/60 dark:bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                {instrument.sector}
              </span>
            </div>

            {/* Price & Change */}
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[28px] sm:text-[32px] font-extrabold text-[#0B1220] dark:text-white tracking-tight tabular-nums">
                {formatPrice(instrument.price, currencySymbol)}
              </span>

              <div
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[13px] font-bold tabular-nums ${
                  instrument.is_positive
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-[#00A878] dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40"
                    : "bg-red-50 dark:bg-rose-950/40 text-[#E5484D] dark:text-rose-400 border border-red-200/50 dark:border-rose-800/40"
                }`}
              >
                {instrument.is_positive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>
                  {instrument.is_positive ? "+" : ""}
                  {instrument.change >= 0 ? instrument.change.toFixed(2) : instrument.change.toFixed(2)}{" "}
                  ({instrument.is_positive ? "+" : ""}
                  {instrument.change_pct.toFixed(2)}%)
                </span>
              </div>

              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                Market Session · As of Sep 27, 2024
              </span>
            </div>
          </div>

          {/* Right: Timeframe pills & quick chart tool icons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Selector */}
            <div className="no-scrollbar inline-flex items-center rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-0.5 text-[11px]">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setActiveTimeframe(tf)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-all ${
                    activeTimeframe === tf
                      ? "bg-[#1769FF] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#0B1220] dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Quick Chart Tools */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowIndicators(!showIndicators)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  showIndicators
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                title="Toggle Moving Averages"
              >
                <Sliders className="h-3 w-3" />
                <span>Indicators</span>
                {showIndicators && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1769FF]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowBenchmark(!showBenchmark)}
                className={`hidden sm:inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  showBenchmark
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-[#1769FF] dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                title="Compare Benchmark"
              >
                <GitCompare className="h-3 w-3" />
                <span>Compare</span>
              </button>

              <Link
                href={`/research?ticker=${instrument.symbol}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#1769FF] dark:hover:text-blue-400"
                title="Launch Full Research Desk"
              >
                <Maximize2 className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2. REAL TICKER METRICS STRIP: High/Low 52W, Day Range, Vol, Beta */}
        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 rounded-lg bg-slate-50/80 dark:bg-slate-900/60 p-2 text-[11px] border border-slate-100 dark:border-slate-800 font-mono">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Day Open / High</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatPrice(instrument.open, currencySymbol)} / {formatPrice(instrument.high, currencySymbol)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Day Low / Vol</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatPrice(instrument.low, currencySymbol)} · {formatVolume(instrument.volume)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 uppercase">
              <span>52W Low: {formatPrice(instrument.low_52w, currencySymbol)}</span>
              <span>52W High: {formatPrice(instrument.high_52w, currencySymbol)}</span>
            </div>
            {/* Visual 52-week slider marker */}
            <div className="relative mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full bg-blue-500/40"
                style={{ width: `${range52wPct}%` }}
              />
              <div
                className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white dark:border-slate-800 bg-[#1769FF] shadow-xs"
                style={{ left: `calc(${range52wPct}% - 5px)` }}
              />
            </div>
          </div>

          <div className="hidden lg:block text-right">
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase">Beta / Ann Vol</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {instrument.beta.toFixed(2)} · {instrument.volatility.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CANDLESTICK CHART CONTAINER (DARK #111827 SURFACE) */}
      <div className="relative mt-3 rounded-xl border border-slate-800 bg-[#111827] p-2.5 sm:p-3 shadow-inner">
        {/* Dynamic Interactive OHLCV Readout Bar */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-y-1 border-b border-white/5 pb-2 text-[10px] sm:text-[11px] font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-slate-300 font-bold">
              {activeBar?.date || "2024-09-27"}
            </span>
            <span>
              O: <strong className="text-white">{activeBar ? formatPrice(activeBar.open, currencySymbol) : "--"}</strong>
            </span>
            <span>
              H: <strong className="text-[#10B981]">{activeBar ? formatPrice(activeBar.high, currencySymbol) : "--"}</strong>
            </span>
            <span>
              L: <strong className="text-[#EF4444]">{activeBar ? formatPrice(activeBar.low, currencySymbol) : "--"}</strong>
            </span>
            <span>
              C: <strong className="text-white">{activeBar ? formatPrice(activeBar.close, currencySymbol) : "--"}</strong>
            </span>
            <span className={activeBarChange.isPos ? "text-[#10B981]" : "text-[#EF4444]"}>
              ({activeBarChange.isPos ? "+" : ""}{activeBarChange.pct.toFixed(2)}%)
            </span>
            <span className="text-slate-400">
              Vol: <strong className="text-slate-300">{activeBar ? formatVolume(activeBar.volume) : "--"}</strong>
            </span>
          </div>

          {/* Indicator Legends */}
          {showIndicators && (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-[#3B82F6]">
                <span className="h-1.5 w-2.5 rounded-full bg-[#3B82F6]" />
                EMA 20 {activeBar?.ema_20 ? formatPrice(activeBar.ema_20, currencySymbol) : ""}
              </span>
              <span className="flex items-center gap-1 text-[#06B6D4]">
                <span className="h-1.5 w-2.5 rounded-full bg-[#06B6D4]" />
                EMA 50 {activeBar?.ema_50 ? formatPrice(activeBar.ema_50, currencySymbol) : ""}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic SVG Candlestick & Volume Surface */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="volGradPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="volGradNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines & Price Labels */}
            {gridLines.map((gl, i) => (
              <g key={i}>
                <line
                  x1={chartPadLeft}
                  y1={gl.y}
                  x2={svgW - chartPadRight}
                  y2={gl.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={svgW - chartPadRight + 6}
                  y={gl.y + 3.5}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {formatPrice(gl.price, currencySymbol)}
                </text>
              </g>
            ))}

            {/* Volume Baseline Separator */}
            <line
              x1={chartPadLeft}
              y1={volTop - 4}
              x2={svgW - chartPadRight}
              y2={volTop - 4}
              stroke="rgba(255,255,255,0.08)"
            />
            <text
              x={chartPadLeft}
              y={volTop + 10}
              fill="rgba(255,255,255,0.25)"
              fontSize="8.5"
              fontFamily="monospace"
            >
              VOL HISTOGRAM
            </text>

            {/* Volume Histogram Bars */}
            {visibleBars.map((bar, i) => {
              const x = chartPadLeft + i * barStep;
              const y = getVolY(bar.volume);
              const h = Math.max(1, volBottom - y);
              const isUp = bar.close >= bar.open;

              return (
                <rect
                  key={`vol-${i}`}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={h}
                  fill={isUp ? "url(#volGradPos)" : "url(#volGradNeg)"}
                  rx={0.5}
                />
              );
            })}

            {/* Candlesticks (Wick + Body) */}
            {visibleBars.map((bar, i) => {
              const x = chartPadLeft + i * barStep;
              const yHigh = getY(bar.high);
              const yLow = getY(bar.low);
              const yOpen = getY(bar.open);
              const yClose = getY(bar.close);

              const isUp = bar.close >= bar.open;
              const color = isUp ? "#10B981" : "#EF4444";
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

              const isHovered = hoveredIndex === i;

              return (
                <g key={`candle-${i}`}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth={isHovered ? "1.8" : "1.2"}
                  />
                  {/* Body */}
                  <rect
                    x={x - barWidth / 2}
                    y={bodyTop}
                    width={barWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={isHovered ? "#FFFFFF" : color}
                    strokeWidth={isHovered ? "0.8" : "0"}
                    rx={0.5}
                  />
                </g>
              );
            })}

            {/* EMA 20 & EMA 50 Moving Average Curves */}
            {showIndicators && emaPaths.ema20 && (
              <path
                d={emaPaths.ema20}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {showIndicators && emaPaths.ema50 && (
              <path
                d={emaPaths.ema50}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Benchmark Overlay (If Toggled) */}
            {showBenchmark && (
              <path
                d={`M ${chartPadLeft} ${chartBottom - 40} Q ${svgW / 2} ${chartTop + 40}, ${svgW - chartPadRight} ${chartTop + 30}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Date X-Axis Labels */}
            {dateLabels.map((dl, i) => (
              <text
                key={`date-${i}`}
                x={dl.x}
                y={svgH - 8}
                textAnchor={i === 0 ? "start" : i === dateLabels.length - 1 ? "end" : "middle"}
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                fontFamily="monospace"
              >
                {dl.text}
              </text>
            ))}

            {/* Interactive Crosshair & Cursor HUD */}
            {hoveredIndex !== null && visibleBars[hoveredIndex] && (
              <g>
                {/* Vertical Crosshair Line */}
                <line
                  x1={chartPadLeft + hoveredIndex * barStep}
                  y1={chartTop}
                  x2={chartPadLeft + hoveredIndex * barStep}
                  y2={volBottom}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Horizontal Price Line */}
                <line
                  x1={chartPadLeft}
                  y1={getY(visibleBars[hoveredIndex].close)}
                  x2={svgW - chartPadRight}
                  y2={getY(visibleBars[hoveredIndex].close)}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Right Axis Highlight Price Badge */}
                <rect
                  x={svgW - chartPadRight + 2}
                  y={getY(visibleBars[hoveredIndex].close) - 8}
                  width="64"
                  height="16"
                  fill="#1769FF"
                  rx="3"
                />
                <text
                  x={svgW - chartPadRight + 34}
                  y={getY(visibleBars[hoveredIndex].close) + 3.5}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {formatPrice(visibleBars[hoveredIndex].close, currencySymbol)}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Bottom Status & Research CTA */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real Historical Feed Active
            </span>
            <span>·</span>
            <span>Timeframe: <strong>{activeTimeframe}</strong> ({visibleBars.length} bars)</span>
          </div>

          <Link
            href={`/research?ticker=${instrument.symbol}`}
            className="flex items-center gap-1 font-semibold text-[#1769FF] hover:text-blue-400 transition-colors"
          >
            <span>Launch full analytical research desk for {instrument.symbol} →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
