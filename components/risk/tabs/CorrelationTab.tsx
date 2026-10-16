"use client";

import React, { useMemo, useState } from "react";
import { Network, Grid3x3, LineChart as LineIcon, BarChart3, ListOrdered, Plus, X, Loader2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { useRisk } from "@/lib/risk/context";
import { Card, EmptyState } from "@/components/ui/Card";
import SparkKpi from "../ui/SparkKpi";
import { Segmented } from "../ui/controls";
import { HeatmapMatrix } from "../ui/charts";
import { clusterOrder, corrSummary, forceLayout, matrixOf, pairs, pearson, reorder, rollingCorr } from "@/lib/risk/correlation";
import { histogram } from "@/lib/risk/var";
import { EXTRA_SUGGESTIONS, labelFor, useUniverse } from "@/lib/risk/universe";
import { MARKET_DEFAULTS } from "@/lib/risk/presets";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";

const GROUP_COLOR = { holding: "#3B82F6", index: "#A855F7", extra: "#F59E0B" } as const;

export default function CorrelationTab() {
  const { settings, source, update } = useRisk();
  const [order, setOrder] = useState<"Clustered" | "As entered">("Clustered");
  const [threshold, setThreshold] = useState(0.5);
  const [topTab, setTopTab] = useState<"Highest Positive" | "Highest Negative" | "Most Diversifying">("Highest Positive");
  const [win, setWin] = useState(60);
  const [base, setBase] = useState("");
  const [custom, setCustom] = useState("");
  const market = source.market;
  const benchT = settings.benchmark, benchL = MARKET_DEFAULTS[market].benchmarkLabel.split(" (")[0];

  const holdings = source.holdings.map((h) => h.ticker);
  const extras = settings.extraAssets.filter((e) => !holdings.includes(e) && e !== benchT);
  const tickers = useMemo(() => [...holdings, benchT, ...extras], [holdings.join(","), benchT, extras.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels = useMemo(() => [...holdings.map((t) => labelFor(t)), benchL, ...extras.map(labelFor)], [tickers]); // eslint-disable-line react-hooks/exhaustive-deps
  const group = (i: number) => (i < holdings.length ? "holding" : i === holdings.length ? "index" : "extra") as keyof typeof GROUP_COLOR;
  const { data, status, error } = useUniverse(tickers, labels, settings.start, settings.end);

  const full = useMemo(() => (data ? matrixOf(data.rows, settings.corrType) : null), [data, settings.corrType]);
  const summary = useMemo(() => (data && full ? corrSummary(data.labels, full) : null), [data, full]);
  const shown = useMemo(() => {
    if (!data || !full) return null;
    return order === "Clustered" ? reorder(data.labels, full, clusterOrder(full)) : { labels: data.labels, matrix: full };
  }, [data, full, order]);
  const net = useMemo(() => (data && full ? forceLayout(data.labels, full, threshold) : null), [data, full, threshold]);
  const dist = useMemo(() => (summary ? histogram(summary.pairs.map((p) => p.rho), 20, -1, 1) : []), [summary]);
  const baseIdx = Math.max(0, data ? data.labels.indexOf(base) : 0);
  const roll = useMemo(() => {
    if (!data) return [];
    const others = data.labels.map((_, i) => i).filter((i) => i !== baseIdx).slice(0, 4);
    const series = others.map((o) => rollingCorr(data.rows[baseIdx], data.rows[o], data.dates, win));
    return (series[0] ?? []).map((p, k) => { const row: Record<string, number | string> = { date: p.date }; others.forEach((o, s) => (row[`${data.labels[baseIdx]} – ${data.labels[o]}`] = series[s][k]?.rho)); return row; });
  }, [data, baseIdx, win]);
  const top = useMemo(() => {
    if (!summary) return [];
    const p = summary.pairs;
    const list = topTab === "Highest Positive" ? [...p].sort((a, b) => b.rho - a.rho) : topTab === "Highest Negative" ? [...p].sort((a, b) => a.rho - b.rho) : [...p].sort((a, b) => Math.abs(a.rho) - Math.abs(b.rho));
    return list.slice(0, 6);
  }, [summary, topTab]);

  const addExtra = (t: string) => { const v = t.trim().toUpperCase(); if (v && !tickers.includes(v)) update({ extraAssets: [...settings.extraAssets, v] }); };
  const kpiPair = (p?: { a: string; b: string }) => (p ? `${p.a} – ${p.b}` : undefined);

  return (
    <div className="space-y-4">
      <Card title="Correlation universe" subtitle="Holdings and benchmark are fixed; add any extra asset you want to test" info="Extra assets (gold, USD/INR, Brent, other indices or any ticker) are fetched and aligned on the trading days they share with the rest of the universe, so adding an asset with a different calendar can shorten the sample."
        icon={Plus} tone="blue">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {holdings.map((t) => <span key={t} className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 font-mono text-blue-300">{labelFor(t)}</span>)}
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 font-mono text-purple-300">{benchL}</span>
          {extras.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-amber-300">{labelFor(t)}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => update({ extraAssets: settings.extraAssets.filter((x) => x !== t) })} className="rounded-full hover:text-white"><X className="h-3 w-3" /></button></span>
          ))}
          <form className="ml-auto flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); addExtra(custom); setCustom(""); }}>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add ticker…" aria-label="Add ticker" className="w-32 rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-blue-500" />
            <button type="submit" className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">Add</button>
          </form>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-2 text-[10px] text-slate-400">
          Quick add:
          {EXTRA_SUGGESTIONS[market].filter((s) => !tickers.includes(s.ticker)).map((s) => <button key={s.ticker} type="button" onClick={() => addExtra(s.ticker)} className="rounded border border-slate-800 bg-[#080d1a] px-1.5 py-0.5 font-mono text-slate-300 hover:text-white">+ {s.label}</button>)}
        </div>
      </Card>

      {status === "error" && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}
      {status === "loading" && !data && <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading prices…</div>}
      {data && data.synthetic.length > 0 && <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"><span className="mr-2 font-mono font-bold uppercase">Synthetic data</span>{data.synthetic.join(", ")} could not be fetched; a generated series was used.</div>}

      {data && full && summary && shown && net && (
        <div className={cn("space-y-4 transition-opacity", status === "loading" && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <SparkKpi label="Average correlation" value={summary.avg.toFixed(2)} sub={`${settings.corrType} · ${data.dates.length - 1} days`} tone={summary.avg > 0.6 ? "text-rose-400" : "text-white"} />
            <SparkKpi label="Highest correlation" value={summary.highest.rho.toFixed(2)} sub={kpiPair(summary.highest)} tone="text-rose-400" />
            <SparkKpi label="Lowest correlation" value={summary.lowest.rho.toFixed(2)} sub={kpiPair(summary.lowest)} tone="text-emerald-400" />
            <SparkKpi label="Positive correlations" value={fmtPct(summary.positivePct, 0, false)} sub={<div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-blue-500" style={{ width: `${summary.positivePct}%` }} /></div>} />
            <SparkKpi label="Negative correlations" value={fmtPct(summary.negativePct, 0, false)} sub={<div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-rose-500" style={{ width: `${summary.negativePct}%` }} /></div>} />
            <SparkKpi label="Diversification score" value={summary.diversification.toFixed(2)} tone={summary.diversification > 0.5 ? "text-emerald-400" : "text-amber-400"} sub="1 − mean |ρ|" hint="1 means an uncorrelated universe; 0 means everything moves together" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <Card title="Correlation matrix" subtitle={`${settings.corrType}, daily returns`} info="Pairwise correlation of daily returns over the window. Clustered order groups similar assets next to each other using average-linkage hierarchical clustering on distance 1 − ρ." icon={Grid3x3} tone="purple"
                action={<Segmented value={order} options={["Clustered", "As entered"] as const} onChange={setOrder} size="sm" />}>
                <HeatmapMatrix labels={shown.labels} matrix={shown.matrix} rotate={shown.labels.length > 8} />
              </Card>
            </div>
            <div className="xl:col-span-5">
              <Card title="Correlation network" subtitle={`Links where |ρ| ≥ ${threshold}`} info="Assets are nodes; lines join pairs whose absolute correlation exceeds the threshold. Solid = positive, dashed = negative; closer nodes are more correlated." icon={Network} tone="blue"
                action={<Segmented value={String(threshold)} options={["0.3", "0.5", "0.7"] as const} onChange={(v) => setThreshold(Number(v))} size="sm" />}>
                <svg viewBox="0 0 100 100" className="h-80 w-full" role="img" aria-label="Correlation network">
                  {net.edges.map((e) => (
                    <line key={`${e.i}-${e.j}`} x1={net.nodes[e.i].x} y1={net.nodes[e.i].y} x2={net.nodes[e.j].x} y2={net.nodes[e.j].y} stroke={e.rho > 0 ? "#3B82F6" : "#EF4444"} strokeOpacity={0.25 + Math.abs(e.rho) * 0.6} strokeWidth={0.3 + Math.abs(e.rho) * 1.2} strokeDasharray={e.rho < 0 ? "2 1.5" : undefined} />
                  ))}
                  {net.nodes.map((n, i) => (
                    <g key={n.label}><circle cx={n.x} cy={n.y} r={3.2} fill={GROUP_COLOR[group(i)]} stroke="#0b1222" strokeWidth={0.6} /><text x={n.x} y={n.y - 4.8} textAnchor="middle" fontSize={3.4} fill="#CBD5E1" fontFamily="monospace">{n.label}</text></g>
                  ))}
                </svg>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                  {Object.entries(GROUP_COLOR).map(([k, c]) => <span key={k} className="flex items-center gap-1 capitalize"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />{k}</span>)}
                  <span className="ml-auto">— positive · - - negative</span>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <Card title="Rolling correlation" subtitle={`${data.labels[baseIdx]} vs up to four others`} info="Correlation over a sliding window, showing how diversification changes through time. Correlations tend to rise in sell-offs." icon={LineIcon} tone="amber"
                action={<div className="flex items-center gap-2">
                  <select aria-label="Base asset" value={data.labels[baseIdx]} onChange={(e) => setBase(e.target.value)} className="rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-blue-500">{data.labels.map((l) => <option key={l}>{l}</option>)}</select>
                  <Segmented value={String(win)} options={["30", "60", "90", "120"] as const} onChange={(v) => setWin(Number(v))} size="sm" />
                </div>}>
                <div className="h-60">
                  {roll.length > 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={roll} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} domain={[-1, 1]} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => Number(v).toFixed(2)} /><ReferenceLine y={0} stroke="#475569" />
                        {Object.keys(roll[0]).filter((k) => k !== "date").map((k, i) => <Line key={k} dataKey={k} stroke={seriesColor(i)} strokeWidth={1.5} dot={false} isAnimationActive={false} />)}
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon={LineIcon} title="Window too short" hint="Pick a smaller rolling window or a longer date range." />}
                </div>
              </Card>
            </div>
            <div className="xl:col-span-3">
              <Card title="Correlation distribution" subtitle={`${summary.pairs.length} pairs`} info="Histogram of all pairwise correlations. The dashed line is the mean." icon={BarChart3} tone="rose">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dist.map((b) => ({ label: b.x.toFixed(2), count: b.count }))} margin={{ top: 16, right: 6, left: -18, bottom: 0 }} barCategoryGap={0}>
                      <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="label" {...AXIS_PROPS} interval={3} /><YAxis {...AXIS_PROPS} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l) => `ρ ≈ ${l}`} formatter={(v: any) => [v, "Pairs"]} />
                      <Bar dataKey="count" fill="#2563EB" isAnimationActive={false} />
                      <ReferenceLine x={dist.reduce((b, c) => (Math.abs(c.x - summary.avg) < Math.abs(b.x - summary.avg) ? c : b)).x.toFixed(2)} stroke="#EF4444" strokeDasharray="4 3" label={{ value: `Mean ${summary.avg.toFixed(2)}`, position: "top", fill: "#EF4444", fontSize: 10 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
            <div className="xl:col-span-3">
              <Card title="Top correlated pairs" subtitle={topTab} info="Most positively correlated, most negatively correlated, or closest to zero (the best diversifiers)." icon={ListOrdered} tone="blue"
                action={<Segmented value={topTab} options={["Highest Positive", "Highest Negative", "Most Diversifying"] as const} onChange={setTopTab} size="sm" />}>
                <table className="w-full border-collapse text-xs"><tbody className="divide-y divide-slate-800/50">
                  {top.map((p) => (
                    <tr key={`${p.a}-${p.b}`} className="transition-colors hover:bg-slate-800/30">
                      <td className="py-2 font-mono text-[11px] text-slate-200">{p.a} – {p.b}</td>
                      <td className="w-24 py-2"><div className="relative h-4 overflow-hidden rounded bg-slate-800/60"><div className={cn("h-full", p.rho >= 0 ? "bg-blue-500/70" : "bg-rose-500/70")} style={{ width: `${Math.abs(p.rho) * 100}%` }} /><span className="absolute inset-0 flex items-center justify-end pr-1 font-mono text-[10px] text-white">{p.rho.toFixed(2)}</span></div></td>
                    </tr>
                  ))}
                </tbody></table>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
