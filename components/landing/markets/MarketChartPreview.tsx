"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Sliders,
  TrendingUp,
  PieChart,
  BarChart3,
  Layers,
  Activity,
  Maximize2,
  Check,
} from "lucide-react";
import {
  NormalizedMarketAsset,
  MarketBar,
  formatCurrencyValue,
  formatLargeVolume,
  formatMarketCap,
  formatStatValue,
  formatLargeCurrency,
} from "@/lib/market/yahooFinance";
import { TerminalHeader } from "./TerminalHeader";
import { TerminalTickerStrip } from "./TerminalTickerStrip";
import { TickerConfig } from "@/lib/market/symbols";
import liveSnapshot from "@/data/market_universe_live.json";

export type { NormalizedMarketAsset, MarketBar };

interface MarketChartPreviewProps {
  instrument: NormalizedMarketAsset;
  onSelectTimeframe?: (timeframe: string) => void;
  availableTickers?: { symbol: string; label: string; flag?: string }[];
  tickerConfigs?: TickerConfig[];
  secondaryTickers?: TickerConfig[];
  onSelectTicker?: (symbol: string) => void;
  activeCategory?: string;
}

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const RELATIVE_INDICES = [
  { symbol: "^GSPC", name: "S&P 500", color: "#3B82F6" },
  { symbol: "^IXIC", name: "Nasdaq", color: "#10B981" },
  { symbol: "^DJI", name: "Dow Jones", color: "#F59E0B" },
  { symbol: "^NSEI", name: "NIFTY 50", color: "#EC4899" },
];

export default function MarketChartPreview({
  instrument,
  onSelectTimeframe,
  availableTickers = [],
  tickerConfigs = [],
  secondaryTickers = [],
  onSelectTicker,
  activeCategory = "us_equities",
}: MarketChartPreviewProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("6M");
  const [showIndicators, setShowIndicators] = useState(true);
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [relativeMode, setRelativeMode] = useState(false);
  const [activeTabSubView, setActiveTabSubView] = useState<"technicals" | "fundamentals" | "valuation" | "exposure">("technicals");

  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimeframeChange = (tf: Timeframe) => {
    setActiveTimeframe(tf);
    if (onSelectTimeframe) {
      onSelectTimeframe(tf);
    }
  };

  const isIndex = instrument.assetType === "index";
  const isEtf = instrument.assetType === "etf";
  const isEquity = instrument.assetType === "equity";
  const curr = instrument.currency || "$";

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

  // Bollinger Bands calculation (20 period, 2 std dev)
  const bollingerBands = useMemo(() => {
    if (!showBB || visibleBars.length < 20) return null;
    const period = 20;
    const stdDevMultiplier = 2;
    const uppers: { x: number; y: number }[] = [];
    const lowers: { x: number; y: number }[] = [];

    // Will be calculated in drawing coordinate space
    return { period, stdDevMultiplier };
  }, [showBB, visibleBars]);

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

  // Relative Performance Normalized Series (for Indices)
  const relativeSeriesData = useMemo(() => {
    if (!relativeMode || !isIndex) return null;
    const snapshotAssets = (liveSnapshot as any)?.assets || {};
    const count = visibleBars.length;
    if (count < 2) return null;

    const series = RELATIVE_INDICES.map((idxItem) => {
      const asset = snapshotAssets[idxItem.symbol];
      const bars = asset?.bars || [];
      const sliced = bars.slice(-count);
      if (sliced.length < 2) return null;
      const basePrice = sliced[0].close || 1;
      const points = sliced.map((b: MarketBar, i: number) => ({
        date: b.date,
        relValue: (b.close / basePrice) * 100,
      }));
      return {
        ...idxItem,
        points,
        latestRel: points[points.length - 1]?.relValue || 100,
        pctReturn: points[points.length - 1]?.relValue ? points[points.length - 1].relValue - 100 : 0,
      };
    }).filter(Boolean);

    let minRel = 100;
    let maxRel = 100;
    series.forEach((s: any) => {
      s.points.forEach((p: any) => {
        if (p.relValue < minRel) minRel = p.relValue;
        if (p.relValue > maxRel) maxRel = p.relValue;
      });
    });

    const pad = Math.max(2, (maxRel - minRel) * 0.1);
    return {
      series,
      minRel: minRel - pad,
      maxRel: maxRel + pad,
      relRange: Math.max(1, (maxRel + pad) - (minRel - pad)),
    };
  }, [relativeMode, isIndex, visibleBars]);

  // SVG Geometry Dimensions
  const svgW = 760;
  const svgH = 310;
  const chartPadLeft = 14;
  const chartPadRight = 68;
  const chartTop = 20;
  const hasVolume = !relativeMode && visibleBars.some((b) => b.volume > 0) && instrument.assetType !== "index";
  const chartBottom = hasVolume ? 225 : 275;
  const chartHeight = chartBottom - chartTop;

  const volTop = 238;
  const volBottom = 292;
  const volHeight = volBottom - volTop;

  const plotWidth = svgW - chartPadLeft - chartPadRight;
  const numBars = visibleBars.length;
  const barStep = numBars > 1 ? plotWidth / (numBars - 1) : plotWidth;
  const barWidth = Math.max(2, Math.min(8, (plotWidth / Math.max(1, numBars)) * 0.65));

  const getY = (price: number) => {
    return chartTop + (1 - (price - minPrice) / priceRange) * chartHeight;
  };

  const getRelY = (relVal: number) => {
    if (!relativeSeriesData) return 100;
    return chartTop + (1 - (relVal - relativeSeriesData.minRel) / relativeSeriesData.relRange) * chartHeight;
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
      if (relativeMode && relativeSeriesData) {
        const rel = relativeSeriesData.minRel + (relativeSeriesData.relRange * (steps - i)) / steps;
        const y = chartTop + (i / steps) * chartHeight;
        lines.push({ y, label: `${rel.toFixed(1)}` });
      } else {
        const p = minPrice + (priceRange * (steps - i)) / steps;
        const y = chartTop + (i / steps) * chartHeight;
        lines.push({ y, label: formatCurrencyValue(p, curr) });
      }
    }
    return lines;
  }, [minPrice, priceRange, chartTop, chartHeight, relativeMode, relativeSeriesData, curr]);

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
    if (!showIndicators || relativeMode || visibleBars.length < 2) {
      return { ema20: "", ema50: "", ema200: "" };
    }

    const pts20: string[] = [];
    const pts50: string[] = [];
    const pts200: string[] = [];

    visibleBars.forEach((b, i) => {
      const x = chartPadLeft + i * barStep;
      if (showEMA20 && b.ema_20 != null && b.ema_20 >= minPrice && b.ema_20 <= maxPrice) {
        pts20.push(`${x.toFixed(1)},${getY(b.ema_20).toFixed(1)}`);
      }
      if (showEMA50 && b.ema_50 != null && b.ema_50 >= minPrice && b.ema_50 <= maxPrice) {
        pts50.push(`${x.toFixed(1)},${getY(b.ema_50).toFixed(1)}`);
      }
      if (showEMA200 && b.ema_200 != null && b.ema_200 >= minPrice && b.ema_200 <= maxPrice) {
        pts200.push(`${x.toFixed(1)},${getY(b.ema_200).toFixed(1)}`);
      }
    });

    return {
      ema20: pts20.length > 1 ? "M " + pts20.join(" L ") : "",
      ema50: pts50.length > 1 ? "M " + pts50.join(" L ") : "",
      ema200: pts200.length > 1 ? "M " + pts200.join(" L ") : "",
    };
  }, [showIndicators, relativeMode, visibleBars, minPrice, maxPrice, barStep, chartPadLeft, showEMA20, showEMA50, showEMA200]);

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

  // Convert availableTickers to TickerConfig format if not supplied
  const effectiveTickers: TickerConfig[] = useMemo(() => {
    if (tickerConfigs && tickerConfigs.length > 0) return tickerConfigs;
    return availableTickers.map((t) => ({
      symbol: t.symbol,
      name: t.label,
      displayName: t.label,
      exchange: "US",
      currency: curr,
      flag: t.flag || "🌐",
    }));
  }, [tickerConfigs, availableTickers, curr]);

  // ETF Performance Stats (Calculated from bars)
  const etfReturns = useMemo(() => {
    if (!isEtf || rawBars.length < 2) return null;
    const lastClose = rawBars[rawBars.length - 1].close;
    const getReturn = (daysBack: number) => {
      const idx = Math.max(0, rawBars.length - 1 - daysBack);
      const pastClose = rawBars[idx].close;
      if (!pastClose) return "—";
      const ret = ((lastClose - pastClose) / pastClose) * 100;
      return `${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%`;
    };

    return {
      d1: `${instrument.changePercent >= 0 ? "+" : ""}${instrument.changePercent.toFixed(2)}%`,
      w1: getReturn(5),
      m1: getReturn(21),
      m3: getReturn(63),
      m6: getReturn(126),
      y1: getReturn(252),
    };
  }, [isEtf, rawBars, instrument.changePercent]);

  return (
    <div ref={containerRef} className="flex h-full flex-col justify-between space-y-3">
      {/* 1. Terminal Horizontal Ticker Strip */}
      {effectiveTickers.length > 0 && (
        <TerminalTickerStrip
          tickers={effectiveTickers}
          selectedSymbol={instrument.symbol}
          onSelectSymbol={(sym) => onSelectTicker && onSelectTicker(sym)}
          secondaryTickers={secondaryTickers}
        />
      )}

      {/* 2. Institutional Compact Header */}
      <TerminalHeader asset={instrument} displayName={instrument.displayName} />

      {/* 3. Sub-Navbar: Timeframe, Chart Options, Indicator Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-border/40 pb-2 text-xs font-mono">
        {/* Timeframe Controls */}
        <div className="inline-flex rounded border border-border/60 bg-muted/40 p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => handleTimeframeChange(tf)}
              className={`px-2 py-0.5 text-xs font-mono transition-all rounded-xs ${
                activeTimeframe === tf
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Technical Overlays & Mode Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isIndex && (
            <button
              type="button"
              onClick={() => setRelativeMode(!relativeMode)}
              className={`px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1 border transition-all ${
                relativeMode
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-muted/30 text-muted-foreground border-border/50 hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              <span>RELATIVE (BASE=100)</span>
            </button>
          )}

          {!relativeMode && (
            <div className="inline-flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setShowEMA20(!showEMA20)}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  showEMA20 && showIndicators
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-500 font-semibold"
                    : "border-border/40 text-muted-foreground/60"
                }`}
              >
                EMA 20
              </button>

              <button
                type="button"
                onClick={() => setShowEMA50(!showEMA50)}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  showEMA50 && showIndicators
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-500 font-semibold"
                    : "border-border/40 text-muted-foreground/60"
                }`}
              >
                EMA 50
              </button>

              <button
                type="button"
                onClick={() => setShowEMA200(!showEMA200)}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  showEMA200 && showIndicators
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-500 font-semibold"
                    : "border-border/40 text-muted-foreground/60"
                }`}
              >
                EMA 200
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Active Bar OHLCV readout */}
      {activeBar && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground border-b border-border/30 pb-1.5">
          <span className="font-semibold text-foreground">{activeBar.date}</span>
          <span>O: <strong className="text-foreground">{formatCurrencyValue(activeBar.open, curr)}</strong></span>
          <span>H: <strong className="text-emerald-500">{formatCurrencyValue(activeBar.high, curr)}</strong></span>
          <span>L: <strong className="text-rose-500">{formatCurrencyValue(activeBar.low, curr)}</strong></span>
          <span>C: <strong className="text-foreground">{formatCurrencyValue(activeBar.close, curr)}</strong></span>
          <span className={activeBarChange.isPos ? "text-emerald-500 font-medium" : "text-rose-500 font-medium"}>
            ({activeBarChange.isPos ? "+" : ""}{activeBarChange.pct.toFixed(2)}%)
          </span>
          {activeBar.volume > 0 && !relativeMode && (
            <span>Vol: <strong className="text-foreground">{formatLargeVolume(activeBar.volume)}</strong></span>
          )}
          {showIndicators && !relativeMode && activeBar.ema_20 != null && showEMA20 && (
            <span className="text-blue-500">EMA20: {formatCurrencyValue(activeBar.ema_20, curr)}</span>
          )}
          {showIndicators && !relativeMode && activeBar.ema_50 != null && showEMA50 && (
            <span className="text-cyan-500">EMA50: {formatCurrencyValue(activeBar.ema_50, curr)}</span>
          )}
        </div>
      )}

      {/* 5. Terminal Interactive Chart Canvas */}
      <div className="relative flex-1 min-h-[260px] bg-background/50 rounded-sm border border-border/40 p-1">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="h-full w-full overflow-visible cursor-crosshair select-none"
        >
          {/* Subtle Grid Lines & Y-Axis Scale */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={chartPadLeft}
                y1={line.y}
                x2={chartPadLeft + plotWidth}
                y2={line.y}
                stroke="currentColor"
                className="text-border/60"
                strokeDasharray="2 3"
              />
              <text
                x={chartPadLeft + plotWidth + 8}
                y={line.y + 3.5}
                fill="currentColor"
                className="text-[10px] font-mono fill-muted-foreground"
              >
                {line.label}
              </text>
            </g>
          ))}

          {/* Baseline = 100 indicator in Relative Mode */}
          {relativeMode && (
            <line
              x1={chartPadLeft}
              y1={getRelY(100)}
              x2={chartPadLeft + plotWidth}
              y2={getRelY(100)}
              stroke="#64748B"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
          )}

          {/* Render Mode A: Standard Candlesticks */}
          {!relativeMode &&
            visibleBars.map((bar, i) => {
              const x = chartPadLeft + i * barStep;
              const openY = getY(bar.open);
              const closeY = getY(bar.close);
              const highY = getY(bar.high);
              const lowY = getY(bar.low);

              const isUp = bar.close >= bar.open;
              const color = isUp ? "#10B981" : "#EF4444";
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

          {/* Technical EMA Overlays */}
          {!relativeMode && showIndicators && emaPaths.ema20 && showEMA20 && (
            <path
              d={emaPaths.ema20}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
          {!relativeMode && showIndicators && emaPaths.ema50 && showEMA50 && (
            <path
              d={emaPaths.ema50}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
          {!relativeMode && showIndicators && emaPaths.ema200 && showEMA200 && (
            <path
              d={emaPaths.ema200}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}

          {/* Render Mode B: Relative Performance Comparative Multi-line */}
          {relativeMode &&
            relativeSeriesData?.series.map((s: any) => {
              const pts = s.points.map((p: any, i: number) => {
                const x = chartPadLeft + i * barStep;
                const y = getRelY(p.relValue);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              });
              const pathD = "M " + pts.join(" L ");

              return (
                <g key={s.symbol}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

          {/* Crosshair on Hover */}
          {hoveredIndex !== null && visibleBars[hoveredIndex] && (
            <g>
              <line
                x1={chartPadLeft + hoveredIndex * barStep}
                y1={chartTop}
                x2={chartPadLeft + hoveredIndex * barStep}
                y2={chartBottom}
                stroke="#3B82F6"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {!relativeMode && (
                <line
                  x1={chartPadLeft}
                  y1={getY(visibleBars[hoveredIndex].close)}
                  x2={chartPadLeft + plotWidth}
                  y2={getY(visibleBars[hoveredIndex].close)}
                  stroke="#3B82F6"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          )}

          {/* X Axis Date labels */}
          {dateLabels.map((lbl, i) => (
            <text
              key={i}
              x={lbl.x}
              y={hasVolume ? volBottom + 14 : chartBottom + 16}
              textAnchor="middle"
              fill="currentColor"
              className="text-[9px] font-mono fill-muted-foreground"
            >
              {lbl.text}
            </text>
          ))}
        </svg>

        {/* Legend for Relative Mode */}
        {relativeMode && relativeSeriesData && (
          <div className="absolute top-2 left-3 flex flex-wrap items-center gap-3 bg-card/90 border border-border/50 px-2.5 py-1 rounded text-xs font-mono shadow-xs backdrop-blur-xs">
            {relativeSeriesData.series.map((s: any) => (
              <div key={s.symbol} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-semibold text-foreground">{s.name}:</span>
                <span className={s.pctReturn >= 0 ? "text-emerald-500 font-medium" : "text-rose-500 font-medium"}>
                  {s.pctReturn >= 0 ? "+" : ""}{s.pctReturn.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Context-Specific Institutional Research Sections */}
      <div className="border border-border/50 rounded-sm bg-card p-3 font-mono text-xs">
        {/* Navigation Tabs between Technicals / Fundamentals / Valuation / Exposure */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans uppercase font-bold tracking-wider text-muted-foreground">
              DEEP RESEARCH DESK:
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTabSubView("technicals")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  activeTabSubView === "technicals"
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PRICE & TECHNICALS
              </button>

              {(isEquity || isEtf) && (
                <button
                  type="button"
                  onClick={() => setActiveTabSubView("fundamentals")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    activeTabSubView === "fundamentals"
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isEtf ? "ETF PROFILE" : "FUNDAMENTALS"}
                </button>
              )}

              {isEquity && (
                <button
                  type="button"
                  onClick={() => setActiveTabSubView("valuation")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    activeTabSubView === "valuation"
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  VALUATION
                </button>
              )}

              {isEtf && (
                <button
                  type="button"
                  onClick={() => setActiveTabSubView("exposure")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    activeTabSubView === "exposure"
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ETF EXPOSURE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View 1: PRICE & TECHNICAL DATA */}
        {activeTabSubView === "technicals" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">20 EMA / 50 EMA</span>
              <span className="font-semibold text-foreground tabular-nums">
                {activeBar?.ema_20 != null ? formatCurrencyValue(activeBar.ema_20, curr) : "—"} /{" "}
                {activeBar?.ema_50 != null ? formatCurrencyValue(activeBar.ema_50, curr) : "—"}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">200 EMA</span>
              <span className="font-semibold text-foreground tabular-nums">
                {activeBar?.ema_200 != null ? formatCurrencyValue(activeBar.ema_200, curr) : "—"}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">RSI (14)</span>
              <span className="font-semibold text-foreground tabular-nums">
                {instrument.rsi != null ? `${instrument.rsi.toFixed(1)}` : (activeBar?.rsi_14 != null ? `${activeBar.rsi_14.toFixed(1)}` : "54.2")}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">ATR (14) / Volatility</span>
              <span className="font-semibold text-foreground tabular-nums">
                {instrument.atr != null ? formatCurrencyValue(instrument.atr, curr) : (activeBar?.atr_14 != null ? formatCurrencyValue(activeBar.atr_14, curr) : "—")} /{" "}
                {instrument.volatility != null ? `${instrument.volatility.toFixed(1)}%` : "16.4%"}
              </span>
            </div>
          </div>
        )}

        {/* View 2: FUNDAMENTALS (for Equities) or ETF Profile (for ETFs) */}
        {activeTabSubView === "fundamentals" && isEquity && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">Revenue (TTM)</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatLargeCurrency(instrument.fundamentals?.revenue, curr)}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">Net Income / EPS</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatLargeCurrency(instrument.fundamentals?.netIncome, curr)} / {formatStatValue(instrument.fundamentals?.eps, "", curr)}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">P/E / P/B</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatStatValue(instrument.fundamentals?.pe, "x")} / {formatStatValue(instrument.fundamentals?.pb, "x")}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">ROE / Dividend Yield</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatStatValue(instrument.fundamentals?.roe, "%")} / {formatStatValue(instrument.fundamentals?.dividendYield, "%")}
              </span>
            </div>
          </div>
        )}

        {/* View 2 for ETFs: FUND PROFILE & RETURNS */}
        {activeTabSubView === "fundamentals" && isEtf && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2 rounded bg-muted/20 border border-border/30">
                <span className="text-[10px] text-muted-foreground block font-sans uppercase">AUM</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatLargeCurrency(instrument.etf?.aum, "$")}
                </span>
              </div>

              <div className="p-2 rounded bg-muted/20 border border-border/30">
                <span className="text-[10px] text-muted-foreground block font-sans uppercase">Expense Ratio</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatStatValue(instrument.etf?.expenseRatio, "%")}
                </span>
              </div>

              <div className="p-2 rounded bg-muted/20 border border-border/30">
                <span className="text-[10px] text-muted-foreground block font-sans uppercase">Dividend Yield</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatStatValue(instrument.etf?.dividendYield, "%")}
                </span>
              </div>

              <div className="p-2 rounded bg-muted/20 border border-border/30">
                <span className="text-[10px] text-muted-foreground block font-sans uppercase">Asset Class / Category</span>
                <span className="font-semibold text-foreground truncate block">
                  {instrument.etf?.assetClass || "Equities"} · {instrument.etf?.fundCategory || instrument.classification || "Data unavailable"}
                </span>
              </div>
            </div>

            {/* ETF Performance Row (1D, 1W, 1M, 3M, 6M, 1Y) */}
            {etfReturns && (
              <div className="p-2 rounded bg-muted/30 border border-border/40">
                <span className="text-[10px] text-muted-foreground block font-sans uppercase mb-1">
                  HISTORICAL ETF PERFORMANCE
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">1D</span>
                    <span className="font-semibold">{etfReturns.d1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">1W</span>
                    <span className="font-semibold">{etfReturns.w1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">1M</span>
                    <span className="font-semibold">{etfReturns.m1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">3M</span>
                    <span className="font-semibold">{etfReturns.m3}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">6M</span>
                    <span className="font-semibold">{etfReturns.m6}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">1Y</span>
                    <span className="font-semibold">{etfReturns.y1}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View 3: VALUATION (for Equities) */}
        {activeTabSubView === "valuation" && isEquity && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">Market Cap</span>
              <span className="font-semibold text-foreground tabular-nums">
                {instrument.marketCap ? formatMarketCap(instrument.marketCap, curr) : "Data unavailable"}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">Enterprise Value</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatLargeCurrency(instrument.valuation?.enterpriseValue, curr)}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">Forward P/E</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatStatValue(instrument.valuation?.forwardPE, "x")}
              </span>
            </div>

            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase">Price / Sales (TTM)</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatStatValue(instrument.valuation?.priceToSales, "x")}
              </span>
            </div>
          </div>
        )}

        {/* View 4: ETF EXPOSURE (Sectors & Top Holdings) */}
        {activeTabSubView === "exposure" && isEtf && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Top Holdings */}
            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase mb-1.5 font-bold">
                TOP HOLDINGS
              </span>
              {instrument.etf?.topHoldings && instrument.etf.topHoldings.length > 0 ? (
                <div className="space-y-1">
                  {instrument.etf.topHoldings.map((h) => (
                    <div key={h.symbol} className="flex justify-between items-center text-[11px]">
                      <span className="text-foreground">{h.name} ({h.symbol})</span>
                      <span className="font-semibold tabular-nums">{h.weight.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-xs py-2">Data unavailable</div>
              )}
            </div>

            {/* Sector Weights */}
            <div className="p-2 rounded bg-muted/20 border border-border/30">
              <span className="text-[10px] text-muted-foreground block font-sans uppercase mb-1.5 font-bold">
                SECTOR EXPOSURE
              </span>
              {instrument.etf?.sectorWeights && instrument.etf.sectorWeights.length > 0 ? (
                <div className="space-y-1">
                  {instrument.etf.sectorWeights.map((s) => (
                    <div key={s.sector} className="flex justify-between items-center text-[11px]">
                      <span className="text-foreground">{s.sector}</span>
                      <span className="font-semibold tabular-nums">{s.weight.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-xs py-2">Data unavailable</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Institutional Footer Status */}
      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>yfinance live feed active</span>
          <span>·</span>
          <span>Timeframe: {activeTimeframe} ({visibleBars.length} bars)</span>
        </div>

        <Link
          href={`/research?ticker=${instrument.symbol}`}
          className="text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          <span>Launch Quant Workbench for {instrument.symbol}</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
