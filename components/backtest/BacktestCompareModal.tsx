"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BacktestResult } from "@/types";
import { api } from "@/lib/api";
import { describeChanges } from "@/lib/strategyDiff";
import { AXIS_PROPS, GRID_PROPS, SERIES_COLORS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { cn } from "@/lib/utils";

interface CompareModalProps { currentBacktest: BacktestResult; onClose: () => void; onSelectCompare?: (backtestId: string) => void }

const MAX_RUNS = 4;
type Metric = { key: string; label: string; get: (r: BacktestResult) => number | undefined; fmt: (v: number) => string; better: "high" | "low" | null };
const METRICS: Metric[] = [
  { key: "total_return", label: "Total return", get: (r) => r.metrics?.total_return, fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`, better: "high" },
  { key: "cagr", label: "CAGR", get: (r) => r.metrics?.cagr, fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`, better: "high" },
  { key: "sharpe", label: "Sharpe", get: (r) => r.metrics?.sharpe_ratio, fmt: (v) => v.toFixed(2), better: "high" },
  { key: "sortino", label: "Sortino", get: (r) => r.metrics?.sortino_ratio, fmt: (v) => v.toFixed(2), better: "high" },
  { key: "mdd", label: "Max drawdown", get: (r) => (r.metrics ? Math.abs(r.metrics.max_drawdown) : undefined), fmt: (v) => `-${v.toFixed(2)}%`, better: "low" },
  { key: "vol", label: "Volatility (ann.)", get: (r) => r.metrics?.annualized_volatility, fmt: (v) => `${v.toFixed(2)}%`, better: "low" },
  { key: "win", label: "Win rate", get: (r) => r.metrics?.win_rate, fmt: (v) => `${v.toFixed(1)}%`, better: "high" },
  { key: "pf", label: "Profit factor", get: (r) => r.metrics?.profit_factor, fmt: (v) => (Number.isFinite(v) ? v.toFixed(2) : "—"), better: "high" },
  { key: "trades", label: "Trades", get: (r) => r.metrics?.num_trades ?? r.trades.length, fmt: (v) => String(v), better: null },
];

export default function BacktestCompareModal({ currentBacktest, onClose }: CompareModalProps) {
  const [all, setAll] = useState<BacktestResult[]>([currentBacktest]);
  const [selected, setSelected] = useState<string[]>([currentBacktest.id]);

  useEffect(() => {
    api.getBacktests().then((bts) => {
      const valid = bts.filter((b) => b.metrics && b.status === "COMPLETED");
      if (!valid.some((b) => b.id === currentBacktest.id)) valid.unshift(currentBacktest);
      setAll(valid);
      const second = valid.find((b) => b.id !== currentBacktest.id);
      if (second) setSelected([currentBacktest.id, second.id]);
    }).catch(() => {});
  }, [currentBacktest]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : s.length >= MAX_RUNS ? s : [...s, id]));
  const runs = useMemo(() => selected.map((id) => all.find((b) => b.id === id)).filter((r): r is BacktestResult => !!r), [selected, all]);
  const label = (r: BacktestResult) => `${r.strategy_name} · ${r.ticker}`;

  const chart = useMemo(() => {
    const byDate = new Map<string, Record<string, any>>();
    runs.forEach((r) => {
      const base = r.equity_curve[0]?.portfolio_value || 1;
      r.equity_curve.forEach((p) => { const row = byDate.get(p.date) ?? { date: p.date }; row[r.id] = (p.portfolio_value / base - 1) * 100; byDate.set(p.date, row); });
    });
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [runs]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (new Set(runs.map((r) => r.ticker)).size > 1) w.push("These runs trade different securities, so their returns are not like for like.");
    if (new Set(runs.map((r) => `${r.start_date}|${r.end_date}`)).size > 1) w.push("The runs cover different windows. Compare returns over the same period before drawing conclusions.");
    if (new Set(runs.map((r) => r.benchmark)).size > 1) w.push("The runs use different benchmarks.");
    if (runs.some((r) => (r.metrics?.num_trades ?? 0) < 30)) w.push("Some runs have fewer than 30 trades, so their ratios are noisy.");
    return w;
  }, [runs]);

  const diffs = useMemo(() => {
    const base = runs[0];
    if (!base) return [];
    return runs.slice(1).map((r) => ({ run: r, changes: base.strategy_config && r.strategy_config ? describeChanges(base.strategy_config, r.strategy_config) : null }));
  }, [runs]);

  const best = (m: Metric) => {
    if (!m.better || runs.length < 2) return null;
    const vals = runs.map((r) => m.get(r)).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (vals.length < 2) return null;
    return m.better === "high" ? Math.max(...vals) : Math.min(...vals);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Compare runs" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b1222] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div><h3 className="text-sm font-bold text-white">Compare runs</h3><p className="text-[11px] text-slate-400">Pick up to {MAX_RUNS}. Green marks the best value in each row.</p></div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4 text-xs">
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1" role="group" aria-label="Runs to compare">
            {all.map((b) => {
              const on = selected.includes(b.id), full = !on && selected.length >= MAX_RUNS;
              return (
                <button key={b.id} type="button" aria-pressed={on} disabled={full} onClick={() => toggle(b.id)} title={`${b.id} · ${b.start_date} → ${b.end_date}`}
                  className={cn("flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors disabled:opacity-40", on ? "border-blue-500/50 bg-blue-500/10 text-slate-100" : "border-slate-800 bg-[#080d1a] text-slate-400 hover:text-white")}>
                  <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded border", on ? "border-blue-500 bg-blue-500 text-black" : "border-slate-600")}>{on && <Check className="h-2.5 w-2.5 stroke-[3]" />}</span>
                  {label(b)}<span className={cn("font-mono text-[10px]", (b.metrics?.total_return ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>{b.metrics ? `${b.metrics.total_return >= 0 ? "+" : ""}${b.metrics.total_return.toFixed(1)}%` : ""}</span>
                </button>
              );
            })}
          </div>

          {warnings.length > 0 && (
            <div role="note" data-testid="compare-warnings" className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
              {warnings.map((w) => <p key={w} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{w}</p>)}
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-[#080d1a] p-3">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-slate-400">Cumulative return, each run from its own start</span>
              {runs.map((r, i) => <span key={r.id} className="flex items-center gap-1.5 text-slate-300"><i className="inline-block h-0.5 w-3" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />{label(r)}</span>)}
            </div>
            <div className="h-60" aria-label="Comparison chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v >= 0 ? "+" : ""}${Number(v).toFixed(0)}%`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`} />
              {runs.map((r, i) => <Line key={r.id} type="monotone" dataKey={r.id} name={label(r)} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={1.8} dot={false} connectNulls isAnimationActive={false} />)}
            </LineChart></ResponsiveContainer></div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[520px] border-collapse text-left" aria-label="Run comparison">
              <thead><tr className="border-b border-slate-800 bg-[#080d1a] text-[10px] uppercase tracking-wider text-slate-400"><th className="px-3 py-2">Metric</th>{runs.map((r, i) => <th key={r.id} className="px-3 py-2 text-right" style={{ color: SERIES_COLORS[i % SERIES_COLORS.length] }}>{label(r)}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {METRICS.map((m) => { const b = best(m); return (
                  <tr key={m.key}><td className="px-3 py-1.5 font-sans text-slate-400">{m.label}</td>
                    {runs.map((r) => { const v = m.get(r); const isBest = b !== null && v === b; return <td key={r.id} className={cn("px-3 py-1.5 text-right", isBest ? "font-bold text-emerald-400" : "text-slate-200")}>{typeof v === "number" ? m.fmt(v) : "—"}</td>; })}
                  </tr>); })}
              </tbody>
            </table>
          </div>

          {runs.length > 1 && (
            <div data-testid="config-diff" className="rounded-xl border border-slate-800 bg-[#080d1a] p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">What differs from {label(runs[0])}</div>
              <div className="space-y-3">{diffs.map(({ run, changes }) => (
                <div key={run.id}><div className="font-semibold text-slate-200">{label(run)}</div>
                  {changes === null ? <p className="text-slate-500">One of these runs did not save a copy of its strategy, so the settings cannot be compared.</p>
                    : changes.length === 0 ? <p className="text-slate-400">Same settings.</p>
                    : <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-slate-300">{changes.map((c, i) => <li key={i}>• {c}</li>)}</ul>}
                </div>))}</div>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-slate-800 p-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-800 bg-[#0b1222] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white">Close</button></div>
      </div>
    </div>
  );
}
