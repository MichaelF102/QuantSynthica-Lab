"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, History, LineChart as LineIcon, Star, TrendingUp } from "lucide-react";
import ResearchSearch from "./ResearchSearch";
import { Card, CardSkeleton, EmptyState } from "@/components/ui/Card";
import { Spark } from "@/components/risk/ui/charts";
import { fetchFeed } from "@/lib/research/feeds";
import { navigateToResearchWorkspace } from "@/lib/tickerSearch";
import { fmtPct, cn } from "@/lib/utils";

interface Index { symbol: string; displayName: string; market: string; flag: string; currency: string; price: number; changePercent: number; isPositive: boolean; sparkline: number[] }
const POPULAR: { ticker: string; label: string; country: "India" | "US" }[] = [
  { ticker: "RELIANCE", label: "Reliance", country: "India" }, { ticker: "TCS", label: "TCS", country: "India" }, { ticker: "INFY", label: "Infosys", country: "India" },
  { ticker: "HDFCBANK", label: "HDFC Bank", country: "India" }, { ticker: "AAPL", label: "Apple", country: "US" }, { ticker: "MSFT", label: "Microsoft", country: "US" },
  { ticker: "NVDA", label: "NVIDIA", country: "US" }, { ticker: "SPY", label: "S&P 500 ETF", country: "US" },
];
const read = (k: string): { ticker: string; region: "India" | "US" }[] => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };

export default function ResearchSearchLanding() {
  const router = useRouter();
  const [idx, setIdx] = useState<Index[] | null>(null);
  const [idxErr, setIdxErr] = useState(false);
  const [watch, setWatch] = useState<{ ticker: string; region: "India" | "US" }[]>([]);
  const [recent, setRecent] = useState<{ ticker: string; region: "India" | "US" }[]>([]);

  useEffect(() => { setWatch(read("algolab_watchlist")); setRecent(read("algolab_recent")); }, []);
  useEffect(() => {
    let live = true;
    fetchFeed<Index[]>("/market/universe/benchmarks", 25000).then((d) => live && setIdx(d.filter((x) => ["^GSPC", "^IXIC", "^NSEI", "^BSESN", "^NDX", "^NSEBANK"].includes(x.symbol)).slice(0, 4))).catch(() => live && setIdxErr(true));
    return () => { live = false; };
  }, []);
  const open = (t: string, c: "India" | "US") => navigateToResearchWorkspace(t, router, c);
  const chip = "rounded-lg border border-slate-800 bg-[#0b1222] px-3 py-1.5 font-mono text-xs text-slate-200 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70";

  return (
    <main className="app-container min-h-screen animate-fade-up space-y-6 py-8 font-sans">
      <header className="relative space-y-3 border-b border-slate-800/60 pb-6">
        <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400">Data · Models · Insights</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">Security <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Research</span></h1>
        <p className="max-w-2xl text-xs leading-relaxed text-secondary">Prices, technicals, fundamentals, analyst estimates, options, ownership and peers for NSE/BSE and US securities. Everything shown comes from market data; where a source has nothing, we say so.</p>
        <div className="max-w-3xl pt-2"><ResearchSearch /></div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1"><span className="mr-1 text-[10px] uppercase tracking-wider text-slate-400">Popular</span>{POPULAR.map((p) => <button key={p.ticker} type="button" onClick={() => open(p.ticker, p.country)} className={chip}>{p.ticker}<span className="ml-1.5 text-slate-500">{p.country === "India" ? "🇮🇳" : "🇺🇸"}</span></button>)}</div>
      </header>

      <section aria-label="Market snapshot" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {!idx && !idxErr && Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} rows={1} className="h-28" />)}
        {idxErr && <div className="sm:col-span-2 xl:col-span-4"><EmptyState icon={LineIcon} title="Market snapshot unavailable" hint="The market-data service could not be reached." /></div>}
        {idx?.map((x) => (
          <button key={x.symbol} type="button" onClick={() => open(x.symbol, x.market === "India" ? "India" : "US")} className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-3.5 text-left shadow-lg shadow-black/20 transition-colors hover:border-slate-600">
            <div className="flex items-center justify-between text-[11px] text-slate-400"><span>{x.flag} {x.displayName}</span><span className={cn("font-mono font-semibold", x.isPositive ? "text-emerald-400" : "text-rose-400")}>{fmtPct(x.changePercent)}</span></div>
            <div className="mt-1 flex items-end justify-between"><div className="font-mono text-xl font-bold text-white">{x.currency}{x.price.toLocaleString(x.currency === "₹" ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div><Spark data={x.sparkline} color={x.isPositive ? "#10B981" : "#F43F5E"} width={90} height={32} /></div>
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Watchlist" subtitle="Securities you starred" info="Add a security with the Watchlist button on its research page. The list is stored in this browser." icon={Star} tone="amber">
          {watch.length === 0 ? <EmptyState icon={Star} title="Your watchlist is empty" hint="Open a security and click Watchlist to pin it here." /> : <div className="flex flex-wrap gap-1.5">{watch.map((w) => <button key={w.ticker} type="button" onClick={() => open(w.ticker, w.region)} className={chip}>{w.ticker.replace(/\.(NS|BO)$/, "")}</button>)}</div>}
        </Card>
        <Card title="Recently viewed" subtitle="Your last securities" info="The most recent securities you opened in Research, stored in this browser." icon={History} tone="blue">
          {recent.length === 0 ? <EmptyState icon={History} title="Nothing viewed yet" hint="Search for a security to get started." /> : <div className="flex flex-wrap gap-1.5">{recent.map((w) => <button key={w.ticker} type="button" onClick={() => open(w.ticker, w.region)} className={chip}>{w.ticker.replace(/\.(NS|BO)$/, "")}</button>)}</div>}
        </Card>
      </div>

      <Card title="What you can research" subtitle="Eleven views per security" info="Each security opens a workspace with these tabs." icon={Compass} tone="purple">
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-3 lg:grid-cols-6">
          {["Overview", "Technicals", "Fundamentals", "Sentiment", "Options", "Analyst Estimates", "News", "Filings", "Competitors", "Ownership", "ESG"].map((t) => <div key={t} className="rounded-lg border border-slate-800 bg-[#080d1a]/60 px-3 py-2"><TrendingUp className="mb-1 h-3 w-3 text-blue-400" />{t}</div>)}
          <Link href="/risk" className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-blue-400 hover:text-blue-300">Risk Lab →</Link>
        </div>
      </Card>
    </main>
  );
}
