"use client";

import React, { useMemo } from "react";
import { Gauge } from "lucide-react";
import { BacktestResult } from "@/types";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import { regimeBreakdown, toPts, currencyOf, fmtMoney, benchmarkLabel } from "@/lib/analyticsCalc";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

/** Strategy versus benchmark in each regime, and how the trades entered in that regime did. */
export default function RegimeExtras({ bt }: { bt: BacktestResult }) {
  const pts = useMemo(() => toPts(bt.equity_curve), [bt]);
  const rows = useMemo(() => regimeBreakdown(pts, bt.trades), [pts, bt.trades]);
  const cur = currencyOf(bt);
  return (
    <Card title="Strategy vs benchmark by regime" subtitle={`And the trades entered in each regime · ${benchmarkLabel(bt.benchmark)}`} info="Annualised return of the strategy and of the benchmark on the days in each regime, and the trades whose entry fell in that regime, using only what was visible on the previous close. Trend and volatility regimes overlap, so a trade can count in one of each." icon={Gauge} tone="emerald">
      {!rows ? <EmptyState icon={Gauge} title="Not enough history" hint="At least ~80 trading days are needed." /> : (
        <div className="w-full overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-left text-xs" aria-label="Regime breakdown">
          <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">Regime</th><th className="py-1.5 text-right">Days</th><th className="py-1.5 text-right">Strategy</th><th className="py-1.5 text-right">Benchmark</th><th className="py-1.5 text-right">Excess</th><th className="py-1.5 text-right">Trades entered</th><th className="py-1.5 text-right">Win rate</th><th className="py-1.5 text-right">Net P&amp;L</th></tr></thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">{rows.map((r) => (
            <tr key={r.regime} className="hover:bg-slate-800/30">
              <td className="py-2 font-sans font-medium text-slate-200">{r.regime}</td>
              <td className="py-2 text-right text-slate-400">{fmtInt(r.days)}</td>
              <td className={cn("py-2 text-right font-semibold", signTone(r.strat))}>{r.days ? fmtPct(r.strat, 1) : "—"}</td>
              <td className={cn("py-2 text-right", signTone(r.bench))}>{r.days ? fmtPct(r.bench, 1) : "—"}</td>
              <td className={cn("py-2 text-right font-semibold", signTone(r.strat - r.bench))}>{r.days ? fmtPct(r.strat - r.bench, 1) : "—"}</td>
              <td className="py-2 text-right text-slate-300">{fmtInt(r.trades)}</td>
              <td className="py-2 text-right text-slate-300">{r.winRate === null ? "—" : fmtPct(r.winRate, 0, false)}</td>
              <td className={cn("py-2 text-right font-semibold", signTone(r.pnl))}>{r.trades ? fmtMoney(r.pnl, cur) : "—"}</td>
            </tr>))}</tbody>
        </table></div>
      )}
    </Card>
  );
}
