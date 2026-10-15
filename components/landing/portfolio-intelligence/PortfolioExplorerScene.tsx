"use client";

import React, { useState, useMemo } from "react";
import { RotateCcw, ChevronRight, Home, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PortfolioExplorerSceneProps {
  drilldownLevel: number;
  selectedAssetClass: "equity" | "factors" | "options" | "cash" | null;
  selectedSector: string | null;
  selectedAsset: string | null;
  onDrilldown: (level: number, id: string) => void;
  onReset: () => void;
  onSelectViewMode: (mode: "assetClass" | "sector" | "individual") => void;
  assetClassWeights: {
    equity: number;
    factors: number;
    options: number;
    cash: number;
  };
  allocations: {
    id: string;
    name: string;
    company: string;
    weight: number;
    color: string;
  }[];
}

interface SliceData {
  id: string;
  label: string;
  sublabel: string;
  weight: number;
  color: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

// Polar to Cartesian conversion helper
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Generate SVG Donut Path
function describeDonutArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const sweepAngle = Math.min(359.999, Math.max(0.1, endAngle - startAngle));
  const safeEndAngle = startAngle + sweepAngle;

  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, safeEndAngle);
  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, safeEndAngle);

  const largeArcFlag = sweepAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export default function PortfolioExplorerScene({
  drilldownLevel,
  selectedAssetClass,
  selectedSector,
  selectedAsset,
  onDrilldown,
  onReset,
  onSelectViewMode,
  assetClassWeights,
  allocations,
}: PortfolioExplorerSceneProps) {
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  const currentViewMode: "assetClass" | "sector" | "individual" =
    drilldownLevel === 0 ? "assetClass" : drilldownLevel === 1 ? "sector" : "individual";

  // Build slices data depending on current view mode
  const slices: SliceData[] = useMemo(() => {
    let items: { id: string; label: string; sublabel: string; weight: number; color: string }[] = [];

    if (currentViewMode === "assetClass") {
      items = [
        {
          id: "equity",
          label: "Equity",
          sublabel: "6 Core Assets",
          weight: assetClassWeights.equity,
          color: "#00E5FF",
        },
        {
          id: "factors",
          label: "Factors",
          sublabel: "Smart Beta Overlay",
          weight: assetClassWeights.factors,
          color: "#A855F7",
        },
        {
          id: "options",
          label: "Options",
          sublabel: "Tail Risk Hedging",
          weight: assetClassWeights.options,
          color: "#F59E0B",
        },
        {
          id: "cash",
          label: "Cash & Repos",
          sublabel: "Liquid Yield",
          weight: assetClassWeights.cash,
          color: "#10B981",
        },
      ];
    } else if (currentViewMode === "sector") {
      items = [
        { id: "tech", label: "Technology", sublabel: "NVDA, AAPL, TCS, INFY", weight: 38.5, color: "#06B6D4" },
        { id: "fin", label: "Financials", sublabel: "HDFCBANK", weight: 26.2, color: "#3B82F6" },
        { id: "energy", label: "Energy", sublabel: "RELIANCE", weight: 18.4, color: "#F59E0B" },
        { id: "etf", label: "Index ETF", sublabel: "SPY (S&P 500)", weight: 10.2, color: "#8B5CF6" },
        { id: "other", label: "Other", sublabel: "Cash & Cash Equivalents", weight: 6.7, color: "#10B981" },
      ];
    } else {
      // Individual Asset mode
      items = allocations.map((a) => ({
        id: a.id,
        label: a.name,
        sublabel: a.company,
        weight: a.weight,
        color: a.color,
      }));
    }

    const total = items.reduce((acc, it) => acc + it.weight, 0);
    let currentAngle = 0;

    return items.map((it) => {
      const angleSpan = (it.weight / Math.max(0.1, total)) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      const midAngle = startAngle + angleSpan / 2;
      currentAngle += angleSpan;

      return {
        ...it,
        startAngle,
        endAngle,
        midAngle,
      };
    });
  }, [currentViewMode, assetClassWeights, allocations]);

  // Active slice calculation for central display
  const activeSlice =
    slices.find((s) => s.id === hoveredSliceId) ||
    slices.find((s) => s.id === selectedAsset) ||
    slices.find((s) => s.id === selectedAssetClass) ||
    null;

  const handleSliceClick = (slice: SliceData) => {
    if (currentViewMode === "assetClass") {
      onDrilldown(1, slice.id);
    } else if (currentViewMode === "sector") {
      onDrilldown(2, slice.id);
    } else {
      onDrilldown(3, slice.id);
    }
  };

  return (
    <div className="w-full h-[580px] lg:h-[640px] relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#080E1B] via-[#050912] to-[#04070E] border border-cyan-500/20 shadow-[0_12px_48px_rgba(0,0,0,0.6)] flex flex-col justify-between p-5 select-none">
      {/* 1. TOP HEADER & INTERACTIVE VIEW MODE TOGGLES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-black tracking-[0.16em] text-white uppercase drop-shadow-md">
              PORTFOLIO EXPLORER
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
            Explore your portfolio from asset class → sector → individual asset.
          </p>

          {/* Interactive Breadcrumbs */}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono font-bold">
            <button
              onClick={() => onDrilldown(0, "portfolio")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                drilldownLevel === 0
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Home className="w-3 h-3" />
              <span>PORTFOLIO</span>
            </button>

            {drilldownLevel >= 1 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <button
                  onClick={() => onDrilldown(1, "equity")}
                  className={`px-2 py-0.5 rounded-md transition-colors uppercase ${
                    drilldownLevel === 1
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {selectedAssetClass || "EQUITY"}
                </button>
              </>
            )}

            {drilldownLevel >= 2 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <button
                  onClick={() => onDrilldown(2, selectedSector || "technology")}
                  className={`px-2 py-0.5 rounded-md transition-colors uppercase ${
                    drilldownLevel === 2
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {selectedSector || "TECHNOLOGY"}
                </button>
              </>
            )}

            {drilldownLevel >= 3 && selectedAsset && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {selectedAsset}
                </span>
              </>
            )}
          </div>
        </div>

        {/* View Mode Switcher & Reset Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex p-1 rounded-xl bg-[#091120]/90 border border-slate-700/80 backdrop-blur-md shadow-inner text-[11px] font-bold text-slate-300">
            <button
              onClick={() => onSelectViewMode("assetClass")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                currentViewMode === "assetClass"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                  : "hover:text-white"
              }`}
            >
              Asset Class
            </button>
            <button
              onClick={() => onSelectViewMode("sector")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                currentViewMode === "sector"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                  : "hover:text-white"
              }`}
            >
              Sector
            </button>
            <button
              onClick={() => onSelectViewMode("individual")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                currentViewMode === "individual"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                  : "hover:text-white"
              }`}
            >
              Individual
            </button>
          </div>

          <button
            onClick={onReset}
            title="Reset View"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091120]/90 border border-slate-700/80 hover:border-cyan-400/60 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* 2. 2D INTERACTIVE PIE / DONUT CANVAS & CENTER METRICS */}
      <div className="relative flex-1 w-full flex items-center justify-center my-2">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-cyan-500/10 blur-[80px]" />

        {/* Top-Left Total Weight Pill */}
        <div className="absolute top-0 left-0 z-10 pointer-events-none">
          <div className="px-3.5 py-2 rounded-2xl bg-[#060D1A]/90 border border-cyan-500/30 backdrop-blur-md shadow-lg">
            <div className="text-[9.5px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              TOTAL PORTFOLIO
            </div>
            <div className="text-xl font-black text-white tracking-tight leading-none mt-0.5">
              100%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {allocations.length} Active Assets • ₹10,00,000
            </div>
          </div>
        </div>

        {/* The 2D SVG Pie Chart Container */}
        <div className="relative w-full max-w-[340px] h-[340px] flex items-center justify-center">
          <svg
            viewBox="0 0 320 320"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Track Ring */}
            <circle
              cx="160"
              cy="160"
              r="135"
              fill="none"
              stroke="#0C1A30"
              strokeWidth="42"
            />

            {/* Interactive Slices */}
            {slices.map((slice) => {
              const isHovered = hoveredSliceId === slice.id;
              const isSelected =
                slice.id === selectedAsset || slice.id === selectedAssetClass;
              const isHighlighted = isHovered || isSelected;

              // Compute slight radial explosion offset when hovered
              const midRad = ((slice.midAngle - 90) * Math.PI) / 180;
              const offset = isHighlighted ? 8 : 0;
              const offsetX = offset * Math.cos(midRad);
              const offsetY = offset * Math.sin(midRad);

              const innerRadius = 90;
              const outerRadius = isHighlighted ? 138 : 132;

              const pathData = describeDonutArc(
                160 + offsetX,
                160 + offsetY,
                innerRadius,
                outerRadius,
                slice.startAngle,
                slice.endAngle
              );

              return (
                <g key={slice.id} className="transition-all duration-200">
                  <path
                    d={pathData}
                    fill={slice.color}
                    fillOpacity={isHighlighted ? 0.95 : 0.82}
                    stroke="#050912"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    filter={isHighlighted ? "url(#pieGlow)" : undefined}
                    className="cursor-pointer transition-all duration-200 hover:brightness-110"
                    onMouseEnter={() => setHoveredSliceId(slice.id)}
                    onMouseLeave={() => setHoveredSliceId(null)}
                    onClick={() => handleSliceClick(slice)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Central Donut Hole Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              {activeSlice ? activeSlice.label : "PORTFOLIO"}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none my-0.5">
              {activeSlice ? `${activeSlice.weight.toFixed(1)}%` : "100%"}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {activeSlice
                ? `₹${((1000000 * activeSlice.weight) / 100).toLocaleString("en-IN")}`
                : "₹10,00,000"}
            </span>
            <span className="mt-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-300">
              {activeSlice ? activeSlice.sublabel : "Balanced Mix"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE LEGEND PILLS */}
      <div className="z-10 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-center gap-2 flex-wrap max-h-24 overflow-y-auto no-scrollbar">
          {slices.map((slice) => {
            const isHovered = hoveredSliceId === slice.id;
            const isSelected =
              slice.id === selectedAsset || slice.id === selectedAssetClass;
            const isHighlighted = isHovered || isSelected;

            return (
              <button
                key={slice.id}
                type="button"
                onMouseEnter={() => setHoveredSliceId(slice.id)}
                onMouseLeave={() => setHoveredSliceId(null)}
                onClick={() => handleSliceClick(slice)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                  isHighlighted
                    ? "bg-slate-800 text-white border border-cyan-400/60 ring-1 ring-cyan-400/30 scale-105"
                    : "bg-[#091120]/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/80"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-white font-bold">{slice.label}</span>
                <span className="text-slate-400">{slice.weight.toFixed(1)}%</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Platform Ribbon */}
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-[#060D1A]/90 border border-cyan-500/40 backdrop-blur-md shadow-sm">
            <PieChart className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-300 uppercase">
              2D INTERACTIVE PIE ALLOCATION
            </span>
            <span className="text-[9.5px] text-slate-400 font-mono hidden sm:inline">
              [Click slice or legend to inspect &amp; drill down]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
