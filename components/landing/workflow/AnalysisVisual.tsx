"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Sliders, BarChart2, Eye } from "lucide-react";

export default function AnalysisVisual() {
  const [activeTab, setActiveTab] = useState<"Technical" | "Statistical" | "Fundamental">("Technical");

  // Synthetic sample candlesticks representing a clean technical setup
  const candles = [
    { o: 60, h: 75, l: 50, c: 72, vol: 65, isUp: true },
    { o: 72, h: 82, l: 68, c: 78, vol: 70, isUp: true },
    { o: 78, h: 80, l: 65, c: 68, vol: 50, isUp: false },
    { o: 68, h: 74, l: 64, c: 70, vol: 45, isUp: true },
    { o: 70, h: 85, l: 68, c: 84, vol: 85, isUp: true },
    { o: 84, h: 88, l: 76, c: 80, vol: 60, isUp: false },
    { o: 80, h: 82, l: 70, c: 74, vol: 55, isUp: false },
    { o: 74, h: 90, l: 72, c: 88, vol: 90, isUp: true },
    { o: 88, h: 95, l: 85, c: 92, vol: 95, isUp: true },
    { o: 92, h: 98, l: 88, c: 90, vol: 70, isUp: false },
    { o: 90, h: 104, l: 89, c: 102, vol: 110, isUp: true },
    { o: 102, h: 110, l: 98, c: 108, vol: 115, isUp: true },
    { o: 108, h: 112, l: 100, c: 104, vol: 75, isUp: false },
    { o: 104, h: 118, l: 102, c: 116, vol: 125, isUp: true },
  ];

  return (
    <div className="relative flex h-[460px] sm:h-[490px] w-full flex-col justify-between rounded-2xl bg-[#090E17] p-4 sm:p-5 text-white border border-slate-800 shadow-2xl overflow-hidden">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,210,255,0.08)_0,transparent_60%)]" />

      {/* Top Header & Mode Tabs */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">SPY · S&P 500 ETF Trust</span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300">1D</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="font-bold text-white">$765.61</span>
              <span className="text-rose-400">-5.74 (-0.74%)</span>
            </div>
          </div>
        </div>

        {/* Technical / Statistical / Fundamental Pill */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
          {(["Technical", "Statistical", "Fundamental"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#1769FF] text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator Legend Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 py-2 text-[10px] font-mono text-slate-400 border-b border-slate-800/40">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-cyan-300">EMA 20: $764.87</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span className="text-indigo-300">EMA 50: $759.44</span>
          </span>
          <span className="flex items-center gap-1.5 hidden sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-amber-300">EMA 200: $682.10</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>O: 768.35</span>
          <span>H: 769.54</span>
          <span>L: 763.72</span>
          <span className="text-white font-semibold">C: 765.61</span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative z-10 my-auto h-[240px] w-full flex flex-col justify-end">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="w-full border-b border-slate-700 border-dashed" />
          <div className="w-full border-b border-slate-700 border-dashed" />
          <div className="w-full border-b border-slate-700 border-dashed" />
          <div className="w-full border-b border-slate-700 border-dashed" />
        </div>

        {/* SVG EMAs Overlaid */}
        <svg className="absolute inset-0 h-[170px] w-full pointer-events-none overflow-visible">
          {/* EMA 200 (amber line) */}
          <path
            d="M 20 140 Q 180 130, 360 115 T 680 90"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.8"
          />
          {/* EMA 50 (indigo line) */}
          <path
            d="M 20 120 Q 200 110, 400 85 T 680 50"
            fill="none"
            stroke="#818CF8"
            strokeWidth="2"
            opacity="0.9"
          />
          {/* EMA 20 (cyan line) */}
          <path
            d="M 20 110 Q 180 95, 380 75 T 680 38"
            fill="none"
            stroke="#00D2FF"
            strokeWidth="2.2"
          />
        </svg>

        {/* Candlestick & Volume Bars */}
        <div className="relative z-10 flex h-[170px] items-end justify-between px-2">
          {candles.map((c, i) => {
            const candleHeight = Math.max(12, Math.abs(c.c - c.o) * 1.6);
            const bottomOffset = (Math.min(c.o, c.c) - 40) * 1.5;
            const wickTop = (c.h - 40) * 1.5;
            const wickBottom = (c.l - 40) * 1.5;

            return (
              <div key={i} className="group relative flex flex-col items-center flex-1 h-full justify-end">
                {/* Wick Line */}
                <div
                  className={`absolute w-[1.5px] ${c.isUp ? "bg-emerald-400" : "bg-rose-400"}`}
                  style={{
                    bottom: `${wickBottom}px`,
                    height: `${wickTop - wickBottom}px`,
                  }}
                />

                {/* Candle Body */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  style={{
                    bottom: `${bottomOffset}px`,
                    height: `${candleHeight}px`,
                  }}
                  className={`absolute w-3 sm:w-4 rounded-xs ${
                    c.isUp
                      ? "bg-emerald-400 border border-emerald-300 shadow-xs shadow-emerald-500/30"
                      : "bg-rose-500 border border-rose-400 shadow-xs shadow-rose-500/30"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Volume Histogram at bottom of chart */}
        <div className="relative z-10 flex h-[45px] items-end justify-between px-2 pt-2 border-t border-slate-800/80">
          {candles.map((c, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(c.vol / 130) * 38}px` }}
              transition={{ delay: 0.2 + i * 0.02, duration: 0.3 }}
              className={`w-2.5 sm:w-3.5 rounded-t-xs opacity-60 ${
                c.isUp ? "bg-emerald-400/70" : "bg-rose-500/70"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Sub-pane: RSI (14) Oscillator */}
      <div className="relative z-10 mt-2 rounded-lg bg-slate-950/70 p-2 border border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-semibold">RSI (14)</span>
            <span className="text-white font-bold">42.60</span>
            <span className="text-slate-500">· Neutral Zone</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-rose-400">70 OB</span>
            <span className="text-emerald-400">30 OS</span>
          </div>
        </div>

        <div className="relative h-6 w-full">
          {/* Overbought / Oversold Guides */}
          <div className="absolute top-[30%] w-full border-b border-rose-500/30 border-dashed" />
          <div className="absolute bottom-[30%] w-full border-b border-emerald-500/30 border-dashed" />

          {/* RSI Waveform */}
          <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 24">
            <path
              d="M 0 16 Q 40 8, 90 14 T 180 6 T 260 18 T 340 10 T 400 13"
              fill="none"
              stroke="#A855F7"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
