"use client";

import React from "react";
import { Lightbulb, ShieldAlert, TrendingUp, Network, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { fmtPct } from "@/lib/utils";
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";

export default function PortfolioInsightsWidget({ result, benchmarkName }: { result: PortfolioResult; benchmarkName: string }) {
  const s = result.stats;
  const m = riskModel(result);
  const topRisk = m.assets.map((a, i) => ({ ...a, rc: m.rc[i] })).sort((a, b) => b.rc - a.rc)[0];
  const off = m.corr.flatMap((r, i) => r.filter((_, j) => j > i));
  const avg = off.length ? off.reduce((a, b) => a + b, 0) / off.length : null;
  const items = [
    { icon: TrendingUp, tone: "text-emerald-400", title: "Versus benchmark", text: s ? `Returned ${fmtPct(s.totalReturn)} against ${fmtPct(s.benchReturn)} for ${benchmarkName}; annualised alpha ${fmtPct(s.alpha)}.` : "—" },
    { icon: ShieldAlert, tone: "text-rose-400", title: "Drawdown", text: s ? `Max drawdown ${fmtPct(-s.maxDD)} (benchmark ${fmtPct(-s.benchMaxDD)}); longest stretch below peak ${s.ddDuration} trading days.` : "—" },
    { icon: Target, tone: "text-amber-400", title: "Risk concentration", text: topRisk ? `${topRisk.ticker} carries ${fmtPct(topRisk.rc, 1, false)} of portfolio variance on a ${fmtPct(topRisk.weight, 1, false)} weight.` : "—" },
    { icon: Network, tone: "text-blue-400", title: "Diversification", text: avg === null ? "A single holding has no diversification." : `Average pairwise correlation ${avg.toFixed(2)}${avg > 0.6 ? ": holdings largely move together." : avg < 0.3 ? ": well diversified." : "."}` },
  ];
  return (
    <Card title="Key insights" subtitle="Generated from the computed numbers" info="Plain-language read-outs of the portfolio statistics above; no external model is used." icon={Lightbulb} tone="amber">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map(({ icon: Icon, tone, title, text }) => (
          <div key={title} className="space-y-1 rounded-xl border border-slate-800 bg-[#080d1a]/60 p-3">
            <div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${tone}`} /><span className="text-[11px] font-semibold text-white">{title}</span></div>
            <p className="text-[11px] leading-relaxed text-slate-400">{text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
