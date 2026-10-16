"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Play,
  Check,
  Star,
  MoreVertical,
  LayoutGrid,
  List,
  Users,
  Layers,
  Info,
  Target,
  Rocket,
  FlaskConical,
} from "lucide-react";
import { api } from "@/lib/api";
import { StrategyConfig, BacktestResult } from "@/types";
import { SEED_STRATEGIES } from "@/lib/seedData";
import { formatConditionRule, formatRuleSet } from "@/lib/formatRule";
import { fmtPct, fmtInt, isNum, cn } from "@/lib/utils";
import { formatRatio } from "@/lib/formatters";
import { isIndianTicker } from "@/lib/market";
import MiniSparkline from "@/components/charts/MiniSparkline";
import TestStrategyModal from "@/components/strategies/TestStrategyModal";

export default function StrategiesPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [strategies, setStrategies] = useState<StrategyConfig[]>(() => SEED_STRATEGIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedAsset, setSelectedAsset] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortOrder, setSortOrder] = useState<string>("name_asc");
  const [activeTab, setActiveTab] = useState<"strategies" | "performance" | "templates" | "compare">("strategies");
  const [filtersOpen, setFiltersOpen] = useState(false); // phone-only: collapse the filter sidebar
  const [selectedNav, setSelectedNav] = useState<string>("all"); // 'all' | 'templates' | 'my' | 'shared'
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(SEED_STRATEGIES[0]?.id || null);
  const [detailTab, setDetailTab] = useState<"overview" | "rules" | "performance" | "backtests">("overview");
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<BacktestResult[]>([]);

  // Test Strategy on Custom Stock Modal state
  const [testModalOpen, setTestModalOpen] = useState<boolean>(false);
  const [strategyToTest, setStrategyToTest] = useState<StrategyConfig | null>(null);

  // Active workspace security and country
  // Defaults first; the stored security is read after mount so server and browser HTML match.
  const [activeCountry, setActiveCountry] = useState<"India" | "US">("India");
  const [selectedStockForRun, setSelectedStockForRun] = useState<string>("GENUSPOWER");
  useEffect(() => {
    try {
      const country = localStorage.getItem("algolab_active_country");
      if (country === "India" || country === "US") setActiveCountry(country);
      const active = localStorage.getItem("algolab_active_ticker");
      if (active) setSelectedStockForRun(active.toUpperCase());
    } catch { /* storage unavailable */ }
  }, []);

  // Listen to security & country changes from navbar
  useEffect(() => {
    const handleSecurityChange = (e: any) => {
      if (e.detail?.symbol) {
        setSelectedStockForRun(e.detail.symbol.toUpperCase());
      }
    };
    const handleCountryChange = (e: any) => {
      if (e.detail?.country) {
        setActiveCountry(e.detail.country);
        if (e.detail.country === "India" && !selectedStockForRun.endsWith(".NS")) {
          setSelectedStockForRun("GENUSPOWER");
        }
      }
    };
    window.addEventListener("algolab:security_changed", handleSecurityChange);
    window.addEventListener("algolab:country_changed", handleCountryChange);
    return () => {
      window.removeEventListener("algolab:security_changed", handleSecurityChange);
      window.removeEventListener("algolab:country_changed", handleCountryChange);
    };
  }, [selectedStockForRun]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const loadStrategies = async () => {
    api
      .getBacktests()
      .then((bts) => setRuns((bts ?? []).filter((b) => !b.is_sample && b.status === "COMPLETED" && b.metrics)))
      .catch(() => setRuns([]));
    try {
      const data = await api.getStrategies();
      if (data && data.length > 0) {
        setStrategies(data);
        if (!selectedStrategyId) {
          setSelectedStrategyId(data[0].id);
        }
      }
    } catch (err) {
      console.warn("Using cached institutional strategies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, []);

  // Strategy Categories & Dynamic Count
  const categoriesList = [
    { id: "ALL", label: "All Strategies", filter: "ALL" },
    { id: "TREND", label: "Trend", filter: "trend" },
    { id: "MEAN_REVERSION", label: "Mean Reversion", filter: "mean_reversion" },
    { id: "MOMENTUM", label: "Momentum", filter: "momentum" },
    { id: "BREAKOUT", label: "Breakout", filter: "breakout" },
    { id: "VOLATILITY", label: "Volatility", filter: "volatility" },
    { id: "SYSTEMATIC", label: "Systematic", filter: "systematic" },
    { id: "CUSTOM", label: "Custom", filter: "custom" },
  ];

  // Distinct Assets for Filter List
  const distinctAssets = useMemo(() => {
    const counts: Record<string, number> = {};
    strategies.forEach((s) => {
      counts[s.asset] = (counts[s.asset] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([asset, count]) => ({ asset, count }))
      .sort((a, b) => b.count - a.count);
  }, [strategies]);

  // Selected Strategy Object
  const currentStrategy = useMemo(() => {
    return strategies.find((s) => s.id === selectedStrategyId) || strategies[0] || null;
  }, [strategies, selectedStrategyId]);

  // Filtered Strategies
  const filteredStrategies = useMemo(() => {
    return strategies
      .filter((s) => {
        const sType = s.strategy_type || "trend";
        const isCustom = s.id.startsWith("strat_");

        // Left nav filter
        if (selectedNav === "templates" && isCustom) return false;
        if (selectedNav === "my" && !isCustom) return false;

        // Category filter
        if (selectedCategory !== "ALL") {
          if (selectedCategory.toLowerCase() === "custom") {
            if (!isCustom) return false;
          } else if (sType.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        // Asset filter
        if (selectedAsset !== "ALL" && s.asset !== selectedAsset) {
          return false;
        }

        // Status filter
        if (selectedStatus === "READY" && isCustom) return false;
        if (selectedStatus === "DRAFT" && !isCustom) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchAsset = s.asset.toLowerCase().includes(q);
          const matchDesc = (s.description || "").toLowerCase().includes(q);
          const matchType = sType.toLowerCase().includes(q);
          const matchIndicator = s.indicators.some((ind) => ind.name.toLowerCase().includes(q) || ind.id.toLowerCase().includes(q));
          if (!matchName && !matchAsset && !matchDesc && !matchType && !matchIndicator) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "name_asc") return a.name.localeCompare(b.name);
        if (sortOrder === "name_desc") return b.name.localeCompare(a.name);
        if (sortOrder === "asset") return a.asset.localeCompare(b.asset);
        return 0;
      });
  }, [strategies, selectedNav, selectedCategory, selectedAsset, selectedStatus, searchQuery, sortOrder]);

  // Paginated strategies
  const paginatedStrategies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStrategies.slice(start, start + pageSize);
  }, [filteredStrategies, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStrategies.length / pageSize) || 1;

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: strategies.length,
      TREND: 0,
      MEAN_REVERSION: 0,
      MOMENTUM: 0,
      BREAKOUT: 0,
      VOLATILITY: 0,
      SYSTEMATIC: 0,
      CUSTOM: 0,
    };
    strategies.forEach((s) => {
      const isCustom = s.id.startsWith("strat_");
      if (isCustom) counts.CUSTOM++;
      const t = (s.strategy_type || "trend").toUpperCase();
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [strategies]);

  // Performance comes only from real completed runs (newest run per strategy); no run -> null -> "—".
  const getMetrics = (id: string) => {
    const run = [...runs].reverse().find((r) => r.strategy_id === id);
    const m = run?.metrics;
    if (!run || !m) return null;
    return {
      ret: m.total_return,
      sharpe: m.sharpe_ratio,
      trades: m.num_trades,
      maxDd: m.max_drawdown,
      winRate: m.win_rate,
      pf: m.profit_factor,
      curve: run.equity_curve.filter((_, i, a) => i % Math.ceil(a.length / 30 || 1) === 0).map((p) => p.portfolio_value),
      ticker: run.ticker,
    };
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this strategy configuration?")) {
      try {
        await api.deleteStrategy(id);
        setStrategies((prev) => prev.filter((s) => s.id !== id));
      } catch {
        alert("Failed to delete strategy");
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-6.5rem)] select-none flex-col bg-transparent text-xs text-slate-200">
      {/* ============================================================ */}
      {/* 1. TOP METRIC RIBBON & STRATEGY HEADER                       */}
      {/* ============================================================ */}
      <div className="border-b border-border/80 bg-surface/40 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1920px] flex-col justify-between gap-4 lg:flex-row lg:items-center">
          {/* Title & Description */}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
              Strategy{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Library</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Models you can backtest. Nothing here is routed live.
            </p>
            <Link
              href="/strategies/builder"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-[#161028]/80 px-3 py-1.5 text-xs font-medium text-white shadow-[0_0_14px_rgba(168,85,247,0.15)] transition-colors hover:border-purple-400/70 hover:bg-[#1E1538] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400/70"
            >
              <FlaskConical className="h-3.5 w-3.5 text-purple-300" />
              Strategy Lab
              <span className="font-normal text-purple-200/70">· build a new strategy</span>
            </Link>
          </div>

          {/* Top KPI Metrics Strip */}
            <div className="flex items-center gap-2 overflow-x-auto font-mono text-xs">
              {[
                { label: "Total", value: strategies.length, tone: "text-white" },
                { label: "Active", value: strategies.length, tone: "text-market-up" },
                { label: "Trend", value: categoryCounts.TREND, tone: "text-white" },
                { label: "Mean Rev", value: categoryCounts.MEAN_REVERSION, tone: "text-white" },
                { label: "Momentum", value: categoryCounts.MOMENTUM, tone: "text-white" },
                { label: "Breakout", value: categoryCounts.BREAKOUT, tone: "text-white" },
                { label: "Vol", value: categoryCounts.VOLATILITY, tone: "text-white" },
                { label: "Systematic", value: categoryCounts.SYSTEMATIC, tone: "text-white" },
                { label: "Custom", value: categoryCounts.CUSTOM, tone: "text-brand-amber" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-lg border border-border bg-surface-muted/50 px-3 py-1.5 text-center">
                  <div className={`text-sm font-semibold tabular-nums ${kpi.tone}`}>{kpi.value}</div>
                  <div className="text-[9px] uppercase tracking-wide text-slate-500">{kpi.label}</div>
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. THREE-COLUMN DESKTOP WORKSTATION LAYOUT                   */}
      {/* ============================================================ */}
      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <button type="button" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} className="flex items-center justify-between border-b border-[#1e293b] bg-[#0b1222] px-4 py-2.5 text-xs font-semibold text-slate-200 lg:hidden">
          <span>Filters <span className="font-normal text-slate-500">· {selectedCategory === "ALL" ? "All strategies" : selectedCategory}</span></span>
          <span className="text-slate-400">{filtersOpen ? "Hide" : "Show"}</span>
        </button>
        {/* ============================================================ */}
        {/* COLUMN 1: LEFT FILTERS & REPOSITORIES SIDEBAR                */}
        {/* ============================================================ */}
        <div className={`${filtersOpen ? "flex" : "hidden"} w-full flex-col space-y-4 border-b border-[#1e293b] bg-[#080d1a] p-3 lg:flex lg:w-56 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r`}>
          {/* Categories Navigation */}
          <div className="space-y-0.5">
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === "ALL" ? strategies.length : (categoryCounts[cat.id] || 0);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    isSelected
                      ? "bg-[#0b1222] text-[#3b82f6] font-bold"
                      : "text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#0b1222]"
                  }`}
                >
                  <span className="text-[11px]">{cat.label}</span>
                  <span className="text-[10px] text-[#64748b]">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#1e293b] pt-3 space-y-0.5">
            <button
              onClick={() => setSelectedNav("templates")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                selectedNav === "templates" ? "bg-[#0b1222] text-[#3b82f6] font-bold" : "text-[#94a3b8] hover:text-[#cbd5e1]"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Layers className="h-3 w-3 text-[#64748b]" />
                <span className="text-[11px]">Templates</span>
              </div>
              <span className="text-[10px] text-[#64748b]">29</span>
            </button>

            <button
              onClick={() => setSelectedNav("my")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                selectedNav === "my" ? "bg-[#0b1222] text-[#3b82f6] font-bold" : "text-[#94a3b8] hover:text-[#cbd5e1]"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="h-3 w-3 text-[#64748b]" />
                <span className="text-[11px]">My Strategies</span>
              </div>
              <span className="text-[10px] text-[#64748b]">{categoryCounts.CUSTOM}</span>
            </button>

            <button
              onClick={() => setSelectedNav("shared")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                selectedNav === "shared" ? "bg-[#0b1222] text-[#3b82f6] font-bold" : "text-[#94a3b8] hover:text-[#cbd5e1]"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 text-[#64748b]" />
                <span className="text-[11px]">Shared with Me</span>
              </div>
              <span className="text-[10px] text-[#64748b]">3</span>
            </button>
          </div>

          {/* Asset Filter Checkboxes */}
          <div className="border-t border-[#1e293b] pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider">
                ASSET FILTER
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${activeCountry === "India" ? "text-[#10B981] bg-[#10B981]/15" : "text-[#3b82f6] bg-[#3b82f6]/15"}`}>
                {activeCountry === "India" ? "🇮🇳 INDIA" : "🇺🇸 US"}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <label
                onClick={() => setSelectedAsset("ALL")}
                className="flex items-center justify-between cursor-pointer py-0.5 text-[#cbd5e1]"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-[1px] border flex items-center justify-center ${selectedAsset === "ALL" ? "border-[#3b82f6] bg-[#3b82f6] text-black" : "border-[#64748b]"}`}>
                    {selectedAsset === "ALL" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <span>All Assets</span>
                </div>
                <span className="text-[10px] text-[#64748b]">{strategies.length}</span>
              </label>

              {(activeCountry === "India"
                ? ["GENUSPOWER", "RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "ICICIBANK"]
                : ["AAPL", "NVDA", "TSLA", "MSFT", "SPY", "QQQ", "AMZN"]
              ).map((asset) => {
                const isChecked = selectedAsset === asset;
                return (
                  <label
                    key={asset}
                    onClick={() => {
                      const next = isChecked ? "ALL" : asset;
                      setSelectedAsset(next);
                      if (next !== "ALL") {
                        setSelectedStockForRun(asset);
                      }
                    }}
                    className="flex items-center justify-between cursor-pointer py-0.5 text-[#94a3b8] hover:text-[#cbd5e1]"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-[1px] border flex items-center justify-center ${isChecked ? "border-[#3b82f6] bg-[#3b82f6] text-black" : "border-[#64748b]"}`}>
                        {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                      <span className="font-mono">{asset}</span>
                    </div>
                    <span className="text-[9px] text-[#3b82f6] hover:underline">Test &rarr;</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="border-t border-[#1e293b] pt-3 space-y-2">
            <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider block">
              STATUS
            </span>
            <div className="space-y-1 text-[11px]">
              <label
                onClick={() => setSelectedStatus("ALL")}
                className="flex items-center justify-between cursor-pointer py-0.5 text-[#cbd5e1]"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-[1px] border flex items-center justify-center ${selectedStatus === "ALL" ? "border-[#3b82f6] bg-[#3b82f6] text-black" : "border-[#64748b]"}`}>
                    {selectedStatus === "ALL" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <span>All</span>
                </div>
                <span className="text-[10px] text-[#64748b]">{strategies.length}</span>
              </label>

              <label
                onClick={() => setSelectedStatus("READY")}
                className="flex items-center justify-between cursor-pointer py-0.5 text-[#94a3b8] hover:text-[#cbd5e1]"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-[1px] border flex items-center justify-center ${selectedStatus === "READY" ? "border-[#3b82f6] bg-[#3b82f6] text-black" : "border-[#64748b]"}`}>
                    {selectedStatus === "READY" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <span>Ready</span>
                </div>
                <span className="text-[10px] text-[#64748b]">{strategies.length - categoryCounts.CUSTOM}</span>
              </label>

              <label
                onClick={() => setSelectedStatus("DRAFT")}
                className="flex items-center justify-between cursor-pointer py-0.5 text-[#94a3b8] hover:text-[#cbd5e1]"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-[1px] border flex items-center justify-center ${selectedStatus === "DRAFT" ? "border-[#3b82f6] bg-[#3b82f6] text-black" : "border-[#64748b]"}`}>
                    {selectedStatus === "DRAFT" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <span>Draft</span>
                </div>
                <span className="text-[10px] text-[#64748b]">{categoryCounts.CUSTOM}</span>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 2: CENTER TABLE / GRID CATALOG VIEW                   */}
        {/* ============================================================ */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#080d1a] lg:overflow-hidden">
          {/* Sub-navigation tabs & Filter controls bar */}
          <div className="border-b border-[#1e293b] bg-[#0b1222] px-4 py-2 flex flex-wrap items-center justify-between gap-3">
            {/* Nav Tabs */}
            <div className="flex max-w-full flex-wrap items-center gap-1 border border-[#1e293b] bg-[#080d1a] p-0.5 rounded-lg">
              {(["strategies", "performance", "templates", "compare"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg font-bold uppercase text-[10px] transition-colors ${
                    activeTab === tab
                      ? "bg-[#1e293b] text-[#3b82f6]"
                      : "text-[#94a3b8] hover:text-[#cbd5e1]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* View Mode & Sorter */}
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-1.5 text-[#64748b]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search strategies, indicators, assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 bg-[#080d1a] border border-[#1e293b] rounded-lg text-xs text-[#cbd5e1] placeholder-[#64748b] w-52 focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-[#080d1a] border border-[#1e293b] rounded-lg px-2 py-1 text-[11px] text-[#94a3b8] focus:outline-none"
              >
                <option value="name_asc">Sort: Name (A &rarr; Z)</option>
                <option value="name_desc">Sort: Name (Z &rarr; A)</option>
                <option value="asset">Sort: Asset</option>
              </select>

              <div className="flex items-center rounded-lg border border-[#1e293b] bg-[#080d1a] p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1 rounded-lg ${viewMode === "list" ? "bg-[#1e293b] text-[#3b82f6]" : "text-[#64748b] hover:text-[#cbd5e1]"}`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded-lg ${viewMode === "grid" ? "bg-[#1e293b] text-[#3b82f6]" : "text-[#64748b] hover:text-[#cbd5e1]"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Strategy Table */}
          <div className="overflow-x-auto lg:flex-1 lg:overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#080d1a] text-[10px] text-[#94a3b8] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Strategy Name</th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Key Logic / Signal Rules</th>
                  <th className="py-2.5 px-3 text-center" colSpan={3}>Performance (1Y)</th>
                  <th className="py-2.5 px-3 text-center">Trades</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
                <tr className="border-b border-[#1e293b] bg-[#080d1a] text-[9px] text-[#64748b] uppercase">
                  <th colSpan={5}></th>
                  <th className="py-1 px-2 text-center">Trend</th>
                  <th className="py-1 px-2 text-right">Return</th>
                  <th className="py-1 px-2 text-right">Sharpe</th>
                  <th colSpan={3}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50 font-mono">
                {paginatedStrategies.map((s, idx) => {
                  const isSelected = s.id === selectedStrategyId;
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  const perf = getMetrics(s.id);
                  const isPositive = (perf?.ret ?? 0) >= 0;
                  const ruleSnippet = formatRuleSet(s.entry_rules, s.indicators);

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStrategyId(s.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#0b1222] border-l-2 border-[#3b82f6]"
                          : "hover:bg-[#0b1222] border-l-2 border-transparent"
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-[10px] text-[#64748b]">{rowNum}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-[#cbd5e1]">{s.name}</div>
                        <div className="text-[10px] text-[#64748b] truncate max-w-[200px]">
                          {s.description || "Systematic rules-based alpha"}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-[#cbd5e1]">{s.asset}</span>
                        <span className="text-[10px] text-[#64748b] ml-1">{s.timeframe}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded-lg bg-[#080d1a] border border-[#1e293b] text-[9px] text-[#94a3b8] uppercase">
                          {(s.strategy_type || "trend").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[#94a3b8] truncate max-w-[240px]">
                        {ruleSnippet}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {perf ? <MiniSparkline data={perf.curve} positive={isPositive} width={48} height={14} /> : <span className="font-mono text-slate-500">—</span>}
                      </td>
                      <td className={`py-2 px-2 text-right font-mono font-bold ${!perf ? "text-slate-500" : isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {fmtPct(perf?.ret)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-200">
                        {perf ? formatRatio(perf.sharpe) : "—"}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-400">
                        {fmtInt(perf?.trades)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[9px] font-bold">
                          READY
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStrategyToTest(s);
                              setTestModalOpen(true);
                            }}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-[#2563eb]/15 hover:bg-[#2563eb]/30 border border-[#2563eb]/40 hover:border-[#3b82f6] text-[#3b82f6] text-[10px] font-bold transition-all cursor-pointer shadow-xs"
                            title={`Test ${s.name} on any stock (India or US)`}
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                            <span>Test Stock</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, s.id)}
                            className="p-1 rounded-lg text-[#64748b] hover:text-[#EF4444]"
                            title="Options"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="border-t border-[#1e293b] bg-[#0b1222] px-4 py-2 flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredStrategies.length)} of {filteredStrategies.length} strategies
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded-lg border border-[#1e293b] bg-[#080d1a] disabled:opacity-30"
              >
                &lsaquo;
              </button>
              <span className="px-2 py-0.5 text-white font-bold bg-[#1e293b] rounded-lg">
                {currentPage}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-0.5 rounded-lg border border-[#1e293b] bg-[#080d1a] disabled:opacity-30"
              >
                &rsaquo;
              </button>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#080d1a] border border-[#1e293b] rounded-lg px-2 py-0.5 text-[10px] text-[#94a3b8] focus:outline-none ml-2"
              >
                <option value={15}>15 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 3: RIGHT STRATEGY INSPECTION DRAWER PANEL            */}
        {/* ============================================================ */}
        {currentStrategy && (() => {
          const perf = getMetrics(currentStrategy.id);
          const stockIsIndia = isIndianTicker(selectedStockForRun);
          const created = currentStrategy.created_at ? new Date(currentStrategy.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
          const tags = [(currentStrategy.strategy_type || "trend").replace(/_/g, "-"), ...Array.from(new Set(currentStrategy.indicators.map((i) => i.name.toLowerCase())))];
          const stat = (label: string, value: string, tone = "text-white") => (
            <div>
              <span className="block text-[10px] text-slate-400">{label}</span>
              <span className={cn("font-mono text-sm font-bold", value === "—" ? "text-slate-500" : tone)}>{value}</span>
            </div>
          );
          return (
            <aside className="flex w-full flex-col gap-3 border-t border-slate-800/90 bg-[#080d1a] p-3 lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
              {/* Header card (DESIGN.md 7.1) */}
              <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4 shadow-lg shadow-black/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-1.5 text-blue-400">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-bold tracking-wide text-white">{currentStrategy.name}</h2>
                      <span title="Strategy model: entry/exit rules, risk limits and costs. Backtest it on any security." className="text-slate-500 hover:text-slate-300">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400">READY</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{currentStrategy.description || "No description."}</p>
              </div>

              {/* Pill tab bar (DESIGN.md 7.3) */}
              <nav className="flex min-w-max items-center gap-1 overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0b1120]/80 p-1 no-scrollbar" aria-label="Strategy detail">
                {(["overview", "rules", "performance", "backtests"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    aria-current={detailTab === tab ? "page" : undefined}
                    className={cn(
                      "flex-1 rounded-lg px-2.5 py-1.5 text-[11px] capitalize transition-colors",
                      detailTab === tab ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/30" : "font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </nav>

              {detailTab === "overview" && (
                <>
                  <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div><span className="block text-[10px] text-slate-400">Asset class</span><span className="font-semibold text-slate-200">{isIndianTicker(currentStrategy.asset) ? "Equity (India)" : "Equity (US)"}</span></div>
                      <div><span className="block text-[10px] text-slate-400">Default asset</span><span className="font-mono font-semibold text-slate-200">{currentStrategy.asset}</span></div>
                      <div><span className="block text-[10px] text-slate-400">Timeframe</span><span className="font-mono font-semibold text-slate-200">{currentStrategy.timeframe}</span></div>
                      <div><span className="block text-[10px] text-slate-400">Created</span><span className="font-mono text-slate-200">{created}</span></div>
                      <div className="col-span-2"><span className="block text-[10px] text-slate-400">Tags</span><span className="font-mono text-blue-400">{tags.map((t) => `#${t}`).join(" ")}</span></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <h3 className="text-sm font-bold tracking-wide text-white">Quick stats</h3>
                      <span title="From your most recent completed backtest of this strategy. Shows — until you run one." className="text-slate-500 hover:text-slate-300"><Info className="h-3.5 w-3.5" /></span>
                    </div>
                    <p className="mb-3 text-[11px] text-slate-400">{perf ? `Latest run on ${perf.ticker}` : "No completed run yet"}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {stat("Return", fmtPct(perf?.ret), (perf?.ret ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}
                      {stat("Sharpe", perf ? formatRatio(perf.sharpe) : "—")}
                      {stat("Max DD", perf && isNum(perf.maxDd) ? fmtPct(-Math.abs(perf.maxDd), 1) : "—", "text-rose-400")}
                      {stat("Trades", fmtInt(perf?.trades), "text-blue-400")}
                      {stat("Win rate", perf ? fmtPct(perf.winRate, 1, false) : "—", "text-slate-200")}
                      {stat("Profit factor", perf ? formatRatio(perf.pf) : "—", "text-slate-200")}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
                    <h3 className="mb-2 text-sm font-bold tracking-wide text-white">Signal logic</h3>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-start gap-2">
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">ENTRY</span>
                        <span className="text-slate-300">{formatRuleSet(currentStrategy.entry_rules, currentStrategy.indicators)}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-rose-400">EXIT</span>
                        <span className="text-slate-300">{currentStrategy.exit_rules.length > 0 ? formatRuleSet(currentStrategy.exit_rules, currentStrategy.indicators) : "Risk stop / take profit bounds"}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {detailTab === "rules" && (
                <div className="space-y-2 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4 text-[11px]">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">Entry conditions</div>
                  {currentStrategy.entry_rules.map((r, i) => (
                    <div key={i} className="text-slate-300">&bull; {formatConditionRule(r, currentStrategy.indicators)}</div>
                  ))}
                  <div className="border-t border-slate-800 pt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">Exit conditions</div>
                  {currentStrategy.exit_rules.length > 0 ? (
                    currentStrategy.exit_rules.map((r, i) => (
                      <div key={i} className="text-slate-300">&bull; {formatConditionRule(r, currentStrategy.indicators)}</div>
                    ))
                  ) : (
                    <div className="text-slate-500">No explicit reversal rules; managed by stops.</div>
                  )}
                </div>
              )}

              {detailTab === "performance" && (
                <div className="space-y-2 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4 text-[11px]">
                  <h3 className="mb-1 text-sm font-bold tracking-wide text-white">Risk &amp; sizing</h3>
                  {[
                    ["Stop loss", currentStrategy.risk.stop_loss_pct ? `-${currentStrategy.risk.stop_loss_pct}%` : "—", "text-rose-400"],
                    ["Take profit", currentStrategy.risk.take_profit_pct ? `+${currentStrategy.risk.take_profit_pct}%` : "—", "text-emerald-400"],
                    ["Position size", `${currentStrategy.risk.position_size_pct}%`, "text-slate-200"],
                    ["Max concurrent", fmtInt(currentStrategy.risk.max_positions), "text-slate-200"],
                  ].map(([k, v, tone]) => (
                    <div key={k} className="flex justify-between border-b border-slate-800/50 pb-1.5 last:border-0">
                      <span className="text-slate-400">{k}</span>
                      <span className={cn("font-mono font-semibold", v === "—" ? "text-slate-500" : tone)}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === "backtests" && (
                <div className="space-y-2 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4 text-[11px]">
                  <h3 className="text-sm font-bold tracking-wide text-white">Historical simulations</h3>
                  {runs.filter((r) => r.strategy_id === currentStrategy.id).length === 0 ? (
                    <p className="text-slate-500">No runs yet. Use Run Backtest below to launch a zero-lookahead simulation.</p>
                  ) : (
                    runs.filter((r) => r.strategy_id === currentStrategy.id).slice(-5).reverse().map((r) => (
                      <Link key={r.id} href={`/backtests/${r.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-800/30">
                        <span className="font-mono text-slate-200">{r.ticker}</span>
                        <span className={cn("font-mono font-bold", (r.metrics?.total_return ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>{fmtPct(r.metrics?.total_return)}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* Run on a stock */}
              <div className="space-y-2 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-wide text-white">Test on a stock</h3>
                  <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold", stockIsIndia ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-blue-500/30 bg-blue-500/10 text-blue-400")}>
                    {stockIsIndia ? "🇮🇳 INDIA · ^NSEI" : "🇺🇸 US · SPY"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={selectedStockForRun}
                    onChange={(e) => setSelectedStockForRun(e.target.value.toUpperCase())}
                    placeholder="GENUSPOWER, RELIANCE, AAPL…"
                    className="flex-1 rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2.5 py-1.5 font-mono text-xs font-bold text-white outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => { setStrategyToTest(currentStrategy); setTestModalOpen(true); }}
                    className="rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800"
                    title="Change market, dates, capital"
                  >
                    Configure
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  {(activeCountry === "India" ? ["GENUSPOWER", "RELIANCE", "TCS", "INFY", "HDFCBANK"] : ["AAPL", "NVDA", "TSLA", "MSFT", "SPY"]).map((stk) => (
                    <button
                      key={stk}
                      type="button"
                      onClick={() => setSelectedStockForRun(stk)}
                      className={cn(
                        "rounded border px-1.5 py-0.5 font-mono transition-colors",
                        selectedStockForRun === stk
                          ? activeCountry === "India" ? "border-emerald-500/40 bg-emerald-500/15 font-bold text-emerald-400" : "border-blue-500/40 bg-blue-500/15 font-bold text-blue-400"
                          : "border-slate-800 bg-[#080d1a] text-slate-400 hover:text-white"
                      )}
                    >
                      {stk}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => { setStrategyToTest(currentStrategy); setTestModalOpen(true); }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Backtest on {selectedStockForRun}
                </button>
                <Link
                  href={`/backtests?strategy=${encodeURIComponent(currentStrategy.id)}&ticker=${encodeURIComponent(selectedStockForRun)}&autolaunch=true`}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Quick run in registry
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/strategies/builder?edit=${currentStrategy.id}`} className="inline-flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800">Edit</Link>
                  <Link href={`/strategies/builder?clone=${currentStrategy.id}`} className="inline-flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800">Duplicate</Link>
                </div>
              </div>
            </aside>
          );
        })()}
      </div>

      {/* Test Strategy on Selected Stock Modal */}
      <TestStrategyModal
        strategy={strategyToTest || currentStrategy}
        isOpen={testModalOpen}
        onClose={() => {
          setTestModalOpen(false);
          setStrategyToTest(null);
        }}
        initialStock={selectedStockForRun}
      />
    </div>
  );
}
