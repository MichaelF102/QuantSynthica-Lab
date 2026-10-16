"use client";

import React from "react";
import { Settings2 } from "lucide-react";
import { BacktestResult, ConditionRule, StrategyConfig } from "@/types";
import { Card } from "@/components/ui/Card";
import { fmtMoney, currencyOf } from "@/lib/analyticsCalc";

const OPS: Record<string, string> = { GT: ">", LT: "<", GTE: "≥", LTE: "≤", EQ: "=", CROSSES_ABOVE: "crosses above", CROSSES_BELOW: "crosses below", crosses_above: "crosses above", crosses_below: "crosses below" };
const describe = (r: ConditionRule) => {
  const l = r.indicator_a ?? r.left_indicator ?? "?", rt = r.indicator_b ?? r.right_indicator;
  return `${l} ${OPS[String(r.operator)] ?? String(r.operator).toLowerCase().replace(/_/g, " ")} ${rt ?? r.threshold ?? "—"}`;
};
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex items-center justify-between gap-3 border-b border-slate-800/50 py-1.5 last:border-0"><span className="text-slate-400">{k}</span><span className="font-mono font-semibold text-white">{v}</span></div>;
const pct = (v?: number | null) => (typeof v === "number" ? `${v}%` : "—");

export default function StrategyConfigCard({ bt, strategy }: { bt: BacktestResult; strategy: StrategyConfig | null }) {
  if (!strategy) return null;
  const { risk: r, execution: e } = strategy;
  const cur = currencyOf(bt);
  const rules = (title: string, list: ConditionRule[]) => (
    <div><div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <div className="space-y-1">{list.length ? list.map((x, i) => <div key={x.id ?? i} className="rounded-lg border border-slate-800 bg-[#080d1a] px-2.5 py-1.5 font-mono text-[11px] text-slate-200">{i > 0 && <span className="mr-1.5 text-blue-400">{x.logical_operator ?? "AND"}</span>}{describe(x)}</div>) : <div className="text-xs text-slate-500">—</div>}</div></div>
  );
  return (
    <Card title="Strategy configuration" subtitle={strategy.name} info="The indicators, rules and risk settings this run used." icon={Settings2} tone="purple">
      <div className="grid grid-cols-1 gap-5 text-xs md:grid-cols-2 xl:grid-cols-4">
        <div><div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Indicators</div>
          <div className="space-y-1">{strategy.indicators.length ? strategy.indicators.map((i) => <div key={i.id} className="rounded-lg border border-slate-800 bg-[#080d1a] px-2.5 py-1.5 font-mono text-[11px] text-slate-200"><span className="font-bold text-white">{i.name}</span> <span className="text-slate-500">({i.id})</span> {Object.entries(i.params).map(([k, v]) => `${k}=${v}`).join(", ")}</div>) : <div className="text-slate-500">—</div>}</div></div>
        <div className="space-y-4">{rules("Entry rules", strategy.entry_rules)}{rules("Exit rules", strategy.exit_rules)}</div>
        <div><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Risk</div>
          <Row k="Stop loss" v={pct(r.stop_loss_pct)} /><Row k="Take profit" v={pct(r.take_profit_pct)} /><Row k="Trailing stop" v={pct(r.trailing_stop_pct)} /><Row k="Position size" v={pct(r.position_size_pct)} /><Row k="Max positions" v={r.max_positions} /><Row k="Shorting" v={r.allow_short ? "Allowed" : "Off"} /></div>
        <div><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Execution</div>
          <Row k="Initial capital" v={fmtMoney(e.initial_capital, cur)} /><Row k="Commission" v={pct(e.commission_pct)} /><Row k="Slippage" v={pct(e.slippage_pct)} /><Row k="Spread" v={pct(e.spread_pct)} /><Row k="Fractional shares" v={e.allow_fractional ? "Yes" : "No"} /><Row k="Fills" v="Next open (t+1)" /></div>
      </div>
    </Card>
  );
}
