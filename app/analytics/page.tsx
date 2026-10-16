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
import { AnalyticsFilters, CurrencyCode, Frequency, currencyOf } from "@/lib/analyticsCalc";

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

  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [usingSamples, setUsingSamples] = useState(false);
  const [initialCapital, setInitialCapital] = useState(100000);

  // `draft` is what the controls edit; `applied` is what the analytics are computed with.
  const [draft, setDraft] = useState<Draft>({ start: null, end: null, frequency: "Daily", currency: "USD" });
  const [applied, setApplied] = useState<Draft>(draft);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    api
      .getBacktests()
      .then((all) => {
        const list = (all ?? []).filter((b) => b.status === "COMPLETED" && b.equity_curve?.length > 1);
        const real = list.filter((b) => !b.is_sample);
        // No real runs (or engine offline): fall back to labelled sample runs so the suite stays usable.
        const use = real.length ? real : list.filter((b) => b.is_sample);
        setUsingSamples(real.length === 0 && use.length > 0);
        setBacktests(use);
        const first = use.slice(0, 3);
        setSelectedIds(first.map((b) => b.id));
        if (first[0]) {
          const cur = currencyOf(first[0]);
          setDraft((d) => ({ ...d, currency: cur }));
          setApplied((d) => ({ ...d, currency: cur }));
          setInitialCapital(cur === "INR" ? 1000000 : 100000);
        }
      })
      .catch((err) => {
        console.error("Failed to load backtests:", err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // Full extent of the data, used as the default window shown in the date control.
  const extent = useMemo(() => {
    const dates = backtests.filter((b) => selectedIds.includes(b.id)).flatMap((b) => [b.equity_curve[0]?.date, b.equity_curve[b.equity_curve.length - 1]?.date]).filter(Boolean).sort();
    return { min: dates[0] ?? "", max: dates[dates.length - 1] ?? "" };
  }, [backtests, selectedIds]);

  const handleToggleStrategy = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]));

  const handleRunAnalysis = () => {
    setIsRunning(true);
    setApplied(draft);
    window.setTimeout(() => setIsRunning(false), 250);
  };

  const selectedBacktests = useMemo(() => backtests.filter((b) => selectedIds.includes(b.id)), [backtests, selectedIds]);
  const filters: AnalyticsFilters = applied;

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
        currency={draft.currency}
        onCurrencyChange={(currency) => setDraft((d) => ({ ...d, currency: currency as CurrencyCode }))}
        onRunAnalysis={handleRunAnalysis}
        isRunning={isRunning}
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
        {activeTab === "Overview" && (
          <AnalyticsOverviewTab
            allBacktests={backtests}
            selectedIds={selectedIds}
            onToggleStrategy={handleToggleStrategy}
            onClearAll={() => backtests[0] && setSelectedIds([backtests[0].id])}
            initialCapital={initialCapital}
            onInitialCapitalChange={setInitialCapital}
            filters={filters}
          />
        )}
        {activeTab === "Performance" && <AnalyticsPerformanceTab selectedBacktests={selectedBacktests} filters={filters} />}
        {activeTab === "Risk" && <AnalyticsRiskTab selectedBacktests={selectedBacktests} filters={filters} />}
        {activeTab === "Trades" && <AnalyticsTradesTab selectedBacktests={selectedBacktests} filters={filters} />}
        {activeTab === "Regimes" && <AnalyticsRegimesTab selectedBacktests={selectedBacktests} filters={filters} />}
        {activeTab === "Factors" && <AnalyticsFactorsTab selectedBacktests={selectedBacktests} />}
        {activeTab === "Robustness" && <AnalyticsRobustnessTab selectedBacktests={selectedBacktests} filters={filters} />}
        {activeTab === "Attribution" && <AnalyticsAttributionTab selectedBacktests={selectedBacktests} filters={filters} />}
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
