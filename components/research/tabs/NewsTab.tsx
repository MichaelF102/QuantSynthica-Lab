"use client";

import React from "react";
import { Newspaper, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { FeedGate } from "../ui";
import { useResearch } from "../context";
import { NewsFeed, researchPath, useFeed } from "@/lib/research/feeds";
import { relTime } from "@/lib/research/format";

export default function NewsTab() {
  const { ticker } = useResearch();
  const feed = useFeed<NewsFeed>(researchPath(ticker, "news"));
  return (
    <Card title="News" subtitle="Headlines from the news feed" info="Real headlines from the news provider with the original publisher and a link to the article. We show no sentiment label because we do not have a sentiment source." icon={Newspaper} tone="purple">
      <FeedGate state={feed} rows={6} title="No recent headlines">{(n) => (
        <ul className="divide-y divide-slate-800/50">
          {n.items.map((it, i) => (
            <li key={i} className="py-3">
              <a href={it.link ?? undefined} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500"><span className="font-semibold text-blue-400">{it.publisher ?? "Source"}</span>·<span>{relTime(it.published)}</span>{it.link && <ExternalLink className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />}</div>
                <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-100 group-hover:text-white">{it.title}</h3>
                {it.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{it.summary}</p>}
              </a>
            </li>
          ))}
        </ul>
      )}</FeedGate>
    </Card>
  );
}
