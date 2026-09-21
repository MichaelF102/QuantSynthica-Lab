"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Play, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { StrategyConfig, BacktestResult } from "@/types";
import { formatPercent, formatRatio } from "@/lib/formatters";
import { formatConditionRule } from "@/lib/formatRule";
import EquityCurveChart from "@/components/charts/EquityCurveChart";
import DeskMarketSummary from "@/components/desk/DeskMarketSummary";

export default function WorkspaceHome() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [activeBt, setActiveBt] = useState<BacktestResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadWorkspace = async () => {
      try {
        const [strats, bts] = await Promise.all([api.getStrategies(), api.getBacktests()]);
        if (!isMounted) return;
        setStrategies(strats);
        setBacktests(bts);
        if (bts.length > 0) setActiveBt(bts[0]);
      } catch (err) {
        console.error("Workspace data loading error:", err);
      }
    };
    loadWorkspace();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1280px] space-y-10 px-4 py-8">
      <section className="max-w-2xl">
        <h1 className="text-[40px] font-bold leading-[1.15] tracking-tight text-white sm:text-[48px]">
          Where you chart, test, and keep score
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#b2b5be]">
          Open a name, build a strategy, run it on history. US and India in the same desk — not a live broker.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/research" className="qs-btn-primary px-5 py-2.5 text-[15px]">
            <Search className="h-4 w-4" />
            Open chart
          </Link>
          <Link href="/strategies/builder" className="qs-btn-ghost px-5 py-2.5 text-[15px]">
            <Plus className="h-4 w-4" />
            New strategy
          </Link>
        </div>
      </section>

      <DeskMarketSummary title="Market summary" seeAllHref="/research" seeAllLabel="See all" />

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="qs-section-label">Strategies</h2>
              <Link href="/strategies" className="qs-link">
                View all ({strategies.length})
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="qs-panel overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[12px] text-[#787b86]">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Asset</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Entry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {strategies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#787b86]">
                        No strategies yet.{" "}
                        <Link href="/strategies/builder" className="qs-link inline">
                          Create one
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    strategies.slice(0, 6).map((strat) => (
                      <tr
                        key={strat.id}
                        className="cursor-pointer hover:bg-surface-muted"
                        onClick={() => router.push(`/strategies/${strat.id}`)}
                      >
                        <td className="px-4 py-2.5 font-semibold text-white">{strat.name}</td>
                        <td className="px-4 py-2.5 tabular-nums">{strat.asset}</td>
                        <td className="px-4 py-2.5 capitalize text-[#b2b5be]">
                          {(strat.strategy_type || "quantitative").replace(/_/g, " ")}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-2.5 text-[#787b86]">
                          {formatConditionRule(strat.entry_rules[0], strat.indicators)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {activeBt && activeBt.equity_curve && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="qs-section-label">Latest backtest</h2>
                <Link href={`/backtests/${activeBt.id}`} className="qs-link">
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="qs-panel p-4">
                <div className="mb-3 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-3 text-[13px]">
                  <span className="text-white">{activeBt.strategy_name}</span>
                  <span className="text-[#787b86]">{activeBt.asset}</span>
                  <span
                    className={
                      (activeBt.metrics?.total_return || 0) >= 0 ? "text-market-up" : "text-market-down"
                    }
                  >
                    {formatPercent(activeBt.metrics?.total_return)}
                  </span>
                  <span className="text-[#787b86]">Sharpe {formatRatio(activeBt.metrics?.sharpe_ratio)}</span>
                </div>
                <div className="h-[260px]">
                  <EquityCurveChart data={activeBt.equity_curve} benchmarkSymbol={activeBt.benchmark} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="qs-section-label">Recent ideas</h2>
            <Link href="/backtests" className="qs-link">
              All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="qs-panel divide-y divide-border">
            {backtests.length === 0 ? (
              <div className="p-5 text-[13px] text-[#787b86]">
                No backtests yet.
                <Link href="/backtests" className="qs-link mt-2">
                  <Play className="h-3.5 w-3.5" />
                  Run one
                </Link>
              </div>
            ) : (
              backtests.slice(0, 6).map((bt) => (
                <Link key={bt.id} href={`/backtests/${bt.id}`} className="block px-4 py-3 hover:bg-surface-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-semibold text-white">{bt.strategy_name}</div>
                      <div className="mt-0.5 text-[12px] text-[#787b86]">{bt.asset}</div>
                    </div>
                    <span
                      className={`text-[13px] font-semibold tabular-nums ${
                        (bt.metrics?.total_return || 0) >= 0 ? "text-market-up" : "text-market-down"
                      }`}
                    >
                      {formatPercent(bt.metrics?.total_return)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
