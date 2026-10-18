"use client";

import React, { useMemo } from "react";
import { Crosshair, LogOut } from "lucide-react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { BacktestResult, TradeRecord } from "@/types";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import { AXIS_PROPS, DOWN_COLOR, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR } from "@/lib/chartTheme";
import { currencyOf, fmtMoney } from "@/lib/analyticsCalc";
import { fmtPct, cn } from "@/lib/utils";

const REASON: Record<string, string> = { SIGNAL: "Exit rule", STOP_LOSS: "Stop loss", TAKE_PROFIT: "Take profit", TRAILING_STOP: "Trailing stop", END_OF_DATA: "End of window" };

/** Why trades ended, and how far they ran for or against the position. */
export default function TradeInsights({ bt, onSelectTrade }: { bt: BacktestResult; onSelectTrade: (t: TradeRecord) => void }) {
  const cur = currencyOf(bt);
  const groups = useMemo(() => {
    const m = new Map<string, TradeRecord[]>();
    bt.trades.forEach((t) => { m.set(t.exit_reason, [...(m.get(t.exit_reason) ?? []), t]); });
    return [...m.entries()].map(([k, ts]) => ({ key: k, label: REASON[k] ?? k, n: ts.length, win: (ts.filter((t) => t.net_pnl > 0).length / ts.length) * 100, avg: ts.reduce((s, t) => s + t.return_pct, 0) / ts.length, pnl: ts.reduce((s, t) => s + t.net_pnl, 0) }))
      .sort((a, b) => b.n - a.n);
  }, [bt.trades]);
  const pts = useMemo(() => bt.trades.filter((t) => typeof t.mae === "number" && typeof t.mfe === "number").map((t) => ({ mae: Math.abs(t.mae as number), mfe: Math.abs(t.mfe as number), win: t.net_pnl > 0, trade: t })), [bt.trades]);
  if (!bt.trades.length) return null;
  const maxN = Math.max(...groups.map((g) => g.n));
  const dot = (win: boolean) => function Dot(p: any) {
    const { cx, cy, payload } = p;
    return cx == null ? <g /> : <circle cx={cx} cy={cy} r={4} fill={win ? UP_COLOR : DOWN_COLOR} fillOpacity={0.7} stroke="#0b1222" style={{ cursor: "pointer" }} onClick={() => onSelectTrade(payload.trade)} />;
  };
  const WinDot = dot(true), LossDot = dot(false);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Exit reasons" subtitle="How each trade ended" info="Shows whether profits come from your exit rules, targets or stops, and what each way of exiting costs or earns. A strategy that mostly exits on stops is paying for being wrong often." icon={LogOut} tone="rose">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Reason</th><th className="py-1.5 text-right">Trades</th><th className="py-1.5 text-right">Win rate</th><th className="py-1.5 text-right">Avg return</th><th className="py-1.5 text-right">Net P&amp;L</th></tr></thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            {groups.map((g) => (
              <tr key={g.key}>
                <td className="py-2 font-sans text-slate-200"><div>{g.label}</div><div className="mt-1 h-1 rounded bg-slate-800"><div className="h-1 rounded bg-blue-500/70" style={{ width: `${(g.n / maxN) * 100}%` }} /></div></td>
                <td className="py-2 text-right text-slate-300">{g.n}</td>
                <td className="py-2 text-right text-slate-300">{fmtPct(g.win, 0, false)}</td>
                <td className={cn("py-2 text-right", signTone(g.avg))}>{fmtPct(g.avg)}</td>
                <td className={cn("py-2 text-right font-semibold", signTone(g.pnl))}>{fmtMoney(g.pnl, cur)}</td>
              </tr>))}
          </tbody>
        </table>
      </Card>
      <Card title="Excursions" subtitle="How far each trade ran against and for you" info="Each dot is a trade: how far it fell against you (MAE, across) and how far it ran in your favour (MFE, up). Winners that dipped deep suggest the stop is too tight to matter or too loose to help; losers that first ran far suggest the exit gave profit back. Click a dot to inspect the trade." icon={Crosshair} tone="amber">
        {!pts.length ? <EmptyState icon={Crosshair} title="No excursion data" /> : (
          <div className="h-60" aria-label="MAE versus MFE"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 8, right: 12, left: -6, bottom: 8 }}>
            <CartesianGrid {...GRID_PROPS} /><XAxis type="number" dataKey="mae" name="MAE" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} label={{ value: "Worst drawdown while open (MAE)", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 10 }} />
            <YAxis type="number" dataKey="mfe" name="MFE" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><ZAxis range={[40, 40]} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: Math.max(...pts.map((p) => p.mae)), y: Math.max(...pts.map((p) => p.mae)) }]} stroke="#475569" strokeDasharray="3 3" />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: "3 3" }} formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
            <Scatter name="Winners" data={pts.filter((p) => p.win)} shape={<WinDot />} isAnimationActive={false} />
            <Scatter name="Losers" data={pts.filter((p) => !p.win)} shape={<LossDot />} isAnimationActive={false} />
          </ScatterChart></ResponsiveContainer></div>
        )}
        <div className="mt-1 flex gap-4 text-[11px] text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Winners</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Losers</span></div>
      </Card>
    </div>
  );
}
