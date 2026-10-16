"use client";

import React from "react";
import { X, Printer } from "lucide-react";
import { fmtPct, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { signTone } from "@/components/ui/Card";
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";
import { CurrencyCode, fmtMoney } from "@/lib/analyticsCalc";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: PortfolioResult | null;
  portfolioName: string;
  benchmarkName: string;
  currency: CurrencyCode;
  initialCapital: number;
  rebalance: string;
  start: string;
  end: string;
}

/** Structured, print-optimised report. Only `.qs-print-area` is visible when printing (see globals.css). */
export default function PortfolioReportModal({ isOpen, onClose, result, portfolioName, benchmarkName, currency, initialCapital, rebalance, start, end }: Props) {
  if (!isOpen) return null;
  const s = result?.stats ?? null;
  const m = result ? riskModel(result) : null;
  const synthetic = result?.syntheticTickers ?? [];
  const stat = (k: string, v: string, t?: number | null) => (
    <div key={k} className="break-inside-avoid"><div className="text-[10px] uppercase tracking-wider text-slate-400 print:text-slate-600">{k}</div><div className={cn("font-mono text-sm font-bold text-white print:text-black", t != null && signTone(t))}>{v}</div></div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm print:static print:bg-white print:p-0" role="dialog" aria-modal="true">
      <div className="qs-print-area max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl border border-slate-800/90 bg-[#0b1222] p-5 shadow-2xl shadow-black/40 print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:bg-white print:text-black print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 print:border-slate-300">
          <div>
            <h3 className="text-base font-bold tracking-wide text-white print:text-black">{portfolioName} · Portfolio report</h3>
            <p className="font-mono text-[11px] text-slate-400 print:text-slate-600">{start} → {end} · rebalance {rebalance.toLowerCase()} · benchmark {benchmarkName} · generated {new Date().toISOString().slice(0, 10)}</p>
          </div>
          <div className="flex gap-1 print:hidden">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"><Printer className="h-3.5 w-3.5" /> Print / Save PDF</button>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {!result || !s ? (
          <p className="py-8 text-center text-xs text-slate-500">Run the analysis first; there is nothing to report yet.</p>
        ) : (
          <>
            {synthetic.length > 0 && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300 print:text-black">Warning: price data for {synthetic.join(", ")} is synthetic, not real market data.</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stat("Initial capital", fmtMoney(initialCapital, currency))}
              {stat("Final value", fmtMoney(result.value[result.value.length - 1], currency))}
              {stat("Total return", fmtPct(s.totalReturn), s.totalReturn)}
              {stat(`${benchmarkName} return`, fmtPct(s.benchReturn), s.benchReturn)}
              {stat("CAGR", fmtPct(s.cagr), s.cagr)}
              {stat("Volatility", fmtPct(s.vol, 2, false))}
              {stat("Sharpe", s.vol > 0 ? formatRatio(s.cagr / s.vol) : "—")}
              {stat("Max drawdown", fmtPct(-s.maxDD), -s.maxDD)}
              {stat("Sortino", formatRatio(s.sortino))}
              {stat("Alpha (ann.)", fmtPct(s.alpha), s.alpha)}
              {stat("Beta", s.beta == null ? "—" : s.beta.toFixed(2))}
              {stat("Rebalances", String(result.rebalanceCount))}
            </div>
            <div className="break-inside-avoid">
              <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">Holdings</div>
              <table className="w-full border-collapse text-xs">
                <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 print:border-slate-300 print:text-slate-600"><th className="py-1.5 text-left">Asset</th><th className="py-1.5 text-right">Target</th><th className="py-1.5 text-right">Final</th><th className="py-1.5 text-right">Return</th><th className="py-1.5 text-right">Vol</th><th className="py-1.5 text-right">Beta</th><th className="py-1.5 text-right">Risk share</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50 print:divide-slate-200">
                  {m!.assets.map((a, i) => (
                    <tr key={a.ticker} className="break-inside-avoid">
                      <td className="py-1.5 font-mono font-semibold text-slate-200 print:text-black">{a.ticker}</td>
                      <td className="py-1.5 text-right font-mono text-slate-300 print:text-black">{fmtPct(a.weight, 1, false)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-300 print:text-black">{fmtPct(a.finalWeight, 1, false)}</td>
                      <td className={cn("py-1.5 text-right font-mono", signTone(a.totalReturn))}>{fmtPct(a.totalReturn, 1)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-300 print:text-black">{fmtPct(a.volAnn, 1, false)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-300 print:text-black">{a.beta === null ? "—" : a.beta.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono text-slate-300 print:text-black">{fmtPct(m!.rc[i], 1, false)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 print:text-slate-600">Method: constituent daily closes aligned on common trading days; buy-and-hold between rebalances, reset to target weights on each rebalance; no trading costs or taxes. Sharpe = (CAGR − 0%) ÷ annualised volatility. Past performance does not predict future results.</p>
          </>
        )}
      </div>
    </div>
  );
}
