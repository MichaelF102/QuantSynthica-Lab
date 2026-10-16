"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Sigma, BarChart3, LineChart as LineIcon, PieChart as PieIcon, Table2, Target, Activity, Grid3x3, ListOrdered, Info, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ReferenceLine, Legend } from "recharts";
import { useRisk } from "@/lib/risk/context";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import SparkKpi from "../ui/SparkKpi";
import { Segmented } from "../ui/controls";
import { HeatmapMatrix } from "../ui/charts";
import { FactorData, loadFactorData, ols, resample, riskShares, rollingBetas, subsetAttribution, tailMask } from "@/lib/risk/factors";
import { corrMatrixOf } from "@/lib/risk/correlation";
import { varEs } from "@/lib/risk/var";
import { CONFIDENCE_LABEL } from "@/lib/risk/presets";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

const PPY = { Daily: 252, Weekly: 52, Monthly: 12 } as const;
const sig = (p: number) => (p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : "");

export default function FactorTab() {
  const { result, settings, source } = useRisk();
  const r = result!;
  const [fd, setFd] = useState<FactorData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState<string | null>(null);
  const [retTab, setRetTab] = useState<"Factor Returns" | "Rolling Betas" | "Cumulative Contribution">("Factor Returns");
  const [riskTab, setRiskTab] = useState<"Risk Contribution" | "Volatility Points">("Risk Contribution");
  const [attrTab, setAttrTab] = useState<"Total Risk" | "Downside Risk" | "Expected Shortfall">("Total Risk");
  const [rollKey, setRollKey] = useState("");
  const freq = settings.frequency, ppy = PPY[freq], conf = settings.confidence;

  useEffect(() => {
    let live = true;
    setState("loading"); setErr(null);
    loadFactorData(source.market, r.dates, settings.start, settings.end)
      .then((d) => { if (live) { setFd(d); setState("ready"); } })
      .catch((e) => { if (live) { setErr(e?.message || "Could not load factor data"); setState("error"); } });
    return () => { live = false; };
  }, [r, source.market, settings.start, settings.end]);

  const model = useMemo(() => {
    if (!fd) return null;
    const useF = settings.factorModel === "CAPM" ? fd.factors.filter((f) => f.def.key === "MKT") : fd.factors;
    if (!useF.length || !useF.some((f) => f.def.key === "MKT")) return { error: "The market factor has no price history for this window." } as const;
    const pm = new Map(r.dates.slice(1).map((d, i) => [d, r.returns[i]]));
    const y0 = fd.dates.map((d) => pm.get(d)!);
    const rs = resample(fd.dates, [y0, ...useF.map((f) => f.ret)], freq);
    const [y, ...X] = rs.series;
    try {
      const names = useF.map((f) => f.def.key);
      const fit = ols(y, X, names);
      const shares = riskShares(y, X, fit);
      const win = freq === "Daily" ? 120 : freq === "Weekly" ? 52 : 24;
      return { y, X, dates: rs.dates, useF, names, fit, shares, rolling: rollingBetas(y, X, names, rs.dates, win), win };
    } catch (e: any) { return { error: e?.message || "Regression failed" } as const; }
  }, [fd, r, settings.factorModel, freq]);

  if (state === "loading") return <div className="flex items-center gap-2 py-10 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading factor proxies…</div>;
  if (state === "error" || !fd) return <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{err}</div>;
  if (!model || "error" in model) return <EmptyState icon={Sigma} title="Factor regression unavailable" hint={model && "error" in model ? model.error : ""} />;

  const { y, X, dates, useF, names, fit, shares, rolling } = model;
  const label = (k: string) => useF.find((f) => f.def.key === k)?.def.label ?? k;
  const col = (k: string) => seriesColor(["MKT", "SIZE", "VALUE", "MOM", "QUAL", "LOWVOL"].indexOf(k));
  const cum = (a: number[]) => a.reduce<number[]>((acc, v) => (acc.push((acc.length ? acc[acc.length - 1] : 1) * (1 + v)), acc), []).map((v) => (v - 1) * 100);
  const cumPort = cum(y);
  const rollKeyEff = names.includes(rollKey) ? rollKey : names[0];
  const alphaAnn = fit.beta[0] * ppy * 100;
  const varP = varEs(r.returns, conf, "Parametric", 1).var * 100;

  const retData = dates.map((d, i) => { const row: Record<string, number | string> = { date: d, Portfolio: cumPort[i] }; if (retTab === "Cumulative Contribution") { names.forEach((n, k) => (row[n] = 0)); } return row; });
  const factorCum = X.map((x) => cum(x));
  const contribCum = X.map((x, k) => cum(x.map((v) => fit.beta[k + 1] * v)));
  const retRows = dates.map((d, i) => { const row: Record<string, number | string> = { date: d, Portfolio: cumPort[i] }; names.forEach((n, k) => (row[n] = retTab === "Factor Returns" ? factorCum[k][i] : contribCum[k][i])); return row; });
  void retData;
  const thin = <T,>(a: T[], max = 220) => a.filter((_, i) => i % Math.max(1, Math.ceil(a.length / max)) === 0);

  const attr = (() => {
    if (attrTab === "Total Risk") return { rows: [...names.map((n, k) => ({ name: label(n), v: shares.factor[k] })), { name: "Residual", v: shares.residual }], unit: "% of variance" };
    const mask = attrTab === "Downside Risk" ? y.map((v) => v < 0) : tailMask(y, conf);
    const a = subsetAttribution(y, X, fit, mask);
    if (!a) return { rows: [], unit: "" };
    return { rows: [...names.map((n, k) => ({ name: label(n), v: a.factor[k] * 100 })), { name: "Alpha & residual", v: (a.other) * 100 }], unit: `mean % per ${freq === "Daily" ? "day" : freq === "Weekly" ? "week" : "month"} on ${a.n} ${attrTab === "Downside Risk" ? "down" : "tail"} periods` };
  })();

  const donut = [...names.map((n, k) => ({ name: label(n), value: Math.max(0, shares.factor[k]), raw: shares.factor[k] })), { name: "Residual", value: shares.residual, raw: shares.residual }].filter((x) => x.value > 0.0001);
  const kpiFactors = names.filter((n) => n !== "MKT").slice(0, 3);
  const sparkFor = (n: string) => thin(rolling.map((x) => x[n] as number), 50);

  return (
    <div className="space-y-4">
      <div role="note" className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Factors are <b>tradable ETF/index proxies</b> (long-short pairs such as Midcap ETF − Nifty 50 ETF), not the academic Fama-French series, and the market factor is excess of 0%. Quality-minus-junk style profitability and investment (RMW, CMA) factors cannot be built from ETFs and are not shown.{fd.excluded.length > 0 && <> Not enough history in this window for: {fd.excluded.map((e) => `${e.def.label} (${e.reason})`).join("; ")}.</>}</span>
      </div>
      {fd.synthetic.length > 0 && <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"><span className="mr-2 font-mono font-bold uppercase">Synthetic data</span>{fd.synthetic.join(", ")} could not be fetched; generated prices were used.</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SparkKpi label="Market beta (β)" value={fit.beta[1].toFixed(2)} tone="text-white" data={sparkFor("MKT")} color="#10B981" sub={`t = ${fit.t[1].toFixed(1)}`} />
        {kpiFactors.map((n) => { const k = names.indexOf(n) + 1; return <SparkKpi key={n} label={label(n)} value={fit.beta[k].toFixed(2)} tone={signTone(fit.beta[k])} data={sparkFor(n)} color={fit.beta[k] >= 0 ? "#3B82F6" : "#EF4444"} sub={`p = ${fit.p[k].toFixed(3)}${sig(fit.p[k])}`} />; })}
        {Array.from({ length: 3 - kpiFactors.length }).map((_, i) => <SparkKpi key={`na${i}`} label="Factor unavailable" value="—" sub="No history in window" />)}
        <SparkKpi label="Alpha (annualised)" value={fmtPct(alphaAnn, 2)} tone={signTone(alphaAnn)} sub={`p = ${fit.p[0].toFixed(3)}`} hint="Intercept of the regression, × periods per year" />
        <SparkKpi label="Model R²" value={fit.r2.toFixed(2)} sub={`Adj. ${fit.adjR2.toFixed(2)} · n = ${fmtInt(fit.n)}`} tone="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Factor exposure (betas)" subtitle={`${settings.factorModel} · ${freq.toLowerCase()} returns`} info="Regression coefficients of portfolio returns on each factor. Faded bars are not statistically significant at 5%." icon={BarChart3} tone="blue">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={names.map((n, k) => ({ name: label(n).replace(/ \(.*\)/, ""), key: n, beta: Number(fit.beta[k + 1].toFixed(3)), p: fit.p[k + 1] }))} margin={{ top: 14, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="name" {...AXIS_PROPS} interval={0} tick={{ fontSize: 9, fill: "#64748b" }} /><YAxis {...AXIS_PROPS} /><ReferenceLine y={0} stroke="#475569" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, _n: any, p: any) => [`${Number(v).toFixed(3)} (p = ${p.payload.p.toFixed(3)})`, "Beta"]} />
                  <Bar dataKey="beta" radius={[3, 3, 0, 0]} isAnimationActive={false} label={{ position: "top", fontSize: 10, fill: "#cbd5e1", formatter: (v: any) => Number(v).toFixed(2) }}>
                    {names.map((n, k) => <Cell key={n} fill={col(n)} fillOpacity={fit.p[k + 1] < 0.05 ? 1 : 0.35} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-7">
          <Card title="Factor returns vs portfolio sensitivity" subtitle="Cumulative, %" info="Factor Returns: cumulative return of each factor and the portfolio. Rolling Betas: how exposures moved. Cumulative Contribution: running sum of β × factor return, i.e. what each factor added to the portfolio." icon={LineIcon} tone="purple"
            action={<Segmented value={retTab} options={["Factor Returns", "Rolling Betas", "Cumulative Contribution"] as const} onChange={setRetTab} size="sm" />}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {retTab === "Rolling Betas" ? (
                  <LineChart data={rolling} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} /><ReferenceLine y={0} stroke="#475569" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => Number(v).toFixed(2)} />
                    {names.map((n) => <Line key={n} dataKey={n} name={label(n)} stroke={col(n)} strokeWidth={1.8} dot={false} isAnimationActive={false} />)}<Legend wrapperStyle={{ fontSize: 10 }} />
                  </LineChart>
                ) : (
                  <LineChart data={thin(retRows)} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(v)}%`} /><ReferenceLine y={0} stroke="#475569" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v), 1)} />
                    {names.map((n) => <Line key={n} dataKey={n} name={label(n)} stroke={col(n)} strokeWidth={1.5} dot={false} isAnimationActive={false} />)}
                    {retTab === "Factor Returns" && <Line dataKey="Portfolio" stroke="#F1F5F9" strokeWidth={2.5} dot={false} isAnimationActive={false} />}<Legend wrapperStyle={{ fontSize: 10 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card title="Factor contribution to portfolio risk" subtitle="Share of return variance" info="Exact decomposition of portfolio variance: β_f × Cov(factor_f, portfolio) ÷ Var(portfolio) for each factor, plus the residual (1 − R²). Negative contributions hedge risk and are omitted from the donut." icon={PieIcon} tone="rose"
            action={<Segmented value={riskTab} options={["Risk Contribution", "Volatility Points"] as const} onChange={setRiskTab} size="sm" />}>
            <div className="grid grid-cols-2 items-center gap-2">
              <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={donut} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false}>{donut.map((d, i) => <Cell key={d.name} fill={d.name === "Residual" ? "#475569" : col(names.find((n) => label(n) === d.name) ?? "")} />)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v), 1, false)} /></PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><div className="text-[10px] text-slate-400">Total risk</div><div className="font-mono text-sm font-bold text-white">{fmtPct(shares.portVolAnn * Math.sqrt(252 / ppy), 1, false)}</div><div className="text-[9px] text-slate-500">annualised vol</div></div>
              </div>
              <ul className="space-y-1.5 text-[11px]">
                {[...names.map((n, k) => ({ n: label(n), v: shares.factor[k], c: col(n) })), { n: "Residual", v: shares.residual, c: "#475569" }].map((x) => <li key={x.n} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5 text-slate-300"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: x.c }} /><span className="truncate">{x.n.replace(/ \(.*\)/, "")}</span></span><span className="font-mono font-semibold text-white">{riskTab === "Risk Contribution" ? fmtPct(x.v, 1, false) : fmtPct((x.v / 100) * shares.portVolAnn, 2, false)}</span></li>)}
              </ul>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-5">
          <Card title="Factor regression results" subtitle={`OLS · n = ${fmtInt(fit.n)} · R² ${fit.r2.toFixed(3)}`} info="Ordinary least squares of portfolio returns on the factors with an intercept. p-values are two-sided t-tests; * p<0.05, ** p<0.01, *** p<0.001." icon={Table2} tone="blue">
            <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Factor</th><th className="py-1.5 text-right">Coefficient (β)</th><th className="py-1.5 text-right">Std. error</th><th className="py-1.5 text-right">t-stat</th><th className="py-1.5 text-right">p-value</th></tr></thead>
              <tbody className="divide-y divide-slate-800/50">
                {fit.names.map((nm, i) => (
                  <tr key={nm} className="transition-colors hover:bg-slate-800/30">
                    <td className="py-2 text-slate-200">{nm === "Alpha" ? "Alpha (per period)" : label(nm)}</td>
                    <td className={cn("py-2 text-right font-mono font-semibold", signTone(fit.beta[i]))}>{fit.beta[i].toFixed(nm === "Alpha" ? 5 : 4)}</td>
                    <td className="py-2 text-right font-mono text-slate-300">{fit.se[i].toFixed(4)}</td><td className="py-2 text-right font-mono text-slate-300">{fit.t[i].toFixed(2)}</td>
                    <td className={cn("py-2 text-right font-mono", fit.p[i] < 0.05 ? "font-bold text-emerald-400" : "text-slate-400")}>{fit.p[i].toFixed(3)}{sig(fit.p[i])}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="Factor sensitivity (marginal VaR)" subtitle={`Parametric VaR ${CONFIDENCE_LABEL(conf)} by factor`} info="Each factor's share of the total parametric 1-day VaR, from the variance decomposition. Negative values reduce VaR (hedges)." icon={Target} tone="amber">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={names.map((n, k) => ({ name: label(n).replace(/ \(.*\)/, ""), v: Number(((shares.factor[k] / 100) * varP).toFixed(3)) }))} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} horizontal={false} vertical /><XAxis type="number" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><YAxis type="category" dataKey="name" {...AXIS_PROPS} width={64} /><ReferenceLine x={0} stroke="#475569" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(-Number(v), 3), "VaR contribution"]} />
                  <Bar dataKey="v" radius={[0, 3, 3, 0]} isAnimationActive={false}>{names.map((n) => <Cell key={n} fill={col(n)} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Rolling factor exposures" subtitle={`${model.win}-${freq === "Daily" ? "day" : freq === "Weekly" ? "week" : "month"} window`} info="Rolling regression of the portfolio on all factors; one factor shown at a time with its window-average as a dashed line." icon={Activity} tone="purple"
            action={<Segmented value={rollKeyEff} options={names as readonly string[]} onChange={setRollKey} size="sm" />}>
            <div className="h-52">
              {rolling.length < 3 ? <EmptyState icon={Activity} title="Window too short" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rolling} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => Number(v).toFixed(2)} /><ReferenceLine y={fit.beta[names.indexOf(rollKeyEff) + 1]} stroke="#EF4444" strokeDasharray="4 3" />
                    <Line dataKey={rollKeyEff} name={label(rollKeyEff)} stroke={col(rollKeyEff)} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="mt-1 font-mono text-[10px] text-slate-500">Dashed = full-window beta</p>
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="Factor correlation matrix" subtitle="Correlation between factor returns" info="Correlation of the proxy factor returns. High values signal overlapping factors, which makes individual betas harder to separate." icon={Grid3x3} tone="rose">
            <HeatmapMatrix labels={names.map((n) => label(n).replace(/ \(.*\)/, "").slice(0, 8))} matrix={corrMatrixOf(X)} />
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Factor risk attribution" subtitle={attr.unit} info="Total Risk: share of variance. Downside / Expected Shortfall: average contribution of each factor (β × factor return) on the periods when the portfolio fell, or in its worst tail, plus alpha and residual." icon={ListOrdered} tone="amber"
            action={<Segmented value={attrTab} options={["Total Risk", "Downside Risk", "Expected Shortfall"] as const} onChange={setAttrTab} size="sm" />}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attr.rows.map((x) => ({ ...x, v: Number(x.v.toFixed(3)) }))} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} horizontal={false} vertical /><XAxis type="number" {...AXIS_PROPS} /><YAxis type="category" dataKey="name" {...AXIS_PROPS} width={80} tick={{ fontSize: 9, fill: "#64748b" }} /><ReferenceLine x={0} stroke="#475569" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [Number(v).toFixed(3), attrTab]} />
                  <Bar dataKey="v" radius={[0, 3, 3, 0]} isAnimationActive={false}>{attr.rows.map((x, i) => <Cell key={x.name} fill={i < names.length ? col(names[i]) : "#475569"} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
