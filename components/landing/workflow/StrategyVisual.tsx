"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sliders, ArrowDown, CheckCircle2, Zap, ShieldCheck } from "lucide-react";

export default function StrategyVisual() {
  return (
    <div className="relative flex h-[460px] sm:h-[490px] w-full flex-col justify-between rounded-2xl bg-[#090E17] p-4 sm:p-5 text-white border border-slate-800 shadow-2xl overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12)_0,transparent_70%)]" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">
              SYSTEMATIC RULE BUILDER
            </div>
            <div className="text-[11px] text-slate-400">
              Deterministic Logic · No Black-Box Models
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          <span>VALIDATED SPEC</span>
        </div>
      </div>

      {/* Flow Diagram Canvas */}
      <div className="relative z-10 my-auto py-3 space-y-3">
        {/* Entry Conditions Block (2 Cards Side by Side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Node 1: Trend Filter */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-indigo-500/30 bg-slate-900/90 p-3 shadow-lg"
          >
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-indigo-400 font-bold uppercase">Condition 01 · Trend</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-indigo-300">GATE</span>
            </div>
            <div className="mt-1 text-sm font-mono font-bold text-white">
              Price &gt; EMA (50)
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Only enter long during established macro upward regime
            </div>
          </motion.div>

          {/* Node 2: Pullback Trigger */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="rounded-xl border border-purple-500/30 bg-slate-900/90 p-3 shadow-lg"
          >
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-purple-400 font-bold uppercase">Condition 02 · Momentum</span>
              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-purple-300">TRIGGER</span>
            </div>
            <div className="mt-1 text-sm font-mono font-bold text-white">
              RSI (14) &lt; 40
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Buy dips when momentum signals temporary oversold state
            </div>
          </motion.div>
        </div>

        {/* Junction Connector: LOGICAL AND */}
        <div className="flex items-center justify-center relative">
          <div className="h-6 w-0.5 bg-gradient-to-b from-indigo-500 to-blue-500" />
          <div className="absolute z-10 rounded-full bg-[#1769FF] px-2.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-md shadow-blue-500/40">
            LOGICAL AND
          </div>
        </div>

        {/* Action Trigger Node: BUY */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-xl border-2 border-emerald-500/40 bg-emerald-950/20 p-3 text-center shadow-lg shadow-emerald-500/10"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px] font-bold">
              ✓
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
              ACTION: GENERATE BUY SIGNAL
            </span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-300">
            <span>Fill: Next Bar Open (t+1)</span>
            <span>•</span>
            <span>Alloc: 15% Book NAV</span>
            <span>•</span>
            <span>Type: Market</span>
          </div>
        </motion.div>

        {/* Down Arrow Connector to Exit Gates */}
        <div className="flex items-center justify-center">
          <div className="h-4 w-0.5 bg-slate-700" />
        </div>

        {/* Exit Rules Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-rose-500/20 bg-slate-900/70 p-2.5 text-[10px] font-mono">
            <span className="text-rose-400 font-bold uppercase">Exit Rule 01 (Trend Breakdown)</span>
            <div className="text-xs font-bold text-white mt-0.5">Price &lt; EMA (20)</div>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-slate-900/70 p-2.5 text-[10px] font-mono">
            <span className="text-amber-400 font-bold uppercase">Exit Rule 02 (Risk Boundaries)</span>
            <div className="text-xs font-bold text-white mt-0.5">SL: -3.5% | TP: +8.0%</div>
          </div>
        </div>
      </div>

      {/* Bottom Rigor Footnote */}
      <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Zero lookahead bias guaranteed by compiler</span>
        </div>
        <span className="font-mono text-[10px] text-indigo-400">
          EXECUTION: t+1 NEXT-OPEN
        </span>
      </div>
    </div>
  );
}
