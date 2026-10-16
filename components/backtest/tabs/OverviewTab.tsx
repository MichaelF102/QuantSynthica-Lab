"use client";

import React, { useMemo } from "react";
import { LineChart as LineIcon, TrendingDown, BarChart3, PieChart as PieIcon, Scale } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend, PieChart, Pie, Cell } from "recharts";
import { BacktestResult, StrategyConfig, TradeRecord } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { ReturnHistogram } from "@/components/risk/ui/charts";
import TradeTable from "@/components/tables/TradeTable";
import { MonthlyMatrixCard } from "./MonthlyTab";
import StrategyConfigCard from "./StrategyConfigCard";
import { benchmarkLabel, currencyOf, CURRENCY_SYMBOL, fmtMoney, monthlyMatrix, seriesStats, toPts } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";
import { formatRatio } from "@/lib/formatters";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

interface Props { bt: BacktestResult; strategy: StrategyConfig | null; selectedTradeId?: string | null; onSelectTrade: (t: TradeRecord) => void }

export default function OverviewTab({ bt, strategy, selectedTradeId, onSelectTrade }: Props) {
  const m = bt.metrics!;
  const cur = currencyOf(bt);
  const pts = useMemo(() => toPts(bt.equity_curve), [bt]);
  const st = useMemo(() => seriesStats(pts, "Daily"), [pts]);
  const rets = useMemo(() => pts.slice(1).map((p, i) => p.value / pts[i].value - 1), [pts]);
  const matrix = useMemo(() => monthlyMatrix(pts), [pts]);
  const eq = useMemo(() => { const v0 = pts[0]?.value ?? 1, b0 = pts[0]?.bench ?? 1; return pts.map((p) => ({ date: p.date, Strategy: p.value, Benchmark: (p.bench / b0) * v0, dd: -Math.abs(p.dd) })); }, [pts]);
  const longs = bt.trades.filter((t) => t.direction.includes("LONG")).length, shorts = bt.trades.length - longs;
  const bName = benchmarkLabel(bt.benchmark);
  const hasBench = pts.some((p) => p.bench !== pts[0]?.bench);
  const pnl = bt.trades.reduce((s, t) => s + t.net_pnl, 0);

  const compare: { k: string; s: string; b: string; tone?: string }[] = st ? [
    { k: "Total return", s: fmtPct(st.totalReturn), b: hasBench ? fmtPct(st.benchReturn) : "—", tone: signTone(st.totalReturn) },
    { k: "CAGR", s: fmtPct(st.cagr), b: hasBench ? fmtPct(st.benchCagr) : "—", tone: signTone(st.cagr) },
    { k: "Sharpe", s: formatRatio(st.sharpe), b: hasBench ? formatRatio(st.benchSharpe) : "—" },
    { k: "Volatility (ann.)", s: fmtPct(st.vol, 1, false), b: hasBench ? fmtPct(st.benchVol, 1, false) : "—" },
    { k: "Max drawdown", s: fmtPct(-st.maxDD, 1), b: hasBench ? fmtPct(-st.benchMaxDD, 1) : "—", tone: "text-rose-400" },
    { k: "Calmar", s: formatRatio(st.calmar), b: hasBench && st.benchMaxDD > 0 ? formatRatio(st.benchCagr / st.benchMaxDD) : "—" },
  ] : [];

  return (
    <div className="space-y-4 font-sans">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Total return" value={fmtPct(m.total_return)} tone={signTone(m.total_return)} sub={st && hasBench ? <span className={signTone(st.totalReturn - st.benchReturn)}>{fmtPct(st.totalReturn - st.benchReturn)} vs bench</span> : "No benchmark data"} />
        <Kpi label="CAGR" value={fmtPct(m.cagr)} tone={signTone(m.cagr)} sub="Annualised" />
        <Kpi label="Sharpe" value={formatRatio(m.sharpe_ratio)} sub={st && hasBench ? `Bench ${formatRatio(st.benchSharpe)}` : "Risk-adjusted"} title="Rf = 0%" />
        <Kpi label="Sortino" value={formatRatio(m.sortino_ratio)} sub="Downside risk" />
        <Kpi label="Max drawdown" value={fmtPct(-Math.abs(m.max_drawdown), 1)} tone="text-rose-400" sub="Peak to trough" />
        <Kpi label="Win rate" value={fmtPct(m.win_rate, 1, false)} sub={`Profit factor ${Number.isFinite(m.profit_factor) ? m.profit_factor.toFixed(2) : "—"}`} />
        <Kpi label="Volatility (ann.)" value={fmtPct(m.annualized_volatility, 1, false)} sub={`${fmtInt(m.num_trades)} trades`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card title="Equity curve" subtitle={`${bt.strategy_name} vs ${bName}, rebased to the starting value`} info="Portfolio value over the run, with the benchmark rebased to the same starting value." icon={LineIcon} tone="blue">
            <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={eq} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} domain={["auto", "auto"]} tickFormatter={(v) => fmtMoney(v, cur, true)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtMoney(Number(v), cur)} /><Legend wrapperStyle={{ fontSize: 11 }} />
              {hasBench && <Line dataKey="Benchmark" stroke="#64748B" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />}
              <Line dataKey="Strategy" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart></ResponsiveContainer></div>
          </Card>
        </div>
        <div className="xl:col-span-4">
          <Card title="Underwater drawdown" subtitle="Distance below running peak" info="How far the portfolio is below its previous high at each date." icon={TrendingDown} tone="rose">
            <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={eq} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <defs><linearGradient id="btDd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0.4} /></linearGradient></defs>
              <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="date" {...AXIS_PROPS} minTickGap={60} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} /><ReferenceLine y={0} stroke="#475569" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v), 2)} />
              <Area dataKey="dd" stroke="#EF4444" strokeWidth={1.8} fill="url(#btDd)" isAnimationActive={false} />
            </AreaChart></ResponsiveContainer></div>
          </Card>
        </div>
      </div>

      {matrix.length > 0 && <MonthlyMatrixCard matrix={matrix} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card title="Return distribution" subtitle="Daily strategy returns" info="Histogram of daily portfolio returns. This strategy is flat on days it holds no position, so the zero bin is usually tallest." icon={BarChart3} tone="purple">
            <ReturnHistogram returns={rets} fit height={230} />
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card title="Trade direction" subtitle={`${fmtInt(bt.trades.length)} closed trades`} info="Share of trades that were long versus short." icon={PieIcon} tone="amber">
            {bt.trades.length === 0 ? <EmptyState icon={PieIcon} title="No trades" /> : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-40 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart>
                  <Pie data={[{ name: "Long", v: longs }, { name: "Short", v: shorts }].filter((d) => d.v > 0)} dataKey="v" innerRadius="62%" outerRadius="90%" stroke="none" isAnimationActive={false}>
                    {[UP_COLOR, DOWN_COLOR].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie><Tooltip contentStyle={TOOLTIP_STYLE} /></PieChart></ResponsiveContainer></div>
                <div className="flex gap-4 text-xs"><span className="flex items-center gap-1.5 text-slate-300"><i className="h-2 w-2 rounded-full bg-emerald-500" />Long <b className="font-mono text-white">{longs}</b></span><span className="flex items-center gap-1.5 text-slate-300"><i className="h-2 w-2 rounded-full bg-rose-500" />Short <b className="font-mono text-white">{shorts}</b></span></div>
                <div className="text-center text-xs text-slate-400">Net P&amp;L <span className={cn("font-mono font-bold", signTone(pnl))}>{fmtMoney(pnl, cur)}</span></div>
              </div>)}
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card title="Strategy vs benchmark" subtitle={bName} info="Computed from this run's equity curve and the benchmark over the same dates." icon={Scale} tone="emerald">
            {!compare.length ? <EmptyState icon={Scale} title="Not enough data" /> : (
              <table className="w-full text-xs"><thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Metric</th><th className="py-1.5 text-right">Strategy</th><th className="py-1.5 text-right">Benchmark</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50">{compare.map((r) => <tr key={r.k}><td className="py-2 text-slate-400">{r.k}</td><td className={cn("py-2 text-right font-mono font-semibold", r.tone ?? "text-white")}>{r.s}</td><td className="py-2 text-right font-mono text-slate-300">{r.b}</td></tr>)}</tbody></table>)}
          </Card>
        </div>
      </div>

      <TradeTable trades={bt.trades} backtestId={bt.id} currency={CURRENCY_SYMBOL[cur]} onSelectTrade={onSelectTrade} selectedTradeId={selectedTradeId} />
      <StrategyConfigCard bt={bt} strategy={strategy} />
    </div>
  );
}
