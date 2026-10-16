"use client";

import React, { useMemo } from "react";
import { Flame } from "lucide-react";
import { Card, Kpi, signTone } from "@/components/ui/Card";
import { fmtPct, cn } from "@/lib/utils";
import { PortfolioResult } from "@/lib/portfolio/engine";
import { riskStats } from "@/lib/analyticsCalc";

/** Historical VaR/CVaR plus the portfolio's behaviour on the benchmark's five worst days. */
export default function PortfolioTailRiskWidget({ result, benchmarkSymbol }: { result: PortfolioResult; benchmarkSymbol: string }) {
  const risk = useMemo(() => riskStats(result.pts), [result]);
  const worst = useMemo(() => result.benchReturns.map((b, i) => ({ date: result.dates[i + 1], bench: b * 100, port: result.returns[i] * 100 })).sort((a, b) => a.bench - b.bench).slice(0, 5), [result]);
  return (
    <Card title="Tail risk & stress days" subtitle="Historical simulation, daily" info="VaR/CVaR are empirical percentiles of daily portfolio returns. Stress days are the benchmark's five worst sessions and what the portfolio did on those same dates." icon={Flame} tone="rose">
      {risk && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <Kpi label="VaR 95%" value={fmtPct(-risk.var95)} tone="text-rose-400" />
          <Kpi label="VaR 99%" value={fmtPct(-risk.var99)} tone="text-rose-400" />
          <Kpi label="CVaR 95%" value={fmtPct(-risk.cvar95)} tone="text-rose-400" />
        </div>
      )}
      <table className="w-full border-collapse text-[11px]">
        <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1 text-left">{benchmarkSymbol} worst days</th><th className="py-1 text-right">Benchmark</th><th className="py-1 text-right">Portfolio</th></tr></thead>
        <tbody className="divide-y divide-slate-800/50">
          {worst.map((w) => (
            <tr key={w.date} className="transition-colors hover:bg-slate-800/30">
              <td className="py-1.5 font-mono text-slate-300">{w.date}</td>
              <td className={cn("py-1.5 text-right font-mono", signTone(w.bench))}>{fmtPct(w.bench)}</td>
              <td className={cn("py-1.5 text-right font-mono font-semibold", signTone(w.port))}>{fmtPct(w.port)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
