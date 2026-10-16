"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Search } from "lucide-react";
import { api } from "@/lib/api";
import { MarketBar, MarketDataResponse, StockFundamentals } from "@/types";
import { CardSkeleton } from "@/components/ui/Card";
import { SelectField } from "@/components/risk/ui/controls";
import { BENCHMARK_OPTIONS, MARKET_DEFAULTS } from "@/lib/risk/presets";
import { isIndianTicker, marketOfBenchmark } from "@/lib/market";
import { indexName } from "@/lib/indices";
import BenchmarkSelect from "@/components/ui/BenchmarkSelect";
import { keyStats } from "@/lib/research/derive";
import { Region } from "@/lib/research/format";
import { ResearchProvider } from "./context";
import ResearchHeader from "./ResearchHeader";
import ResearchTabs, { RESEARCH_TABS, ResearchTabKey } from "./ResearchTabs";
import OverviewTab from "./tabs/OverviewTab";
import TechnicalsTab from "./tabs/TechnicalsTab";
import FundamentalsTab from "./tabs/FundamentalsTab";
import SentimentTab from "./tabs/SentimentTab";
import OptionsTab from "./tabs/OptionsTab";
import AnalystTab from "./tabs/AnalystTab";
import NewsTab from "./tabs/NewsTab";
import FilingsTab from "./tabs/FilingsTab";
import CompetitorsTab from "./tabs/CompetitorsTab";
import OwnershipTab from "./tabs/OwnershipTab";
import EsgTab from "./tabs/EsgTab";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const yearsAgo = (n: number) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); return iso(d); };

export default function ResearchWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const ticker = (sp.get("ticker") ?? "").toUpperCase().trim();
  const country = sp.get("country");
  const region: Region = country === "India" || country === "US" ? country : isIndianTicker(ticker) ? "India" : "US";
  const rawTab = sp.get("tab");
  const tab: ResearchTabKey = RESEARCH_TABS.some((t) => t.key === rawTab) ? (rawTab as ResearchTabKey) : "overview";

  const [benchmark, setBenchmark] = useState<string>(MARKET_DEFAULTS[region].benchmark);
  const [compareRequest, setCompareRequest] = useState(0);
  useEffect(() => setBenchmark((b) => (marketOfBenchmark(b) === region ? b : MARKET_DEFAULTS[region].benchmark)), [region]);

  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [benchData, setBenchData] = useState<MarketDataResponse | null>(null);
  const [fundamentals, setFundamentals] = useState<StockFundamentals | null>(null);
  const [loading, setLoading] = useState(true);
  const [fLoading, setFLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setParams = useCallback((patch: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => p.set(k, v));
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [router, pathname, sp]);
  const setTab = useCallback((t: string) => setParams({ tab: t }), [setParams]);

  // Remember the active security for the rest of the app (navbar search, strategies, etc.).
  useEffect(() => {
    if (!ticker) return;
    try { localStorage.setItem("algolab_active_ticker", ticker); localStorage.setItem("algolab_active_country", region); } catch { /* storage unavailable */ }
  }, [ticker, region]);

  // Recently viewed securities (landing page reads this).
  useEffect(() => {
    if (!ticker) return;
    try {
      const list: { ticker: string; region: Region }[] = JSON.parse(localStorage.getItem("algolab_recent") || "[]");
      localStorage.setItem("algolab_recent", JSON.stringify([{ ticker, region }, ...list.filter((x) => x.ticker !== ticker)].slice(0, 8)));
    } catch { /* storage unavailable */ }
  }, [ticker, region]);

  // Navbar search / market switch updates the URL, so the workspace follows it.
  useEffect(() => {
    const onChange = (e: any) => {
      const d = e.detail ?? {};
      const patch: Record<string, string> = {};
      if (d.symbol && String(d.symbol).toUpperCase() !== ticker) patch.ticker = String(d.symbol).toUpperCase();
      if ((d.country === "India" || d.country === "US") && d.country !== region) patch.country = d.country;
      if (Object.keys(patch).length) setParams(patch);
    };
    window.addEventListener("algolab:security-change", onChange);
    return () => window.removeEventListener("algolab:security-change", onChange);
  }, [ticker, region, setParams]);

  useEffect(() => {
    if (!ticker) return;
    let live = true;
    setLoading(true); setError(null);
    const args = { start_date: yearsAgo(5), end_date: iso(new Date()), benchmark };
    Promise.all([api.getMarketData({ ticker, ...args }), api.getMarketData({ ticker: benchmark, ...args }).catch(() => null)])
      .then(([sec, bench]) => { if (live) { setData(sec); setBenchData(bench && !bench.summary?.is_synthetic ? bench : null); } })
      .catch((e) => live && setError(e?.message || "Failed to load market data"))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [ticker, benchmark]);

  useEffect(() => {
    if (!ticker) return;
    let live = true;
    setFLoading(true); setFundamentals(null);
    api.getFundamentals(ticker, region).then((f) => live && setFundamentals(f)).catch(() => live && setFundamentals(null)).finally(() => live && setFLoading(false));
    return () => { live = false; };
  }, [ticker, region]);

  const bars: MarketBar[] = data?.bars ?? [];
  const stats = useMemo(() => keyStats(bars), [bars]);
  const benchLabel = BENCHMARK_OPTIONS[region].find((o) => o.symbol === benchmark)?.label ?? indexName(benchmark) ?? benchmark;
  // The fundamentals fallback in the client can fabricate a profile when the service is down; only trust a real one.
  const realFundamentals = fundamentals && !fundamentals.data_sources?.some((d) => /simulated/i.test(d)) ? fundamentals : null;

  if (loading && !data) {
    return (
      <main className="app-container min-h-screen space-y-4 py-6" aria-busy="true">
        <CardSkeleton rows={2} className="h-40" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} rows={5} />)}</div>
      </main>
    );
  }

  if (error || !data || !stats) {
    return (
      <main className="app-container min-h-screen py-10">
        <div role="alert" className="mx-auto max-w-md space-y-4 rounded-xl border border-rose-500/30 bg-[#0b1222]/95 p-8 text-center shadow-lg shadow-black/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400"><AlertTriangle className="h-6 w-6" /></div>
          <div><div className="text-base font-bold text-white">Could not load &ldquo;{ticker}&rdquo;</div>
            <p className="mt-1 text-xs text-slate-400">{error ?? "No price history was returned."} Check the ticker, or that the market-data service is running.</p></div>
          <Link href="/research" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"><Search className="h-3.5 w-3.5" /> Search again</Link>
        </div>
      </main>
    );
  }

  const ctx = {
    ticker, region, bars, bench: benchData?.bars ?? null, benchSymbol: benchmark, benchLabel, summary: data.summary,
    fundamentals: realFundamentals, fundamentalsLoading: fLoading, stats, setTab, compareRequest,
  };
  const body = (() => {
    switch (tab) {
      case "overview": return <OverviewTab />;
      case "technicals": return <TechnicalsTab />;
      case "fundamentals": return <FundamentalsTab />;
      case "sentiment": return <SentimentTab />;
      case "options": return <OptionsTab />;
      case "analyst": return <AnalystTab />;
      case "news": return <NewsTab />;
      case "filings": return <FilingsTab />;
      case "competitors": return <CompetitorsTab />;
      case "ownership": return <OwnershipTab />;
      case "esg": return <EsgTab />;
    }
  })();

  return (
    <ResearchProvider value={ctx}>
      <main className="app-container min-h-screen animate-fade-up space-y-3 py-6 font-sans">
        {data.summary.is_synthetic && (
          <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"><span className="mr-2 font-mono font-bold uppercase tracking-wider">Synthetic data</span>Live prices for {ticker} could not be fetched, so a generated series is shown. Treat every figure here as illustrative.</div>
        )}
        <ResearchHeader ticker={ticker} region={region} profile={data.summary.profile ?? undefined} fundamentals={realFundamentals} stats={stats} closes={bars.map((b) => b.close)} beta={data.summary.beta ?? null}
          onChart={() => setTab("technicals")} onCompare={() => { setCompareRequest((n) => n + 1); setTab("technicals"); }} />
        <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
          <ResearchTabs active={tab} onChange={(t) => setTab(t)} />
          <div className="min-w-[200px] shrink-0"><span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">Benchmark</span><BenchmarkSelect market={region} value={benchmark} onChange={setBenchmark} /></div>
        </div>
        <div key={tab} className="animate-fade-up">{body}</div>
      </main>
    </ResearchProvider>
  );
}
