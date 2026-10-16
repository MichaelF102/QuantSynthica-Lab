"use client";

import React, { useMemo } from "react";
import { useRisk } from "@/lib/risk/context";
import { headline, kpiSeries } from "@/lib/risk/metrics";
import { fmtPct } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { fmtMoney } from "@/lib/analyticsCalc";
import { CONFIDENCE_LABEL, MARKET_DEFAULTS } from "@/lib/risk/presets";
import SparkKpi from "../ui/SparkKpi";
import { CorrelationCard, MetricsComparisonCard, MonteCarloCard, PriceDrawdownCard, RiskShareCard, VarCard } from "../widgets";

export default function PortfolioRiskTab() {
  const { result, settings, source, currency } = useRisk();
  const benchLabel = MARKET_DEFAULTS[source.market].benchmarkLabel;
  const short = benchLabel.split(" (")[0];
  const h = useMemo(() => (result ? headline(result, settings.confidence, 1) : null), [result, settings.confidence]);
  const s = useMemo(() => (result ? kpiSeries(result, settings.confidence) : null), [result, settings.confidence]);
  if (!result || !h || !s) return null;
  const v = settings.positionValue, c = CONFIDENCE_LABEL(settings.confidence);
  const bench = (x: string) => `Bench ${x}`;
  const dailySortino = h.sortino;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-7">
        <SparkKpi label={`Portfolio VaR (${c}, 1 day)`} value={fmtPct(-h.var * 100)} amount={`-${fmtMoney(h.var * v, currency)}`} tone="text-rose-400" data={s.var} color="#EF4444" sub={bench(fmtPct(-h.bench.var * 100))} />
        <SparkKpi label={`Expected shortfall (${c})`} value={fmtPct(-h.es * 100)} amount={`-${fmtMoney(h.es * v, currency)}`} tone="text-rose-400" data={s.es} color="#EF4444" sub={bench(fmtPct(-h.bench.es * 100))} />
        <SparkKpi label="Annual volatility" value={fmtPct(h.vol, 1, false)} data={s.vol} color="#10B981" sub={bench(fmtPct(h.bench.vol, 1, false))} />
        <SparkKpi label="Max drawdown" value={fmtPct(-h.maxDD, 1)} tone="text-rose-400" data={s.dd} color="#EF4444" sub={bench(fmtPct(-h.bench.maxDD, 1))} />
        <SparkKpi label="Sharpe ratio" value={formatRatio(h.sharpe)} data={s.sharpe} color="#10B981" sub={bench(formatRatio(h.bench.sharpe))} />
        <SparkKpi label="Sortino ratio" value={dailySortino ? formatRatio(dailySortino) : "—"} color="#10B981" sub="Downside-risk adjusted" />
        <SparkKpi label="Calmar ratio" value={formatRatio(h.calmar)} sub={bench(formatRatio(h.bench.calmar))} hint="CAGR ÷ |max drawdown|" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6"><PriceDrawdownCard result={result} benchLabel={short} currency={currency} withBench title="Portfolio drawdown analysis" /></div>
        <div className="xl:col-span-3"><VarCard result={result} conf={settings.confidence} horizon={1} kind="var" /></div>
        <div className="xl:col-span-3"><VarCard result={result} conf={settings.confidence} horizon={1} kind="es" /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5"><CorrelationCard result={result} benchLabel={short} /></div>
        <div className="lg:col-span-7"><MetricsComparisonCard h={h} benchLabel={short} name={source.label} /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8"><MonteCarloCard result={result} currency={currency} start={v} /></div>
        <div className="lg:col-span-4"><RiskShareCard result={result} /></div>
      </div>
    </div>
  );
}
