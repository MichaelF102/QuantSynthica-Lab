"use client";

import React, { useState } from "react";
import {
  Calendar,
  ChevronDown,
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
}: AnalyticsHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const handleApplyDate = () => {
    onDateChange(tempStart, tempEnd);
    setShowDatePicker(false);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#1E2530] gap-4">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-white tracking-tight font-sans">
            Analytics
          </h1>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-semibold border border-[#10B981]/30">
            PRO SUITE
          </span>
        </div>
        <p className="text-xs text-[#89919C] mt-0.5">
          Deep insights into strategy performance, risk, behavior and market regime sensitivity
        </p>
      </div>

      {/* Control Bar: Date Range, Granularity, Currency, Run Analysis */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Date Range Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center space-x-2 bg-[#0F141D] hover:bg-[#151C28] border border-[#202C3F] px-3 py-1.5 rounded text-slate-200 hover:text-white transition-colors text-xs font-mono"
          >
            <span>{startDate}</span>
            <span className="text-slate-500">→</span>
            <span>{endDate}</span>
            <Calendar className="w-3.5 h-3.5 text-[#38BDF8] ml-1" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 top-full mt-1.5 bg-[#0C1017] border border-[#202C3F] rounded-lg p-3 shadow-2xl z-50 w-72 space-y-3">
              <div className="text-[11px] font-semibold text-white">Select Date Window</div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full bg-[#131822] border border-[#252E3E] text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full bg-[#131822] border border-[#252E3E] text-white text-xs px-2 py-1 rounded focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1 border-t border-[#1E2530]">
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
                  className="px-3 py-1 text-[11px] bg-[#0284C7] hover:bg-[#0369A1] text-white font-medium rounded"
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
            className="appearance-none bg-[#0F141D] hover:bg-[#151C28] border border-[#202C3F] text-slate-200 pl-3 pr-7 py-1.5 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Currency Dropdown */}
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as any)}
            className="appearance-none bg-[#0F141D] hover:bg-[#151C28] border border-[#202C3F] text-slate-200 pl-3 pr-7 py-1.5 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer"
          >
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Run Analysis Action Button */}
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={isRunning}
          className="flex items-center space-x-1.5 bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] text-white px-3.5 py-1.5 rounded text-xs font-semibold shadow-md transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white text-white" />
          )}
          <span>{isRunning ? "Simulating..." : "Run Analysis"}</span>
        </button>
      </div>
    </div>
  );
}
