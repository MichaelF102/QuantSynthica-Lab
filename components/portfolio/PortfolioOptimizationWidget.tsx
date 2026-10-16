"use client";

import React, { useMemo, useState } from "react";
import { Settings2, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { fmtPct, cn } from "@/lib/utils";
import { PortfolioResult, OptMethod, optimise, riskModel, portfolioVol } from "@/lib/portfolio/engine";

export type OptimizationMethod = OptMethod;
const METHODS: OptMethod[] = ["Equal Weight", "Inv Volatility", "Risk Parity", "Min Variance", "Max Sharpe"];

interface Props {
  result: PortfolioResult;
  onApplyOptimization: (method: OptMethod, weights: Record<string, number>) => void;
}

/** Long-only, fully-invested weights solved on the sample covariance / mean of this window (in-sample). */
export default function PortfolioOptimizationWidget({ result, onApplyOptimization }: Props) {
  const [method, setMethod] = useState<OptMethod>("Risk Parity");
  const [applied, setApplied] = useState(false);
  const m = useMemo(() => riskModel(result), [result]);
  const weights = useMemo(() => optimise(method, m.cov, m.mu), [method, m]);
  const vol = portfolioVol(m.cov, weights) * Math.sqrt(252) * 100;
  const ret = weights.reduce((s, w, i) => s + w * m.mu[i], 0) * 252 * 100;

  const apply = () => {
    onApplyOptimization(method, Object.fromEntries(result.tickers.map((t, i) => [t, Number((weights[i] * 100).toFixed(2))])));
    setApplied(true);
    window.setTimeout(() => setApplied(false), 2000);
  };

  return (
    <Card title="Optimisation" subtitle="In-sample, long-only" info="Solved on this window's covariance and mean returns, so results are in-sample and will not persist out of sample. Max Sharpe maximises mean ÷ volatility (Rf = 0). Applying updates the basket weights and re-runs the analysis." icon={Settings2} tone="emerald">
      <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-[#0b1222] p-0.5">
        {METHODS.map((x) => <button key={x} type="button" onClick={() => setMethod(x)} className={cn("rounded px-2 py-1 text-[11px] transition-colors", method === x ? "bg-blue-600 font-semibold text-white" : "font-medium text-slate-400 hover:text-white")}>{x}</button>)}
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1 text-left">Asset</th><th className="py-1 text-right">Current</th><th className="py-1 text-right">{method}</th></tr></thead>
        <tbody className="divide-y divide-slate-800/50">
          {result.tickers.map((t, i) => (
            <tr key={t}><td className="py-1.5 font-mono font-semibold text-slate-200">{t}</td><td className="py-1.5 text-right font-mono text-slate-400">{fmtPct(m.w[i] * 100, 1, false)}</td><td className="py-1.5 text-right font-mono text-white">{fmtPct(weights[i] * 100, 1, false)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-400">Exp. vol {fmtPct(vol, 1, false)} · hist. ret {fmtPct(ret, 1)}</span>
        <button type="button" onClick={apply} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500">
          {applied ? <><Check className="h-3.5 w-3.5" /> Applied</> : "Apply weights"}
        </button>
      </div>
    </Card>
  );
}
