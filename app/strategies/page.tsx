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
  Layers,
  Info,
  Target,
  Rocket,
  FlaskConical,
  Archive,
  ArrowUp,
  ArrowDown,
  X,
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
  type SortKey = "name" | "asset" | "category" | "ret" | "sharpe" | "trades" | "status";
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedMarket, setSelectedMarket] = useState<"ALL" | "India" | "US">("ALL");
  const [selectedIndicator, setSelectedIndicator] = useState<string>("ALL");
  const [assetOpen, setAssetOpen] = useState(false);
  const [dense, setDense] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"strategies" | "performance" | "templates" | "compare">("strategies");
  const [filtersOpen, setFiltersOpen] = useState(false); // phone-only: collapse the filter sidebar
  const [selectedNav, setSelectedNav] = useState<string>("all"); // 'all' | 'templates' | 'my' | 'archived'
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
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

  useEffect(() => {
    try { setDense(localStorage.getItem("qs_strategies_dense") === "1"); } catch { /* storage unavailable */ }
  }, []);
  const toggleDense = () => setDense((d) => { try { localStorage.setItem("qs_strategies_dense", d ? "0" : "1"); } catch { /* ignore */ } return !d; });

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpenId]);

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
    { id: "OTHER", label: "Other", filter: "other" },
  ];

  // A strategy belongs to exactly one category (its strategy_type); anything unlisted is "Other".
  const KNOWN_TYPES = ["trend", "mean_reversion", "momentum", "breakout", "volatility", "systematic", "custom"];
  const categoryOf = (s: StrategyConfig) => {
    const t = (s.strategy_type || "trend").toLowerCase();
    return KNOWN_TYPES.includes(t) ? t.toUpperCase() : "OTHER";
  };
  const isUserStrategy = (s: StrategyConfig) => !s.id.startsWith("tpl_");

  // Distinct Assets for Filter List
  const distinctAssets = useMemo(() => {
    const counts: Record<string, number> = {};
    strategies.filter((s) => !s.archived).forEach((s) => {
      counts[s.asset] = (counts[s.asset] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([asset, count]) => ({ asset, count }))
      .sort((a, b) => b.count - a.count);
  }, [strategies]);

  const distinctIndicators = useMemo(
    () => Array.from(new Set(strategies.flatMap((x) => x.indicators.map((i) => i.name.toUpperCase())))).sort(),
    [strategies]
  );

  // Selected Strategy Object
  const currentStrategy = useMemo(() => {
    return strategies.find((s) => s.id === selectedStrategyId) || strategies[0] || null;
  }, [strategies, selectedStrategyId]);

  // Newest completed run per strategy (runs arrive oldest -> newest).
  const runsByStrategy = useMemo(() => {
    const m = new Map<string, BacktestResult>();
    runs.forEach((r) => m.set(r.strategy_id, r));
    return m;
  }, [runs]);

  // Filtered Strategies
  const filteredStrategies = useMemo(() => {
    return strategies
      .filter((s) => {
        const sType = s.strategy_type || "trend";
        const isUser = isUserStrategy(s);

        // Archived strategies only appear under the Archived view
        if (selectedNav === "archived") { if (!s.archived) return false; }
        else if (s.archived) return false;

        if (activeTab === "templates" && isUser) return false;
        if (activeTab === "performance" && !runsByStrategy.has(s.id)) return false;
        if (selectedMarket !== "ALL" && (isIndianTicker(s.asset) ? "India" : "US") !== selectedMarket) return false;
        if (selectedIndicator !== "ALL" && !s.indicators.some((i) => i.name.toUpperCase() === selectedIndicator)) return false;

        // Left nav filter
        if (selectedNav === "templates" && isUser) return false;
        if (selectedNav === "my" && !isUser) return false;

        // Category filter
        if (selectedCategory !== "ALL" && categoryOf(s) !== selectedCategory) return false;

        // Asset filter
        if (selectedAsset !== "ALL" && s.asset !== selectedAsset) {
          return false;
        }

        // Status filter (derived from real runs)
        if (selectedStatus === "TESTED" && !runsByStrategy.has(s.id)) return false;
        if (selectedStatus === "UNTESTED" && runsByStrategy.has(s.id)) return false;

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
        const pa = runsByStrategy.get(a.id)?.metrics, pb = runsByStrategy.get(b.id)?.metrics;
        const num = (x?: number | null) => (typeof x === "number" ? x : null);
        let cmp = 0;
        if (sortKey === "name") cmp = a.name.localeCompare(b.name);
        else if (sortKey === "asset") cmp = a.asset.localeCompare(b.asset);
        else if (sortKey === "category") cmp = categoryOf(a).localeCompare(categoryOf(b));
        else if (sortKey === "status") cmp = Number(!!pb) - Number(!!pa);
        else {
          const va = num(sortKey === "ret" ? pa?.total_return : sortKey === "sharpe" ? pa?.sharpe_ratio : pa?.num_trades);
          const vb = num(sortKey === "ret" ? pb?.total_return : sortKey === "sharpe" ? pb?.sharpe_ratio : pb?.num_trades);
          // Strategies with no run always sort last, whichever direction.
          if (va === null && vb === null) return a.name.localeCompare(b.name);
          if (va === null) return 1;
          if (vb === null) return -1;
          cmp = va - vb;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [strategies, runsByStrategy, activeTab, selectedMarket, selectedIndicator, selectedNav, selectedCategory, selectedAsset, selectedStatus, searchQuery, sortKey, sortDir]);

  // Paginated strategies
  const paginatedStrategies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStrategies.slice(start, start + pageSize);
  }, [filteredStrategies, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStrategies.length / pageSize) || 1;

  // Counts are over live (non-archived) strategies, one category each, so the tiles add up to Total.
  const live = useMemo(() => strategies.filter((x) => !x.archived), [strategies]);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: live.length, TREND: 0, MEAN_REVERSION: 0, MOMENTUM: 0, BREAKOUT: 0, VOLATILITY: 0, SYSTEMATIC: 0, CUSTOM: 0, OTHER: 0 };
    live.forEach((x) => { counts[categoryOf(x)]++; });
    return counts;
  }, [live]);
  const templateCount = live.filter((x) => !isUserStrategy(x)).length;
  const myCount = live.filter(isUserStrategy).length;
  const archivedCount = strategies.filter((x) => x.archived).length;
  const testedCount = live.filter((x) => runsByStrategy.has(x.id)).length;

  // Performance comes only from real completed runs (newest run per strategy); no run -> null -> "—".
  const getMetrics = (id: string) => {
    const run = runsByStrategy.get(id);
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
      start: run.start_date,
      end: run.end_date,
    };
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "ret" || key === "sharpe" || key === "trades" ? "desc" : "asc"); }
    setCurrentPage(1);
  };
  const sortHead = (key: SortKey, label: string, align = "text-left") => (
    <th className={`py-2.5 px-3 ${align}`} aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 uppercase hover:text-slate-200">
        {label}
        {sortKey === key && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  const toggleCompare = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 4 ? ids : [...ids, id]));

  const openTest = (st: StrategyConfig) => { setStrategyToTest(st); setTestModalOpen(true); };

  const onTableKeyDown = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    const ids = paginatedStrategies.map((x) => x.id);
    const at = ids.indexOf(selectedStrategyId ?? "");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = ids[Math.min(ids.length - 1, Math.max(0, at + (e.key === "ArrowDown" ? 1 : -1)))];
      if (next) {
        setSelectedStrategyId(next);
        document.getElementById(`strategy-row-${next}`)?.scrollIntoView({ block: "nearest" });
      }
    } else if (e.key === "Enter" && at >= 0) {
      e.preventDefault();
      openTest(paginatedStrategies[at]);
    }
  };

  // Active filter chips
  const chips: { label: string; clear: () => void }[] = [];
  if (selectedCategory !== "ALL") chips.push({ label: categoriesList.find((c) => c.id === selectedCategory)?.label ?? selectedCategory, clear: () => setSelectedCategory("ALL") });
  if (selectedAsset !== "ALL") chips.push({ label: `Asset: ${selectedAsset}`, clear: () => setSelectedAsset("ALL") });
  if (selectedMarket !== "ALL") chips.push({ label: `Market: ${selectedMarket}`, clear: () => setSelectedMarket("ALL") });
  if (selectedIndicator !== "ALL") chips.push({ label: `Indicator: ${selectedIndicator}`, clear: () => setSelectedIndicator("ALL") });
  if (selectedStatus !== "ALL") chips.push({ label: selectedStatus === "TESTED" ? "Backtested" : "Not run", clear: () => setSelectedStatus("ALL") });
  if (selectedNav !== "all") chips.push({ label: selectedNav === "my" ? "My strategies" : selectedNav === "archived" ? "Archived" : "Templates", clear: () => setSelectedNav("all") });
  if (searchQuery.trim()) chips.push({ label: `“${searchQuery.trim()}”`, clear: () => setSearchQuery("") });
  const clearAll = () => {
    setSelectedCategory("ALL"); setSelectedAsset("ALL"); setSelectedMarket("ALL"); setSelectedIndicator("ALL");
    setSelectedStatus("ALL"); setSelectedNav("all"); setSearchQuery(""); setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    const target = strategies.find((x) => x.id === id);
    if (!target || !isUserStrategy(target)) return;
    if (confirm(`Delete "${target.name}"? This cannot be undone.`)) {
      try {
        await api.deleteStrategy(id);
        setStrategies((prev) => prev.filter((x) => x.id !== id));
      } catch {
        alert("Failed to delete strategy");
      }
    }
  };

  const patchStrategy = async (target: StrategyConfig, patch: Partial<StrategyConfig>) => {
    const next = { ...target, ...patch, updated_at: new Date().toISOString() };
    setStrategies((prev) => prev.map((x) => (x.id === target.id ? next : x)));
    try {
      await api.updateStrategy(target.id, next);
    } catch {
      setStrategies((prev) => prev.map((x) => (x.id === target.id ? target : x)));
      alert("Could not save the change");
    }
  };

  const handleRename = async (id: string) => {
    setMenuOpenId(null);
    const target = strategies.find((x) => x.id === id);
    if (!target) return;
    const name = (prompt("Rename strategy", target.name) || "").trim();
    if (!name || name === target.name) return;
    const clash = strategies.some((x) => x.id !== id && x.name.trim().toLowerCase() === name.toLowerCase());
    if (clash && !confirm(`Another strategy is already named "${name}". Use the same name anyway?`)) return;
    await patchStrategy(target, { name });
  };

  const handleArchive = async (id: string, archived: boolean) => {
    setMenuOpenId(null);
    const target = strategies.find((x) => x.id === id);
    if (target) await patchStrategy(target, { archived });
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
                { label: "Total", value: live.length, tone: "text-white" },
                { label: "Tested", value: testedCount, tone: "text-market-up" },
                { label: "Trend", value: categoryCounts.TREND, tone: "text-white" },
                { label: "Mean Rev", value: categoryCounts.MEAN_REVERSION, tone: "text-white" },
                { label: "Momentum", value: categoryCounts.MOMENTUM, tone: "text-white" },
                { label: "Breakout", value: categoryCounts.BREAKOUT, tone: "text-white" },
                { label: "Vol", value: categoryCounts.VOLATILITY, tone: "text-white" },
                { label: "Systematic", value: categoryCounts.SYSTEMATIC, tone: "text-white" },
                { label: "Custom", value: categoryCounts.CUSTOM, tone: "text-brand-amber" },
                ...(categoryCounts.OTHER > 0 ? [{ label: "Other", value: categoryCounts.OTHER, tone: "text-white" }] : []),
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
              const count = categoryCounts[cat.id] || 0;
              if (cat.id === "OTHER" && count === 0) return null;
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
              <span className="text-[10px] text-[#64748b]">{templateCount}</span>
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
              <span className="text-[10px] text-[#64748b]">{myCount}</span>
            </button>

            <button
              onClick={() => setSelectedNav("archived")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                selectedNav === "archived" ? "bg-[#0b1222] text-[#3b82f6] font-bold" : "text-[#94a3b8] hover:text-[#cbd5e1]"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Archive className="h-3 w-3 text-[#64748b]" />
                <span className="text-[11px]">Archived</span>
              </div>
              <span className="text-[10px] text-[#64748b]">{archivedCount}</span>
            </button>
          </div>

          {/* Market + indicator filters */}
          <div className="border-t border-[#1e293b] pt-3 space-y-3">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b]">ASSET CLASS</span>
              <div className="flex gap-1 text-[10px]">
                {(["ALL", "India", "US"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setSelectedMarket(m); setCurrentPage(1); }}
                    className={`flex-1 rounded-md border px-2 py-1 ${selectedMarket === m ? "border-[#3b82f6] bg-[#3b82f6]/15 font-bold text-[#3b82f6]" : "border-[#1e293b] text-[#94a3b8] hover:text-[#cbd5e1]"}`}
                  >
                    {m === "ALL" ? "All" : m === "India" ? "🇮🇳 India" : "🇺🇸 US"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="indicator-filter" className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b]">INDICATOR USED</label>
              <select
                id="indicator-filter"
                value={selectedIndicator}
                onChange={(e) => { setSelectedIndicator(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-md border border-[#1e293b] bg-[#080d1a] px-2 py-1 text-[11px] text-[#94a3b8] focus:outline-none"
              >
                <option value="ALL">Any indicator</option>
                {distinctIndicators.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Default-asset filter (collapsed: it is a default, not a strategy attribute) */}
          <div className="border-t border-[#1e293b] pt-3">
            <button
              type="button"
              onClick={() => setAssetOpen((o) => !o)}
              aria-expanded={assetOpen}
              className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#64748b] hover:text-[#94a3b8]"
            >
              <span>Default asset{selectedAsset !== "ALL" ? ` · ${selectedAsset}` : ` (${distinctAssets.length})`}</span>
              <span>{assetOpen ? "−" : "+"}</span>
            </button>
            {assetOpen && (
              <div className="mt-2 space-y-1 text-[11px]">
                {distinctAssets.map(({ asset, count }) => {
                  const isChecked = selectedAsset === asset;
                  return (
                    <label
                      key={asset}
                      onClick={() => { setSelectedAsset(isChecked ? "ALL" : asset); setCurrentPage(1); }}
                      className="flex cursor-pointer items-center justify-between py-0.5 text-[#94a3b8] hover:text-[#cbd5e1]"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`flex h-3 w-3 items-center justify-center rounded-[1px] border ${isChecked ? "border-[#3b82f6] bg-[#3b82f6] text-black" : "border-[#64748b]"}`}>
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <span className="font-mono">{asset}</span>
                      </div>
                      <span className="text-[10px] text-[#64748b]">{count}</span>
                    </label>
                  );
                })}
              </div>
            )}
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
                <span className="text-[10px] text-[#64748b]">{live.length}</span>
              </label>

              <label
                onClick={() => setSelectedStatus("TESTED")}
                className="flex items-center justify-between cursor-pointer py-0.5 text-[#94a3b8] hover:text-[#cbd5e1]"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-[1px] border flex items-center justify-center ${selectedStatus === "TESTED" ? "border-[#3b82f6] bg-[#3b82f6] text-black" : "border-[#64748b]"}`}>
                    {selectedStatus === "TESTED" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <span>Backtested</span>
                </div>
                <span className="text-[10px] text-[#64748b]">{testedCount}</span>
              </label>

              <label
                onClick={() => setSelectedStatus("UNTESTED")}
                className="flex items-center justify-between cursor-pointer py-0.5 text-[#94a3b8] hover:text-[#cbd5e1]"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-[1px] border flex items-center justify-center ${selectedStatus === "UNTESTED" ? "border-[#3b82f6] bg-[#3b82f6] text-black" : "border-[#64748b]"}`}>
                    {selectedStatus === "UNTESTED" && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <span>Not run</span>
                </div>
                <span className="text-[10px] text-[#64748b]">{live.length - testedCount}</span>
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
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); if (tab === "performance") { setSortKey("ret"); setSortDir("desc"); } }}
                  className={`px-3 py-1 rounded-lg font-bold uppercase text-[10px] transition-colors ${
                    activeTab === tab
                      ? "bg-[#1e293b] text-[#3b82f6]"
                      : "text-[#94a3b8] hover:text-[#cbd5e1]"
                  }`}
                >
                  {tab}{tab === "compare" && compareIds.length > 0 ? ` (${compareIds.length})` : ""}
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
                aria-label="Sort"
                value={`${sortKey}_${sortDir}`}
                onChange={(e) => { const [k, d] = e.target.value.split("_"); setSortKey(k as SortKey); setSortDir(d as "asc" | "desc"); }}
                className="bg-[#080d1a] border border-[#1e293b] rounded-lg px-2 py-1 text-[11px] text-[#94a3b8] focus:outline-none"
              >
                <option value="name_asc">Sort: Name (A &rarr; Z)</option>
                <option value="name_desc">Sort: Name (Z &rarr; A)</option>
                <option value="asset_asc">Sort: Asset</option>
                <option value="category_asc">Sort: Category</option>
                <option value="ret_desc">Sort: Return (high &rarr; low)</option>
                <option value="sharpe_desc">Sort: Sharpe (high &rarr; low)</option>
                <option value="trades_desc">Sort: Trades (most)</option>
              </select>

              {compareIds.length >= 2 && activeTab !== "compare" && (
                <button type="button" onClick={() => setActiveTab("compare")} className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500">
                  Compare ({compareIds.length})
                </button>
              )}
              <button
                type="button"
                onClick={toggleDense}
                aria-pressed={dense}
                title="Toggle compact rows"
                className={`rounded-lg border px-2 py-1 text-[11px] ${dense ? "border-[#3b82f6] text-[#3b82f6]" : "border-[#1e293b] text-[#94a3b8] hover:text-[#cbd5e1]"}`}
              >
                Compact
              </button>

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

          {/* Active filter chips */}
          {chips.length > 0 && activeTab !== "compare" && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-[#1e293b] bg-[#080d1a] px-4 py-2 text-[10px]">
              {chips.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-blue-300">
                  {c.label}
                  <button type="button" onClick={() => { c.clear(); setCurrentPage(1); }} aria-label={`Remove filter ${c.label}`} className="hover:text-white"><X className="h-3 w-3" /></button>
                </span>
              ))}
              <button type="button" onClick={clearAll} className="px-1 text-slate-400 underline hover:text-white">Clear all</button>
            </div>
          )}

          {activeTab === "compare" ? (() => {
            const picked = compareIds.map((id) => strategies.find((x) => x.id === id)).filter((x): x is StrategyConfig => !!x);
            if (picked.length < 2) {
              return (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-slate-400">
                  <p className="text-sm text-slate-200">Pick 2–4 strategies to compare</p>
                  <p className="text-[11px]">Tick the boxes in the Strategies tab ({picked.length} selected), then return here.</p>
                  <button type="button" onClick={() => setActiveTab("strategies")} className="mt-2 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800">Back to strategies</button>
                </div>
              );
            }
            const rows: [string, (x: StrategyConfig, p: ReturnType<typeof getMetrics>) => React.ReactNode][] = [
              ["Category", (x) => categoryOf(x).replace(/_/g, " ")],
              ["Default asset", (x) => `${x.asset} · ${x.timeframe}`],
              ["Latest run", (_x, p) => (p ? `${p.ticker} · ${p.start} → ${p.end}` : "—")],
              ["Equity", (_x, p) => (p ? <MiniSparkline data={p.curve} positive={(p.ret ?? 0) >= 0} width={120} height={28} /> : "—")],
              ["Return", (_x, p) => fmtPct(p?.ret)],
              ["Sharpe", (_x, p) => (p ? formatRatio(p.sharpe) : "—")],
              ["Max drawdown", (_x, p) => (p && isNum(p.maxDd) ? fmtPct(-Math.abs(p.maxDd), 1) : "—")],
              ["Win rate", (_x, p) => (p ? fmtPct(p.winRate, 1, false) : "—")],
              ["Profit factor", (_x, p) => (p ? formatRatio(p.pf) : "—")],
              ["Trades", (_x, p) => fmtInt(p?.trades)],
              ["Stop / take profit", (x) => `${x.risk.stop_loss_pct ? `-${x.risk.stop_loss_pct}%` : "—"} / ${x.risk.take_profit_pct ? `+${x.risk.take_profit_pct}%` : "—"}`],
              ["Entry", (x) => <span className="text-[10px] text-slate-400">{formatRuleSet(x.entry_rules, x.indicators)}</span>],
            ];
            return (
              <div className="overflow-auto p-4 lg:flex-1">
                <table className="w-full min-w-[560px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e293b] text-[10px] uppercase text-[#94a3b8]">
                      <th className="px-3 py-2"></th>
                      {picked.map((x) => (
                        <th key={x.id} className="px-3 py-2 align-top normal-case">
                          <div className="font-bold text-slate-200">{x.name}</div>
                          <button type="button" onClick={() => toggleCompare(x.id)} className="text-[10px] font-normal text-slate-500 underline hover:text-white">Remove</button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 font-mono">
                    {rows.map(([label, fn]) => (
                      <tr key={label}>
                        <td className="px-3 py-2 text-[10px] uppercase text-slate-500">{label}</td>
                        {picked.map((x) => <td key={x.id} className="px-3 py-2 text-slate-200">{fn(x, getMetrics(x.id))}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })() : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 lg:flex-1 lg:overflow-auto" onKeyDown={onTableKeyDown} tabIndex={0}>
              {paginatedStrategies.map((s) => {
                const perf = getMetrics(s.id);
                const isPositive = (perf?.ret ?? 0) >= 0;
                const ruleText = formatRuleSet(s.entry_rules, s.indicators);
                return (
                  <div
                    key={s.id}
                    id={`strategy-row-${s.id}`}
                    onClick={() => setSelectedStrategyId(s.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors ${s.id === selectedStrategyId ? "border-[#3b82f6] bg-[#0b1222]" : "border-[#1e293b] bg-[#0b1222]/60 hover:bg-[#0b1222]"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-200">{s.name}</div>
                        <div className="font-mono text-[10px] text-slate-500">{s.asset} · {s.timeframe} · {categoryOf(s).replace(/_/g, " ")}</div>
                      </div>
                      <input type="checkbox" aria-label={`Compare ${s.name}`} checked={compareIds.includes(s.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleCompare(s.id)} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] text-slate-400" title={s.description}>{s.description || "No description."}</p>
                    <p className="mt-2 truncate font-mono text-[10px] text-slate-500" title={ruleText}>{ruleText}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-[#1e293b] pt-2 font-mono text-[11px]">
                      {perf ? (
                        <>
                          <MiniSparkline data={perf.curve} positive={isPositive} width={56} height={16} />
                          <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>{fmtPct(perf.ret)}</span>
                          <span className="text-slate-300">SR {formatRatio(perf.sharpe)}</span>
                          <span className="text-slate-400">{fmtInt(perf.trades)} tr</span>
                        </>
                      ) : (
                        <button type="button" onClick={(e) => { e.stopPropagation(); openTest(s); }} className="text-[11px] text-blue-400 hover:underline">Not backtested yet · Run</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {paginatedStrategies.length === 0 && <p className="col-span-full py-10 text-center text-slate-500">No strategies match these filters.</p>}
            </div>
          ) : (
          <div className="overflow-x-auto outline-none lg:flex-1 lg:overflow-auto" tabIndex={0} onKeyDown={onTableKeyDown} aria-label="Strategies. Use arrow keys to move, Enter to test.">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#080d1a] text-[10px] text-[#94a3b8] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 pl-3 pr-1 w-6"><span className="sr-only">Compare</span></th>
                  <th className="py-2.5 px-2 w-8 text-center">#</th>
                  {sortHead("name", "Strategy Name")}
                  {sortHead("asset", "Default asset")}
                  {sortHead("category", "Category")}
                  <th className="py-2.5 px-3 min-w-[220px]">Key Logic / Signal Rules</th>
                  <th className="py-2.5 px-3 text-center" colSpan={3}>Latest run</th>
                  {sortHead("trades", "Trades", "text-right")}
                  {sortHead("status", "Status", "text-center")}
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
                <tr className="border-b border-[#1e293b] bg-[#080d1a] text-[9px] text-[#64748b] uppercase">
                  <th colSpan={6}></th>
                  <th className="py-1 px-2 text-center">Trend</th>
                  <th className="py-1 px-2 text-right"><button type="button" onClick={() => toggleSort("ret")} className="uppercase hover:text-slate-200">Return{sortKey === "ret" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</button></th>
                  <th className="py-1 px-2 text-right"><button type="button" onClick={() => toggleSort("sharpe")} className="uppercase hover:text-slate-200">Sharpe{sortKey === "sharpe" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</button></th>
                  <th colSpan={4}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50 font-mono">
                {paginatedStrategies.map((s, idx) => {
                  const isSelected = s.id === selectedStrategyId;
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  const perf = getMetrics(s.id);
                  const isPositive = (perf?.ret ?? 0) >= 0;
                  const ruleSnippet = formatRuleSet(s.entry_rules, s.indicators);
                  const py = dense ? "py-1" : "py-2";

                  return (
                    <tr
                      key={s.id}
                      id={`strategy-row-${s.id}`}
                      onClick={() => setSelectedStrategyId(s.id)}
                      aria-selected={isSelected}
                      className={`group cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#12203a] border-l-2 border-[#3b82f6]"
                          : "hover:bg-[#0b1222] border-l-2 border-transparent"
                      }`}
                    >
                      <td className={`${py} pl-3 pr-1`}>
                        <input type="checkbox" aria-label={`Compare ${s.name}`} checked={compareIds.includes(s.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleCompare(s.id)} />
                      </td>
                      <td className={`${py} px-2 text-center text-[10px] text-[#64748b]`}>{rowNum}</td>
                      <td className={`${py} min-w-[220px] px-3`}>
                        <div className="font-bold text-[#cbd5e1]">{s.name}</div>
                        {!dense && (
                          <div className="text-[10px] text-[#64748b] truncate max-w-[200px]" title={s.description}>
                            {s.description || "Systematic rules-based alpha"}
                          </div>
                        )}
                      </td>
                      <td className={`${py} px-3`}>
                        <span className="font-bold text-[#cbd5e1]">{s.asset}</span>
                        <span className="text-[10px] text-[#64748b] ml-1">{s.timeframe}</span>
                      </td>
                      <td className={`${py} px-3`}>
                        <span className="px-1.5 py-0.5 rounded-lg bg-[#080d1a] border border-[#1e293b] text-[9px] text-[#94a3b8] uppercase">
                          {(s.strategy_type || "trend").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className={`${py} px-3 text-[11px] text-[#94a3b8] truncate max-w-[240px]`} title={ruleSnippet}>
                        {ruleSnippet}
                      </td>
                      {perf ? (
                        <>
                          <td className={`${py} px-2 text-center`}>
                            <div title={`Run on ${perf.ticker}, ${perf.start} → ${perf.end}`}>
                              <MiniSparkline data={perf.curve} positive={isPositive} width={48} height={14} />
                              {!dense && <div className="mt-0.5 font-mono text-[9px] text-slate-500">{perf.ticker}</div>}
                            </div>
                          </td>
                          <td className={`${py} px-2 text-right font-mono font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>{fmtPct(perf.ret)}</td>
                          <td className={`${py} px-2 text-right font-mono text-slate-200`}>{formatRatio(perf.sharpe)}</td>
                          <td className={`${py} px-3 text-right font-mono text-slate-400`}>{fmtInt(perf.trades)}</td>
                        </>
                      ) : (
                        <td colSpan={4} className={`${py} px-3 text-right`}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openTest(s); }}
                            className="text-[11px] text-slate-500 hover:text-blue-400"
                          >
                            Not backtested yet · <span className="text-blue-400 underline">Run</span>
                          </button>
                        </td>
                      )}
                      <td className={`${py} px-3 text-center`}>
                        {perf ? (
                          <span className="px-1.5 py-0.5 rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[9px] font-bold">BACKTESTED</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/30 text-[9px] font-bold">NOT RUN</span>
                        )}
                      </td>
                      <td className={`${py} px-3 text-[10px] text-slate-400`}>{isUserStrategy(s) ? "Mine" : "Built-in"}</td>
                      <td className={`${py} px-3 text-right`}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openTest(s); }}
                            className={`rounded-lg border border-[#2563eb]/40 bg-[#2563eb]/15 p-1 text-[#3b82f6] transition-opacity hover:bg-[#2563eb]/30 focus:opacity-100 group-hover:opacity-100 ${isSelected ? "opacity-100" : "opacity-0"}`}
                            title={`Test ${s.name} on any stock (India or US)`}
                            aria-label={`Test ${s.name} on a stock`}
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
                              className="p-1 rounded-lg text-[#64748b] hover:text-slate-200"
                              title="Options"
                              aria-haspopup="menu"
                              aria-expanded={menuOpenId === s.id}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </button>
                            {menuOpenId === s.id && (
                              <div role="menu" onClick={(e) => e.stopPropagation()} className="absolute right-0 top-6 z-30 w-40 rounded-lg border border-slate-700 bg-[#0b1222] py-1 text-left text-[11px] shadow-xl">
                                <button role="menuitem" onClick={() => { setMenuOpenId(null); openTest(s); }} className="block w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800">Test on stock…</button>
                                <Link href={`/strategies/builder?edit=${s.id}`} className="block px-3 py-1.5 text-slate-200 hover:bg-slate-800">Edit in Lab</Link>
                                <Link href={`/strategies/builder?clone=${s.id}`} className="block px-3 py-1.5 text-slate-200 hover:bg-slate-800">Duplicate</Link>
                                {isUserStrategy(s) && <button role="menuitem" onClick={() => handleRename(s.id)} className="block w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800">Rename</button>}
                                <button role="menuitem" onClick={() => handleArchive(s.id, !s.archived)} className="block w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800">{s.archived ? "Restore" : "Archive"}</button>
                                {isUserStrategy(s) && <button role="menuitem" onClick={() => handleDelete(s.id)} className="block w-full border-t border-slate-800 px-3 py-1.5 text-left text-rose-400 hover:bg-slate-800">Delete</button>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedStrategies.length === 0 && (
                  <tr><td colSpan={13} className="py-12 text-center text-slate-500">No strategies match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}

          {/* Table Pagination Footer */}
          {activeTab !== "compare" && <div className="border-t border-[#1e293b] bg-[#0b1222] px-4 py-2 flex items-center justify-between text-[11px] text-[#94a3b8]">
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
          </div>}
        </div>

        {/* ============================================================ */}
        {/* COLUMN 3: RIGHT STRATEGY INSPECTION DRAWER PANEL            */}
        {/* ============================================================ */}
        {currentStrategy && (() => {
          const perf = getMetrics(currentStrategy.id);
          const stockIsIndia = isIndianTicker(selectedStockForRun);
          const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
          const mine = isUserStrategy(currentStrategy);
          const recentRuns = runs.filter((r) => r.strategy_id === currentStrategy.id).slice(-5).reverse();
          const tags = Array.from(new Set([(currentStrategy.strategy_type || "trend").replace(/_/g, "-"), ...(currentStrategy.tags ?? []).map((t) => t.toLowerCase()), ...currentStrategy.indicators.map((i) => i.name.toLowerCase())]));
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
                  <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold", perf ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "border-slate-500/40 bg-slate-500/10 text-slate-400")}>{perf ? "BACKTESTED" : "NOT RUN"}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{currentStrategy.description || "No description."}</p>
              </div>

              {/* Primary actions */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openTest(currentStrategy)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">
                  <Play className="h-3.5 w-3.5 fill-current" /> Run backtest
                </button>
                <Link href={`/strategies/builder?edit=${currentStrategy.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">
                  <FlaskConical className="h-3.5 w-3.5" /> Edit in Lab
                </Link>
                <Link href={`/strategies/builder?clone=${currentStrategy.id}`} className="inline-flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800">Duplicate</Link>
                {mine ? (
                  <button type="button" onClick={() => handleDelete(currentStrategy.id)} className="inline-flex items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 text-[11px] font-medium text-rose-400 hover:bg-rose-500/10">Delete</button>
                ) : (
                  <button type="button" onClick={() => handleArchive(currentStrategy.id, !currentStrategy.archived)} className="inline-flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-slate-800">{currentStrategy.archived ? "Restore" : "Archive"}</button>
                )}
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
                      <div><span className="block text-[10px] text-slate-400">Asset class</span><span className="font-semibold text-slate-200">{isIndianTicker(currentStrategy.asset) ? "Equity (India)" : "Equity (US)"} <span className="font-normal text-slate-500">· default</span></span></div>
                      <div><span className="block text-[10px] text-slate-400">Default asset</span><span className="font-mono font-semibold text-slate-200">{currentStrategy.asset}</span></div>
                      <div><span className="block text-[10px] text-slate-400">Timeframe</span><span className="font-mono font-semibold text-slate-200">{currentStrategy.timeframe}</span></div>
                      <div><span className="block text-[10px] text-slate-400">Source</span><span className="font-semibold text-slate-200">{mine ? "Mine" : "Built-in template"}</span></div>
                      {mine && <div><span className="block text-[10px] text-slate-400">Created</span><span className="font-mono text-slate-200">{fmtDate(currentStrategy.created_at)}</span></div>}
                      {mine && <div><span className="block text-[10px] text-slate-400">Updated</span><span className="font-mono text-slate-200">{fmtDate(currentStrategy.updated_at)}</span></div>}
                      <div className="col-span-2"><span className="block text-[10px] text-slate-400">Tags</span><span className="font-mono text-blue-400">{tags.map((t) => `#${t}`).join(" ")}</span></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <h3 className="text-sm font-bold tracking-wide text-white">Quick stats</h3>
                      <span title="From your most recent completed backtest of this strategy. Shows — until you run one." className="text-slate-500 hover:text-slate-300"><Info className="h-3.5 w-3.5" /></span>
                    </div>
                    <p className="mb-3 text-[11px] text-slate-400">{perf ? `Latest run on ${perf.ticker} · ${perf.start} → ${perf.end}` : "No completed run yet"}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {stat("Return", fmtPct(perf?.ret), (perf?.ret ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}
                      {stat("Sharpe", perf ? formatRatio(perf.sharpe) : "—")}
                      {stat("Max DD", perf && isNum(perf.maxDd) ? fmtPct(-Math.abs(perf.maxDd), 1) : "—", "text-rose-400")}
                      {stat("Trades", fmtInt(perf?.trades), "text-blue-400")}
                      {stat("Win rate", perf ? fmtPct(perf.winRate, 1, false) : "—", "text-slate-200")}
                      {stat("Profit factor", perf ? formatRatio(perf.pf) : "—", "text-slate-200")}
                    </div>
                  </div>

                  {perf && (
                    <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
                      <h3 className="mb-2 text-sm font-bold tracking-wide text-white">Equity curve</h3>
                      <MiniSparkline data={perf.curve} positive={(perf.ret ?? 0) >= 0} width={256} height={64} />
                      <p className="mt-1 font-mono text-[10px] text-slate-500">{perf.ticker} · {perf.start} → {perf.end}</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
                    <h3 className="mb-2 text-sm font-bold tracking-wide text-white">Recent runs</h3>
                    {recentRuns.length === 0 ? (
                      <p className="text-[11px] text-slate-500">No runs yet.</p>
                    ) : recentRuns.slice(0, 3).map((r) => (
                      <Link key={r.id} href={`/backtests/${r.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 font-mono text-[11px] hover:bg-slate-800/30">
                        <span className="text-slate-200">{r.ticker}</span>
                        <span className="text-slate-500">{(r.created_at || r.end_date || "").slice(0, 10)}</span>
                        <span className={(r.metrics?.total_return ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>{fmtPct(r.metrics?.total_return)}</span>
                      </Link>
                    ))}
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
                  <div className="border-t border-slate-800 pt-2 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">Parameters</div>
                  {currentStrategy.indicators.length === 0 ? (
                    <div className="text-slate-500">No indicators.</div>
                  ) : (
                    <table className="w-full text-left font-mono text-[11px]">
                      <tbody>
                        {currentStrategy.indicators.map((ind) => (
                          <tr key={ind.id} className="border-b border-slate-800/50 last:border-0">
                            <td className="py-1 pr-2 text-slate-300">{ind.id}</td>
                            <td className="py-1 text-right text-slate-400">{Object.entries(ind.params ?? {}).map(([k, v]) => `${k}=${v}`).join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {detailTab === "performance" && (
                <div className="space-y-2 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4 text-[11px]">
                  <h3 className="mb-1 text-sm font-bold tracking-wide text-white">Risk &amp; sizing</h3>
                  {[
                    ["Stop loss", currentStrategy.risk.stop_loss_pct ? `-${currentStrategy.risk.stop_loss_pct}%` : "—", "text-rose-400"],
                    ["Take profit", currentStrategy.risk.take_profit_pct ? `+${currentStrategy.risk.take_profit_pct}%` : "—", "text-emerald-400"],
                    ["Direction", ({ long: "Long only", short: "Short only", both: "Long & short" } as const)[currentStrategy.risk.direction ?? (currentStrategy.risk.allow_short ? "both" : "long")], "text-slate-200"],
                    ["ATR stop / target", currentStrategy.risk.stop_atr_mult || currentStrategy.risk.take_profit_atr_mult ? `${currentStrategy.risk.stop_atr_mult ?? "—"}× / ${currentStrategy.risk.take_profit_atr_mult ?? "—"}×` : "—", "text-slate-200"],
                    ["Trailing stop", currentStrategy.risk.trailing_stop_pct ? `${currentStrategy.risk.trailing_stop_pct}%` : "—", "text-slate-200"],
                    ["Vol target", currentStrategy.risk.target_volatility ? `${currentStrategy.risk.target_volatility}% / yr` : "—", "text-slate-200"],
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
                        <span className="font-mono text-[10px] text-slate-500">{(r.created_at || r.end_date || "").slice(0, 10)}</span>
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
