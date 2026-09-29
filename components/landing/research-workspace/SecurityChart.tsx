"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Sliders,
  Layers,
  Maximize2,
  GitCompare,
  ArrowRight,
  ShieldAlert,
  PieChart,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceFeatureKey } from "./WorkspaceNavigation";

interface SecurityChartProps {
  activeFeature: WorkspaceFeatureKey;
  selectedSymbol: string;
}

// Realistic 44-candlestick bar sequence for 3M AAPL view matching reference image
const CANDLE_DATA = [
  { o: 190, h: 193, l: 189, c: 192, v: 42, up: true },
  { o: 192, h: 194, l: 191, c: 193, v: 38, up: true },
  { o: 193, h: 196, l: 192, c: 195, v: 51, up: true },
  { o: 195, h: 197, l: 193, c: 194, v: 44, up: false },
  { o: 194, h: 195, l: 190, c: 191, v: 49, up: false },
  { o: 191, h: 193, l: 188, c: 189, v: 55, up: false },
  { o: 189, h: 192, l: 188, c: 191, v: 40, up: true },
  { o: 191, h: 195, l: 190, c: 194, v: 46, up: true },
  { o: 194, h: 198, l: 193, c: 197, v: 62, up: true },
  { o: 197, h: 201, l: 196, c: 200, v: 68, up: true },
  { o: 200, h: 202, l: 198, c: 199, v: 53, up: false },
  { o: 199, h: 203, l: 198, c: 202, v: 58, up: true },
  { o: 202, h: 206, l: 201, c: 205, v: 71, up: true },
  { o: 205, h: 208, l: 203, c: 204, v: 60, up: false },
  { o: 204, h: 205, l: 200, c: 201, v: 54, up: false },
  { o: 201, h: 204, l: 199, c: 203, v: 48, up: true },
  { o: 203, h: 207, l: 202, c: 206, v: 59, up: true },
  { o: 206, h: 210, l: 205, c: 209, v: 65, up: true },
  { o: 209, h: 212, l: 207, c: 211, v: 63, up: true },
  { o: 211, h: 214, l: 210, c: 213, v: 57, up: true },
  { o: 213, h: 215, l: 211, c: 212, v: 45, up: false },
  { o: 212, h: 216, l: 211, c: 215, v: 52, up: true },
  { o: 215, h: 218, l: 213, c: 217, v: 60, up: true },
  { o: 217, h: 221, l: 216, c: 220, v: 72, up: true },
  { o: 220, h: 223, l: 218, c: 221, v: 66, up: true },
  { o: 221, h: 222, l: 217, c: 218, v: 55, up: false },
  { o: 218, h: 220, l: 215, c: 216, v: 51, up: false },
  { o: 216, h: 219, l: 214, c: 217, v: 47, up: true },
  { o: 217, h: 222, l: 216, c: 221, v: 58, up: true },
  { o: 221, h: 225, l: 220, c: 224, v: 75, up: true },
  { o: 224, h: 228, l: 223, c: 227, v: 82, up: true },
  { o: 227, h: 231, l: 226, c: 230, v: 88, up: true },
  { o: 230, h: 233, l: 228, c: 229, v: 73, up: false },
  { o: 229, h: 232, l: 226, c: 227, v: 64, up: false },
  { o: 227, h: 230, l: 225, c: 228, v: 59, up: true },
  { o: 228, h: 234, l: 227, c: 233, v: 77, up: true },
  { o: 233, h: 237, l: 232, c: 236, v: 89, up: true },
  { o: 236, h: 238, l: 233, c: 234, v: 68, up: false },
  { o: 234, h: 235, l: 229, c: 231, v: 62, up: false },
  { o: 231, h: 233, l: 227, c: 228, v: 56, up: false },
  { o: 228, h: 231, l: 226, c: 230, v: 54, up: true },
  { o: 230, h: 232, l: 225, c: 226, v: 61, up: false },
  { o: 226, h: 227, l: 222, c: 224, v: 58, up: false },
  { o: 224, h: 225, l: 222.8, c: 223.19, v: 53, up: false },
];

export default function SecurityChart({
  activeFeature,
  selectedSymbol,
}: SecurityChartProps) {
  const [activeIndicator, setActiveIndicator] = useState("all");

  return (
    <div className="flex h-full w-full flex-col bg-[#0B1220]">
      {/* Chart Top Toolbar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0A101D] px-4 py-2 text-[11px]">
        {/* Left Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <TrendingUp className="h-3 w-3 text-blue-400" />
            <span>Indicators</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <GitCompare className="h-3 w-3 text-slate-400" />
            <span>Compare</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <Layers className="h-3 w-3 text-slate-400" />
            <span>Templates</span>
          </button>
        </div>

        {/* Right EMA Legend */}
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1 text-[#38BDF8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
            EMA 20 <strong className="font-semibold">221.14</strong>
          </span>
          <span className="flex items-center gap-1 text-[#818CF8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#818CF8]" />
            EMA 50 <strong className="font-semibold">217.83</strong>
          </span>
          <span className="flex items-center gap-1 text-[#C084FC]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C084FC]" />
            EMA 200 <strong className="font-semibold">203.45</strong>
          </span>

          <button
            type="button"
            className="ml-2 text-slate-500 hover:text-slate-300"
            title="Toggle fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Dynamic Viewport */}
      <div className="relative flex-1 overflow-hidden p-3">
        <AnimatePresence mode="wait">
          {activeFeature === "charts" && (
            <motion.div
              key="view-charts"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex h-full w-full flex-col justify-between"
            >
              {/* Main Candlestick Chart Area */}
              <div className="relative h-[210px] w-full">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 grid grid-rows-4 divide-y divide-white/[0.04]">
                  <div />
                  <div />
                  <div />
                  <div />
                </div>

                {/* Right Price Scale Axis */}
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-slate-500 pr-1 select-none pointer-events-none">
                  <span>240.00</span>
                  <span>230.00</span>
                  <div className="rounded bg-[#1769FF] px-1 py-0.5 text-[9px] font-bold text-white shadow-xs">
                    223.19
                  </div>
                  <span>210.00</span>
                  <span>190.00</span>
                </div>

                {/* SVG Candlestick & EMA Overlay */}
                <svg
                  viewBox="0 0 540 200"
                  preserveAspectRatio="none"
                  className="h-full w-[92%] overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="chartAreaGlow"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#1769FF" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#1769FF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines inside SVG */}
                  <line
                    x1="0"
                    y1="40"
                    x2="540"
                    y2="40"
                    stroke="rgba(255,255,255,0.03)"
                  />
                  <line
                    x1="0"
                    y1="90"
                    x2="540"
                    y2="90"
                    stroke="rgba(255,255,255,0.03)"
                  />
                  <line
                    x1="0"
                    y1="140"
                    x2="540"
                    y2="140"
                    stroke="rgba(255,255,255,0.03)"
                  />

                  {/* Current Active Price Line Across */}
                  <line
                    x1="0"
                    y1="82"
                    x2="540"
                    y2="82"
                    stroke="#1769FF"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    opacity="0.6"
                  />

                  {/* Candlesticks Rendering */}
                  {CANDLE_DATA.map((c, i) => {
                    const x = 8 + i * 12;
                    // Scale price (185-245) to Y (180 to 20)
                    const scaleY = (p: number) => 180 - ((p - 185) / 60) * 160;
                    const highY = scaleY(c.h);
                    const lowY = scaleY(c.l);
                    const openY = scaleY(c.o);
                    const closeY = scaleY(c.c);

                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.max(Math.abs(openY - closeY), 2);
                    const color = c.up ? "#00C896" : "#FF4D5A";

                    return (
                      <g key={i}>
                        {/* High/Low Wick */}
                        <line
                          x1={x}
                          y1={highY}
                          x2={x}
                          y2={lowY}
                          stroke={color}
                          strokeWidth="1"
                        />
                        {/* Candlestick Body */}
                        <rect
                          x={x - 3.2}
                          y={bodyTop}
                          width="6.4"
                          height={bodyHeight}
                          fill={color}
                          rx="0.5"
                        />
                      </g>
                    );
                  })}

                  {/* EMA 200 (Violet line) */}
                  <path
                    d="M 8 160 Q 140 148, 270 135 T 530 115"
                    fill="none"
                    stroke="#C084FC"
                    strokeWidth="1.6"
                  />
                  {/* EMA 50 (Purple line) */}
                  <path
                    d="M 8 152 Q 130 135, 270 110 T 530 88"
                    fill="none"
                    stroke="#818CF8"
                    strokeWidth="1.8"
                  />
                  {/* EMA 20 (Cyan line) */}
                  <path
                    d="M 8 145 Q 120 125, 250 95 T 440 68 T 530 84"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Sub-panel 1: Volume Histogram */}
              <div className="mt-1 h-[42px] border-t border-white/[0.05] pt-1 relative">
                <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono mb-0.5">
                  <span>VOL: 52.3M</span>
                  <span>80M</span>
                </div>
                <div className="flex h-6 items-end gap-[3px] pr-8">
                  {CANDLE_DATA.map((c, i) => (
                    <div
                      key={i}
                      style={{ height: `${(c.v / 90) * 100}%` }}
                      className={`flex-1 rounded-t-2xs ${
                        c.up ? "bg-[#00C896]/60" : "bg-[#FF4D5A]/60"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Sub-panel 2: RSI (14) */}
              <div className="mt-1 h-[42px] border-t border-white/[0.05] pt-1 relative">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-500">RSI (14)</span>
                    <strong className="text-purple-400 font-semibold">
                      58.23
                    </strong>
                  </span>
                  <span className="text-[8px] text-slate-500">70 / 30</span>
                </div>
                <svg
                  viewBox="0 0 540 30"
                  preserveAspectRatio="none"
                  className="h-5 w-[92%] overflow-visible mt-0.5"
                >
                  <line
                    x1="0"
                    y1="6"
                    x2="540"
                    y2="6"
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="2 3"
                  />
                  <line
                    x1="0"
                    y1="24"
                    x2="540"
                    y2="24"
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="2 3"
                  />
                  <path
                    d="M 8 18 Q 80 22, 140 12 T 260 8 T 380 14 T 480 9 T 530 14"
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Sub-panel 3: MACD (12, 26, 9) */}
              <div className="mt-1 h-[42px] border-t border-white/[0.05] pt-1 relative">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-500">MACD (12, 26, 9)</span>
                    <span className="text-[#00C896]">1.23</span>
                    <span className="text-blue-400">2.56</span>
                    <span className="text-amber-400">1.33</span>
                  </span>
                  <span className="text-[8px] text-slate-500">0.00</span>
                </div>
                <svg
                  viewBox="0 0 540 28"
                  preserveAspectRatio="none"
                  className="h-5 w-[92%] overflow-visible mt-0.5"
                >
                  <line
                    x1="0"
                    y1="14"
                    x2="540"
                    y2="14"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <path
                    d="M 8 18 Q 100 24, 220 10 T 380 6 T 530 11"
                    fill="none"
                    stroke="#00C896"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 8 16 Q 100 20, 220 12 T 380 9 T 530 13"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </motion.div>
          )}

          {activeFeature === "strategy" && (
            <motion.div
              key="view-strategy"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex h-full flex-col justify-between p-2"
            >
              <div>
                <div className="text-[12px] font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Strategy Lab — Systematic Signal Architecture
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Rule execution model for mean-reversion & momentum crossovers
                </p>
              </div>

              {/* Logic Flowchart Blocks */}
              <div className="my-auto flex flex-col items-center justify-center gap-3">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-center shadow-lg">
                    <div className="text-[9px] font-bold text-blue-400 uppercase">
                      Entry Condition
                    </div>
                    <div className="mt-0.5 text-[12px] font-mono font-bold text-white">
                      Price &gt; EMA 50
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400">
                    AND
                  </span>

                  <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2.5 text-center shadow-lg">
                    <div className="text-[9px] font-bold text-purple-400 uppercase">
                      Momentum Filter
                    </div>
                    <div className="mt-0.5 text-[12px] font-mono font-bold text-white">
                      RSI &lt; 30
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-emerald-400" />

                  <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-5 py-2.5 text-center shadow-lg shadow-emerald-500/10">
                    <div className="text-[9px] font-bold text-emerald-400 uppercase">
                      Signal Action
                    </div>
                    <div className="mt-0.5 text-[13px] font-bold text-emerald-300">
                      BUY SIGNAL
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>Exit Rule:</span>
                  <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 font-mono text-rose-300 font-bold">
                    Price &lt; EMA 20
                  </span>
                </div>
              </div>

              {/* Parameters snapshot */}
              <div className="grid grid-cols-4 gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center text-[10px]">
                <div>
                  <div className="text-slate-500">Execution Frequency</div>
                  <div className="font-bold text-white mt-0.5">1-Hour Bars</div>
                </div>
                <div>
                  <div className="text-slate-500">Stop-Loss Buffer</div>
                  <div className="font-bold text-rose-400 mt-0.5">-3.2% ATR</div>
                </div>
                <div>
                  <div className="text-slate-500">Take Profit</div>
                  <div className="font-bold text-emerald-400 mt-0.5">+6.8% Trailing</div>
                </div>
                <div>
                  <div className="text-slate-500">Position Sizing</div>
                  <div className="font-bold text-blue-400 mt-0.5">Kelly 0.35x</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeFeature === "backtesting" && (
            <motion.div
              key="view-backtesting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex h-full flex-col justify-between p-2"
            >
              {/* Header metrics */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div>
                  <div className="text-[12px] font-bold text-white">
                    Strategy Backtest Engine (3-Year In-Sample)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Tested against S&amp;P 500 Index Benchmark (2022–2025)
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-emerald-400 font-bold">
                    Strategy +27.6%
                  </span>
                  <span className="text-slate-400">Benchmark +14.2%</span>
                </div>
              </div>

              {/* Equity Curves Visualization */}
              <div className="relative h-44 w-full my-auto">
                <svg
                  viewBox="0 0 540 160"
                  preserveAspectRatio="none"
                  className="h-full w-full overflow-visible"
                >
                  {/* Benchmark S&P 500 (faint slate) */}
                  <path
                    d="M 0 140 Q 120 130, 240 115 T 380 95 T 540 70"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                  />
                  {/* Strategy Equity (Vibrant Cyan-Blue) */}
                  <path
                    d="M 0 140 Q 80 120, 160 85 T 300 70 T 420 35 T 540 18"
                    fill="none"
                    stroke="#1769FF"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>

              {/* Core Institutional Performance Metrics */}
              <div className="grid grid-cols-5 gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center text-[10px]">
                <div>
                  <span className="text-slate-400">Sharpe Ratio</span>
                  <div className="text-[13px] font-bold text-emerald-400 mt-0.5">
                    2.48
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Max Drawdown</span>
                  <div className="text-[13px] font-bold text-rose-400 mt-0.5">
                    -8.4%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">CAGR</span>
                  <div className="text-[13px] font-bold text-white mt-0.5">
                    +27.6%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Win Rate</span>
                  <div className="text-[13px] font-bold text-blue-400 mt-0.5">
                    64.2%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Calmar Ratio</span>
                  <div className="text-[13px] font-bold text-white mt-0.5">
                    3.28
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeFeature === "analytics" && (
            <motion.div
              key="view-analytics"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex h-full flex-col justify-between p-2"
            >
              <div>
                <div className="text-[12px] font-bold text-white">
                  Factor Exposure &amp; Performance Attribution
                </div>
                <div className="text-[10px] text-slate-400">
                  Fama-French 5-Factor Decomposition &amp; Alpha Residuals
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-auto">
                <div className="space-y-2 text-[11px]">
                  {[
                    { factor: "Cross-Sectional Momentum", val: "+1.84σ", pct: 85, pos: true },
                    { factor: "Quality (Operating Profit)", val: "+1.42σ", pct: 72, pos: true },
                    { factor: "Low Volatility Anomaly", val: "+0.62σ", pct: 55, pos: true },
                    { factor: "Value Factor (HML)", val: "-0.31σ", pct: 30, pos: false },
                  ].map((f, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-300">{f.factor}</span>
                        <span className={f.pos ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {f.val}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-white/[0.08]">
                        <div
                          style={{ width: `${f.pct}%` }}
                          className={`h-full rounded-full ${
                            f.pos ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[11px]">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Risk &amp; Sensitivity Summary
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Beta vs SPY</span>
                      <span className="font-mono font-bold text-white">1.04</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jensen Alpha</span>
                      <span className="font-mono font-bold text-emerald-400">+6.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tracking Error</span>
                      <span className="font-mono font-bold text-slate-300">3.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Information Ratio</span>
                      <span className="font-mono font-bold text-blue-400">1.82</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center">
                Attribution calculated using 252-day rolling daily returns
              </div>
            </motion.div>
          )}

          {activeFeature === "portfolio" && (
            <motion.div
              key="view-portfolio"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex h-full flex-col justify-between p-2"
            >
              <div>
                <div className="text-[12px] font-bold text-white">
                  Multi-Asset Portfolio Construction &amp; Target Weights
                </div>
                <div className="text-[10px] text-slate-400">
                  Mean-Variance &amp; Hierarchical Risk Parity (HRP) Allocation
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-auto items-center">
                {/* Donut representation */}
                <div className="flex items-center justify-center">
                  <div className="relative h-36 w-36">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="16" strokeDasharray="60 178" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#00C896" strokeWidth="16" strokeDasharray="45 193" strokeDashoffset="-60" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="16" strokeDasharray="40 198" strokeDashoffset="-105" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#38BDF8" strokeWidth="16" strokeDasharray="38 200" strokeDashoffset="-145" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="16" strokeDasharray="30 208" strokeDashoffset="-183" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="16" strokeDasharray="25 213" strokeDashoffset="-213" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] text-slate-400 uppercase">Sharpe</span>
                      <span className="text-[14px] font-bold text-white">2.64</span>
                    </div>
                  </div>
                </div>

                {/* Weights list */}
                <div className="space-y-1 text-[11px]">
                  {[
                    { symbol: "AAPL", name: "Apple", w: "24%", color: "#2563EB" },
                    { symbol: "RELIANCE", name: "Reliance Ind.", w: "18%", color: "#00C896" },
                    { symbol: "MSFT", name: "Microsoft", w: "16%", color: "#8B5CF6" },
                    { symbol: "SPY", name: "S&P 500 ETF", w: "15%", color: "#38BDF8" },
                    { symbol: "TCS", name: "Tata Consultancy", w: "12%", color: "#F59E0B" },
                    { symbol: "NVDA", name: "NVIDIA Corp.", w: "9%", color: "#EC4899" },
                    { symbol: "CASH", name: "T-Bills 3M", w: "6%", color: "#94A3B8" },
                  ].map((item) => (
                    <div key={item.symbol} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span style={{ backgroundColor: item.color }} className="h-1.5 w-1.5 rounded-full" />
                        <strong className="font-semibold text-white">{item.symbol}</strong>
                        <span className="text-[10px] text-slate-500">{item.name}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-200">{item.w}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2 flex justify-between text-[10px] text-slate-400">
                <span>Annualized Volatility: <strong className="text-white">11.8%</strong></span>
                <span>Expected Return: <strong className="text-emerald-400">+22.4%</strong></span>
                <span>Diversification Ratio: <strong className="text-blue-400">2.18</strong></span>
              </div>
            </motion.div>
          )}

          {activeFeature === "risk" && (
            <motion.div
              key="view-risk"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex h-full flex-col justify-between p-2"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div>
                  <div className="text-[12px] font-bold text-white">
                    Risk Engine — Underwater Drawdowns &amp; VaR
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Parametric, Historical &amp; Cornish-Fisher Risk Limits
                  </div>
                </div>
                <div className="rounded bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-400">
                  Max Drawdown -12.4%
                </div>
              </div>

              {/* Underwater Drawdown Chart */}
              <div className="relative h-36 w-full my-auto">
                <svg viewBox="0 0 540 130" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                  <defs>
                    <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D5A" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#FF4D5A" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 10 Q 50 15, 100 45 T 180 85 T 260 20 T 340 70 T 440 100 T 540 25 L 540 10 L 0 10 Z"
                    fill="url(#drawdownGradient)"
                  />
                  <path
                    d="M 0 10 Q 50 15, 100 45 T 180 85 T 260 20 T 340 70 T 440 100 T 540 25"
                    fill="none"
                    stroke="#FF4D5A"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-4 gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center text-[10px]">
                <div>
                  <span className="text-slate-400">Parametric 1D VaR (99%)</span>
                  <div className="text-[12px] font-bold text-rose-400 mt-0.5">-$42,850</div>
                </div>
                <div>
                  <span className="text-slate-400">Expected Shortfall</span>
                  <div className="text-[12px] font-bold text-rose-500 mt-0.5">-$56,200</div>
                </div>
                <div>
                  <span className="text-slate-400">2020 COVID Shock</span>
                  <div className="text-[12px] font-bold text-amber-400 mt-0.5">-18.1%</div>
                </div>
                <div>
                  <span className="text-slate-400">2008 GFC Stress</span>
                  <div className="text-[12px] font-bold text-rose-400 mt-0.5">-22.4%</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeFeature === "options" && (
            <motion.div
              key="view-options"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex h-full flex-col justify-between p-2"
            >
              <div>
                <div className="text-[12px] font-bold text-white">
                  Derivatives Desk — AAPL Options Chain &amp; Implied Volatility
                </div>
                <div className="text-[10px] text-slate-400">
                  Expiration: Next Month (30 DTE) | Forward: $223.40 | IV: 24.8%
                </div>
              </div>

              <div className="overflow-x-auto my-auto">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400">
                      <th className="py-1">CALL DELTA</th>
                      <th className="py-1">CALL BID/ASK</th>
                      <th className="py-1 text-center font-bold text-white">STRIKE</th>
                      <th className="py-1 text-right">PUT BID/ASK</th>
                      <th className="py-1 text-right">PUT DELTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-slate-200">
                    {[
                      { strike: "215.00", cDelta: "0.72", cBid: "11.20 / 11.45", pBid: "2.80 / 2.95", pDelta: "-0.28" },
                      { strike: "220.00", cDelta: "0.59", cBid: "7.80 / 8.05", pBid: "4.40 / 4.60", pDelta: "-0.41" },
                      { strike: "222.50", cDelta: "0.52", cBid: "6.20 / 6.40", pBid: "5.50 / 5.75", pDelta: "-0.48", atm: true },
                      { strike: "225.00", cDelta: "0.45", cBid: "4.85 / 5.05", pBid: "6.90 / 7.15", pDelta: "-0.55" },
                      { strike: "230.00", cDelta: "0.33", cBid: "2.85 / 3.05", pBid: "10.15 / 10.40", pDelta: "-0.67" },
                    ].map((row) => (
                      <tr
                        key={row.strike}
                        className={row.atm ? "bg-blue-600/15 font-semibold text-blue-200" : "hover:bg-white/[0.02]"}
                      >
                        <td className="py-1 text-emerald-400">{row.cDelta}</td>
                        <td className="py-1 text-slate-300">{row.cBid}</td>
                        <td className="py-1 text-center font-bold text-white">{row.strike}</td>
                        <td className="py-1 text-right text-slate-300">{row.pBid}</td>
                        <td className="py-1 text-right text-rose-400">{row.pDelta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.02] p-2 text-[10px] text-slate-400">
                <span>Delta: <strong className="text-white">0.52</strong></span>
                <span>Gamma: <strong className="text-white">0.038</strong></span>
                <span>Theta: <strong className="text-rose-400">-0.14/day</strong></span>
                <span>Vega: <strong className="text-blue-400">0.28/%IV</strong></span>
              </div>
            </motion.div>
          )}

          {activeFeature === "research" && (
            <motion.div
              key="view-research"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="flex h-full flex-col justify-between p-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-500/20 text-blue-400 px-1.5 py-0.5 text-[9px] font-bold">NOTEBOOK</span>
                  <div className="text-[12px] font-bold text-white">
                    Hypothesis #42: Momentum Anomaly Decay with Volume Confirmation
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Author: Lead Quantitative Researcher • Verified with 10-Year Cross-Sectional Panel Data
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] font-mono text-slate-300 space-y-2 my-auto">
                <div className="text-blue-400 text-[10px] font-sans font-bold uppercase tracking-wider">
                  Mathematical Formulation
                </div>
                <div className="rounded bg-black/40 p-2 text-[11px] text-emerald-300">
                  R_(t,i) = α + β_MOM × MOM_(t-1,i) + γ × (VOL_(t-1,i) / μ_VOL) + ε_(t,i)
                </div>
                <p className="text-[10px] font-sans text-slate-400 leading-relaxed">
                  Findings: Out-of-sample t-statistic reaches <strong className="text-white">3.82</strong> (p &lt; 0.001). Alpha persists for 14 trading days before decay. Transaction cost hurdle requires &gt;18 bps gross edge.
                </p>
              </div>

              <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.02] p-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Reproducible Execution Environment
                </span>
                <span className="text-slate-300">Version 2.4.1 Snapshot Locked</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
