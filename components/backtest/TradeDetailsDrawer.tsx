"use client";

import React from "react";
import { TradeRecord } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { X, ExternalLink, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

interface TradeDetailsDrawerProps {
  trade: TradeRecord | null;
  onClose: () => void;
  onViewOnChart?: (trade: TradeRecord) => void;
}

export default function TradeDetailsDrawer({
  trade,
  onClose,
  onViewOnChart,
}: TradeDetailsDrawerProps) {
  if (!trade) return null;

  const isWin = trade.net_pnl > 0;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0b1222] border-l border-[#1e293b] shadow-2xl flex flex-col font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b] bg-[#080d1a]">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#cbd5e1] uppercase tracking-wider text-xs">
            TRADE INSPECTION
          </span>
          <span className="px-1.5 py-0.5 rounded-[2px] bg-[#1e293b] text-[#94a3b8] text-[10px]">
            {trade.id.slice(0, 8)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-[2px] text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#1e293b] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Core Result Banner */}
        <div className="border border-[#1e293b] bg-[#080d1a] p-3 rounded-[2px] flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-[#cbd5e1]">{trade.ticker}</span>
              <span
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                  trade.direction.includes("LONG")
                    ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30"
                    : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30"
                }`}
              >
                {trade.direction}
              </span>
            </div>
            <span className="text-[10px] text-[#64748b]">EXECUTION ORDER #{trade.id.slice(0, 6)}</span>
          </div>

          <div className="text-right">
            <div className={`text-base font-bold ${isWin ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {isWin ? "+" : ""}{formatCurrency(trade.net_pnl)}
            </div>
            <span className={`text-[11px] font-bold ${isWin ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {formatPercent(trade.return_pct)}
            </span>
          </div>
        </div>

        {/* Action: View on Chart */}
        {onViewOnChart && (
          <button
            onClick={() => onViewOnChart(trade)}
            className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-[2px] bg-[#0b1222] hover:bg-[#1e293b] border border-[#1e293b] text-[#3b82f6] text-xs font-bold transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>VIEW TRADE ON PRICE CHART</span>
          </button>
        )}

        {/* Execution Timestamps & Prices */}
        <div className="border border-[#1e293b] bg-[#080d1a] rounded-[2px] p-3 space-y-2">
          <span className="text-[10px] text-[#64748b] block uppercase tracking-wider border-b border-[#1e293b] pb-1">
            FILL SPECIFICATIONS
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[#64748b] block text-[10px]">ENTRY DATE</span>
              <span className="text-[#cbd5e1] font-semibold">{trade.entry_date}</span>
            </div>
            <div>
              <span className="text-[#64748b] block text-[10px]">ENTRY PRICE</span>
              <span className="text-[#cbd5e1] font-semibold">{formatCurrency(trade.entry_price)}</span>
            </div>
            <div>
              <span className="text-[#64748b] block text-[10px]">EXIT DATE</span>
              <span className="text-[#cbd5e1] font-semibold">{trade.exit_date}</span>
            </div>
            <div>
              <span className="text-[#64748b] block text-[10px]">EXIT PRICE</span>
              <span className="text-[#cbd5e1] font-semibold">{formatCurrency(trade.exit_price)}</span>
            </div>
            <div>
              <span className="text-[#64748b] block text-[10px]">POSITION SIZE</span>
              <span className="text-[#cbd5e1] font-semibold">{trade.quantity.toFixed(2)} units</span>
            </div>
            <div>
              <span className="text-[#64748b] block text-[10px]">HOLDING DURATION</span>
              <span className="text-[#cbd5e1] font-semibold">{trade.holding_period_bars} bars</span>
            </div>
          </div>
        </div>

        {/* P&L & Friction Attribution */}
        <div className="border border-[#1e293b] bg-[#080d1a] rounded-[2px] p-3 space-y-2">
          <span className="text-[10px] text-[#64748b] block uppercase tracking-wider border-b border-[#1e293b] pb-1">
            FINANCIAL ATTRIBUTION
          </span>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Gross P&L:</span>
              <span className={trade.gross_pnl >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                {formatCurrency(trade.gross_pnl)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Transaction Fees & Slippage:</span>
              <span className="text-[#EF4444]">-{formatCurrency(trade.fees)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#1e293b] font-bold">
              <span className="text-[#cbd5e1]">Net Realized P&L:</span>
              <span className={trade.net_pnl >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                {formatCurrency(trade.net_pnl)}
              </span>
            </div>
          </div>
        </div>

        {/* Excursion & Risk Analysis */}
        <div className="border border-[#1e293b] bg-[#080d1a] rounded-[2px] p-3 space-y-2">
          <span className="text-[10px] text-[#64748b] block uppercase tracking-wider border-b border-[#1e293b] pb-1">
            TRADE EXCURSION & TRIGGER
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="border border-[#1e293b] p-2 bg-[#0b1222] rounded-[2px]">
              <span className="text-[#64748b] block text-[9px] uppercase">MFE (Peak Run-up)</span>
              <span className="text-[#10B981] font-bold text-xs">
                {trade.mfe !== undefined ? `+${Math.abs(trade.mfe).toFixed(2)}%` : "N/A"}
              </span>
            </div>
            <div className="border border-[#1e293b] p-2 bg-[#0b1222] rounded-[2px]">
              <span className="text-[#64748b] block text-[9px] uppercase">MAE (Peak Drawdown)</span>
              <span className="text-[#EF4444] font-bold text-xs">
                {trade.mae !== undefined ? `-${Math.abs(trade.mae).toFixed(2)}%` : "N/A"}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[#64748b] block text-[10px]">EXIT TRIGGER REASON</span>
            <div className="mt-1 px-2 py-1 rounded-[2px] bg-[#0b1222] border border-[#1e293b] text-[#cbd5e1] font-semibold">
              {trade.exit_reason}
            </div>
          </div>
        </div>

        {/* Integrity Notice */}
        <div className="p-2 border border-[#1e293b] bg-[#080d1a] rounded-[2px] text-[10px] text-[#64748b]">
          <span className="text-[#94a3b8] font-semibold block mb-0.5">Execution Integrity:</span>
          Order signaled at bar {trade.entry_date} close, filled at bar open (zero lookahead bias).
        </div>
      </div>
    </div>
  );
}
