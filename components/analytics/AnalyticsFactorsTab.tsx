"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Info, Loader2, Sigma, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend, Cell } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { FactorData, loadFactorData, ols, resample, riskShares, rollingBetas } from "@/lib/risk/factors";
import { AnalyticsFilters, btPoints, exposureSeries } from "@/lib/analyticsCalc";
import { isIndianTicker } from "@/lib/market";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { usePrimaryBacktest } from "./StrategyPicker";

interface Props { selectedBacktests: BacktestResult[]; filters?: AnalyticsFilters }

const PPY = { Daily: 252, Weekly: 52 } as const;
const KEYS = ["MKT", "SIZE", "VALUE", "MOM", "QUAL", "LOWVOL"];
const sig = (p: number) => (p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : "");

function Toggle<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5 text-[11px]" role="group" aria-label={label}>
      {options.map((o) => <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)} className={cn("rounded-md px-2.5 py-1 font-semibold", value === o ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{o}</button>)}
    </div>
  );
}

/**
 * Regresses the run's daily returns on tradable ETF/index proxy factors (market, size, value, momentum, quality, low volatility).
 * Loadings describe what the returns resembled, not what the strategy intends.
 */
export default function AnalyticsFactorsTab({ selectedBacktests, filters }: Props) {
  const { bt, picker } = usePrimaryBacktest(selectedBacktests);
  const [fd, setFd] = useState<FactorData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState<string | null>(null);
  const [sample, setSample] = useState<"All days" | "Invested days">("All days");
  const [model, setModel] = useState<"Multi-factor" | "Market only">("Multi-factor");
  const [freq, setFreq] = useState<"Daily" | "Weekly">("Daily");

  const f = filters ?? { start: null, end: null, frequency: "Daily" as const, currency: "USD" as const };
  const pts = useMemo(() => (bt ? btPoints(bt, { ...f, frequency: "Daily" }) : []), [bt, filters]); // eslint-disable-line react-hooks/exhaustive-deps
  const exposure = useMemo(() => (bt ? exposureSeries(bt) : null), [bt]);
  const market = bt && isIndianTicker(bt.ticker) ? "India" : "US";
  const dates = useMemo(() => pts.map((p) => p.date), [pts]);

  useEffect(() => {
    if (!bt || pts.length < 40) { setState("ready"); setFd(null); return; }
    let live = true;
    setState("loading"); setErr(null);
    loadFactorData(market, dates, dates[0], dates[dates.length - 1])
      .then((d) => { if (live) { setFd(d); setState("ready"); } })
      .catch((e) => { if (live) { setErr(e?.message || "Could not load factor data"); setState("error"); } });
    return () => { live = false; };
  }, [bt?.id, market, dates]); // eslint-disable-line react-hooks/exhaustive-deps

  const heldOn = useMemo(() => new Map((exposure?.series ?? []).map((p) => [p.date, p.positions])), [exposure]);
  const inMarket = pts.length ? (pts.filter((p) => (heldOn.get(p.date) ?? 0) > 0).length / pts.length) * 100 : 0;

  const fit = useMemo(() => {
    if (!fd || !bt) return null;
    const used = model === "Market only" ? fd.factors.filter((x) => x.def.key === "MKT") : fd.factors;
    if (!used.some((x) => x.def.key === "MKT")) return { error: "The market factor has no price history for this window." } as const;
    const ret = new Map(pts.slice(1).map((p, i) => [p.date, pts[i].value > 0 ? p.value / pts[i].value - 1 : 0]));
    const keepIdx = fd.dates.map((d, i) => (sample === "All days" || (heldOn.get(d) ?? 0) > 0 ? i : -1)).filter((i) => i >= 0);
    const d0 = keepIdx.map((i) => fd.dates[i]);
    const series = [keepIdx.map((i) => ret.get(fd.dates[i]) ?? 0), ...used.map((x) => keepIdx.map((i) => x.ret[i]))];
    // Invested days are not consecutive, so weekly compounding would be meaningless there.
    const rs = freq === "Weekly" && sample === "All days" ? resample(d0, series, "Weekly") : { dates: d0, series };
    const [y, ...X] = rs.series;
    try {
      const names = used.map((x) => x.def.key);
      const res = ols(y, X, names);
      const win = rs.dates.length > 360 ? 120 : Math.max(30, Math.floor(rs.dates.length / 3));
      return { y, X, names, used, res, shares: riskShares(y, X, res), rolling: rollingBetas(y, X, names, rs.dates, win), win, ppy: freq === "Weekly" && sample === "All days" ? PPY.Weekly : PPY.Daily, days: rs.dates.length };
    } catch (e: any) { return { error: e?.message || "The regression could not be fitted" } as const; }
  }, [fd, bt, pts, model, sample, freq, heldOn]);

  if (!bt) return <EmptyState icon={Sigma} title="Select a backtest to analyse" />;
  if (pts.length < 40) return <div className="space-y-4">{picker}<EmptyState icon={Sigma} title="Not enough history for a factor regression" hint="At least 40 trading days are needed in the selected window." /></div>;
  if (state === "loading") return <div className="space-y-4">{picker}<div className="flex items-center gap-2 py-10 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading factor proxies…</div></div>;
  if (state === "error" || !fd) return <div className="space-y-4">{picker}<div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{err}</div></div>;
  if (!fit || "error" in fit) return <div className="space-y-4">{picker}<EmptyState icon={Sigma} title="Factor regression unavailable" hint={fit && "error" in fit ? fit.error : ""} /></div>;

  const { res, names, used, shares, rolling, win, ppy, days } = fit;
  const label = (k: string) => used.find((x) => x.def.key === k)?.def.label ?? k;
  const col = (k: string) => seriesColor(KEYS.indexOf(k));
  const alphaAnn = res.beta[0] * ppy * 100;
  const warnings: string[] = [];
  if (sample === "All days" && inMarket < 50) warnings.push(`The strategy held a position on only ${fmtPct(inMarket, 0, false)} of days. Idle days are 0% returns, so loadings are diluted toward zero and R² is low by construction. Switch to Invested days to see how it behaves when it is in the market.`);
  if (days < 100) warnings.push(`Only ${fmtInt(days)} observations: betas carry wide uncertainty. Look at the standard errors before reading the loadings.`);
  if (sample === "Invested days") warnings.push("Invested days are not consecutive, so loadings describe exposure while holding a position, not a continuous return stream.");

  return (
    <div className="space-y-4">
      {picker}
      <div className="flex flex-wrap items-center gap-2">
        <Toggle label="Sample" value={sample} options={["All days", "Invested days"] as const} onChange={setSample} />
        <Toggle label="Model" value={model} options={["Multi-factor", "Market only"] as const} onChange={setModel} />
        <Toggle label="Frequency" value={freq} options={["Daily", "Weekly"] as const} onChange={setFreq} />
      </div>

      <div role="note" className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Factors are <b>tradable ETF/index proxies</b> (long-short pairs such as Midcap ETF − Nifty 50 ETF) for the {market} market, not the academic Fama-French series. Profitability and investment factors cannot be built from ETFs and are not shown.{fd.excluded.length > 0 && <> No usable history in this window for: {fd.excluded.map((e) => `${e.def.label} (${e.reason})`).join("; ")}.</>}</span>
      </div>
      {fd.synthetic.length > 0 && <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"><b className="mr-2 font-mono uppercase">Synthetic data</b>{fd.synthetic.join(", ")} could not be fetched; generated prices were used for those factors.</div>}
      {warnings.length > 0 && <div role="note" data-testid="factor-warnings" className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">{warnings.map((w) => <p key={w}>{w}</p>)}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Alpha (annualised)" value={fmtPct(alphaAnn, 2)} tone={signTone(alphaAnn)} sub={`t = ${res.t[0].toFixed(1)} · p = ${res.p[0].toFixed(3)}`} />
        <Kpi label="Market beta" value={res.beta[1].toFixed(2)} sub={`t = ${res.t[1].toFixed(1)} · ${sig(res.p[1]) || "n.s."}`} />
        <Kpi label="R²" value={res.r2.toFixed(2)} tone="text-blue-400" sub={`Adjusted ${res.adjR2.toFixed(2)}`} />
        <Kpi label="Observations" value={fmtInt(res.n)} sub={`${freq.toLowerCase()} · ${model.toLowerCase()}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Factor exposure (betas)" subtitle={`${model} · ${freq.toLowerCase()} returns`} info="Regression coefficients of the run's returns on each factor. Faded bars are not statistically significant at the 5% level." icon={BarChart3} tone="blue">
          <div className="h-60" aria-label="Factor betas"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={names.map((n, k) => ({ name: label(n).replace(/ \(.*\)/, ""), beta: Number(res.beta[k + 1].toFixed(3)), p: res.p[k + 1] }))} margin={{ top: 14, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="name" {...AXIS_PROPS} interval={0} tick={{ fontSize: 9, fill: "#64748b" }} /><YAxis {...AXIS_PROPS} /><ReferenceLine y={0} stroke="#475569" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${Number(v).toFixed(3)} (p = ${p.payload.p.toFixed(3)})`, "Beta"]} />
              <Bar dataKey="beta" radius={[3, 3, 0, 0]} isAnimationActive={false} label={{ position: "top", fontSize: 10, fill: "#cbd5e1", formatter: (v: any) => Number(v).toFixed(2) }}>
                {names.map((n, k) => <Cell key={n} fill={col(n)} fillOpacity={res.p[k + 1] < 0.05 ? 1 : 0.35} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </Card>
        <Card title="Where the variance comes from" subtitle="Share of return variance" info="Each factor's contribution to the variance of the run's returns (beta × covariance with the factor ÷ variance), and the part no factor explains." icon={Sigma} tone="purple">
          <div className="h-60" aria-label="Variance shares"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...names.map((n, k) => ({ name: label(n).replace(/ \(.*\)/, ""), v: Number(shares.factor[k].toFixed(1)), key: n })), { name: "Unexplained", v: Number(shares.residual.toFixed(1)), key: "RES" }]} margin={{ top: 14, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="name" {...AXIS_PROPS} interval={0} tick={{ fontSize: 9, fill: "#64748b" }} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><ReferenceLine y={0} stroke="#475569" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
              <Bar dataKey="v" radius={[3, 3, 0, 0]} isAnimationActive={false}>{[...names, "RES"].map((n) => <Cell key={n} fill={n === "RES" ? "#475569" : col(n)} />)}</Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </Card>
      </div>

      <Card title="Regression detail" subtitle="Ordinary least squares with standard errors" info="One row per term. t is the coefficient divided by its standard error; p is the two-sided probability of seeing it by chance if the true loading were zero. *, ** and *** mark 5%, 1% and 0.1%." icon={Activity} tone="emerald">
        <div className="w-full overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-left text-xs" aria-label="Factor regression">
          <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">Term</th><th className="py-1.5 text-right">Coefficient</th><th className="py-1.5 text-right">Std. error</th><th className="py-1.5 text-right">t</th><th className="py-1.5 text-right">p</th><th className="py-1.5 text-right">Variance share</th></tr></thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            <tr><td className="py-2 font-sans font-medium text-slate-200">Alpha (per period)</td><td className={cn("py-2 text-right", signTone(res.beta[0]))}>{(res.beta[0] * 100).toFixed(4)}%</td><td className="py-2 text-right text-slate-400">{(res.se[0] * 100).toFixed(4)}%</td><td className="py-2 text-right text-slate-300">{res.t[0].toFixed(2)}</td><td className="py-2 text-right text-slate-300">{res.p[0].toFixed(3)}{sig(res.p[0])}</td><td className="py-2 text-right text-slate-500">—</td></tr>
            {names.map((n, k) => (
              <tr key={n}><td className="py-2 font-sans font-medium text-slate-200">{label(n)}</td><td className={cn("py-2 text-right", signTone(res.beta[k + 1]))}>{res.beta[k + 1].toFixed(3)}</td><td className="py-2 text-right text-slate-400">{res.se[k + 1].toFixed(3)}</td><td className="py-2 text-right text-slate-300">{res.t[k + 1].toFixed(2)}</td><td className={cn("py-2 text-right", res.p[k + 1] < 0.05 ? "font-semibold text-emerald-300" : "text-slate-300")}>{res.p[k + 1].toFixed(3)}{sig(res.p[k + 1])}</td><td className="py-2 text-right text-slate-300">{fmtPct(shares.factor[k], 1, false)}</td></tr>
            ))}
            <tr><td className="py-2 font-sans text-slate-400">Unexplained</td><td colSpan={4} /><td className="py-2 text-right text-slate-300">{fmtPct(shares.residual, 1, false)}</td></tr>
          </tbody>
        </table></div>
      </Card>

      {rolling.length > 1 && (
        <Card title="Rolling betas" subtitle={`${win}-observation window`} info="How the loadings moved over time. Wide swings mean the strategy's factor character is unstable." icon={Activity} tone="blue">
          <div className="h-56" aria-label="Rolling betas"><ResponsiveContainer width="100%" height="100%"><LineChart data={rolling} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} /><ReferenceLine y={0} stroke="#475569" />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => Number(v).toFixed(2)} /><Legend wrapperStyle={{ fontSize: 10 }} />
            {names.map((n) => <Line key={n} dataKey={n} name={label(n)} stroke={col(n)} strokeWidth={1.6} dot={false} isAnimationActive={false} />)}
          </LineChart></ResponsiveContainer></div>
        </Card>
      )}
    </div>
  );
}
