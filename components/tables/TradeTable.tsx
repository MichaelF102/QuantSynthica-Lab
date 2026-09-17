"use client";

import React, { useState, useMemo } from "react";
import { TradeRecord } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Download, Search, ArrowUpDown } from "lucide-react";

interface TradeTableProps {
  trades: TradeRecord[];
  backtestId?: string;
  onSelectTrade?: (trade: TradeRecord) => void;
  selectedTradeId?: string | null;
}

type SortField = "entry_date" | "exit_date" | "net_pnl" | "return_pct" | "holding_period_bars" | "mae" | "mfe";

export default function TradeTable({
  trades,
  backtestId,
  onSelectTrade,
  selectedTradeId,
}: TradeTableProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "LONG" | "SHORT" | "WINNERS" | "LOSERS">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("entry_date");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const summary = useMemo(() => {
    if (!trades || trades.length === 0) return null;
    const rets = trades.map((t) => t.return_pct);
    const sorted = [...rets].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const wins = trades.filter((t) => t.net_pnl > 0);
    const losses = trades.filter((t) => t.net_pnl <= 0);

    return {
      best: Math.max(...rets),
      worst: Math.min(...rets),
      avg: rets.reduce((a, b) => a + b, 0) / rets.length,
      median,
      winsCount: wins.length,
      lossesCount: losses.length,
      winRate: (wins.length / trades.length) * 100,
      totalFees: trades.reduce((a, b) => a + b.fees, 0),
      netPnl: trades.reduce((a, b) => a + b.net_pnl, 0),
      avgHolding: trades.reduce((a, b) => a + b.holding_period_bars, 0) / trades.length,
    };
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades
      .filter((t) => {
        // Tab filter
        if (activeTab === "LONG" && !t.direction.includes("LONG")) return false;
        if (activeTab === "SHORT" && !t.direction.includes("SHORT")) return false;
        if (activeTab === "WINNERS" && t.net_pnl <= 0) return false;
        if (activeTab === "LOSERS" && t.net_pnl > 0) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            t.id.toLowerCase().includes(q) ||
            t.ticker.toLowerCase().includes(q) ||
            t.exit_reason.toLowerCase().includes(q) ||
            t.direction.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] as any;
        let valB = b[sortField] as any;
        if (typeof valA === "string") {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [trades, activeTab, searchQuery, sortField, sortAsc]);

  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrades.slice(start, start + pageSize);
  }, [filteredTrades, currentPage]);

  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    if (!trades || trades.length === 0) return;
    const headers = [
      "Trade ID", "Ticker", "Direction", "Entry Date", "Exit Date",
      "Entry Price", "Exit Price", "Quantity", "Gross PnL", "Fees",
      "Net PnL", "Return %", "Holding Bars", "Exit Reason", "MAE %", "MFE %"
    ];
    const rows = trades.map((t) => [
      t.id, t.ticker, t.direction, t.entry_date, t.exit_date,
      t.entry_price, t.exit_price, t.quantity, t.gross_pnl, t.fees,
      t.net_pnl, t.return_pct, t.holding_period_bars, t.exit_reason, t.mae, t.mfe
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trades_${backtestId || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!trades || trades.length === 0) {
    return (
      <div className="border border-[#252A31] bg-[#101318] p-6 text-center text-xs font-mono text-[#89919C] rounded-[2px]">
        NO TRADES: No entry conditions were triggered during the selected backtest period.
      </div>
    );
  }

  return (
    <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-3 space-y-3 select-none">
      {/* Institutional Trade KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 border border-[#252A31] bg-[#0B0D10] divide-x divide-y sm:divide-y-0 divide-[#252A31] text-[11px] font-mono">
          <div className="p-2">
            <span className="text-[10px] text-[#59616B] block uppercase">WIN RATE</span>
            <span className="font-bold text-[#D8DCE2] text-xs">
              {summary.winRate.toFixed(1)}%
            </span>
            <span className="text-[9px] text-[#89919C] block">
              {summary.winsCount}W / {summary.lossesCount}L
            </span>
          </div>

          <div className="p-2">
            <span className="text-[10px] text-[#59616B] block uppercase">NET P&L</span>
            <span className={`font-bold text-xs ${summary.netPnl >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {formatCurrency(summary.netPnl)}
            </span>
            <span className="text-[9px] text-[#89919C] block">
              Fees: {formatCurrency(summary.totalFees)}
            </span>
          </div>

          <div className="p-2">
            <span className="text-[10px] text-[#59616B] block uppercase">AVG TRADE</span>
            <span className={`font-bold text-xs ${summary.avg >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {formatPercent(summary.avg)}
            </span>
            <span className="text-[9px] text-[#89919C] block">
              Median: {formatPercent(summary.median)}
            </span>
          </div>

          <div className="p-2">
            <span className="text-[10px] text-[#59616B] block uppercase">BEST TRADE</span>
            <span className="font-bold text-xs text-[#10B981]">
              {formatPercent(summary.best)}
            </span>
          </div>

          <div className="p-2">
            <span className="text-[10px] text-[#59616B] block uppercase">WORST TRADE</span>
            <span className="font-bold text-xs text-[#EF4444]">
              {formatPercent(summary.worst)}
            </span>
          </div>

          <div className="p-2">
            <span className="text-[10px] text-[#59616B] block uppercase">AVG HOLDING</span>
            <span className="font-bold text-xs text-[#D8DCE2]">
              {summary.avgHolding.toFixed(1)} bars
            </span>
          </div>

          <div className="p-2">
            <span className="text-[10px] text-[#59616B] block uppercase">TOTAL TRADES</span>
            <span className="font-bold text-xs text-[#38BDF8]">
              {trades.length}
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 font-mono text-xs">
        {/* Direction / Outcome Tabs */}
        <div className="flex items-center rounded-[2px] border border-[#252A31] bg-[#0B0D10] p-0.5">
          {(["ALL", "LONG", "SHORT", "WINNERS", "LOSERS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] transition-colors ${
                activeTab === tab
                  ? "bg-[#252A31] text-[#38BDF8]"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right side search & export */}
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center">
            <Search className="h-3 w-3 text-[#59616B] absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search trades... (/)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-7 pr-2 py-1 text-[11px] bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-[#D8DCE2] placeholder-[#59616B] focus:outline-none focus:border-[#38BDF8]"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1 px-2 py-1 rounded-[2px] border border-[#252A31] bg-[#0B0D10] hover:bg-[#141820] text-[11px] text-[#89919C] hover:text-[#D8DCE2] transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-[#252A31]">
        <table className="w-full font-mono text-[11px] text-right border-collapse">
          <thead>
            <tr className="border-b border-[#252A31] bg-[#0B0D10] text-[#89919C] text-[10px] uppercase">
              <th className="py-2 px-2 text-left">#</th>
              <th className="py-2 px-2 text-left">TICKER</th>
              <th className="py-2 px-2 text-center">SIDE</th>
              <th
                onClick={() => handleSort("entry_date")}
                className="py-2 px-2 text-left cursor-pointer hover:text-[#D8DCE2]"
              >
                ENTRY {sortField === "entry_date" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("exit_date")}
                className="py-2 px-2 text-left cursor-pointer hover:text-[#D8DCE2]"
              >
                EXIT {sortField === "exit_date" && (sortAsc ? "▲" : "▼")}
              </th>
              <th className="py-2 px-2">ENTRY $</th>
              <th className="py-2 px-2">EXIT $</th>
              <th className="py-2 px-2">QTY</th>
              <th
                onClick={() => handleSort("net_pnl")}
                className="py-2 px-2 cursor-pointer hover:text-[#D8DCE2]"
              >
                P&L ($) {sortField === "net_pnl" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("return_pct")}
                className="py-2 px-2 cursor-pointer hover:text-[#D8DCE2]"
              >
                RETURN % {sortField === "return_pct" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("holding_period_bars")}
                className="py-2 px-2 cursor-pointer hover:text-[#D8DCE2]"
              >
                BARS {sortField === "holding_period_bars" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("mae")}
                className="py-2 px-2 cursor-pointer hover:text-[#D8DCE2]"
              >
                MAE % {sortField === "mae" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("mfe")}
                className="py-2 px-2 cursor-pointer hover:text-[#D8DCE2]"
              >
                MFE % {sortField === "mfe" && (sortAsc ? "▲" : "▼")}
              </th>
              <th className="py-2 px-2 text-left">REASON</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252A31]/50">
            {paginatedTrades.map((t, idx) => {
              const rowNum = (currentPage - 1) * pageSize + idx + 1;
              const isSelected = t.id === selectedTradeId;
              return (
                <tr
                  key={t.id}
                  onClick={() => onSelectTrade && onSelectTrade(t)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#38BDF8]/10 border-l-2 border-[#38BDF8]"
                      : "hover:bg-[#141820]/60"
                  }`}
                >
                  <td className="py-1.5 px-2 text-left text-[#59616B]">{rowNum}</td>
                  <td className="py-1.5 px-2 text-left font-bold text-[#D8DCE2]">{t.ticker}</td>
                  <td className="py-1.5 px-2 text-center">
                    <span
                      className={`px-1 py-0.5 text-[9px] font-bold rounded-[2px] ${
                        t.direction.includes("LONG")
                          ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30"
                          : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30"
                      }`}
                    >
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-left text-[#89919C]">{t.entry_date}</td>
                  <td className="py-1.5 px-2 text-left text-[#89919C]">{t.exit_date}</td>
                  <td className="py-1.5 px-2 text-[#D8DCE2]">{formatCurrency(t.entry_price)}</td>
                  <td className="py-1.5 px-2 text-[#D8DCE2]">{formatCurrency(t.exit_price)}</td>
                  <td className="py-1.5 px-2 text-[#89919C]">{t.quantity.toFixed(2)}</td>
                  <td
                    className={`py-1.5 px-2 font-bold ${
                      t.net_pnl >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                  >
                    {formatCurrency(t.net_pnl)}
                  </td>
                  <td
                    className={`py-1.5 px-2 font-bold ${
                      t.return_pct >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                  >
                    {formatPercent(t.return_pct)}
                  </td>
                  <td className="py-1.5 px-2 text-[#89919C]">{t.holding_period_bars}</td>
                  <td className="py-1.5 px-2 text-[#EF4444]">
                    {t.mae !== undefined ? `-${Math.abs(t.mae).toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-1.5 px-2 text-[#10B981]">
                    {t.mfe !== undefined ? `+${Math.abs(t.mfe).toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-1.5 px-2 text-left">
                    <span className="text-[10px] text-[#89919C] px-1 py-0.5 rounded-[2px] bg-[#0B0D10] border border-[#252A31]">
                      {t.exit_reason}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs font-mono text-[#89919C] pt-1">
        <span className="text-[11px]">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, filteredTrades.length)} of {filteredTrades.length}{" "}
          trades
        </span>
        <div className="flex space-x-1 text-[11px]">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2 py-0.5 rounded-[2px] border border-[#252A31] bg-[#0B0D10] disabled:opacity-30 hover:bg-[#141820]"
          >
            PREV
          </button>
          <span className="px-2 py-0.5 text-[#D8DCE2]">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-0.5 rounded-[2px] border border-[#252A31] bg-[#0B0D10] disabled:opacity-30 hover:bg-[#141820]"
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
}
