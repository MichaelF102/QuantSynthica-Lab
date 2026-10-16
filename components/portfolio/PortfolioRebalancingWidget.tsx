"use client";

import React, { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Card, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { PortfolioResult, Rebalance, simulate } from "@/lib/portfolio/engine";
import { Pt, seriesStats } from "@/lib/analyticsCalc";

const MODES: Rebalance[] = ["Weekly", "Monthly", "Quarterly", "Never"];

/** Re-runs the same price data under each rebalance schedule so the trade-off is visible, not assumed. */
export default function PortfolioRebalancingWidget({ result, current, onSelect }: { result: PortfolioResult; current: Rebalance; onSelect: (r: Rebalance) => void }) {
  const rows = useMemo(() => {
    const holdings = result.tickers.map((t) => ({ ticker: t, weight: result.targetWeights[t] * 100 }));
    const cap = result.value[0];
    return MODES.map((mode) => {
      const sim = simulate(result.dates, result.prices, result.benchPrices, holdings, cap, mode);
      let pk = -Infinity;
      const pts: Pt[] = result.dates.map((date, i) => { pk = Math.max(pk, sim.value[i]); return { date, value: sim.value[i], bench: sim.bench[i], dd: ((pk - sim.value[i]) / pk) * 100 }; });
      const s = seriesStats(pts);
      return { mode, ret: s?.totalReturn ?? null, vol: s?.vol ?? null, sharpe: s && s.vol > 0 ? s.cagr / s.vol : null, dd: s?.maxDD ?? null, n: sim.rebalanceCount, turnover: sim.turnover * 100 };
    });
  }, [result]);

  return (
    <Card title="Rebalancing" subtitle="Same prices, different schedules" info="Each row re-simulates the basket with that rebalance frequency (no trading costs). Click a row to use it for the next analysis run." icon={RefreshCw} tone="blue">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
            <th className="py-1 text-left">Schedule</th><th className="py-1 text-right">Return</th><th className="py-1 text-right">Vol</th><th className="py-1 text-right">Sharpe</th><th className="py-1 text-right">Trades</th><th className="py-1 text-right">Turnover</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {rows.map((r) => (
            <tr key={r.mode} onClick={() => onSelect(r.mode)} className={cn("cursor-pointer transition-colors hover:bg-slate-800/30", current === r.mode && "bg-blue-500/10")}>
              <td className={cn("py-1.5 font-medium", current === r.mode ? "text-blue-400" : "text-slate-200")}>{r.mode}{result.rebalance === r.mode && <span className="ml-1 font-mono text-[9px] text-slate-500">(run)</span>}</td>
              <td className={cn("py-1.5 text-right font-mono", signTone(r.ret))}>{fmtPct(r.ret)}</td>
              <td className="py-1.5 text-right font-mono text-slate-300">{fmtPct(r.vol, 1, false)}</td>
              <td className="py-1.5 text-right font-mono text-white">{r.sharpe === null ? "—" : formatRatio(r.sharpe)}</td>
              <td className="py-1.5 text-right font-mono text-slate-300">{fmtInt(r.n)}</td>
              <td className="py-1.5 text-right font-mono text-slate-400">{fmtPct(r.turnover, 0, false)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
