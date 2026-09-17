"use client";

import React, { useState } from "react";
import { MonthlyReturnRecord } from "@/types";
import { formatPercent } from "@/lib/formatters";

interface MonthlyTableProps {
  data: MonthlyReturnRecord[];
  backtestId?: string;
  hideHeader?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthlyReturnsTable({ data, backtestId, hideHeader = false }: MonthlyTableProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    year: number;
    month: string;
    val: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="border border-[#252A31] bg-[#101318] p-4 text-center text-xs font-mono text-[#89919C]">
        DATA NOT AVAILABLE FOR THIS RUN
      </div>
    );
  }

  const getBgColor = (val: number | undefined) => {
    if (val === undefined || val === null) return "text-[#59616B]";
    if (val === 0) return "text-[#89919C]";
    if (val > 0) {
      return "text-[#10B981] bg-[#10B981]/[0.08] hover:bg-[#10B981]/20 font-semibold";
    } else {
      return "text-[#EF4444] bg-[#EF4444]/[0.08] hover:bg-[#EF4444]/20 font-semibold";
    }
  };

  return (
    <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-3 select-none">
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[#252A31] mb-2.5 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#D8DCE2] uppercase tracking-wider text-[11px]">
              MONTHLY RETURNS ATTRIBUTION MATRIX (%)
            </span>
            <span className="text-[10px] text-[#59616B]">Net of fees & slippage</span>
          </div>
          {hoveredCell && (
            <div className="text-[11px] text-[#D8DCE2] bg-[#0B0D10] px-2 py-0.5 border border-[#252A31] rounded-[2px]">
              <span className="text-[#89919C]">{hoveredCell.month} {hoveredCell.year}: </span>
              <span className={hoveredCell.val >= 0 ? "text-[#10B981] font-bold" : "text-[#EF4444] font-bold"}>
                {formatPercent(hoveredCell.val)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[11px] text-right border-collapse">
          <thead>
            <tr className="border-b border-[#252A31] text-[#89919C] text-[10px] uppercase">
              <th className="py-1.5 px-2 text-left font-medium text-[#59616B]">YEAR</th>
              {MONTHS.map((m) => (
                <th key={m} className="py-1.5 px-1.5 font-medium">
                  {m}
                </th>
              ))}
              <th className="py-1.5 px-2.5 font-bold text-[#D8DCE2] border-l border-[#252A31]">
                YTD
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252A31]/50">
            {data.map((row) => (
              <tr key={row.year} className="hover:bg-[#141820]/40 transition-colors">
                <td className="py-1.5 px-2 text-left font-bold text-[#D8DCE2]">{row.year}</td>
                {MONTHS.map((m) => {
                  const val = row[m];
                  return (
                    <td
                      key={m}
                      onMouseEnter={() => val !== undefined && setHoveredCell({ year: row.year, month: m, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`py-1.5 px-1.5 transition-colors cursor-default ${getBgColor(val)}`}
                    >
                      {val !== undefined ? formatPercent(val, true, 1) : "—"}
                    </td>
                  );
                })}
                <td
                  className={`py-1.5 px-2.5 font-bold border-l border-[#252A31] ${getBgColor(
                    row.YTD
                  )}`}
                >
                  {formatPercent(row.YTD, true, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
