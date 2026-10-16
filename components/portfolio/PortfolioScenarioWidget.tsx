"use client";

import React from "react";
import { Layers, Info } from "lucide-react";
import { Card, signTone } from "@/components/ui/Card";
import { fmtPct, cn } from "@/lib/utils";
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";
import { CurrencyCode, fmtMoney } from "@/lib/analyticsCalc";

const SHOCKS = [-30, -20, -10, -5, 5, 10, 20];

/** Beta-implied one-factor shocks: portfolio impact ≈ β × benchmark move. A rough linear guide, not a forecast. */
export default function PortfolioScenarioWidget({ result, benchmarkSymbol, currency }: { result: PortfolioResult; benchmarkSymbol: string; currency: CurrencyCode }) {
  const beta = riskModel(result).portBeta;
  const value = result.value[result.value.length - 1];
  return (
    <Card title="Scenario analysis" subtitle={beta === null ? "Beta unavailable" : `Beta-implied · β = ${beta.toFixed(2)} vs ${benchmarkSymbol}`} info="Estimated portfolio move for a given benchmark move: β × shock, using the regression beta over the analysis window. Linear and symmetric; real crashes also change correlations." icon={Layers} tone="amber">
      {beta === null ? (
        <p className="py-6 text-center text-xs text-slate-500">Benchmark has no variance in this window.</p>
      ) : (
        <>
          <table className="w-full border-collapse text-xs">
            <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">{benchmarkSymbol} move</th><th className="py-1.5 text-right">Portfolio (est.)</th><th className="py-1.5 text-right">P&amp;L (est.)</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50">
              {SHOCKS.map((s) => {
                const impact = beta * s;
                return (
                  <tr key={s} className="transition-colors hover:bg-slate-800/30">
                    <td className={cn("py-1.5 font-mono", signTone(s))}>{fmtPct(s, 0)}</td>
                    <td className={cn("py-1.5 text-right font-mono font-semibold", signTone(impact))}>{fmtPct(impact)}</td>
                    <td className={cn("py-1.5 text-right font-mono", signTone(impact))}>{(impact > 0 ? "+" : "") + fmtMoney((value * impact) / 100, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-500"><Info className="mt-0.5 h-3 w-3 shrink-0" /> Applied to the current portfolio value of {fmtMoney(value, currency)}.</p>
        </>
      )}
    </Card>
  );
}
