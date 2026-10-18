"use client";

import React from "react";
import { Info } from "lucide-react";
import { BacktestResult, StrategyConfig } from "@/types";
import { Card } from "@/components/ui/Card";
import { currencyOf, fmtMoney } from "@/lib/analyticsCalc";

const Row = ({ k, v, warn }: { k: string; v: React.ReactNode; warn?: boolean }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-800/50 py-1.5 last:border-0"><span className="text-slate-400">{k}</span><span className={`text-right font-mono font-semibold ${warn ? "text-amber-300" : "text-white"}`}>{v}</span></div>
);

/** What this run actually used, so its numbers can be reproduced or questioned. */
export default function RunDetailsCard({ bt, strategy }: { bt: BacktestResult; strategy: StrategyConfig | null }) {
  const cur = currencyOf(bt);
  const curve = bt.equity_curve;
  const e = strategy?.execution, r = strategy?.risk;
  const sideCost = e ? e.commission_pct + e.slippage_pct + e.spread_pct / 2 : null;
  const dir = r ? ({ long: "Long only", short: "Short only", both: "Long & short" } as const)[r.direction ?? (r.allow_short ? "both" : "long")] : null;
  const stop = r ? (r.stop_atr_mult ? `${r.stop_atr_mult} × ATR(${r.atr_period ?? 14})` : r.stop_loss_pct != null ? `${r.stop_loss_pct}%` : "None") : null;
  const created = bt.created_at ? new Date(bt.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
  return (
    <Card title="Run details" subtitle="Data, costs and rules behind these numbers" info="Everything needed to reproduce this run or judge how realistic it is. Costs are charged on both entry and exit." icon={Info} tone="blue">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 text-xs md:grid-cols-3">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Data</div>
          <Row k="Security" v={bt.ticker} />
          <Row k="Prices" v={bt.is_synthetic ? "Generated (not real)" : "Real daily bars"} warn={bt.is_synthetic} />
          <Row k="Bars in run" v={curve.length ? curve.length.toLocaleString() : "—"} />
          <Row k="First / last bar" v={curve.length ? `${curve[0].date} → ${curve[curve.length - 1].date}` : "—"} />
          <Row k="Requested window" v={`${bt.start_date} → ${bt.end_date}`} />
          <Row k="Price fingerprint" v={bt.data_fingerprint ?? "not recorded"} warn={!bt.data_fingerprint} />
          <Row k="Benchmark" v={bt.benchmark} />
        </div>
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Costs and fills</div>
          {e ? (<>
            <Row k="Initial capital" v={fmtMoney(e.initial_capital, cur)} />
            <Row k="Commission" v={`${e.commission_pct}% per side`} />
            <Row k="Slippage" v={`${e.slippage_pct}% per side`} />
            <Row k="Spread" v={`${e.spread_pct}% (half per side)`} />
            <Row k="Round trip cost" v={`≈ ${(2 * (sideCost ?? 0)).toFixed(2)}%`} />
            <Row k="Fills" v="Next bar open (t+1)" />
          </>) : <p className="text-slate-500">The strategy this run used is no longer available.</p>}
        </div>
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Positioning</div>
          {r ? (<>
            <Row k="Direction" v={dir} />
            <Row k="Position size" v={`${r.position_size_pct}% of equity`} />
            <Row k="Open at once" v={r.allow_stacking ? `Up to ${r.max_positions} (stacked)` : "One at a time"} warn={!!r.allow_stacking} />
            <Row k="Stop" v={stop} />
            <Row k="Volatility target" v={r.target_volatility ? `${r.target_volatility}% / yr` : "Off"} />
            <Row k="Engine revision" v={bt.engine_version ?? "not recorded"} warn={!bt.engine_version} />
            <Row k="Strategy copy" v={bt.strategy_config ? "Saved with the run" : "Not saved (older run)"} warn={!bt.strategy_config} />
            <Row k="Run" v={<span title={bt.id}>{bt.id} · {created}</span>} />
          </>) : <p className="text-slate-500">—</p>}
        </div>
      </div>
    </Card>
  );
}
