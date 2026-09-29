"use client";

import React from "react";
import { Check, ArrowRight, Layers, Sliders, BarChart3 } from "lucide-react";

export default function PortfolioWorkflow() {
  return (
    <div className="mt-12 space-y-8">
      {/* 3 Large Horizontal Stages (Construct, Optimize, Analyze) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ============================================================ */}
        {/* STAGE 01: CONSTRUCT */}
        {/* ============================================================ */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1769FF] dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1769FF] dark:text-blue-400 tracking-wider uppercase">01</span>
                <h4 className="text-sm font-bold text-[#0B1220] dark:text-white">CONSTRUCT</h4>
              </div>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mb-5">Build a diversified portfolio.</p>

            <ul className="space-y-2.5 text-xs text-[#526174] dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#1769FF] dark:text-blue-400 shrink-0" />
                <span>Select assets and strategies</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#1769FF] dark:text-blue-400 shrink-0" />
                <span>Set position sizing and constraints</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#1769FF] dark:text-blue-400 shrink-0" />
                <span>Control sector and factor exposure</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#1769FF] dark:text-blue-400 shrink-0" />
                <span>Include long/short and hedging</span>
              </li>
            </ul>
          </div>

          {/* Isometric Building Blocks Visual */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <svg viewBox="0 0 180 120" className="w-44 h-28 overflow-visible">
              {/* Stacked 3D Isometric Layers */}
              {/* Cash Layer (Bottom) */}
              <g transform="translate(40, 75)">
                <path d="M 0 15 L 50 0 L 100 15 L 50 30 Z" fill="#94A3B8" opacity="0.8" />
                <path d="M 0 15 L 0 23 L 50 38 L 50 30 Z" fill="#64748B" />
                <path d="M 50 30 L 50 38 L 100 23 L 100 15 Z" fill="#475569" />
                <text x="50" y="24" fontSize="7" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Cash</text>
              </g>

              {/* Factors Layer */}
              <g transform="translate(40, 55)">
                <path d="M 0 15 L 50 0 L 100 15 L 50 30 Z" fill="#0D9488" opacity="0.9" />
                <path d="M 0 15 L 0 23 L 50 38 L 50 30 Z" fill="#0F766E" />
                <path d="M 50 30 L 50 38 L 100 23 L 100 15 Z" fill="#115E59" />
                <text x="50" y="24" fontSize="7" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Factors</text>
              </g>

              {/* Options Layer */}
              <g transform="translate(40, 35)">
                <path d="M 0 15 L 50 0 L 100 15 L 50 30 Z" fill="#8B5CF6" opacity="0.9" />
                <path d="M 0 15 L 0 23 L 50 38 L 50 30 Z" fill="#7C3AED" />
                <path d="M 50 30 L 50 38 L 100 23 L 100 15 Z" fill="#6D28D9" />
                <text x="50" y="24" fontSize="7" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Options</text>
              </g>

              {/* Equities Layer (Top) */}
              <g transform="translate(40, 15)">
                <path d="M 0 15 L 50 0 L 100 15 L 50 30 Z" fill="#1769FF" />
                <path d="M 0 15 L 0 23 L 50 38 L 50 30 Z" fill="#1D4ED8" />
                <path d="M 50 30 L 50 38 L 100 23 L 100 15 Z" fill="#1E40AF" />
                <text x="50" y="24" fontSize="7" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">Equities</text>
              </g>
            </svg>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STAGE 02: OPTIMIZE */}
        {/* ============================================================ */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#0D9488] dark:text-teal-400 flex items-center justify-center border border-teal-100 dark:border-teal-900/50">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0D9488] dark:text-teal-400 tracking-wider uppercase">02</span>
                <h4 className="text-sm font-bold text-[#0B1220] dark:text-white">OPTIMIZE</h4>
              </div>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mb-5">Find the best allocation.</p>

            <ul className="space-y-2.5 text-xs text-[#526174] dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0D9488] dark:text-teal-400 shrink-0" />
                <span>Mean-Variance Optimization</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0D9488] dark:text-teal-400 shrink-0" />
                <span>Risk Parity Allocation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0D9488] dark:text-teal-400 shrink-0" />
                <span>Minimum Variance Portfolio</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0D9488] dark:text-teal-400 shrink-0" />
                <span>Maximum Sharpe Ratio</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#0D9488] dark:text-teal-400 shrink-0" />
                <span>Factor-based Optimization</span>
              </li>
            </ul>
          </div>

          {/* 3D Convex Optimization Surface Visual */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
            <svg viewBox="0 0 180 110" className="w-48 h-28 overflow-visible">
              <defs>
                <linearGradient id="optGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6366F1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Wireframe Bell / Paraboloid Surface */}
              <path
                d="M 10 90 Q 50 85, 90 25 Q 130 85, 170 90 L 140 105 Q 90 60, 40 105 Z"
                fill="url(#optGrad)"
              />
              <path
                d="M 30 95 Q 60 70, 90 25 Q 120 70, 150 95"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1.2"
              />
              <path
                d="M 50 100 Q 70 55, 90 25 Q 110 55, 130 100"
                fill="none"
                stroke="#818CF8"
                strokeWidth="1"
              />

              {/* Optimum Marker */}
              <circle cx="90" cy="25" r="4" fill="#1769FF" stroke="#FFFFFF" strokeWidth="1.5" />
              <line x1="90" y1="25" x2="120" y2="12" stroke="#1769FF" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
            <div className="absolute top-2 right-4 px-2 py-0.5 rounded-md bg-white dark:bg-[#070D18] border border-blue-200 dark:border-blue-800 shadow-2xs text-[9px] font-bold text-[#1769FF] dark:text-blue-400">
              Optimal Sharpe: 1.21
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STAGE 03: ANALYZE */}
        {/* ============================================================ */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-[#6366F1] dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#6366F1] dark:text-indigo-400 tracking-wider uppercase">03</span>
                <h4 className="text-sm font-bold text-[#0B1220] dark:text-white">ANALYZE</h4>
              </div>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mb-5">Understand performance and risk.</p>

            <ul className="space-y-2.5 text-xs text-[#526174] dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#6366F1] dark:text-indigo-400 shrink-0" />
                <span>Return, volatility and drawdown</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#6366F1] dark:text-indigo-400 shrink-0" />
                <span>VaR and risk metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#6366F1] dark:text-indigo-400 shrink-0" />
                <span>Correlation and factor exposure</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#6366F1] dark:text-indigo-400 shrink-0" />
                <span>Attribution analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#6366F1] dark:text-indigo-400 shrink-0" />
                <span>Scenario and stress testing</span>
              </li>
            </ul>
          </div>

          {/* Stacked Glass Analytical Plates with Metrics */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2">
            <svg viewBox="0 0 110 110" className="w-24 h-24 overflow-visible">
              <g transform="translate(10, 15)">
                {/* Plate 1 */}
                <path d="M 0 12 L 45 0 L 90 12 L 45 24 Z" fill="#38BDF8" opacity="0.4" stroke="#0284C7" strokeWidth="1" />
                {/* Plate 2 */}
                <path d="M 0 32 L 45 20 L 90 32 L 45 44 Z" fill="#6366F1" opacity="0.4" stroke="#4F46E5" strokeWidth="1" />
                {/* Plate 3 */}
                <path d="M 0 52 L 45 40 L 90 52 L 45 64 Z" fill="#10B981" opacity="0.4" stroke="#059669" strokeWidth="1" />
                {/* Plate 4 */}
                <path d="M 0 72 L 45 60 L 90 72 L 45 84 Z" fill="#8B5CF6" opacity="0.4" stroke="#7C3AED" strokeWidth="1" />
              </g>
            </svg>

            <div className="space-y-1.5 text-right text-[10px]">
              <div>
                <span className="text-[#64748B] dark:text-slate-400">Return: </span>
                <span className="font-bold text-teal-600 dark:text-teal-400">14.8%</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-slate-400">Risk: </span>
                <span className="font-bold text-[#0B1220] dark:text-white">12.3%</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-slate-400">Diversification: </span>
                <span className="font-bold text-[#1769FF] dark:text-blue-400">0.68</span>
              </div>
              <div>
                <span className="text-[#64748B] dark:text-slate-400">Stability: </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">0.81</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PORTFOLIO DNA Rail */}
      <div className="p-6 rounded-2xl bg-white/95 dark:bg-[#0B1528]/95 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-[#1769FF] uppercase">
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
          <div className="h-4 w-full rounded-xl overflow-hidden flex shadow-2xs">
            <div style={{ width: "55.6%" }} className="bg-[#1769FF]" title="Equity 55.6%" />
            <div style={{ width: "20.1%" }} className="bg-[#0D9488]" title="Factors 20.1%" />
            <div style={{ width: "15.2%" }} className="bg-[#8B5CF6]" title="Options 15.2%" />
            <div style={{ width: "6.1%" }} className="bg-slate-400" title="Cash 6.1%" />
            <div style={{ width: "3.0%" }} className="bg-amber-500" title="Hedge 3.0%" />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1769FF]" />
              <span>EQUITY (55.6%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
              <span>FACTORS (20.1%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
              <span>OPTIONS (15.2%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>CASH (6.1%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>HEDGE (3.0%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
