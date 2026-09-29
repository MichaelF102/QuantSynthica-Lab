"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Globe,
  BarChart3,
  Layers,
  ArrowRight,
  TrendingUp,
  Shield,
  Briefcase,
  Sliders,
  PlayCircle,
} from "lucide-react";
import WorkflowNavigation from "./WorkflowNavigation";
import WorkflowStage from "./WorkflowStage";
import WorkflowVisual from "./WorkflowVisual";
import WorkflowProgress from "./WorkflowProgress";

// Dynamically import subtle Three.js particle background with no SSR
const WorkflowNetwork = dynamic(
  () => import("@/components/three/WorkflowNetwork"),
  { ssr: false }
);

interface BottomPreview {
  id: number;
  tag: string;
  label: string;
  desc: string;
  renderMini: () => React.ReactNode;
}

const BOTTOM_PREVIEWS: BottomPreview[] = [
  {
    id: 0,
    tag: "01",
    label: "DATA",
    desc: "Market universe",
    renderMini: () => (
      <div className="flex h-11 w-full items-center justify-center">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 border border-blue-400/40 text-blue-600">
          <Globe className="h-4 w-4" />
        </div>
      </div>
    ),
  },
  {
    id: 1,
    tag: "02",
    label: "ANALYSE",
    desc: "Technical analysis",
    renderMini: () => (
      <div className="flex h-11 w-full items-end justify-center gap-1 px-1">
        <div className="h-5 w-1 rounded-xs bg-emerald-500" />
        <div className="h-8 w-1.5 rounded-xs bg-emerald-500" />
        <div className="h-4 w-1 rounded-xs bg-rose-500" />
        <div className="h-7 w-1.5 rounded-xs bg-emerald-500" />
        <div className="h-9 w-1.5 rounded-xs bg-emerald-500" />
        <div className="h-6 w-1 rounded-xs bg-rose-500" />
      </div>
    ),
  },
  {
    id: 2,
    tag: "03",
    label: "STRATEGY",
    desc: "Systematic rules",
    renderMini: () => (
      <div className="flex h-11 w-full items-center justify-center gap-1.5 text-[8px] font-mono">
        <span className="rounded bg-slate-100 border border-slate-200 px-1 py-0.5 font-bold text-slate-700">
          EMA 50
        </span>
        <span className="text-blue-500 font-bold">→</span>
        <span className="rounded bg-emerald-100 border border-emerald-300 px-1 py-0.5 font-bold text-emerald-700">
          BUY
        </span>
      </div>
    ),
  },
  {
    id: 3,
    tag: "04",
    label: "BACKTEST",
    desc: "Strategy performance",
    renderMini: () => (
      <div className="flex h-11 w-full flex-col justify-end">
        <div className="text-right text-[10px] font-mono font-bold text-emerald-600 leading-none mb-0.5">
          +24.8%
        </div>
        <svg className="h-5 w-full overflow-visible" viewBox="0 0 100 24">
          <path
            d="M 0 20 Q 25 18, 50 12 T 80 8 T 100 2"
            fill="none"
            stroke="#1769FF"
            strokeWidth="2"
          />
        </svg>
      </div>
    ),
  },
  {
    id: 4,
    tag: "05",
    label: "RISK",
    desc: "Risk analysis",
    renderMini: () => (
      <div className="flex h-11 w-full items-center justify-between text-[9px] font-mono text-slate-600 px-1">
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[8px] text-slate-400">Max DD</span>
          <span className="font-bold text-rose-500">-12.4%</span>
        </div>
        <div className="flex flex-col text-right leading-tight">
          <span className="text-[8px] text-slate-400">VaR (95%)</span>
          <span className="font-bold text-rose-500">-2.8%</span>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    tag: "06",
    label: "PORTFOLIO",
    desc: "Optimized allocation",
    renderMini: () => (
      <div className="flex h-11 w-full items-center justify-center gap-2">
        <div className="h-6 w-6 rounded-full border-3 border-blue-500 border-t-teal-400 border-r-indigo-500" />
        <div className="flex flex-col text-[8px] font-mono text-slate-600 leading-none">
          <span>AAPL 24%</span>
          <span className="mt-0.5 text-teal-600">RELIANCE 18%</span>
        </div>
      </div>
    ),
  },
];

export default function WorkflowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Single, unified transition function for all 5 interaction points
  const goToStep = useCallback((index: number) => {
    setActiveStep(Math.max(0, Math.min(5, index)));
  }, []);

  const prevStep = useCallback(() => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }, []);

  const nextStep = useCallback(() => {
    setActiveStep((prev) => Math.min(5, prev + 1));
  }, []);

  // Keyboard navigation when user is focused inside workflow
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "Home") {
        e.preventDefault();
        goToStep(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToStep(5);
      }
    },
    [nextStep, prevStep, goToStep]
  );

  return (
    <section
      id="workflow"
      ref={sectionRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Quantitative Workflow Section"
      className="relative w-full border-t border-slate-200/90 bg-[#F8FAFC] py-10 sm:py-14 lg:py-16 overflow-hidden focus:outline-none dark:border-slate-800 dark:bg-[#070D18] transition-colors duration-200"
    >
      {/* Subtle Quantitative Network Background (3D Three.js, Non-capturing) */}
      <WorkflowNetwork />

      {/* Subtle Coordinate Grid Lines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] -z-10" />

      {/* Main Content Container with Clamped Responsive Spacing */}
      <div className="relative z-10 flex flex-col justify-start gap-4 lg:gap-6 px-4 sm:px-6 lg:px-8 max-w-[1520px] mx-auto">
        {/* 1. Section Header Area */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.2em] text-[#1769FF] uppercase">
              <span>QUANTITATIVE WORKFLOW</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#1769FF] animate-pulse" />
            </div>

            <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0B1220] dark:text-white leading-tight">
              From market data{" "}
              <span className="bg-gradient-to-r from-[#1769FF] via-[#4338CA] to-[#6366F1] bg-clip-text text-transparent">
                to portfolio decisions.
              </span>
            </h2>

            <p className="mt-1.5 text-xs sm:text-sm text-[#526174] dark:text-slate-400 max-w-2xl leading-relaxed">
              Research, test, measure and refine ideas through a transparent
              workflow designed for quantitative analysis.
            </p>
          </div>

          {/* Right Side Metric Badges */}
          <div className="hidden sm:flex items-center gap-3 lg:gap-4 shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 px-3 py-2 shadow-2xs">
              <Globe className="h-4 w-4 text-[#1769FF]" />
              <div>
                <div className="text-xs font-bold text-[#0B1220] dark:text-white">1,000+</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Assets (US + India)</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 px-3 py-2 shadow-2xs">
              <BarChart3 className="h-4 w-4 text-[#1769FF]" />
              <div>
                <div className="text-xs font-bold text-[#0B1220] dark:text-white">50+</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Technical Indicators</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 px-3 py-2 shadow-2xs">
              <Layers className="h-4 w-4 text-[#1769FF]" />
              <div>
                <div className="text-xs font-bold text-[#0B1220] dark:text-white">10+</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Workflow Modules</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Top Horizontal Workflow Timeline (01 DATA -> 06 PORTFOLIO) */}
        <div>
          <WorkflowNavigation
            activeStage={activeStep}
            onSelectStage={goToStep}
          />
        </div>

        {/* 3. Main Stage Content & Central Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center my-1">
          {/* Left Column: Stage Copy & Feature Highlights (~38% = 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <WorkflowStage
              activeStage={activeStep}
              onPrev={prevStep}
              onNext={nextStep}
            />
          </div>

          {/* Center Column: Central Institutional Dynamic Visual (6 cols on lg, 7 cols on xl) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
            <WorkflowVisual activeStage={activeStep} />
          </div>

          {/* Right Column: Vertical Milestone Progress Rail (1 col on lg+) */}
          <div className="hidden lg:block lg:col-span-1">
            <WorkflowProgress
              activeStage={activeStep}
              onSelectStage={goToStep}
            />
          </div>
        </div>

        {/* 4. Bottom 6 Mini Stage Previews Row */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {BOTTOM_PREVIEWS.map((bp) => {
              const isActive = activeStep === bp.id;

              return (
                <button
                  key={bp.id}
                  onClick={() => goToStep(bp.id)}
                  aria-pressed={isActive}
                  aria-label={`Select stage ${bp.tag} ${bp.label}`}
                  className={`group flex flex-col justify-between rounded-xl border p-2 sm:p-2.5 text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-[#1769FF] bg-white shadow-md ring-2 ring-blue-500/20 -translate-y-0.5 dark:bg-[#0B1528] dark:border-[#1769FF]"
                      : "border-slate-200/90 bg-white/75 hover:border-slate-300 hover:bg-white hover:-translate-y-0.5 dark:border-slate-800 dark:bg-[#0B1528]/80 dark:hover:border-slate-700 dark:hover:bg-[#0B1528]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold transition-colors ${
                        isActive
                          ? "text-[#1769FF]"
                          : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                      }`}
                    >
                      {bp.tag} {bp.label}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                      {bp.desc}
                    </span>
                  </div>

                  {/* Render Mini Preview */}
                  <div className="w-full">{bp.renderMini()}</div>
                </button>
              );
            })}
          </div>

          {/* Bottom Direct Environment Link */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#526174] dark:text-slate-400">
            <span className="text-slate-400 dark:text-slate-500">
              *Continuous quantitative research workflow from raw market ingestion to production book construction.
            </span>
            <Link
              href="/research"
              className="inline-flex items-center gap-1 font-semibold text-[#1769FF] hover:text-blue-700 dark:hover:text-blue-400 transition-colors shrink-0"
            >
              <span>Explore the full research environment</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
