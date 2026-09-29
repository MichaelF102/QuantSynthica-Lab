"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  TrendingUp,
  CandlestickChart,
  Sigma,
  GitBranch,
  Layers,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LabId } from "./LabMatrix";

interface ActiveLabVisualizationProps {
  activeLab: LabId;
  onSelectLab?: (lab: LabId) => void;
}

const LAB_METADATA: Record<
  LabId,
  {
    title: string;
    subtitle: string;
    route: string;
    icon: React.ComponentType<{ className?: string }>;
    tabs: string[];
  }
> = {
  timeseries: {
    title: "Time Series Lab",
    subtitle: "Forecast. Model. Understand patterns.",
    route: "/research",
    icon: Activity,
    tabs: [
      "Overview",
      "ARIMA",
      "SARIMA",
      "GARCH",
      "HMM",
      "Decomposition",
      "Forecast",
    ],
  },
  technical: {
    title: "Technical Analysis Lab",
    subtitle: "Multi-timeframe indicators & pattern signals.",
    route: "/research",
    icon: CandlestickChart,
    tabs: [
      "Overview",
      "Candlesticks",
      "Indicators",
      "Oscillators",
      "Volume Profile",
      "Patterns",
    ],
  },
  statistical: {
    title: "Statistical Analysis Lab",
    subtitle: "Linear models, distributions & hypothesis tests.",
    route: "/analytics",
    icon: Sigma,
    tabs: [
      "Overview",
      "Regression",
      "Correlation",
      "Distributions",
      "PCA",
      "T-Tests",
    ],
  },
  volatility: {
    title: "Volatility Lab",
    subtitle: "GARCH modeling, regimes & tail risk.",
    route: "/risk",
    icon: TrendingUp,
    tabs: [
      "Overview",
      "Realized Vol",
      "GARCH(1,1)",
      "EGARCH",
      "Regimes",
      "Cone",
    ],
  },
  options: {
    title: "Options Lab",
    subtitle: "Chains, Greeks, IV smile & surface topology.",
    route: "/research",
    icon: GitBranch,
    tabs: [
      "Overview",
      "Option Chain",
      "Greeks",
      "IV Surface",
      "Payoff Matrix",
    ],
  },
  factors: {
    title: "Factor Research Lab",
    subtitle: "Cross-sectional alpha & multi-factor attribution.",
    route: "/analytics",
    icon: Layers,
    tabs: [
      "Overview",
      "Fama-French",
      "Momentum",
      "Quality",
      "Decay Profile",
    ],
  },
};

export default function ActiveLabVisualization({
  activeLab,
}: ActiveLabVisualizationProps) {
  const currentMeta = LAB_METADATA[activeLab] || LAB_METADATA.timeseries;
  const [activeTab, setActiveTab] = useState("Overview");
  const [timeframe, setTimeframe] = useState("1Y");

  const Icon = currentMeta.icon;

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.08] bg-[#07111F] p-5 sm:p-6 shadow-[0_25px_70px_rgba(7,17,31,0.35)] overflow-hidden text-slate-200">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold tracking-tight text-white">
              {currentMeta.title}
            </h3>
            <p className="text-[12px] text-slate-400 font-normal">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        <Link
          href={currentMeta.route}
          className="group inline-flex items-center gap-2 rounded-xl bg-[#1769FF] px-4 py-2 text-[12px] font-semibold text-white shadow-md shadow-blue-500/25 transition-all duration-200 hover:bg-[#0f59e0] hover:shadow-lg"
        >
          <span>Open Lab</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Horizontal Sub-Navigation Tab Bar */}
      <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-medium">
        {currentMeta.tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? "bg-[#1769FF] text-white font-semibold shadow-xs"
                  : "bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Dynamic Viewport */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {activeLab === "timeseries" && (
            <motion.div
              key="lab-timeseries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Primary Time Series Forecast Chart */}
              <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="text-[13px] font-bold text-white">
                    NIFTY 50 — Time Series Forecast
                  </div>

                  {/* Legend & Controls */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="h-1.5 w-3 bg-blue-500 rounded-full" />
                      Historical
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <span className="h-1.5 w-3 bg-purple-400 rounded-full" />
                      Forecast
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-2 w-3 bg-blue-500/25 rounded-2xs" />
                      95% Confidence
                    </span>

                    {/* Timeframe selector */}
                    <div className="flex items-center rounded-md bg-black/40 border border-white/[0.06] p-0.5 ml-2">
                      {["1Y", "2Y", "5Y", "ALL"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`rounded px-2 py-0.5 text-[9px] font-semibold transition-colors ${
                            timeframe === tf
                              ? "bg-[#1769FF] text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SVG Forecast Chart */}
                <div className="relative h-44 w-full">
                  {/* Left Price Axis */}
                  <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] font-mono text-slate-500 select-none">
                    <span>26,000</span>
                    <span>24,000</span>
                    <span>22,000</span>
                    <span>20,000</span>
                    <span>18,000</span>
                  </div>

                  <div className="ml-12 h-full flex flex-col justify-between">
                    <svg
                      viewBox="0 0 500 135"
                      preserveAspectRatio="none"
                      className="h-[110px] w-full overflow-visible"
                    >
                      {/* Background Grid */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" />
                      <line x1="0" y1="110" x2="500" y2="110" stroke="rgba(255,255,255,0.03)" />

                      {/* Forecast Horizon Separation Line at x=340 */}
                      <line
                        x1="340"
                        y1="5"
                        x2="340"
                        y2="130"
                        stroke="#64748B"
                        strokeDasharray="3 3"
                        strokeWidth="1.2"
                      />

                      {/* 95% Confidence Interval Shaded Fan */}
                      <polygon
                        points="340,48 500,10 500,95 340,48"
                        fill="rgba(59, 130, 246, 0.15)"
                      />

                      {/* Historical Curve (blue line) */}
                      <path
                        d="M 0 110 Q 30 105, 50 95 T 100 102 T 150 82 T 200 90 T 250 68 T 300 55 T 340 48"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2.2"
                      />

                      {/* Forecast Curve (cyan-white dashed) */}
                      <path
                        d="M 340 48 Q 420 40, 500 42"
                        fill="none"
                        stroke="#93C5FD"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    </svg>

                    {/* Bottom Months Labels */}
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-white/[0.04]">
                      <span>Jan</span>
                      <span>Mar</span>
                      <span>May</span>
                      <span>Jul</span>
                      <span className="text-white font-bold">Sep</span>
                      <span>Nov</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Analytics Panels: 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Model Comparison */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-bold text-white">Model Comparison</span>
                    <div className="flex items-center gap-3 text-[9px] font-mono">
                      <span className="flex items-center gap-1 text-[#38BDF8]">
                        <span className="h-1.5 w-1.5 rounded-2xs bg-[#38BDF8]" /> MAE
                      </span>
                      <span className="flex items-center gap-1 text-[#A855F7]">
                        <span className="h-1.5 w-1.5 rounded-2xs bg-[#A855F7]" /> RMSE
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar Chart */}
                  <div className="flex items-end justify-between gap-2 h-20 pt-2 border-b border-white/[0.05]">
                    {[
                      { name: "ARIMA", mae: 62, rmse: 78 },
                      { name: "SARIMA", mae: 42, rmse: 56 },
                      { name: "LSTM", mae: 54, rmse: 70 },
                      { name: "Prophet", mae: 68, rmse: 84 },
                      { name: "XGBoost", mae: 48, rmse: 62 },
                    ].map((m) => (
                      <div key={m.name} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div className="flex items-end gap-1 h-full">
                          <div
                            style={{ height: `${m.mae}%` }}
                            className="w-2.5 rounded-t-xs bg-[#38BDF8]"
                          />
                          <div
                            style={{ height: `${m.rmse}%` }}
                            className="w-2.5 rounded-t-xs bg-[#A855F7]"
                          />
                        </div>
                        <span className="mt-1 text-[8.5px] font-mono text-slate-400">
                          {m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Time Series Decomposition */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3.5 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-white mb-1.5">
                    Decomposition
                  </div>

                  <div className="space-y-1.5 text-[9px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[#38BDF8]">Observed</span>
                      <svg viewBox="0 0 100 12" className="h-3 w-36">
                        <path d="M 0 10 Q 25 2, 50 8 T 100 4" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#00C896]">Trend</span>
                      <svg viewBox="0 0 100 12" className="h-3 w-36">
                        <path d="M 0 10 Q 50 6, 100 2" fill="none" stroke="#00C896" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#F59E0B]">Seasonal</span>
                      <svg viewBox="0 0 100 12" className="h-3 w-36">
                        <path d="M 0 6 Q 12 1, 25 6 T 50 6 T 75 6 T 100 6" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#C084FC]">Residual</span>
                      <svg viewBox="0 0 100 12" className="h-3 w-36">
                        <path d="M 0 6 L 15 3 L 30 9 L 45 5 L 60 7 L 75 4 L 90 8 L 100 6" fill="none" stroke="#C084FC" strokeWidth="1.2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5 text-center text-[10px]">
                <div>
                  <span className="text-slate-400">Best Model</span>
                  <div className="text-[13px] font-bold text-[#00C896] mt-0.5">
                    SARIMA
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">MAE</span>
                  <div className="text-[13px] font-bold text-white mt-0.5 font-mono">
                    228.4
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">RMSE</span>
                  <div className="text-[13px] font-bold text-white mt-0.5 font-mono">
                    312.6
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">MAPE</span>
                  <div className="text-[13px] font-bold text-blue-400 mt-0.5 font-mono">
                    1.24%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">R² Score</span>
                  <div className="text-[13px] font-bold text-purple-400 mt-0.5 font-mono">
                    0.86
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeLab === "technical" && (
            <motion.div
              key="lab-technical"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-4">
                <div className="flex justify-between items-center text-[13px] font-bold text-white mb-2">
                  <span>Candlestick Trajectory &amp; Multi-Indicator Overlays</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-normal">
                    EMA 20 / EMA 50 / RSI (14)
                  </span>
                </div>
                <div className="h-44 w-full flex items-center justify-center">
                  <svg viewBox="0 0 500 130" className="h-full w-full">
                    {/* Bollinger Bands Shaded Band */}
                    <path
                      d="M 0 50 Q 120 30, 250 20 T 500 25 L 500 95 Q 370 85, 250 80 T 0 110 Z"
                      fill="rgba(37,99,235,0.08)"
                    />
                    {/* EMA lines */}
                    <path d="M 0 80 Q 150 50, 300 45 T 500 40" fill="none" stroke="#38BDF8" strokeWidth="2" />
                    <path d="M 0 88 Q 150 62, 300 58 T 500 52" fill="none" stroke="#818CF8" strokeWidth="1.8" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3 text-center">
                  <span className="text-[10px] text-slate-400">RSI (14)</span>
                  <div className="text-[14px] font-bold text-purple-400 mt-1">58.4</div>
                  <span className="text-[9px] text-slate-500">Bullish Zone</span>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3 text-center">
                  <span className="text-[10px] text-slate-400">MACD Histogram</span>
                  <div className="text-[14px] font-bold text-emerald-400 mt-1">+1.42</div>
                  <span className="text-[9px] text-slate-500">Expanding Momentum</span>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3 text-center">
                  <span className="text-[10px] text-slate-400">Average True Range</span>
                  <div className="text-[14px] font-bold text-blue-400 mt-1">3.12</div>
                  <span className="text-[9px] text-slate-500">Moderate Vol</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeLab === "statistical" && (
            <motion.div
              key="lab-statistical"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-4">
                <div className="flex justify-between items-center text-[13px] font-bold text-white mb-2">
                  <span>Cross-Asset Scatter &amp; Ordinary Least Squares (OLS) Fit</span>
                  <span className="text-[10px] font-mono text-blue-400 font-normal">
                    R² = 0.884 | p-val &lt; 0.0001
                  </span>
                </div>
                <div className="h-44 w-full flex items-center justify-center">
                  <svg viewBox="0 0 500 130" className="h-full w-full">
                    {/* Scatter dots */}
                    {[
                      [40, 110], [60, 105], [80, 95], [100, 98], [120, 85],
                      [150, 80], [180, 70], [210, 65], [240, 60], [270, 52],
                      [300, 48], [330, 42], [360, 38], [390, 32], [420, 25],
                      [450, 18], [470, 12],
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="3.5" fill="#3B82F6" opacity={0.8} />
                    ))}
                    {/* Regression Line */}
                    <line x1="20" y1="120" x2="490" y2="10" stroke="#10B981" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5">
                  <span className="text-slate-400">Beta Coefficient</span>
                  <div className="text-[13px] font-bold text-white mt-1">1.18</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5">
                  <span className="text-slate-400">Pearson Correlation</span>
                  <div className="text-[13px] font-bold text-emerald-400 mt-1">+0.94</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5">
                  <span className="text-slate-400">F-Statistic</span>
                  <div className="text-[13px] font-bold text-blue-400 mt-1">142.6</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5">
                  <span className="text-slate-400">Residual Normality</span>
                  <div className="text-[13px] font-bold text-purple-400 mt-1">Jarque-Bera 0.08</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeLab === "volatility" && (
            <motion.div
              key="lab-volatility"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-4">
                <div className="flex justify-between items-center text-[13px] font-bold text-white mb-2">
                  <span>GARCH(1,1) Volatility Clustering &amp; Forecast Cone</span>
                  <span className="text-[10px] font-mono text-purple-400 font-normal">
                    Current IV: 18.4% | Historical: 14.8%
                  </span>
                </div>
                <div className="h-44 w-full flex items-center justify-center">
                  <svg viewBox="0 0 500 130" className="h-full w-full">
                    {/* Spike clusters */}
                    <path
                      d="M 0 110 L 30 100 L 50 115 L 70 40 L 85 105 L 110 30 L 130 95 L 160 110 L 200 60 L 220 100 L 260 20 L 280 85 L 320 95 L 360 45 L 400 80 L 450 65 L 500 70"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3">
                  <span className="text-[10px] text-slate-400">Persistence (α + β)</span>
                  <div className="text-[14px] font-bold text-emerald-400 mt-1">0.968</div>
                  <span className="text-[9px] text-slate-500">Mean Reverting</span>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3">
                  <span className="text-[10px] text-slate-400">Vol of Vol</span>
                  <div className="text-[14px] font-bold text-amber-400 mt-1">42.1%</div>
                  <span className="text-[9px] text-slate-500">Regime: Normal</span>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3">
                  <span className="text-[10px] text-slate-400">EGARCH Asymmetry</span>
                  <div className="text-[14px] font-bold text-rose-400 mt-1">-0.14</div>
                  <span className="text-[9px] text-slate-500">Leverage Effect</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeLab === "options" && (
            <motion.div
              key="lab-options"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-4">
                <div className="flex justify-between items-center text-[13px] font-bold text-white mb-2">
                  <span>3D Volatility Surface Topology &amp; Strike Smile</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-normal">
                    ATM Strike $225 | Expiry 30DTE
                  </span>
                </div>
                <div className="h-44 w-full flex items-center justify-center">
                  <svg viewBox="0 0 500 130" className="h-full w-full">
                    {/* 3D mesh lines */}
                    <path d="M 50 110 Q 200 40, 350 70 T 480 30" fill="none" stroke="#38BDF8" strokeWidth="2" />
                    <path d="M 40 90 Q 190 20, 340 50 T 470 20" fill="none" stroke="#818CF8" strokeWidth="1.8" />
                    <path d="M 30 70 Q 180 10, 330 35 T 460 10" fill="none" stroke="#C084FC" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5">
                  <span className="text-slate-400">Delta</span>
                  <div className="text-[13px] font-bold text-white mt-1">0.52</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5">
                  <span className="text-slate-400">Gamma</span>
                  <div className="text-[13px] font-bold text-emerald-400 mt-1">0.038</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5">
                  <span className="text-slate-400">Theta</span>
                  <div className="text-[13px] font-bold text-rose-400 mt-1">-0.14</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-2.5">
                  <span className="text-slate-400">Vega</span>
                  <div className="text-[13px] font-bold text-blue-400 mt-1">0.28</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeLab === "factors" && (
            <motion.div
              key="lab-factors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-4">
                <div className="flex justify-between items-center text-[13px] font-bold text-white mb-2">
                  <span>Cross-Sectional Factor Alpha Premia (Fama-French)</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-normal">
                    Momentum +1.84σ | Quality +1.42σ
                  </span>
                </div>
                <div className="h-44 w-full flex items-end justify-between gap-4 px-6 pt-4">
                  {[
                    { factor: "Momentum", val: "+8.4%", h: 84, c: "bg-blue-600" },
                    { factor: "Quality", val: "+6.8%", h: 68, c: "bg-emerald-500" },
                    { factor: "Low Vol", val: "+4.2%", h: 42, c: "bg-purple-500" },
                    { factor: "Size (SMB)", val: "-1.8%", h: 22, c: "bg-rose-500" },
                    { factor: "Value (HML)", val: "-3.1%", h: 32, c: "bg-amber-500" },
                  ].map((f) => (
                    <div key={f.factor} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[9px] font-mono text-white mb-1">{f.val}</span>
                      <div style={{ height: `${f.h}%` }} className={`w-6 rounded-t-xs ${f.c}`} />
                      <span className="mt-1.5 text-[10px] font-semibold text-slate-300">
                        {f.factor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3">
                  <span className="text-[10px] text-slate-400">Information Ratio</span>
                  <div className="text-[14px] font-bold text-blue-400 mt-1">1.82</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3">
                  <span className="text-[10px] text-slate-400">T-Statistic</span>
                  <div className="text-[14px] font-bold text-emerald-400 mt-1">3.82 (p&lt;0.001)</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0A1629] p-3">
                  <span className="text-[10px] text-slate-400">Decay Half-Life</span>
                  <div className="text-[14px] font-bold text-purple-400 mt-1">14 Trading Days</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
