"use client";

import React, { useState, useEffect } from "react";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import PortfolioSubNav, { PortfolioTab } from "@/components/portfolio/PortfolioSubNav";
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
import PortfolioMonteCarloWidget from "@/components/portfolio/PortfolioMonteCarloWidget";
import PortfolioPositionRiskWidget from "@/components/portfolio/PortfolioPositionRiskWidget";
import PortfolioRebalancingWidget from "@/components/portfolio/PortfolioRebalancingWidget";
import PortfolioOptimizationWidget, { OptimizationMethod } from "@/components/portfolio/PortfolioOptimizationWidget";
import PortfolioInsightsWidget from "@/components/portfolio/PortfolioInsightsWidget";
import PortfolioStockBasketModal from "@/components/portfolio/PortfolioStockBasketModal";
import { api } from "@/lib/api";
import { loadSystemSettings } from "@/lib/settings";

const INDIA_INITIAL_ALLOCATIONS: AssetAllocation[] = [
  { ticker: "KAYNES", weight: 25.0, value: 305850, color: "#38BDF8", targetWeight: 22.0, drift: 3.0 },
  { ticker: "GENUSPOWER", weight: 25.0, value: 305850, color: "#10B981", targetWeight: 24.0, drift: 1.0 },
  { ticker: "RELIANCE", weight: 20.0, value: 244680, color: "#F59E0B", targetWeight: 22.0, drift: -2.0 },
  { ticker: "TCS", weight: 15.0, value: 183510, color: "#EC4899", targetWeight: 16.0, drift: -1.0 },
  { ticker: "HDFCBANK", weight: 15.0, value: 183510, color: "#8B5CF6", targetWeight: 16.0, drift: -1.0 },
];

const US_INITIAL_ALLOCATIONS: AssetAllocation[] = [
  { ticker: "AAPL", weight: 20.0, value: 24468, color: "#38BDF8", targetWeight: 18.4, drift: 1.6 },
  { ticker: "MSFT", weight: 20.0, value: 24468, color: "#F59E0B", targetWeight: 16.7, drift: 3.3 },
  { ticker: "NVDA", weight: 20.0, value: 24468, color: "#EC4899", targetWeight: 28.2, drift: -8.2 },
  { ticker: "SPY", weight: 20.0, value: 24468, color: "#8B5CF6", targetWeight: 22.1, drift: -2.1 },
  { ticker: "TLT", weight: 20.0, value: 24468, color: "#06B6D4", targetWeight: 14.6, drift: 5.4 },
];

export default function PortfolioPage() {
  const sysSettings = typeof window !== "undefined" ? loadSystemSettings() : null;

  // Active market state (India vs US)
  const [market, setMarket] = useState<"India" | "US">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_country");
      if (saved === "India" || saved === "US") return saved;
    }
    return "India";
  });

  const [portfolioName, setPortfolioName] = useState("Dual Moving Average Crossover");
  const [availablePortfolios, setAvailablePortfolios] = useState<string[]>([
    "Dual Moving Average Crossover",
    "RSI Mean Reversion (SPY)",
    "Bollinger Band Breakout (TSLA)",
    "Multi-Strategy Tactical Basket",
  ]);

  // Dynamic benchmark according to country
  const [benchmark, setBenchmark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_country");
      if (saved === "US") return "SPY";
    }
    return "^NSEI";
  });

  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [frequency, setFrequency] = useState<"Daily" | "Weekly" | "Monthly">("Daily");

  // Dynamic currency according to country
  const [currency, setCurrency] = useState<"USD" | "INR" | "EUR" | "GBP">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_country");
      if (saved === "US") return "USD";
    }
    return "INR";
  });

  // Dynamic initial capital according to country (₹10,00,000 for India, $100,000 for US)
  const [initialCapital, setInitialCapital] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_country");
      if (saved === "US") return 100000;
    }
    return 1000000;
  });

  const [rebalance, setRebalance] = useState<"Monthly" | "Quarterly" | "Weekly" | "Never">(
    (sysSettings?.backtest?.rebalanceFrequency as any) || "Monthly"
  );
  const [activeTab, setActiveTab] = useState<PortfolioTab>("Overview");
  const [isRunning, setIsRunning] = useState(false);

  // Dynamic allocations according to country
  const [allocations, setAllocations] = useState<AssetAllocation[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_country");
      if (saved === "US") return US_INITIAL_ALLOCATIONS;
    }
    return INDIA_INITIAL_ALLOCATIONS;
  });

  // Modal & active terminal ticker
  const [isStockBasketModalOpen, setIsStockBasketModalOpen] = useState(false);
  const [terminalActiveTicker, setTerminalActiveTicker] = useState<string | null>(null);

  // Sync with terminal active security & country events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTicker = localStorage.getItem("algolab_active_ticker");
      if (savedTicker) setTerminalActiveTicker(savedTicker.toUpperCase());
    }

    const handleSecurityChange = (e: any) => {
      if (e.detail?.symbol) {
        setTerminalActiveTicker(e.detail.symbol.toUpperCase());
      }
      if (e.detail?.country && (e.detail.country === "India" || e.detail.country === "US")) {
        handleMarketChange(e.detail.country);
      }
    };

    window.addEventListener("algolab:security-change", handleSecurityChange);
    return () => window.removeEventListener("algolab:security-change", handleSecurityChange);
  }, []);

  // Handle market change
  const handleMarketChange = (newMarket: "India" | "US") => {
    setMarket(newMarket);
    if (typeof window !== "undefined") {
      localStorage.setItem("algolab_active_country", newMarket);
      window.dispatchEvent(new CustomEvent("algolab:security-change", { detail: { country: newMarket } }));
    }
    if (newMarket === "India") {
      setCurrency("INR");
      setBenchmark("^NSEI");
      if (initialCapital === 100000) setInitialCapital(1000000);
      setAllocations(INDIA_INITIAL_ALLOCATIONS);
    } else {
      setCurrency("USD");
      setBenchmark("SPY");
      if (initialCapital === 1000000) setInitialCapital(100000);
      setAllocations(US_INITIAL_ALLOCATIONS);
    }
  };

  // Sync with user's saved strategies and backtests from QuantSynthica Lab
  useEffect(() => {
    let isMounted = true;
    const loadPortfolios = async () => {
      try {
        const [strats, backtests] = await Promise.all([
          api.getStrategies().catch(() => []),
          api.getBacktests().catch(() => []),
        ]);

        if (isMounted) {
          const names = new Set([
            "Dual Moving Average Crossover",
            "RSI Mean Reversion (SPY)",
            "Bollinger Band Breakout (TSLA)",
            "Multi-Strategy Tactical Basket",
          ]);
          strats.forEach((s) => s.name && names.add(s.name));
          backtests.forEach((b) => b.strategy_name && names.add(b.strategy_name));
          setAvailablePortfolios(Array.from(names));
        }
      } catch (err) {
        console.error("Failed to load portfolio strategies:", err);
      }
    };
    loadPortfolios();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalPortfolioValue = Math.round(initialCapital * 1.2234);

  // Recalculate values when initialCapital changes
  useEffect(() => {
    setAllocations((prev) =>
      prev.map((a) => ({
        ...a,
        value: Math.round(totalPortfolioValue * (a.weight / 100)),
      }))
    );
  }, [totalPortfolioValue]);

  const handleRunAnalysis = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 700);
  };

  const handleApplyOptimization = (
    method: OptimizationMethod,
    weights: Record<string, number>
  ) => {
    setAllocations((prev) =>
      prev.map((a) => {
        const newWeight = weights[a.ticker] ?? a.weight;
        return {
          ...a,
          weight: newWeight,
          targetWeight: newWeight,
          drift: 0,
          value: Math.round(totalPortfolioValue * (newWeight / 100)),
        };
      })
    );
  };

  const handleAddStockQuick = (ticker: string) => {
    const sym = ticker.toUpperCase();
    if (allocations.some((a) => a.ticker === sym)) return;
    const colors = ["#38BDF8", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];
    const newColor = colors[allocations.length % colors.length];
    const newAlloc: AssetAllocation = {
      ticker: sym,
      weight: 15,
      targetWeight: 15,
      value: Math.round(totalPortfolioValue * 0.15),
      drift: 0,
      color: newColor,
    };
    setAllocations((prev) => [...prev, newAlloc]);
  };

  return (
    <div className="min-h-screen bg-[#06090E] text-slate-100 pb-16 font-mono">
      <div className="max-w-[1720px] mx-auto px-4 py-3 space-y-3.5">
        {/* 1. Header & Parameter Ribbon */}
        <PortfolioHeader
          portfolioName={portfolioName}
          onPortfolioNameChange={setPortfolioName}
          availablePortfolios={availablePortfolios}
          benchmark={benchmark}
          onBenchmarkChange={setBenchmark}
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
          initialCapital={initialCapital}
          onInitialCapitalChange={setInitialCapital}
          rebalance={rebalance}
          onRebalanceChange={setRebalance}
          onRunAnalysis={handleRunAnalysis}
          isRunning={isRunning}
          market={market}
          onMarketChange={handleMarketChange}
          allocations={allocations}
          onOpenStockBasketModal={() => setIsStockBasketModalOpen(true)}
          terminalActiveTicker={terminalActiveTicker}
          onAddStockQuick={handleAddStockQuick}
        />

        {/* 2. Seven-Tab Institutional Sub-Navigation */}
        <PortfolioSubNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 3. 9-Metric KPI Strip with Country Benchmark Comparison */}
        <PortfolioKpiStrip benchmarkSymbol={benchmark} />

        {/* 4. Main Analytical Workstation Content */}
        {/* Part 1 Views: Equity, Drawdown, Rolling, Heatmap */}
        {(activeTab === "Overview" || activeTab === "Performance") && (
          <div className="space-y-3.5">
            {/* Middle Grid: Equity Curve (7 cols) & Drawdown (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              <div className="lg:col-span-7">
                <PortfolioEquityCurveWidget
                  portfolioName={portfolioName}
                  benchmarkSymbol={benchmark}
                  initialCapital={initialCapital}
                  currency={currency}
                />
              </div>
              <div className="lg:col-span-5">
                <PortfolioDrawdownWidget />
              </div>
            </div>

            {/* Bottom Grid: Rolling Metrics (6 cols) & Monthly Returns Heatmap (6 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              <PortfolioRollingMetricsWidget benchmarkSymbol={benchmark} />
              <PortfolioMonthlyHeatmapWidget />
            </div>
          </div>
        )}

        {/* Part 2 Views: Allocation, Risk Contribution, Correlation, Factors, Tail Risk, Monte Carlo, Positions, Rebalance, Optimization, Insights */}
        {(activeTab === "Overview" ||
          activeTab === "Allocation" ||
          activeTab === "Risk Metrics" ||
          activeTab === "Correlation" ||
          activeTab === "Stress Test" ||
          activeTab === "Scenario Analysis") && (
          <div className="space-y-3.5 pt-2">
            {/* Row 1: Portfolio Allocation (4 cols), Risk Contribution (4 cols), Correlation Matrix (4 cols) */}
            {(activeTab === "Overview" ||
              activeTab === "Allocation" ||
              activeTab === "Correlation") && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                <PortfolioAllocationWidget
                  totalValue={totalPortfolioValue}
                  allocations={allocations}
                  currency={currency}
                  onEditBasket={() => setIsStockBasketModalOpen(true)}
                />
                <PortfolioRiskContributionWidget />
                <PortfolioCorrelationMatrixWidget />
              </div>
            )}

            {/* Row 2: Factor Exposure (4 cols), Tail Risk & Stress Testing (4 cols), Monte Carlo Simulation (4 cols) */}
            {(activeTab === "Overview" ||
              activeTab === "Stress Test" ||
              activeTab === "Scenario Analysis" ||
              activeTab === "Risk Metrics") && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                <PortfolioFactorExposureWidget />
                <PortfolioTailRiskWidget benchmarkSymbol={benchmark} />
                <PortfolioMonteCarloWidget />
              </div>
            )}

            {/* Row 3: Position-Level Risk (4 cols), Rebalancing Analysis (4 cols), Portfolio Optimization (4 cols) */}
            {(activeTab === "Overview" ||
              activeTab === "Allocation" ||
              activeTab === "Risk Metrics") && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                <PortfolioPositionRiskWidget />
                <PortfolioRebalancingWidget
                  currentRebalance={rebalance}
                  onRebalanceSelect={setRebalance}
                />
                <PortfolioOptimizationWidget
                  onApplyOptimization={handleApplyOptimization}
                />
              </div>
            )}

            {/* Row 4: Key Risk Insights (8 cols) & Portfolio Risk Summary (4 cols) */}
            <PortfolioInsightsWidget />
          </div>
        )}
      </div>

      {/* Stock Basket & Asset Customization Modal */}
      <PortfolioStockBasketModal
        isOpen={isStockBasketModalOpen}
        onClose={() => setIsStockBasketModalOpen(false)}
        market={market}
        onMarketChange={handleMarketChange}
        allocations={allocations}
        onSaveAllocations={(newAllocations) => setAllocations(newAllocations)}
        initialCapital={initialCapital}
        currency={currency}
      />
    </div>
  );
}
