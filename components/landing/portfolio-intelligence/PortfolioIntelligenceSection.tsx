"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, ShieldCheck } from "lucide-react";
import PortfolioHeader from "./PortfolioHeader";
import { ConstructPortfolioPanel, PortfolioAllocationBars } from "./AllocationPanel";
import Portfolio3DScene from "./Portfolio3DScene";
import PortfolioMetrics from "./PortfolioMetrics";
import RiskReturnProfile from "./RiskReturnProfile";
import PortfolioWorkflow from "./PortfolioWorkflow";
import { AssetAllocation } from "./PortfolioConstellation";
import SectionBackground from "@/components/backgrounds/SectionBackground";

const INITIAL_ALLOCATIONS: AssetAllocation[] = [
  {
    id: "RELIANCE",
    name: "RELIANCE",
    company: "Reliance Industries",
    weight: 18.4,
    color: "#10B981",
    riskContrib: 12.7,
    volatility: 24.1,
    correlation: 0.62,
    position: [1.8, 1.25, 0.2],
  },
  {
    id: "NVDA",
    name: "NVDA",
    company: "NVIDIA Corp.",
    weight: 12.4,
    color: "#F59E0B",
    riskContrib: 18.2,
    volatility: 38.4,
    correlation: 0.54,
    position: [0.25, 1.8, 0.2],
  },
  {
    id: "HDFC",
    name: "HDFC",
    company: "HDFC Bank",
    weight: 11.6,
    color: "#06B6D4",
    riskContrib: 9.8,
    volatility: 19.5,
    correlation: 0.58,
    position: [1.7, -1.15, 0.2],
  },
  {
    id: "SPY",
    name: "SPY",
    company: "S&P 500 ETF",
    weight: 10.2,
    color: "#6366F1",
    riskContrib: 8.4,
    volatility: 16.2,
    correlation: 0.72,
    position: [2.2, 0.15, 0.2],
  },
  {
    id: "AAPL",
    name: "AAPL",
    company: "Apple Inc.",
    weight: 9.1,
    color: "#8B5CF6",
    riskContrib: 8.9,
    volatility: 21.0,
    correlation: 0.68,
    position: [-2.2, 0.1, 0.2],
  },
  {
    id: "TCS",
    name: "TCS",
    company: "Tata Consultancy",
    weight: 8.7,
    color: "#3B82F6",
    riskContrib: 6.5,
    volatility: 18.2,
    correlation: 0.48,
    position: [-1.7, 1.25, 0.2],
  },
  {
    id: "INFY",
    name: "INFY",
    company: "Infosys Ltd",
    weight: 7.3,
    color: "#EF4444",
    riskContrib: 5.8,
    volatility: 20.4,
    correlation: 0.52,
    position: [-0.2, -1.65, 0.2],
  },
];

export default function PortfolioIntelligenceSection() {
  const [allocations, setAllocations] = useState<AssetAllocation[]>(INITIAL_ALLOCATIONS);
  const [selectedAsset, setSelectedAsset] = useState<string | null>("RELIANCE");

  // Handle + / - adjustments
  const handleUpdateWeight = (id: string, delta: number) => {
    setAllocations((prev) => {
      return prev.map((asset) => {
        if (asset.id === id) {
          const newWeight = Math.max(1, Math.min(40, +(asset.weight + delta).toFixed(1)));
          return { ...asset, weight: newWeight };
        }
        return asset;
      });
    });
  };

  // Derive composite asset class weights
  const totalWeight = allocations.reduce((acc, a) => acc + a.weight, 0);
  const scale = 77.7 / Math.max(1, totalWeight); // base equities + factors
  const equityWeight = +(allocations.reduce((acc, a) => acc + a.weight, 0) * 0.71 * scale).toFixed(1);
  const factorsWeight = +(20.1 * (totalWeight / 77.7)).toFixed(1);
  const optionsWeight = 15.2;
  const cashWeight = +(Math.max(2, 100 - (equityWeight + factorsWeight + optionsWeight))).toFixed(1);

  // Derive responsive metrics
  const avgVol = allocations.reduce((acc, a) => acc + a.volatility * (a.weight / 100), 0);
  const expectedReturn = +(12.2 + (totalWeight - 70) * 0.12).toFixed(1);
  const volatility = +(avgVol * 0.65).toFixed(1);
  const sharpeRatio = +(expectedReturn / Math.max(1, volatility)).toFixed(2);
  const maxDrawdown = -(+(volatility * 0.76).toFixed(1));
  const var95 = -(+(volatility * 0.25).toFixed(1));
  const sortinoRatio = +(sharpeRatio * 1.38).toFixed(2);

  return (
    <section
      id="portfolio-intelligence"
      className="relative w-full bg-[var(--bg-portfolio)] py-20 lg:py-28 overflow-hidden border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-500"
    >
      {/* Component-Specific Semantic Portfolio Background */}
      <SectionBackground variant="portfolio" />

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
        {/* 1. Header & Capability Strip */}
        <PortfolioHeader />

        {/* 2. Main Tripartite Layout: Left Construct Panel - Center 3D Scene - Right Analytics */}
        <div className="mt-10 flex flex-col lg:flex-row items-center lg:items-stretch gap-6">
          {/* Left: Construct Portfolio Panel */}
          <ConstructPortfolioPanel
            allocations={allocations}
            onUpdateWeight={handleUpdateWeight}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
          />

          {/* Center: 3D Portfolio Constellation Scene */}
          <div className="flex-1 w-full min-w-0">
            <Portfolio3DScene
              allocations={allocations}
              selectedAsset={selectedAsset}
              onSelectAsset={setSelectedAsset}
              assetClassWeights={{
                equity: equityWeight,
                factors: factorsWeight,
                options: optionsWeight,
                cash: cashWeight,
              }}
            />
          </div>

          {/* Right Column: Allocation Bars + Metrics + Risk/Return Scatter */}
          <div className="w-full lg:w-[310px] shrink-0 space-y-4">
            <PortfolioAllocationBars
              weights={{
                equity: equityWeight,
                factors: factorsWeight,
                options: optionsWeight,
                cash: cashWeight,
              }}
            />

            <PortfolioMetrics
              metrics={{
                expectedReturn,
                volatility,
                sharpeRatio,
                maxDrawdown,
                var95,
                sortinoRatio,
              }}
            />

            <RiskReturnProfile
              volatility={volatility}
              expectedReturn={expectedReturn}
            />
          </div>
        </div>

        {/* 3. Three Editorial Stages (Construct, Optimize, Analyze) & Portfolio DNA */}
        <PortfolioWorkflow />

        {/* 4. Section Narrative Transition */}
        <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0B1528] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400 mb-2">
              <Layers className="w-4 h-4" />
              <span>THE PORTFOLIO THESIS</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-white tracking-tight">
              &ldquo;From allocation to conviction.&rdquo;
            </h3>
            <p className="mt-1 text-sm sm:text-base text-[#64748B] dark:text-slate-400">
              See how capital, risk and diversification interact before moving from research to decision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0B1220] dark:bg-blue-600 hover:bg-[#1e293b] dark:hover:bg-blue-500 text-white text-sm font-semibold shadow-sm transition-all group"
            >
              Explore Portfolio Lab
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/risk"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0B1220] dark:text-white text-sm font-semibold transition-colors"
            >
              Analyze Risk →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
