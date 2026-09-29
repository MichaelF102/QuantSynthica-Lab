"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ResearchStageScene = dynamic(() => import("./ResearchStageScene"), {
  ssr: false,
});

interface ResearchJourneyProps {
  activeStage: number; // 1, 2, 3
  onSelectStage: (stage: number) => void;
}

export default function ResearchJourney({
  activeStage,
  onSelectStage,
}: ResearchJourneyProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/80 bg-gradient-to-b from-[#F1F5F9]/60 via-[#F8FAFC] to-white p-5 sm:p-8 shadow-xs overflow-hidden select-none">
      {/* Background Topographical Wave Grid & Waypoints */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden opacity-50">
        <svg
          viewBox="0 0 1200 400"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="topoWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="35%" stopColor="#7C3AED" stopOpacity="0.2" />
              <stop offset="70%" stopColor="#14B8A6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Flowing Data Stream Wave Paths */}
          <path
            d="M 50 280 C 250 140, 450 320, 650 180 C 850 60, 1050 240, 1150 120"
            fill="none"
            stroke="url(#topoWave)"
            strokeWidth="1.8"
            strokeDasharray="4 6"
          />
          <path
            d="M 20 220 C 220 90, 420 260, 620 140 C 820 40, 1020 200, 1180 90"
            fill="none"
            stroke="url(#topoWave)"
            strokeWidth="1.2"
          />

          {/* Dotted Flow Grid Behind Platforms */}
          {[120, 160, 200, 240, 280, 320].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="1200"
              y2={y}
              stroke="rgba(37,99,235,0.04)"
              strokeDasharray="2 4"
            />
          ))}
        </svg>

        {/* Conceptual Waypoint Node Labels */}
        <div className="absolute top-6 left-[18%] text-[10px] font-mono tracking-widest text-blue-600/70 uppercase">
          • IDEA
        </div>
        <div className="absolute top-4 left-[38%] text-[10px] font-mono tracking-widest text-slate-500/70 uppercase">
          • HISTORICAL DATA
        </div>
        <div className="absolute top-8 left-[58%] text-[10px] font-mono tracking-widest text-purple-600/70 uppercase">
          • BACKTEST
        </div>
        <div className="absolute top-5 left-[76%] text-[10px] font-mono tracking-widest text-teal-600/70 uppercase">
          • PERFORMANCE
        </div>
        <div className="absolute top-8 right-[5%] text-[10px] font-mono tracking-widest text-blue-600/70 uppercase">
          • INSIGHT
        </div>
      </div>

      {/* Floating Holographic Metadata Cards (matching reference image) */}
      <div className="relative z-10 hidden xl:grid grid-cols-3 gap-6 pt-2 mb-2">
        {/* Above Platform 01: Indicators & Conditions */}
        <div className="flex items-start justify-center gap-3">
          <div className="rounded-xl border border-blue-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-md text-[11px]">
            <div className="font-bold text-blue-700 uppercase tracking-wider text-[9px] mb-1">
              Indicators
            </div>
            <div className="space-y-0.5 text-slate-600 font-mono text-[10px]">
              <div>• SMA</div>
              <div>• RSI</div>
              <div>• MACD</div>
              <div>• ATR</div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-md text-[11px]">
            <div className="font-bold text-blue-700 uppercase tracking-wider text-[9px] mb-1">
              Conditions
            </div>
            <div className="space-y-0.5 text-slate-600 font-mono text-[10px]">
              <div>• Price &gt; SMA(50)</div>
              <div>• RSI &gt; 55</div>
              <div>• Volume &gt; Avg</div>
            </div>
          </div>
        </div>

        {/* Above Platform 02: Data, Backtest Engine, Validation */}
        <div className="flex items-start justify-center gap-2">
          <div className="rounded-xl border border-purple-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-md text-[10px]">
            <div className="font-bold text-purple-700 uppercase tracking-wider text-[9px] mb-1">
              Data
            </div>
            <div className="space-y-0.5 text-slate-600 font-mono text-[9.5px]">
              <div>• Equities</div>
              <div>• Indices</div>
              <div>• Forex</div>
              <div>• Crypto</div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-md text-[10px]">
            <div className="font-bold text-purple-700 uppercase tracking-wider text-[9px] mb-1">
              Backtest Engine
            </div>
            <div className="space-y-0.5 text-slate-600 font-mono text-[9.5px]">
              <div>• Execution Model</div>
              <div>• Transaction Costs</div>
              <div>• Slippage</div>
              <div>• Walk Forward</div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-md text-[10px]">
            <div className="font-bold text-purple-700 uppercase tracking-wider text-[9px] mb-1">
              Validation
            </div>
            <div className="space-y-0.5 text-slate-600 font-mono text-[9.5px]">
              <div>• In-sample</div>
              <div>• Out-of-sample</div>
              <div>• Monte Carlo</div>
              <div>• Sensitivity</div>
            </div>
          </div>
        </div>

        {/* Above Platform 03: Key Metrics, Risk Analysis, Robustness */}
        <div className="flex items-start justify-center gap-2">
          <div className="rounded-xl border border-teal-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-md text-[10px]">
            <div className="font-bold text-teal-700 uppercase tracking-wider text-[9px] mb-1">
              Key Metrics
            </div>
            <div className="space-y-0.5 text-slate-600 font-mono text-[9.5px]">
              <div>• CAGR</div>
              <div>• Sharpe Ratio</div>
              <div>• Max Drawdown</div>
              <div>• Win Rate</div>
            </div>
          </div>

          <div className="rounded-xl border border-teal-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-md text-[10px]">
            <div className="font-bold text-teal-700 uppercase tracking-wider text-[9px] mb-1">
              Risk Analysis
            </div>
            <div className="space-y-0.5 text-slate-600 font-mono text-[9.5px]">
              <div>• Volatility</div>
              <div>• Drawdown</div>
              <div>• VaR</div>
              <div>• Stability</div>
            </div>
          </div>

          <div className="rounded-xl border border-teal-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-md text-[10px]">
            <div className="font-bold text-teal-700 uppercase tracking-wider text-[9px] mb-1">
              Robustness
            </div>
            <div className="space-y-0.5 text-slate-600 font-mono text-[9.5px]">
              <div>• Param Sensitivity</div>
              <div>• Regime Analysis</div>
              <div>• Monte Carlo</div>
              <div>• Stress Testing</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Physical Stage Scene on Desktop */}
      {mounted && !isMobile ? (
        <div className="relative">
          <ResearchStageScene
            activeStage={activeStage}
            onSelectStage={onSelectStage}
          />
        </div>
      ) : (
        /* Lightweight 2D Fallback for Mobile */
        <div className="py-6 flex items-center justify-around gap-2 text-center">
          <div
            onClick={() => onSelectStage(1)}
            className={`flex-1 rounded-xl p-3 border ${
              activeStage === 1
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-[10px] font-bold text-blue-600">01 BUILD</div>
            <div className="text-[12px] font-bold text-slate-900">Define Strategy</div>
          </div>
          <div
            onClick={() => onSelectStage(2)}
            className={`flex-1 rounded-xl p-3 border ${
              activeStage === 2
                ? "border-purple-500 bg-purple-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-[10px] font-bold text-purple-600">02 TEST</div>
            <div className="text-[12px] font-bold text-slate-900">Historical Data</div>
          </div>
          <div
            onClick={() => onSelectStage(3)}
            className={`flex-1 rounded-xl p-3 border ${
              activeStage === 3
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-[10px] font-bold text-teal-600">03 EVALUATE</div>
            <div className="text-[12px] font-bold text-slate-900">Performance</div>
          </div>
        </div>
      )}

      {/* 3 Interactive Physical Platform Buttons (Matching Image) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        {/* Stage 01 Platform Card */}
        <button
          onClick={() => onSelectStage(1)}
          className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
            activeStage === 1
              ? "border-blue-500 bg-[#07111F] text-white shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30 scale-[1.02]"
              : "border-slate-200/90 bg-white/95 text-slate-800 shadow-2xs hover:border-blue-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono text-[13px] font-black transition-colors ${
                activeStage === 1
                  ? "bg-[#1769FF] text-white shadow-md shadow-blue-500/40"
                  : "bg-blue-50 text-[#1769FF]"
              }`}
            >
              01
            </div>
            <div>
              <div
                className={`text-[15px] font-extrabold tracking-tight ${
                  activeStage === 1 ? "text-white" : "text-[#0B1220]"
                }`}
              >
                BUILD
              </div>
              <div
                className={`text-[12px] leading-tight ${
                  activeStage === 1 ? "text-blue-300" : "text-slate-500"
                }`}
              >
                Define your strategy
              </div>
            </div>
          </div>
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-200 ${
              activeStage === 1
                ? "text-blue-400 translate-x-1"
                : "text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600"
            }`}
          />
        </button>

        {/* Stage 02 Platform Card */}
        <button
          onClick={() => onSelectStage(2)}
          className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
            activeStage === 2
              ? "border-purple-500 bg-[#07111F] text-white shadow-xl shadow-purple-500/20 ring-2 ring-purple-500/30 scale-[1.02]"
              : "border-slate-200/90 bg-white/95 text-slate-800 shadow-2xs hover:border-purple-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono text-[13px] font-black transition-colors ${
                activeStage === 2
                  ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/40"
                  : "bg-purple-50 text-[#7C3AED]"
              }`}
            >
              02
            </div>
            <div>
              <div
                className={`text-[15px] font-extrabold tracking-tight ${
                  activeStage === 2 ? "text-white" : "text-[#0B1220]"
                }`}
              >
                TEST
              </div>
              <div
                className={`text-[12px] leading-tight ${
                  activeStage === 2 ? "text-purple-300" : "text-slate-500"
                }`}
              >
                Run on historical data
              </div>
            </div>
          </div>
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-200 ${
              activeStage === 2
                ? "text-purple-400 translate-x-1"
                : "text-slate-400 group-hover:translate-x-1 group-hover:text-purple-600"
            }`}
          />
        </button>

        {/* Stage 03 Platform Card */}
        <button
          onClick={() => onSelectStage(3)}
          className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
            activeStage === 3
              ? "border-teal-500 bg-[#07111F] text-white shadow-xl shadow-teal-500/20 ring-2 ring-teal-500/30 scale-[1.02]"
              : "border-slate-200/90 bg-white/95 text-slate-800 shadow-2xs hover:border-teal-300 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono text-[13px] font-black transition-colors ${
                activeStage === 3
                  ? "bg-[#0D9488] text-white shadow-md shadow-teal-500/40"
                  : "bg-teal-50 text-[#0D9488]"
              }`}
            >
              03
            </div>
            <div>
              <div
                className={`text-[15px] font-extrabold tracking-tight ${
                  activeStage === 3 ? "text-white" : "text-[#0B1220]"
                }`}
              >
                EVALUATE
              </div>
              <div
                className={`text-[12px] leading-tight ${
                  activeStage === 3 ? "text-teal-300" : "text-slate-500"
                }`}
              >
                Analyze performance
              </div>
            </div>
          </div>
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-200 ${
              activeStage === 3
                ? "text-teal-400 translate-x-1"
                : "text-slate-400 group-hover:translate-x-1 group-hover:text-teal-600"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
