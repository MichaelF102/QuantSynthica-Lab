"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, BarChart2, FlaskConical, CalendarDays, ChevronDown, Dices, Download, FileText, Gauge, GitMerge, LayoutDashboard,
  RotateCcw, Share2, ShieldAlert, Sliders, TrendingUp, ArrowLeftRight, NotebookPen,
} from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult, StrategyConfig, TradeRecord } from "@/types";
import { CardSkeleton } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { AnalyticsFilters, currencyOf, benchmarkLabel } from "@/lib/analyticsCalc";
import ResearchReportModal from "@/components/export/ResearchReportModal";
import TradeDetailsDrawer from "@/components/backtest/TradeDetailsDrawer";
import BacktestReRunModal from "@/components/backtest/BacktestReRunModal";
import BacktestCompareModal from "@/components/backtest/BacktestCompareModal";
import CommandPalette from "@/components/backtest/CommandPalette";
import ParameterSensitivityView from "@/components/backtest/ParameterSensitivityView";
import MonteCarloView from "@/components/backtest/MonteCarloView";
import ResearchNotesView from "@/components/backtest/ResearchNotesView";
import ReproduceModal from "@/components/backtest/ReproduceModal";
import { buildRunJson, buildRunReport } from "@/lib/runExport";
import TradeInsights from "@/components/backtest/tabs/TradeInsights";
import OverviewTab from "@/components/backtest/tabs/OverviewTab";
import PerformanceTab from "@/components/backtest/tabs/PerformanceTab";
import MonthlyTab from "@/components/backtest/tabs/MonthlyTab";
import TradeTable from "@/components/tables/TradeTable";
import AnalyticsRiskTab from "@/components/analytics/AnalyticsRiskTab";
import AnalyticsAttributionTab from "@/components/analytics/AnalyticsAttributionTab";
import AnalyticsRegimesTab from "@/components/analytics/AnalyticsRegimesTab";
import { CURRENCY_SYMBOL } from "@/lib/analyticsCalc";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "trades", label: "Trades", icon: ArrowLeftRight },
  { id: "risk", label: "Risk Analysis", icon: ShieldAlert },
  { id: "attribution", label: "Attribution", icon: GitMerge },
  { id: "monthly", label: "Monthly Returns", icon: CalendarDays },
  { id: "regime", label: "Regime Analysis", icon: Gauge },
  { id: "parameters", label: "Parameter Sensitivity", icon: Sliders },
  { id: "monte_carlo", label: "Monte Carlo", icon: Dices },
  { id: "notes", label: "Notes", icon: NotebookPen },
] as const;
type TabId = (typeof TABS)[number]["id"];

function downloadFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

const btn = "flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0b1222] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white";

function BacktestTerminal() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const id = params?.id as string;
  const rawTab = sp.get("tab");
  const activeTab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "overview";
  const setActiveTab = useCallback((t: string) => {
    const p = new URLSearchParams(sp.toString());
    p.set("tab", t);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [sp, router, pathname]);

  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  const [strategy, setStrategy] = useState<StrategyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTrade, setSelectedTrade] = useState<TradeRecord | null>(null);
  const [showReRunModal, setShowReRunModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [pendingScroll, setPendingScroll] = useState(false);
  const [showReproduce, setShowReproduce] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const viewOnChart = useCallback((t: TradeRecord) => { setSelectedTrade(t); setDrawerOpen(false); setPendingScroll(true); setActiveTab("overview"); }, [setActiveTab]);
  const selectTrade = useCallback((t: TradeRecord) => { setSelectedTrade(t); setDrawerOpen(true); }, []);
  useEffect(() => {
    if (!pendingScroll || activeTab !== "overview" || loading) return;
    const t = setTimeout(() => { document.getElementById("price-chart")?.scrollIntoView({ behavior: "smooth", block: "center" }); setPendingScroll(false); }, 450);
    return () => clearTimeout(t);
  }, [pendingScroll, activeTab, loading]);

  useEffect(() => {
    if (!id) return;
    let live = true;
    setLoading(true); setError(null);
    api.getBacktest(id)
      .then(async (bt) => {
        if (!live) return;
        setBacktest(bt);
        if (bt.strategy_config) setStrategy(bt.strategy_config);
        else if (bt.strategy_id) { try { const s = await api.getStrategy(bt.strategy_id); if (live) setStrategy(s); } catch { /* strategy no longer exists */ } }
        if (live) setLoading(false);
      })
      .catch((err) => { if (live) { setError(err.message || "Failed to load backtest result"); setLoading(false); } });
    return () => { live = false; };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setShowCommandPalette((p) => !p); }
      else if (e.key === "Escape") { setShowCommandPalette(false); setShowReRunModal(false); setShowCompareModal(false); setShowReportModal(false); setShowDownloadMenu(false); setDrawerOpen(false); setSelectedTrade(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) {
    return (
      <main className="app-container min-h-screen space-y-4 py-6" aria-busy="true">
        <CardSkeleton rows={1} className="h-24" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">{Array.from({ length: 7 }).map((_, i) => <CardSkeleton key={i} rows={1} className="h-24" />)}</div>
        <CardSkeleton rows={7} />
      </main>
    );
  }

  if (error || !backtest || !backtest.metrics) {
    return (
      <main className="app-container min-h-screen py-10 font-sans">
        <div role="alert" className="mx-auto max-w-md space-y-4 rounded-xl border border-rose-500/30 bg-[#0b1222]/95 p-8 text-center shadow-lg shadow-black/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400"><AlertTriangle className="h-6 w-6" /></div>
          <div><div className="text-base font-bold text-white">Backtest not found</div><p className="mt-1 text-xs text-slate-400">{error || backtest?.error || "This run has no results."}</p></div>
          <Link href="/backtests" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"><ArrowLeft className="h-3.5 w-3.5" />Back to Backtests</Link>
        </div>
      </main>
    );
  }

  const strat = strategy || backtest.strategy_config || null;
  const cur = currencyOf(backtest);
  const runFilters: AnalyticsFilters = { start: null, end: null, frequency: "Daily", currency: cur };
  const fileStem = `${backtest.strategy_name}_${backtest.ticker}_${backtest.id}`.replace(/[^\w-]+/g, "_");
  const started = backtest.created_at ? new Date(backtest.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null;
  const chip = "rounded-md border border-slate-800 bg-[#0b1222] px-2 py-0.5 font-mono text-[11px] text-slate-300";

  const body = (() => {
    switch (activeTab) {
      case "overview": return <OverviewTab bt={backtest} strategy={strat} selectedTradeId={selectedTrade?.id} onSelectTrade={selectTrade} onViewOnChart={viewOnChart} />;
      case "performance": return <PerformanceTab bt={backtest} />;
      case "trades": return <div className="space-y-4"><TradeInsights bt={backtest} onSelectTrade={selectTrade} /><TradeTable trades={backtest.trades} backtestId={backtest.id} currency={CURRENCY_SYMBOL[cur]} onSelectTrade={selectTrade} onViewOnChart={viewOnChart} selectedTradeId={selectedTrade?.id} /></div>;
      case "risk": return <AnalyticsRiskTab selectedBacktests={[backtest]} filters={runFilters} />;
      case "attribution": return <AnalyticsAttributionTab selectedBacktests={[backtest]} filters={runFilters} />;
      case "monthly": return <MonthlyTab bt={backtest} />;
      case "regime": return <AnalyticsRegimesTab selectedBacktests={[backtest]} filters={runFilters} />;
      case "parameters": return <ParameterSensitivityView bt={backtest} strategy={strat} />;
      case "monte_carlo": return <MonteCarloView bt={backtest} />;
      case "notes": return <ResearchNotesView backtestId={backtest.id} strategyName={backtest.strategy_name} initialNotes={backtest.notes} />;
    }
  })();

  return (
    <main className="app-container min-h-screen animate-fade-up space-y-4 py-6 font-sans">
      {(backtest.is_sample || backtest.is_synthetic) && (
        <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <span className="mr-2 font-mono font-bold uppercase tracking-wider">{backtest.is_sample ? "Sample" : "Simulated"}</span>
          {backtest.is_sample ? "Illustrative run on seeded prices, not real market performance. Run your own backtest for real results." : "Computed in the browser on locally generated prices because the backtest engine was unreachable. Not real market performance."}
        </div>
      )}

      <header className="relative flex flex-col justify-between gap-4 border-b border-slate-800/60 pb-5 lg:flex-row lg:items-end">
        <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="min-w-0">
          <Link href="/backtests" className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Backtests</Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">{backtest.strategy_name}</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={cn(chip, "font-bold text-white")}>{backtest.ticker}</span>
            <span className={chip}>vs {benchmarkLabel(backtest.benchmark)}</span>
            <span className={chip}>{backtest.start_date} → {backtest.end_date}</span>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-400">{backtest.status === "COMPLETED" ? "Completed" : backtest.status}</span>
            <span className="text-slate-500">Run <span className="font-mono text-slate-400">{backtest.id}</span>{started && <> · {started}</>}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }} className={btn}title="Copies this page's address. It only opens on this machine, because runs are stored locally. Use Download for something you can send."><Share2 className="h-3.5 w-3.5" />{shareCopied ? "Copied" : "Copy link"}</button>
          <button onClick={() => setShowCompareModal(true)} className={btn}><BarChart2 className="h-3.5 w-3.5" />Compare</button>
          <div className="relative">
            <button onClick={() => setShowDownloadMenu((v) => !v)} className={btn}><Download className="h-3.5 w-3.5" />Download<ChevronDown className="h-3 w-3" /></button>
            {showDownloadMenu && (
              <div className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-slate-800 bg-[#0b1222] py-1 text-xs shadow-2xl shadow-black/40">
                <a href={api.getExportTradesUrl(backtest.id)} download onClick={() => setShowDownloadMenu(false)} className="block px-3 py-2 text-slate-200 hover:bg-slate-800/50">Trade log CSV</a>
                <a href={api.getExportEquityUrl(backtest.id)} download onClick={() => setShowDownloadMenu(false)} className="block px-3 py-2 text-slate-200 hover:bg-slate-800/50">Equity curve CSV</a>
                <button onClick={() => { setShowDownloadMenu(false); downloadFile(`${fileStem}_report.html`, buildRunReport(backtest, strat), "text/html"); }} className="block w-full border-t border-slate-800 px-3 py-2 text-left text-slate-200 hover:bg-slate-800/50">Report (HTML file)</button>
                <button onClick={() => { setShowDownloadMenu(false); downloadFile(`${fileStem}_run.json`, JSON.stringify(buildRunJson(backtest, strat), null, 2), "application/json"); }} className="block w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800/50">Run JSON (reproducible)</button>
                <button onClick={() => { setShowDownloadMenu(false); setShowReportModal(true); }} className="flex w-full items-center gap-1.5 border-t border-slate-800 px-3 py-2 text-left text-blue-400 hover:bg-slate-800/50"><FileText className="h-3.5 w-3.5" />Tear sheet report</button>
              </div>
            )}
          </div>
          <button onClick={() => setShowReproduce(true)} title="Run the saved strategy again and check that the numbers match" className={btn}><FlaskConical className="h-3.5 w-3.5" />Reproduce</button>
          <button onClick={() => setShowReRunModal(true)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500"><RotateCcw className="h-3.5 w-3.5" />Re-run backtest</button>
        </div>
      </header>

      <div className="no-scrollbar w-full overflow-x-auto py-1">
        <nav className="flex min-w-max items-center gap-1.5 rounded-xl border border-slate-800/80 bg-[#0b1120]/80 p-1 backdrop-blur-md" aria-label="Backtest sections">
          {TABS.map((t) => {
            const Icon = t.icon, on = activeTab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} aria-current={on ? "page" : undefined}
                className={cn("flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70", on ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/30" : "font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")}>
                <Icon className="h-3.5 w-3.5" />{t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {backtest.metrics.num_trades < 30 && activeTab !== "notes" && (
        <div role="note" data-testid="low-sample" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span><span className="font-semibold">Small sample: {backtest.metrics.num_trades} trade{backtest.metrics.num_trades === 1 ? "" : "s"}.</span> Sharpe, Sortino, win rate and the resampling results rest on very few observations, so treat them as indicative at best. A longer window or looser rules gives a fairer read.</span>
        </div>
      )}

      <div key={activeTab} className="animate-fade-up">{body}</div>

      {selectedTrade && drawerOpen && <TradeDetailsDrawer trade={selectedTrade} onClose={() => { setDrawerOpen(false); setSelectedTrade(null); }} onViewOnChart={() => { setDrawerOpen(false); setPendingScroll(true); setActiveTab("overview"); }} />}
      {showReRunModal && <BacktestReRunModal backtest={backtest} strategy={strat} onClose={() => setShowReRunModal(false)} onSuccess={(newId) => { setShowReRunModal(false); router.push(`/backtests/${newId}`); }} />}
      {showCompareModal && <BacktestCompareModal currentBacktest={backtest} onClose={() => setShowCompareModal(false)} />}
      {showReproduce && <ReproduceModal bt={backtest} strategy={strat} onClose={() => setShowReproduce(false)} onSaved={(newId) => { setShowReproduce(false); router.push(`/backtests/${newId}`); }} />}
      {showReportModal && <ResearchReportModal backtest={backtest} onClose={() => setShowReportModal(false)} />}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} onRunReRun={() => setShowReRunModal(true)} onRunCompare={() => setShowCompareModal(true)} onSelectTab={(tab) => setActiveTab(tab)} />
    </main>
  );
}

export default function BacktestTerminalPage() {
  return <Suspense fallback={null}><BacktestTerminal /></Suspense>;
}
