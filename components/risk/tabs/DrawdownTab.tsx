"use client";

import React, { useMemo, useState } from "react";
import { TrendingDown, Table2, BarChart3, ListOrdered, GitCompare, Hourglass, LineChart as LineIcon } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, LineChart, Line, Area, AreaChart, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea, ReferenceLine, Legend,
} from "recharts";
import { useRisk } from "@/lib/risk/context";
import { Card, EmptyState } from "@/components/ui/Card";
import SparkKpi from "../ui/SparkKpi";
import { Segmented } from "../ui/controls";
import { histogram } from "@/lib/risk/var";
import { DURATION_BUCKETS, drawdownStats, durationHistogram, findEpisodes, rollingMaxDD, runningMax, underwater } from "@/lib/risk/drawdown";
import { MARKET_DEFAULTS } from "@/lib/risk/presets";
import { Pt, fmtMoney, seriesStats, windowPts } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";

const VIEWS = ["Price & Drawdown", "Underwater Plot", "Drawdown Periods", "Rolling Drawdown"] as const;

export default function DrawdownTab() {
  const { result, settings, source, currency } = useRisk();
  const [view, setView] = useState<(typeof VIEWS)[number]>("Price & Drawdown");
  const bench = MARKET_DEFAULTS[source.market].benchmarkLabel.split(" (")[0];
  const r = result!;

  const pts: Pt[] = useMemo(() => windowPts(r.pts, null, null, settings.frequency), [r, settings.frequency]);
  const stats = useMemo(() => seriesStats(pts, settings.frequency), [pts, settings.frequency]);
  const st = useMemo(() => drawdownStats(pts, stats?.cagr ?? null), [pts, stats]);
  const rm = useMemo(() => runningMax(pts), [pts]);
  const benchPts = useMemo(() => pts.map((p) => ({ date: p.date, value: p.bench })), [pts]);
  const benchDD = useMemo(() => underwater(benchPts), [benchPts]);
  const ddHist = useMemo(() => {
    const under = st.dd.filter((d) => d > 0).map((d) => -d);
    return under.length > 5 ? histogram(under, 20) : [];
  }, [st]);
  const durHist = useMemo(() => durationHistogram(st.episodes), [st.episodes]);
  const rolling = useMemo(() => rollingMaxDD(pts, Math.min(60, Math.max(10, Math.floor(pts.length / 4)))), [pts]);
  const benchEp = useMemo(() => findEpisodes(benchPts), [benchPts]);

  if (pts.length < 10) return <EmptyState icon={TrendingDown} title="Not enough observations" hint="Widen the date range or use a finer time horizon." />;

  const ppy = settings.frequency === "Daily" ? 252 : settings.frequency === "Weekly" ? 52 : 12;
  const mar = stats && st.maxDD > 0 ? stats.cagr / st.maxDD : null;
  const data = pts.map((p, i) => ({ date: p.date, price: p.value, max: rm[i], dd: -st.dd[i], bdd: -benchDD[i] }));
  const me = st.maxEp;
  const stat = (k: string, v: string, tone = "text-white") => (
    <tr key={k}><td className="py-1.5 text-slate-300">{k}</td><td className={cn("py-1.5 text-right font-mono font-semibold", v === "—" ? "text-slate-500" : tone)}>{v}</td></tr>
  );
  const d = (n: number | null) => (n === null ? "—" : `${fmtInt(Math.round(n))} days`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SparkKpi label="Maximum drawdown" value={fmtPct(-st.maxDD)} tone="text-rose-400" data={data.filter((_, i) => i % Math.ceil(data.length / 50) === 0).map((x) => x.dd)} color="#EF4444"
          sub={me ? `Peak ${fmtMoney(me.peakValue, currency)} → trough ${fmtMoney(me.troughValue, currency)}` : "No drawdown"} />
        <SparkKpi label="Average drawdown" value={fmtPct(-st.avgDD)} tone="text-rose-400" sub="Mean depth while underwater" />
        <SparkKpi label="Current drawdown" value={fmtPct(-st.currentDD)} tone={st.currentDD > 0 ? "text-rose-400" : "text-emerald-400"} sub={st.currentSince ? `Since ${st.currentSince}` : "At a high"} />
        <SparkKpi label="Longest drawdown period" value={st.longest ? d(st.longest.durationDays) : "—"} sub={st.longest ? `${st.longest.peakDate} → ${st.longest.recoveryDate ?? "ongoing"}` : undefined} />
        <SparkKpi label="Average recovery time" value={d(st.avgRecovery)} sub={st.avgRecovery === null ? "No completed recoveries" : "Trough to prior peak"} />
        <SparkKpi label="Calmar ratio" value={st.calmar === null ? "—" : formatRatio(st.calmar)} sub="Annual return ÷ max drawdown" hint="CAGR ÷ |maximum drawdown| over the window" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <Card title="Price, drawdown & underwater chart" subtitle={`${settings.frequency} observations`} info="Value of the holdings with its running maximum, and the percentage below that maximum. Switch views to see the underwater plot, the five worst periods shaded, or rolling max drawdown." icon={LineIcon} tone="blue"
            action={<Segmented value={view} options={VIEWS} onChange={setView} size="sm" />}>
            {view === "Price & Drawdown" || view === "Drawdown Periods" ? (
              <div className="space-y-1">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" hide /><YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => fmtMoney(v, currency, true)} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [fmtMoney(Number(v), currency), n === "max" ? "Running maximum" : "Value"]} />
                      {view === "Drawdown Periods" && st.top.map((e) => <ReferenceArea key={e.peakDate} x1={e.peakDate} x2={e.recoveryDate ?? pts[pts.length - 1].date} fill="#DC2626" fillOpacity={0.12} />)}
                      <Line dataKey="max" stroke="#E2E8F0" strokeDasharray="4 3" strokeWidth={1} dot={false} isAnimationActive={false} />
                      <Line dataKey="price" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="rkDd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#DC2626" stopOpacity={0.05} /><stop offset="100%" stopColor="#DC2626" stopOpacity={0.5} /></linearGradient></defs>
                      <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(v)}%`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), "Drawdown"]} />
                      <Area dataKey="dd" stroke="#DC2626" strokeWidth={1.5} fill="url(#rkDd)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : view === "Underwater Plot" ? (
              <div className="h-[22rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="rkDd2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#DC2626" stopOpacity={0.05} /><stop offset="100%" stopColor="#DC2626" stopOpacity={0.55} /></linearGradient></defs>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(v)}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), "Drawdown"]} />
                    <ReferenceLine y={0} stroke="#475569" /><Area dataKey="dd" stroke="#DC2626" strokeWidth={1.5} fill="url(#rkDd2)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[22rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rolling} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(v)}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), "Rolling max drawdown"]} />
                    <Line dataKey="dd" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <div className="xl:col-span-3">
          <Card title="Drawdown statistics" subtitle="Whole window" info="Depths are measured from the running peak. Durations are calendar days. MAR is CAGR ÷ max drawdown since the start of the window; Ulcer index is the root-mean-square drawdown; Pain index is the mean drawdown." icon={Table2} tone="amber">
            <table className="w-full border-collapse text-xs"><tbody className="divide-y divide-slate-800/50">
              {[
                stat("Maximum drawdown", fmtPct(-st.maxDD), "text-rose-400"), stat("Average drawdown", fmtPct(-st.avgDD), "text-rose-400"), stat("Median drawdown", fmtPct(-st.medianDD), "text-rose-400"), stat("Current drawdown", fmtPct(-st.currentDD), st.currentDD > 0 ? "text-rose-400" : "text-emerald-400"),
                stat("Longest drawdown (days)", st.longest ? fmtInt(st.longest.durationDays) : "—"), stat("Average drawdown duration (days)", st.episodes.length ? fmtInt(Math.round(st.avgDuration)) : "—"),
                stat("Maximum recovery time (days)", st.maxRecovery === null ? "—" : fmtInt(st.maxRecovery)), stat("Average recovery time (days)", st.avgRecovery === null ? "—" : fmtInt(Math.round(st.avgRecovery))),
                stat("Calmar ratio", st.calmar === null ? "—" : formatRatio(st.calmar), "text-emerald-400"), stat("MAR ratio", mar === null ? "—" : formatRatio(mar), "text-emerald-400"),
                stat("Ulcer index", st.ulcer.toFixed(2)), stat("Pain index (avg drawdown)", fmtPct(st.pain, 2, false)),
                stat("Drawdown episodes", fmtInt(st.episodes.length)), stat("Time underwater", fmtPct((st.underwaterDays / st.totalDays) * 100, 0, false)),
              ]}
            </tbody></table>
          </Card>
        </div>

        <div className="xl:col-span-3">
          <Card title="Drawdown distribution" subtitle="Depth while underwater" info="Histogram of how deep the portfolio sat below its peak on each underwater observation. Dashed lines mark the mean and median." icon={BarChart3} tone="rose">
            <div className="h-72">
              {ddHist.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ddHist.map((b) => ({ x: b.x, label: b.x.toFixed(1), count: b.count }))} margin={{ top: 18, right: 8, left: -10, bottom: 0 }} barCategoryGap={0}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="label" {...AXIS_PROPS} interval={Math.max(0, Math.floor(ddHist.length / 5))} tickFormatter={(v) => `${Math.round(Number(v))}`} /><YAxis {...AXIS_PROPS} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l) => `Drawdown ≈ ${l}%`} formatter={(v: any) => [v, "Observations"]} />
                    <Bar dataKey="count" fill="#2563EB" isAnimationActive={false} />
                    {(() => { const nearest = (t: number) => ddHist.reduce((b, c) => (Math.abs(c.x - t) < Math.abs(b.x - t) ? c : b)).x.toFixed(1); return (<><ReferenceLine x={nearest(-st.avgDD)} stroke="#EF4444" strokeDasharray="4 3" label={{ value: `Mean ${fmtPct(-st.avgDD, 1)}`, position: "top", fill: "#EF4444", fontSize: 10 }} /><ReferenceLine x={nearest(-st.medianDD)} stroke="#F59E0B" strokeDasharray="4 3" label={{ value: `Median ${fmtPct(-st.medianDD, 1)}`, position: "insideTopLeft", fill: "#F59E0B", fontSize: 10 }} /></>); })()}
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={BarChart3} title="No drawdown observations" />}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Top drawdown periods" subtitle="Five deepest episodes" info="Peak = last high before the fall; trough = lowest point; duration is peak to recovery (or to today if still underwater); recovery time is trough to recovery." icon={ListOrdered} tone="rose">
            {st.top.length === 0 ? <EmptyState icon={ListOrdered} title="No drawdowns in this window" /> : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">#</th><th className="py-1.5 text-left">Peak</th><th className="py-1.5 text-left">Trough</th><th className="py-1.5 text-right">Drawdown</th><th className="py-1.5 text-right">Duration (d)</th><th className="py-1.5 text-right">Recovery (d)</th></tr></thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {st.top.map((e, i) => (
                      <tr key={e.peakDate} className="transition-colors hover:bg-slate-800/30">
                        <td className="py-2 font-mono text-slate-500">{i + 1}</td><td className="py-2 font-mono text-slate-300">{e.peakDate}</td><td className="py-2 font-mono text-slate-300">{e.troughDate}</td>
                        <td className="py-2 text-right font-mono font-semibold text-rose-400">{fmtPct(-e.depth)}</td><td className="py-2 text-right font-mono text-slate-200">{fmtInt(e.durationDays)}</td>
                        <td className={cn("py-2 text-right font-mono", e.recoveryDays === null ? "text-amber-400" : "text-slate-200")}>{e.recoveryDays === null ? "ongoing" : fmtInt(e.recoveryDays)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Drawdown vs benchmark" subtitle={`${source.label} vs ${bench}`} info="Both underwater curves over the same dates. The benchmark's deepest drawdown is shown for context." icon={GitCompare} tone="purple">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 6, right: 8, left: -5, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(v)}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), ""]} />
                  <Area dataKey="bdd" name={`${bench} drawdown`} stroke="#DC2626" fill="#DC2626" fillOpacity={0.2} strokeWidth={1.5} isAnimationActive={false} />
                  <Area dataKey="dd" name={`${source.label} drawdown`} stroke="#2563EB" fill="#2563EB" fillOpacity={0.25} strokeWidth={1.5} isAnimationActive={false} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-400">{bench} max drawdown {fmtPct(-Math.max(0, ...benchEp.map((e) => e.depth)))} · {source.label} {fmtPct(-st.maxDD)}</p>
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="Underwater duration analysis" subtitle="Episodes by length" info="Number of drawdown episodes by duration bucket (calendar days, peak to recovery) and the cumulative share of episodes." icon={Hourglass} tone="amber">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={durHist} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="bucket" {...AXIS_PROPS} /><YAxis yAxisId="c" {...AXIS_PROPS} allowDecimals={false} /><YAxis yAxisId="p" orientation="right" {...AXIS_PROPS} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar yAxisId="c" dataKey="count" name="Episodes" fill="#2563EB" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  <Line yAxisId="p" dataKey="cumPct" name="Cumulative %" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
      <p className="text-[10px] text-slate-500">{DURATION_BUCKETS.length} duration buckets · {ppy} observations per year at {settings.frequency.toLowerCase()} frequency</p>
    </div>
  );
}
