"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult } from "@/types";
import { fmtPct, fmtInt, isNum } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { Card, CardSkeleton, EmptyState } from "@/components/ui/Card";
import ReturnDistributionChart from "@/components/charts/ReturnDistributionChart";
import UnderwaterDrawdownChart from "@/components/charts/UnderwaterDrawdownChart";

// Losses are shown as negative magnitudes; a missing value stays "—".
const neg = (v: unknown, digits = 2) => (isNum(v) ? fmtPct(-Math.abs(v), digits) : "—");

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "down" }) {
  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-3.5">
      <div className="mb-0.5 text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`font-mono text-lg font-bold ${value === "—" ? "text-slate-500" : tone === "down" ? "text-rose-400" : "text-white"}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500">{hint}</div>
    </div>
  );
}

export default function RiskPortfolioPage() {
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [selectedBtId, setSelectedBtId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .getBacktests()
      .then((bts) => {
        setBacktests(bts ?? []);
        if (bts?.length) setSelectedBtId(bts[0].id);
      })
      .catch((e) => {
        console.error(e);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeBt = backtests.find((b) => b.id === selectedBtId);
  const m = activeBt?.metrics;
  const r = activeBt?.risk;

  return (
    <main className="app-container min-h-screen space-y-6 py-6">
      <header className="relative flex flex-col justify-between gap-4 border-b border-slate-800/60 pb-5 sm:flex-row sm:items-end">
        <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            Tail{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Risk
            </span>
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-secondary">
            Value at Risk (VaR), Expected Shortfall (CVaR) and drawdown profile of a completed simulation
          </p>
        </div>

        {backtests.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Simulation
            <select
              value={selectedBtId}
              onChange={(e) => setSelectedBtId(e.target.value)}
              className="rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-blue-500"
            >
              {backtests.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.strategy_name} ({b.ticker})
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} rows={1} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CardSkeleton rows={5} />
            <CardSkeleton rows={5} />
          </div>
        </div>
      ) : activeBt && m && r ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Historical VaR (95%)" value={neg(r.var_95)} hint="1-day 95% threshold" tone="down" />
            <Kpi label="Historical VaR (99%)" value={neg(r.var_99)} hint="1-in-100 day tail" tone="down" />
            <Kpi label="Expected Shortfall" value={neg(r.cvar_95)} hint="Loss beyond 95% VaR" tone="down" />
            <Kpi
              label="Max Drawdown"
              value={neg(m.max_drawdown, 1)}
              hint={`Duration: ${isNum(m.max_drawdown_duration) ? fmtInt(m.max_drawdown_duration) + " bars" : "—"}`}
              tone="down"
            />
            <Kpi label="Downside Deviation" value={fmtPct(r.downside_deviation, 2, false)} hint="Negative returns σ" />
            <Kpi label="Calmar Ratio" value={formatRatio(m.calmar_ratio)} hint="CAGR / |MaxDD|" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card
              title="Daily Return Distribution"
              subtitle="With VaR 95% / 99% thresholds"
              info="Histogram of daily strategy returns; vertical markers show the historical Value-at-Risk cut-offs."
              icon={BarChart3}
              tone="blue"
            >
              <div className="h-72">
                <ReturnDistributionChart
                  distribution={r.return_distribution || []}
                  var95={r.var_95}
                  var99={r.var_99}
                  height={280}
                />
              </div>
            </Card>

            <Card
              title="Underwater Drawdown"
              subtitle="Peak-to-trough decline over time"
              info="Percentage below the running equity peak at each date."
              icon={TrendingDown}
              tone="rose"
            >
              <div className="h-72">
                <UnderwaterDrawdownChart data={activeBt.equity_curve} height={280} />
              </div>
            </Card>
          </div>
        </>
      ) : (
        <EmptyState
          icon={ShieldAlert}
          title={error ? "Risk analytics unavailable" : "No simulations to analyse yet"}
          hint={
            error
              ? "The backtest engine could not be reached. Check that the backend is running and retry."
              : "Execute a backtest first; its VaR, CVaR and drawdown profile will appear here."
          }
          action={
            <Link
              href="/backtests"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"
            >
              <Activity className="h-3.5 w-3.5" /> Go to Backtests
            </Link>
          }
        />
      )}
    </main>
  );
}
