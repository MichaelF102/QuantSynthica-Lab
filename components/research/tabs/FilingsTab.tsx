"use client";

import React from "react";
import { FileText, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FeedGate } from "../ui";
import { useResearch } from "../context";
import { FilingsFeed, researchPath, useFeed } from "@/lib/research/feeds";

export default function FilingsTab() {
  const { ticker } = useResearch();
  const feed = useFeed<FilingsFeed>(researchPath(ticker, "filings"));
  return (
    <Card title="Regulatory filings" subtitle="Most recent first" info="SEC filings (10-K, 10-Q, 8-K and others) with links to the source documents. Our data source has no filings feed for NSE/BSE-listed companies." icon={FileText} tone="blue">
      <FeedGate state={feed} rows={6} title="No filings feed for this security">{(f) => (
        <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
          <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Date</th><th className="py-1.5 text-left">Type</th><th className="py-1.5 text-left">Title</th><th className="py-1.5 text-right">Document</th></tr></thead>
          <tbody className="divide-y divide-slate-800/50">{f.items.map((it, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-800/30"><td className="py-2 font-mono text-slate-400">{it.date ?? "—"}</td><td className="py-2"><span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">{it.type ?? "—"}</span></td><td className="py-2 text-slate-200">{it.title ?? "—"}</td><td className="py-2 text-right">{it.url ? <a href={it.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300">Open <ExternalLink className="h-3 w-3" /></a> : "—"}</td></tr>
          ))}</tbody>
        </table></div>
      )}</FeedGate>
    </Card>
  );
}
