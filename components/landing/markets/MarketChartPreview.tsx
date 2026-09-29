"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Sliders,
  Maximize2,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import {
  NormalizedMarketAsset,
  MarketBar,
  formatCurrencyValue,
  formatLargeVolume,
  formatMarketCap,
} from "@/lib/market/yahooFinance";

export type { NormalizedMarketAsset, MarketBar };

interface MarketChartPreviewProps {
  instrument: NormalizedMarketAsset;
  onSelectTimeframe?: (timeframe: string) => void;
  availableTickers?: { symbol: string; label: string; flag?: string }[];
  onSelectTicker?: (symbol: string) => void;
}

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

export default function MarketChartPreview({
  instrument,
  onSelectTimeframe,
  availableTickers = [],
  onSelectTicker,
}: MarketChartPreviewProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("6M");
  const [showIndicators, setShowIndicators] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimeframeChange = (tf: Timeframe) => {
    setActiveTimeframe(tf);
    if (onSelectTimeframe) {
      onSelectTimeframe(tf);
    }
  };

  // Filter bars based on timeframe
  const rawBars = instrument.bars || [];
  const visibleBars = useMemo(() => {
    if (!rawBars.length) return [];
    switch (activeTimeframe) {
      case "1D":
        return rawBars.slice(-2);
      case "1W":
        return rawBars.slice(-7);
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
      priceRange: Math.max(0.1, (high + pad) - (low - pad)),
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
  const svgH = 340;
  const chartPadLeft = 14;
  const chartPadRight = 68;
  const chartTop = 24;
  const hasVolume = visibleBars.some((b) => b.volume > 0) && instrument.assetType !== "index";
  const chartBottom = hasVolume ? 245 : 300;
  const chartHeight = chartBottom - chartTop;

  const volTop = 258;
  const volBottom = 318;
  const volHeight = volBottom - volTop;

  const plotWidth = svgW - chartPadLeft - chartPadRight;
  const numBars = visibleBars.length;
  const barStep = numBars > 1 ? plotWidth / (numBars - 1) : plotWidth;
  const barWidth = Math.max(2, Math.min(10, (plotWidth / Math.max(1, numBars)) * 0.68));

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

  // Date labels along X axis
  const dateLabels = useMemo(() => {
    if (visibleBars.length < 2) return [];
    const count = Math.min(5, visibleBars.length);
    const step = Math.floor((visibleBars.length - 1) / (count - 1));
    const labels = [];
    for (let i = 0; i < count; i++) {
      const idx = i === count - 1 ? visibleBars.length - 1 : i * step;
      const bar = visibleBars[idx];
      const x = chartPadLeft + idx * barStep;
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

  // Mouse Hover on SVG
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

  const currencySymbol = instrument.currency || "$";

  // 52-Week Range position percentage
  const range52wPct = useMemo(() => {
    const h = instrument.fiftyTwoWeekHigh || 0;
    const l = instrument.fiftyTwoWeekLow || 0;
    if (h <= l) return 50;
    const pct = ((instrument.price - l) / (h - l)) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [instrument]);

  const isIndex = instrument.assetType === "index";
  const isEtf = instrument.assetType === "etf";
  const isEquity = instrument.assetType === "equity";

  return (
    <div ref={containerRef} className="flex h-full flex-col justify-between">
      {/* 1. TOP HEADER: Symbol, Price, Key Stats, Timeframe Selector */}
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

              {/* Class-Specific Label */}
              {isEtf && instrument.classification && (
                <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  {instrument.classification}
                </span>
              )}
              {isIndex && (
                <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Benchmark Index
                </span>
              )}
            </div>

            {/* Price & Change */}
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[28px] sm:text-[32px] font-extrabold text-[#0B1220] dark:text-white tracking-tight tabular-nums">
                {formatCurrencyValue(instrument.price, currencySymbol)}
              </span>

              <div
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[13px] font-bold tabular-nums ${
                  instrument.isPositive
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-[#00A878] dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40"
                    : "bg-red-50 dark:bg-rose-950/40 text-[#E5484D] dark:text-rose-400 border border-red-200/50 dark:border-rose-800/40"
                }`}
              >
                {instrument.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>
                  {instrument.isPositive ? "+" : ""}
                  {instrument.change >= 0 ? instrument.change.toFixed(2) : instrument.change.toFixed(2)}{" "}
                  ({instrument.isPositive ? "+" : ""}
                  {instrument.changePercent.toFixed(2)}%)
                </span>
              </div>

              {/* Real Observation Date Badge */}
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                Yahoo Finance · As of {instrument.lastObservationDate || "Latest Close"}
              </span>
            </div>
          </div>

          {/* Right: Quick Timeframe Selector & Indicators Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Timeframe selector"
              className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-0.5"
            >
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-mono font-bold transition-all ${
                    activeTimeframe === tf
                      ? "bg-[#1769FF] text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowIndicators(!showIndicators)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                showIndicators
                  ? "border-blue-500/40 bg-blue-50/60 text-[#1769FF] dark:bg-blue-950/60 dark:text-blue-400"
                  : "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              <Sliders className="h-3 w-3" />
              <span>Indicators</span>
              <span className={`h-1.5 w-1.5 rounded-full ${showIndicators ? "bg-blue-500" : "bg-slate-300"}`} />
            </button>
          </div>
        </div>

        {/* Quick Tickers Selector (if provided) */}
        {availableTickers.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100/60 dark:border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Select:
            </span>
            {availableTickers.map((t) => {
              const isSelected = instrument.symbol === t.symbol;
              return (
                <button
                  key={t.symbol}
                  onClick={() => onSelectTicker && onSelectTicker(t.symbol)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-mono font-semibold transition-colors whitespace-nowrap ${
                    isSelected
                      ? "bg-[#1769FF] text-white shadow-2xs"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {t.flag && <span className="mr-1">{t.flag}</span>}
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. ADAPTIVE CLASS-AWARE METRICS ROW */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-[11px]">
          {/* Day Range */}
          <div className="rounded-lg bg-slate-50/80 dark:bg-slate-900/40 p-2 border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">
              Day Open / High
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {formatCurrencyValue(instrument.open || instrument.price, currencySymbol)} / {formatCurrencyValue(instrument.high || instrument.price, currencySymbol)}
            </span>
          </div>

          {/* Low & Volume / Point Change */}
          <div className="rounded-lg bg-slate-50/80 dark:bg-slate-900/40 p-2 border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">
              {isIndex ? "Day Low / Prev Close" : "Day Low / Volume"}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {formatCurrencyValue(instrument.low || instrument.price, currencySymbol)} /{" "}
              {isIndex ? formatCurrencyValue(instrument.previousClose, currencySymbol) : formatLargeVolume(instrument.volume)}
            </span>
          </div>

          {/* 52-Week Range */}
          <div className="rounded-lg bg-slate-50/80 dark:bg-slate-900/40 p-2 border border-slate-100 dark:border-slate-800/60">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-sans">
              <span>52W Low</span>
              <span>52W High</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
              <span>{formatCurrencyValue(instrument.fiftyTwoWeekLow || instrument.price * 0.8, currencySymbol)}</span>
              <span>{formatCurrencyValue(instrument.fiftyTwoWeekHigh || instrument.price * 1.2, currencySymbol)}</span>
            </div>
            <div className="relative mt-1 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="absolute top-0 h-1 rounded-full bg-[#1769FF]"
                style={{ width: `${range52wPct}%` }}
              />
            </div>
          </div>

          {/* Equity / ETF / Index Dynamic 4th Metric */}
          <div className="rounded-lg bg-slate-50/80 dark:bg-slate-900/40 p-2 border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">
              {isEquity ? "Market Cap / Beta" : isEtf ? "Fund Classification" : "Asset Category"}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
              {isEquity
                ? `${formatMarketCap(instrument.marketCap, currencySymbol)} · β ${instrument.beta ?? "1.00"}`
                : isEtf
                ? instrument.classification || "Exchange Traded Fund"
                : "Global Equity Benchmark"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE BAR STATS / CROSSHAIR HEADER */}
      {activeBar && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {activeBar.date}
          </span>
          <span>
            O: <strong className="text-slate-900 dark:text-white">{formatCurrencyValue(activeBar.open, currencySymbol)}</strong>
          </span>
          <span>
            H: <strong className="text-[#00A878] dark:text-emerald-400">{formatCurrencyValue(activeBar.high, currencySymbol)}</strong>
          </span>
          <span>
            L: <strong className="text-[#E5484D] dark:text-rose-400">{formatCurrencyValue(activeBar.low, currencySymbol)}</strong>
          </span>
          <span>
            C: <strong className="text-slate-900 dark:text-white">{formatCurrencyValue(activeBar.close, currencySymbol)}</strong>
          </span>
          <span className={activeBarChange.isPos ? "text-emerald-500" : "text-rose-500"}>
            ({activeBarChange.isPos ? "+" : ""}{activeBarChange.pct.toFixed(2)}%)
          </span>
          {activeBar.volume > 0 && (
            <span>
              Vol: <strong className="text-slate-700 dark:text-slate-300">{formatLargeVolume(activeBar.volume)}</strong>
            </span>
          )}

          {/* EMA Indicators in header */}
          {showIndicators && activeBar.ema_20 != null && (
            <span className="text-blue-500 font-semibold">
              EMA 20: {formatCurrencyValue(activeBar.ema_20, currencySymbol)}
            </span>
          )}
          {showIndicators && activeBar.ema_50 != null && (
            <span className="text-cyan-500 font-semibold">
              EMA 50: {formatCurrencyValue(activeBar.ema_50, currencySymbol)}
            </span>
          )}
        </div>
      )}

      {/* 4. REAL INTERACTIVE CANDLESTICK CHART */}
      <div className="relative my-2 flex-1 min-h-[280px]">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="h-full w-full overflow-visible cursor-crosshair select-none"
        >
          {/* Grid lines & price labels */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={chartPadLeft}
                y1={line.y}
                x2={chartPadLeft + plotWidth}
                y2={line.y}
                stroke="currentColor"
                className="text-slate-200/80 dark:text-slate-800/80"
                strokeDasharray="2 3"
              />
              <text
                x={chartPadLeft + plotWidth + 8}
                y={line.y + 3.5}
                fill="currentColor"
                className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
              >
                {formatCurrencyValue(line.price, currencySymbol)}
              </text>
            </g>
          ))}

          {/* Candlesticks */}
          {visibleBars.map((bar, i) => {
            const x = chartPadLeft + i * barStep;
            const openY = getY(bar.open);
            const closeY = getY(bar.close);
            const highY = getY(bar.high);
            const lowY = getY(bar.low);

            const isUp = bar.close >= bar.open;
            const color = isUp ? "#00A878" : "#E5484D";
            const topBody = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

            return (
              <g key={bar.date}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Real Candlestick Body */}
                <rect
                  x={x - barWidth / 2}
                  y={topBody}
                  width={barWidth}
                  height={bodyHeight}
                  fill={color}
                  rx="0.5"
                />

                {/* Volume bar at bottom */}
                {hasVolume && bar.volume > 0 && (
                  <rect
                    x={x - barWidth / 2}
                    y={getVolY(bar.volume)}
                    width={barWidth}
                    height={volBottom - getVolY(bar.volume)}
                    fill={color}
                    opacity="0.3"
                  />
                )}
              </g>
            );
          })}

          {/* Indicator Lines: EMA 20 & EMA 50 */}
          {showIndicators && emaPaths.ema20 && (
            <path
              d={emaPaths.ema20}
              fill="none"
              stroke="#2563EB"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
          {showIndicators && emaPaths.ema50 && (
            <path
              d={emaPaths.ema50}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}

          {/* Crosshair when hovering */}
          {hoveredIndex !== null && visibleBars[hoveredIndex] && (
            <g>
              <line
                x1={chartPadLeft + hoveredIndex * barStep}
                y1={chartTop}
                x2={chartPadLeft + hoveredIndex * barStep}
                y2={chartBottom}
                stroke="#1769FF"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={chartPadLeft}
                y1={getY(visibleBars[hoveredIndex].close)}
                x2={chartPadLeft + plotWidth}
                y2={getY(visibleBars[hoveredIndex].close)}
                stroke="#1769FF"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Date labels along bottom */}
          {dateLabels.map((lbl, i) => (
            <text
              key={i}
              x={lbl.x}
              y={hasVolume ? volBottom + 16 : chartBottom + 18}
              textAnchor="middle"
              fill="currentColor"
              className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500"
            >
              {lbl.text}
            </text>
          ))}
        </svg>
      </div>

      {/* 5. FOOTER STATUS BAR */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real yfinance historical feed active</span>
          <span>·</span>
          <span>Timeframe: {activeTimeframe} ({visibleBars.length} bars)</span>
        </div>

        <Link
          href={`/research?ticker=${instrument.symbol}`}
          className="text-[#1769FF] dark:text-blue-400 font-medium hover:underline"
        >
          Launch full analytical research desk for {instrument.symbol} →
        </Link>
      </div>
    </div>
  );
}
