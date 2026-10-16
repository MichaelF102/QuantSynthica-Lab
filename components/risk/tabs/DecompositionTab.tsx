"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PieChart as PieIcon, BarChart3, Layers, Activity, Waves, ListOrdered, Grid3x3, ClipboardList } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend, ComposedChart,
} from "recharts";
import { useRisk } from "@/lib/risk/context";
import { Card, EmptyState } from "@/components/ui/Card";
import SparkKpi from "../ui/SparkKpi";
import { Segmented } from "../ui/controls";
import { aggregateBy, decompose, rollingShares, rollingSystematic } from "@/lib/risk/decomposition";
import { sectorsOf } from "@/lib/risk/sectors";
import { CONFIDENCE_LABEL } from "@/lib/risk/presets";
import { fmtMoney } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";

const ASSET_TABS = ["Variance Contribution", "Marginal VaR", "Component VaR"] as const;
const SECTOR_TABS = ["Risk Contribution", "Capital Weight"] as const;

export default function DecompositionTab() {
  const { result, settings, source, currency } = useRisk();
  const r = result!;
  const conf = settings.confidence, c = CONFIDENCE_LABEL(conf);
  const [assetTab, setAssetTab] = useState<(typeof ASSET_TABS)[number]>("Variance Contribution");
  const [sectorTab, setSectorTab] = useState<(typeof SECTOR_TABS)[number]>("Risk Contribution");
  const [sectors, setSectors] = useState<string[] | null>(null);

  const d = useMemo(() => decompose(r, conf), [r, conf]);
  const winRoll = Math.min(120, Math.max(30, Math.floor(r.returns.length / 3)));
  const sysSeries = useMemo(() => rollingSystematic(r, winRoll), [r, winRoll]);
  const shareSeries = useMemo(() => rollingShares(r, winRoll), [r, winRoll]);
  useEffect(() => {
    let live = true;
    setSectors(null);
    sectorsOf(r.tickers).then((s) => live && setSectors(s));
    return () => { live = false; };
  }, [r.tickers.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const names = d.tickers.map((t) => t.replace(".NS", ""));
  const portSys = useMemo(() => {
    const last = sysSeries.length ? sysSeries.reduce((s, x) => s + x.systematic, 0) / sysSeries.length : 0;
    // Whole-window R² of the portfolio on the benchmark (not the rolling average).
    const y = r.returns, x = r.benchReturns, mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
    const sxy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0), sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0), syy = y.reduce((s, v) => s + (v - my) ** 2, 0);
    return sxx > 0 && syy > 0 ? ((sxy * sxy) / (sxx * syy)) * 100 : last;
  }, [r, sysSeries]);
  const sysVol = d.portVolAnn * Math.sqrt(portSys / 100), idioVol = d.portVolAnn * Math.sqrt(1 - portSys / 100);

  const sectorAgg = useMemo(() => (sectors ? aggregateBy(sectors, sectorTab === "Risk Contribution" ? d.share : d.w.map((x) => x * 100)) : []), [sectors, d, sectorTab]);
  const topAsset = [...d.share.map((s, i) => ({ n: names[i], s }))].sort((a, b) => b.s - a.s)[0];
  const topSector = sectors ? aggregateBy(sectors, d.share)[0] : null;

  const assetData = names.map((n, i) => ({
    name: n,
    value: assetTab === "Variance Contribution" ? d.share[i] : assetTab === "Marginal VaR" ? d.mVaR[i] : (d.cVaR[i] / (d.totalVaR || 1)) * 100,
    amount: d.cVaR[i] / 100 * settings.positionValue,
  })).sort((a, b) => b.value - a.value);
  const unit = assetTab === "Marginal VaR" ? "% per unit weight" : "% of portfolio";

  let cum = 0;
  const waterfall = [...d.volPoints.map((v, i) => ({ name: names[i], v }))].sort((a, b) => b.v - a.v).map((x) => { const row = { name: x.name, base: cum, v: x.v }; cum += x.v; return row; });
  const wfData = [...waterfall, { name: "Total", base: 0, v: d.portVolAnn }];

  const rows = names.map((n, i) => ({ n, w: d.w[i] * 100, vol: d.volAnn[i], m: d.marginal[i], s: d.share[i] })).sort((a, b) => b.s - a.s);
  const single = r.tickers.length === 1;
  const heatColor = (v: number) => (v >= 0 ? `rgba(220,38,38,${Math.min(0.85, 0.1 + (Math.abs(v) / 40) * 0.75)})` : `rgba(37,99,235,${Math.min(0.85, 0.1 + (Math.abs(v) / 10) * 0.75)})`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SparkKpi label="Total portfolio volatility" value={fmtPct(d.portVolAnn, 2, false)} sub="Annualised, from covariance" />
        <SparkKpi label="Systematic risk" value={fmtPct(sysVol, 2, false)} sub={`${fmtPct(portSys, 1, false)} of variance`} tone="text-blue-400" hint="Share of variance explained by the benchmark (R² of the portfolio on the benchmark)" />
        <SparkKpi label="Idiosyncratic risk" value={fmtPct(idioVol, 2, false)} sub={`${fmtPct(100 - portSys, 1, false)} of variance`} tone="text-purple-300" />
        <SparkKpi label="Top asset contribution" value={topAsset ? topAsset.n : "—"} sub={topAsset ? fmtPct(topAsset.s, 1, false) : undefined} tone="text-rose-400" />
        <SparkKpi label="Top sector contribution" value={topSector ? topSector.name : sectors ? "—" : "Loading…"} sub={topSector ? fmtPct(topSector.value, 1, false) : undefined} tone="text-blue-400" />
        <SparkKpi label="Diversification ratio" value={d.diversificationRatio.toFixed(2)} sub={`${d.effectiveBets.toFixed(1)} effective bets`} hint="Weighted-average asset volatility ÷ portfolio volatility; effective bets = 1 ÷ Σ(risk share²)" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Risk decomposition by asset" subtitle={`${assetTab} (${unit})`} info="Euler decomposition of the covariance matrix: each asset's weight × marginal risk, summing to the portfolio total. Marginal VaR is the change in parametric VaR per unit of weight; component VaR is weight × marginal VaR." icon={BarChart3} tone="blue"
            action={<Segmented value={assetTab} options={ASSET_TABS} onChange={setAssetTab} size="sm" />}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetData} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} horizontal={false} vertical /><XAxis type="number" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><YAxis type="category" dataKey="name" {...AXIS_PROPS} width={76} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${fmtPct(Number(v), 2, false)}${assetTab === "Component VaR" ? ` · ${fmtMoney(p.payload.amount, currency)} at ${c}` : ""}`, assetTab]} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>{assetData.map((x, i) => <Cell key={x.name} fill={seriesColor(i)} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Risk decomposition by sector" subtitle={sectors ? sectorTab : "Looking up sectors…"} info="Holdings are grouped by the sector in the stock universe. Indices and ETFs are grouped as Index / ETF; tickers with no sector data are Unclassified rather than guessed." icon={PieIcon} tone="purple"
            action={<Segmented value={sectorTab} options={SECTOR_TABS} onChange={setSectorTab} size="sm" />}>
            {!sectors ? <div className="h-72 animate-pulse rounded bg-slate-800/40" /> : (
              <div className="grid grid-cols-2 items-center gap-2">
                <div className="relative h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={sectorAgg} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false}>{sectorAgg.map((s, i) => <Cell key={s.name} fill={seriesColor(i)} />)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v), 1, false), ""]} /></PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><div className="text-[10px] text-slate-400">Total risk</div><div className="font-mono text-sm font-bold text-white">{fmtPct(d.portVolAnn, 1, false)}</div></div>
                </div>
                <ul className="space-y-1.5 text-[11px]">{sectorAgg.map((s, i) => <li key={s.name} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5 text-slate-300"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: seriesColor(i) }} /><span className="truncate">{s.name}</span></span><span className="font-mono font-semibold text-white">{fmtPct(s.value, 1, false)}</span></li>)}</ul>
              </div>
            )}
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="Systematic vs idiosyncratic" subtitle="By asset, vs the benchmark" info="For each holding, the share of its own variance explained by the benchmark (R²). The rest is idiosyncratic. Style-factor risk is covered in the Factor Risk tab." icon={Layers} tone="amber">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={names.map((n, i) => ({ name: n, Systematic: Number(d.assetSystematic[i].toFixed(1)), Idiosyncratic: Number((100 - d.assetSystematic[i]).toFixed(1)) }))} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} horizontal={false} vertical /><XAxis type="number" domain={[0, 100]} {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><YAxis type="category" dataKey="name" {...AXIS_PROPS} width={72} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v), 1, false)} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Systematic" stackId="a" fill="#2563EB" isAnimationActive={false} /><Bar dataKey="Idiosyncratic" stackId="a" fill="#7C3AED" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card title="Systematic vs idiosyncratic over time" subtitle={`${winRoll}-day rolling R² on the benchmark`} info="Rolling share of portfolio variance explained by the benchmark. A rising systematic share means the portfolio is behaving more like the market." icon={Activity} tone="blue">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sysSeries} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v), 1, false)} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area dataKey="systematic" name="Systematic" stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.55} isAnimationActive={false} /><Area dataKey="idiosyncratic" name="Idiosyncratic" stackId="1" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.55} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Rolling risk contributions" subtitle={`${winRoll}-day window, share of variance`} info="How each asset's share of portfolio variance changed through time, using a rolling covariance matrix at the target weights." icon={Waves} tone="purple">
            <div className="h-56">
              {single ? <EmptyState icon={Waves} title="Single holding" hint="One asset always contributes 100%." /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={shareSeries} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v), 1, false)} /><Legend wrapperStyle={{ fontSize: 10 }} />
                    {r.tickers.map((t, i) => <Line key={t} dataKey={t} name={t.replace(".NS", "")} stroke={seriesColor(i)} strokeWidth={1.6} dot={false} isAnimationActive={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Risk attribution waterfall" subtitle="Contribution to annual volatility (pp)" info="Each bar is an asset's contribution to portfolio volatility in percentage points; the contributions add up to the Total bar." icon={BarChart3} tone="rose">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={wfData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="name" {...AXIS_PROPS} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => (n === "base" ? null : [fmtPct(Number(v), 2, false), "Contribution"]) as any} />
                  <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} legendType="none" />
                  <Bar dataKey="v" stackId="w" radius={[3, 3, 0, 0]} isAnimationActive={false}>{wfData.map((x, i) => <Cell key={x.name} fill={x.name === "Total" ? "#2563EB" : seriesColor(i)} />)}</Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Top risk contributors" subtitle="Marginal risk and share of variance" info="Weight and stand-alone volatility, the marginal contribution of one extra unit of weight to portfolio volatility, and each asset's share of total variance." icon={ListOrdered} tone="rose">
            <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Asset</th><th className="py-1.5 text-right">Weight</th><th className="py-1.5 text-right">Vol</th><th className="py-1.5 text-right">Marginal</th><th className="py-1.5 text-right">Contribution</th></tr></thead>
              <tbody className="divide-y divide-slate-800/50">{rows.map((x) => <tr key={x.n} className="transition-colors hover:bg-slate-800/30"><td className="py-2 font-mono font-semibold text-slate-200">{x.n}</td><td className="py-2 text-right font-mono text-slate-300">{fmtPct(x.w, 1, false)}</td><td className="py-2 text-right font-mono text-slate-300">{fmtPct(x.vol, 1, false)}</td><td className="py-2 text-right font-mono text-slate-300">{fmtPct(x.m, 2, false)}</td><td className="py-2 text-right font-mono font-bold text-rose-400">{fmtPct(x.s, 1, false)}</td></tr>)}</tbody>
            </table></div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Pairwise risk contribution" subtitle="Share of portfolio variance by asset pair" info="Cell (i, j) is w_i × w_j × cov(i, j) ÷ portfolio variance. The whole matrix sums to 100%: the diagonal is stand-alone risk, off-diagonals are interaction. Blue cells reduce risk." icon={Grid3x3} tone="purple">
            <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-center font-mono text-[10px]">
              <thead><tr><th />{names.map((n) => <th key={n} className="px-1 py-1 text-[10px] font-semibold text-slate-400">{n}</th>)}</tr></thead>
              <tbody>{d.pairwise.map((row, i) => <tr key={names[i]}><th className="whitespace-nowrap pr-2 text-right text-[10px] font-semibold text-slate-400">{names[i]}</th>{row.map((v, j) => <td key={j} className="border border-[#0b1222] px-1 py-1.5 text-white" style={{ backgroundColor: heatColor(v) }} title={`${names[i]} × ${names[j]}: ${v.toFixed(2)}%`}>{v.toFixed(1)}</td>)}</tr>)}</tbody>
            </table></div>
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="Decomposition summary" subtitle={source.label} info="Headline split of total risk." icon={ClipboardList} tone="amber">
            <table className="w-full border-collapse text-xs"><thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Component</th><th className="py-1.5 text-right">Risk</th><th className="py-1.5 text-right">Share</th></tr></thead>
              <tbody className="divide-y divide-slate-800/50">
                {([["Systematic", fmtPct(sysVol, 2, false), fmtPct(portSys, 1, false)], ["Idiosyncratic", fmtPct(idioVol, 2, false), fmtPct(100 - portSys, 1, false)], [`Top asset (${topAsset?.n ?? "—"})`, topAsset ? fmtPct((topAsset.s / 100) * d.portVolAnn, 2, false) : "—", topAsset ? fmtPct(topAsset.s, 1, false) : "—"], [`Top sector (${topSector?.name ?? "—"})`, topSector ? fmtPct((topSector.value / 100) * d.portVolAnn, 2, false) : "—", topSector ? fmtPct(topSector.value, 1, false) : "—"], [`Total VaR (${c}, 1D)`, fmtPct(d.totalVaR, 2, false), "—"]] as string[][]).map(([k, a, b]) => (
                  <tr key={k}><td className="py-2 text-slate-300">{k}</td><td className="py-2 text-right font-mono text-white">{a}</td><td className={cn("py-2 text-right font-mono font-bold", b === "—" ? "text-slate-500" : "text-rose-400")}>{b}</td></tr>
                ))}
              </tbody></table>
          </Card>
        </div>
      </div>
    </div>
  );
}
