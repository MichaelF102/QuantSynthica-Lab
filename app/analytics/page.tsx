"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult } from "@/types";
import { CardSkeleton, EmptyState } from "@/components/ui/Card";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import AnalyticsSubNav, { AnalyticsTabKey, TABS } from "@/components/analytics/AnalyticsSubNav";
import AnalyticsOverviewTab from "@/components/analytics/AnalyticsOverviewTab";
import AnalyticsRegimesTab from "@/components/analytics/AnalyticsRegimesTab";
import AnalyticsPerformanceTab from "@/components/analytics/AnalyticsPerformanceTab";
import AnalyticsRiskTab from "@/components/analytics/AnalyticsRiskTab";
import AnalyticsTradesTab from "@/components/analytics/AnalyticsTradesTab";
import AnalyticsFactorsTab from "@/components/analytics/AnalyticsFactorsTab";
import AnalyticsRobustnessTab from "@/components/analytics/AnalyticsRobustnessTab";
import AnalyticsAttributionTab from "@/components/analytics/AnalyticsAttributionTab";
import AnalyticsCompareTab from "@/components/analytics/AnalyticsCompareTab";
import AnalyticsPortfolioTab from "@/components/analytics/AnalyticsPortfolioTab";
import { AnalyticsFilters, CurrencyCode, Frequency, btPoints, currencyOf, runName } from "@/lib/analyticsCalc";
import { compareRuns } from "@/lib/compareRuns";
import { alignRunReturns, diversificationRatio, weightsFor } from "@/lib/portfolioOfRuns";
import { comparisonCsv, portfolioSummary, selectionReport } from "@/lib/analyticsExport";

interface Draft { start: string | null; end: string | null; frequency: Frequency; currency: CurrencyCode }

function AnalyticsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab");
  const activeTab: AnalyticsTabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as AnalyticsTabKey) : "Overview";
  const setActiveTab = useCallback(
    (tab: AnalyticsTabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // The picker lists lightweight entries; a run's equity curve and trades are fetched only once it is selected.
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [full, setFull] = useState<Record<string, BacktestResult>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [usingSamples, setUsingSamples] = useState(false);
  const [initialCapital, setInitialCapital] = useState(() => Number(searchParams.get("cap")) || 100000);

  // `draft` is what the controls edit; `applied` is what the analytics are computed with. Both start from the URL.
  const fromUrl = (): Draft => ({ start: searchParams.get("from"), end: searchParams.get("to"), frequency: (["Daily", "Weekly", "Monthly"].includes(searchParams.get("freq") ?? "") ? searchParams.get("freq") : "Daily") as Frequency, currency: "USD" });
  const [draft, setDraft] = useState<Draft>(fromUrl);
  const [applied, setApplied] = useState<Draft>(draft);
  const [isRunning, setIsRunning] = useState(false);
  const pointsOf = (b: BacktestResult) => b.summary?.num_points ?? b.equity_curve?.length ?? 0;

  useEffect(() => {
    api
      .getBacktestSummaries()
      .then((all) => {
        const list = (all ?? []).filter((b) => b.status === "COMPLETED" && pointsOf(b) > 1);
        const real = list.filter((b) => !b.is_sample);
        // No real runs (or engine offline): fall back to labelled sample runs so the suite stays usable.
        const use = real.length ? real : list.filter((b) => b.is_sample);
        setUsingSamples(real.length === 0 && use.length > 0);
        setBacktests(use);
        setFull(Object.fromEntries(use.filter((b) => !b.summary).map((b) => [b.id, b])));
        const wanted = (searchParams.get("runs") ?? "").split(",").filter((id) => use.some((b) => b.id === id));
        const first = wanted.length ? use.filter((b) => wanted.includes(b.id)) : use.slice(0, 3);
        setSelectedIds(first.map((b) => b.id));
        if (first[0]) {
          const cur = currencyOf(first[0]);
          setDraft((d) => ({ ...d, currency: cur }));
          setApplied((d) => ({ ...d, currency: cur }));
          if (!searchParams.get("cap")) setInitialCapital(cur === "INR" ? 1000000 : 100000);
        }
      })
      .catch((err) => {
        console.error("Failed to load backtests:", err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch the full run for anything selected that has only a summary so far.
  const [fetching, setFetching] = useState(false);
  useEffect(() => {
    const missing = selectedIds.filter((id) => !full[id]);
    if (!missing.length) { setFetching(false); return; }
    let live = true;
    setFetching(true);
    Promise.all(missing.map((id) => api.getBacktest(id).then((b) => [id, b] as const).catch(() => null))).then((rows) => {
      if (!live) return;
      setFull((f) => ({ ...f, ...Object.fromEntries(rows.filter((r): r is readonly [string, BacktestResult] => !!r)) }));
      setFetching(false);
    });
    return () => { live = false; };
  }, [selectedIds, full]);

  // The selection and the applied window live in the URL, so a view can be bookmarked or shared.
  useEffect(() => {
    if (loading || !selectedIds.length) return;
    const params = new URLSearchParams(searchParams.toString());
    const set = (k: string, v: string | null) => (v ? params.set(k, v) : params.delete(k));
    set("runs", selectedIds.join(","));
    set("from", applied.start); set("to", applied.end);
    set("freq", applied.frequency === "Daily" ? null : applied.frequency);
    set("cap", initialCapital === 100000 || initialCapital === 1000000 ? null : String(initialCapital));
    if (params.toString() !== searchParams.toString()) router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedIds, applied, initialCapital, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pickers get every run (summaries for unselected ones); analytics get the loaded runs.
  const listed = useMemo(() => backtests.map((b) => full[b.id] ?? b), [backtests, full]);
  const selectedBacktests = useMemo(() => listed.filter((b) => selectedIds.includes(b.id) && !b.summary), [listed, selectedIds]);
  const ready = selectedBacktests.length === selectedIds.length;

  // Full extent of the data, used as the default window shown in the date control.
  const extent = useMemo(() => {
    const dates = selectedBacktests.flatMap((b) => [b.equity_curve[0]?.date, b.equity_curve[b.equity_curve.length - 1]?.date]).filter(Boolean).sort();
    return { min: dates[0] ?? "", max: dates[dates.length - 1] ?? "" };
  }, [selectedBacktests]);

  const handleToggleStrategy = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]));

  const handleRunAnalysis = () => {
    setIsRunning(true);
    setApplied(draft);
    window.setTimeout(() => setIsRunning(false), 250);
  };

  const filters: AnalyticsFilters = { ...applied, currency: selectedBacktests[0] ? currencyOf(selectedBacktests[0]) : applied.currency };

  const exportSelection = (kind: "csv" | "html") => {
    if (!selectedBacktests.length) return;
    const names = selectedBacktests.map((b) => runName(b, selectedBacktests));
    const cmp = compareRuns(selectedBacktests, filters, names);
    const al = selectedBacktests.length > 1 ? alignRunReturns(selectedBacktests.map((b) => btPoints(b, { ...filters, frequency: "Daily" }))) : null;
    const text = kind === "csv" ? comparisonCsv(cmp, names) : selectionReport(selectedBacktests, names, cmp, al ? portfolioSummary(al, weightsFor("equal", al.returns), "equal", diversificationRatio(al.returns, weightsFor("equal", al.returns))) : null);
    const url = URL.createObjectURL(new Blob([text], { type: kind === "csv" ? "text/csv" : "text/html" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `strategy_comparison.${kind}` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="app-container min-h-screen space-y-4 py-6 font-sans">
        <CardSkeleton rows={1} className="h-24" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7"><CardSkeleton rows={7} /></div>
          <div className="lg:col-span-5"><CardSkeleton rows={7} /></div>
        </div>
      </main>
    );
  }

  if (backtests.length === 0) {
    return (
      <main className="app-container min-h-screen py-6 font-sans">
        <EmptyState
          icon={BarChart3}
          title={loadError ? "Backtests unavailable" : "No backtests to analyse yet"}
          hint={loadError ? "The analytics engine could not be reached. Check that the backend is running and retry." : "Run a strategy backtest and its analytics will appear here."}
          action={<Link href="/strategies" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500">Go to Strategies</Link>}
        />
      </main>
    );
  }

  return (
    <main className="app-container min-h-screen animate-fade-up space-y-4 py-6 font-sans">
      <AnalyticsHeader
        startDate={draft.start ?? extent.min}
        endDate={draft.end ?? extent.max}
        onDateChange={(s, e) => setDraft((d) => ({ ...d, start: s || null, end: e || null }))}
        frequency={draft.frequency}
        onFrequencyChange={(frequency) => setDraft((d) => ({ ...d, frequency }))}
        currency={filters.currency}
        onCurrencyChange={() => {}}
        onRunAnalysis={handleRunAnalysis}
        isRunning={isRunning}
        onExport={exportSelection}
        canExport={ready && selectedBacktests.length > 0}
      />

      {usingSamples && (
        <div role="note" className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
          <span className="font-mono font-bold uppercase tracking-wider">Sample</span>
          <span>
            No real backtests yet{loadError ? " (or the engine is offline)" : ""}, so the suite is showing illustrative runs on seeded prices.{" "}
            <Link href="/backtests" className="font-semibold underline hover:text-white">Run your own</Link> for real results.
          </span>
        </div>
      )}

      <AnalyticsSubNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="pt-1">
        {!ready && <div role="status" aria-busy="true" className="py-10 text-center text-xs text-slate-400" data-testid="loading-runs">Loading the selected runs…</div>}
        {ready && activeTab === "Compare" && <AnalyticsCompareTab selectedBacktests={selectedBacktests} filters={filters} />}
        {ready && activeTab === "Portfolio" && <AnalyticsPortfolioTab selectedBacktests={selectedBacktests} filters={filters} />}
        {ready && activeTab === "Overview" && (
          <AnalyticsOverviewTab
            allBacktests={listed}
            selectedIds={selectedIds}
            onToggleStrategy={handleToggleStrategy}
            onClearAll={() => listed[0] && setSelectedIds([listed[0].id])}
            initialCapital={initialCapital}
            onInitialCapitalChange={setInitialCapital}
            filters={filters}
          />
        )}
        {ready && activeTab === "Performance" && <AnalyticsPerformanceTab selectedBacktests={selectedBacktests} filters={filters} />}
        {ready && activeTab === "Risk" && <AnalyticsRiskTab selectedBacktests={selectedBacktests} filters={filters} />}
        {ready && activeTab === "Trades" && <AnalyticsTradesTab selectedBacktests={selectedBacktests} filters={filters} />}
        {ready && activeTab === "Regimes" && <AnalyticsRegimesTab selectedBacktests={selectedBacktests} filters={filters} />}
        {ready && activeTab === "Factors" && <AnalyticsFactorsTab selectedBacktests={selectedBacktests} filters={filters} />}
        {ready && activeTab === "Robustness" && <AnalyticsRobustnessTab selectedBacktests={selectedBacktests} filters={filters} />}
        {ready && activeTab === "Attribution" && <AnalyticsAttributionTab selectedBacktests={selectedBacktests} filters={filters} />}
      </div>
    </main>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<main className="app-container space-y-4 py-6"><CardSkeleton rows={2} className="h-24" /><CardSkeleton rows={6} /></main>}>
      <AnalyticsContent />
    </Suspense>
  );
}
