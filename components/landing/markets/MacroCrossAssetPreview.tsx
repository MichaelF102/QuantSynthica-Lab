"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Percent,
  Coins,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  fetchMacroUniverse,
  fetchMarketAsset,
  MacroCategories,
  MacroInstrument,
  NormalizedMarketAsset,
  formatCurrencyValue,
} from "@/lib/market/yahooFinance";

interface MacroCrossAssetPreviewProps {
  onSelectInstrument?: (symbol: string) => void;
}

const MACRO_CATEGORIES = [
  { id: "rates", label: "Rates & Yields", icon: Percent },
  { id: "currencies", label: "Currencies (FX)", icon: DollarSign },
  { id: "commodities", label: "Commodities", icon: Coins },
] as const;

export default function MacroCrossAssetPreview({
  onSelectInstrument,
}: MacroCrossAssetPreviewProps) {
  const [activeCategory, setActiveCategory] = useState<"rates" | "currencies" | "commodities">("rates");
  const [macroData, setMacroData] = useState<MacroCategories | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("^TNX");
  const [assetDetail, setAssetDetail] = useState<NormalizedMarketAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // Load category list
  useEffect(() => {
    let isCancelled = false;
    fetchMacroUniverse()
      .then((res) => {
        if (isCancelled) return;
        setMacroData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Load detailed historical bars for selected macro instrument
  useEffect(() => {
    let isCancelled = false;
    setChartLoading(true);
    fetchMarketAsset(selectedSymbol, "6M")
      .then((res) => {
        if (isCancelled) return;
        setAssetDetail(res);
        setChartLoading(false);
      })
      .catch(() => {
        setChartLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedSymbol]);

  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    if (onSelectInstrument) onSelectInstrument(sym);
  };

  const activeInstruments: MacroInstrument[] = useMemo(() => {
    if (!macroData) return [];
    return macroData[activeCategory] || [];
  }, [macroData, activeCategory]);

  const selectedInstMeta = useMemo(() => {
    return activeInstruments.find((i) => i.symbol === selectedSymbol) || activeInstruments[0];
  }, [activeInstruments, selectedSymbol]);

  // Chart SVG Calculations
  const bars = assetDetail?.bars || [];
  const { minVal, maxVal, valRange } = useMemo(() => {
    if (!bars.length) return { minVal: 0, maxVal: 10, valRange: 10 };
    let low = Infinity;
    let high = -Infinity;
    for (const b of bars) {
      if (b.low < low) low = b.low;
      if (b.high > high) high = b.high;
    }
    const pad = Math.max(0.05, (high - low) * 0.08);
    return {
      minVal: low - pad,
      maxVal: high + pad,
      valRange: Math.max(0.1, (high + pad) - (low - pad)),
    };
  }, [bars]);

  const svgW = 740;
  const svgH = 260;
  const padLeft = 14;
  const padRight = 60;
  const padTop = 20;
  const padBottom = 220;
  const plotW = svgW - padLeft - padRight;
  const plotH = padBottom - padTop;

  const getY = (val: number) => padTop + (1 - (val - minVal) / valRange) * plotH;

  const chartPath = useMemo(() => {
    if (bars.length < 2) return "";
    const pts = bars.map((b, i) => {
      const x = padLeft + (i / (bars.length - 1)) * plotW;
      const y = getY(b.close);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return "M " + pts.join(" L ");
  }, [bars, minVal, valRange]);

  const areaPath = useMemo(() => {
    if (!chartPath || bars.length < 2) return "";
    const firstX = padLeft;
    const lastX = padLeft + plotW;
    return `${chartPath} L ${lastX},${padBottom} L ${firstX},${padBottom} Z`;
  }, [chartPath, bars]);

  const unitLabel = selectedInstMeta?.unit || "%";
  const displayPrice = assetDetail?.price ?? selectedInstMeta?.price ?? 0;
  const displayChange = assetDetail?.change ?? selectedInstMeta?.change ?? 0;
  const displayChangePct = assetDetail?.changePercent ?? selectedInstMeta?.changePercent ?? 0;
  const isPos = displayChange >= 0;

  return (
    <div className="flex h-full flex-col justify-between">
      {/* 1. TOP HEADER: Macro Categories & Selected Instrument */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[17px] leading-none">🌐</span>
              <h3 className="font-bold text-[18px] sm:text-[20px] text-[#0B1220] dark:text-white tracking-tight">
                Macro &amp; Cross-Asset
              </h3>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {selectedInstMeta?.label || "Macro Economic"}
              </span>
            </div>

            {/* Price / Rate & Change */}
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-[28px] sm:text-[32px] font-extrabold text-[#0B1220] dark:text-white tabular-nums">
                {unitLabel === "%" ? `${displayPrice.toFixed(2)}%` : formatCurrencyValue(displayPrice, unitLabel === "INR" ? "₹" : "$")}
              </span>

              <div
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[13px] font-bold tabular-nums ${
                  isPos
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-[#00A878] dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40"
                    : "bg-red-50 dark:bg-rose-950/40 text-[#E5484D] dark:text-rose-400 border border-red-200/50 dark:border-rose-800/40"
                }`}
              >
                {isPos ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>
                  {isPos ? "+" : ""}
                  {displayChange.toFixed(2)} ({isPos ? "+" : ""}
                  {displayChangePct.toFixed(2)}%)
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {selectedInstMeta?.name || assetDetail?.name}
              </span>
            </div>
          </div>

          {/* Category Tabs: Rates / Currencies / Commodities */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1">
            {MACRO_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    const first = macroData?.[cat.id]?.[0];
                    if (first) setSelectedSymbol(first.symbol);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#1769FF] text-white shadow-xs shadow-blue-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Instrument Quick Cards in Selected Category */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {activeInstruments.map((inst) => {
            const isSelected = inst.symbol === selectedSymbol;
            return (
              <button
                key={inst.symbol}
                onClick={() => handleSelectSymbol(inst.symbol)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-[#1769FF] bg-blue-50/60 dark:bg-blue-950/40 shadow-xs"
                    : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {inst.name}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {inst.symbol} · {inst.label}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-xs text-slate-900 dark:text-white tabular-nums">
                    {inst.unit === "%" ? `${inst.price.toFixed(2)}%` : `$${inst.price.toFixed(2)}`}
                  </div>
                  <div
                    className={`text-[10px] font-bold tabular-nums ${
                      inst.isPositive ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {inst.changePercent >= 0 ? "+" : ""}
                    {inst.changePercent.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. REAL HISTORICAL MACRO CHART */}
      <div className="relative my-3 flex-1 min-h-[220px]">
        {chartLoading ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-[#1769FF]" />
            <span className="text-xs font-mono text-slate-500">Loading historical trend...</span>
          </div>
        ) : (
          <div className="relative h-full w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#070D18] p-3">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="macroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1769FF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1769FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padTop + ratio * plotH;
                const price = maxVal - ratio * valRange;
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotW}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft + plotW + 8}
                      y={y + 4}
                      fill="currentColor"
                      className="text-[10px] font-mono text-slate-400 fill-current"
                    >
                      {unitLabel === "%" ? `${price.toFixed(2)}%` : price.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Area & Trend line */}
              {areaPath && <path d={areaPath} fill="url(#macroGradient)" />}
              {chartPath && (
                <path
                  d={chartPath}
                  fill="none"
                  stroke="#1769FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* 3. FOOTER */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Yahoo Finance · Official Cross-Asset Benchmark Series</span>
        </div>
        <span>Observation Date: {assetDetail?.lastObservationDate || "Latest available"}</span>
      </div>
    </div>
  );
}
