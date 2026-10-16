"use client";

import React from "react";
import { useEscape } from "@/lib/useEscape";
import { X } from "lucide-react";
import { BacktestResult } from "@/types";
import { fmtPct, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { SeriesStats, benchmarkLabel, runName } from "@/lib/analyticsCalc";
import { signTone } from "@/components/ui/Card";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: { bt: BacktestResult; stats: SeriesStats | null }[];
  windowLabel: string;
}

export default function DetailedReportModal({ isOpen, onClose, items, windowLabel }: Props) {
  useEscape(isOpen, onClose);
  if (!isOpen) return null;
  const valid = items.filter((i) => i.stats);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl border border-slate-800/90 bg-[#0b1222] p-5 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white">Detailed report</h3>
            <p className="font-mono text-[11px] text-slate-400">{windowLabel}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {valid.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">No strategy has enough data in the selected window.</p>
        ) : (
          valid.map(({ bt, stats: s }) => s && (
            <div key={bt.id} className="space-y-3 rounded-xl border border-slate-800/90 bg-[#080d1a]/60 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-white">{runName(bt, items.map((i) => i.bt))} <span className="font-mono text-[11px] font-normal text-slate-400">({bt.ticker})</span></div>
                <div className="text-[11px] text-slate-400">vs {benchmarkLabel(bt.benchmark)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  ["Return", fmtPct(s.totalReturn), s.totalReturn],
                  ["Benchmark", fmtPct(s.benchReturn), s.benchReturn],
                  ["Excess", fmtPct(s.totalReturn - s.benchReturn), s.totalReturn - s.benchReturn],
                  ["CAGR", fmtPct(s.cagr), s.cagr],
                  ["Sharpe", formatRatio(s.sharpe), null],
                  ["Benchmark Sharpe", formatRatio(s.benchSharpe), null],
                  ["Max drawdown", fmtPct(-s.maxDD), -s.maxDD],
                  ["Alpha (ann.)", fmtPct(s.alpha), s.alpha],
                ] as [string, string, number | null][]).map(([k, v, t]) => (
                  <div key={k}>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">{k}</div>
                    <div className={cn("font-mono text-sm font-bold", v === "—" ? "text-slate-500" : t === null ? "text-white" : signTone(t))}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <p className="text-[11px] text-slate-500">Figures are recomputed from each run&apos;s equity curve inside the selected window and frequency. Sharpe uses a 0% risk-free rate.</p>
      </div>
    </div>
  );
}
