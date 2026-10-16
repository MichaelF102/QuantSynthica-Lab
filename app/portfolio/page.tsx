"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import PortfolioSubNav, { PortfolioTab, PORTFOLIO_TABS } from "@/components/portfolio/PortfolioSubNav";
import PortfolioKpiStrip from "@/components/portfolio/PortfolioKpiStrip";
import PortfolioEquityCurveWidget from "@/components/portfolio/PortfolioEquityCurveWidget";
import PortfolioDrawdownWidget from "@/components/portfolio/PortfolioDrawdownWidget";
import PortfolioRollingMetricsWidget from "@/components/portfolio/PortfolioRollingMetricsWidget";
import PortfolioMonthlyHeatmapWidget from "@/components/portfolio/PortfolioMonthlyHeatmapWidget";
import PortfolioAllocationWidget, { AssetAllocation } from "@/components/portfolio/PortfolioAllocationWidget";
import PortfolioRiskContributionWidget from "@/components/portfolio/PortfolioRiskContributionWidget";
import PortfolioCorrelationMatrixWidget from "@/components/portfolio/PortfolioCorrelationMatrixWidget";
import PortfolioFactorExposureWidget from "@/components/portfolio/PortfolioFactorExposureWidget";
import PortfolioTailRiskWidget from "@/components/portfolio/PortfolioTailRiskWidget";
import PortfolioScenarioWidget from "@/components/portfolio/PortfolioScenarioWidget";
import PortfolioMonteCarloWidget from "@/components/portfolio/PortfolioMonteCarloWidget";
import PortfolioPositionRiskWidget from "@/components/portfolio/PortfolioPositionRiskWidget";
import PortfolioRebalancingWidget from "@/components/portfolio/PortfolioRebalancingWidget";
import PortfolioOptimizationWidget, { OptimizationMethod } from "@/components/portfolio/PortfolioOptimizationWidget";
import PortfolioInsightsWidget from "@/components/portfolio/PortfolioInsightsWidget";
import PortfolioStockBasketModal from "@/components/portfolio/PortfolioStockBasketModal";
import PortfolioReportModal from "@/components/portfolio/PortfolioReportModal";
import { CardSkeleton, EmptyState } from "@/components/ui/Card";
import { loadSystemSettings } from "@/lib/settings";
import { SERIES_COLORS } from "@/lib/chartTheme";
import { PieChart } from "lucide-react";
import { PortfolioResult, Rebalance, addHolding, normalizeWeights, runPortfolio } from "@/lib/portfolio/engine";
import { CurrencyCode, Frequency, benchmarkLabel, seriesStats, windowPts } from "@/lib/analyticsCalc";

type Market = "India" | "US";
type Currency = CurrencyCode;

const STORAGE_KEY = "algolab_portfolios";
const COLORS = [...SERIES_COLORS];

const DEFAULT_BASKETS: Record<Market, { ticker: string; weight: number }[]> = {
  India: [
    { ticker: "KAYNES", weight: 25 }, { ticker: "GENUSPOWER", weight: 25 }, { ticker: "RELIANCE", weight: 20 },
    { ticker: "TCS", weight: 15 }, { ticker: "HDFCBANK", weight: 15 },
  ],
  US: [
    { ticker: "AAPL", weight: 20 }, { ticker: "MSFT", weight: 20 }, { ticker: "NVDA", weight: 20 },
    { ticker: "SPY", weight: 20 }, { ticker: "TLT", weight: 20 },
  ],
};
const TEMPLATE_NAMES: Record<string, Market> = { "India Core Basket": "India", "US Core Basket": "US" };

const MARKET_DEFAULTS = {
  India: { currency: "INR" as Currency, benchmark: "^NSEI", capital: 1000000 },
  US: { currency: "USD" as Currency, benchmark: "SPY", capital: 100000 },
};

const build = (items: { ticker: string; weight: number }[], capital: number): AssetAllocation[] =>
  normalizeWeights(items).map((h, i) => ({ ticker: h.ticker, weight: h.weight, targetWeight: h.weight, drift: 0, color: COLORS[i % COLORS.length], value: Math.round((capital * h.weight) / 100) }));

interface Saved {
  name: string; market: Market; allocations: { ticker: string; weight: number; color: string }[];
  initialCapital: number; benchmark: string; rebalance: Rebalance; startDate: string; endDate: string;
  frequency: Frequency; currency: Currency; savedAt: string;
}

function readSaved(): Record<string, Saved> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function PortfolioContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: PortfolioTab = PORTFOLIO_TABS.some((t) => t.key === rawTab) ? (rawTab as PortfolioTab) : "Overview";
  const setActiveTab = useCallback((tab: PortfolioTab) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tab);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const [market, setMarket] = useState<Market>("India");
  const [portfolioName, setPortfolioName] = useState("India Core Basket");
  const [saved, setSaved] = useState<Record<string, Saved>>({});
  const [benchmark, setBenchmark] = useState(MARKET_DEFAULTS.India.benchmark);
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [frequency, setFrequency] = useState<Frequency>("Daily");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [initialCapital, setInitialCapital] = useState(MARKET_DEFAULTS.India.capital);
  const [rebalance, setRebalance] = useState<Rebalance>("Monthly");
  const [allocations, setAllocations] = useState<AssetAllocation[]>(() => build(DEFAULT_BASKETS.India, MARKET_DEFAULTS.India.capital));

  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [ranWith, setRanWith] = useState<{ start: string; end: string; rebalance: Rebalance; capital: number; benchmark: string; currency: Currency } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [basketOpen, setBasketOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [terminalTicker, setTerminalTicker] = useState<string | null>(null);

  // Always read the latest form state inside async handlers.
  const form = { market, benchmark, startDate, endDate, initialCapital, rebalance, allocations, currency };
  const formRef = useRef(form);
  formRef.current = form;
  const runId = useRef(0);

  const run = useCallback(async (override?: Partial<typeof form>) => {
    const f = { ...formRef.current, ...override };
    const id = ++runId.current;
    setIsRunning(true);
    setError(null);
    try {
      const r = await runPortfolio({
        holdings: f.allocations.map((a) => ({ ticker: a.ticker, weight: a.weight })),
        benchmark: f.benchmark, start: f.startDate, end: f.endDate, initialCapital: f.initialCapital, rebalance: f.rebalance,
      });
      if (id !== runId.current) return; // a newer run superseded this one
      setResult(r);
      setRanWith({ start: f.startDate, end: f.endDate, rebalance: f.rebalance, capital: f.initialCapital, benchmark: f.benchmark, currency: f.currency });
    } catch (e: any) {
      if (id !== runId.current) return;
      setError(e?.message || "Portfolio analysis failed");
    } finally {
      if (id === runId.current) setIsRunning(false);
    }
  }, []);

  // Mount: restore the last portfolio / market, then run once.
  useEffect(() => {
    const store = readSaved();
    setSaved(store);
    const sys = loadSystemSettings();
    if (sys?.backtest?.rebalanceFrequency) setRebalance(sys.backtest.rebalanceFrequency as Rebalance);
    const last = localStorage.getItem("algolab_last_portfolio");
    const ticker = localStorage.getItem("algolab_active_ticker");
    if (ticker) setTerminalTicker(ticker.toUpperCase());
    if (last && store[last]) {
      applySaved(store[last], false);
      void run(savedToForm(store[last]));
      return;
    }
    const c = localStorage.getItem("algolab_active_country");
    const m: Market = c === "US" ? "US" : "India";
    if (m === "US") applyMarketDefaults("US", false);
    void run(m === "US" ? marketForm("US") : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const marketForm = (m: Market) => ({
    market: m, currency: MARKET_DEFAULTS[m].currency, benchmark: MARKET_DEFAULTS[m].benchmark,
    initialCapital: MARKET_DEFAULTS[m].capital, allocations: build(DEFAULT_BASKETS[m], MARKET_DEFAULTS[m].capital),
  });

  const applyMarketDefaults = (m: Market, setName = true) => {
    const f = marketForm(m);
    setMarket(m); setCurrency(f.currency); setBenchmark(f.benchmark); setInitialCapital(f.initialCapital); setAllocations(f.allocations);
    if (setName) setPortfolioName(m === "India" ? "India Core Basket" : "US Core Basket");
  };

  const savedToForm = (s: Saved) => ({
    market: s.market, benchmark: s.benchmark, startDate: s.startDate, endDate: s.endDate, initialCapital: s.initialCapital,
    rebalance: s.rebalance, currency: s.currency,
    allocations: s.allocations.map((a) => ({ ticker: a.ticker, weight: a.weight, color: a.color, targetWeight: a.weight, drift: 0, value: Math.round((s.initialCapital * a.weight) / 100) })),
  });

  const applySaved = (s: Saved, setName = true) => {
    const f = savedToForm(s);
    setMarket(f.market); setBenchmark(f.benchmark); setStartDate(f.startDate); setEndDate(f.endDate); setInitialCapital(f.initialCapital);
    setRebalance(f.rebalance); setCurrency(f.currency); setFrequency(s.frequency); setAllocations(f.allocations);
    if (setName) setPortfolioName(s.name);
  };

  const handleMarketChange = (m: Market) => {
    if (m === market) return;
    localStorage.setItem("algolab_active_country", m);
    window.dispatchEvent(new CustomEvent("algolab:security-change", { detail: { country: m } }));
    applyMarketDefaults(m);
    void run(marketForm(m));
  };

  // Header calls this both for picking an existing portfolio and for renaming the current one.
  const handlePortfolioName = (name: string) => {
    const s = readSaved()[name];
    if (s) {
      applySaved(s);
      localStorage.setItem("algolab_last_portfolio", name);
      void run(savedToForm(s));
    } else if (TEMPLATE_NAMES[name]) {
      const m = TEMPLATE_NAMES[name];
      applyMarketDefaults(m);
      setPortfolioName(name);
      void run(marketForm(m));
    } else {
      setPortfolioName(name);
    }
  };

  const handleSave = (): boolean => {
    try {
      const store = readSaved();
      store[portfolioName] = {
        name: portfolioName, market, allocations: allocations.map((a) => ({ ticker: a.ticker, weight: a.weight, color: a.color })),
        initialCapital, benchmark, rebalance, startDate, endDate, frequency, currency, savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      localStorage.setItem("algolab_last_portfolio", portfolioName);
      setSaved(store);
      return true;
    } catch (e: any) {
      setError(`Could not save portfolio: ${e?.message || "storage unavailable"}`);
      return false;
    }
  };

  const commitAllocations = (next: AssetAllocation[]) => {
    const norm = normalizeWeights(next).map((a) => ({ ...a, targetWeight: a.weight, drift: 0, value: Math.round((initialCapital * a.weight) / 100) }));
    setAllocations(norm);
    void run({ allocations: norm });
  };

  const handleAddStockQuick = (ticker: string) => {
    const sym = ticker.toUpperCase();
    if (allocations.some((a) => a.ticker === sym)) return;
    const next = addHolding(allocations, { ticker: sym, weight: 0, color: COLORS[allocations.length % COLORS.length], value: 0 } as AssetAllocation);
    commitAllocations(next);
  };

  const handleApplyOptimization = (_m: OptimizationMethod, weights: Record<string, number>) =>
    commitAllocations(allocations.map((a) => ({ ...a, weight: weights[a.ticker] ?? a.weight })));

  const benchName = benchmarkLabel(benchmark);
  const benchShort = benchmark;
  const isStale = !!ranWith && (ranWith.start !== startDate || ranWith.end !== endDate || ranWith.rebalance !== rebalance || ranWith.capital !== initialCapital || ranWith.benchmark !== benchmark);

  // Frequency applies to the KPI strip and equity curve (resampled); risk widgets always use daily data.
  const view = useMemo(() => {
    if (!result || frequency === "Daily") return result;
    const pts = windowPts(result.pts, null, null, frequency);
    return { ...result, pts, stats: seriesStats(pts, frequency) };
  }, [result, frequency]);

  const finalWeights = result ? Object.fromEntries(result.tickers.map((t) => [t, result.finalWeights[t] * 100])) : null;
  const totalValue = result ? result.value[result.value.length - 1] : null;

  const showTop = activeTab === "Overview" || activeTab === "Performance";
  const body = result && view && (
    <>
      {showTop && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
            <div className="lg:col-span-7"><PortfolioEquityCurveWidget result={view} portfolioName={portfolioName} benchmarkSymbol={benchShort} benchmarkName={benchName} currency={currency} /></div>
            <div className="lg:col-span-5"><PortfolioDrawdownWidget result={result} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <PortfolioRollingMetricsWidget result={result} benchmarkSymbol={benchShort} />
            <PortfolioMonthlyHeatmapWidget result={result} />
          </div>
        </div>
      )}
      {(activeTab === "Overview" || activeTab === "Allocation" || activeTab === "Correlation") && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          <PortfolioAllocationWidget totalValue={totalValue} allocations={allocations} currentWeights={finalWeights} currency={currency} onEditBasket={() => setBasketOpen(true)} />
          {activeTab !== "Correlation" && <PortfolioRiskContributionWidget result={result} />}
          <PortfolioCorrelationMatrixWidget result={result} />
          {activeTab === "Correlation" && <PortfolioFactorExposureWidget result={result} benchmarkSymbol={benchShort} />}
        </div>
      )}
      {(activeTab === "Overview" || activeTab === "Risk Metrics" || activeTab === "Stress Test" || activeTab === "Scenario Analysis") && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          {activeTab !== "Scenario Analysis" && <PortfolioTailRiskWidget result={result} benchmarkSymbol={benchShort} />}
          {(activeTab === "Overview" || activeTab === "Scenario Analysis") && <PortfolioScenarioWidget result={result} benchmarkSymbol={benchShort} currency={currency} />}
          {activeTab !== "Stress Test" && <PortfolioFactorExposureWidget result={result} benchmarkSymbol={benchShort} />}
          <PortfolioMonteCarloWidget result={result} currency={currency} />
          {activeTab === "Stress Test" && <PortfolioDrawdownWidget result={result} />}
          {activeTab === "Risk Metrics" && <PortfolioRiskContributionWidget result={result} />}
        </div>
      )}
      {(activeTab === "Overview" || activeTab === "Allocation" || activeTab === "Risk Metrics") && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          <PortfolioPositionRiskWidget result={result} />
          <PortfolioRebalancingWidget result={result} current={rebalance} onSelect={setRebalance} />
          <PortfolioOptimizationWidget result={result} onApplyOptimization={handleApplyOptimization} />
        </div>
      )}
      {(activeTab === "Overview" || activeTab === "Risk Metrics") && <PortfolioInsightsWidget result={result} benchmarkName={benchShort} />}
    </>
  );

  return (
    <div className="min-h-screen pb-16 text-slate-100">
      <div className="app-container animate-fade-up space-y-4 py-6">
        <PortfolioHeader
          portfolioName={portfolioName}
          onPortfolioNameChange={handlePortfolioName}
          availablePortfolios={Array.from(new Set([...Object.keys(TEMPLATE_NAMES), ...Object.keys(saved)]))}
          benchmark={benchmark}
          onBenchmarkChange={setBenchmark}
          startDate={startDate}
          endDate={endDate}
          onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          frequency={frequency}
          onFrequencyChange={setFrequency}
          currency={currency}
          onCurrencyChange={setCurrency}
          initialCapital={initialCapital}
          onInitialCapitalChange={setInitialCapital}
          rebalance={rebalance}
          onRebalanceChange={setRebalance}
          onRunAnalysis={() => void run()}
          isRunning={isRunning}
          market={market}
          onMarketChange={handleMarketChange}
          allocations={allocations}
          onOpenStockBasketModal={() => setBasketOpen(true)}
          terminalActiveTicker={terminalTicker}
          onAddStockQuick={handleAddStockQuick}
          onSaveLayout={handleSave}
          onExport={() => setReportOpen(true)}
        />

        <PortfolioSubNav activeTab={activeTab} onTabChange={setActiveTab} />

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</span>
            <button onClick={() => void run()} className="inline-flex items-center gap-1 font-medium text-rose-200 hover:text-white"><RefreshCw className="h-3 w-3" /> Retry</button>
          </div>
        )}
        {result && result.syntheticTickers.length > 0 && (
          <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            <span className="mr-2 font-mono font-bold uppercase tracking-wider">Synthetic data</span>
            Price history for {result.syntheticTickers.join(", ")} could not be fetched, so a generated series was used. Treat those results as illustrative.
          </div>
        )}
        {isStale && !isRunning && (
          <div role="status" className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
            Settings changed since the last run. Click <span className="font-semibold">Run Analysis</span> to recompute.
          </div>
        )}

        <PortfolioKpiStrip result={view} benchmarkName={benchShort} loading={isRunning && !result} />

        {isRunning && !result ? (
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
            <div className="lg:col-span-7"><CardSkeleton rows={7} /></div>
            <div className="lg:col-span-5"><CardSkeleton rows={7} /></div>
          </div>
        ) : !result && !error ? (
          <EmptyState icon={PieChart} title="No analysis yet" hint="Configure the basket and click Run Analysis." />
        ) : (
          <div className={isRunning ? "pointer-events-none space-y-3.5 opacity-60 transition-opacity" : "space-y-3.5"}>{body}</div>
        )}
      </div>

      <PortfolioStockBasketModal
        isOpen={basketOpen}
        onClose={() => setBasketOpen(false)}
        market={market}
        onMarketChange={handleMarketChange}
        allocations={allocations}
        onSaveAllocations={commitAllocations}
        initialCapital={initialCapital}
        currency={currency}
      />

      <PortfolioReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        result={result}
        portfolioName={portfolioName}
        benchmarkName={benchName}
        currency={ranWith?.currency ?? currency}
        initialCapital={ranWith?.capital ?? initialCapital}
        rebalance={ranWith?.rebalance ?? rebalance}
        start={ranWith?.start ?? startDate}
        end={ranWith?.end ?? endDate}
      />
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={<main className="app-container space-y-4 py-6"><CardSkeleton rows={2} className="h-28" /><CardSkeleton rows={6} /></main>}>
      <PortfolioContent />
    </Suspense>
  );
}
