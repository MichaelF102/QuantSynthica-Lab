"use client";

import React from "react";
import { Kpi, CardSkeleton, signTone } from "@/components/ui/Card";
import { fmtPct } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { PortfolioResult } from "@/lib/portfolio/engine";

interface Props { result: PortfolioResult | null; benchmarkName: string; loading?: boolean; rf?: number }

/** Nine KPIs computed from the simulated portfolio path. Sharpe/Sortino use the CAGR-based form with `rf` (%). */
export default function PortfolioKpiStrip({ result, benchmarkName, loading, rf = 0 }: Props) {
  const s = result?.stats ?? null;
  if (loading && !s) {
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-9">{Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} rows={1} className="h-24" />)}</div>;
  }
  const rel = (a?: number | null, b?: number | null) => (typeof a === "number" && typeof b === "number" ? a - b : null);
  const vs = (v: number | null, digits = 1) => <span className={signTone(v)}>{fmtPct(v, digits)} vs {benchmarkName}</span>;
  const sharpe = s && s.vol > 0 ? (s.cagr - rf) / s.vol : null;
  const benchSharpe = s && s.benchVol > 0 ? (s.benchCagr - rf) / s.benchVol : null;
  const down = s && s.sortino !== 0 ? s : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-9">
      <Kpi label="Total return" value={fmtPct(s?.totalReturn)} tone={signTone(s?.totalReturn)} sub={vs(rel(s?.totalReturn, s?.benchReturn))} />
      <Kpi label="Annualised return" value={fmtPct(s?.cagr)} tone={signTone(s?.cagr)} sub={vs(rel(s?.cagr, s?.benchCagr))} />
      <Kpi label="Volatility (ann.)" value={fmtPct(s?.vol, 2, false)} sub={`${benchmarkName} ${fmtPct(s?.benchVol, 2, false)}`} />
      <Kpi label="Sharpe ratio" value={sharpe === null ? "—" : formatRatio(sharpe)} sub={`${benchmarkName} ${benchSharpe === null ? "—" : formatRatio(benchSharpe)}`} title={`(CAGR − ${rf}%) ÷ annualised volatility`} />
      <Kpi label="Sortino ratio" value={down ? formatRatio(down.sortino) : "—"} sub="Downside-risk adjusted" />
      <Kpi label="Max drawdown" value={s ? fmtPct(-s.maxDD) : "—"} tone="text-rose-400" sub={`${benchmarkName} ${s ? fmtPct(-s.benchMaxDD) : "—"}`} />
      <Kpi label="Calmar ratio" value={s ? formatRatio(s.calmar) : "—"} sub="CAGR ÷ |max DD|" />
      <Kpi label="Alpha (ann.)" value={fmtPct(s?.alpha)} tone={signTone(s?.alpha)} sub={`vs ${benchmarkName}`} />
      <Kpi label="Beta" value={s?.beta == null ? "—" : s.beta.toFixed(2)} sub={`vs ${benchmarkName}`} />
    </div>
  );
}
