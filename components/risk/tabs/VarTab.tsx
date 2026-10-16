"use client";

import React, { useMemo, useState } from "react";
import {
  ShieldAlert, Activity, LineChart as LineIcon, Table2, PieChart as PieIcon, Target, AlertTriangle, Timer, Scale, FlaskConical, Sigma,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell, ReferenceLine, ComposedChart,
} from "recharts";
import { useRisk } from "@/lib/risk/context";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import SparkKpi from "../ui/SparkKpi";
import { Segmented } from "../ui/controls";
import { ReturnHistogram } from "../ui/charts";
import { VAR_METHODS, VarMethod, varEs, varTable, backtestVar, CONFIDENCES } from "@/lib/risk/var";
import { componentVar, extremeEvents, horizonScaling, marketVsSpecific, qqPoints, rolling, tailComparison, varVsConfidence } from "@/lib/risk/tail";
import { CONFIDENCE_LABEL, MARKET_DEFAULTS } from "@/lib/risk/presets";
import { fmtMoney } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

const COLORS: Record<string, string> = { Parametric: "#2563EB", Historical: "#DC2626", "Monte Carlo": "#7C3AED", "Cornish-Fisher": "#D97706" };
const pctNeg = (v: number) => fmtPct(-v * 100);

export default function VarTab() {
  const { result, settings, source, currency } = useRisk();
  const conf = settings.confidence, hz = settings.horizon, value = settings.positionValue;
  const c = CONFIDENCE_LABEL(conf);
  const [distMethod, setDistMethod] = useState<VarMethod>("Parametric");
  const [rollMethod, setRollMethod] = useState<"Parametric" | "Historical" | "Cornish-Fisher">("Historical");
  const [vsBench, setVsBench] = useState<"VaR" | "ES">("VaR");
  const [tailTab, setTailTab] = useState<"QQ Plot" | "Tail Comparison">("QQ Plot");
  const [scale, setScale] = useState<"Square root of time" | "Monte Carlo">("Square root of time");
  const [btTab, setBtTab] = useState<"Exceptions" | "Cumulative" | "Test Statistics">("Exceptions");
  const [esTab, setEsTab] = useState<"ES Distribution" | "Tail Losses">("ES Distribution");

  const r = result!;
  const rets = r.returns;
  const winRoll = Math.min(250, Math.max(30, Math.floor(rets.length / 3)));

  const each = useMemo(() => VAR_METHODS.map((m) => ({ m, ...varEs(rets, conf, m, hz) })), [rets, conf, hz]);
  const table = useMemo(() => varTable(rets, hz), [rets, hz]);
  const dist = useMemo(() => ({ a: varEs(rets, conf, distMethod, 1), b: varEs(rets, 0.99, distMethod, 1) }), [rets, conf, distMethod]);
  const rollP = useMemo(() => rolling(rets, r.dates, winRoll, conf, rollMethod), [rets, r.dates, winRoll, conf, rollMethod]);
  const rollB = useMemo(() => rolling(r.benchReturns, r.dates, winRoll, conf, "Historical"), [r, winRoll, conf]);
  const byConf = useMemo(() => varVsConfidence(rets, hz), [rets, hz]);
  const scaling = useMemo(() => horizonScaling(rets, conf), [rets, conf]);
  const comp = useMemo(() => componentVar(r, conf, value), [r, conf, value]);
  const split = useMemo(() => marketVsSpecific(r), [r]);
  const qq = useMemo(() => qqPoints(rets), [rets]);
  const tails = useMemo(() => tailComparison(rets), [rets]);
  const events = useMemo(() => extremeEvents(r, value, 5), [r, value]);
  const bt = useMemo(() => backtestVar(rets, r.dates, conf, Math.min(250, Math.max(30, Math.floor(rets.length / 3)))), [rets, r.dates, conf]);
  const es = varEs(rets, conf, "Historical", 1);
  const worst = useMemo(() => [...rets].sort((a, b) => a - b).slice(0, Math.max(5, Math.round(rets.length * (1 - conf)))), [rets, conf]);

  const kpiTrend = useMemo(() => rolling(rets, r.dates, winRoll, conf, "Historical").filter((_, i, a) => i % Math.max(1, Math.ceil(a.length / 50)) === 0).map((x) => x.var), [rets, r.dates, winRoll, conf]);
  const hzLabel = `${hz} day${hz > 1 ? "s" : ""}`;
  const totalReturn = (r.value[r.value.length - 1] / r.value[0] - 1) * 100;
  const rollSeries = rollP.map((p, i) => ({ date: p.date, "Portfolio VaR": p.var, "Portfolio ES": p.es, Benchmark: vsBench === "VaR" ? rollB[i]?.var : rollB[i]?.es, Portfolio: vsBench === "VaR" ? p.var : p.es }));
  const bench = MARKET_DEFAULTS[source.market].benchmarkLabel.split(" (")[0];
  const cumExc = bt ? bt.rows.reduce<{ date: string; actual: number; expected: number }[]>((acc, row, i) => { acc.push({ date: row.date, actual: (acc[i - 1]?.actual ?? 0) + (row.hit ? 1 : 0), expected: (i + 1) * (1 - conf) }); return acc; }, []) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {each.map((e) => (
          <SparkKpi key={e.m} label={`${e.m} VaR (${c}, ${hz}D)`} value={pctNeg(e.var)} amount={`-${fmtMoney(e.var * value, currency)}`} tone="text-rose-400" data={e.m === "Historical" ? kpiTrend : undefined} color="#EF4444" />
        ))}
        <SparkKpi label={`Expected shortfall (${c}, 1D)`} value={pctNeg(es.es)} amount={`-${fmtMoney(es.es * value, currency)}`} tone="text-rose-400" data={kpiTrend} color="#EF4444" />
        <SparkKpi label="Current portfolio value" value={fmtMoney(r.value[r.value.length - 1], currency)} sub={<span className={signTone(totalReturn)}>{fmtPct(totalReturn)} over window</span>} hint="Value of the basket at the end of the window, starting from the position value you entered." />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card title="Returns distribution & VaR" subtitle={`${distMethod} · ${c} and 99% markers`} info="Histogram of daily returns with the normal curve fitted to the same mean and volatility. Markers show VaR at your confidence level and at 99% for the chosen method." icon={Activity} tone="blue"
            action={<Segmented value={distMethod} options={VAR_METHODS} onChange={setDistMethod} size="sm" />}>
            <ReturnHistogram returns={rets} fit marks={[{ x: -dist.a.var * 100, label: `VaR ${c}`, color: "#EF4444" }, { x: -dist.b.var * 100, label: "VaR 99%", color: "#F59E0B" }]} />
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title={`Rolling VaR (${c})`} subtitle={`${winRoll}-day window`} info="VaR recomputed on a sliding window, so you can see how tail risk changed through time." icon={LineIcon} tone="purple"
            action={<Segmented value={rollMethod} options={["Parametric", "Historical", "Cornish-Fisher"] as const} onChange={setRollMethod} size="sm" />}>
            <div className="h-56">
              {rollP.length > 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rollSeries} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), ""]} />
                    <Line dataKey="Portfolio VaR" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line dataKey="Portfolio ES" stroke="#DC2626" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={LineIcon} title="Window too short" hint="Need more history than the rolling window." />}
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="VaR by confidence level" subtitle={`${hzLabel} horizon · all methods`} info="How the loss threshold grows as you demand more confidence. Method gaps widen in the tail where the normal assumption breaks down." icon={Scale} tone="amber">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byConf} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="conf" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), ""]} labelFormatter={(l) => `Confidence ${l}%`} />
                  {VAR_METHODS.map((m) => <Line key={m} dataKey={m} stroke={COLORS[m]} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />)}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card title="Method comparison" subtitle={`${hzLabel} horizon · loss as % of portfolio`} info="VaR at four confidence levels for each method, and the Expected Shortfall at your chosen confidence. Parametric assumes normal returns; Cornish-Fisher adjusts for skew and kurtosis; Monte Carlo bootstraps your own returns." icon={Table2} tone="blue">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Method</th>{CONFIDENCES.map((x) => <th key={x} className="py-1.5 text-right">VaR {CONFIDENCE_LABEL(x)}</th>)}<th className="py-1.5 text-right">ES {c}</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50">
                  {table.map((row) => (
                    <tr key={row.method} className="transition-colors hover:bg-slate-800/30">
                      <td className="py-2 font-medium text-slate-200">{row.method}</td>
                      {row.cells.map((cell) => <td key={cell.conf} className={cn("py-2 text-right font-mono", cell.conf === conf ? "font-bold text-rose-400" : "text-rose-400/80")}>{pctNeg(cell.var)}</td>)}
                      <td className="py-2 text-right font-mono font-semibold text-rose-400">{pctNeg(varEs(rets, conf, row.method, hz).es)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-3">
          <Card title="VaR breakdown" subtitle="Market vs stock-specific" info="Share of return variance explained by the benchmark (R² of the portfolio on the benchmark) versus the remainder. Sector and currency splits are not shown because they cannot be estimated reliably from this data." icon={PieIcon} tone="rose">
            <div className="grid grid-cols-2 items-center gap-2">
              <div className="relative h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={[{ name: "Market risk", v: split.systematic }, { name: "Stock-specific risk", v: split.idiosyncratic }]} dataKey="v" innerRadius="62%" outerRadius="92%" stroke="none" paddingAngle={2} isAnimationActive={false}><Cell fill="#2563EB" /><Cell fill="#DC2626" /></Pie><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v), 1, false), ""]} /></PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><div className="text-[10px] text-slate-400">Total VaR</div><div className="font-mono text-sm font-bold text-white">{pctNeg(varEs(rets, conf, "Parametric", 1).var)}</div></div>
              </div>
              <ul className="space-y-2 text-[11px]">
                <li className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-blue-600" />Market</span><span className="font-mono font-semibold text-white">{fmtPct(split.systematic, 1, false)}</span></li>
                <li className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-red-600" />Specific</span><span className="font-mono font-semibold text-white">{fmtPct(split.idiosyncratic, 1, false)}</span></li>
              </ul>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="VaR contribution by asset" subtitle={`Parametric component VaR · ${c}`} info="Each holding's share of portfolio VaR (weight × marginal risk ÷ total), with the loss amount. Shares sum to 100%." icon={Target} tone="amber">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comp.map((x) => ({ name: x.ticker.replace(".NS", ""), share: Number(x.share.toFixed(2)), amount: x.amount })).sort((a, b) => b.share - a.share)} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} horizontal={false} vertical /><XAxis type="number" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><YAxis type="category" dataKey="name" {...AXIS_PROPS} width={72} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any, p: any) => [`${fmtPct(Number(v), 1, false)} · ${fmtMoney(p.payload.amount, currency)}`, "Share of VaR"]} />
                  <Bar dataKey="share" radius={[0, 3, 3, 0]} isAnimationActive={false}>{comp.map((x, i) => <Cell key={x.ticker} fill={seriesColor(i)} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card title="Tail risk analysis" subtitle="How fat are the tails?" info="QQ plot: points on the red line mean normally distributed returns; points curling below it in the left tail mean more extreme losses than a normal model predicts. Tail comparison counts observed vs expected days beyond k standard deviations." icon={FlaskConical} tone="purple"
            action={<Segmented value={tailTab} options={["QQ Plot", "Tail Comparison"] as const} onChange={setTailTab} size="sm" />}>
            <div className="h-52">
              {tailTab === "QQ Plot" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 8, left: -10, bottom: 14 }}>
                    <CartesianGrid {...GRID_PROPS} vertical /><XAxis type="number" dataKey="theoretical" name="Theoretical" {...AXIS_PROPS} label={{ value: "Theoretical quantiles", position: "insideBottom", offset: -8, fill: "#64748b", fontSize: 10 }} /><YAxis type="number" dataKey="empirical" name="Empirical" {...AXIS_PROPS} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => Number(v).toFixed(2)} />
                    <ReferenceLine segment={[{ x: -4, y: -4 }, { x: 4, y: 4 }]} stroke="#EF4444" strokeDasharray="4 3" />
                    <Scatter data={qq.filter((_, i) => i % Math.max(1, Math.floor(qq.length / 300)) === 0 || i < 8 || i > qq.length - 9)} fill="#3B82F6" isAnimationActive={false} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tails} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}><CartesianGrid {...GRID_PROPS} /><XAxis dataKey="level" {...AXIS_PROPS} /><YAxis {...AXIS_PROPS} allowDecimals={false} /><Tooltip contentStyle={TOOLTIP_STYLE} /><Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="observed" name="Observed days" fill="#DC2626" radius={[3, 3, 0, 0]} isAnimationActive={false} /><Bar dataKey="expected" name="Expected (normal)" fill="#64748B" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Extreme loss events" subtitle="Five worst days in the window" info="The largest single-day losses with the loss in currency terms on your position value." icon={AlertTriangle} tone="rose">
            <table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Date</th><th className="py-1.5 text-right">Daily return</th><th className="py-1.5 text-right">Portfolio loss</th></tr></thead>
              <tbody className="divide-y divide-slate-800/50">
                {events.map((e) => <tr key={e.date} className="transition-colors hover:bg-slate-800/30"><td className="py-2 font-mono text-slate-300">{e.date}</td><td className="py-2 text-right font-mono font-semibold text-rose-400">{fmtPct(e.ret * 100)}</td><td className="py-2 text-right font-mono text-rose-400">-{fmtMoney(e.loss, currency)}</td></tr>)}
              </tbody>
            </table>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Time horizon scaling" subtitle={`VaR ${c} across holding periods`} info="Square-root-of-time scaling assumes independent daily returns. The Monte Carlo view compounds resampled days, so it captures path effects the √t rule ignores." icon={Timer} tone="amber"
            action={<Segmented value={scale} options={["Square root of time", "Monte Carlo"] as const} onChange={setScale} size="sm" />}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scaling} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="horizon" {...AXIS_PROPS} tickFormatter={(v) => `${v}D`} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), ""]} labelFormatter={(l) => `${l} day horizon`} />
                  {scale === "Square root of time" ? (<><Line dataKey="Parametric" stroke={COLORS.Parametric} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} /><Line dataKey="Historical" stroke={COLORS.Historical} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} /></>) : (<><Line dataKey="Monte Carlo" stroke={COLORS["Monte Carlo"]} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} /><Line dataKey="Historical" name="Historical (√t)" stroke={COLORS.Historical} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} /></>)}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <Card title="Portfolio vs benchmark" subtitle={`Rolling historical ${vsBench} vs ${bench}`} info="The same rolling window applied to the benchmark's returns, so you can see whether the portfolio carries more or less tail risk than the market." icon={LineIcon} tone="blue"
            action={<Segmented value={vsBench} options={["VaR", "ES"] as const} onChange={setVsBench} size="sm" />}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rollSeries} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), ""]} />
                  <Line dataKey="Portfolio" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} /><Line dataKey="Benchmark" name={bench} stroke="#DC2626" strokeWidth={1.5} dot={false} isAnimationActive={false} /><Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Expected shortfall analysis" subtitle={`ES ${c}: ${pctNeg(es.es)}`} info="Distribution view marks VaR and ES on the daily-return histogram. Tail losses lists the worst days that make up the ES average." icon={Sigma} tone="purple"
            action={<Segmented value={esTab} options={["ES Distribution", "Tail Losses"] as const} onChange={setEsTab} size="sm" />}>
            {esTab === "ES Distribution" ? (
              <ReturnHistogram returns={rets} height={208} color="#7C3AED" fit marks={[{ x: -es.var * 100, label: "VaR", color: "#EF4444" }, { x: -es.es * 100, label: "ES", color: "#F59E0B" }]} />
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={worst.slice(0, 25).map((x, i) => ({ i: i + 1, loss: Number((x * 100).toFixed(2)) }))} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="i" {...AXIS_PROPS} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), "Loss"]} labelFormatter={(l) => `Rank ${l} worst day`} />
                    <ReferenceLine y={-es.es * 100} stroke="#F59E0B" strokeDasharray="4 3" /><Bar dataKey="loss" fill="#DC2626" radius={[0, 0, 3, 3]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="VaR backtesting" subtitle={`Historical VaR ${c}, ${bt ? Math.min(250, Math.max(30, Math.floor(rets.length / 3))) : "—"}-day window`} info="Each day's return is compared with the VaR estimated from the preceding window. Kupiec tests whether the exception rate matches 1 − confidence; Christoffersen tests whether exceptions cluster. p-values above 0.05 mean the model is not rejected." icon={ShieldAlert} tone="amber"
            action={<Segmented value={btTab} options={["Exceptions", "Cumulative", "Test Statistics"] as const} onChange={setBtTab} size="sm" />}>
            {!bt ? <EmptyState icon={ShieldAlert} title="Not enough history to backtest" hint="Needs at least ~30 observations beyond the estimation window; widen the date range." /> : btTab === "Test Statistics" ? (
              <table className="w-full border-collapse text-xs"><tbody className="divide-y divide-slate-800/50">
                {([["Observations", fmtInt(bt.T), ""], ["Exceptions", fmtInt(bt.exceptions), ""], ["Exception rate", fmtPct(bt.rate * 100, 2, false), Math.abs(bt.rate - bt.expectedRate) > 0.02 ? "text-rose-400" : "text-emerald-400"], ["Expected rate", fmtPct(bt.expectedRate * 100, 2, false), ""], ["Kupiec p-value", bt.kupiecP.toFixed(3), bt.kupiecP < 0.05 ? "text-rose-400" : "text-emerald-400"], ["Christoffersen p-value", bt.christoffersenP.toFixed(3), bt.christoffersenP < 0.05 ? "text-rose-400" : "text-emerald-400"]] as [string, string, string][]).map(([k, v, t]) => (
                  <tr key={k}><td className="py-2 text-slate-400">{k}</td><td className={cn("py-2 text-right font-mono font-semibold", t || "text-white")}>{v}</td></tr>
                ))}</tbody></table>
            ) : btTab === "Cumulative" ? (
              <div className="h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={cumExc} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}><CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} allowDecimals={false} /><Tooltip contentStyle={TOOLTIP_STYLE} /><Line dataKey="actual" name="Actual exceptions" stroke="#DC2626" strokeWidth={2} dot={false} isAnimationActive={false} /><Line dataKey="expected" name="Expected" stroke="#64748B" strokeDasharray="4 3" dot={false} isAnimationActive={false} /><Legend wrapperStyle={{ fontSize: 11 }} /></LineChart></ResponsiveContainer></div>
            ) : (
              <div className="h-52"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={bt.rows.map((x) => ({ date: x.date, ret: x.ret * 100, var: -x.var * 100, hit: x.hit ? x.ret * 100 : null }))} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}><CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), ""]} /><Line dataKey="ret" name="Return" stroke="#3B82F6" strokeWidth={1} dot={false} isAnimationActive={false} /><Line dataKey="var" name="-VaR" stroke="#EF4444" strokeWidth={1.5} dot={false} isAnimationActive={false} /><Scatter dataKey="hit" name="Exception" fill="#F59E0B" isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
