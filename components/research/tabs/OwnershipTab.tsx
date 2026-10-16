"use client";

import React from "react";
import { PieChart as PieIcon, Building2, UserRound } from "lucide-react";
import { Card, EmptyState, signTone } from "@/components/ui/Card";
import SparkKpi from "@/components/risk/ui/SparkKpi";
import { FeedGate } from "../ui";
import { useResearch } from "../context";
import { OwnershipFeed, researchPath, useFeed } from "@/lib/research/feeds";
import { fmtBig, fmtVol } from "@/lib/research/format";
import { fmtPct, cn } from "@/lib/utils";
import { isNum } from "@/lib/formatters";

export default function OwnershipTab() {
  const { ticker, region } = useResearch();
  const feed = useFeed<OwnershipFeed>(researchPath(ticker, "ownership"));
  return (
    <FeedGate state={feed} rows={8} title="No ownership data for this security">{(o) => {
      const m = o.major, ins = m.insidersPercentHeld, inst = m.institutionsPercentHeld, flt = m.institutionsFloatPercentHeld;
      const pub = isNum(ins) && isNum(inst) ? Math.max(0, 1 - ins - inst) : null;
      const pct = (v: unknown) => (isNum(v) ? fmtPct(v * 100, 2, false) : "—");
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SparkKpi label="Insiders / promoters" value={pct(ins)} tone="text-blue-400" hint="Share of shares outstanding held by insiders (promoters for Indian companies)" />
            <SparkKpi label="Institutions" value={pct(inst)} tone="text-purple-300" hint="Share of shares outstanding held by institutions" />
            <SparkKpi label="Institutions (of float)" value={pct(flt)} />
            <SparkKpi label="Institution count" value={isNum(m.institutionsCount) ? m.institutionsCount.toLocaleString("en-IN") : "—"} />
          </div>
          {isNum(ins) && isNum(inst) && (
            <Card title="Ownership structure" subtitle="Share of shares outstanding" info="Insider and institutional holdings as reported to the data provider; the remainder is treated as other public holders." icon={PieIcon} tone="blue">
              <div className="flex h-5 overflow-hidden rounded-full" role="img" aria-label="Ownership split">
                <div className="bg-blue-600" style={{ width: `${ins * 100}%` }} title={`Insiders ${pct(ins)}`} /><div className="bg-purple-500" style={{ width: `${inst * 100}%` }} title={`Institutions ${pct(inst)}`} /><div className="bg-slate-600" style={{ width: `${(pub ?? 0) * 100}%` }} title={`Other ${pub === null ? "—" : fmtPct(pub * 100, 2, false)}`} />
              </div>
              <div className="mt-2 flex flex-wrap gap-4 font-mono text-[11px] text-slate-300"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-600" />Insiders {pct(ins)}</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-purple-500" />Institutions {pct(inst)}</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-600" />Other {pub === null ? "—" : fmtPct(pub * 100, 2, false)}</span></div>
            </Card>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Top institutional holders" subtitle="Latest reported positions" info="Largest institutional holders from the latest regulatory reports, with the change since the previous report." icon={Building2} tone="purple">
              {o.institutions.length === 0 ? <EmptyState icon={Building2} title="No institutional holder data" hint="The provider publishes holder-level data mainly for US listings." /> : (
                <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
                  <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Holder</th><th className="py-1.5 text-right">% held</th><th className="py-1.5 text-right">Shares</th><th className="py-1.5 text-right">Value</th><th className="py-1.5 text-right">Change</th></tr></thead>
                  <tbody className="divide-y divide-slate-800/50">{o.institutions.map((h, i) => <tr key={i} className="transition-colors hover:bg-slate-800/30"><td className="max-w-[200px] truncate py-2 text-slate-200" title={h.Holder}>{h.Holder}</td><td className="py-2 text-right font-mono text-slate-100">{pct(h.pctHeld)}</td><td className="py-2 text-right font-mono text-slate-300">{fmtVol(h.Shares, "US")}</td><td className="py-2 text-right font-mono text-slate-300">{fmtBig(h.Value, region)}</td><td className={cn("py-2 text-right font-mono", signTone(isNum(h.pctChange) ? h.pctChange : null))}>{isNum(h.pctChange) ? fmtPct(h.pctChange * 100, 1) : "—"}</td></tr>)}</tbody>
                </table></div>
              )}
            </Card>
            <Card title="Insiders" subtitle="Roster and latest transactions" info="Company insiders with shares owned directly and their most recent transaction." icon={UserRound} tone="amber">
              {o.insiders.length === 0 ? <EmptyState icon={UserRound} title="No insider roster" /> : (
                <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
                  <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Name</th><th className="py-1.5 text-left">Position</th><th className="py-1.5 text-right">Shares (direct)</th><th className="py-1.5 text-left pl-3">Latest transaction</th></tr></thead>
                  <tbody className="divide-y divide-slate-800/50">{o.insiders.map((h, i) => <tr key={i} className="transition-colors hover:bg-slate-800/30"><td className="py-2 font-medium text-slate-200">{h.Name}</td><td className="py-2 text-slate-400">{h.Position ?? "—"}</td><td className="py-2 text-right font-mono text-slate-200">{isNum(h["Shares Owned Directly"]) ? fmtVol(h["Shares Owned Directly"], "US") : "—"}</td><td className="py-2 pl-3 text-slate-400">{h["Most Recent Transaction"] ? `${h["Most Recent Transaction"]}${h["Latest Transaction Date"] ? ` · ${h["Latest Transaction Date"]}` : ""}` : "—"}</td></tr>)}</tbody>
                </table></div>
              )}
            </Card>
          </div>
        </div>
      );
    }}</FeedGate>
  );
}
