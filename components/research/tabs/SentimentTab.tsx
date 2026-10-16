"use client";

import React, { useMemo } from "react";
import { Activity, Users, Layers, Info } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/Card";
import { SignalGauge } from "./TechnicalsTab";
import { FeedGate, StatRow } from "../ui";
import { useResearch } from "../context";
import { AnalystFeed, OptionsFeed, researchPath, useFeed } from "@/lib/research/feeds";
import { techSignals } from "@/lib/research/derive";
import { cn } from "@/lib/utils";

const GROUPS: Record<string, string[]> = {
  Trend: ["Price vs SMA 20", "Price vs SMA 50", "Price vs SMA 200", "SMA 50 vs 200", "EMA 20 slope"],
  Momentum: ["RSI (14)", "MACD (12,26,9)", "Stochastic %K (14)", "6-month momentum"],
  "Range & bands": ["Bollinger %B (20,2)"],
};

export default function SentimentTab() {
  const { ticker, bars, stats: s } = useResearch();
  const t = useMemo(() => techSignals(bars), [bars]);
  const analyst = useFeed<AnalystFeed>(researchPath(ticker, "analyst"));
  const opt = useFeed<OptionsFeed>(`/market/universe/options?symbol=${encodeURIComponent(ticker)}`);
  void s;

  return (
    <div className="space-y-4">
      <div role="note" className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Sentiment here is built from <b>price action, broker ratings and options positioning</b>. We do not have a social-media or news-sentiment source, so none is shown or implied.</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Technical sentiment" subtitle="From price-based rules" info="Net of bullish and bearish rule signals on the latest bar (same rules as the Technicals tab), scaled −100 to +100." icon={Activity} tone="purple">
          {!t ? <EmptyState icon={Activity} title="Not enough history" /> : (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between"><span className={cn("font-mono text-2xl font-bold", t.score > 25 ? "text-emerald-400" : t.score < -25 ? "text-rose-400" : "text-amber-400")}>{t.score > 0 ? "+" : ""}{t.score.toFixed(0)}</span><span className="font-mono text-[11px] text-slate-400">{t.counts.Bullish}↑ {t.counts.Neutral}– {t.counts.Bearish}↓</span></div>
              <SignalGauge score={t.score} />
              {Object.entries(GROUPS).map(([g, names]) => {
                const sig = t.signals.filter((x) => names.includes(x.name));
                const b = sig.filter((x) => x.signal === "Bullish").length, r = sig.filter((x) => x.signal === "Bearish").length;
                return sig.length ? <StatRow key={g} label={g} value={`${b} bullish / ${r} bearish`} tone={b > r ? "text-emerald-400" : r > b ? "text-rose-400" : "text-amber-400"} /> : null;
              })}
            </div>
          )}
        </Card>
        <Card title="Analyst sentiment" subtitle="Broker recommendation mix" info="Share of brokers rating the stock Buy / Hold / Sell, and the mean recommendation on the 1 (strong buy) to 5 (strong sell) scale." icon={Users} tone="amber">
          <FeedGate state={analyst} rows={4} title="No analyst coverage">{(a) => {
            const c = a.trend[0];
            const tot = c ? c.strongBuy + c.buy + c.hold + c.sell + c.strongSell : 0;
            return (
              <div className="space-y-3">
                <StatRow label="Consensus" value={(a.recommendation.key ?? "—").replace("_", " ")} /><StatRow label="Mean (1 = strong buy, 5 = strong sell)" value={a.recommendation.mean != null ? a.recommendation.mean.toFixed(2) : "—"} /><StatRow label="Analysts" value={a.recommendation.analysts != null ? String(a.recommendation.analysts) : String(tot || "—")} />
                {c && tot > 0 && <div className="flex h-3 overflow-hidden rounded-full">{[[c.strongBuy + c.buy, "bg-emerald-500"], [c.hold, "bg-amber-500"], [c.sell + c.strongSell, "bg-rose-500"]].map(([v, cl]: any, i) => <div key={i} className={cl} style={{ width: `${(v / tot) * 100}%` }} />)}</div>}
              </div>
            );
          }}</FeedGate>
        </Card>
        <Card title="Options positioning" subtitle="Put/call ratios" info="Put/call ratio by volume and by open interest for the nearest expiry. Above 1 means more put than call activity (defensive); below 0.7 is call-heavy. Available only for securities with listed options." icon={Layers} tone="blue">
          <FeedGate state={opt} rows={4} title="No listed options">{(o) => (
            <div>
              <StatRow label="Expiry" value={o.selectedExpiration ?? "—"} /><StatRow label="Put/call (volume)" value={o.putCallRatioVol != null ? o.putCallRatioVol.toFixed(2) : "—"} tone={o.putCallRatioVol != null && o.putCallRatioVol > 1 ? "text-rose-400" : "text-emerald-400"} />
              <StatRow label="Put/call (open interest)" value={o.putCallRatioOI != null ? o.putCallRatioOI.toFixed(2) : "—"} tone={o.putCallRatioOI != null && o.putCallRatioOI > 1 ? "text-rose-400" : "text-emerald-400"} /><StatRow label="Max pain" value={o.maxPain != null ? o.maxPain.toFixed(2) : "—"} />
            </div>
          )}</FeedGate>
        </Card>
      </div>
    </div>
  );
}
