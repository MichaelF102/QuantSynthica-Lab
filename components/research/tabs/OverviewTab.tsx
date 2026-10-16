"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { BarChart3, Gauge, Newspaper, Table2, ShieldAlert, CalendarClock, ArrowRight, ExternalLink, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, ReferenceLine, AreaChart, Area } from "recharts";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import PriceChart from "../PriceChart";
import { FeedGate, StatRow } from "../ui";
import { useResearch } from "../context";
import { AnalystFeed, CorporateFeed, NewsFeed, researchPath, useFeed } from "@/lib/research/feeds";
import { performance, riskSnapshot } from "@/lib/research/derive";
import { fmtBig, fmtPx, fmtVol, num, relTime } from "@/lib/research/format";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE, UP_COLOR, DOWN_COLOR } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";
import { isNum } from "@/lib/formatters";

const linkBtn = "inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300";

export default function OverviewTab() {
  const { ticker, region, bars, bench, benchSymbol, benchLabel, fundamentals: f, stats: s, setTab } = useResearch();
  const analyst = useFeed<AnalystFeed>(researchPath(ticker, "analyst"));
  const news = useFeed<NewsFeed>(researchPath(ticker, "news"));
  const corp = useFeed<CorporateFeed>(researchPath(ticker, "corporate"));
  const perf = useMemo(() => performance(bars, bench), [bars, bench]);
  const risk = useMemo(() => riskSnapshot(bars.slice(-252), bench?.slice(-252) ?? null), [bars, bench]);
  const px = (v: unknown) => fmtPx(v, region);
  const clean = ticker.replace(/\.(NS|BO)$/, "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card title="Key statistics" subtitle="Last session and valuation" info="Price statistics come from the latest bars. Valuation figures come from the company fundamentals feed and show an em dash when the source has no value." icon={Table2} tone="blue"
          action={<button type="button" onClick={() => setTab("fundamentals")} className={linkBtn}>View more <ArrowRight className="h-3 w-3" /></button>}>
          <div className="grid grid-cols-2 gap-x-5">
            <div>
              <StatRow label="Prev close" value={px(s.prevClose)} /><StatRow label="Open" value={px(s.open)} /><StatRow label="High" value={px(s.high)} /><StatRow label="Low" value={px(s.low)} />
              <StatRow label="Volume" value={fmtVol(s.volume, region)} /><StatRow label="Avg vol (30D)" value={fmtVol(s.avgVol30, region)} />
            </div>
            <div>
              <StatRow label="Market cap" value={fmtBig(f?.market_cap, region)} /><StatRow label="P/E (TTM)" value={num(f?.pe_ratio, 1)} /><StatRow label="PEG" value={num(f?.peg_ratio, 2)} />
              <StatRow label="P/B" value={num(f?.price_to_book, 2)} /><StatRow label="P/S" value={num(f?.price_to_sales, 2)} /><StatRow label="EV/EBITDA" value={num(f?.ev_ebitda, 1)} />
            </div>
          </div>
        </Card>

        <Card title="Performance" subtitle={`Absolute return, ${perf.filter((p) => p.ret !== null).length} windows`} info="Return over calendar windows measured back from the last close. A window is blank when the loaded history does not reach back far enough." icon={BarChart3} tone="emerald">
          <ul className="space-y-2" aria-label="Performance by window">
            {(() => { const m = Math.max(1, ...perf.map((p) => Math.abs(p.ret ?? 0))); return perf.map((p) => (
              <li key={p.label} className="grid grid-cols-[4.5rem_1fr_3.75rem] items-center gap-2 text-xs">
                <span className="text-slate-400">{p.label}</span>
                <div className="relative h-4 rounded bg-slate-800/40" role="img" aria-label={`${p.label} ${p.ret === null ? "not available" : fmtPct(p.ret, 1)}`}>
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
                  {p.ret !== null && <div className={cn("absolute inset-y-0 rounded-sm", p.ret >= 0 ? "left-1/2 bg-emerald-500/80" : "right-1/2 bg-rose-500/80")} style={{ width: `${(Math.abs(p.ret) / m) * 50}%` }} />}
                </div>
                <span className={cn("text-right font-mono font-semibold", signTone(p.ret))}>{fmtPct(p.ret, 1)}</span>
              </li>)); })()}
          </ul>
        </Card>

        <Card title="Analyst consensus" subtitle="Broker ratings and 12-month targets" info="Aggregated broker ratings and price targets from the market-data provider. Shown only when coverage exists." icon={Gauge} tone="amber"
          action={<button type="button" onClick={() => setTab("analyst")} className={linkBtn}>Details <ArrowRight className="h-3 w-3" /></button>}>
          <FeedGate state={analyst} rows={5} title="No analyst coverage">{(a) => {
            const cur = a.trend[0];
            const tot = cur ? cur.strongBuy + cur.buy + cur.hold + cur.sell + cur.strongSell : 0;
            const buy = cur ? cur.strongBuy + cur.buy : 0, sell = cur ? cur.sell + cur.strongSell : 0;
            const pt = a.price_targets, up = isNum(pt.mean) ? (pt.mean / s.close - 1) * 100 : null;
            return (
              <div className="space-y-3">
                {tot > 0 && cur && (
                  <div className="grid grid-cols-5 items-center gap-2">
                    <div className="relative col-span-2 h-28">
                      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ v: buy }, { v: cur.hold }, { v: sell }]} dataKey="v" innerRadius="64%" outerRadius="95%" stroke="none" paddingAngle={2} isAnimationActive={false}>{["#10B981", "#F59E0B", "#F43F5E"].map((c) => <Cell key={c} fill={c} />)}</Pie></PieChart></ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><div className="text-[11px] font-bold capitalize text-white">{(a.recommendation.key ?? "").replace("_", " ") || "—"}</div><div className="font-mono text-[9px] text-slate-400">{tot} analysts</div></div>
                    </div>
                    <ul className="col-span-3 space-y-1.5 text-[11px]">
                      {([["Buy", buy, "bg-emerald-500"], ["Hold", cur.hold, "bg-amber-500"], ["Sell", sell, "bg-rose-500"]] as [string, number, string][]).map(([k, v, c]) => <li key={k} className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-slate-300"><span className={cn("h-2 w-2 rounded-full", c)} />{k}</span><span className="font-mono font-semibold text-white">{Math.round((v / tot) * 100)}% ({v})</span></li>)}
                    </ul>
                  </div>
                )}
                <div className="rounded-lg border border-slate-800 bg-[#080d1a]/60 p-2.5">
                  <div className="flex items-baseline justify-between"><span className="text-[10px] uppercase tracking-wider text-slate-400">Mean target (12M)</span><span className={cn("font-mono text-[11px] font-semibold", signTone(up))}>{up === null ? "—" : `${fmtPct(up, 1)} vs last`}</span></div>
                  <div className="font-mono text-lg font-bold text-white">{px(pt.mean)}</div>
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400"><span>Low {px(pt.low)}</span><span>High {px(pt.high)}</span></div>
                </div>
              </div>
            );
          }}</FeedGate>
        </Card>

        <Card title="Latest news" subtitle="Headlines from the news feed" info="Real headlines with publisher and a link to the source article. Empty when the news provider has nothing for this security." icon={Newspaper} tone="purple"
          action={<button type="button" onClick={() => setTab("news")} className={linkBtn}>View all <ArrowRight className="h-3 w-3" /></button>}>
          <FeedGate state={news} rows={5} title="No recent headlines">{(n) => (
            <ul className="divide-y divide-slate-800/50">
              {n.items.slice(0, 5).map((it, i) => (
                <li key={i} className="py-2"><a href={it.link ?? undefined} target="_blank" rel="noopener noreferrer" className="group block text-xs leading-snug text-slate-200 hover:text-white">
                  <span className="line-clamp-2">{it.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-slate-500"><span className="text-blue-400">{it.publisher ?? "Source"}</span>·<span>{relTime(it.published)}</span>{it.link && <ExternalLink className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />}</span>
                </a></li>
              ))}
            </ul>
          )}</FeedGate>
        </Card>
      </div>

      <PriceChart bars={bars} bench={bench} symbol={clean} benchLabel={benchSymbol} region={region} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card title="Returns vs benchmark" subtitle={benchLabel} info="Trailing returns of the stock and the benchmark over the same windows, and the stock's excess return." icon={TrendingUp} tone="blue">
            <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
              <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Window</th><th className="py-1.5 text-right">{clean}</th><th className="py-1.5 text-right">{benchSymbol}</th><th className="py-1.5 text-right">Excess</th></tr></thead>
              <tbody className="divide-y divide-slate-800/50">{perf.map((p) => <tr key={p.label} className="transition-colors hover:bg-slate-800/30"><td className="py-2 text-slate-300">{p.label}</td><td className={cn("py-2 text-right font-mono font-semibold", signTone(p.ret))}>{fmtPct(p.ret)}</td><td className={cn("py-2 text-right font-mono", signTone(p.bench))}>{fmtPct(p.bench)}</td><td className={cn("py-2 text-right font-mono font-semibold", signTone(p.excess))}>{fmtPct(p.excess)}</td></tr>)}</tbody>
            </table></div>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card title="Risk snapshot" subtitle="Trailing 1 year, daily" info="Annualised volatility on 252 days, worst peak-to-trough fall, 95% historical one-day VaR and expected shortfall, and beta against the benchmark. Full analysis lives in the Risk Lab." icon={ShieldAlert} tone="rose"
            action={<Link href="/risk" className={linkBtn}>Risk Lab <ArrowRight className="h-3 w-3" /></Link>}>
            {!risk ? <EmptyState icon={ShieldAlert} title="Not enough history" /> : (
              <>
                <div className="grid grid-cols-2 gap-x-5">
                  <div><StatRow label="Volatility (ann.)" value={fmtPct(risk.vol, 1, false)} /><StatRow label="Max drawdown" value={fmtPct(-risk.maxDD, 1)} tone="text-rose-400" /><StatRow label="Current DD" value={fmtPct(-risk.currentDD, 1)} /></div>
                  <div><StatRow label="VaR 95% (1D)" value={fmtPct(-risk.var95, 2)} tone="text-rose-400" /><StatRow label="ES 95% (1D)" value={fmtPct(-risk.es95, 2)} tone="text-rose-400" /><StatRow label="Beta" value={num(risk.beta, 2)} /></div>
                </div>
                <div className="mt-2 h-20"><ResponsiveContainer width="100%" height="100%"><AreaChart data={risk.dd.map((d, i) => ({ i, d: -d }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}><YAxis hide domain={["auto", 0]} /><Area dataKey="d" stroke="#DC2626" strokeWidth={1.4} fill="#DC2626" fillOpacity={0.25} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>
              </>
            )}
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card title="Corporate events" subtitle="Next dates and recent dividends" info="Earnings and ex-dividend dates and the last dividends paid, from the market-data provider." icon={CalendarClock} tone="amber">
            <FeedGate state={corp} rows={4} title="No events">{(c) => {
              const one = (v: any) => (Array.isArray(v) ? v[0] : v);
              return (
                <div>
                  <StatRow label="Next earnings" value={one(c.calendar["Earnings Date"]) ?? "—"} /><StatRow label="Ex-dividend" value={one(c.calendar["Ex-Dividend Date"]) ?? "—"} />
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-400">Recent dividends</div>
                  {c.dividends.length === 0 ? <p className="py-2 text-xs text-slate-500">No dividends on record.</p> : c.dividends.slice(0, 4).map((d) => <StatRow key={d.date} label={d.date} value={fmtPx(d.amount, region)} />)}
                </div>
              );
            }}</FeedGate>
          </Card>
        </div>
      </div>
    </div>
  );
}
