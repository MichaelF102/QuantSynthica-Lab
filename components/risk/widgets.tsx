"use client";

import React, { useMemo, useState } from "react";
import { LineChart as LineIcon, ShieldAlert, Sigma, Network, BarChart3, Dices, PieChart } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LineChart, Legend, Cell,
} from "recharts";
import { Card, EmptyState } from "@/components/ui/Card";
import { Segmented } from "./ui/controls";
import { HeatmapMatrix, ReturnHistogram } from "./ui/charts";
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";
import { CurrencyCode, fmtMoney, windowPts } from "@/lib/analyticsCalc";
import { Headline } from "@/lib/risk/metrics";
import { corrWithBench } from "@/lib/risk/correlation";
import { VarMethod, varEs, simulatePaths } from "@/lib/risk/var";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { CONFIDENCE_LABEL } from "@/lib/risk/presets";

type R = PortfolioResult;
const RANGES = ["1M", "3M", "6M", "1Y", "ALL"] as const;

function rangeStart(r: (typeof RANGES)[number], last: string) {
  if (r === "ALL") return null;
  const d = new Date(last + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[r]);
  return d.toISOString().slice(0, 10);
}

export function PriceDrawdownCard({ result, benchLabel, currency, withBench = false, title = "Price & drawdown analysis" }: { result: R; benchLabel: string; currency: CurrencyCode; withBench?: boolean; title?: string }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>("ALL");
  const pts = useMemo(() => windowPts(result.pts, rangeStart(range, result.dates[result.dates.length - 1]), null, "Daily"), [result, range]);
  const base = pts[0]?.value ?? 1, bb = pts[0]?.bench ?? 1;
  const data = pts.map((p) => ({ date: p.date, Portfolio: p.value, Benchmark: (p.bench / bb) * base, Drawdown: -p.dd }));
  return (
    <Card title={title} subtitle="Portfolio value (left) and drawdown (right)" info="Value of the holdings from real prices, with the percentage below the running peak shown as a red area. The benchmark is rebased to the same start." icon={LineIcon} tone="blue"
      action={<Segmented value={range} options={RANGES} onChange={setRange} size="sm" />}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} />
            <YAxis yAxisId="v" {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => fmtMoney(v, currency, true)} />
            <YAxis yAxisId="d" orientation="right" {...AXIS_PROPS} domain={[(min: number) => Math.min(min, -5) * 1.1, 0]} tickFormatter={(v) => `${Math.round(v)}%`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [n === "Drawdown" ? fmtPct(Number(v)) : fmtMoney(Number(v), currency), n === "Benchmark" ? benchLabel : n]} />
            <Area yAxisId="d" type="monotone" dataKey="Drawdown" stroke="#DC2626" strokeWidth={1.5} fill="#DC2626" fillOpacity={0.25} isAnimationActive={false} />
            {withBench && <Line yAxisId="v" type="monotone" dataKey="Benchmark" stroke="#7C3AED" strokeWidth={1.5} dot={false} isAnimationActive={false} />}
            <Line yAxisId="v" type="monotone" dataKey="Portfolio" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const VAR_TABS = ["Historical", "Parametric", "Monte Carlo"] as const;

export function VarCard({ result, conf, horizon = 1, kind }: { result: R; conf: number; horizon?: number; kind: "var" | "es" }) {
  const [method, setMethod] = useState<(typeof VAR_TABS)[number]>("Historical");
  const e = useMemo(() => varEs(result.returns, conf, method as VarMethod, horizon), [result, conf, method, horizon]);
  const val = kind === "var" ? e.var : e.es;
  const label = kind === "var" ? `VaR (${CONFIDENCE_LABEL(conf)})` : `ES (${CONFIDENCE_LABEL(conf)})`;
  return (
    <Card title={kind === "var" ? "Value at Risk (VaR)" : "Expected Shortfall"} subtitle={`${method}, ${horizon}-day horizon · daily return distribution`}
      info={kind === "var" ? "The loss not expected to be exceeded at the chosen confidence level. The red marker sits at the VaR on the daily-return histogram; multi-day horizons scale by √t (Monte Carlo compounds simulated days)." : "Expected Shortfall (CVaR): the average loss on the days worse than VaR. Always at least as large as VaR."}
      icon={kind === "var" ? ShieldAlert : Sigma} tone="rose" action={<Segmented value={method} options={VAR_TABS} onChange={setMethod} size="sm" />}>
      <ReturnHistogram returns={result.returns} color={kind === "var" ? "#2563EB" : "#7C3AED"} marks={Number.isFinite(val) ? [{ x: -val * 100, label, color: "#EF4444" }] : []} />
      <p className="mt-1 text-center font-mono text-[11px] text-slate-400">Daily returns (%)</p>
    </Card>
  );
}

export function CorrelationCard({ result, benchLabel }: { result: R; benchLabel: string }) {
  const { labels, matrix } = useMemo(() => corrWithBench(result.tickers, result.assetReturns, result.benchReturns, benchLabel), [result, benchLabel]);
  return (
    <Card title="Correlation matrix" subtitle="Pearson, daily returns" info="Correlation of daily returns over the selected window, including the benchmark. Values near 1 mean assets move together; lower values diversify." icon={Network} tone="purple">
      {labels.length < 3 ? <EmptyState icon={Network} title="Single holding" hint="Add holdings or use a basket to see correlations." /> : <HeatmapMatrix labels={labels} matrix={matrix} />}
    </Card>
  );
}

export function MetricsComparisonCard({ h, benchLabel, name }: { h: Headline; benchLabel: string; name: string }) {
  const data = [
    { m: "Volatility (ann.)", a: h.vol, b: h.bench.vol }, { m: "VaR", a: -h.var * 100, b: -h.bench.var * 100 }, { m: "Exp. shortfall", a: -h.es * 100, b: -h.bench.es * 100 },
    { m: "Max drawdown", a: -h.maxDD, b: -h.bench.maxDD }, { m: "Sharpe", a: h.sharpe, b: h.bench.sharpe },
  ].map((d) => ({ ...d, a: Number(d.a.toFixed(2)), b: Number(d.b.toFixed(2)) }));
  return (
    <Card title="Risk metrics comparison" subtitle={`${name} vs ${benchLabel}`} info="Volatility, VaR, shortfall and drawdown are in percent; Sharpe is a plain ratio (CAGR ÷ volatility). Negative values are losses." icon={BarChart3} tone="amber">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="m" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="a" name={name} fill="#2563EB" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="b" name={benchLabel} fill="#7C3AED" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const MC_DAYS = [{ label: "3 Months", d: 63 }, { label: "6 Months", d: 126 }, { label: "1 Year", d: 252 }, { label: "2 Years", d: 504 }];

export function MonteCarloCard({ result, currency, start }: { result: R; currency: CurrencyCode; start: number }) {
  const [sims, setSims] = useState(5000);
  const [days, setDays] = useState(252);
  const mc = useMemo(() => simulatePaths(result.returns, days, sims, start), [result, days, sims, start]);
  const data = useMemo(() => {
    if (!mc) return [];
    return mc.checkpoints.map((step, i) => {
      const row: Record<string, number> = { step };
      mc.samplePaths.forEach((p, k) => (row[`s${k}`] = p[i]));
      if (i === 0) { row.p5 = start; row.p50 = start; row.p95 = start; } else { const b = mc.bands[i - 1]; row.p5 = b.p5; row.p50 = b.p50; row.p95 = b.p95; }
      return row;
    });
  }, [mc, start]);
  const sel = "rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-blue-500";
  return (
    <Card title="Monte Carlo simulation" subtitle="Bootstrap of realised daily returns" info="Daily returns from the selected window are resampled with replacement and compounded from the portfolio value. It shows sensitivity to return ordering and is not a forecast." icon={Dices} tone="purple"
      action={<div className="flex items-center gap-2">
        <select aria-label="Simulations" value={sims} onChange={(e) => setSims(Number(e.target.value))} className={sel}>{[1000, 5000, 10000].map((n) => <option key={n} value={n}>{fmtInt(n)} sims</option>)}</select>
        <select aria-label="Horizon" value={days} onChange={(e) => setDays(Number(e.target.value))} className={sel}>{MC_DAYS.map((o) => <option key={o.d} value={o.d}>{o.label}</option>)}</select>
      </div>}>
      {!mc ? <EmptyState icon={Dices} title="Not enough history" hint="About 20 daily returns are needed." /> : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="h-60 lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="step" {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(v / 21)}m`} />
                <YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => fmtMoney(v, currency, true)} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [fmtMoney(Number(v), currency), String(n)]} labelFormatter={(l) => `Day ${l}`} />
                {mc.samplePaths.map((_, k) => <Line key={k} dataKey={`s${k}`} stroke="#3B82F6" strokeOpacity={0.18} strokeWidth={1} dot={false} isAnimationActive={false} legendType="none" tooltipType="none" />)}
                <Line dataKey="p95" name="95th" stroke="#16A34A" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="p50" name="Median" stroke="#E2E8F0" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                <Line dataKey="p5" name="5th" stroke="#DC2626" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-xs">
            {([["Median value", mc.median, "text-white"], ["5th percentile", mc.p5, "text-rose-400"], ["95th percentile", mc.p95, "text-emerald-400"]] as [string, number, string][]).map(([k, v, t]) => (
              <div key={k} className="rounded-lg border border-slate-800 bg-[#080d1a]/60 p-2.5"><div className="text-[10px] uppercase tracking-wider text-slate-400">{k}</div><div className={cn("font-mono text-base font-bold", t)}>{fmtMoney(v, currency)}</div><div className="font-mono text-[10px] text-slate-500">{fmtPct((v / start - 1) * 100)}</div></div>
            ))}
            <div className="font-mono text-[11px] text-slate-400">P(loss) <span className="font-semibold text-white">{fmtPct(mc.probLoss * 100, 1, false)}</span></div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function RiskShareCard({ result }: { result: R }) {
  const m = useMemo(() => riskModel(result), [result]);
  const data = m.assets.map((a, i) => ({ name: a.ticker.replace(".NS", ""), share: Number(m.rc[i].toFixed(2)) })).sort((a, b) => b.share - a.share);
  return (
    <Card title="Risk decomposition" subtitle="Contribution to portfolio variance" info="Euler decomposition: w_i × (Σw)_i ÷ σ²_p from the covariance of daily returns; shares sum to 100%." icon={PieChart} tone="rose">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
            <XAxis type="number" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" {...AXIS_PROPS} width={80} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v), 1, false), "Risk share"]} />
            <Bar dataKey="share" radius={[0, 3, 3, 0]} isAnimationActive={false}>{data.map((d, i) => <Cell key={d.name} fill={seriesColor(i)} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
