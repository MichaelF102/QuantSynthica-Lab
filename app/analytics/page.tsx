"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import { CardSkeleton, EmptyState } from "@/components/ui/Card";
import { BacktestResult } from "@/types";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import AnalyticsSubNav, { AnalyticsTabKey } from "@/components/analytics/AnalyticsSubNav";
import AnalyticsOverviewTab from "@/components/analytics/AnalyticsOverviewTab";
import AnalyticsRegimesTab from "@/components/analytics/AnalyticsRegimesTab";
import AnalyticsPerformanceTab from "@/components/analytics/AnalyticsPerformanceTab";
import AnalyticsRiskTab from "@/components/analytics/AnalyticsRiskTab";
import AnalyticsTradesTab from "@/components/analytics/AnalyticsTradesTab";
import AnalyticsFactorsTab from "@/components/analytics/AnalyticsFactorsTab";
import AnalyticsRobustnessTab from "@/components/analytics/AnalyticsRobustnessTab";
import AnalyticsAttributionTab from "@/components/analytics/AnalyticsAttributionTab";

export default function AnalyticsPage() {
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<AnalyticsTabKey>("Overview");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [frequency, setFrequency] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [currency, setCurrency] = useState<"USD" | "INR" | "EUR" | "GBP">("USD");
  const [benchmark, setBenchmark] = useState("SPY");
  const [initialCapital, setInitialCapital] = useState(100000);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api
      .getBacktests()
      .then((all) => {
        const bts = (all ?? []).filter((b) => !b.is_sample); // analytics needs real runs
        setBacktests(bts ?? []);
        setSelectedIds((bts ?? []).slice(0, 3).map((b) => b.id));
      })
      .catch((err) => {
        console.error("Failed to load backtests:", err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleStrategy = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((x) => x !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleClearAll = () => {
    if (backtests.length > 0) {
      setSelectedIds([backtests[0].id]);
    }
  };

  const handleRunAnalysis = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 600);
  };

  const selectedBacktests = useMemo(() => {
    return backtests.filter((b) => selectedIds.includes(b.id));
  }, [backtests, selectedIds]);

  if (loading) {
    return (
      <main className="app-container min-h-screen space-y-4 py-6">
        <CardSkeleton rows={2} className="h-24" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8"><CardSkeleton rows={6} /></div>
          <div className="lg:col-span-4"><CardSkeleton rows={6} /></div>
        </div>
      </main>
    );
  }

  if (backtests.length === 0) {
    return (
      <main className="app-container min-h-screen py-6">
        <EmptyState
          icon={BarChart3}
          title={loadError ? "Backtests unavailable" : "No backtests to analyse yet"}
          hint={
            loadError
              ? "The analytics engine could not be reached. Check that the backend is running and retry."
              : "Run a strategy backtest and its analytics will appear here."
          }
          action={
            <Link
              href="/strategies"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"
            >
              Go to Strategies
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <div className="app-container min-h-screen animate-fade-up space-y-4 py-6">
      {/* 1. Institutional Top Control Bar */}
      <AnalyticsHeader
        startDate={startDate}
        endDate={endDate}
        onDateChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        frequency={frequency}
        onFrequencyChange={setFrequency}
        currency={currency}
        onCurrencyChange={setCurrency}
        onRunAnalysis={handleRunAnalysis}
        isRunning={isRunning}
      />

      {/* 2. SubNav 8-Tab Strip */}
      <AnalyticsSubNav
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
      />

      {/* 3. Tab Routing Component */}
      <div className="pt-1">
        {activeTab === "Overview" && (
          <div className="space-y-6">
            {/* First Half: Overview Dashboard */}
            <AnalyticsOverviewTab
              allBacktests={backtests}
              selectedIds={selectedIds}
              onToggleStrategy={handleToggleStrategy}
              onClearAll={handleClearAll}
              benchmark={benchmark}
              onBenchmarkChange={setBenchmark}
              initialCapital={initialCapital}
              onInitialCapitalChange={setInitialCapital}
            />

            {/* Section Divider for Second Half */}
            <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                    Market Regime & Factor Intelligence Suite
                  </h2>
                  <span className="text-[10px] bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                    REGIMES &amp; FACTORS
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Macro sensitivity breakdown, Fama-French multi-factor exposure, cross-asset correlation matrix, and rolling metrics
                </p>
              </div>
            </div>

            {/* Second Half: Regimes & Factor Suite */}
            <AnalyticsRegimesTab
              selectedBacktests={selectedBacktests}
              benchmark={benchmark}
            />
          </div>
        )}

        {activeTab === "Regimes" && (
          <AnalyticsRegimesTab
            selectedBacktests={selectedBacktests}
            benchmark={benchmark}
          />
        )}

        {activeTab === "Performance" && (
          <AnalyticsPerformanceTab selectedBacktests={selectedBacktests} />
        )}

        {activeTab === "Risk" && (
          <AnalyticsRiskTab selectedBacktests={selectedBacktests} />
        )}

        {activeTab === "Trades" && (
          <AnalyticsTradesTab selectedBacktests={selectedBacktests} />
        )}

        {activeTab === "Factors" && (
          <AnalyticsFactorsTab selectedBacktests={selectedBacktests} />
        )}

        {activeTab === "Robustness" && (
          <AnalyticsRobustnessTab selectedBacktests={selectedBacktests} />
        )}

        {activeTab === "Attribution" && (
          <AnalyticsAttributionTab selectedBacktests={selectedBacktests} />
        )}
      </div>
    </div>
  );
}
