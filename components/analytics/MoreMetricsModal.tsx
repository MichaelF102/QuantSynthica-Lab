"use client";

import React from "react";
import { X } from "lucide-react";
import { fmtPct, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { SeriesStats, riskStats } from "@/lib/analyticsCalc";
import { signTone } from "@/components/ui/Card";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  strategyName: string;
  stats: SeriesStats | null;
  risk: ReturnType<typeof riskStats>;
}

export default function MoreMetricsModal({ isOpen, onClose, strategyName, stats, risk }: Props) {
  if (!isOpen) return null;
  const s = stats;
  const groups: { title: string; rows: [string, string, number | null][] }[] = [
    {
      title: "Returns",
      rows: [
        ["Total return", fmtPct(s?.totalReturn), s?.totalReturn ?? null],
        ["CAGR", fmtPct(s?.cagr), s?.cagr ?? null],
        ["Benchmark return", fmtPct(s?.benchReturn), s?.benchReturn ?? null],
        ["Best period", fmtPct(s?.bestPeriod), s?.bestPeriod ?? null],
        ["Worst period", fmtPct(s?.worstPeriod), s?.worstPeriod ?? null],
        ["Positive periods", fmtPct(s?.positivePct, 1, false), null],
      ],
    },
    {
      title: "Risk-adjusted",
      rows: [
        ["Sharpe (Rf = 0)", s ? formatRatio(s.sharpe) : "—", s?.sharpe ?? null],
        ["Sortino", s ? formatRatio(s.sortino) : "—", s?.sortino ?? null],
        ["Calmar", s ? formatRatio(s.calmar) : "—", s?.calmar ?? null],
        ["Benchmark Sharpe", s ? formatRatio(s.benchSharpe) : "—", null],
        ["Alpha (ann.)", fmtPct(s?.alpha), s?.alpha ?? null],
        ["Beta", s?.beta == null ? "—" : s.beta.toFixed(2), null],
      ],
    },
    {
      title: "Volatility & tail risk",
      rows: [
        ["Annualised volatility", fmtPct(s?.vol, 2, false), null],
        ["Downside deviation", fmtPct(risk?.downsideDev, 2, false), null],
        ["VaR 95% (daily)", fmtPct(risk ? -risk.var95 : null), null],
        ["VaR 99% (daily)", fmtPct(risk ? -risk.var99 : null), null],
        ["CVaR 95% (daily)", fmtPct(risk ? -risk.cvar95 : null), null],
        ["Benchmark volatility", fmtPct(s?.benchVol, 2, false), null],
      ],
    },
    {
      title: "Drawdown",
      rows: [
        ["Max drawdown", fmtPct(s ? -s.maxDD : null), s ? -s.maxDD : null],
        ["Benchmark max drawdown", fmtPct(s ? -s.benchMaxDD : null), null],
        ["Longest drawdown", s ? `${s.ddDuration} periods` : "—", null],
        ["Average drawdown", fmtPct(risk ? -risk.pain : null), null],
        ["Ulcer index", risk ? risk.ulcer.toFixed(2) : "—", null],
        ["Skew (daily)", risk ? risk.skew.toFixed(2) : "—", null],
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl border border-slate-800/90 bg-[#0b1222] p-5 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white">More metrics</h3>
            <p className="text-[11px] text-slate-400">{strategyName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.title} className="rounded-xl border border-slate-800/90 bg-[#080d1a]/60 p-3">
              <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">{g.title}</div>
              {g.rows.map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-800/50 py-1.5 text-xs last:border-0">
                  <span className="text-slate-400">{label}</span>
                  <span className={cn("font-mono font-semibold", value === "—" ? "text-slate-500" : tone === null ? "text-slate-100" : signTone(tone))}>{value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
