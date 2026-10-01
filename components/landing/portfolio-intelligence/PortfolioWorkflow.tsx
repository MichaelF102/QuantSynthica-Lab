"use client";

import React, { useState } from "react";
import { Check, ArrowRight, Layers, Sliders, BarChart3, ChevronRight } from "lucide-react";
import { PORTFOLIO_VISUAL_CONFIG } from "@/lib/portfolio/portfolioVisualConfig";

interface PortfolioWorkflowProps {
  drilldownLevel?: number;
  selectedAssetClass?: "equity" | "factors" | "options" | "cash" | null;
  selectedSector?: string | null;
  selectedAsset?: string | null;
  assetClassWeights?: {
    equity: number;
    factors: number;
    options: number;
    cash: number;
  };
  allocations?: {
    id: string;
    name: string;
    company: string;
    weight: number;
    color: string;
  }[];
  onDrilldown?: (level: number, id: string) => void;
}

export default function PortfolioWorkflow({
  drilldownLevel = 0,
  selectedAssetClass = "equity",
  selectedSector = "technology",
  selectedAsset,
  assetClassWeights = {
    equity: 55.2,
    factors: 20.1,
    options: 15.2,
    cash: 9.5,
  },
  allocations = [],
  onDrilldown,
}: PortfolioWorkflowProps) {
  const [metricUnit, setMetricUnit] = useState<"allocation" | "risk">("allocation");

  const sectors = PORTFOLIO_VISUAL_CONFIG.sectors;

  // Asset breakdown bars
  const assetBars = [
    { ticker: "RELIANCE", weight: 18.4, color: "#00E5FF" },
    { ticker: "HDFC", weight: 11.6, color: "#3B82F6" },
    { ticker: "TCS", weight: 8.7, color: "#F59E0B" },
    { ticker: "INFY", weight: 7.3, color: "#8B5CF6" },
    { ticker: "AAPL", weight: 5.1, color: "#EF4444" },
    { ticker: "MSFT", weight: 4.2, color: "#EC4899" },
    { ticker: "Other", weight: 44.7, color: "#475569" },
  ];

  return (
    <div className="mt-12 space-y-8">
      {/* ============================================================ */}
      {/* 3 BOTTOM CARDS MATCHING REFERENCE MOCKUP (input_file_1.png) */}
      {/* 1. Allocation Hierarchy | 2. Sector Breakdown | 3. Asset Allocation */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ============================================================ */}
        {/* CARD 1: ALLOCATION HIERARCHY */}
        {/* ============================================================ */}
        <div className="p-6 rounded-3xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1769FF] dark:text-cyan-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-sm font-bold text-[#0B1220] dark:text-white">Allocation Hierarchy</h4>
            </div>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-4">
              <span>Portfolio</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-[#1769FF] dark:text-blue-400 font-semibold">Equity</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Technology</span>
            </div>

            {/* 3D Stacked Isometric Layers Graphic + Exposure Bars */}
            <div className="grid grid-cols-12 gap-3 items-center pt-2">
              {/* Isometric Slabs Graphic */}
              <div className="col-span-5 flex items-center justify-center">
                <svg viewBox="0 0 120 100" className="w-full h-24 overflow-visible">
                  {/* Cash Slab */}
                  <g transform="translate(15, 66)">
                    <path d="M 0 10 L 45 0 L 90 10 L 45 20 Z" fill="#10B981" opacity="0.8" />
                    <path d="M 0 10 L 0 15 L 45 25 L 45 20 Z" fill="#059669" />
                    <path d="M 45 20 L 45 25 L 90 15 L 90 10 Z" fill="#047857" />
                  </g>
                  {/* Options Slab */}
                  <g transform="translate(15, 46)">
                    <path d="M 0 10 L 45 0 L 90 10 L 45 20 Z" fill="#F59E0B" opacity="0.85" />
                    <path d="M 0 10 L 0 15 L 45 25 L 45 20 Z" fill="#D97706" />
                    <path d="M 45 20 L 45 25 L 90 15 L 90 10 Z" fill="#B45309" />
                  </g>
                  {/* Factors Slab */}
                  <g transform="translate(15, 26)">
                    <path d="M 0 10 L 45 0 L 90 10 L 45 20 Z" fill="#8B5CF6" opacity="0.9" />
                    <path d="M 0 10 L 0 15 L 45 25 L 45 20 Z" fill="#7C3AED" />
                    <path d="M 45 20 L 45 25 L 90 15 L 90 10 Z" fill="#6D28D9" />
                  </g>
                  {/* Equity Slab */}
                  <g transform="translate(15, 6)">
                    <path d="M 0 10 L 45 0 L 90 10 L 45 20 Z" fill="#00E5FF" opacity="0.95" />
                    <path d="M 0 10 L 0 15 L 45 25 L 45 20 Z" fill="#0284C7" />
                    <path d="M 45 20 L 45 25 L 90 15 L 90 10 Z" fill="#0369A1" />
                  </g>
                </svg>
              </div>

              {/* Exposure Percentage Bars */}
              <div className="col-span-7 space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                      Equity
                    </span>
                    <span className="font-mono font-bold text-[#0B1220] dark:text-white">
                      {assetClassWeights.equity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E5FF] rounded-full" style={{ width: `${assetClassWeights.equity}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                      Factors
                    </span>
                    <span className="font-mono font-bold text-[#0B1220] dark:text-white">
                      {assetClassWeights.factors.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${assetClassWeights.factors}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      Options
                    </span>
                    <span className="font-mono font-bold text-[#0B1220] dark:text-white">
                      {assetClassWeights.options.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${assetClassWeights.options}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      Cash
                    </span>
                    <span className="font-mono font-bold text-[#0B1220] dark:text-white">
                      {assetClassWeights.cash.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${assetClassWeights.cash}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 2: SECTOR BREAKDOWN (EQUITY) */}
        {/* ============================================================ */}
        <div className="p-6 rounded-3xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-sm font-bold text-[#0B1220] dark:text-white">Sector Breakdown (Equity)</h4>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Allocation %
              </div>
            </div>

            {/* Sector Bar Chart matching reference */}
            <div className="mt-2 h-36 flex items-end gap-2 pt-4 px-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              {sectors.map((sec) => {
                const heightPercent = (sec.weight / 35) * 100;
                return (
                  <div key={sec.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-mono font-bold text-[#0B1220] dark:text-white">
                      {sec.weight.toFixed(0)}%
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md h-full flex items-end overflow-hidden">
                      <div
                        className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-85"
                        style={{ height: `${heightPercent}%`, backgroundColor: sec.color }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-500 dark:text-slate-400 font-medium truncate w-full text-center">
                      {sec.name.slice(0, 4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 3: EQUITY ALLOCATION BY ASSET */}
        {/* ============================================================ */}
        <div className="p-6 rounded-3xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/50">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-sm font-bold text-[#0B1220] dark:text-white">Equity Allocation by Asset</h4>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Allocation %
              </div>
            </div>

            {/* Asset Bar Chart matching reference */}
            <div className="mt-2 h-36 flex items-end gap-1.5 pt-4 px-1 pb-4 border-b border-slate-100 dark:border-slate-800">
              {assetBars.map((item) => {
                const heightPercent = (item.weight / 45) * 100;
                return (
                  <div key={item.ticker} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-mono font-bold text-[#0B1220] dark:text-white">
                      {item.weight.toFixed(0)}%
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md h-full flex items-end overflow-hidden">
                      <div
                        className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-85"
                        style={{ height: `${heightPercent}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-500 dark:text-slate-400 font-medium truncate w-full text-center">
                      {item.ticker}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. SIGNATURE ARCHITECTURE: PORTFOLIO DNA RAIL */}
      {/* ============================================================ */}
      <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-[#1769FF] dark:text-cyan-400 uppercase">
              SIGNATURE ARCHITECTURE
            </div>
            <h4 className="text-sm font-bold text-[#0B1220] dark:text-white">PORTFOLIO DNA</h4>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#64748B] dark:text-slate-400">
            <span>RETURN</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
            <span>RISK</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
            <span>DIVERSIFICATION</span>
          </div>
        </div>

        {/* Continuous DNA Composition Bar */}
        <div className="mt-4">
          <div className="h-3.5 w-full rounded-xl overflow-hidden flex shadow-2xs">
            <div style={{ width: `${assetClassWeights.equity}%` }} className="bg-[#00E5FF]" title={`Equity ${assetClassWeights.equity}%`} />
            <div style={{ width: `${assetClassWeights.factors}%` }} className="bg-[#8B5CF6]" title={`Factors ${assetClassWeights.factors}%`} />
            <div style={{ width: `${assetClassWeights.options}%` }} className="bg-[#F59E0B]" title={`Options ${assetClassWeights.options}%`} />
            <div style={{ width: `${assetClassWeights.cash}%` }} className="bg-[#10B981]" title={`Cash ${assetClassWeights.cash}%`} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
              <span>EQUITY ({assetClassWeights.equity.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
              <span>FACTORS ({assetClassWeights.factors.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span>OPTIONS ({assetClassWeights.options.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>CASH ({assetClassWeights.cash.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
