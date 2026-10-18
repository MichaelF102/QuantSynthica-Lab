"use client";

import React, { useMemo } from "react";
import { Layers, Timer, Percent } from "lucide-react";
import { BacktestResult } from "@/types";
import { Card, Kpi, signTone } from "@/components/ui/Card";
import { Bucket, bySide, byHolding, tradeConcentration, currencyOf, fmtMoney } from "@/lib/analyticsCalc";
import { fmtPct, cn } from "@/lib/utils";

function BucketTable({ rows, cur, first }: { rows: Bucket[]; cur: ReturnType<typeof currencyOf>; first: string }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.pnl)));
  return (
    <table className="w-full border-collapse text-left text-xs">
      <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">{first}</th><th className="py-1.5 text-right">Trades</th><th className="py-1.5 text-right">Win rate</th><th className="py-1.5 text-right">Avg return</th><th className="py-1.5 text-right">Net P&amp;L</th></tr></thead>
      <tbody className="divide-y divide-slate-800/50 font-mono">{rows.map((r) => (
        <tr key={r.label} className="hover:bg-slate-800/30">
          <td className="py-2 font-sans text-slate-200"><div>{r.label}</div><div className="mt-1 h-1 rounded bg-slate-800"><div className={cn("h-1 rounded", r.pnl >= 0 ? "bg-emerald-500/70" : "bg-rose-500/70")} style={{ width: `${(Math.abs(r.pnl) / max) * 100}%` }} /></div></td>
          <td className="py-2 text-right text-slate-300">{r.n}</td><td className="py-2 text-right text-slate-300">{fmtPct(r.winRate, 0, false)}</td>
          <td className={cn("py-2 text-right", signTone(r.avgReturn))}>{fmtPct(r.avgReturn)}</td><td className={cn("py-2 text-right font-semibold", signTone(r.pnl))}>{fmtMoney(r.pnl, cur)}</td>
        </tr>))}</tbody>
    </table>
  );
}

/** Where this run's profit came from: how concentrated it was, which side, and how long positions were held. */
export default function AttributionExtras({ bt }: { bt: BacktestResult }) {
  const cur = currencyOf(bt);
  const conc = useMemo(() => tradeConcentration(bt.trades), [bt.trades]);
  const sides = useMemo(() => bySide(bt.trades), [bt.trades]);
  const holds = useMemo(() => byHolding(bt.trades), [bt.trades]);
  if (!bt.trades.length) return null;
  return (
    <div className="space-y-4">
      {conc && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="concentration">
          <Kpi label="Net P&L" value={fmtMoney(conc.total, cur)} tone={signTone(conc.total)} sub={`${bt.trades.length} trades`} />
          <Kpi label={`Best ${conc.topN} trade${conc.topN > 1 ? "s" : ""} (top 10%)`} value={conc.topShare === null ? "—" : fmtPct(conc.topShare, 0, false)} tone={conc.topShare !== null && conc.topShare > 100 ? "text-amber-300" : "text-white"} sub="of net P&L" />
          <Kpi label="Without the best trade" value={fmtMoney(conc.withoutBest, cur)} tone={signTone(conc.withoutBest)} sub={`Best was ${fmtMoney(conc.best, cur)}`} />
          <Kpi label="Worst trade" value={fmtMoney(conc.worst, cur)} tone="text-rose-400" />
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="By side" subtitle="Long versus short" info="Whether the long or the short side earned the money." icon={Layers} tone="blue"><BucketTable rows={sides} cur={cur} first="Side" /></Card>
        <Card title="By holding period" subtitle="Trades grouped by bars held" info="Shows whether quick trades or long holds carry the result. A tilt toward very short trades means costs matter most." icon={Timer} tone="purple"><BucketTable rows={holds} cur={cur} first="Held" /></Card>
      </div>
    </div>
  );
}
