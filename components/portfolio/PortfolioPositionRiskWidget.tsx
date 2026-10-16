"use client";

import React from "react";
import { Crosshair } from "lucide-react";
import { Card, signTone } from "@/components/ui/Card";
import { fmtPct, cn } from "@/lib/utils";
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";

export default function PortfolioPositionRiskWidget({ result }: { result: PortfolioResult }) {
  const m = riskModel(result);
  return (
    <Card title="Position risk" subtitle="Per-holding statistics over the window" info="Volatility annualised on 252 days; beta vs the benchmark; max drawdown from the holding's own price path; risk share from the covariance model." icon={Crosshair} tone="amber">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
              <th className="py-1 text-left">Asset</th><th className="py-1 text-right">Return</th><th className="py-1 text-right">Vol</th><th className="py-1 text-right">Beta</th><th className="py-1 text-right">Max DD</th><th className="py-1 text-right">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {m.assets.map((a, i) => (
              <tr key={a.ticker} className="transition-colors hover:bg-slate-800/30">
                <td className="py-1.5 font-mono font-semibold text-slate-200">{a.ticker}</td>
                <td className={cn("py-1.5 text-right font-mono", signTone(a.totalReturn))}>{fmtPct(a.totalReturn, 1)}</td>
                <td className="py-1.5 text-right font-mono text-slate-300">{fmtPct(a.volAnn, 1, false)}</td>
                <td className="py-1.5 text-right font-mono text-slate-300">{a.beta === null ? "—" : a.beta.toFixed(2)}</td>
                <td className="py-1.5 text-right font-mono text-rose-400">{fmtPct(-a.maxDD, 1)}</td>
                <td className="py-1.5 text-right font-mono text-white">{fmtPct(m.rc[i], 1, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
