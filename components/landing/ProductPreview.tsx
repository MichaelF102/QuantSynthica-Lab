"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LineChart,
  BarChart2,
  Layers,
  Activity,
  Briefcase,
  Shield,
  Sliders,
  Database,
  FileText,
  Settings,
  Search,
  Maximize2,
  TrendingDown,
} from "lucide-react";

export default function ProductPreview() {
  return (
    <div
      className="relative w-full max-w-[840px] select-none"
      style={{
        perspective: "1200px",
      }}
    >
      {/* 3D Tilted Laptop Container */}
      <div
        className="relative mx-auto transition-transform duration-500 ease-out hover:scale-[1.01]"
        style={{
          transform: "rotateY(-10deg) rotateX(6deg) rotateZ(-1.2deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Ambient Display Glow */}
        <div className="absolute -inset-4 rounded-3xl bg-blue-500/15 blur-2xl filter" />

        {/* Laptop Top Bezel & Screen Outer Shell */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0E131F] p-2.5 shadow-2xl shadow-slate-900/80 ring-1 ring-white/10">
          {/* Top Notch / Camera Dot */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-30">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-800 ring-1 ring-slate-700" />
            <div className="h-1 w-1 rounded-full bg-blue-900" />
          </div>

          {/* Screen Glass Display (#080B11 dark terminal background) */}
          <div className="relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#080B11] text-slate-200">
            {/* 1. Terminal Top Bar */}
            <div className="flex h-10 items-center justify-between border-b border-slate-800/90 bg-[#0D111A] px-3">
              {/* Brand and Nav Tabs */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1769FF]">
                    <span className="font-mono text-[10px] font-bold text-white">Q</span>
                  </div>
                  <span className="text-[11px] font-bold tracking-tight text-white">
                    QuantSynthica <span className="text-slate-400 font-normal">Lab</span>
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-[10px]">
                  <span className="rounded bg-[#1769FF] px-2 py-0.5 font-semibold text-white">
                    Charts
                  </span>
                  <span className="px-1.5 py-0.5 text-slate-400">Strategies</span>
                  <span className="px-1.5 py-0.5 text-slate-400">Backtests</span>
                  <span className="px-1.5 py-0.5 text-slate-400">Analytics</span>
                  <span className="px-1.5 py-0.5 text-slate-400">Portfolio</span>
                  <span className="px-1.5 py-0.5 text-slate-400">Risk</span>
                </div>
              </div>

              {/* Terminal Search & Market Pills */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <Search className="absolute left-2 h-3 w-3 text-slate-500" />
                  <input
                    type="text"
                    readOnly
                    value="RELIANCE"
                    className="h-6 w-28 sm:w-44 rounded border border-slate-800 bg-[#07090E] pl-6 pr-2 text-[10px] text-slate-200 outline-none"
                  />
                </div>
                <div className="flex items-center rounded border border-slate-800 bg-[#07090E] p-0.5 text-[9px]">
                  <span className="px-1 text-slate-500">🇺🇸 US</span>
                  <span className="rounded bg-slate-800 px-1 font-semibold text-white">
                    🇮🇳 INDIA
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Terminal Workspace Body (Sidebar + Main Chart Workspace) */}
            <div className="flex h-[385px] overflow-hidden">
              {/* Left Compact Sidebar */}
              <div className="hidden md:flex w-36 shrink-0 flex-col border-r border-slate-800/80 bg-[#0A0D15] p-2 text-[10px]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:text-white">
                    <Activity className="h-3 w-3 text-slate-500" />
                    <span>Market Overview</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:text-white">
                    <BarChart2 className="h-3 w-3 text-slate-500" />
                    <span>Watchlist</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="px-2 text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                    RESEARCH
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 rounded bg-[#1769FF] px-2 py-1 font-semibold text-white">
                      <LineChart className="h-3 w-3" />
                      <span>Charts</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:text-white">
                      <Layers className="h-3 w-3 text-slate-500" />
                      <span>Strategy Lab</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:text-white">
                      <Sliders className="h-3 w-3 text-slate-500" />
                      <span>Backtesting</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:text-white">
                      <BarChart2 className="h-3 w-3 text-slate-500" />
                      <span>Analytics</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:text-white">
                      <Briefcase className="h-3 w-3 text-slate-500" />
                      <span>Portfolio</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:text-white">
                      <Shield className="h-3 w-3 text-slate-500" />
                      <span>Risk Analytics</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="px-2 text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                    DATA
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-slate-400">
                      <Database className="h-3 w-3 text-slate-500" />
                      <span>Screener</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded px-2 py-0.5 text-slate-400">
                      <FileText className="h-3 w-3 text-slate-500" />
                      <span>Financials</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t border-slate-800/80 pt-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 text-slate-500">
                    <Settings className="h-3 w-3" />
                    <span>Settings</span>
                  </div>
                </div>
              </div>

              {/* Main Chart Pane */}
              <div className="flex flex-1 flex-col overflow-hidden bg-[#080B11]">
                {/* Stock Ticker Banner */}
                <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm font-bold text-white tracking-wide">
                      RELIANCE
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      NSE · Reliance Industries Ltd.
                    </span>
                    <span className="font-mono text-sm font-bold text-white ml-2">
                      ₹3,012.25
                    </span>
                    <span className="flex items-center text-[10px] font-semibold text-[#E5484D]">
                      <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                      -2.13% (-65.10)
                    </span>
                  </div>

                  <div className="hidden lg:flex items-center gap-4 text-[10px]">
                    <div>
                      <span className="text-slate-500">Market Cap: </span>
                      <span className="font-mono font-semibold text-white">₹20.4T</span>
                    </div>
                    <div>
                      <span className="text-slate-500">P/E: </span>
                      <span className="font-mono font-semibold text-white">24.8</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Div Yield: </span>
                      <span className="font-mono font-semibold text-white">0.68%</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Header: Timeframes & Moving Averages */}
                <div className="flex items-center justify-between border-b border-slate-800/60 bg-[#0A0D15]/80 px-3 py-1 text-[10px]">
                  <div className="flex items-center gap-1 font-mono">
                    {["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "All"].map((tf) => (
                      <span
                        key={tf}
                        className={`rounded px-1.5 py-0.5 ${
                          tf === "1Y"
                            ? "bg-[#1769FF] font-semibold text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tf}
                      </span>
                    ))}
                  </div>

                  <div className="hidden sm:flex items-center gap-3 font-mono text-[9px]">
                    <span className="text-[#38BDF8]">EMA 20 2,986.12</span>
                    <span className="text-[#A855F7]">EMA 50 2,972.45</span>
                    <span className="text-[#3B82F6]">EMA 200 2,845.21</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="cursor-pointer hover:text-white">Indicators</span>
                    <span className="cursor-pointer hover:text-white">Compare</span>
                    <Maximize2 className="h-3 w-3 cursor-pointer hover:text-white" />
                  </div>
                </div>

                {/* Candlestick & Volume Chart Canvas Area */}
                <div className="relative flex-1 overflow-hidden p-1">
                  {/* Candlestick SVG Rendering */}
                  <svg
                    viewBox="0 0 540 180"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-full w-full"
                    preserveAspectRatio="none"
                  >
                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="30" x2="540" y2="30" stroke="#1E293B" strokeWidth="0.6" strokeDasharray="3 3" />
                    <line x1="0" y1="70" x2="540" y2="70" stroke="#1E293B" strokeWidth="0.6" strokeDasharray="3 3" />
                    <line x1="0" y1="110" x2="540" y2="110" stroke="#1E293B" strokeWidth="0.6" strokeDasharray="3 3" />
                    <line x1="0" y1="150" x2="540" y2="150" stroke="#1E293B" strokeWidth="0.6" strokeDasharray="3 3" />

                    {/* EMA Curves */}
                    {/* EMA 20 (Cyan) */}
                    <path
                      d="M 10 135 C 70 120, 130 90, 190 75 C 250 60, 310 100, 370 70 C 430 45, 480 65, 530 68"
                      stroke="#38BDF8"
                      strokeWidth="1.4"
                      fill="none"
                    />
                    {/* EMA 50 (Purple) */}
                    <path
                      d="M 10 142 C 70 130, 130 100, 190 85 C 250 72, 310 92, 370 78 C 430 58, 480 72, 530 75"
                      stroke="#A855F7"
                      strokeWidth="1.4"
                      fill="none"
                    />
                    {/* EMA 200 (Blue) */}
                    <path
                      d="M 10 152 C 70 145, 130 125, 190 110 C 250 95, 310 105, 370 95 C 430 85, 480 90, 530 92"
                      stroke="#3B82F6"
                      strokeWidth="1.2"
                      fill="none"
                    />

                    {/* Candlesticks sample wave */}
                    {/* Candles segment 1 (Uptrend) */}
                    <g stroke="#00A878" strokeWidth="1">
                      <line x1="30" y1="120" x2="30" y2="148" />
                      <rect x="27" y="125" width="6" height="18" fill="#00A878" />

                      <line x1="50" y1="110" x2="50" y2="138" />
                      <rect x="47" y="115" width="6" height="16" fill="#00A878" />

                      <line x1="70" y1="95" x2="70" y2="128" />
                      <rect x="67" y="100" width="6" height="22" fill="#00A878" />
                    </g>

                    {/* Pullback candle (Red) */}
                    <g stroke="#E5484D" strokeWidth="1">
                      <line x1="90" y1="102" x2="90" y2="130" />
                      <rect x="87" y="106" width="6" height="15" fill="#E5484D" />
                    </g>

                    {/* Continuation uptrend */}
                    <g stroke="#00A878" strokeWidth="1">
                      <line x1="110" y1="85" x2="110" y2="118" />
                      <rect x="107" y="90" width="6" height="20" fill="#00A878" />

                      <line x1="130" y1="72" x2="130" y2="105" />
                      <rect x="127" y="78" width="6" height="20" fill="#00A878" />

                      <line x1="150" y1="62" x2="150" y2="92" />
                      <rect x="147" y="68" width="6" height="18" fill="#00A878" />

                      <line x1="170" y1="52" x2="170" y2="82" />
                      <rect x="167" y="58" width="6" height="18" fill="#00A878" />
                    </g>

                    {/* Consolidation dip */}
                    <g stroke="#E5484D" strokeWidth="1">
                      <line x1="190" y1="60" x2="190" y2="90" />
                      <rect x="187" y="65" width="6" height="18" fill="#E5484D" />

                      <line x1="210" y1="75" x2="210" y2="105" />
                      <rect x="207" y="80" width="6" height="18" fill="#E5484D" />

                      <line x1="230" y1="85" x2="230" y2="115" />
                      <rect x="227" y="90" width="6" height="18" fill="#E5484D" />
                    </g>

                    {/* V-reversal rally */}
                    <g stroke="#00A878" strokeWidth="1">
                      <line x1="250" y1="70" x2="250" y2="102" />
                      <rect x="247" y="76" width="6" height="20" fill="#00A878" />

                      <line x1="270" y1="55" x2="270" y2="88" />
                      <rect x="267" y="62" width="6" height="20" fill="#00A878" />

                      <line x1="290" y1="42" x2="290" y2="75" />
                      <rect x="287" y="48" width="6" height="20" fill="#00A878" />

                      <line x1="310" y1="35" x2="310" y2="68" />
                      <rect x="307" y="40" width="6" height="22" fill="#00A878" />
                    </g>

                    {/* High Volatility Cluster */}
                    <g stroke="#E5484D" strokeWidth="1">
                      <line x1="330" y1="45" x2="330" y2="85" />
                      <rect x="327" y="52" width="6" height="24" fill="#E5484D" />

                      <line x1="350" y1="65" x2="350" y2="105" />
                      <rect x="347" y="72" width="6" height="25" fill="#E5484D" />
                    </g>

                    {/* Secondary Leg Up */}
                    <g stroke="#00A878" strokeWidth="1">
                      <line x1="370" y1="50" x2="370" y2="82" />
                      <rect x="367" y="56" width="6" height="20" fill="#00A878" />

                      <line x1="390" y1="36" x2="390" y2="68" />
                      <rect x="387" y="42" width="6" height="20" fill="#00A878" />

                      <line x1="410" y1="28" x2="410" y2="60" />
                      <rect x="407" y="34" width="6" height="20" fill="#00A878" />
                    </g>

                    {/* High Plateau & Recent pullback */}
                    <g stroke="#E5484D" strokeWidth="1">
                      <line x1="430" y1="35" x2="430" y2="70" />
                      <rect x="427" y="40" width="6" height="22" fill="#E5484D" />

                      <line x1="450" y1="45" x2="450" y2="80" />
                      <rect x="447" y="50" width="6" height="22" fill="#E5484D" />

                      <line x1="470" y1="58" x2="470" y2="92" />
                      <rect x="467" y="64" width="6" height="20" fill="#E5484D" />

                      {/* Current Bar */}
                      <line x1="490" y1="62" x2="490" y2="95" />
                      <rect x="487" y="68" width="6" height="18" fill="#E5484D" />
                    </g>

                    {/* Volume Bars along bottom */}
                    <g opacity="0.45">
                      <rect x="27" y="160" width="6" height="15" fill="#00A878" />
                      <rect x="47" y="155" width="6" height="20" fill="#00A878" />
                      <rect x="67" y="152" width="6" height="23" fill="#00A878" />
                      <rect x="87" y="162" width="6" height="13" fill="#E5484D" />
                      <rect x="107" y="158" width="6" height="17" fill="#00A878" />
                      <rect x="127" y="154" width="6" height="21" fill="#00A878" />
                      <rect x="147" y="150" width="6" height="25" fill="#00A878" />
                      <rect x="167" y="148" width="6" height="27" fill="#00A878" />
                      <rect x="187" y="156" width="6" height="19" fill="#E5484D" />
                      <rect x="207" y="152" width="6" height="23" fill="#E5484D" />
                      <rect x="227" y="146" width="6" height="29" fill="#E5484D" />
                      <rect x="247" y="154" width="6" height="21" fill="#00A878" />
                      <rect x="267" y="150" width="6" height="25" fill="#00A878" />
                      <rect x="287" y="145" width="6" height="30" fill="#00A878" />
                      <rect x="307" y="142" width="6" height="33" fill="#00A878" />
                      <rect x="327" y="140" width="6" height="35" fill="#E5484D" />
                      <rect x="347" y="148" width="6" height="27" fill="#E5484D" />
                      <rect x="367" y="155" width="6" height="20" fill="#00A878" />
                      <rect x="387" y="150" width="6" height="25" fill="#00A878" />
                      <rect x="407" y="142" width="6" height="33" fill="#00A878" />
                      <rect x="427" y="152" width="6" height="23" fill="#E5484D" />
                      <rect x="447" y="156" width="6" height="19" fill="#E5484D" />
                      <rect x="467" y="150" width="6" height="25" fill="#E5484D" />
                      <rect x="487" y="148" width="6" height="27" fill="#E5484D" />
                    </g>

                    {/* Price Badge on Right Axis */}
                    <rect x="495" y="63" width="45" height="15" rx="3" fill="#E5484D" />
                    <text x="498" y="74" fill="white" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                      3,012.25
                    </text>
                  </svg>
                </div>

                {/* Sub-Pane 1: RSI (14) */}
                <div className="h-[48px] border-t border-slate-800/80 bg-[#07090F] px-2 py-0.5">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-slate-400">
                      RSI (14) <span className="text-[#A855F7] font-semibold">56.2</span>
                    </span>
                    <span className="text-slate-600">80 / 20</span>
                  </div>
                  <svg viewBox="0 0 500 28" fill="none" className="h-5 w-full">
                    <line x1="0" y1="6" x2="500" y2="6" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="0" y1="22" x2="500" y2="22" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                    <path
                      d="M 0 20 Q 50 14, 100 8 T 200 18 T 300 6 T 400 12 T 500 14"
                      stroke="#A855F7"
                      strokeWidth="1.2"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* Sub-Pane 2: MACD (12, 26, 9) */}
                <div className="h-[52px] border-t border-slate-800/80 bg-[#07090F] px-2 py-0.5">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-slate-400">
                      MACD (12, 26, 9) <span className="text-[#38BDF8]">4.21</span>{" "}
                      <span className="text-[#10B981]">12.34</span>{" "}
                      <span className="text-[#E5484D]">-8.13</span>
                    </span>
                    <span className="text-slate-600">0.00</span>
                  </div>
                  <svg viewBox="0 0 500 30" fill="none" className="h-6 w-full">
                    <line x1="0" y1="15" x2="500" y2="15" stroke="#334155" strokeWidth="0.5" />
                    {/* MACD Histogram Bars */}
                    {[
                      { x: 20, h: 6, up: true },
                      { x: 45, h: 9, up: true },
                      { x: 70, h: 12, up: true },
                      { x: 95, h: 8, up: true },
                      { x: 120, h: 4, up: true },
                      { x: 145, h: -5, up: false },
                      { x: 170, h: -9, up: false },
                      { x: 195, h: -11, up: false },
                      { x: 220, h: -6, up: false },
                      { x: 245, h: 3, up: true },
                      { x: 270, h: 7, up: true },
                      { x: 295, h: 11, up: true },
                      { x: 320, h: 13, up: true },
                      { x: 345, h: 8, up: true },
                      { x: 370, h: -4, up: false },
                      { x: 395, h: -8, up: false },
                      { x: 420, h: -12, up: false },
                      { x: 445, h: -10, up: false },
                      { x: 470, h: -7, up: false },
                    ].map((b, i) => (
                      <rect
                        key={i}
                        x={b.x}
                        y={b.up ? 15 - b.h : 15}
                        width="6"
                        height={Math.abs(b.h)}
                        fill={b.up ? "#10B981" : "#E5484D"}
                        opacity="0.8"
                      />
                    ))}
                    {/* Signal lines */}
                    <path
                      d="M 0 17 Q 80 5, 160 22 T 320 8 T 480 23"
                      stroke="#38BDF8"
                      strokeWidth="1.2"
                      fill="none"
                    />
                    <path
                      d="M 0 16 Q 80 8, 160 19 T 320 11 T 480 20"
                      stroke="#F59E0B"
                      strokeWidth="1.2"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Bottom Chassis / Keyboard Deck Perspective Rim */}
        <div className="relative -mt-1 mx-4 h-3.5 rounded-b-xl border-x border-b border-slate-700/80 bg-gradient-to-b from-[#1C2230] to-[#0A0D14] shadow-xl">
          <div className="mx-auto h-1 w-16 rounded-full bg-slate-600/60" />
        </div>

        {/* Rocky Outcrop Base Pedestal matching Reference Image */}
        <div className="relative -mt-3 w-full overflow-hidden rounded-b-2xl">
          <svg
            viewBox="0 0 800 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto opacity-95 drop-shadow-2xl"
            preserveAspectRatio="none"
          >
            {/* Rock facets gradient definition */}
            <defs>
              <linearGradient id="rockGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E2638" />
                <stop offset="50%" stopColor="#0E131E" />
                <stop offset="100%" stopColor="#05070B" />
              </linearGradient>
              <linearGradient id="rockGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2A354C" />
                <stop offset="100%" stopColor="#0D111A" />
              </linearGradient>
              <linearGradient id="rockRim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#1E40AF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* Faceted Craggy Cliffs */}
            <polygon points="0,70 120,40 240,65 380,30 520,55 680,25 800,60 800,130 0,130" fill="url(#rockGrad1)" />
            <polygon points="120,40 200,85 240,65 310,105 380,30 460,80 520,55 610,95 680,25 760,80 800,60 800,130 0,130" fill="url(#rockGrad2)" opacity="0.8" />
            
            {/* Mountain / Ridge Highlight Edge */}
            <polyline
              points="0,70 120,40 240,65 380,30 520,55 680,25 800,60"
              stroke="url(#rockRim)"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
