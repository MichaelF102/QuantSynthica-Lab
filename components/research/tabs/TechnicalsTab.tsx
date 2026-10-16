"use client";

import React, { useMemo } from "react";
import { Gauge, Crosshair } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/Card";
import PriceChart from "../PriceChart";
import { useResearch } from "../context";
import { techSignals } from "@/lib/research/derive";
import { fmtPx } from "@/lib/research/format";
import { cn } from "@/lib/utils";

const TONE = { Bullish: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400", Bearish: "border-rose-500/40 bg-rose-500/15 text-rose-400", Neutral: "border-amber-500/40 bg-amber-500/10 text-amber-400" } as const;

export function SignalGauge({ score }: { score: number }) {
  return (
    <div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500">
        <div className="absolute top-1/2 h-4 w-1.5 -translate-y-1/2 rounded bg-white shadow" style={{ left: `calc(${(score + 100) / 2}% - 3px)` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500"><span>Bearish</span><span>Neutral</span><span>Bullish</span></div>
    </div>
  );
}

export default function TechnicalsTab() {
  const { ticker, region, bars, bench, benchSymbol, stats: s, compareRequest } = useResearch();
  const t = useMemo(() => techSignals(bars), [bars]);
  const pivots = useMemo(() => {
    const p = (s.high + s.low + s.close) / 3;
    return [["R2", p + (s.high - s.low)], ["R1", 2 * p - s.low], ["Pivot", p], ["S1", 2 * p - s.high], ["S2", p - (s.high - s.low)]] as [string, number][];
  }, [s]);
  const verdict = !t ? "—" : t.score > 25 ? "Bullish" : t.score < -25 ? "Bearish" : "Neutral";

  return (
    <div className="space-y-4">
      <PriceChart bars={bars} bench={bench} symbol={ticker.replace(/\.(NS|BO)$/, "")} benchLabel={benchSymbol} region={region} defaultPanels={["Volume", "RSI", "MACD"]} defaultOverlays={["sma20", "sma50", "sma200"]} height={400} compareRequest={compareRequest} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card title="Technical summary" subtitle="Rule-based signals from the latest bar" info="Each row applies a simple, visible rule to the latest bar (see the Rule column). Volume and ATR are context, not directional. The gauge is (bullish − bearish) ÷ directional signals. This is a description of current price action, not a forecast." icon={Gauge} tone="purple">
            {!t ? <EmptyState icon={Gauge} title="Not enough history" hint="At least 60 sessions are needed." /> : (
              <>
                <div className="mb-3 grid grid-cols-1 items-center gap-4 sm:grid-cols-3">
                  <div><div className="text-[10px] uppercase tracking-wider text-slate-400">Overall</div><div className={cn("font-mono text-2xl font-bold", verdict === "Bullish" ? "text-emerald-400" : verdict === "Bearish" ? "text-rose-400" : "text-amber-400")}>{verdict}</div><div className="font-mono text-[11px] text-slate-400">{t.counts.Bullish} bullish · {t.counts.Neutral} neutral · {t.counts.Bearish} bearish</div></div>
                  <div className="sm:col-span-2"><SignalGauge score={t.score} /></div>
                </div>
                <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
                  <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Indicator</th><th className="py-1.5 text-right">Value</th><th className="py-1.5 text-center">Signal</th><th className="py-1.5 pl-4 text-left">Rule</th></tr></thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {t.signals.map((x) => (
                      <tr key={x.name} className="transition-colors hover:bg-slate-800/30">
                        <td className="py-2 font-medium text-slate-200">{x.name}</td><td className="py-2 text-right font-mono text-slate-100">{x.value}</td>
                        <td className="py-2 text-center"><span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold", TONE[x.signal])}>{x.signal}</span></td>
                        <td className="py-2 pl-4 text-[11px] text-slate-400">{x.rule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </>
            )}
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card title="Pivot levels" subtitle="Classic, from the last session" info="Classic floor-trader pivots: P = (H + L + C) ÷ 3, R1 = 2P − L, S1 = 2P − H, R2 = P + (H − L), S2 = P − (H − L), using the latest session's high, low and close." icon={Crosshair} tone="amber">
            <ul className="divide-y divide-slate-800/50">
              {pivots.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between py-2 text-xs"><span className={cn("font-mono font-semibold", k.startsWith("R") ? "text-emerald-400" : k.startsWith("S") ? "text-rose-400" : "text-slate-200")}>{k}</span><span className="font-mono text-slate-100">{fmtPx(v, region)}</span></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
