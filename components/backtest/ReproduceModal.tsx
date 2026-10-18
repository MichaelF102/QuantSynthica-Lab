"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, FlaskConical, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult, StrategyConfig } from "@/types";
import { cn } from "@/lib/utils";

type Row = { key: string; label: string; a: number | undefined; b: number | undefined; fmt: (v: number) => string };
const f2 = (v: number) => v.toFixed(2);

export type Verdict = { tone: "ok" | "warn" | "bad"; title: string; detail: string };

/** Decide what a difference (or its absence) between the original run and its re-run means. */
export function judge(orig: BacktestResult, again: BacktestResult, snapshot: boolean): { verdict: Verdict; identical: boolean } {
  const keys = ["total_return", "cagr", "sharpe_ratio", "max_drawdown", "win_rate", "profit_factor", "num_trades"] as const;
  const identical = keys.every((k) => Math.abs(((orig.metrics as any)?.[k] ?? 0) - ((again.metrics as any)?.[k] ?? 0)) < 1e-6) && orig.trades.length === again.trades.length;
  const dataSame = !!orig.data_fingerprint && !!again.data_fingerprint ? orig.data_fingerprint === again.data_fingerprint : null;
  const engineSame = !!orig.engine_version && orig.engine_version === again.engine_version;
  if (identical) return { identical, verdict: { tone: "ok", title: "Reproduced exactly", detail: dataSame ? "Same prices, same engine revision and the same numbers." : "The numbers match. The original run did not record a price fingerprint, so the prices could not be compared directly." } };
  if (dataSame === false) return { identical, verdict: { tone: "warn", title: "Prices have changed since this run", detail: "The data provider returned different history for the same window (a revision, split or dividend adjustment). The strategy is the same; the inputs are not." } };
  if (!engineSame) return { identical, verdict: { tone: "warn", title: "Made with an older engine revision", detail: `This run came from engine ${orig.engine_version ?? "before versions were recorded"}; the current engine is ${again.engine_version}. Differences come from changes to the simulation, not from your strategy.` } };
  if (!snapshot) return { identical, verdict: { tone: "warn", title: "The strategy may have been edited", detail: "This run did not save a copy of its strategy, so the current version was used. Edits since then would explain the difference." } };
  return { identical, verdict: { tone: "bad", title: "Could not reproduce", detail: "Same strategy, same engine and same prices, but different numbers. That should not happen; please keep this run's JSON export when reporting it." } };
}

export default function ReproduceModal({ bt, strategy, onClose, onSaved }: { bt: BacktestResult; strategy: StrategyConfig | null; onClose: () => void; onSaved: (id: string) => void }) {
  const [state, setState] = useState<"running" | "done" | "error">("running");
  const [again, setAgain] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const snapshot = !!bt.strategy_config;
  const cfg = bt.strategy_config ?? strategy;

  useEffect(() => {
    let live = true;
    if (!cfg) { setError("The strategy behind this run is no longer available."); setState("error"); return; }
    api.runBacktestUnsaved(cfg, bt.start_date, bt.end_date, bt.benchmark)
      .then((r) => { if (live) { setAgain(r); setState("done"); } })
      .catch((e) => { if (live) { setError(e?.message || "The re-run failed."); setState("error"); } });
    return () => { live = false; };
  }, [bt.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAsRun = async () => {
    if (!cfg) return;
    setSaving(true);
    try { const r = await api.runBacktest(cfg, bt.start_date, bt.end_date, bt.benchmark); onSaved(r.id); } catch (e: any) { setError(e?.message || "Could not save the run."); setSaving(false); }
  };

  const j = again ? judge(bt, again, snapshot) : null;
  const rows: Row[] = again ? [
    { key: "total_return", label: "Total return", a: bt.metrics?.total_return, b: again.metrics?.total_return, fmt: (v) => `${v.toFixed(2)}%` },
    { key: "cagr", label: "CAGR", a: bt.metrics?.cagr, b: again.metrics?.cagr, fmt: (v) => `${v.toFixed(2)}%` },
    { key: "sharpe_ratio", label: "Sharpe", a: bt.metrics?.sharpe_ratio, b: again.metrics?.sharpe_ratio, fmt: f2 },
    { key: "max_drawdown", label: "Max drawdown", a: bt.metrics?.max_drawdown, b: again.metrics?.max_drawdown, fmt: (v) => `${v.toFixed(2)}%` },
    { key: "win_rate", label: "Win rate", a: bt.metrics?.win_rate, b: again.metrics?.win_rate, fmt: (v) => `${v.toFixed(1)}%` },
    { key: "num_trades", label: "Trades", a: bt.metrics?.num_trades, b: again.metrics?.num_trades, fmt: (v) => String(v) },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Reproduce run" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b1222] shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-slate-800 p-4"><div><h3 className="flex items-center gap-2 text-sm font-bold text-white"><FlaskConical className="h-4 w-4 text-blue-400" />Reproduce this run</h3><p className="text-[11px] text-slate-400">Runs the saved strategy again on the same security and window and compares the result. Nothing is added to your runs.</p></div><button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white"><X className="h-4 w-4" /></button></div>
        <div className="space-y-3 p-4 text-xs">
          {!snapshot && state !== "error" && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-300">This run was made before runs saved a copy of their strategy, so the current version of the strategy is used.</p>}
          {state === "running" && <p className="flex items-center gap-2 py-6 text-slate-300"><Loader2 className="h-4 w-4 animate-spin" />Running again…</p>}
          {state === "error" && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">{error}</p>}
          {state === "done" && j && again && (
            <>
              <div data-testid="repro-verdict" className={cn("flex items-start gap-2 rounded-lg border p-3", j.verdict.tone === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : j.verdict.tone === "warn" ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200")}>
                {j.verdict.tone === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                <div><div className="font-semibold">{j.verdict.title}</div><div className="mt-0.5 text-[11px] opacity-90">{j.verdict.detail}</div></div>
              </div>
              <table className="w-full text-left" aria-label="Reproduction check">
                <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5">Metric</th><th className="py-1.5 text-right">Original</th><th className="py-1.5 text-right">Re-run</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">{rows.map((r) => (
                  <tr key={r.key}><td className="py-1.5 font-sans text-slate-300">{r.label}</td><td className="py-1.5 text-right text-slate-300">{r.a === undefined ? "—" : r.fmt(r.a)}</td><td className={cn("py-1.5 text-right", r.a !== undefined && r.b !== undefined && Math.abs(r.a - r.b) > 1e-6 ? "font-semibold text-amber-300" : "text-slate-300")}>{r.b === undefined ? "—" : r.fmt(r.b)}</td></tr>))}</tbody>
              </table>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
                <div>Original · engine {bt.engine_version ?? "—"} · data {bt.data_fingerprint ?? "—"}</div><div>Re-run · engine {again.engine_version ?? "—"} · data {again.data_fingerprint ?? "—"}</div>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 p-3">
          {state === "done" && !j?.identical && <button type="button" onClick={saveAsRun} disabled={saving} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{saving ? "Saving…" : "Save the re-run as a new run"}</button>}
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-800 bg-[#0b1222] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white">Close</button>
        </div>
      </div>
    </div>
  );
}
