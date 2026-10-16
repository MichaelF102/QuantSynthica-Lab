"use client";

import React, { useMemo, useState } from "react";
import {
  Search, X, ChevronDown, Columns, FileText, ArrowRight, LineChart as LineChartIcon, BarChart2,
  TrendingDown, Table2, Lightbulb, ArrowUpRight, ShieldAlert, GitFork,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, isNum, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import {
  AnalyticsFilters, CURRENCY_SYMBOL, Pt, benchmarkLabel, btPoints, runName, fmtMoney, mergeByDate, riskStats, seriesStats, windowPts,
} from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, seriesColor } from "@/lib/chartTheme";
import MoreMetricsModal from "./MoreMetricsModal";
import DetailedReportModal from "./DetailedReportModal";
import ColumnsModal from "./ColumnsModal";

interface Props {
  allBacktests: BacktestResult[];
  selectedIds: string[];
  onToggleStrategy: (id: string) => void;
  onClearAll: () => void;
  initialCapital: number;
  onInitialCapitalChange: (cap: number) => void;
  filters: AnalyticsFilters;
}

type ChartMode = "Equity Curve" | "Cumulative Return" | "Drawdown" | "Log Scale";
type RangeFilter = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";
const BENCH_KEY = "Benchmark";
const INPUT = "rounded-lg border border-slate-700/50 bg-[#0F172A]/70 text-xs text-slate-100 outline-none transition-colors hover:border-slate-600 focus:border-blue-500";

const COLUMNS = [
  { id: "strategy", label: "Strategy" }, { id: "asset", label: "Asset" }, { id: "total_return", label: "Total Return" },
  { id: "cagr", label: "CAGR" }, { id: "sharpe", label: "Sharpe" }, { id: "sortino", label: "Sortino" },
  { id: "max_dd", label: "Max DD" }, { id: "vol", label: "Volatility" }, { id: "alpha", label: "Alpha" }, { id: "beta", label: "Beta" },
];

function rangeStart(r: RangeFilter, lastDate: string): string | null {
  if (r === "ALL") return null;
  if (r === "YTD") return `${lastDate.slice(0, 4)}-01-01`;
  const d = new Date(lastDate + "T00:00:00Z");
  const months = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[r];
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

export default function AnalyticsOverviewTab({
  allBacktests, selectedIds, onToggleStrategy, onClearAll, initialCapital, onInitialCapitalChange, filters,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState("All");
  const [chartMode, setChartMode] = useState<ChartMode>("Equity Curve");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("ALL");
  const [ddId, setDdId] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [visibleCols, setVisibleCols] = useState<string[]>(["strategy", "asset", "total_return", "cagr", "sharpe", "sortino", "max_dd", "alpha", "beta"]);

  const selected = useMemo(() => allBacktests.filter((b) => selectedIds.includes(b.id)), [allBacktests, selectedIds]);
  const lead = selected[0] ?? null;
  const nameOf = (b: BacktestResult) => runName(b, allBacktests);
  const sym = CURRENCY_SYMBOL[filters.currency];

  // Global date window + frequency, further narrowed by the chart's own range chips.
  const ptsById = useMemo(() => {
    const out = new Map<string, Pt[]>();
    const last = selected.flatMap((b) => b.equity_curve.map((p) => p.date)).sort().pop();
    const rs = last ? rangeStart(rangeFilter, filters.end && filters.end < last ? filters.end : last) : null;
    selected.forEach((b) => {
      const start = rs && (!filters.start || rs > filters.start) ? rs : filters.start;
      out.set(b.id, windowPts(btPoints(b, { ...filters, start: null, end: null, frequency: "Daily" }), start, filters.end, filters.frequency));
    });
    return out;
  }, [selected, filters, rangeFilter]);

  const statsById = useMemo(() => {
    const m = new Map<string, ReturnType<typeof seriesStats>>();
    selected.forEach((b) => m.set(b.id, seriesStats(ptsById.get(b.id) ?? [], filters.frequency)));
    return m;
  }, [selected, ptsById, filters.frequency]);

  const leadStats = lead ? statsById.get(lead.id) ?? null : null;
  const ddStrategy = selected.find((b) => b.id === ddId) ?? lead;
  const ddPts = ddStrategy ? ptsById.get(ddStrategy.id) ?? [] : [];
  const ddRisk = useMemo(() => riskStats(ddPts), [ddPts]);
  const benchName = lead ? benchmarkLabel(lead.benchmark) : "Benchmark";
  const mixedMarkets = new Set(selected.map((b) => b.benchmark)).size > 1;

  // Date-aligned merge: union of calendar dates, forward-filled, each series rebased to initial capital.
  const chartData = useMemo(() => {
    if (!selected.length) return [];
    const rebase = (pts: Pt[], pick: (p: Pt) => number) => {
      const first = pick(pts[0]);
      return (p: Pt) => {
        const ratio = pick(p) / first;
        if (chartMode === "Equity Curve" || chartMode === "Log Scale") return Number((initialCapital * ratio).toFixed(2));
        if (chartMode === "Cumulative Return") return Number(((ratio - 1) * 100).toFixed(3));
        return 0;
      };
    };
    const series = selected.filter((b) => (ptsById.get(b.id) ?? []).length > 1).map((b) => {
      const pts = ptsById.get(b.id)!;
      return { key: nameOf(b), pts, pick: chartMode === "Drawdown" ? (p: Pt) => -p.dd : rebase(pts, (p) => p.value) };
    });
    const leadPts = lead ? ptsById.get(lead.id) ?? [] : [];
    if (leadPts.length > 1) {
      series.push({
        key: BENCH_KEY, pts: leadPts,
        pick: chartMode === "Drawdown"
          ? (() => { let pk = -Infinity; const dd = new Map<string, number>(); leadPts.forEach((p) => { pk = Math.max(pk, p.bench); dd.set(p.date, -((pk - p.bench) / pk) * 100); }); return (p: Pt) => dd.get(p.date) ?? 0; })()
          : rebase(leadPts, (p) => p.bench),
      });
    }
    return mergeByDate(series);
  }, [selected, lead, ptsById, chartMode, initialCapital]);

  const returnDist = useMemo(() => {
    const v = ddPts.map((p) => p.value);
    const r = v.slice(1).map((x, i) => (x / v[i] - 1) * 100);
    if (r.length < 20) return [];
    const lo = Math.min(...r), hi = Math.max(...r), bins = 21, step = (hi - lo) / bins || 1e-6;
    return Array.from({ length: bins }, (_, k) => ({
      return_pct: Number((lo + (k + 0.5) * step).toFixed(2)),
      frequency: r.filter((x) => x >= lo + k * step && (x < lo + (k + 1) * step || k === bins - 1)).length,
    }));
  }, [ddPts]);

  const availableToSelect = useMemo(
    () => allBacktests.filter((b) => (b.strategy_name + b.ticker).toLowerCase().includes(searchQuery.toLowerCase()) && (assetFilter === "All" || b.ticker === assetFilter) && !selectedIds.includes(b.id)),
    [allBacktests, searchQuery, assetFilter, selectedIds]
  );
  const uniqueAssets = useMemo(() => [...new Set(allBacktests.map((b) => b.ticker))], [allBacktests]);

  // Average pairwise correlation of daily returns between selected strategies (aligned on common dates).
  const avgCorr = useMemo(() => {
    if (selected.length < 2) return null;
    const maps = selected.map((b) => new Map((ptsById.get(b.id) ?? []).map((p, i, a) => [p.date, i ? p.value / a[i - 1].value - 1 : NaN])));
    const dates = [...maps[0].keys()].filter((d) => maps.every((m) => Number.isFinite(m.get(d))));
    if (dates.length < 20) return null;
    const cols = maps.map((m) => dates.map((d) => m.get(d)!));
    const corr = (a: number[], b: number[]) => {
      const ma = a.reduce((x, y) => x + y, 0) / a.length, mb = b.reduce((x, y) => x + y, 0) / b.length;
      let n = 0, da = 0, db = 0;
      a.forEach((x, i) => { n += (x - ma) * (b[i] - mb); da += (x - ma) ** 2; db += (b[i] - mb) ** 2; });
      return da > 0 && db > 0 ? n / Math.sqrt(da * db) : 0;
    };
    const vals: number[] = [];
    for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) vals.push(corr(cols[i], cols[j]));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [selected, ptsById]);

  const fmtY = (v: number) => (chartMode === "Equity Curve" || chartMode === "Log Scale" ? fmtMoney(v, filters.currency, true) : `${v.toFixed(0)}%`);
  const windowLabel = `${filters.start ?? "start"} → ${filters.end ?? "latest"} · ${filters.frequency}`;
  const rel = (a?: number | null, b?: number | null) => (isNum(a) && isNum(b) ? a - b : null);

  if (!allBacktests.length) return <EmptyState icon={BarChart2} title="No backtests available" hint="Run a backtest to analyse it here." />;

  const cell = (id: string, b: BacktestResult, s: ReturnType<typeof seriesStats>) => {
    const mono = "px-2 py-2.5 font-mono";
    switch (id) {
      case "strategy": return <td className="px-2 py-2.5 font-medium text-slate-200">{nameOf(b)}</td>;
      case "asset": return <td className={cn(mono, "text-slate-300")}>{b.ticker}</td>;
      case "total_return": return <td className={cn(mono, "font-semibold", signTone(s?.totalReturn))}>{fmtPct(s?.totalReturn)}</td>;
      case "cagr": return <td className={cn(mono, signTone(s?.cagr))}>{fmtPct(s?.cagr)}</td>;
      case "sharpe": return <td className={cn(mono, "text-white")}>{s ? formatRatio(s.sharpe) : "—"}</td>;
      case "sortino": return <td className={cn(mono, "text-slate-200")}>{s ? formatRatio(s.sortino) : "—"}</td>;
      case "max_dd": return <td className={cn(mono, "text-rose-400")}>{s ? fmtPct(-s.maxDD, 2) : "—"}</td>;
      case "vol": return <td className={cn(mono, "text-slate-300")}>{fmtPct(s?.vol, 2, false)}</td>;
      case "alpha": return <td className={cn(mono, signTone(s?.alpha))}>{fmtPct(s?.alpha)}</td>;
      case "beta": return <td className={cn(mono, "text-slate-200")}>{s?.beta == null ? "—" : s.beta.toFixed(2)}</td>;
      default: return null;
    }
  };
  const benchCell = (id: string) => {
    const s = leadStats, mono = "px-2 py-2.5 font-mono text-slate-400";
    switch (id) {
      case "strategy": return <td className="flex items-center gap-2 px-2 py-2.5 font-medium text-slate-300"><span className="h-2 w-2 rounded-full bg-slate-500" />Benchmark</td>;
      case "asset": return <td className={mono}>{lead?.benchmark ?? "—"}</td>;
      case "total_return": return <td className={cn(mono, signTone(s?.benchReturn))}>{fmtPct(s?.benchReturn)}</td>;
      case "cagr": return <td className={mono}>{fmtPct(s?.benchCagr)}</td>;
      case "sharpe": return <td className={mono}>{s ? formatRatio(s.benchSharpe) : "—"}</td>;
      case "max_dd": return <td className={cn(mono, "text-rose-400/80")}>{s ? fmtPct(-s.benchMaxDD, 2) : "—"}</td>;
      case "vol": return <td className={mono}>{fmtPct(s?.benchVol, 2, false)}</td>;
      case "beta": return <td className={mono}>1.00</td>;
      default: return <td className={mono}>—</td>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Strategy selection */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-3 text-xs shadow-lg shadow-black/20 xl:flex-row xl:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="whitespace-nowrap font-semibold text-slate-300">Strategies <span className="font-mono text-slate-500">({selectedIds.length})</span></span>
          <div className="relative min-w-[180px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search strategies…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={cn(INPUT, "w-full py-1.5 pl-8 pr-3 placeholder:text-slate-500")} />
            {searchQuery && availableToSelect.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-64 overflow-y-auto rounded-xl border border-slate-800 bg-[#0B101C] p-1.5 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)]">
                {availableToSelect.map((item) => (
                  <button key={item.id} type="button" onClick={() => { onToggleStrategy(item.id); setSearchQuery(""); }} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-slate-800/70">
                    <span className="truncate">{nameOf(item)}</span>
                    <span className="font-mono text-[10px] text-slate-500">({item.ticker})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)} className={cn(INPUT, "cursor-pointer appearance-none py-1.5 pl-3 pr-7")}>
              <option value="All">All assets</option>
              {uniqueAssets.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {selected.map((b, i) => (
              <div key={b.id} className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#080d1a] px-2.5 py-1 font-medium text-slate-200">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seriesColor(i) }} />
                <span className="max-w-[260px] truncate">{nameOf(b)} <span className="font-mono text-[10px] text-slate-400">({b.ticker})</span></span>
                {b.is_sample && <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-1 font-mono text-[8px] font-bold text-blue-400">SAMPLE</span>}
                <button type="button" onClick={() => onToggleStrategy(b.id)} aria-label={`Remove ${nameOf(b)}`} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
          {selectedIds.length > 0 && <button type="button" onClick={onClearAll} className="whitespace-nowrap text-[11px] font-medium text-blue-400 hover:text-blue-300">Clear all</button>}
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-3 border-t border-slate-800 pt-2 xl:border-t-0 xl:pt-0">
          <div className="flex items-center gap-1.5" title="Benchmark is recorded with each run: the first selected strategy's benchmark is plotted.">
            <span className="text-slate-400">Benchmark</span>
            <span className="rounded-lg border border-slate-800 bg-[#080d1a] px-2.5 py-1.5 font-mono text-[11px] text-slate-200">{benchName}</span>
          </div>
          <label className="flex items-center gap-1.5">
            <span className="whitespace-nowrap text-slate-400">Initial capital</span>
            <span className="relative w-32">
              <input type="number" min={1} value={initialCapital} onChange={(e) => onInitialCapitalChange(Number(e.target.value) || 100000)} className={cn(INPUT, "w-full py-1.5 pl-5 pr-2 text-right font-mono")} />
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-slate-500">{sym}</span>
            </span>
          </label>
        </div>
      </div>

      {mixedMarkets && (
        <p role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          Selected strategies use different benchmarks. Curves are rebased to the same capital, aligned on calendar dates with market holidays forward-filled; the benchmark shown is {benchName}.
        </p>
      )}

      {/* KPI strip: lead strategy, benchmark-relative */}
      {lead && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-400">KPIs for <span className="font-medium text-slate-200">{nameOf(lead)}</span> <span className="font-mono">({lead.ticker})</span> · {windowLabel}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9">
            <Kpi label="Total return" value={fmtPct(leadStats?.totalReturn)} tone={signTone(leadStats?.totalReturn)} sub={<span className={signTone(rel(leadStats?.totalReturn, leadStats?.benchReturn))}>{fmtPct(rel(leadStats?.totalReturn, leadStats?.benchReturn))} vs bench</span>} />
            <Kpi label="CAGR" value={fmtPct(leadStats?.cagr)} tone={signTone(leadStats?.cagr)} sub={<span className={signTone(rel(leadStats?.cagr, leadStats?.benchCagr))}>{fmtPct(rel(leadStats?.cagr, leadStats?.benchCagr))} vs bench</span>} />
            <Kpi label="Sharpe" value={leadStats ? formatRatio(leadStats.sharpe) : "—"} sub={`Bench ${leadStats ? formatRatio(leadStats.benchSharpe) : "—"}`} />
            <Kpi label="Sortino" value={leadStats ? formatRatio(leadStats.sortino) : "—"} />
            <Kpi label="Max drawdown" value={leadStats ? fmtPct(-leadStats.maxDD) : "—"} tone="text-rose-400" sub={`Bench ${leadStats ? fmtPct(-leadStats.benchMaxDD) : "—"}`} />
            <Kpi label="Volatility" value={fmtPct(leadStats?.vol, 2, false)} sub={`Bench ${fmtPct(leadStats?.benchVol, 2, false)}`} />
            <Kpi label="Calmar" value={leadStats ? formatRatio(leadStats.calmar) : "—"} />
            <Kpi label="Alpha (ann.)" value={fmtPct(leadStats?.alpha)} tone={signTone(leadStats?.alpha)} sub={`Beta ${leadStats?.beta == null ? "—" : leadStats.beta.toFixed(2)}`} />
            <button type="button" onClick={() => setShowMore(true)} className="group flex flex-col items-center justify-center rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-3.5 text-center transition-colors hover:border-blue-500/40">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-200 group-hover:text-blue-400">More metrics <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              <span className="mt-1 font-mono text-[10px] text-slate-500">VaR, ulcer, skew</span>
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card
            title="Equity curve comparison"
            subtitle={`Rebased to ${fmtMoney(initialCapital, filters.currency)} · ${filters.frequency.toLowerCase()} · dates aligned across calendars`}
            info="Each strategy is rebased to the same starting capital. Curves are merged on the union of calendar dates; a market holiday carries the previous value forward. The dashed line is the lead strategy's benchmark."
            icon={LineChartIcon}
            tone="blue"
            action={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center rounded-lg border border-slate-800 bg-[#0b1222] p-0.5 text-[11px]">
                  {(["Equity Curve", "Cumulative Return", "Drawdown", "Log Scale"] as ChartMode[]).map((m) => (
                    <button key={m} type="button" onClick={() => setChartMode(m)} className={cn("rounded px-2 py-1 transition-colors", chartMode === m ? "bg-blue-600 font-semibold text-white shadow-sm" : "font-medium text-slate-400 hover:text-white")}>{m}</button>
                  ))}
                </div>
                <div className="flex items-center rounded-lg border border-slate-800 bg-[#0b1222] p-0.5 font-mono text-[11px]">
                  {(["1M", "3M", "6M", "YTD", "1Y", "ALL"] as RangeFilter[]).map((r) => (
                    <button key={r} type="button" onClick={() => setRangeFilter(r)} className={cn("rounded px-2 py-1 transition-colors", rangeFilter === r ? "bg-blue-600 font-semibold text-white shadow-sm" : "font-medium text-slate-400 hover:text-white")}>{r}</button>
                  ))}
                </div>
              </div>
            }
          >
            <div className="h-[340px]">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 5 }}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="date" {...AXIS_PROPS} minTickGap={40} />
                    <YAxis {...AXIS_PROPS} scale={chartMode === "Log Scale" ? "log" : "auto"} domain={["auto", "auto"]} tickFormatter={fmtY} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: any, name: any) => [chartMode === "Equity Curve" || chartMode === "Log Scale" ? fmtMoney(Number(val), filters.currency) : fmtPct(Number(val)), name === BENCH_KEY ? benchName : name]} />
                    <Line type="monotone" dataKey={BENCH_KEY} stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />
                    {selected.map((b, i) => (
                      <Line key={b.id} type="monotone" dataKey={nameOf(b)} stroke={seriesColor(i)} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">No data points in this window. Widen the date range or select a strategy.</div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800 pt-3 text-[11px]">
              {selected.map((b, i) => {
                const s = statsById.get(b.id);
                return (
                  <span key={b.id} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seriesColor(i) }} />
                    <span className="font-medium text-slate-300">{nameOf(b)}</span>
                    <span className={cn("font-mono text-[10px]", signTone(s?.totalReturn))}>{fmtPct(s?.totalReturn)}</span>
                  </span>
                );
              })}
              <span className="flex items-center gap-1.5">
                <span className="w-3 border-b-2 border-dashed border-slate-400" />
                <span className="text-slate-400">{benchName}</span>
                <span className={cn("font-mono text-[10px]", signTone(leadStats?.benchReturn))}>{fmtPct(leadStats?.benchReturn)}</span>
              </span>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          {selected.length > 1 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              Distribution &amp; drawdown for
              <select value={ddStrategy?.id ?? ""} onChange={(e) => setDdId(e.target.value)} className={cn(INPUT, "px-2 py-1")}>
                {selected.map((b) => <option key={b.id} value={b.id}>{nameOf(b)} ({b.ticker})</option>)}
              </select>
            </div>
          )}
          <Card title="Return distribution" subtitle={`${filters.frequency} returns of ${ddStrategy ? nameOf(ddStrategy) : "—"}`} info="Histogram of period returns inside the selected window." icon={BarChart2} tone="purple">
            <div className="h-40">
              {returnDist.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={returnDist} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="return_pct" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                    <YAxis {...AXIS_PROPS} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtInt(Number(v)), "Periods"]} labelFormatter={(l) => `Return ≈ ${l}%`} />
                    <Bar dataKey="frequency" fill="#7C3AED" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-xs text-slate-500">Not enough observations.</div>}
            </div>
          </Card>
          <Card title="Underwater drawdown" subtitle="Distance below running peak" info="Percentage below the highest portfolio value reached so far in the window." icon={TrendingDown} tone="rose">
            <div className="h-40">
              {ddPts.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ddPts.map((p) => ({ date: p.date, drawdown: -p.dd }))} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs><linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#DC2626" stopOpacity={0} /><stop offset="100%" stopColor="#DC2626" stopOpacity={0.35} /></linearGradient></defs>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} />
                    <YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [fmtPct(Number(v)), "Drawdown"]} />
                    <Area type="monotone" dataKey="drawdown" stroke="#DC2626" strokeWidth={2} fill="url(#ddFill)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-xs text-slate-500">Not enough observations.</div>}
            </div>
          </Card>
        </div>
      </div>

      {/* Comparison table + insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card title="Strategy comparison" subtitle={windowLabel} info="Every metric is recomputed from the equity curve inside the active window and frequency." icon={Table2} tone="blue"
            action={<button type="button" onClick={() => setShowCols(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800"><Columns className="h-3 w-3" /> Columns</button>}>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                    {COLUMNS.filter((c) => visibleCols.includes(c.id)).map((c) => <th key={c.id} className="px-2 py-1.5">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {selected.map((b) => (
                    <tr key={b.id} className="transition-colors hover:bg-slate-800/30">
                      {COLUMNS.filter((c) => visibleCols.includes(c.id)).map((c) => <React.Fragment key={c.id}>{cell(c.id, b, statsById.get(b.id) ?? null)}</React.Fragment>)}
                    </tr>
                  ))}
                  {lead && <tr className="bg-slate-800/20">{COLUMNS.filter((c) => visibleCols.includes(c.id)).map((c) => <React.Fragment key={c.id}>{benchCell(c.id)}</React.Fragment>)}</tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card title="Key insights" subtitle="Generated from the numbers above" info="Plain-language read-outs computed from the selected window; no external model is involved." icon={Lightbulb} tone="amber"
            action={<button type="button" onClick={() => setShowReport(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800"><FileText className="h-3 w-3 text-blue-400" /> Report</button>}>
            <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
              <div className="space-y-1 rounded-xl border border-slate-800 bg-[#080d1a]/60 p-3">
                <div className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-emerald-400" /><span className="text-[11px] font-semibold text-white">Vs benchmark</span></div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {leadStats ? <>Returned <span className={cn("font-mono font-semibold", signTone(leadStats.totalReturn))}>{fmtPct(leadStats.totalReturn)}</span> against <span className={cn("font-mono font-semibold", signTone(leadStats.benchReturn))}>{fmtPct(leadStats.benchReturn)}</span>; Sharpe <span className="font-mono text-slate-200">{formatRatio(leadStats.sharpe)}</span> vs <span className="font-mono text-slate-200">{formatRatio(leadStats.benchSharpe)}</span>.</> : "—"}
                </p>
              </div>
              <div className="space-y-1 rounded-xl border border-slate-800 bg-[#080d1a]/60 p-3">
                <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-rose-400" /><span className="text-[11px] font-semibold text-white">Drawdown</span></div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {leadStats ? <>Max drawdown <span className="font-mono font-semibold text-rose-400">{fmtPct(-leadStats.maxDD)}</span> (benchmark <span className="font-mono text-slate-200">{fmtPct(-leadStats.benchMaxDD)}</span>); longest stretch below peak {leadStats.ddDuration} periods.</> : "—"}
                </p>
              </div>
              <div className="space-y-1 rounded-xl border border-slate-800 bg-[#080d1a]/60 p-3">
                <div className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-purple-300" /><span className="text-[11px] font-semibold text-white">Return shape</span></div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {ddRisk ? <>Daily skew <span className="font-mono text-slate-200">{ddRisk.skew.toFixed(2)}</span>{ddRisk.skew < 0 ? ", a longer left tail: losses are larger than gains." : ", a longer right tail."} 95% VaR <span className="font-mono text-slate-200">{fmtPct(-ddRisk.var95)}</span>.</> : "Not enough observations."}
                </p>
              </div>
              <div className="space-y-1 rounded-xl border border-slate-800 bg-[#080d1a]/60 p-3">
                <div className="flex items-center gap-2"><GitFork className="h-4 w-4 text-blue-400" /><span className="text-[11px] font-semibold text-white">Diversification</span></div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {avgCorr === null ? "Select two or more strategies with overlapping dates to measure correlation." : <>Average pairwise correlation <span className="font-mono text-slate-200">{avgCorr.toFixed(2)}</span>{avgCorr < 0.5 ? ": diversifying." : ": largely overlapping bets."}</>}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <MoreMetricsModal isOpen={showMore} onClose={() => setShowMore(false)} strategyName={lead ? `${nameOf(lead)} (${lead.ticker}) · ${windowLabel}` : "—"} stats={leadStats} risk={lead ? riskStats(ptsById.get(lead.id) ?? []) : null} />
      <DetailedReportModal isOpen={showReport} onClose={() => setShowReport(false)} items={selected.map((bt) => ({ bt, stats: statsById.get(bt.id) ?? null }))} windowLabel={windowLabel} />
      <ColumnsModal isOpen={showCols} onClose={() => setShowCols(false)} allColumns={COLUMNS} visibleColumns={visibleCols} onToggleColumn={(id) => setVisibleCols((v) => (v.includes(id) ? (v.length > 2 ? v.filter((c) => c !== id) : v) : [...v, id]))} />
    </div>
  );
}
