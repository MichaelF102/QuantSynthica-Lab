"use client";

import React, { useEffect, useState } from "react";
import { CURRENCY_SYMBOL } from "@/lib/analyticsCalc";
import {
  Calendar,
  ChevronDown,
  Download,
  Play,
  RotateCw,
} from "lucide-react";

interface AnalyticsHeaderProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  frequency: "Daily" | "Weekly" | "Monthly";
  onFrequencyChange: (freq: "Daily" | "Weekly" | "Monthly") => void;
  currency: "USD" | "INR" | "EUR" | "GBP";
  onCurrencyChange: (curr: "USD" | "INR" | "EUR" | "GBP") => void;
  onRunAnalysis: () => void;
  isRunning?: boolean;
  /** Download the selected runs as a comparison CSV or a self-contained HTML report. */
  onExport?: (kind: "csv" | "html") => void;
  canExport?: boolean;
}

export default function AnalyticsHeader({
  startDate,
  endDate,
  onDateChange,
  frequency,
  onFrequencyChange,
  currency,
  onCurrencyChange,
  onRunAnalysis,
  isRunning = false,
  onExport,
  canExport = true,
}: AnalyticsHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  const handleApplyDate = () => {
    if (tempStart && tempEnd && tempStart > tempEnd) return;
    onDateChange(tempStart, tempEnd);
    setShowDatePicker(false);
  };

  return (
    <header className="relative flex flex-col justify-between gap-4 border-b border-slate-800/60 pb-5 lg:flex-row lg:items-center">
      <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
          Strategy{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Analytics</span>
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-secondary">
          Performance, risk and market-regime behaviour, recomputed from each run&apos;s equity curve and trades.
        </p>
      </div>

      {/* Control Bar: Date Range, Granularity, Currency, Run Analysis */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Date Range Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 font-mono text-xs text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            <span>{startDate}</span>
            <span className="text-slate-500">→</span>
            <span>{endDate}</span>
            <Calendar className="w-3.5 h-3.5 text-blue-400 ml-1" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 top-full mt-1.5 bg-[#0B101C] border border-slate-800 rounded-xl p-3 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)] z-[60] w-72 space-y-3">
              <div className="text-[11px] font-semibold text-white">Select Date Window</div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full bg-[#0F172A]/70 border border-slate-700/50 text-white text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full bg-[#0F172A]/70 border border-slate-700/50 text-white text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyDate}
                  className="px-3 py-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Frequency Dropdown */}
        <div className="relative">
          <select
            value={frequency}
            onChange={(e) => onFrequencyChange(e.target.value as any)}
            className="cursor-pointer appearance-none rounded-lg border border-slate-700/50 bg-[#0F172A]/70 py-1.5 pl-3 pr-7 text-xs text-slate-100 outline-none transition-colors hover:border-slate-600 focus:border-blue-500"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Currency: the run's own currency. There is no FX conversion, so this is a label, not a switch. */}
        <span
          title="Values are shown in the lead strategy's own currency. No FX conversion is applied."
          className="inline-flex items-center rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-3 py-1.5 font-mono text-xs text-slate-200"
        >
          {currency} ({CURRENCY_SYMBOL[currency]})
        </span>

        {onExport && (
          <div className="relative">
            <button type="button" onClick={() => setShowExport((v) => !v)} disabled={!canExport} aria-haspopup="menu" aria-expanded={showExport} title="Download the selected runs" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-40">
              <Download className="h-3.5 w-3.5" />Export<ChevronDown className="h-3 w-3" />
            </button>
            {showExport && (
              <div role="menu" className="absolute right-0 z-[60] mt-1.5 w-56 overflow-hidden rounded-xl border border-slate-800 bg-[#0B101C] py-1 text-xs shadow-2xl">
                <button type="button" role="menuitem" onClick={() => { setShowExport(false); onExport("csv"); }} className="block w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800/60">Comparison (CSV)</button>
                <button type="button" role="menuitem" onClick={() => { setShowExport(false); onExport("html"); }} className="block w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800/60">Report (HTML file)</button>
              </div>
            )}
          </div>
        )}

        {/* Run Analysis Action Button */}
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {isRunning ? (
            <RotateCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          <span>{isRunning ? "Applying…" : "Run Analysis"}</span>
        </button>
      </div>
    </header>
  );
}
