"use client";

import React from "react";
import { Target, BarChart3, Table2, History } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import SparkKpi from "@/components/risk/ui/SparkKpi";
import { FeedGate } from "../ui";
import { useResearch } from "../context";
import { AnalystFeed, researchPath, useFeed } from "@/lib/research/feeds";
import { fmtPx } from "@/lib/research/format";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";
import { isNum } from "@/lib/formatters";

const PERIOD: Record<string, string> = { "0m": "Current", "-1m": "1 month ago", "-2m": "2 months ago", "-3m": "3 months ago" };
const EST: Record<string, string> = { "0q": "Current quarter", "+1q": "Next quarter", "0y": "Current year", "+1y": "Next year" };
const ACTION: Record<string, string> = { main: "Maintains", reit: "Reiterates", up: "Upgrade", down: "Downgrade", init: "Initiates", upgrade: "Upgrade", downgrade: "Downgrade" };
const TARGET: Record<string, string> = { raises: "raises target", lowers: "lowers target", maintains: "keeps target", announces: "sets target", unchanged: "keeps target" };
const words = (a: string | null, t: string | null) => [a ? ACTION[a.toLowerCase()] ?? a : null, t ? TARGET[t.toLowerCase()] ?? t.toLowerCase() : null].filter(Boolean).join(" · ") || "—";
const GRADE = (g: string | null) => (!g ? "text-slate-300" : /buy|outperform|overweight|positive/i.test(g) ? "text-emerald-400" : /sell|underperform|underweight|negative/i.test(g) ? "text-rose-400" : "text-amber-400");

export default function AnalystTab() {
  const { ticker, region, stats: s } = useResearch();
  const feed = useFeed<AnalystFeed>(researchPath(ticker, "analyst"));
  const px = (v: unknown) => fmtPx(v, region);
  return (
    <FeedGate state={feed} rows={8} title="No analyst coverage for this security">{(a) => {
      const pt = a.price_targets, up = (v?: number | null) => (isNum(v) ? (v / s.close - 1) * 100 : null);
      const span = isNum(pt.low) && isNum(pt.high) && pt.high > pt.low ? pt.high - pt.low : null;
      const pos = (v: number) => (span && isNum(pt.low) ? Math.max(0, Math.min(100, ((v - pt.low) / span) * 100)) : 0);
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <SparkKpi label="Last close" value={px(s.close)} />
            <SparkKpi label="Mean target (12M)" value={px(pt.mean)} tone="text-blue-400" sub={<span className={signTone(up(pt.mean))}>{fmtPct(up(pt.mean), 1)} vs last</span>} />
            <SparkKpi label="High target" value={px(pt.high)} tone="text-emerald-400" sub={fmtPct(up(pt.high), 1)} />
            <SparkKpi label="Low target" value={px(pt.low)} tone="text-rose-400" sub={fmtPct(up(pt.low), 1)} />
            <SparkKpi label="Consensus" value={(a.recommendation.key ?? "—").replace("_", " ")} sub={a.recommendation.mean != null ? `Mean ${a.recommendation.mean.toFixed(2)} / 5` : undefined} />
            <SparkKpi label="Analysts" value={a.recommendation.analysts != null ? String(a.recommendation.analysts) : "—"} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Card title="Price target range" subtitle="Where the last close sits" info="Low-to-high analyst target range with the mean and the latest close marked." icon={Target} tone="amber">
                {span ? (
                  <div className="space-y-6 py-4">
                    <div className="relative h-3 rounded-full bg-gradient-to-r from-rose-500/60 via-amber-400/60 to-emerald-500/60">
                      {isNum(pt.mean) && <div className="absolute -top-5 -translate-x-1/2 text-center" style={{ left: `${pos(pt.mean)}%` }}><div className="font-mono text-[10px] text-blue-400">Mean</div><div className="mx-auto h-5 w-0.5 bg-blue-400" /></div>}
                      <div className="absolute -bottom-6 -translate-x-1/2 text-center" style={{ left: `${pos(s.close)}%` }}><div className="mx-auto h-4 w-0.5 bg-white" /><div className="font-mono text-[10px] text-white">Last</div></div>
                    </div>
                    <div className="flex justify-between pt-3 font-mono text-[11px]"><span className="text-rose-400">{px(pt.low)}</span><span className="text-emerald-400">{px(pt.high)}</span></div>
                  </div>
                ) : <EmptyState icon={Target} title="No target range" />}
              </Card>
            </div>
            <div className="lg:col-span-7">
              <Card title="Recommendation trend" subtitle="Number of analysts by rating" info="How many brokers rate the stock Strong Buy / Buy / Hold / Sell / Strong Sell now and in the prior three months." icon={BarChart3} tone="blue">
                <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={a.trend.map((r) => ({ ...r, name: PERIOD[r.period] ?? r.period })).reverse()} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}><CartesianGrid {...GRID_PROPS} /><XAxis dataKey="name" {...AXIS_PROPS} /><YAxis {...AXIS_PROPS} allowDecimals={false} /><Tooltip contentStyle={TOOLTIP_STYLE} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="strongBuy" name="Strong buy" stackId="a" fill="#16A34A" isAnimationActive={false} /><Bar dataKey="buy" name="Buy" stackId="a" fill="#4ADE80" isAnimationActive={false} /><Bar dataKey="hold" name="Hold" stackId="a" fill="#D97706" isAnimationActive={false} /><Bar dataKey="sell" name="Sell" stackId="a" fill="#F87171" isAnimationActive={false} /><Bar dataKey="strongSell" name="Strong sell" stackId="a" fill="#DC2626" isAnimationActive={false} />
                </BarChart></ResponsiveContainer></div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {([["EPS estimates", a.eps_estimates, false], ["Revenue estimates", a.revenue_estimates, true]] as const).map(([title, rows, big]) => (
              <Card key={title} title={title} subtitle="Consensus by period" info="Mean, low and high analyst estimates, the figure a year earlier, number of analysts and expected growth." icon={Table2} tone="purple">
                {rows.length === 0 ? <EmptyState icon={Table2} title="No estimates" /> : (
                  <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
                    <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Period</th><th className="py-1.5 text-right">Avg</th><th className="py-1.5 text-right">Low</th><th className="py-1.5 text-right">High</th><th className="py-1.5 text-right">Year ago</th><th className="py-1.5 text-right">Growth</th><th className="py-1.5 text-right">#</th></tr></thead>
                    <tbody className="divide-y divide-slate-800/50">{rows.map((r, i) => {
                      const f = (v: any) => (isNum(v) ? (big ? (Math.abs(v) >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : `${(v / 1e6).toFixed(0)}M`) : v.toFixed(2)) : "—");
                      return <tr key={i} className="transition-colors hover:bg-slate-800/30"><td className="py-2 text-slate-200">{EST[r.period] ?? r.period}</td><td className="py-2 text-right font-mono font-semibold text-white">{f(r.avg)}</td><td className="py-2 text-right font-mono text-slate-300">{f(r.low)}</td><td className="py-2 text-right font-mono text-slate-300">{f(r.high)}</td><td className="py-2 text-right font-mono text-slate-400">{f(r.yearAgoEps ?? r.yearAgoRevenue)}</td><td className={cn("py-2 text-right font-mono", signTone(isNum(r.growth) ? r.growth : null))}>{isNum(r.growth) ? fmtPct(r.growth * 100, 1) : "—"}</td><td className="py-2 text-right font-mono text-slate-400">{r.numberOfAnalysts ?? "—"}</td></tr>;
                    })}</tbody>
                  </table></div>
                )}
              </Card>
            ))}
          </div>

          <Card title="Recent rating changes" subtitle="Upgrades, downgrades and target changes" info="Broker rating actions as reported by the data provider. Coverage of individual rating changes is largely limited to US-listed stocks." icon={History} tone="rose">
            {a.actions.length === 0 ? <EmptyState icon={History} title="No individual rating changes" hint="The data provider does not publish broker-level actions for this security." /> : (
              <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
                <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Date</th><th className="py-1.5 text-left">Firm</th><th className="py-1.5 text-left">Rating</th><th className="py-1.5 text-left">Action</th><th className="py-1.5 text-right">Target</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50">{a.actions.map((r, i) => <tr key={i} className="transition-colors hover:bg-slate-800/30"><td className="py-2 font-mono text-slate-400">{r.date ?? "—"}</td><td className="py-2 font-medium text-slate-200">{r.firm ?? "—"}</td><td className={cn("py-2 font-semibold", GRADE(r.to_grade))}>{r.from_grade && r.from_grade !== r.to_grade ? `${r.from_grade} → ` : ""}{r.to_grade ?? "—"}</td><td className="py-2 capitalize text-slate-300">{words(r.action, r.target_action)}</td><td className="py-2 text-right font-mono text-slate-100">{isNum(r.target) && r.target > 0 ? px(r.target) : "—"}</td></tr>)}</tbody>
              </table></div>
            )}
          </Card>
        </div>
      );
    }}</FeedGate>
  );
}
