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
  ReferenceLine,
} from "recharts";
import {
  SlidersHorizontal,
  GitCompare,
  PenTool,
  Settings,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { MarketBar } from "@/types";

interface ResearchPriceChartWidgetProps {
  bars: MarketBar[];
  ticker: string;
  onPresetSelect?: (preset: "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "ALL") => void;
  isIndia?: boolean;
  currencySymbol?: string;
  selectedRange?: RangeFilter;
  onRangeChange?: (range: RangeFilter) => void;
}

type ChartDisplayMode = "candles" | "line" | "area";
export type RangeFilter = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "ALL";

// Custom Candlestick Shape
const CustomCandlestickShape = (props: any) => {
  const { x, width, payload, background, domainMin, domainMax } = props;
  if (!payload || payload.open === undefined || payload.close === undefined) return <g />;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? "#10B981" : "#EF4444";

  const plotTop = background?.y ?? 10;
  const plotHeight = (background?.height ?? 400) * 0.78; // top 78% for price candles
  const domainSpan = (domainMax ?? 220) - (domainMin ?? 120);

  const getY = (val: number) => {
    if (domainSpan <= 0) return plotTop + plotHeight / 2;
    const ratio = (val - (domainMin ?? 120)) / domainSpan;
    return plotTop + plotHeight - ratio * plotHeight;
  };

  const yHigh = getY(high ?? Math.max(open, close));
  const yLow = getY(low ?? Math.min(open, close));
  const yOpen = getY(open);
  const yClose = getY(close);

  const centerX = x + width / 2;
  const candleWidth = Math.max(Math.min(width * 0.72, 10), 2.5);
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
      {/* Real Candle Body */}
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

// Custom Volume Bar Shape
const CustomVolumeBarShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return <g />;
  const isUp = (payload.close ?? 0) >= (payload.open ?? 0);
  const col = isUp ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)";
  return <rect x={x} y={y} width={Math.max(1, width * 0.7)} height={height} fill={col} />;
};

export default function ResearchPriceChartWidget({
  bars,
  ticker,
  onPresetSelect,
  isIndia,
  currencySymbol,
  selectedRange,
  onRangeChange,
}: ResearchPriceChartWidgetProps) {
  const isIndiaStock =
    isIndia !== undefined
      ? isIndia
      : ticker.endsWith(".NS") ||
        ticker.endsWith(".BO") ||
        (typeof window !== "undefined" && localStorage.getItem("algolab_active_country") === "India");

  const sym = currencySymbol || (isIndiaStock ? "₹" : "$");

  const [chartMode, setChartMode] = useState<ChartDisplayMode>("candles");
  const [internalRange, setInternalRange] = useState<RangeFilter>("1Y");
  const activeRange = selectedRange !== undefined ? selectedRange : internalRange;
  const [hoveredBar, setHoveredBar] = useState<any | null>(null);

  // Overlay Checkboxes (7 existing + 10 new overlays)
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showSma200, setShowSma200] = useState(false);
  const [showEma9, setShowEma9] = useState(false);
  const [showEma20, setShowEma20] = useState(false);
  const [showEma50, setShowEma50] = useState(false);
  const [showEma200, setShowEma200] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showKeltner, setShowKeltner] = useState(false);
  const [showDonchian, setShowDonchian] = useState(false);
  const [showVwap, setShowVwap] = useState(false);
  const [showSuperTrend, setShowSuperTrend] = useState(false);
  const [showPsar, setShowPsar] = useState(false);
  const [showIchimoku, setShowIchimoku] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showRsi, setShowRsi] = useState(false);
  const [showMacd, setShowMacd] = useState(false);

  // Reset Overlays
  const handleResetOverlays = () => {
    setShowSma20(true);
    setShowSma50(true);
    setShowSma200(false);
    setShowEma9(false);
    setShowEma20(false);
    setShowEma50(false);
    setShowEma200(false);
    setShowBollinger(false);
    setShowKeltner(false);
    setShowDonchian(false);
    setShowVwap(false);
    setShowSuperTrend(false);
    setShowPsar(false);
    setShowIchimoku(false);
    setShowVolume(true);
    setShowRsi(false);
    setShowMacd(false);
  };

  // Slice bars according to activeRange
  const visibleBars = useMemo(() => {
    if (!bars || bars.length === 0) return [];
    if (activeRange === "ALL" || activeRange === "5Y") return bars;
    if (activeRange === "1D") return bars.slice(-1);
    if (activeRange === "5D") return bars.slice(-5);
    if (activeRange === "1M") return bars.slice(-21);
    if (activeRange === "3M") return bars.slice(-63);
    if (activeRange === "6M") return bars.slice(-126);
    if (activeRange === "1Y") return bars.slice(-252);
    if (activeRange === "YTD") {
      const curYear = new Date().getFullYear();
      const idx = bars.findIndex((b) => new Date(b.date).getFullYear() === curYear);
      return idx !== -1 ? bars.slice(idx) : bars.slice(-252);
    }
    return bars;
  }, [bars, activeRange]);

  // Dynamically compute 10 New Overlays
  const enrichedBars = useMemo(() => {
    if (!visibleBars || visibleBars.length === 0) return [];

    const closes = visibleBars.map((b) => b.close);
    const highs = visibleBars.map((b) => b.high ?? b.close);
    const lows = visibleBars.map((b) => b.low ?? b.close);
    const len = visibleBars.length;

    // Helper: Simple Moving Average
    const calcSma = (arr: number[], period: number) => {
      const res: number[] = [];
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
        if (i >= period) sum -= arr[i - period];
        res.push(sum / Math.min(i + 1, period));
      }
      return res;
    };

    const sma20Arr = calcSma(closes, 20);
    const sma50Arr = calcSma(closes, 50);
    const sma200Arr = calcSma(closes, Math.min(200, Math.max(10, len)));

    // Helper: Bollinger Bands (20, 2 std dev)
    const bbUpper: number[] = [];
    const bbLower: number[] = [];
    for (let i = 0; i < len; i++) {
      const start = Math.max(0, i - 19);
      const count = i - start + 1;
      const mean = sma20Arr[i];
      let variance = 0;
      for (let j = start; j <= i; j++) {
        variance += Math.pow(closes[j] - mean, 2);
      }
      const std = Math.sqrt(variance / count);
      bbUpper.push(mean + 2 * std);
      bbLower.push(mean - 2 * std);
    }

    // Helper: Exponential Moving Average
    const calcEma = (arr: number[], period: number) => {
      const k = 2 / (period + 1);
      const res: number[] = [];
      let prev = arr[0];
      res.push(prev);
      for (let i = 1; i < arr.length; i++) {
        const val = arr[i] * k + prev * (1 - k);
        res.push(val);
        prev = val;
      }
      return res;
    };

    const ema9Arr = calcEma(closes, 9);
    const ema20Arr = calcEma(closes, 20);
    const ema50Arr = calcEma(closes, 50);
    const ema200Arr = calcEma(closes, Math.min(200, Math.max(10, len)));

    // ATR 10 for Keltner & SuperTrend
    const atr10Arr: number[] = [];
    let atrSum = 0;
    for (let i = 0; i < len; i++) {
      const tr =
        i === 0
          ? highs[0] - lows[0]
          : Math.max(
              highs[i] - lows[i],
              Math.abs(highs[i] - closes[i - 1]),
              Math.abs(lows[i] - closes[i - 1])
            );
      atrSum += tr;
      if (i >= 10) {
        const prevTr = Math.max(
          highs[i - 10] - lows[i - 10],
          Math.abs(highs[i - 10] - closes[Math.max(0, i - 11)]),
          Math.abs(lows[i - 10] - closes[Math.max(0, i - 11)])
        );
        atrSum -= prevTr;
      }
      atr10Arr.push(atrSum / Math.min(i + 1, 10));
    }

    // VWAP
    let cumVol = 0;
    let cumTypVol = 0;
    const vwapArr = visibleBars.map((b) => {
      const typ = ((b.high ?? b.close) + (b.low ?? b.close) + b.close) / 3;
      const vol = b.volume || 1;
      cumVol += vol;
      cumTypVol += typ * vol;
      return cumVol > 0 ? cumTypVol / cumVol : b.close;
    });

    // Donchian Channels (20)
    const donchianUpper: number[] = [];
    const donchianLower: number[] = [];
    for (let i = 0; i < len; i++) {
      const startIdx = Math.max(0, i - 20);
      let maxH = -Infinity;
      let minL = Infinity;
      for (let j = startIdx; j <= i; j++) {
        if (highs[j] > maxH) maxH = highs[j];
        if (lows[j] < minL) minL = lows[j];
      }
      donchianUpper.push(maxH);
      donchianLower.push(minL);
    }

    // Keltner Channels (20, 2.0)
    const keltnerUpper = ema20Arr.map((m, idx) => m + 2 * atr10Arr[idx]);
    const keltnerLower = ema20Arr.map((m, idx) => m - 2 * atr10Arr[idx]);

    // SuperTrend (10, 3)
    const supertrendArr: number[] = [];
    let prevSt = (highs[0] + lows[0]) / 2;
    let inUptrend = true;
    for (let i = 0; i < len; i++) {
      const hl2 = (highs[i] + lows[i]) / 2;
      const upper = hl2 + 3 * atr10Arr[i];
      const lower = hl2 - 3 * atr10Arr[i];
      if (inUptrend) {
        if (closes[i] < lower) {
          inUptrend = false;
          prevSt = upper;
        } else {
          prevSt = Math.max(prevSt, lower);
        }
      } else {
        if (closes[i] > upper) {
          inUptrend = true;
          prevSt = lower;
        } else {
          prevSt = Math.min(prevSt, upper);
        }
      }
      supertrendArr.push(prevSt);
    }

    // Parabolic SAR (0.02, 0.2)
    const psarArr: number[] = [];
    let sar = lows[0];
    let ep = highs[0];
    let af = 0.02;
    let sarUptrend = true;
    for (let i = 0; i < len; i++) {
      if (i === 0) {
        psarArr.push(sar);
        continue;
      }
      sar = sar + af * (ep - sar);
      if (sarUptrend) {
        if (lows[i] < sar) {
          sarUptrend = false;
          sar = ep;
          ep = lows[i];
          af = 0.02;
        } else {
          if (highs[i] > ep) {
            ep = highs[i];
            af = Math.min(0.2, af + 0.02);
          }
        }
      } else {
        if (highs[i] > sar) {
          sarUptrend = true;
          sar = ep;
          ep = highs[i];
          af = 0.02;
        } else {
          if (lows[i] < ep) {
            ep = lows[i];
            af = Math.min(0.2, af + 0.02);
          }
        }
      }
      psarArr.push(sar);
    }

    // Ichimoku Tenkan (9) & Kijun (26)
    const tenkanArr: number[] = [];
    const kijunArr: number[] = [];
    for (let i = 0; i < len; i++) {
      const tStart = Math.max(0, i - 9);
      let tMax = -Infinity;
      let tMin = Infinity;
      for (let j = tStart; j <= i; j++) {
        if (highs[j] > tMax) tMax = highs[j];
        if (lows[j] < tMin) tMin = lows[j];
      }
      tenkanArr.push((tMax + tMin) / 2);

      const kStart = Math.max(0, i - 26);
      let kMax = -Infinity;
      let kMin = Infinity;
      for (let j = kStart; j <= i; j++) {
        if (highs[j] > kMax) kMax = highs[j];
        if (lows[j] < kMin) kMin = lows[j];
      }
      kijunArr.push((kMax + kMin) / 2);
    }

    return visibleBars.map((b, idx) => ({
      ...b,
      sma_20: sma20Arr[idx],
      sma_50: sma50Arr[idx],
      sma_200: sma200Arr[idx],
      bb_upper: bbUpper[idx],
      bb_lower: bbLower[idx],
      ema_9: ema9Arr[idx],
      ema_20: ema20Arr[idx],
      ema_50: ema50Arr[idx],
      ema_200: ema200Arr[idx],
      vwap: vwapArr[idx],
      keltner_upper: keltnerUpper[idx],
      keltner_lower: keltnerLower[idx],
      donchian_upper: donchianUpper[idx],
      donchian_lower: donchianLower[idx],
      supertrend: supertrendArr[idx],
      psar: psarArr[idx],
      tenkan_sen: tenkanArr[idx],
      kijun_sen: kijunArr[idx],
    }));
  }, [visibleBars]);

  // Readout bar: latest or hovered
  const latestBar: any = enrichedBars[enrichedBars.length - 1];
  const activeBar: any = hoveredBar || latestBar;

  const currentPrice = activeBar?.close ?? 190.21;
  const currentOpen = activeBar?.open ?? 166.57;
  const currentHigh = activeBar?.high ?? 167.72;
  const currentLow = activeBar?.low ?? 165.94;
  const currentClose = activeBar?.close ?? 166.07;
  const currentReturn = activeBar?.return !== undefined ? activeBar.return * 100 : 0.18;
  const currentVol = activeBar?.volume ? activeBar.volume.toLocaleString() : "52,472,900";

  // Indicator values for overlays sidebar
  const sma20Val = activeBar?.sma_20 ? Number(activeBar.sma_20).toFixed(2) : "191.97";
  const sma50Val = activeBar?.sma_50 ? Number(activeBar.sma_50).toFixed(2) : "184.31";
  const sma200Val = activeBar?.sma_200 ? Number(activeBar.sma_200).toFixed(2) : "168.31";
  const ema9Val = activeBar?.ema_9 ? Number(activeBar.ema_9).toFixed(2) : "--";
  const ema20Val = activeBar?.ema_20 ? Number(activeBar.ema_20).toFixed(2) : "--";
  const ema50Val = activeBar?.ema_50 ? Number(activeBar.ema_50).toFixed(2) : "--";
  const ema200Val = activeBar?.ema_200 ? Number(activeBar.ema_200).toFixed(2) : "--";
  const vwapVal = activeBar?.vwap ? Number(activeBar.vwap).toFixed(2) : "--";
  const keltnerVal = activeBar?.keltner_upper ? `${Number(activeBar.keltner_upper).toFixed(0)}/${Number(activeBar.keltner_lower).toFixed(0)}` : "--";
  const donchianVal = activeBar?.donchian_upper ? `${Number(activeBar.donchian_upper).toFixed(0)}/${Number(activeBar.donchian_lower).toFixed(0)}` : "--";
  const supertrendVal = activeBar?.supertrend ? Number(activeBar.supertrend).toFixed(2) : "--";
  const psarVal = activeBar?.psar ? Number(activeBar.psar).toFixed(2) : "--";
  const ichimokuVal = activeBar?.tenkan_sen ? `${Number(activeBar.tenkan_sen).toFixed(0)}/${Number(activeBar.kijun_sen).toFixed(0)}` : "--";

  // Min & Max Price Domain for scaling
  const { minPrice, maxPrice } = useMemo(() => {
    if (!visibleBars || visibleBars.length === 0) {
      return { minPrice: 120, maxPrice: 220 };
    }
    let min = Infinity;
    let max = -Infinity;
    visibleBars.forEach((b) => {
      const l = b.low ?? b.close;
      const h = b.high ?? b.close;
      if (l < min) min = l;
      if (h > max) max = h;
    });
    const padding = (max - min) * 0.08 || 5;
    return {
      minPrice: Math.floor(min - padding),
      maxPrice: Math.ceil(max + padding),
    };
  }, [visibleBars]);

  // Max Volume for bottom sub-pane scale
  const maxVolume = useMemo(() => {
    return Math.max(1, ...visibleBars.map((b) => b.volume || 0));
  }, [visibleBars]);

  // Format Date for XAxis (e.g. Oct, Nov, Dec, 2024, Feb, Mar...)
  const formatXAxis = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const month = d.toLocaleDateString("en-US", { month: "short" });
      if (month === "Jan") {
        return d.getFullYear().toString();
      }
      return month;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="border border-[#1E2530] bg-[#0A0D14] rounded-sm overflow-hidden flex flex-col">
      {/* ========================================================
          TOOLBAR HEADER
          ======================================================== */}
      <div className="px-3.5 py-2 border-b border-[#1E2530] bg-[#0E121A] flex flex-wrap items-center justify-between gap-2 text-xs select-none">
        {/* Left: Title & Range Pills */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <span className="font-semibold text-white text-[13px] tracking-tight">
            Price Chart
          </span>

          {/* Timeframe Presets */}
          <div className="flex items-center space-x-0.5 text-[10px]">
            {(["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "ALL"] as RangeFilter[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setInternalRange(r);
                  if (onRangeChange) onRangeChange(r);
                  if (onPresetSelect && (r === "5Y" || r === "ALL")) {
                    onPresetSelect("ALL");
                  }
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeRange === r
                    ? "bg-[#0284C7] text-white font-bold shadow-sm"
                    : "text-[#89919C] hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Tools: Indicators, Compare, Draw, Resolution */}
          <div className="hidden sm:flex items-center space-x-1.5 pl-2 border-l border-[#1E2530] text-[11px] text-[#89919C]">
            <button
              type="button"
              className="flex items-center space-x-1 px-2 py-0.5 hover:text-white hover:bg-[#141A24] rounded transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3 text-[#38BDF8]" />
              <span>Indicators</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#59616B]" />
            </button>

            <button
              type="button"
              className="flex items-center space-x-1 px-2 py-0.5 hover:text-white hover:bg-[#141A24] rounded transition-colors"
            >
              <GitCompare className="w-3 h-3 text-[#89919C]" />
              <span>Compare</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#59616B]" />
            </button>

            <button
              type="button"
              className="flex items-center space-x-1 px-2 py-0.5 hover:text-white hover:bg-[#141A24] rounded transition-colors"
            >
              <PenTool className="w-3 h-3 text-[#89919C]" />
              <span>Draw</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#59616B]" />
            </button>

            <button
              type="button"
              className="flex items-center space-x-1 px-2 py-0.5 hover:text-white hover:bg-[#141A24] rounded transition-colors font-mono"
            >
              <span>Day</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#59616B]" />
            </button>
          </div>
        </div>

        {/* Right: Chart Type Switcher & Settings */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#131822] border border-[#232B38] rounded p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setChartMode("candles")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                chartMode === "candles"
                  ? "bg-[#0284C7] text-white font-medium shadow-sm"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              Candles
            </button>
            <button
              type="button"
              onClick={() => setChartMode("line")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                chartMode === "line"
                  ? "bg-[#0284C7] text-white font-medium shadow-sm"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => setChartMode("area")}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                chartMode === "area"
                  ? "bg-[#0284C7] text-white font-medium shadow-sm"
                  : "text-[#89919C] hover:text-white"
              }`}
            >
              Area
            </button>
          </div>

          <button
            type="button"
            className="p-1 text-[#89919C] hover:text-white transition-colors"
            title="Chart Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================
          OHLC LIVE READOUT BAR
          ======================================================== */}
      <div className="px-3.5 py-1.5 border-b border-[#1E2530] bg-[#07090D] flex flex-wrap items-center justify-between text-[11px] font-mono select-none">
        <div className="flex flex-wrap items-center space-x-3">
          <span className="font-bold text-white">{ticker}</span>
          <div>
            <span className="text-[#59616B]">O </span>
            <span className="text-[#38BDF8]">{sym}{currentOpen.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[#59616B]">H </span>
            <span className="text-[#10B981]">{sym}{currentHigh.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[#59616B]">L </span>
            <span className="text-[#EF4444]">{sym}{currentLow.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[#59616B]">C </span>
            <span className="text-white font-bold">{sym}{currentClose.toFixed(2)}</span>
          </div>
          <div className={currentReturn >= 0 ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"}>
            {currentReturn >= 0 ? "+" : ""}{sym}{(currentClose - currentOpen).toFixed(2)} ({currentReturn >= 0 ? "+" : ""}{currentReturn.toFixed(2)}%)
          </div>
          <div className="hidden sm:block">
            <span className="text-[#59616B]">Vol </span>
            <span className="text-[#D8DCE2]">{currentVol}</span>
          </div>
        </div>

        {/* Date readout */}
        {activeBar?.date && (
          <div className="text-[#59616B] text-[10px] hidden md:block">
            {activeBar.date}
          </div>
        )}
      </div>

      {/* ========================================================
          MAIN BIG CHART + OVERLAYS SIDEBAR (Height 520px)
          ======================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1E2530]">
        {/* Left / Main Chart Area (~82% = col-span-10) */}
        <div className="lg:col-span-10 p-2 relative h-[520px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={enrichedBars}
              margin={{ top: 15, right: 55, left: 10, bottom: 25 }}
              onMouseMove={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  setHoveredBar(state.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <defs>
                <linearGradient id="mainAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#18202C" strokeDasharray="2 2" vertical={false} />

              {/* X Axis: Monthly Dates */}
              <XAxis
                dataKey="date"
                stroke="#485362"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#1E2530" }}
                minTickGap={40}
                tickFormatter={formatXAxis}
              />

              {/* Price Y Axis (Right-aligned) */}
              <YAxis
                yAxisId="price"
                orientation="right"
                stroke="#485362"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[minPrice, maxPrice]}
                tickFormatter={(v) => `${sym}${v.toFixed(0)}`}
              />

              {/* Volume Y Axis (Hidden, bottom sub-pane scale) */}
              <YAxis
                yAxisId="volume"
                orientation="left"
                domain={[0, maxVolume * 4.5]}
                hide
              />

              {/* Reference Line for Current Price with Glowing Badge */}
              <ReferenceLine
                yAxisId="price"
                y={currentPrice}
                stroke="#10B981"
                strokeDasharray="2 2"
                strokeWidth={1}
              />

              {/* Volume Bars at bottom */}
              {showVolume && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="#1E293B"
                  isAnimationActive={false}
                  shape={<CustomVolumeBarShape />}
                />
              )}

              {/* Candlesticks Mode */}
              {chartMode === "candles" && (
                <Bar
                  yAxisId="price"
                  dataKey="close"
                  shape={
                    <CustomCandlestickShape
                      domainMin={minPrice}
                      domainMax={maxPrice}
                    />
                  }
                  isAnimationActive={false}
                />
              )}

              {/* Line Mode */}
              {chartMode === "line" && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Area Mode */}
              {chartMode === "area" && (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fill="url(#mainAreaGradient)"
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: SMA 20 (Amber/Orange) */}
              {showSma20 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="sma_20"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: SMA 50 (Sky Blue) */}
              {showSma50 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="sma_50"
                  stroke="#38BDF8"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: SMA 200 (Purple) */}
              {showSma200 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="sma_200"
                  stroke="#A855F7"
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: EMA 9 (Emerald) */}
              {showEma9 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ema_9"
                  stroke="#10B981"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: EMA 20 (Amber) */}
              {showEma20 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ema_20"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: EMA 50 (Cyan) */}
              {showEma50 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ema_50"
                  stroke="#06B6D4"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: EMA 200 (Violet) */}
              {showEma200 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ema_200"
                  stroke="#8B5CF6"
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: VWAP (Pink) */}
              {showVwap && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="vwap"
                  stroke="#EC4899"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: Bollinger Bands (Purple dashed) */}
              {showBollinger && (
                <>
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="bb_upper"
                    stroke="#A855F7"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="bb_lower"
                    stroke="#A855F7"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Overlays: Keltner Channels (Rose dashed) */}
              {showKeltner && (
                <>
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="keltner_upper"
                    stroke="#F43F5E"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="keltner_lower"
                    stroke="#F43F5E"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Overlays: Donchian Channels (Indigo dashed) */}
              {showDonchian && (
                <>
                  <Line
                    yAxisId="price"
                    type="stepAfter"
                    dataKey="donchian_upper"
                    stroke="#6366F1"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="price"
                    type="stepAfter"
                    dataKey="donchian_lower"
                    stroke="#6366F1"
                    strokeWidth={1.2}
                    strokeDasharray="3 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Overlays: SuperTrend (Green step) */}
              {showSuperTrend && (
                <Line
                  yAxisId="price"
                  type="stepAfter"
                  dataKey="supertrend"
                  stroke="#10B981"
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: Parabolic SAR (Yellow dots) */}
              {showPsar && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="psar"
                  stroke="#EAB308"
                  strokeWidth={0}
                  dot={{ r: 2, fill: "#EAB308" }}
                  isAnimationActive={false}
                />
              )}

              {/* Overlays: Ichimoku Tenkan & Kijun */}
              {showIchimoku && (
                <>
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="tenkan_sen"
                    stroke="#14B8A6"
                    strokeWidth={1.3}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="kijun_sen"
                    stroke="#3B82F6"
                    strokeWidth={1.3}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Current Price Glowing Badge on Right Y Axis */}
          <div
            className="absolute right-0 top-[26%] transform -translate-y-1/2 bg-[#10B981] text-black font-bold text-[10px] font-mono px-2 py-0.5 rounded-l shadow-lg pointer-events-none z-20"
          >
            {currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Right / Overlays Sidebar (~18% = col-span-2) */}
        <div className="lg:col-span-2 p-3 bg-[#080B10]/60 flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col h-[450px]">
            {/* Header: Overlays | Reset */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E2530] flex-shrink-0">
              <span className="font-semibold text-white text-[12px] tracking-tight">
                Overlays
              </span>
              <button
                type="button"
                onClick={handleResetOverlays}
                className="text-[11px] text-[#38BDF8] hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Scrollable Checklist of Overlays with Categories */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-[#1E2530]">
              {/* Category 1: Moving Averages */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#59616B] font-semibold">
                  Moving Averages
                </div>
                
                {/* SMA 20 */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showSma20}
                      onChange={(e) => setShowSma20(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">SMA 20</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{sma20Val}</span>
                </label>

                {/* SMA 50 */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showSma50}
                      onChange={(e) => setShowSma50(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">SMA 50</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{sma50Val}</span>
                </label>

                {/* SMA 200 */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showSma200}
                      onChange={(e) => setShowSma200(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">SMA 200</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{sma200Val}</span>
                </label>

                {/* EMA 9 */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showEma9}
                      onChange={(e) => setShowEma9(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">EMA 9</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{ema9Val}</span>
                </label>

                {/* EMA 20 */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showEma20}
                      onChange={(e) => setShowEma20(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">EMA 20</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{ema20Val}</span>
                </label>

                {/* EMA 50 */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showEma50}
                      onChange={(e) => setShowEma50(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">EMA 50</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{ema50Val}</span>
                </label>

                {/* EMA 200 */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showEma200}
                      onChange={(e) => setShowEma200(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">EMA 200</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{ema200Val}</span>
                </label>
              </div>

              {/* Category 2: Bands & Channels */}
              <div className="space-y-1.5 pt-1 border-t border-[#1E2530]/50">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#59616B] font-semibold">
                  Bands & Channels
                </div>

                {/* Bollinger Bands */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showBollinger}
                      onChange={(e) => setShowBollinger(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">Bollinger Bands</span>
                  </div>
                </label>

                {/* Keltner Channels */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showKeltner}
                      onChange={(e) => setShowKeltner(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">Keltner Channels</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{keltnerVal}</span>
                </label>

                {/* Donchian Channels */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showDonchian}
                      onChange={(e) => setShowDonchian(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">Donchian (20)</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{donchianVal}</span>
                </label>
              </div>

              {/* Category 3: Trend Overlays */}
              <div className="space-y-1.5 pt-1 border-t border-[#1E2530]/50">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#59616B] font-semibold">
                  Trend Overlays
                </div>

                {/* VWAP */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showVwap}
                      onChange={(e) => setShowVwap(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">VWAP</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{vwapVal}</span>
                </label>

                {/* SuperTrend */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showSuperTrend}
                      onChange={(e) => setShowSuperTrend(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">SuperTrend (10,3)</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{supertrendVal}</span>
                </label>

                {/* Parabolic SAR */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showPsar}
                      onChange={(e) => setShowPsar(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">Parabolic SAR</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{psarVal}</span>
                </label>

                {/* Ichimoku (Tenkan/Kijun) */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showIchimoku}
                      onChange={(e) => setShowIchimoku(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                    <span className="text-[11px] text-[#D8DCE2] group-hover:text-white">Ichimoku T/K</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#89919C]">{ichimokuVal}</span>
                </label>
              </div>

              {/* Category 4: Volume & Momentum */}
              <div className="space-y-1.5 pt-1 border-t border-[#1E2530]/50">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#59616B] font-semibold">
                  Volume & Momentum
                </div>

                {/* Volume */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showVolume}
                      onChange={(e) => setShowVolume(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-[#89919C] group-hover:text-[#D8DCE2]">Volume</span>
                  </div>
                </label>

                {/* RSI (14) */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showRsi}
                      onChange={(e) => setShowRsi(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-[#89919C] group-hover:text-[#D8DCE2]">RSI (14)</span>
                  </div>
                </label>

                {/* MACD */}
                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showMacd}
                      onChange={(e) => setShowMacd(e.target.checked)}
                      className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-[#89919C] group-hover:text-[#D8DCE2]">MACD</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2530] text-[10px] text-[#59616B] space-y-1 flex-shrink-0">
            <div className="flex justify-between">
              <span>Bars:</span>
              <span className="text-[#D8DCE2] font-mono">{visibleBars.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="text-[#D8DCE2] font-mono">1D (Daily)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
