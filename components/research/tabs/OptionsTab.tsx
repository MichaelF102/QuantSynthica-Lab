"use client";

import React, { useMemo, useState } from "react";
import { Layers, BarChart3, Activity, Table2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { Card, EmptyState } from "@/components/ui/Card";
import SparkKpi from "@/components/risk/ui/SparkKpi";
import { FeedGate } from "../ui";
import { useResearch } from "../context";
import { OptionRow, OptionsFeed, useFeed } from "@/lib/research/feeds";
import { fmtPx, fmtVol, num } from "@/lib/research/format";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";

export default function OptionsTab() {
  const { ticker, region } = useResearch();
  const [exp, setExp] = useState<string | null>(null);
  const feed = useFeed<OptionsFeed>(`/market/universe/options?symbol=${encodeURIComponent(ticker)}${exp ? `&expiration=${exp}` : ""}`);
  return (
    <FeedGate state={feed} rows={8} title="No listed options for this security">{(o) => <Chain o={o} region={region} exp={exp ?? o.selectedExpiration ?? ""} setExp={setExp} />}</FeedGate>
  );
}

function Chain({ o, region, exp, setExp }: { o: OptionsFeed; region: "India" | "US"; exp: string; setExp: (e: string) => void }) {
  const u = o.underlyingPrice ?? 0;
  const { strikes, atmIv, window: win } = useMemo(() => {
    const ks = [...new Set([...o.calls, ...o.puts].map((r) => r.strike))].sort((a, b) => a - b);
    const near = ks.reduce((b, k) => (Math.abs(k - u) < Math.abs(b - u) ? k : b), ks[0] ?? 0);
    const c = o.calls.find((r) => r.strike === near), p = o.puts.find((r) => r.strike === near);
    const ivs = [c?.impliedVolatility, p?.impliedVolatility].filter((v): v is number => typeof v === "number" && v > 1); // IV at or below 1% is a provider placeholder
    const idx = ks.indexOf(near);
    return { strikes: ks, atmIv: ivs.length ? ivs.reduce((a, b) => a + b, 0) / ivs.length : null, window: ks.slice(Math.max(0, idx - 10), idx + 11) };
  }, [o, u]);
  const cm = new Map(o.calls.map((r) => [r.strike, r])), pm = new Map(o.puts.map((r) => [r.strike, r]));
  const chart = strikes.filter((k) => k >= u * 0.8 && k <= u * 1.2).map((k) => ({ strike: k, callOI: cm.get(k)?.openInterest ?? 0, putOI: pm.get(k)?.openInterest ?? 0, callIV: (cm.get(k)?.impliedVolatility ?? 0) > 1 ? cm.get(k)!.impliedVolatility : null, putIV: (pm.get(k)?.impliedVolatility ?? 0) > 1 ? pm.get(k)!.impliedVolatility : null }));
  const cell = (r: OptionRow | undefined, side: "c" | "p") => {
    const vals = [r?.bid, r?.ask, r?.lastPrice].map((v) => (v != null && v > 0 ? v.toFixed(2) : "—")); // zero means no quote
    return [...vals, r ? fmtVol(r.volume, region) : "—", r ? fmtVol(r.openInterest, region) : "—", r && r.impliedVolatility > 1 ? `${r.impliedVolatility.toFixed(1)}%` : "—", r && r.impliedVolatility > 1 && r.delta != null ? r.delta.toFixed(2) : "—"].map((v, i) => <td key={`${side}${i}`} className="py-1.5 text-right font-mono text-slate-200">{v}</td>);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="text-slate-400">Expiry</label>
        <select value={exp} onChange={(e) => setExp(e.target.value)} aria-label="Expiry" className="rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2.5 py-1.5 font-mono text-xs text-slate-100 outline-none focus:border-blue-500">{o.expirations.map((d) => <option key={d}>{d}</option>)}</select>
        <span className="text-slate-500">{o.expirations.length} expiries listed</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <SparkKpi label="Underlying" value={fmtPx(u, region)} />
        <SparkKpi label="Days to expiry" value={o.daysToExpiration != null ? String(o.daysToExpiration) : "—"} />
        <SparkKpi label="Put/call (volume)" value={o.putCallRatioVol != null ? o.putCallRatioVol.toFixed(2) : "—"} tone={(o.putCallRatioVol ?? 0) > 1 ? "text-rose-400" : "text-emerald-400"} />
        <SparkKpi label="Put/call (open int.)" value={o.putCallRatioOI != null ? o.putCallRatioOI.toFixed(2) : "—"} tone={(o.putCallRatioOI ?? 0) > 1 ? "text-rose-400" : "text-emerald-400"} />
        <SparkKpi label="Max pain" value={o.maxPain != null ? fmtPx(o.maxPain, region) : "—"} hint="Strike at which option holders would lose the most at expiry" />
        <SparkKpi label="At-the-money IV" value={atmIv != null ? fmtPct(atmIv, 1, false) : "—"} hint="Average implied volatility of the nearest-strike call and put" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Open interest by strike" subtitle="Within ±20% of the underlying" info="Open interest of calls and puts at each strike. Large clusters can act as support or resistance into expiry." icon={BarChart3} tone="blue">
          <div className="h-60"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}><CartesianGrid {...GRID_PROPS} /><XAxis dataKey="strike" {...AXIS_PROPS} minTickGap={20} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => fmtVol(v, region)} /><Tooltip contentStyle={TOOLTIP_STYLE} /><ReferenceLine x={chart.reduce((b, r) => (Math.abs(r.strike - u) < Math.abs(b - u) ? r.strike : b), chart[0]?.strike ?? 0)} stroke="#F59E0B" strokeDasharray="4 3" label={{ value: "Spot", fill: "#F59E0B", fontSize: 10, position: "top" }} /><Bar dataKey="callOI" name="Calls" fill="#10B981" isAnimationActive={false} /><Bar dataKey="putOI" name="Puts" fill="#F43F5E" isAnimationActive={false} /><Legend wrapperStyle={{ fontSize: 11 }} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title="Implied volatility smile" subtitle="IV by strike" info="Implied volatility of each contract. A skew toward lower strikes means the market pays more for downside protection." icon={Activity} tone="purple">
          <div className="h-60">{chart.every((r) => r.callIV === null && r.putIV === null) ? <EmptyState icon={Activity} title="Implied volatility unavailable" hint="The data provider has no implied volatility for this expiry right now (typically when the market is closed)." /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}><CartesianGrid {...GRID_PROPS} /><XAxis dataKey="strike" {...AXIS_PROPS} minTickGap={20} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Number(v).toFixed(1)}%`} /><Line dataKey="callIV" name="Calls" stroke="#10B981" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} /><Line dataKey="putIV" name="Puts" stroke="#F43F5E" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} /><Legend wrapperStyle={{ fontSize: 11 }} /></LineChart></ResponsiveContainer>}</div>
        </Card>
      </div>
      <Card title="Option chain" subtitle={`${exp} · 21 strikes around the money`} info="Calls on the left, puts on the right. In-the-money rows are shaded. Greeks are Black-Scholes estimates from each contract's implied volatility." icon={Table2} tone="amber">
        <div className="w-full overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500"><th colSpan={6} className="pb-1 text-center text-emerald-400">Calls</th><th /><th colSpan={6} className="pb-1 text-center text-rose-400">Puts</th></tr>
            <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">{["Bid", "Ask", "Last", "Vol", "OI", "IV", "Δ"].slice(0, 7).map((h) => <th key={`c${h}`} className="py-1.5 text-right">{h}</th>)}<th className="py-1.5 text-center">Strike</th>{["Bid", "Ask", "Last", "Vol", "OI", "IV", "Δ"].map((h) => <th key={`p${h}`} className="py-1.5 text-right">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {win.map((k) => (
              <tr key={k} className="transition-colors hover:bg-slate-800/30">
                {cell(cm.get(k), "c").map((c, i) => React.cloneElement(c, { className: cn(c.props.className, cm.get(k)?.inTheMoney && "bg-emerald-500/5"), key: `c${i}` }))}
                <td className="px-2 py-1.5 text-center font-mono font-bold text-white">{num(k, 2)}</td>
                {cell(pm.get(k), "p").map((c, i) => React.cloneElement(c, { className: cn(c.props.className, pm.get(k)?.inTheMoney && "bg-rose-500/5"), key: `p${i}` }))}
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </div>
  );
}
