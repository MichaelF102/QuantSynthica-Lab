"use client";

import React from "react";
import { ArrowLeftRight, BarChart3, ListChecks } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { BacktestResult } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { AnalyticsFilters, btTrades, currencyOf, fmtMoney, tradeStats, windowedBt } from "@/lib/analyticsCalc";
import TradeInsights from "@/components/backtest/tabs/TradeInsights";
import ExposureCard from "@/components/backtest/tabs/ExposureCard";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";
import { usePrimaryBacktest } from "./StrategyPicker";

interface Props { selectedBacktests: BacktestResult[]; filters: AnalyticsFilters }

export default function AnalyticsTradesTab({ selectedBacktests, filters }: Props) {
  const { bt, picker } = usePrimaryBacktest(selectedBacktests);
  const stats = bt ? tradeStats(btTrades(bt, filters)) : null;
  if (!bt || !stats) return <EmptyState icon={ArrowLeftRight} title="No closed trades in this window" hint="Widen the date window, or pick a run that produced trades." />;
  const cur = currencyOf(bt);
  const wbt = windowedBt(bt, filters);

  return (
    <div className="space-y-4">
      {picker}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Closed trades" value={fmtInt(stats.count)} sub={`Avg hold ${stats.avgHold.toFixed(1)} bars`} />
        <Kpi label="Win rate" value={fmtPct(stats.winRate, 1, false)} tone={stats.winRate >= 50 ? "text-emerald-400" : "text-rose-400"} sub={`${fmtInt(stats.wins)} wins / ${fmtInt(stats.losses)} losses`} />
        <Kpi label="Avg win / avg loss" value={stats.payoff === null ? "—" : `${stats.payoff.toFixed(2)}x`} tone="text-blue-400" sub={`${fmtMoney(stats.avgWin, cur)} / ${fmtMoney(stats.avgLoss, cur)}`} />
        <Kpi label="Max win / loss streak" value={`${stats.maxWinStreak} / ${stats.maxLossStreak}`} sub={`Profit factor ${stats.profitFactor === null ? "—" : stats.profitFactor.toFixed(2)}`} />
      </div>

      <Card title="Trade return distribution" subtitle="Net return per closed trade" info="Histogram of per-trade return % after costs." icon={BarChart3} tone="blue">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.bins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="bin" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {stats.bins.map((b, i) => <Cell key={b.bin} fill={i < 4 ? DOWN_COLOR : UP_COLOR} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <TradeInsights bt={wbt} />
      <ExposureCard bt={wbt} />
    </div>
  );
}
