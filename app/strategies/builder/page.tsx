"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  Plus,
  Trash2,
  Play,
  Save,
  Sliders,
  ShieldCheck,
  Zap,
  HelpCircle,
  ArrowLeft,
  Check,
  AlertTriangle,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  Copy,
  Clock,
  ArrowUpRight,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  StrategyConfig,
  IndicatorConfig,
  ConditionRule,
  RuleOperator,
} from "@/types";
import { AVAILABLE_INDICATORS, DEFAULT_STRATEGY, POPULAR_UNIVERSES } from "@/lib/constants";
import { SEED_STRATEGIES } from "@/lib/seedData";
import { loadSystemSettings } from "@/lib/settings";
import StockSearchInput from "@/components/ui/StockSearchInput";
import { formatConditionRule, formatRuleSet } from "@/lib/formatRule";
import EasyStockPicker from "@/components/strategies/EasyStockPicker";
import TestStrategyModal from "@/components/strategies/TestStrategyModal";

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query params
  const cloneId = searchParams.get("clone");
  const assetParam = searchParams.get("asset");
  const benchmarkParam = searchParams.get("benchmark");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const timeframeParam = searchParams.get("timeframe");
  const indicatorsParam = searchParams.get("indicators");

  const [strategy, setStrategy] = useState<StrategyConfig>(() => {
    if (typeof window !== "undefined") {
      const cfg = loadSystemSettings();
      return {
        ...DEFAULT_STRATEGY,
        execution: {
          ...DEFAULT_STRATEGY.execution,
          initial_capital: cfg.backtest.initialCapital || DEFAULT_STRATEGY.execution.initial_capital,
          commission_pct: cfg.backtest.commission || DEFAULT_STRATEGY.execution.commission_pct,
          slippage_pct: cfg.backtest.slippage || DEFAULT_STRATEGY.execution.slippage_pct,
        },
      };
    }
    return DEFAULT_STRATEGY;
  });
  const [activeSection, setActiveSection] = useState<string>("identity");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showChooserModal, setShowChooserModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [allTemplates, setAllTemplates] = useState<StrategyConfig[]>(() => SEED_STRATEGIES);

  // Simulation context params
  const [backtestStart, setBacktestStart] = useState<string>(startDateParam || "2023-01-01");
  const [backtestEnd, setBacktestEnd] = useState<string>(endDateParam || "2024-01-01");
  const [backtestBenchmark, setBacktestBenchmark] = useState<string>(() => {
    if (benchmarkParam) return benchmarkParam;
    if (typeof window !== "undefined") {
      const cfg = loadSystemSettings();
      return cfg.research.defaultBenchmark || "SPY";
    }
    return "SPY";
  });

  // Load strategy or initialize from params
  useEffect(() => {
    // Load prebuilt templates for chooser modal
    api.getStrategies().then((strats) => {
      if (strats && strats.length > 0) {
        setAllTemplates(strats);
      }
    }).catch(console.error);

    if (cloneId) {
      // First check local seed templates
      const seedMatch = SEED_STRATEGIES.find((s) => s.id === cloneId);
      if (seedMatch) {
        setStrategy({
          ...seedMatch,
          id: `strat_${Date.now()}`,
          name: `${seedMatch.name} (Copy)`,
          created_at: new Date().toISOString(),
        });
      } else {
        api
          .getStrategy(cloneId)
          .then((s) => {
            setStrategy({
              ...s,
              id: `strat_${Date.now()}`,
              name: `${s.name} (Copy)`,
              created_at: new Date().toISOString(),
            });
          })
          .catch((err) => {
            console.error("Strategy clone error:", err);
          });
      }
    } else if (assetParam || indicatorsParam) {
      // Research Tab handoff
      const asset = (assetParam || "AAPL").toUpperCase();
      const timeframe = timeframeParam || "1D";

      // Reconstruct indicators if provided
      let customIndicators: IndicatorConfig[] = [];
      if (indicatorsParam) {
        const indNames = indicatorsParam.split(",");
        customIndicators = indNames
          .map((name) => {
            const trimmed = name.trim();
            const matched = AVAILABLE_INDICATORS.find(
              (i) => i.id.toLowerCase() === trimmed.toLowerCase()
            );
            if (matched) {
              return {
                id: trimmed.toLowerCase(),
                name: matched.id,
                params: { ...matched.defaultParams },
              };
            }
            return null;
          })
          .filter(Boolean) as IndicatorConfig[];
      }

      setStrategy((prev) => ({
        ...prev,
        id: `strat_${Date.now()}`,
        name: `${asset} Research Model`,
        asset,
        timeframe,
        indicators: customIndicators.length > 0 ? customIndicators : prev.indicators,
      }));
    }
  }, [cloneId, assetParam, indicatorsParam, timeframeParam]);

  // Keyboard shortcuts (Ctrl+S / Cmd+S to Save, Ctrl+Enter to Backtest)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveStrategy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSaveAndBacktest();
      } else if (e.key === "Escape") {
        if (showChooserModal) {
          setShowChooserModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [strategy, showChooserModal]);

  // Indicator Handlers
  const handleAddIndicator = (indId: string) => {
    const template = AVAILABLE_INDICATORS.find((i) => i.id === indId);
    if (!template) return;
    const count = strategy.indicators.filter((i) => i.name === template.id).length;
    const instanceId = `${template.id.toLowerCase()}_${count + 1}`;

    const newInd: IndicatorConfig = {
      id: instanceId,
      name: template.id,
      params: { ...template.defaultParams },
    };

    setStrategy((prev) => ({
      ...prev,
      indicators: [...prev.indicators, newInd],
    }));
  };

  const handleRemoveIndicator = (id: string) => {
    setStrategy((prev) => ({
      ...prev,
      indicators: prev.indicators.filter((i) => i.id !== id),
    }));
  };

  const handleUpdateIndicatorParam = (
    indId: string,
    paramKey: string,
    val: any
  ) => {
    setStrategy((prev) => ({
      ...prev,
      indicators: prev.indicators.map((ind) => {
        if (ind.id === indId) {
          return {
            ...ind,
            params: { ...ind.params, [paramKey]: Number(val) },
          };
        }
        return ind;
      }),
    }));
  };

  // Rule Handlers
  const handleAddRule = (type: "entry" | "exit") => {
    const newRule: ConditionRule = {
      id: `r_${Date.now().toString().slice(-4)}`,
      indicator_a: "close",
      left_indicator: "close",
      operator: ">",
      indicator_b: strategy.indicators[0]?.id || "close",
      right_indicator: strategy.indicators[0]?.id || "close",
      threshold: null,
      logical_operator: "AND",
    };

    if (type === "entry") {
      setStrategy((prev) => ({
        ...prev,
        entry_rules: [...prev.entry_rules, newRule],
      }));
    } else {
      setStrategy((prev) => ({
        ...prev,
        exit_rules: [...prev.exit_rules, newRule],
      }));
    }
  };

  const handleRemoveRule = (type: "entry" | "exit", ruleId: string) => {
    if (type === "entry") {
      setStrategy((prev) => ({
        ...prev,
        entry_rules: prev.entry_rules.filter((r) => r.id !== ruleId),
      }));
    } else {
      setStrategy((prev) => ({
        ...prev,
        exit_rules: prev.exit_rules.filter((r) => r.id !== ruleId),
      }));
    }
  };

  const handleUpdateRule = (
    type: "entry" | "exit",
    ruleId: string,
    field: keyof ConditionRule,
    val: any
  ) => {
    const updater = (r: ConditionRule) => {
      if (r.id === ruleId) {
        const updated = { ...r, [field]: val };
        // Sync backward-compatible fields
        if (field === "indicator_a") updated.left_indicator = val;
        if (field === "indicator_b") updated.right_indicator = val;
        return updated;
      }
      return r;
    };

    if (type === "entry") {
      setStrategy((prev) => ({
        ...prev,
        entry_rules: prev.entry_rules.map(updater),
      }));
    } else {
      setStrategy((prev) => ({
        ...prev,
        exit_rules: prev.exit_rules.map(updater),
      }));
    }
  };

  // Real-Time Model Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!strategy.name.trim()) {
      errors.push("Strategy model name is required.");
    }

    if (!strategy.asset.trim()) {
      errors.push("Target security asset is required.");
    }

    if (strategy.entry_rules.length === 0) {
      errors.push("At least one entry condition rule is required.");
    }

    // Check indicator reference validity in entry rules
    strategy.entry_rules.forEach((r, idx) => {
      const left = r.indicator_a || r.left_indicator;
      if (!left) {
        errors.push(`Entry Rule #${idx + 1}: Left operand is missing.`);
      }
      if (
        !r.indicator_b &&
        !r.right_indicator &&
        (r.threshold === null || r.threshold === undefined || isNaN(Number(r.threshold)))
      ) {
        errors.push(`Entry Rule #${idx + 1}: Right target or threshold number is required.`);
      }
    });

    // Check risk limits
    if (!strategy.risk.stop_loss_pct || strategy.risk.stop_loss_pct <= 0) {
      errors.push("Stop Loss limit must be greater than 0%.");
    }

    if (
      strategy.risk.take_profit_pct &&
      strategy.risk.stop_loss_pct &&
      strategy.risk.take_profit_pct <= strategy.risk.stop_loss_pct
    ) {
      warnings.push("Take Profit is less than or equal to Stop Loss (Reward/Risk ratio < 1.0).");
    }

    if (strategy.indicators.length === 0) {
      warnings.push("No indicators defined; rules rely strictly on raw price series.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [strategy]);

  // Save Strategy to backend
  const handleSaveStrategy = async () => {
    setSaving(true);
    try {
      await api.saveStrategy(strategy);
      setSaveStatus("SAVED");
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save strategy model");
    } finally {
      setSaving(false);
    }
  };

  // Save & Launch Backtest
  const handleSaveAndBacktest = async () => {
    if (!validation.isValid) return;
    setSaving(true);
    try {
      const saved = await api.saveStrategy(strategy);
      router.push(`/backtests?run=${saved.id}&ticker=${encodeURIComponent(strategy.asset)}`);
    } catch (err) {
      console.error("Save & Run failed:", err);
      alert("Failed to save strategy model");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: "identity", label: "IDENTITY & THESIS", count: null },
    { id: "universe", label: "UNIVERSE & ASSET", count: strategy.asset },
    { id: "indicators", label: "INDICATORS", count: strategy.indicators.length },
    { id: "entry", label: "ENTRY CONDITIONS", count: strategy.entry_rules.length },
    { id: "exit", label: "EXIT CONDITIONS", count: strategy.exit_rules.length },
    { id: "risk", label: "RISK MANAGEMENT", count: `SL ${strategy.risk.stop_loss_pct}%` },
    { id: "execution", label: "EXECUTION FRICTION", count: "NEXT OPEN" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#D8DCE2] flex flex-col font-mono selection:bg-[#38BDF8] selection:text-black">
      {/* 1. TOP TERMINAL WORKSTATION HEADER */}
      <div className="border-b border-[#252A31] bg-[#05070A] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <Link
            href="/strategies"
            className="text-[#59616B] hover:text-[#D8DCE2] flex items-center space-x-1"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>REGISTRY</span>
          </Link>
          <span className="text-[#59616B]">│</span>
          <span className="text-[#FF9900] font-bold tracking-wider">
            STRATEGY BUILDER
          </span>
          <span className="text-[#59616B]">│</span>
          <span className="text-[#D8DCE2] font-semibold">{strategy.name}</span>
          {saveStatus && (
            <span className="px-1.5 py-0.2 rounded-[2px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-[10px] font-bold">
              ✓ {saveStatus}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 font-sans">
          <button
            type="button"
            onClick={() => setShowChooserModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-[2px] border border-[#252A31] bg-[#101318] text-[#D8DCE2] hover:bg-[#141820] transition-colors text-xs"
          >
            <Layers className="h-3 w-3 text-[#38BDF8]" />
            <span>PRESETS</span>
          </button>

          <button
            type="button"
            onClick={handleSaveStrategy}
            disabled={saving}
            className="flex items-center space-x-1 px-3 py-1 rounded-[2px] border border-[#252A31] bg-[#101318] hover:bg-[#141820] hover:border-[#38BDF8]/40 text-[#D8DCE2] transition-colors text-xs"
          >
            <Save className="h-3 w-3 text-[#38BDF8]" />
            <span>{saving ? "SAVING..." : "SAVE STRATEGY"}</span>
            <span className="text-[10px] text-[#59616B] font-mono">[^S]</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            disabled={!validation.isValid}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-[2px] bg-[#10B981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
            title="Fast test on any selected Indian or US stock"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>TEST ON STOCK</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndBacktest}
            disabled={!validation.isValid || saving}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-[2px] font-semibold text-xs transition-colors ${
              validation.isValid
                ? "bg-[#38BDF8] hover:bg-[#0284C7] text-black"
                : "bg-[#1E232B] text-[#59616B] cursor-not-allowed border border-[#252A31]"
            }`}
          >
            <Play className="h-3 w-3" />
            <span>RUN BACKTEST</span>
            <span className="text-[10px] font-mono opacity-70">[^Enter]</span>
          </button>
        </div>
      </div>

      {/* 2. 3-COLUMN STRATEGY WORKSTATION LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* =================================================================== */}
        {/* COLUMN 1: LEFT NAVIGATION JUMP COLUMN (Col 1-2)                      */}
        {/* =================================================================== */}
        <div className="lg:col-span-2 border-r border-[#252A31] bg-[#0B0D10] p-3 space-y-1 select-none flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#59616B] tracking-wider">
              STRATEGY ARCHITECTURE
            </div>

            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-[2px] text-xs font-mono flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-[#141820] text-[#38BDF8] font-bold border border-[#38BDF8]/40"
                      : "text-[#89919C] hover:text-[#D8DCE2] hover:bg-[#101318]"
                  }`}
                >
                  <span className="truncate">{sec.label}</span>
                  {sec.count !== null && (
                    <span className="text-[10px] text-[#59616B] ml-1">
                      {sec.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Info & Methodology box */}
          <div className="p-2.5 border border-[#252A31] bg-[#101318] rounded-[2px] text-[10px] text-[#59616B] space-y-1">
            <div className="text-[#D8DCE2] font-semibold flex items-center space-x-1">
              <Zap className="h-3 w-3 text-[#FF9900]" />
              <span>ZERO LOOK-AHEAD</span>
            </div>
            <p>
              Signals evaluate using data available at bar close. Execution fills next bar open.
            </p>
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 2: CENTER DIRECT MANIPULATION RULE BUILDER (Col 3-8)          */}
        {/* =================================================================== */}
        <div className="lg:col-span-6 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#0B0D10]">
          {/* A. Identity & Thesis Section */}
          <div
            id="section-identity"
            className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 space-y-3"
          >
            <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
              <span className="font-bold text-xs text-[#FF9900] tracking-wider uppercase">
                1. MODEL IDENTITY & THESIS
              </span>
              <span className="text-[10px] text-[#59616B]">Step 1 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  STRATEGY NAME
                </label>
                <input
                  type="text"
                  value={strategy.name}
                  onChange={(e) =>
                    setStrategy({ ...strategy, name: e.target.value })
                  }
                  placeholder="e.g. EMA Momentum Alpha"
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  STRATEGY STYLE CATEGORY
                </label>
                <select
                  value={strategy.strategy_type || "trend"}
                  onChange={(e) =>
                    setStrategy({ ...strategy, strategy_type: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
                >
                  <option value="trend">Trend Following</option>
                  <option value="mean_reversion">Mean Reversion</option>
                  <option value="momentum">Momentum</option>
                  <option value="breakout">Breakout</option>
                  <option value="volatility">Volatility</option>
                  <option value="factor">Quantitative Factor</option>
                  <option value="systematic">Systematic Composite</option>
                  <option value="custom">Bespoke Custom</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  EXECUTION TIMEFRAME
                </label>
                <select
                  value={strategy.timeframe}
                  onChange={(e) =>
                    setStrategy({ ...strategy, timeframe: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
                >
                  <option value="1D">1D (Daily Bars)</option>
                  <option value="1W">1W (Weekly Bars)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  QUANTITATIVE HYPOTHESIS & THESIS
                </label>
                <textarea
                  rows={2}
                  value={strategy.description}
                  onChange={(e) =>
                    setStrategy({ ...strategy, description: e.target.value })
                  }
                  placeholder="Explain the theoretical edge, micro-structure premise or statistical anomaly..."
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>
          </div>

          {/* B. Universe & Target Security */}
          <div
            id="section-universe"
            className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 space-y-3"
          >
            <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-[#FF9900] tracking-wider uppercase">
                  2. TARGET SECURITY & UNIVERSE
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#141820] text-[#38BDF8] rounded border border-[#252A31]">
                  18,500+ Listed Equities
                </span>
              </div>
              <span className="text-[10px] text-[#59616B]">Supports Indian (NSE/BSE) & US (NYSE/NASDAQ) Equities</span>
            </div>

            <EasyStockPicker
              selectedAsset={strategy.asset}
              onSelectAsset={(symbol, details) => {
                setStrategy((prev) => ({
                  ...prev,
                  asset: symbol,
                  universe: [symbol],
                }));
                if (details?.benchmark) {
                  setBacktestBenchmark(details.benchmark);
                }
              }}
              selectedBenchmark={backtestBenchmark}
              onBenchmarkChange={(bm) => setBacktestBenchmark(bm)}
            />
          </div>

          {/* C. Technical Indicators Pipeline */}
          <div
            id="section-indicators"
            className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 space-y-3"
          >
            <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
              <span className="font-bold text-xs text-[#38BDF8] tracking-wider uppercase">
                3. TECHNICAL INDICATOR PIPELINE ({strategy.indicators.length})
              </span>

              {/* Add Indicator Select */}
              <div className="flex items-center space-x-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddIndicator(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2 py-1 text-xs text-[#38BDF8] focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    + ADD INDICATOR...
                  </option>
                  {AVAILABLE_INDICATORS.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {strategy.indicators.length === 0 ? (
              <div className="p-4 border border-dashed border-[#252A31] text-center text-xs text-[#59616B]">
                No indicators added yet. Add an indicator above or rules will operate on raw Price series.
              </div>
            ) : (
              <div className="space-y-2">
                {strategy.indicators.map((ind) => (
                  <div
                    key={ind.id}
                    className="p-2.5 border border-[#252A31] bg-[#0B0D10] rounded-[2px] flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#D8DCE2]">{ind.name}</span>
                      <span className="px-1.5 py-0.2 rounded-[2px] bg-[#141820] border border-[#252A31] text-[10px] text-[#89919C]">
                        ID: {ind.id}
                      </span>
                    </div>

                    {/* Numeric Params Editor */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {Object.entries(ind.params || {}).map(([paramKey, paramVal]) => (
                        <div key={paramKey} className="flex items-center space-x-1">
                          <span className="text-[#59616B] uppercase text-[10px]">
                            {paramKey}:
                          </span>
                          <input
                            type="number"
                            value={paramVal}
                            onChange={(e) =>
                              handleUpdateIndicatorParam(
                                ind.id,
                                paramKey,
                                e.target.value
                              )
                            }
                            className="w-16 px-1.5 py-0.5 bg-[#141820] border border-[#252A31] rounded-[2px] text-xs text-[#38BDF8] text-center focus:outline-none"
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleRemoveIndicator(ind.id)}
                        className="p-1 rounded text-[#59616B] hover:text-[#EF4444] transition-colors ml-2"
                        title="Remove Indicator"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* D. Visual Entry Rule Builder */}
          <div
            id="section-entry"
            className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 space-y-3"
          >
            <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
              <span className="font-bold text-xs text-[#10B981] tracking-wider uppercase">
                4. ENTRY SIGNAL CONDITIONS ({strategy.entry_rules.length})
              </span>
              <button
                type="button"
                onClick={() => handleAddRule("entry")}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-[2px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/20 transition-colors text-xs font-semibold"
              >
                <Plus className="h-3 w-3" />
                <span>ADD ENTRY RULE</span>
              </button>
            </div>

            {strategy.entry_rules.length === 0 ? (
              <div className="p-4 border border-dashed border-[#252A31] text-center text-xs text-[#EF4444]">
                ⚠ No entry conditions defined. At least one entry condition is required to generate buy signals.
              </div>
            ) : (
              <div className="space-y-3">
                {strategy.entry_rules.map((rule, idx) => {
                  const left = rule.indicator_a || rule.left_indicator || "close";
                  const right = rule.indicator_b || rule.right_indicator || "";
                  const readableText = formatConditionRule(rule, strategy.indicators);

                  return (
                    <div
                      key={rule.id}
                      className="p-3 border border-[#252A31] bg-[#0B0D10] rounded-[2px] space-y-2 text-xs"
                    >
                      {/* Logical Operator header for secondary rules */}
                      {idx > 0 && (
                        <div className="flex items-center space-x-2 pb-1 border-b border-[#1E232B]">
                          <select
                            value={rule.logical_operator || "AND"}
                            onChange={(e) =>
                              handleUpdateRule(
                                "entry",
                                rule.id,
                                "logical_operator",
                                e.target.value
                              )
                            }
                            className="bg-[#141820] border border-[#252A31] px-2 py-0.5 rounded-[2px] text-[10px] font-bold text-[#FF9900]"
                          >
                            <option value="AND">AND (ALL MUST MATCH)</option>
                            <option value="OR">OR (ANY CAN MATCH)</option>
                          </select>
                        </div>
                      )}

                      {/* Visual Sentence Construction Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        {/* Left Target */}
                        <div className="sm:col-span-4">
                          <select
                            value={left}
                            onChange={(e) =>
                              handleUpdateRule(
                                "entry",
                                rule.id,
                                "indicator_a",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 bg-[#101318] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:border-[#38BDF8]"
                          >
                            <option value="close">Close Price</option>
                            <option value="open">Open Price</option>
                            <option value="high">High Price</option>
                            <option value="low">Low Price</option>
                            <option value="volume">Volume</option>
                            {strategy.indicators.map((ind) => (
                              <option key={ind.id} value={ind.id}>
                                {ind.name} ({ind.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Operator */}
                        <div className="sm:col-span-3">
                          <select
                            value={rule.operator}
                            onChange={(e) =>
                              handleUpdateRule(
                                "entry",
                                rule.id,
                                "operator",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 bg-[#101318] border border-[#252A31] rounded-[2px] text-xs text-[#38BDF8] font-bold text-center focus:border-[#38BDF8]"
                          >
                            <option value=">">&gt; (Greater Than)</option>
                            <option value="<">&lt; (Less Than)</option>
                            <option value=">=">&gt;= (Greater or Equal)</option>
                            <option value="<=">&lt;= (Less or Equal)</option>
                            <option value="==">== (Equal To)</option>
                            <option value="CROSS_ABOVE">CROSSES ABOVE</option>
                            <option value="CROSS_BELOW">CROSSES BELOW</option>
                          </select>
                        </div>

                        {/* Right Target / Threshold */}
                        <div className="sm:col-span-4">
                          {rule.threshold !== null && rule.threshold !== undefined ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                step="any"
                                value={rule.threshold}
                                onChange={(e) =>
                                  handleUpdateRule(
                                    "entry",
                                    rule.id,
                                    "threshold",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full px-2 py-1 bg-[#101318] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:border-[#38BDF8]"
                                placeholder="Threshold value"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateRule("entry", rule.id, "threshold", null);
                                  handleUpdateRule(
                                    "entry",
                                    rule.id,
                                    "indicator_b",
                                    strategy.indicators[0]?.id || "close"
                                  );
                                }}
                                className="text-[10px] text-[#38BDF8] hover:underline whitespace-nowrap"
                                title="Switch to Indicator"
                              >
                                [IND]
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <select
                                value={right}
                                onChange={(e) =>
                                  handleUpdateRule(
                                    "entry",
                                    rule.id,
                                    "indicator_b",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 bg-[#101318] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:border-[#38BDF8]"
                              >
                                <option value="close">Close Price</option>
                                <option value="open">Open Price</option>
                                <option value="high">High Price</option>
                                <option value="low">Low Price</option>
                                {strategy.indicators.map((ind) => (
                                  <option key={ind.id} value={ind.id}>
                                    {ind.name} ({ind.id})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateRule("entry", rule.id, "indicator_b", null);
                                  handleUpdateRule("entry", rule.id, "threshold", 50);
                                }}
                                className="text-[10px] text-[#FF9900] hover:underline whitespace-nowrap"
                                title="Switch to Numeric Value"
                              >
                                [NUM]
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRule("entry", rule.id)}
                            className="p-1 text-[#59616B] hover:text-[#EF4444]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Live Human-Facing Translation */}
                      <div className="text-[11px] text-[#89919C] pt-1 flex items-center space-x-1 font-mono">
                        <span className="text-[#10B981] font-bold">TRANSLATION:</span>
                        <span>{readableText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* E. Visual Exit Rule Builder */}
          <div
            id="section-exit"
            className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 space-y-3"
          >
            <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
              <span className="font-bold text-xs text-[#EF4444] tracking-wider uppercase">
                5. EXIT SIGNAL CONDITIONS ({strategy.exit_rules.length})
              </span>
              <button
                type="button"
                onClick={() => handleAddRule("exit")}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-[2px] bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20 transition-colors text-xs font-semibold"
              >
                <Plus className="h-3 w-3" />
                <span>ADD EXIT RULE</span>
              </button>
            </div>

            {strategy.exit_rules.length === 0 ? (
              <div className="p-3 border border-[#252A31] bg-[#0B0D10] text-center text-xs text-[#89919C]">
                Exits will be triggered strictly by Stop Loss and Take Profit risk thresholds.
              </div>
            ) : (
              <div className="space-y-3">
                {strategy.exit_rules.map((rule, idx) => {
                  const left = rule.indicator_a || rule.left_indicator || "close";
                  const right = rule.indicator_b || rule.right_indicator || "";
                  const readableText = formatConditionRule(rule, strategy.indicators);

                  return (
                    <div
                      key={rule.id}
                      className="p-3 border border-[#252A31] bg-[#0B0D10] rounded-[2px] space-y-2 text-xs"
                    >
                      {idx > 0 && (
                        <div className="flex items-center space-x-2 pb-1 border-b border-[#1E232B]">
                          <select
                            value={rule.logical_operator || "OR"}
                            onChange={(e) =>
                              handleUpdateRule(
                                "exit",
                                rule.id,
                                "logical_operator",
                                e.target.value
                              )
                            }
                            className="bg-[#141820] border border-[#252A31] px-2 py-0.5 rounded-[2px] text-[10px] font-bold text-[#FF9900]"
                          >
                            <option value="OR">OR (EITHER TRIGGERS EXIT)</option>
                            <option value="AND">AND (BOTH REQUIRED)</option>
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-4">
                          <select
                            value={left}
                            onChange={(e) =>
                              handleUpdateRule(
                                "exit",
                                rule.id,
                                "indicator_a",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 bg-[#101318] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:border-[#38BDF8]"
                          >
                            <option value="close">Close Price</option>
                            <option value="open">Open Price</option>
                            <option value="high">High Price</option>
                            <option value="low">Low Price</option>
                            {strategy.indicators.map((ind) => (
                              <option key={ind.id} value={ind.id}>
                                {ind.name} ({ind.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <select
                            value={rule.operator}
                            onChange={(e) =>
                              handleUpdateRule(
                                "exit",
                                rule.id,
                                "operator",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 bg-[#101318] border border-[#252A31] rounded-[2px] text-xs text-[#EF4444] font-bold text-center focus:border-[#38BDF8]"
                          >
                            <option value="<">&lt; (Less Than)</option>
                            <option value=">">&gt; (Greater Than)</option>
                            <option value="<=">&lt;= (Less or Equal)</option>
                            <option value=">=">&gt;= (Greater or Equal)</option>
                            <option value="CROSS_BELOW">CROSSES BELOW</option>
                            <option value="CROSS_ABOVE">CROSSES ABOVE</option>
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          {rule.threshold !== null && rule.threshold !== undefined ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                step="any"
                                value={rule.threshold}
                                onChange={(e) =>
                                  handleUpdateRule(
                                    "exit",
                                    rule.id,
                                    "threshold",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full px-2 py-1 bg-[#101318] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:border-[#38BDF8]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateRule("exit", rule.id, "threshold", null);
                                  handleUpdateRule(
                                    "exit",
                                    rule.id,
                                    "indicator_b",
                                    strategy.indicators[0]?.id || "close"
                                  );
                                }}
                                className="text-[10px] text-[#38BDF8] hover:underline whitespace-nowrap"
                              >
                                [IND]
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <select
                                value={right}
                                onChange={(e) =>
                                  handleUpdateRule(
                                    "exit",
                                    rule.id,
                                    "indicator_b",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 bg-[#101318] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:border-[#38BDF8]"
                              >
                                <option value="close">Close Price</option>
                                <option value="open">Open Price</option>
                                <option value="high">High Price</option>
                                <option value="low">Low Price</option>
                                {strategy.indicators.map((ind) => (
                                  <option key={ind.id} value={ind.id}>
                                    {ind.name} ({ind.id})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateRule("exit", rule.id, "indicator_b", null);
                                  handleUpdateRule("exit", rule.id, "threshold", 40);
                                }}
                                className="text-[10px] text-[#FF9900] hover:underline whitespace-nowrap"
                              >
                                [NUM]
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRule("exit", rule.id)}
                            className="p-1 text-[#59616B] hover:text-[#EF4444]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#89919C] pt-1 flex items-center space-x-1 font-mono">
                        <span className="text-[#EF4444] font-bold">TRANSLATION:</span>
                        <span>{readableText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* F. Risk Management Controls */}
          <div
            id="section-risk"
            className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 space-y-3"
          >
            <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
              <span className="font-bold text-xs text-[#FF9900] tracking-wider uppercase">
                6. RISK MANAGEMENT LIMITS
              </span>
              <span className="text-[10px] text-[#59616B]">Portfolio Protection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  STOP LOSS (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={strategy.risk.stop_loss_pct ?? ""}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      risk: {
                        ...strategy.risk,
                        stop_loss_pct: e.target.value ? Number(e.target.value) : null,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#EF4444] font-bold focus:outline-none"
                  placeholder="e.g. 2.0"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  TAKE PROFIT (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={strategy.risk.take_profit_pct ?? ""}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      risk: {
                        ...strategy.risk,
                        take_profit_pct: e.target.value ? Number(e.target.value) : null,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#10B981] font-bold focus:outline-none"
                  placeholder="e.g. 6.0"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  POSITION SIZE (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={strategy.risk.position_size_pct}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      risk: {
                        ...strategy.risk,
                        position_size_pct: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  MAX CONCURRENT POSITIONS
                </label>
                <input
                  type="number"
                  value={strategy.risk.max_positions}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      risk: {
                        ...strategy.risk,
                        max_positions: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  TRAILING STOP (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={strategy.risk.trailing_stop_pct ?? ""}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      risk: {
                        ...strategy.risk,
                        trailing_stop_pct: e.target.value ? Number(e.target.value) : null,
                      },
                    })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* G. Execution Friction & Timing */}
          <div
            id="section-execution"
            className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 space-y-3"
          >
            <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
              <span className="font-bold text-xs text-[#FF9900] tracking-wider uppercase">
                7. EXECUTION FRICTION & TIMING
              </span>
              <span className="text-[10px] text-[#38BDF8]">Realistic Quant Simulation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  INITIAL CAPITAL ($)
                </label>
                <input
                  type="number"
                  value={strategy.execution.initial_capital}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      execution: {
                        ...strategy.execution,
                        initial_capital: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  COMMISSION (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={strategy.execution.commission_pct}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      execution: {
                        ...strategy.execution,
                        commission_pct: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#59616B] uppercase block mb-1">
                  SLIPPAGE (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={strategy.execution.slippage_pct}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      execution: {
                        ...strategy.execution,
                        slippage_pct: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 3: RIGHT LIVE STRATEGY SUMMARY & PRE-FLIGHT (Col 9-12)       */}
        {/* =================================================================== */}
        <div className="lg:col-span-4 border-l border-[#252A31] bg-[#0B0D10] p-4 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
              <span className="font-bold text-xs text-[#38BDF8] tracking-wider uppercase">
                STRATEGY SUMMARY
              </span>
              <span className="text-[10px] text-[#59616B]">Live Blueprint</span>
            </div>

            {/* Model Card */}
            <div className="p-3 border border-[#252A31] bg-[#101318] rounded-[2px] space-y-2 text-xs">
              <div className="font-bold text-sm text-[#D8DCE2]">
                {strategy.name || "Untitled Strategy"}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-[#89919C]">
                <span className="font-bold text-[#38BDF8]">{strategy.asset}</span>
                <span>·</span>
                <span>{strategy.timeframe}</span>
                <span>·</span>
                <span className="uppercase">{strategy.strategy_type || "trend"}</span>
              </div>
            </div>

            {/* Indicators summary */}
            <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-3 space-y-1.5 text-xs">
              <span className="text-[10px] text-[#59616B] uppercase font-bold tracking-wider block">
                INDICATORS ({strategy.indicators.length})
              </span>
              {strategy.indicators.length === 0 ? (
                <span className="text-[11px] text-[#59616B]">None defined</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {strategy.indicators.map((ind) => (
                    <span
                      key={ind.id}
                      className="px-1.5 py-0.5 rounded-[2px] bg-[#141820] border border-[#252A31] text-[10px] text-[#D8DCE2]"
                    >
                      {ind.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Entry & Exit Rules Live Translation */}
            <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-3 space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-[#10B981] uppercase font-bold tracking-wider block">
                  ENTRY SIGNALS
                </span>
                <p className="text-[11px] text-[#D8DCE2] mt-0.5 font-mono">
                  {formatRuleSet(strategy.entry_rules, strategy.indicators)}
                </p>
              </div>

              <div className="pt-2 border-t border-[#1E232B]">
                <span className="text-[10px] text-[#EF4444] uppercase font-bold tracking-wider block">
                  EXIT SIGNALS
                </span>
                <p className="text-[11px] text-[#D8DCE2] mt-0.5 font-mono">
                  {strategy.exit_rules.length > 0
                    ? formatRuleSet(strategy.exit_rules, strategy.indicators)
                    : "Managed by Stop Loss & Take Profit limits"}
                </p>
              </div>
            </div>

            {/* Risk & Friction Specs */}
            <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-3 space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#59616B]">STOP LOSS:</span>
                <span className="text-[#EF4444] font-bold">
                  {strategy.risk.stop_loss_pct ? `-${strategy.risk.stop_loss_pct}%` : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#59616B]">TAKE PROFIT:</span>
                <span className="text-[#10B981] font-bold">
                  {strategy.risk.take_profit_pct ? `+${strategy.risk.take_profit_pct}%` : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#59616B]">POSITION SIZE:</span>
                <span className="text-[#D8DCE2]">{strategy.risk.position_size_pct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#59616B]">EXECUTION:</span>
                <span className="text-[#38BDF8]">NEXT BAR OPEN (t+1)</span>
              </div>
            </div>

            {/* Real-Time Model Validation State */}
            <div
              className={`p-3 border rounded-[2px] text-xs space-y-1 ${
                validation.isValid
                  ? "bg-[#10B981]/5 border-[#10B981]/30 text-[#10B981]"
                  : "bg-[#EF4444]/5 border-[#EF4444]/30 text-[#EF4444]"
              }`}
            >
              <div className="font-bold flex items-center space-x-1.5">
                {validation.isValid ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>✓ MODEL VALID — READY FOR EXECUTION</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>⚠ MODEL SPECIFICATION INCOMPLETE</span>
                  </>
                )}
              </div>

              {validation.errors.map((err, i) => (
                <p key={i} className="text-[10px] text-[#EF4444] pl-5">
                  &bull; {err}
                </p>
              ))}

              {validation.warnings.map((warn, i) => (
                <p key={i} className="text-[10px] text-[#F59E0B] pl-5">
                  &bull; {warn}
                </p>
              ))}
            </div>
          </div>

          {/* Bottom Pre-Flight Execution Launcher */}
          <div className="pt-3 border-t border-[#252A31] space-y-2">
            <button
              type="button"
              onClick={handleSaveAndBacktest}
              disabled={!validation.isValid || saving}
              className={`w-full py-2.5 rounded-[2px] font-bold text-xs flex items-center justify-center space-x-2 transition-colors ${
                validation.isValid
                  ? "bg-[#38BDF8] hover:bg-[#0284C7] text-black shadow-md"
                  : "bg-[#141820] text-[#59616B] border border-[#252A31] cursor-not-allowed"
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              <span>RUN FULL BACKTEST</span>
            </button>

            <button
              type="button"
              onClick={handleSaveStrategy}
              disabled={saving}
              className="w-full py-1.5 rounded-[2px] border border-[#252A31] bg-[#101318] hover:bg-[#141820] text-[#D8DCE2] text-xs transition-colors flex items-center justify-center space-x-1"
            >
              <Save className="h-3 w-3 text-[#38BDF8]" />
              <span>{saving ? "SAVING..." : "SAVE MODEL SPEC"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PRESETS & TEMPLATES CHOOSER MODAL */}
      {showChooserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl bg-[#101318] border border-[#252A31] rounded-[2px] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#252A31] bg-[#0B0D10]">
              <span className="font-bold text-xs text-[#D8DCE2] tracking-wider uppercase">
                STRATEGY CREATION PRESETS
              </span>
              <button
                type="button"
                onClick={() => setShowChooserModal(false)}
                className="text-[#59616B] hover:text-[#D8DCE2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Option 1: Blank Strategy */}
              <div
                onClick={() => {
                  setStrategy({
                    ...DEFAULT_STRATEGY,
                    id: `strat_${Date.now()}`,
                    name: "New Blank Quantitative Model",
                    indicators: [],
                    entry_rules: [],
                    exit_rules: [],
                  });
                  setShowChooserModal(false);
                }}
                className="p-3 border border-[#252A31] bg-[#0B0D10] hover:border-[#38BDF8]/50 hover:bg-[#141820] cursor-pointer rounded-[2px] transition-colors"
              >
                <div className="font-semibold text-xs text-[#D8DCE2]">
                  [ BLANK STRATEGY CANVAS ]
                </div>
                <p className="text-[11px] text-[#59616B] mt-0.5">
                  Start completely from scratch with an empty indicator pipeline and custom rule slots.
                </p>
              </div>

              {/* Option 2: Pre-built templates list */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[#FF9900] uppercase tracking-wider block mb-2">
                  LOAD PRE-BUILT QUANTITATIVE TEMPLATE:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allTemplates.slice(0, 8).map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setStrategy({
                          ...tpl,
                          id: `strat_${Date.now()}`,
                          name: `${tpl.name} (Custom)`,
                        });
                        setShowChooserModal(false);
                      }}
                      className="p-2.5 border border-[#252A31] bg-[#0B0D10] hover:border-[#38BDF8]/50 hover:bg-[#141820] cursor-pointer rounded-[2px] transition-colors"
                    >
                      <div className="font-semibold text-xs text-[#D8DCE2]">
                        {tpl.name}
                      </div>
                      <div className="text-[10px] text-[#38BDF8] mt-0.5">
                        {tpl.asset} · {tpl.strategy_type?.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 border-t border-[#252A31] bg-[#0B0D10] flex justify-end">
              <button
                type="button"
                onClick={() => setShowChooserModal(false)}
                className="px-3 py-1 border border-[#252A31] text-xs hover:bg-[#141820] rounded-[2px]"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAST TEST STRATEGY MODAL */}
      <TestStrategyModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        strategy={strategy}
        initialStock={strategy.asset}
      />
    </div>
  );
}

export default function StrategyBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0D10] text-[#D8DCE2] flex flex-col items-center justify-center space-y-3 font-mono text-xs select-none">
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 border-2 border-[#252A31] rounded-full" />
            <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
          </div>
          <span className="tracking-wider uppercase text-slate-300">
            INITIALIZING QUANTITATIVE STRATEGY BUILDER...
          </span>
          <span className="text-[11px] text-[#59616B]">
            Loading execution rules, universe definitions & indicators
          </span>
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
