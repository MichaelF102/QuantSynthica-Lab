"use client";

import React, { useMemo, useState } from "react";
import { Layers, LineChart as LineIcon, BarChart3, Table2, Activity, Grid3x3, PieChart as PieIcon, ClipboardList, Check, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from "recharts";
import { useRisk } from "@/lib/risk/context";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import SparkKpi from "../ui/SparkKpi";
import { Segmented } from "../ui/controls";
import { HISTORICAL, ScenarioDef, ScenarioResult } from "@/lib/risk/scenarios";
import { useEmpirical, useScenarioRuns } from "@/lib/risk/useScenarios";
import { histogram } from "@/lib/risk/var";
import { aggregateBy } from "@/lib/risk/decomposition";
import { sectorsOf } from "@/lib/risk/sectors";
import { fmtMoney } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

const MAX = 6;
const short = (l: string) => l.replace(/^\d{4}(–\d{2})? /, "").replace(/ \(.*\)/, "");

export default function ScenarioTab() {
  const { source, settings, currency } = useRisk();
  const value = settings.positionValue;
  const { data: emp, state: empState } = useEmpirical(settings.benchmark);
  const [custom, setCustom] = useState<ScenarioDef[]>([]);
  const [selected, setSelected] = useState<string[]>(["window", "bear", "covid", "gfc", "rates"]);
  const [cfgTab, setCfgTab] = useState<"Historical episodes" | "Custom window">("Historical episodes");
  const [cs, setCs] = useState("2020-02-01"), [ce, setCe] = useState("2020-04-30");
  const [retTab, setRetTab] = useState<"1M" | "3M" | "6M" | "Full">("Full");
  const [sumTab, setSumTab] = useState<"Key Insights" | "Best / Worst">("Key Insights");
  const [sectors, setSectors] = useState<string[] | null>(null);

  const defs: ScenarioDef[] = useMemo(() => {
    const own: ScenarioDef[] = [{ key: "window", label: "Selected window", desc: `${settings.start} to ${settings.end}`, start: settings.start, end: settings.end, kind: "window" }];
    if (emp) {
      own.push({ key: "bull", label: "Bull case (best 1Y)", desc: `Benchmark's best year: ${emp.best.start} to ${emp.best.end}`, start: emp.best.start, end: emp.best.end, kind: "empirical" });
      own.push({ key: "bear", label: "Bear case (worst 1Y)", desc: `Benchmark's worst year: ${emp.worst.start} to ${emp.worst.end}`, start: emp.worst.start, end: emp.worst.end, kind: "empirical" });
    }
    return [...own, ...HISTORICAL, ...custom];
  }, [settings.start, settings.end, emp, custom]);

  const active = defs.filter((d) => selected.includes(d.key)).slice(0, MAX);
  const { results, pending } = useScenarioRuns(active, source.holdings, settings.benchmark, true);
  const ready = active.map((d) => results[d.key]).filter((r): r is ScenarioResult => !!r && r.status !== "unavailable");

  React.useEffect(() => { let live = true; setSectors(null); sectorsOf(source.holdings.map((h) => h.ticker)).then((s) => live && setSectors(s)); return () => { live = false; }; }, [source.holdings.map((h) => h.ticker).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (k: string) => setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const colorOf = (k: string) => seriesColor(Math.max(0, active.findIndex((d) => d.key === k)));
  const maxLen = Math.max(0, ...ready.map((r) => r.index.length));
  const lineData = Array.from({ length: maxLen }, (_, i) => { const row: Record<string, number> = { day: i }; ready.forEach((r) => { if (i < r.index.length) row[r.def.key] = (r.index[i] / 100) * value; }); return row; });
  const retData = ready.map((r) => ({ name: short(r.def.label), Portfolio: r.horizons.find((h) => h.h === retTab)?.port ?? null, Benchmark: r.horizons.find((h) => h.h === retTab)?.bench ?? null }));
  const dist = useMemo(() => (emp ? histogram(emp.dist, 30) : []), [emp]);
  const tickers = source.holdings.map((h) => h.ticker);
  const sectorImpact = useMemo(() => {
    if (!sectors) return [];
    const names = [...new Set(sectors)];
    return names.map((s) => { const row: Record<string, number | string> = { sector: s }; ready.forEach((r) => { let tot = 0, have = false; tickers.forEach((t, i) => { if (sectors[i] === s && r.assetReturns[t] != null) { tot += (r.assetReturns[t] as number) * (source.holdings[i].weight / 100); have = true; } }); if (have) row[r.def.key] = Number(tot.toFixed(2)); }); return row; });
  }, [sectors, ready, tickers.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const best = ready.length ? [...ready].sort((a, b) => b.totalReturn - a.totalReturn)[0] : null, worst = ready.length ? [...ready].sort((a, b) => a.totalReturn - b.totalReturn)[0] : null;
  const worstAsset = worst ? Object.entries(worst.assetReturns).filter(([, v]) => v !== null).sort((a, b) => (a[1] as number) - (b[1] as number))[0] : null;
  const cellColor = (v: number | null) => (v === null ? "transparent" : v >= 0 ? `rgba(22,163,74,${Math.min(0.8, 0.1 + Math.abs(v) / 60)})` : `rgba(220,38,38,${Math.min(0.85, 0.1 + Math.abs(v) / 60)})`);

  return (
    <div className="space-y-4">
      <div role="note" className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Scenarios are <b>real historical episodes</b> replayed on your current weights (buy-and-hold from the episode start). Holdings with no price history then are excluded and the rest renormalised, and the scenario is marked <i>partial</i>. No hypothetical shocks are applied.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {active.map((d) => {
          const r = results[d.key];
          return r && r.status !== "unavailable" ? (
            <SparkKpi key={d.key} label={d.label} value={fmtPct(r.totalReturn, 1)} tone={signTone(r.totalReturn) === "text-rose-400" ? "text-rose-400" : "text-emerald-400"} data={r.index.filter((_, i, a) => i % Math.max(1, Math.ceil(a.length / 40)) === 0)} color={r.totalReturn < 0 ? "#EF4444" : "#10B981"}
              sub={r.benchReturn === null ? undefined : `Bench ${fmtPct(r.benchReturn, 1)}`} />
          ) : (
            <SparkKpi key={d.key} label={d.label} value={r ? "—" : "…"} sub={r ? r.error : "Replaying"} />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Scenario configuration" subtitle={`${active.length} of ${MAX} selected`} info="Pick up to six episodes to compare. Selected window uses your current date range; Bull/Bear cases are the benchmark's best and worst rolling 1-year windows since 2005." icon={Layers} tone="blue"
            action={<Segmented value={cfgTab} options={["Historical episodes", "Custom window"] as const} onChange={setCfgTab} size="sm" />}>
            {cfgTab === "Historical episodes" ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {defs.map((d) => {
                  const on = selected.includes(d.key), r = results[d.key];
                  return (
                    <button key={d.key} type="button" onClick={() => toggle(d.key)} aria-pressed={on} className={cn("flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors", on ? "border-blue-500/50 bg-blue-500/10" : "border-slate-800 bg-[#080d1a]/60 hover:border-slate-600")}>
                      <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", on ? "border-blue-500 bg-blue-600" : "border-slate-600")}>{on && <Check className="h-3 w-3 text-white" />}</span>
                      <span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-slate-100">{d.label}</span><span className="block text-[10px] leading-snug text-slate-400">{d.desc}</span>{r?.status === "unavailable" && <span className="text-[10px] text-amber-400">no data for current holdings</span>}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (cs && ce && cs < ce) { const key = `custom:${cs}:${ce}`; setCustom((c) => (c.some((x) => x.key === key) ? c : [...c, { key, label: `Custom ${cs} → ${ce}`, desc: "User-defined historical window", start: cs, end: ce, kind: "custom" }])); setSelected((s) => (s.includes(key) ? s : [...s, key])); setCfgTab("Historical episodes"); } }}>
                {[["Start", cs, setCs], ["End", ce, setCe]].map(([l, v, set]: any) => <label key={l} className="text-[10px] text-slate-400">{l}<input type="date" value={v} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set(e.target.value)} className="mt-1 block rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" /></label>)}
                <button type="submit" disabled={!cs || !ce || cs >= ce} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">Add scenario</button>
                {cs >= ce && <span className="text-[11px] text-rose-400">Start must be before end.</span>}
              </form>
            )}
            {empState === "error" && <p className="mt-2 text-[11px] text-amber-400">Bull/Bear windows unavailable: benchmark history could not be loaded.</p>}
          </Card>
        </div>
        <div className="xl:col-span-7">
          <Card title="Portfolio value under different scenarios" subtitle={`Starting from ${fmtMoney(value, currency)}; x = trading days since the episode started`} info="Each line replays the same weights through a different episode, rebased to your portfolio value on day 0." icon={LineIcon} tone="purple">
            <div className="h-64">
              {ready.length === 0 ? (pending > 0 ? <div className="h-full animate-pulse rounded bg-slate-800/40" /> : <EmptyState icon={LineIcon} title="Select at least one available scenario" />) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="day" {...AXIS_PROPS} /><YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => fmtMoney(v, currency, true)} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [fmtMoney(Number(v), currency), short(active.find((d) => d.key === n)?.label ?? String(n))]} labelFormatter={(l) => `Day ${l}`} /><ReferenceLine y={value} stroke="#475569" strokeDasharray="4 3" />
                    {ready.map((r) => <Line key={r.def.key} dataKey={r.def.key} stroke={colorOf(r.def.key)} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />)}
                    <Legend formatter={(v) => short(active.find((d) => d.key === v)?.label ?? String(v))} wrapperStyle={{ fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card title="Scenario returns comparison" subtitle={`Return after ${retTab === "Full" ? "the full episode" : retTab} from the start`} info="Portfolio vs benchmark return measured from the episode start. Horizons longer than an episode show no bar." icon={BarChart3} tone="amber" action={<Segmented value={retTab} options={["1M", "3M", "6M", "Full"] as const} onChange={setRetTab} size="sm" />}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="name" {...AXIS_PROPS} interval={0} tick={{ fontSize: 9, fill: "#64748b" }} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><ReferenceLine y={0} stroke="#475569" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v), 1)} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Portfolio" fill="#2563EB" radius={[3, 3, 0, 0]} isAnimationActive={false} /><Bar dataKey="Benchmark" fill="#7C3AED" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card title="Risk metrics by scenario" subtitle="Computed inside each episode" info="Volatility annualised on 252 days; VaR is the historical 95% one-day loss within the episode; recovery is calendar days from the trough back to the prior peak (searched up to 3 years after the episode)." icon={Table2} tone="blue">
            <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Scenario</th><th className="py-1.5 text-right">Return</th><th className="py-1.5 text-right">Bench</th><th className="py-1.5 text-right">Vol</th><th className="py-1.5 text-right">VaR 95</th><th className="py-1.5 text-right">Max DD</th><th className="py-1.5 text-right">Recovery</th></tr></thead>
              <tbody className="divide-y divide-slate-800/50">
                {active.map((d) => { const r = results[d.key]; return (
                  <tr key={d.key} className="transition-colors hover:bg-slate-800/30">
                    <td className="py-2 text-slate-200"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorOf(d.key) }} />{short(d.label)}{r?.status === "partial" && <span title={`Excluded: ${r.excluded.join(", ")}`} className="ml-1 font-mono text-[9px] text-amber-400">partial</span>}</td>
                    {!r ? <td colSpan={6}><div className="h-4 animate-pulse rounded bg-slate-800/60" /></td> : r.status === "unavailable" ? <td colSpan={6} className="py-2 text-right text-slate-500">—</td> : (<>
                      <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.totalReturn))}>{fmtPct(r.totalReturn, 1)}</td><td className={cn("py-2 text-right font-mono", signTone(r.benchReturn))}>{fmtPct(r.benchReturn, 1)}</td>
                      <td className="py-2 text-right font-mono text-slate-300">{fmtPct(r.volAnn, 1, false)}</td><td className="py-2 text-right font-mono text-rose-400">{fmtPct(-r.var95 * 100, 2)}</td><td className="py-2 text-right font-mono text-rose-400">{fmtPct(-r.maxDD, 1)}</td>
                      <td className="py-2 text-right font-mono text-slate-200">{r.maxDD === 0 ? "—" : r.recoveryDays === null ? ">3Y" : `${fmtInt(r.recoveryDays)}d`}</td></>)}
                  </tr>); })}
              </tbody>
            </table></div>
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="Benchmark 1-year return distribution" subtitle={emp ? `${emp.years.toFixed(0)} years of rolling 1Y returns` : "Loading…"} info="Every rolling 252-day return of the benchmark since 2005. The marked bars show where the benchmark's best and worst years sit; use it to judge how extreme a scenario is." icon={Activity} tone="purple">
            <div className="h-56">
              {empState === "ready" && emp ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dist.map((b) => ({ label: b.x.toFixed(0), count: b.count }))} margin={{ top: 8, right: 6, left: -18, bottom: 0 }} barCategoryGap={0}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="label" {...AXIS_PROPS} interval={4} tickFormatter={(v) => `${v}%`} /><YAxis {...AXIS_PROPS} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(l) => `1Y return ≈ ${l}%`} formatter={(v: any) => [v, "Windows"]} /><Bar dataKey="count" fill="#2563EB" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : empState === "loading" ? <div className="h-full animate-pulse rounded bg-slate-800/40" /> : <EmptyState icon={Activity} title="Unavailable" hint="Benchmark history could not be loaded." />}
            </div>
            {emp && <p className="mt-1 font-mono text-[10px] text-slate-400">Best {fmtPct(emp.best.ret, 0)} · Worst {fmtPct(emp.worst.ret, 0)}</p>}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Scenario impact by asset" subtitle="Each holding's own return in the episode" info="Return of each holding over the episode. Blank cells mean the stock had no price history then." icon={Grid3x3} tone="rose">
            <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-center font-mono text-[11px]">
              <thead><tr><th />{ready.map((r) => <th key={r.def.key} className="px-1 py-1 text-[10px] font-semibold text-slate-400">{short(r.def.label)}</th>)}</tr></thead>
              <tbody>{tickers.map((t) => <tr key={t}><th className="whitespace-nowrap pr-2 text-right text-[10px] font-semibold text-slate-400">{t.replace(".NS", "")}</th>{ready.map((r) => { const v = r.assetReturns[t]; return <td key={r.def.key} className="border border-[#0b1222] px-1 py-1.5 text-white" style={{ backgroundColor: cellColor(v) }}>{v === null ? "—" : v.toFixed(1)}</td>; })}</tr>)}</tbody>
            </table></div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Sector impact" subtitle="Weighted return contribution by sector (pp)" info="Each sector's contribution = Σ weight × holding return for holdings in that sector (percentage points of portfolio return, before renormalising for excluded holdings)." icon={PieIcon} tone="purple">
            <div className="h-56">
              {!sectors ? <div className="h-full animate-pulse rounded bg-slate-800/40" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorImpact} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="sector" {...AXIS_PROPS} interval={0} tick={{ fontSize: 9, fill: "#64748b" }} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}`} /><ReferenceLine y={0} stroke="#475569" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [fmtPct(Number(v), 2), short(active.find((d) => d.key === n)?.label ?? String(n))]} />
                    {ready.map((r) => <Bar key={r.def.key} dataKey={r.def.key} fill={colorOf(r.def.key)} radius={[2, 2, 0, 0]} isAnimationActive={false} />)}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="Scenario summary" subtitle="Generated from the replays" info="Plain-language read-outs of the replays above. They describe what happened historically; they are not predictions or recommendations." icon={ClipboardList} tone="amber" action={<Segmented value={sumTab} options={["Key Insights", "Best / Worst"] as const} onChange={setSumTab} size="sm" />}>
            {!best || !worst ? <p className="py-6 text-center text-xs text-slate-500">Waiting for replays…</p> : sumTab === "Key Insights" ? (
              <ul className="space-y-2.5 text-[11px] leading-relaxed text-slate-300">
                <li>Worst episode: <b className="text-white">{short(worst.def.label)}</b>, <span className="font-mono text-rose-400">{fmtPct(worst.totalReturn, 1)}</span> (max drawdown <span className="font-mono">{fmtPct(-worst.maxDD, 1)}</span>){worst.benchReturn !== null && <> vs benchmark <span className="font-mono">{fmtPct(worst.benchReturn, 1)}</span></>}.</li>
                {worstAsset && <li>In that episode <b className="text-white">{worstAsset[0].replace(".NS", "")}</b> fell the most (<span className="font-mono text-rose-400">{fmtPct(worstAsset[1] as number, 1)}</span>).</li>}
                <li>Best episode: <b className="text-white">{short(best.def.label)}</b>, <span className="font-mono text-emerald-400">{fmtPct(best.totalReturn, 1)}</span>.</li>
                {worst.recoveryDays !== null ? <li>After that trough the portfolio took <span className="font-mono text-white">{fmtInt(worst.recoveryDays)}</span> days to regain its prior peak.</li> : worst.maxDD > 0 && <li>It had not regained its prior peak within three years of the episode.</li>}
                {ready.some((r) => r.status === "partial") && <li className="text-amber-300">Some episodes are partial: holdings without history were excluded.</li>}
              </ul>
            ) : (
              <table className="w-full border-collapse text-xs"><tbody className="divide-y divide-slate-800/50">{[["Best", best], ["Worst", worst]].map(([k, r]: any) => <tr key={k}><td className="py-2 text-slate-400">{k}</td><td className="py-2 text-slate-200">{short(r.def.label)}</td><td className={cn("py-2 text-right font-mono font-bold", signTone(r.totalReturn))}>{fmtPct(r.totalReturn, 1)}</td></tr>)}</tbody></table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
