"use client";

import React from "react";
import { PieChart as PieIcon, Sliders } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { fmtPct, cn } from "@/lib/utils";
import { CurrencyCode, fmtMoney } from "@/lib/analyticsCalc";
import { TOOLTIP_STYLE } from "@/lib/chartTheme";

export interface AssetAllocation {
  ticker: string;
  weight: number;
  value: number;
  color: string;
  targetWeight?: number;
  drift?: number;
}

interface Props {
  totalValue: number | null;
  allocations: AssetAllocation[];
  /** Weights (%) after drift since the last rebalance, from the simulation. */
  currentWeights?: Record<string, number> | null;
  currency: CurrencyCode;
  onEditBasket?: () => void;
}

export default function PortfolioAllocationWidget({ totalValue, allocations, currentWeights, currency, onEditBasket }: Props) {
  const rows = allocations.map((a) => {
    const cur = currentWeights?.[a.ticker];
    return { ...a, current: cur ?? null, drift: cur === undefined ? null : cur - a.weight, value: totalValue === null || cur === undefined ? null : (totalValue * cur) / 100 };
  });
  return (
    <Card
      title="Allocation"
      subtitle={totalValue === null ? "Target weights" : `Portfolio value ${fmtMoney(totalValue, currency)}`}
      info="Target = the weights you set. Current = weights after price drift since the last rebalance at the end of the period; drift is current minus target."
      icon={PieIcon}
      tone="blue"
      action={onEditBasket && <button type="button" onClick={onEditBasket} className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"><Sliders className="h-3 w-3" /> Edit</button>}
    >
      <div className="grid grid-cols-5 items-center gap-3">
        <div className="col-span-2 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={allocations} dataKey="weight" nameKey="ticker" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="none" isAnimationActive={false}>
                {allocations.map((a) => <Cell key={a.ticker} fill={a.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [`${Number(v).toFixed(2)}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <table className="col-span-3 w-full border-collapse text-[11px]">
          <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1 text-left">Asset</th><th className="py-1 text-right">Target</th><th className="py-1 text-right">Current</th><th className="py-1 text-right">Drift</th></tr></thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.map((r) => (
              <tr key={r.ticker} className="transition-colors hover:bg-slate-800/30">
                <td className="py-1.5"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} /><span className="font-mono font-semibold text-slate-200">{r.ticker}</span></td>
                <td className="py-1.5 text-right font-mono text-slate-300">{fmtPct(r.weight, 1, false)}</td>
                <td className="py-1.5 text-right font-mono text-white">{r.current === null ? "—" : fmtPct(r.current, 1, false)}</td>
                <td className={cn("py-1.5 text-right font-mono", r.drift === null ? "text-slate-500" : r.drift > 0 ? "text-emerald-400" : r.drift < 0 ? "text-rose-400" : "text-slate-300")}>{r.drift === null ? "—" : fmtPct(r.drift, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-right font-mono text-[10px] text-slate-500">Σ target = {fmtPct(allocations.reduce((s, a) => s + a.weight, 0), 2, false)}</div>
    </Card>
  );
}
