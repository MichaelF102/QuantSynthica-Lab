"use client";

import React, { useMemo } from "react";
import { useRisk } from "@/lib/risk/context";
import { headline, kpiSeries } from "@/lib/risk/metrics";
import { fmtPct } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { fmtMoney } from "@/lib/analyticsCalc";
import { CONFIDENCE_LABEL, MARKET_DEFAULTS } from "@/lib/risk/presets";
import SparkKpi from "../ui/SparkKpi";
import StressTestCard from "../StressTestCard";
import { CorrelationCard, MetricsComparisonCard, PriceDrawdownCard, VarCard } from "../widgets";

/** Risk Overview: six headline KPIs and the four core charts, all from the same cached return matrix. */
export default function OverviewTab() {
  const { result, settings, source, currency } = useRisk();
  const benchLabel = MARKET_DEFAULTS[source.market].benchmarkLabel;
  const h = useMemo(() => (result ? headline(result, settings.confidence, settings.horizon) : null), [result, settings.confidence, settings.horizon]);
  const s = useMemo(() => (result ? kpiSeries(result, settings.confidence) : null), [result, settings.confidence]);
  if (!result || !h || !s) return null;
  const v = settings.positionValue, c = CONFIDENCE_LABEL(settings.confidence);
  const bench = (x: string) => `Bench ${x}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SparkKpi label={`VaR (${c}, ${settings.horizon} day${settings.horizon > 1 ? "s" : ""})`} value={fmtPct(-h.var * 100)} amount={`-${fmtMoney(h.var * v, currency)}`} tone="text-rose-400" data={s.var} color="#EF4444" sub={bench(fmtPct(-h.bench.var * 100))} />
        <SparkKpi label={`Expected shortfall (${c})`} value={fmtPct(-h.es * 100)} amount={`-${fmtMoney(h.es * v, currency)}`} tone="text-rose-400" data={s.es} color="#EF4444" sub={bench(fmtPct(-h.bench.es * 100))} />
        <SparkKpi label="Annual volatility" value={fmtPct(h.vol, 1, false)} data={s.vol} color="#10B981" sub={bench(fmtPct(h.bench.vol, 1, false))} />
        <SparkKpi label="Max drawdown" value={fmtPct(-h.maxDD, 1)} tone="text-rose-400" data={s.dd} color="#EF4444" sub={bench(fmtPct(-h.bench.maxDD, 1))} />
        <SparkKpi label="Sharpe ratio" value={formatRatio(h.sharpe)} data={s.sharpe} color="#10B981" sub={bench(formatRatio(h.bench.sharpe))} hint="CAGR ÷ annualised volatility (Rf = 0)" />
        <SparkKpi label={`Beta (vs ${benchLabel.split(" (")[0]})`} value={h.beta === null ? "—" : h.beta.toFixed(2)} data={s.beta} color="#8B5CF6" sub="Slope vs benchmark" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6"><PriceDrawdownCard result={result} benchLabel={benchLabel} currency={currency} /></div>
        <div className="xl:col-span-3"><VarCard result={result} conf={settings.confidence} horizon={1} kind="var" /></div>
        <div className="xl:col-span-3"><VarCard result={result} conf={settings.confidence} horizon={1} kind="es" /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CorrelationCard result={result} benchLabel={benchLabel.split(" (")[0]} />
        <MetricsComparisonCard h={h} benchLabel={benchLabel.split(" (")[0]} name={source.label} />
      </div>
      <StressTestCard />
    </div>
  );
}
