"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MarketBar } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/formatters";

export type ChartType = "candlestick" | "line" | "area";

interface MarketCandleProps {
  bars: MarketBar[];
  ticker: string;
  activeIndicators?: string[];
  height?: number;
  chartType?: ChartType;
  onChartTypeChange?: (type: ChartType) => void;
  onPresetSelect?: (preset: "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "ALL") => void;
  hideHeader?: boolean;
  hideBorder?: boolean;
}

// Custom Candlestick Shape for Recharts Bar
const CandlestickBarShape = (props: any) => {
  const { x, width, payload, background, domainMin, domainMax } = props;
  if (!payload || payload.open === undefined || payload.close === undefined) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  // Institutional terminal palette: clean restrained emerald green (#10B981) and crimson red (#EF4444)
  const color = isUp ? "#10B981" : "#EF4444";

  const plotTop = background?.y ?? 8;
  const plotHeight = background?.height ?? 300;
  const domainSpan = (domainMax ?? 100) - (domainMin ?? 0);

  const getY = (val: number) => {
    if (domainSpan <= 0) return plotTop + plotHeight / 2;
    const ratio = (val - (domainMin ?? 0)) / domainSpan;
    return plotTop + plotHeight - ratio * plotHeight;
  };

  const yHigh = getY(high ?? Math.max(open, close));
  const yLow = getY(low ?? Math.min(open, close));
  const yOpen = getY(open);
  const yClose = getY(close);

  const centerX = x + width / 2;
  const candleWidth = Math.max(Math.min(width * 0.75, 12), 2);
  const candleX = centerX - candleWidth / 2;
  const bodyY = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1.5);

  return (
    <g className="recharts-candlestick-item">
      {/* High-to-Low Wick */}
      <line
        x1={centerX}
        y1={yHigh}
        x2={centerX}
        y2={yLow}
        stroke={color}
        strokeWidth={1}
      />
      {/* Real Body */}
      <rect
        x={candleX}
        y={bodyY}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={0.5}
      />
    </g>
  );
};

export default function MarketCandleChart({
  bars,
  ticker,
  activeIndicators = ["sma_20", "sma_50", "ema_20", "bb_upper", "bb_lower", "vwap"],
  height = 360,
  chartType: externalChartType,
  onChartTypeChange,
  onPresetSelect,
  hideHeader = false,
  hideBorder = false,
}: MarketCandleProps) {
  const [internalChartType, setInternalChartType] = useState<ChartType>("candlestick");
  const [hoveredBar, setHoveredBar] = useState<MarketBar | null>(null);
  const [pinnedBar, setPinnedBar] = useState<MarketBar | null>(null);
  const [activeRange, setActiveRange] = useState<string>("ALL");

  const chartType = externalChartType ?? internalChartType;
  const setChartType = (type: ChartType) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    } else {
      setInternalChartType(type);
    }
  };

  // Slice bars according to internal range if "ALL" isn't active
  const visibleBars = useMemo(() => {
    if (!bars || bars.length === 0) return [];
    if (activeRange === "ALL") return bars;
    if (activeRange === "1M") return bars.slice(-21);
    if (activeRange === "3M") return bars.slice(-63);
    if (activeRange === "6M") return bars.slice(-126);
    if (activeRange === "1Y") return bars.slice(-252);
    if (activeRange === "5D") return bars.slice(-5);
    if (activeRange === "1D") return bars.slice(-1);
    return bars;
  }, [bars, activeRange]);

  if (!bars || bars.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center border border-[#252A31] bg-[#101318] text-[#89919C] font-mono text-xs">
        NO OHLCV BARS AVAILABLE FOR {ticker}
      </div>
    );
  }

  const latestBar = visibleBars[visibleBars.length - 1] || bars[bars.length - 1];
  const displayBar = pinnedBar || hoveredBar || latestBar;

  const minPrice = Math.min(...visibleBars.map((b) => b.low));
  const maxPrice = Math.max(...visibleBars.map((b) => b.high));
  const padding = (maxPrice - minPrice) * 0.03;
  const maxVolume = Math.max(...visibleBars.map((b) => b.volume || 0));

  const handleRangeClick = (preset: "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "ALL") => {
    setActiveRange(preset);
    if (onPresetSelect) {
      onPresetSelect(preset);
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#101318] overflow-hidden ${
        hideBorder ? "" : "border border-[#252A31]"
      }`}
    >
      {/* 1. TOP TERMINAL READOUT HEADER */}
      {!hideHeader && (
        <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-[#252A31] bg-[#0B0D10] text-xs font-mono select-none">
          {/* Synchronized OHLCV Readout */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
            <span className="font-bold text-[#D8DCE2]">{ticker}</span>
            <span className="text-[#59616B]">{displayBar.date}</span>
            <span className="text-[#89919C]">
              O <span className="text-[#D8DCE2]">{displayBar.open.toFixed(2)}</span>
            </span>
            <span className="text-[#89919C]">
              H <span className="text-[#10B981]">{displayBar.high.toFixed(2)}</span>
            </span>
            <span className="text-[#89919C]">
              L <span className="text-[#EF4444]">{displayBar.low.toFixed(2)}</span>
            </span>
            <span className="text-[#89919C]">
              C <span className="text-white font-bold">{displayBar.close.toFixed(2)}</span>
            </span>
            <span className="text-[#89919C] hidden md:inline">
              V <span className="text-[#D8DCE2]">{formatNumber(displayBar.volume)}</span>
            </span>
            {pinnedBar && (
              <button
                type="button"
                onClick={() => setPinnedBar(null)}
                className="text-[10px] text-[#F59E0B] hover:underline"
              >
                [PINNED - UNPIN]
              </button>
            )}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 text-[10px] font-sans">
            <button
              type="button"
              onClick={() => setChartType("candlestick")}
              className={`px-2 py-0.5 border border-[#252A31] transition-colors ${
                chartType === "candlestick"
                  ? "bg-[#141820] text-[#38BDF8] font-bold border-[#38BDF8]/40"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              CANDLES
            </button>
            <button
              type="button"
              onClick={() => setChartType("line")}
              className={`px-2 py-0.5 border border-[#252A31] transition-colors ${
                chartType === "line"
                  ? "bg-[#141820] text-[#38BDF8] font-bold border-[#38BDF8]/40"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              LINE
            </button>
            <button
              type="button"
              onClick={() => setChartType("area")}
              className={`px-2 py-0.5 border border-[#252A31] transition-colors ${
                chartType === "area"
                  ? "bg-[#141820] text-[#38BDF8] font-bold border-[#38BDF8]/40"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              AREA
            </button>
          </div>
        </div>
      )}

      {/* 2. CHART BODY (Flat, crosshair cursor, zero padding cards) */}
      <div style={{ width: "100%", height }} className="relative shrink-0 cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={visibleBars}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clicked = state.activePayload[0].payload as MarketBar;
                setPinnedBar((prev) => (prev?.date === clicked.date ? null : clicked));
              }
            }}
            onMouseMove={(state) => {
              if (!pinnedBar && state && state.activePayload && state.activePayload.length > 0) {
                setHoveredBar(state.activePayload[0].payload as MarketBar);
              }
            }}
            onMouseLeave={() => {
              if (!pinnedBar) setHoveredBar(null);
            }}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1E232B" strokeDasharray="1 1" vertical={false} />

            <XAxis
              xAxisId="price"
              dataKey="date"
              stroke="#59616B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#252A31" }}
              tickFormatter={(v) => v.slice(5)}
            />
            <XAxis
              xAxisId="vol"
              dataKey="date"
              hide={true}
            />

            <YAxis
              yAxisId="price"
              stroke="#59616B"
              fontSize={10}
              domain={[minPrice - padding, maxPrice + padding]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />

            <YAxis
              yAxisId="vol"
              orientation="right"
              stroke="#3D444E"
              fontSize={9}
              domain={[0, maxVolume * 4.5]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
            />

            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "#59616B", strokeWidth: 1, strokeDasharray: "2 2" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as MarketBar;
                return (
                  <div className="rounded-[2px] border border-[#252A31] bg-[#101318] p-2 font-mono text-xs shadow-none min-w-[160px]">
                    <div className="text-[#89919C] pb-1 border-b border-[#252A31] mb-1 font-bold flex justify-between">
                      <span>{d.date}</span>
                      <span className="text-[#D8DCE2]">{ticker}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                      <div>
                        <span className="text-[#59616B]">O:</span>{" "}
                        <span className="text-[#D8DCE2]">{d.open.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[#59616B]">H:</span>{" "}
                        <span className="text-[#10B981]">{d.high.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[#59616B]">L:</span>{" "}
                        <span className="text-[#EF4444]">{d.low.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[#59616B]">C:</span>{" "}
                        <span className="text-white font-bold">{d.close.toFixed(2)}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-[#252A31] text-[9px] text-[#89919C] flex justify-between">
                        <span>VOL: {formatNumber(d.volume)}</span>
                        {d.return !== undefined && (
                          <span className={d.return >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                            {(d.return * 100).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* Volume bars */}
            <Bar
              xAxisId="vol"
              yAxisId="vol"
              dataKey="volume"
              fill="#1E232B"
              opacity={0.8}
              isAnimationActive={false}
            />

            {/* Candlestick Mode */}
            {chartType === "candlestick" && (
              <Bar
                xAxisId="price"
                yAxisId="price"
                dataKey="close"
                shape={
                  <CandlestickBarShape
                    domainMin={minPrice - padding}
                    domainMax={maxPrice + padding}
                  />
                }
                isAnimationActive={false}
              />
            )}

            {/* Line Mode */}
            {chartType === "line" && (
              <Line
                xAxisId="price"
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#38BDF8"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Area Mode */}
            {chartType === "area" && (
              <Area
                xAxisId="price"
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="#38BDF8"
                strokeWidth={1.5}
                fill="url(#areaGradient)"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Technical Overlays */}
            {activeIndicators.includes("sma_20") && (
              <Line
                xAxisId="price"
                yAxisId="price"
                type="monotone"
                dataKey="sma_20"
                stroke="#F59E0B"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeIndicators.includes("sma_50") && (
              <Line
                xAxisId="price"
                yAxisId="price"
                type="monotone"
                dataKey="sma_50"
                stroke="#3B82F6"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeIndicators.includes("ema_20") && (
              <Line
                xAxisId="price"
                yAxisId="price"
                type="monotone"
                dataKey="ema_20"
                stroke="#A855F7"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeIndicators.includes("bb_upper") && (
              <Line
                xAxisId="price"
                yAxisId="price"
                type="monotone"
                dataKey="bb_upper"
                stroke="#38BDF8"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeIndicators.includes("bb_lower") && (
              <Line
                xAxisId="price"
                yAxisId="price"
                type="monotone"
                dataKey="bb_lower"
                stroke="#38BDF8"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeIndicators.includes("vwap") && (
              <Line
                xAxisId="price"
                yAxisId="price"
                type="monotone"
                dataKey="vwap"
                stroke="#06B6D4"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 3. BOTTOM CONTROL BAR: 1D 5D 1M 3M 6M YTD 1Y 3Y ALL + INDICATOR METRICS */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-t border-[#252A31] bg-[#0B0D10] text-[11px] font-mono shrink-0">
        {/* Left: Window Slicers */}
        <div className="flex items-center space-x-1">
          {(["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "3Y", "ALL"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRangeClick(r)}
              className={`px-1.5 py-0.5 rounded-[2px] transition-colors ${
                activeRange === r
                  ? "bg-[#141820] text-[#38BDF8] font-bold border border-[#252A31]"
                  : "text-[#59616B] hover:text-[#D8DCE2]"
              }`}
            >
              {r}
            </button>
          ))}
          {activeRange !== "ALL" && (
            <button
              type="button"
              onClick={() => setActiveRange("ALL")}
              className="text-[10px] text-[#59616B] hover:text-[#D8DCE2] pl-1 border-l border-[#252A31]"
            >
              RESET
            </button>
          )}
        </div>

        {/* Right: Active Indicator Values */}
        <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-[#89919C]">
          {activeIndicators.includes("sma_20") && latestBar.sma_20 && (
            <div className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-[#F59E0B]" />
              <span>SMA20: {latestBar.sma_20.toFixed(2)}</span>
            </div>
          )}
          {activeIndicators.includes("sma_50") && latestBar.sma_50 && (
            <div className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-[#3B82F6]" />
              <span>SMA50: {latestBar.sma_50.toFixed(2)}</span>
            </div>
          )}
          {activeIndicators.includes("ema_20") && latestBar.ema_20 && (
            <div className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-[#A855F7]" />
              <span>EMA20: {latestBar.ema_20.toFixed(2)}</span>
            </div>
          )}
          {activeIndicators.includes("bb_upper") && latestBar.bb_upper && (
            <div className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-[#38BDF8]" />
              <span>BB: {latestBar.bb_upper.toFixed(1)}/{latestBar.bb_lower?.toFixed(1)}</span>
            </div>
          )}
          {activeIndicators.includes("vwap") && latestBar.vwap && (
            <div className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-[#06B6D4]" />
              <span>VWAP: {latestBar.vwap.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
