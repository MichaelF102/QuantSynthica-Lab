"use client";

import React, { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

interface MonthlyRow {
  year: string;
  months: (number | null)[];
  ytd: number;
}

const HEATMAP_DATA: MonthlyRow[] = [
  {
    year: "2023",
    months: [2.1, -1.4, 3.8, 1.2, 5.6, -2.3, 4.1, -3.7, -1.9, 5.2, 3.4, 1.8],
    ytd: 18.7,
  },
  {
    year: "2024",
    months: [2.4, 1.1, -0.8, 3.6, 2.9, -1.2, null, null, null, null, null, null],
    ytd: 8.2,
  },
  {
    year: "Avg",
    months: [2.3, -0.1, 1.5, 2.4, 4.3, -1.8, 4.1, -3.7, -1.9, 5.2, 3.4, 1.8],
    ytd: 13.5,
  },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getCellColor(val: number | null): { bg: string; text: string; border: string } {
  if (val === null) {
    return {
      bg: "bg-[#0B0F17]",
      text: "text-slate-600",
      border: "border-[#141B26]",
    };
  }

  if (val > 0) {
    // scale from 0 to +6%
    const intensity = Math.min(1, Math.max(0.15, val / 6));
    if (intensity > 0.7) {
      return {
        bg: "bg-[#064E3B]/60",
        text: "text-[#34D399]",
        border: "border-[#065F46]/60",
      };
    } else if (intensity > 0.4) {
      return {
        bg: "bg-[#064E3B]/40",
        text: "text-[#10B981]",
        border: "border-[#065F46]/40",
      };
    } else {
      return {
        bg: "bg-[#064E3B]/25",
        text: "text-[#6EE7B7]",
        border: "border-[#065F46]/30",
      };
    }
  } else if (val < 0) {
    const intensity = Math.min(1, Math.max(0.15, Math.abs(val) / 6));
    if (intensity > 0.7) {
      return {
        bg: "bg-[#7F1D1D]/60",
        text: "text-[#F87171]",
        border: "border-[#991B1B]/60",
      };
    } else if (intensity > 0.4) {
      return {
        bg: "bg-[#7F1D1D]/40",
        text: "text-[#EF4444]",
        border: "border-[#991B1B]/40",
      };
    } else {
      return {
        bg: "bg-[#7F1D1D]/25",
        text: "text-[#FCA5A5]",
        border: "border-[#991B1B]/30",
      };
    }
  }

  return {
    bg: "bg-[#0F1522]",
    text: "text-slate-400",
    border: "border-[#1E2738]",
  };
}

export default function PortfolioMonthlyHeatmapWidget() {
  const [selectedYear, setSelectedYear] = useState<string>("2023");

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between">
      {/* 1. Header & Year Dropdown */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1A2230]">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold text-white tracking-tight font-sans">
            Monthly Returns Heatmap (%)
          </h2>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Monthly percentage return calendar matrix with compounded YTD"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Year Dropdown */}
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="appearance-none bg-[#111722] border border-[#1F2B3E] text-slate-200 pl-2.5 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer font-mono"
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="ALL">All Years</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. Heatmap Table Grid */}
      <div className="overflow-x-auto pt-3">
        <table className="w-full text-center border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1E2738] text-[11px] text-[#717E90]">
              <th className="py-1.5 px-2 text-left font-sans font-medium text-slate-400">Year</th>
              {MONTH_NAMES.map((m) => (
                <th key={m} className="py-1.5 px-1 font-sans font-medium text-slate-400">
                  {m}
                </th>
              ))}
              <th className="py-1.5 px-2 text-right font-sans font-medium text-slate-300">YTD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141B26]">
            {HEATMAP_DATA.map((row) => (
              <tr key={row.year} className="hover:bg-[#0E1522]/50 transition-colors">
                <td className="py-2 px-2 text-left font-sans font-semibold text-slate-300">
                  {row.year}
                </td>
                {row.months.map((val, idx) => {
                  const style = getCellColor(val);
                  return (
                    <td key={idx} className="p-1">
                      <div
                        className={`rounded py-1 px-1 text-[11px] font-mono border transition-all ${style.bg} ${style.text} ${style.border}`}
                      >
                        {val !== null ? val.toFixed(1) : "—"}
                      </div>
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-right font-bold text-[#10B981]">
                  {row.ytd.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Bottom Gradient Color Scale Bar */}
      <div className="pt-4 flex flex-col items-center justify-center space-y-1">
        <div className="w-64 sm:w-80 h-1.5 rounded-full bg-gradient-to-r from-[#EF4444] via-[#090D14] to-[#10B981]" />
        <div className="w-64 sm:w-80 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="text-[#F87171]">-10%</span>
          <span className="text-slate-400">0%</span>
          <span className="text-[#34D399]">+10%</span>
        </div>
      </div>
    </div>
  );
}
