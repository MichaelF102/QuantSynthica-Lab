"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/Card";
import { signTone } from "@/components/ui/Card";
import { FeedGate } from "../ui";
import { useResearch } from "../context";
import { PeersFeed, researchPath, useFeed } from "@/lib/research/feeds";
import { api } from "@/lib/api";
import { riskSnapshot, performance } from "@/lib/research/derive";
import { fmtBig, num } from "@/lib/research/format";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";

interface Live { ret: number | null; vol: number | null; dd: number | null }

export default function CompetitorsTab() {
  const { ticker, region, bars, fundamentals: f } = useResearch();
  const router = useRouter();
  const feed = useFeed<PeersFeed>(researchPath(ticker, "peers"));
  const [live, setLive] = useState<Record<string, Live>>({});
  const peers = feed.data?.peers ?? [];
  const peerKey = peers.map((p) => p.symbol).join(",");
  const self = useMemo(() => {
    const r = riskSnapshot(bars.slice(-252), null);
    return { ret: performance(bars, null).find((p) => p.label === "1 Year")?.ret ?? null, vol: r?.vol ?? null, dd: r?.maxDD ?? null } as Live;
  }, [bars]);

  // Real trailing-year statistics for each peer, computed from their own price bars.
  useEffect(() => {
    if (!peers.length) return;
    let live2 = true;
    const end = new Date().toISOString().slice(0, 10), start = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
    Promise.allSettled(peers.map((p) => api.getMarketData({ ticker: p.symbol, start_date: start, end_date: end }))).then((res) => {
      if (!live2) return;
      const out: Record<string, Live> = {};
      res.forEach((r, i) => {
        if (r.status !== "fulfilled" || r.value.summary?.is_synthetic) return;
        const b = r.value.bars, risk = riskSnapshot(b.slice(-252), null);
        out[peers[i].symbol] = { ret: performance(b, null).find((x) => x.label === "1 Year")?.ret ?? null, vol: risk?.vol ?? null, dd: risk?.maxDD ?? null };
      });
      setLive(out);
    });
    return () => { live2 = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerKey]);

  const clean = ticker.replace(/\.(NS|BO)$/, "");
  const go = (sym: string) => router.push(`/research?ticker=${encodeURIComponent(sym)}&country=${region}&tab=competitors`);
  return (
    <FeedGate state={feed} rows={8} title="No peers found">{(d) => {
      const rows = [{ symbol: clean, name: f?.name ?? clean, market_cap: f?.market_cap ?? null, pe_ratio: f?.pe_ratio ?? null, me: true, ...self }, ...peers.map((p) => ({ ...p, me: false, ...(live[p.symbol] ?? { ret: null, vol: null, dd: null }) }))];
      const chart = rows.filter((r) => r.ret !== null).map((r) => ({ name: r.symbol.replace(/\.(NS|BO)$/, ""), ret: r.ret as number, me: r.me }));
      return (
        <div className="space-y-4">
          <Card title="Peer comparison" subtitle={`${d.sector} · ${peers.length} largest peers by market cap`} info={d.note ?? ""} icon={Users} tone="blue">
            <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Company</th><th className="py-1.5 text-right">Market cap</th><th className="py-1.5 text-right">P/E</th><th className="py-1.5 text-right">1Y return</th><th className="py-1.5 text-right">Volatility</th><th className="py-1.5 text-right">Max DD</th></tr></thead>
              <tbody className="divide-y divide-slate-800/50">{rows.map((r) => (
                <tr key={r.symbol} onClick={!r.me ? () => go(r.symbol) : undefined} className={cn("transition-colors", r.me ? "bg-blue-500/10" : "cursor-pointer hover:bg-slate-800/30")}>
                  <td className="py-2"><div className="font-mono font-semibold text-slate-100">{r.symbol.replace(/\.(NS|BO)$/, "")}{r.me && <span className="ml-1.5 rounded-full border border-blue-500/30 px-1.5 text-[9px] text-blue-300">this stock</span>}</div><div className="max-w-[240px] truncate text-[10px] text-slate-500">{r.name}</div></td>
                  <td className="py-2 text-right font-mono text-slate-200">{fmtBig(r.market_cap, region)}</td><td className="py-2 text-right font-mono text-slate-200">{num(r.pe_ratio, 1)}</td>
                  <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.ret))}>{fmtPct(r.ret)}</td><td className="py-2 text-right font-mono text-slate-300">{fmtPct(r.vol, 1, false)}</td><td className="py-2 text-right font-mono text-rose-400">{r.dd === null ? "—" : fmtPct(-r.dd, 1)}</td>
                </tr>))}</tbody>
            </table></div>
            <p className="mt-2 text-[10px] text-slate-500">Market cap and P/E for peers are from the universe dataset snapshot; return, volatility and drawdown are computed from each stock's own prices over the last year. Click a peer to open it.</p>
          </Card>
          <Card title="One-year return" subtitle="Stock vs peers" info="Trailing one-year price return computed from daily closes." icon={BarChart3} tone="emerald">
            <div className="h-60"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}><CartesianGrid {...GRID_PROPS} /><XAxis dataKey="name" {...AXIS_PROPS} interval={0} /><YAxis {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} /><ReferenceLine y={0} stroke="#475569" /><Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => fmtPct(Number(v))} /><Bar dataKey="ret" radius={[3, 3, 0, 0]} isAnimationActive={false}>{chart.map((c) => <Cell key={c.name} fill={c.me ? "#2563EB" : c.ret >= 0 ? UP_COLOR : DOWN_COLOR} />)}</Bar></BarChart></ResponsiveContainer></div>
          </Card>
        </div>
      );
    }}</FeedGate>
  );
}
