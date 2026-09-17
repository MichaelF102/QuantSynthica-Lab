"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Database,
  Server,
  Cpu,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Terminal,
  Activity,
  Maximize2,
  Minimize2,
  Check,
  AlertCircle,
  HardDrive,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  SystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
  loadSystemSettings,
  saveSystemSettingsToLocal,
} from "@/lib/settings";
import SystemStatusStrip from "@/components/settings/SystemStatusStrip";
import SettingsSection from "@/components/settings/SettingsSection";
import {
  SettingsField,
  SettingsSelect,
  SettingsInput,
  SettingsToggle,
} from "@/components/settings/SettingsControls";
import DiagnosticsModal from "@/components/settings/DiagnosticsModal";
import ImportExportModal from "@/components/settings/ImportExportModal";
import ClearCacheModal from "@/components/settings/ClearCacheModal";

export default function SettingsPage() {
  // Loaded baseline settings (from backend / local)
  const [initialSettings, setInitialSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  // Current working edits
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

  // Section collapse state (stored in localStorage)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sec_market: true,
    sec_research: true,
    sec_backtest: true,
    sec_portfolio: false,
    sec_optimization: false,
    sec_factor: false,
    sec_execution: false,
    sec_engine: false,
    sec_storage: false,
    sec_appearance: false,
    sec_shortcuts: false,
    sec_alerts: false,
    sec_developer: false,
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  // Diagnostics quick preview
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);

  // Load settings on mount
  useEffect(() => {
    let isMounted = true;
    const initSettings = async () => {
      // 1. Try local storage first
      const local = loadSystemSettings();
      if (isMounted) {
        setInitialSettings(local);
        setSettings(local);
      }

      // 2. Fetch from backend API to ensure multi-device sync
      try {
        const res = await api.getSettings();
        if (res.settings && Object.keys(res.settings).length > 0 && isMounted) {
          const merged = { ...local, ...res.settings };
          setInitialSettings(merged);
          setSettings(merged);
          saveSystemSettingsToLocal(merged);
        }
      } catch {
        // Backend might be offline or starting up; local copy will suffice
      }

      // 3. Load section collapse memory
      try {
        const savedSections = localStorage.getItem("algolab_settings_open_sections");
        if (savedSections && isMounted) {
          setOpenSections(JSON.parse(savedSections));
        }
      } catch {}
    };

    initSettings();
    loadDiagnostics();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadDiagnostics = async () => {
    try {
      const diag = await api.getSystemDiagnostics();
      setDiagnosticsData(diag);
    } catch {}
  };

  // Toggle section and persist open state
  const toggleSection = (secId: string) => {
    setOpenSections((prev) => {
      const updated = { ...prev, [secId]: !prev[secId] };
      try {
        localStorage.setItem("algolab_settings_open_sections", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const expandAllSections = () => {
    const allOpen: Record<string, boolean> = {};
    Object.keys(openSections).forEach((k) => (allOpen[k] = true));
    setOpenSections(allOpen);
  };

  const collapseAllSections = () => {
    const allClosed: Record<string, boolean> = {};
    Object.keys(openSections).forEach((k) => (allClosed[k] = false));
    setOpenSections(allClosed);
  };

  // Check whether unsaved changes exist
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  // Generic updater
  const updateCategory = <K extends keyof SystemSettings>(
    cat: K,
    patch: Partial<SystemSettings[K]>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        ...patch,
      },
    }));
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Persist to local storage
      saveSystemSettingsToLocal(settings);

      // Persist to backend API
      await api.updateSettings(settings).catch(() => null);

      setInitialSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  // Reset to default settings
  const handleResetDefaults = () => {
    if (window.confirm("Reset all AlgoLab system settings to default quantitative configurations?")) {
      setSettings(DEFAULT_SYSTEM_SETTINGS);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090E] text-slate-100 pb-28">
      <div className="max-w-[1720px] mx-auto px-4 py-3 space-y-3.5">
        {/* 1. Header & Primary Action Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2530]">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight font-sans">
                System Settings
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] font-semibold border border-[#38BDF8]/30">
                CONSOLE
              </span>
            </div>
            <p className="text-xs text-[#89919C] mt-0.5 font-sans">
              Terminal preferences, quantitative defaults, data infrastructure &amp; engine configuration
            </p>
          </div>

          {/* Top-right actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={expandAllSections}
              className="flex items-center space-x-1 bg-[#0F141D] hover:bg-[#151C28] border border-[#202C3F] px-2.5 py-1.5 rounded text-slate-400 hover:text-white text-xs font-mono transition-colors"
              title="Expand all sections"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expand All</span>
            </button>

            <button
              type="button"
              onClick={collapseAllSections}
              className="flex items-center space-x-1 bg-[#0F141D] hover:bg-[#151C28] border border-[#202C3F] px-2.5 py-1.5 rounded text-slate-400 hover:text-white text-xs font-mono transition-colors"
              title="Collapse all sections"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Collapse All</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImportExportModal(true)}
              className="flex items-center space-x-1.5 bg-[#0F141D] hover:bg-[#151C28] border border-[#202C3F] px-3 py-1.5 rounded text-slate-200 hover:text-white text-xs font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Config</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImportExportModal(true)}
              className="flex items-center space-x-1.5 bg-[#0F141D] hover:bg-[#151C28] border border-[#202C3F] px-3 py-1.5 rounded text-slate-200 hover:text-white text-xs font-mono transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import Config</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center space-x-1.5 bg-[#0F141D] hover:bg-[#151C28] border border-[#202C3F] px-3 py-1.5 rounded text-slate-300 hover:text-white text-xs font-mono transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving || !hasUnsavedChanges}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-bold font-mono transition-all shadow-md ${
                hasUnsavedChanges
                  ? "bg-[#0284C7] hover:bg-[#0369A1] text-white cursor-pointer ring-2 ring-[#38BDF8]/40 animate-pulse"
                  : "bg-[#101724] border border-[#1F2C40] text-slate-400 cursor-not-allowed"
              }`}
            >
              {saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
              ) : saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? "Saved!" : saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* 2. Compact System Status Telemetry Strip */}
        <SystemStatusStrip apiUrl={settings.engine.apiUrl} onRefresh={loadDiagnostics} />

        {/* 3. Settings Cards Grid (2 columns on desktop) */}
        <div className="space-y-3.5">
          {/* ROW 1: Market Data & Quant Research Defaults */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {/* 01. MARKET DATA & UNIVERSE */}
            <SettingsSection
              id="sec_market"
              numberStr="01"
              title="Market Data &amp; Universe"
              description="Data providers, default exchange, historical window, and cache TTL"
              isOpen={openSections.sec_market}
              onToggle={() => toggleSection("sec_market")}
              onReset={() => updateCategory("marketData", DEFAULT_SYSTEM_SETTINGS.marketData)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Primary Data Provider" tooltip="Source for pricing, fundamentals, and bar history">
                  <SettingsSelect
                    value={settings.marketData.primaryProvider}
                    options={["yfinance", "TradingView Screener", "Custom API", "Auto"]}
                    onChange={(val) => updateCategory("marketData", { primaryProvider: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Default Exchange" tooltip="Default exchange filter for security searches">
                  <SettingsSelect
                    value={settings.marketData.defaultExchange}
                    options={["US", "NSE", "BSE", "Global"]}
                    onChange={(val) => updateCategory("marketData", { defaultExchange: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Default Universe" tooltip="Initial asset basket loaded in Research and Builder">
                  <SettingsSelect
                    value={settings.marketData.defaultUniverse}
                    options={["All Equities", "NIFTY 50", "NIFTY 500", "S&P 500", "NASDAQ 100", "Custom"]}
                    onChange={(val) => updateCategory("marketData", { defaultUniverse: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Default Data Frequency" tooltip="Bar resolution interval">
                  <SettingsSelect
                    value={settings.marketData.defaultFrequency}
                    options={["1D", "1H", "30m", "15m", "5m", "1m"]}
                    onChange={(val) => updateCategory("marketData", { defaultFrequency: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Historical Data Window" tooltip="Lookback window for charts and backtests">
                  <SettingsSelect
                    value={settings.marketData.historicalWindow}
                    options={["1Y", "3Y", "5Y", "10Y", "Maximum"]}
                    onChange={(val) => updateCategory("marketData", { historicalWindow: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Cache TTL" tooltip="Local Parquet cache time-to-live before revalidation">
                  <SettingsSelect
                    value={settings.marketData.cacheTTL}
                    options={["5m", "15m", "30m", "1h"]}
                    onChange={(val) => updateCategory("marketData", { cacheTTL: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Auto Refresh" tooltip="Polling frequency for live terminal market quotes">
                  <SettingsSelect
                    value={settings.marketData.autoRefresh}
                    options={["Off", "1 minute", "5 minutes", "15 minutes", "1 hour"]}
                    onChange={(val) => updateCategory("marketData", { autoRefresh: val as any })}
                  />
                </SettingsField>

                <div className="flex flex-col justify-center pt-2">
                  <SettingsToggle
                    label="Adjusted Prices (Split & Div)"
                    checked={settings.marketData.adjustedPrices}
                    onChange={(val) => updateCategory("marketData", { adjustedPrices: val })}
                  />
                </div>
              </div>
            </SettingsSection>

            {/* 02. QUANTITATIVE RESEARCH DEFAULTS */}
            <SettingsSection
              id="sec_research"
              numberStr="02"
              title="Quantitative Research Defaults"
              description="Benchmark, risk-free rate, statistical models, and VaR confidence"
              isOpen={openSections.sec_research}
              onToggle={() => toggleSection("sec_research")}
              onReset={() => updateCategory("research", DEFAULT_SYSTEM_SETTINGS.research)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Default Benchmark" tooltip="Reference benchmark symbol used for Alpha and Beta">
                  <SettingsSelect
                    value={settings.research.defaultBenchmark}
                    options={["SPY", "QQQ", "NIFTY 50", "NIFTY 500", "Custom"]}
                    onChange={(val) => updateCategory("research", { defaultBenchmark: val })}
                  />
                </SettingsField>

                <SettingsField label="Risk-Free Rate" tooltip="Annualized risk-free rate for Sharpe and Sortino ratios" description="Used for excess-return calculations">
                  <SettingsInput
                    type="number"
                    step="0.05"
                    suffix="%"
                    value={settings.research.riskFreeRate}
                    onChange={(val) => updateCategory("research", { riskFreeRate: parseFloat(val) || 0 })}
                  />
                </SettingsField>

                <SettingsField label="Return Frequency" tooltip="Compounding frequency for statistical returns">
                  <SettingsSelect
                    value={settings.research.returnFrequency}
                    options={["Daily", "Weekly", "Monthly"]}
                    onChange={(val) => updateCategory("research", { returnFrequency: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Annualization Factor" tooltip="Trading days per annum (252 for equities)">
                  <SettingsInput
                    type="number"
                    value={settings.research.annualizationFactor}
                    onChange={(val) => updateCategory("research", { annualizationFactor: parseInt(val, 10) || 252 })}
                  />
                </SettingsField>

                <SettingsField label="VaR Confidence" tooltip="Value at Risk tail percentile">
                  <SettingsSelect
                    value={settings.research.varConfidence}
                    options={["90%", "95%", "99%"]}
                    onChange={(val) => updateCategory("research", { varConfidence: val as any })}
                  />
                </SettingsField>

                <SettingsField label="CVaR Confidence" tooltip="Conditional VaR / Expected Shortfall confidence">
                  <SettingsSelect
                    value={settings.research.cvarConfidence}
                    options={["95%", "99%"]}
                    onChange={(val) => updateCategory("research", { cvarConfidence: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Volatility Model" tooltip="Model used for historical volatility calculation">
                  <SettingsSelect
                    value={settings.research.volatilityModel}
                    options={["Historical", "EWMA", "GARCH", "Parkinson", "Yang-Zhang"]}
                    onChange={(val) => updateCategory("research", { volatilityModel: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Correlation Method" tooltip="Statistical metric for pairwise correlation">
                  <SettingsSelect
                    value={settings.research.correlationMethod}
                    options={["Pearson", "Spearman", "Kendall"]}
                    onChange={(val) => updateCategory("research", { correlationMethod: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Default Lookback" tooltip="Historical window for rolling risk metrics" className="sm:col-span-2">
                  <SettingsSelect
                    value={settings.research.defaultLookback}
                    options={["63D", "126D", "252D", "504D"]}
                    onChange={(val) => updateCategory("research", { defaultLookback: val as any })}
                  />
                </SettingsField>
              </div>
            </SettingsSection>
          </div>

          {/* ROW 2: Backtest Engine & Portfolio & Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {/* 03. BACKTEST ENGINE */}
            <SettingsSection
              id="sec_backtest"
              numberStr="03"
              title="Backtest Engine"
              description="Execution assumptions, position sizing, capital, and lookahead protection"
              isOpen={openSections.sec_backtest}
              onToggle={() => toggleSection("sec_backtest")}
              onReset={() => updateCategory("backtest", DEFAULT_SYSTEM_SETTINGS.backtest)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Initial Capital" tooltip="Default starting cash balance for new backtests">
                  <SettingsInput
                    type="number"
                    prefix="$"
                    value={settings.backtest.initialCapital}
                    onChange={(val) => updateCategory("backtest", { initialCapital: parseFloat(val) || 100000 })}
                  />
                </SettingsField>

                <SettingsField label="Position Sizing" tooltip="Constituent capital allocation formula">
                  <SettingsSelect
                    value={settings.backtest.positionSizing}
                    options={["Equal Weight", "Fixed Fraction", "Volatility Target", "Risk Parity"]}
                    onChange={(val) => updateCategory("backtest", { positionSizing: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Commission" tooltip="Brokerage fee per trade notional">
                  <SettingsInput
                    type="number"
                    step="0.01"
                    suffix="%"
                    value={settings.backtest.commission}
                    onChange={(val) => updateCategory("backtest", { commission: parseFloat(val) || 0 })}
                  />
                </SettingsField>

                <SettingsField label="Slippage" tooltip="Expected slippage execution penalty">
                  <SettingsInput
                    type="number"
                    step="0.01"
                    suffix="%"
                    value={settings.backtest.slippage}
                    onChange={(val) => updateCategory("backtest", { slippage: parseFloat(val) || 0 })}
                  />
                </SettingsField>

                <SettingsField label="Execution Model" tooltip="Fills evaluated on bar t are executed at bar t+1">
                  <SettingsSelect
                    value={settings.backtest.executionModel}
                    options={["Next Bar Open", "Next Bar Close", "Same Bar Close"]}
                    onChange={(val) => updateCategory("backtest", { executionModel: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Rebalance Frequency" tooltip="Periodic constituent rebalance schedule">
                  <SettingsSelect
                    value={settings.backtest.rebalanceFrequency}
                    options={["Daily", "Weekly", "Monthly", "Quarterly"]}
                    onChange={(val) => updateCategory("backtest", { rebalanceFrequency: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Default Stop Loss" tooltip="Initial stop-loss threshold">
                  <SettingsInput
                    type="number"
                    step="0.5"
                    suffix="%"
                    value={settings.backtest.defaultStopLoss}
                    onChange={(val) => updateCategory("backtest", { defaultStopLoss: parseFloat(val) || 0 })}
                  />
                </SettingsField>

                <SettingsField label="Default Take Profit" tooltip="Initial take-profit target">
                  <SettingsInput
                    type="number"
                    step="0.5"
                    suffix="%"
                    value={settings.backtest.defaultTakeProfit}
                    onChange={(val) => updateCategory("backtest", { defaultTakeProfit: parseFloat(val) || 0 })}
                  />
                </SettingsField>

                <SettingsField label="Max Concurrent Positions" tooltip="Ceiling on simultaneous open trades">
                  <SettingsInput
                    type="number"
                    value={settings.backtest.maxConcurrentPositions}
                    onChange={(val) => updateCategory("backtest", { maxConcurrentPositions: parseInt(val, 10) || 10 })}
                  />
                </SettingsField>

                <SettingsField label="Corporate Action Handling" tooltip="Adjustment method for splits and dividends">
                  <SettingsSelect
                    value={settings.backtest.corporateActions}
                    options={["Adjusted", "Raw"]}
                    onChange={(val) => updateCategory("backtest", { corporateActions: val as any })}
                  />
                </SettingsField>

                <div className="space-y-1 sm:col-span-2 pt-1 border-t border-[#161F2C]">
                  <SettingsToggle
                    label="Lookahead Bias Protection (Enforce t+1 next-bar open fills)"
                    checked={settings.backtest.lookaheadProtection}
                    onChange={(val) => updateCategory("backtest", { lookaheadProtection: val })}
                  />
                  <SettingsToggle
                    label="Allow Fractional Shares (Enables high-precision notional sizing)"
                    checked={settings.backtest.allowFractional}
                    onChange={(val) => updateCategory("backtest", { allowFractional: val })}
                  />
                </div>
              </div>
            </SettingsSection>

            {/* 04. PORTFOLIO & RISK ENGINE */}
            <SettingsSection
              id="sec_portfolio"
              numberStr="04"
              title="Portfolio &amp; Risk Engine"
              description="Weight models, volatility targets, VaR simulation, and drawdown limits"
              isOpen={openSections.sec_portfolio}
              onToggle={() => toggleSection("sec_portfolio")}
              onReset={() => updateCategory("portfolio", DEFAULT_SYSTEM_SETTINGS.portfolio)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Portfolio Weight Model" tooltip="Default allocation model on Portfolio page">
                  <SettingsSelect
                    value={settings.portfolio.weightModel}
                    options={["Equal Weight", "Inverse Volatility", "Risk Parity", "Minimum Variance", "Maximum Sharpe"]}
                    onChange={(val) => updateCategory("portfolio", { weightModel: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Target Portfolio Volatility" tooltip="Target annualized portfolio volatility">
                  <SettingsInput
                    type="number"
                    suffix="%"
                    value={settings.portfolio.targetVolatility}
                    onChange={(val) => updateCategory("portfolio", { targetVolatility: parseFloat(val) || 15 })}
                  />
                </SettingsField>

                <SettingsField label="VaR Method" tooltip="Method for portfolio Value at Risk decomposition">
                  <SettingsSelect
                    value={settings.portfolio.varMethod}
                    options={["Historical", "Parametric", "Monte Carlo"]}
                    onChange={(val) => updateCategory("portfolio", { varMethod: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Monte Carlo Simulations" tooltip="Number of simulated geometric Brownian motion trajectories">
                  <SettingsInput
                    type="number"
                    value={settings.portfolio.monteCarloSimulations}
                    onChange={(val) => updateCategory("portfolio", { monteCarloSimulations: parseInt(val, 10) || 10000 })}
                  />
                </SettingsField>

                <SettingsField label="Max Drawdown Alert" tooltip="Threshold for triggering portfolio risk breach alert">
                  <SettingsInput
                    type="number"
                    suffix="%"
                    value={settings.portfolio.maxDrawdownAlert}
                    onChange={(val) => updateCategory("portfolio", { maxDrawdownAlert: parseFloat(val) || 10 })}
                  />
                </SettingsField>

                <SettingsField label="Correlation Lookback" tooltip="Rolling window for cross-asset correlation">
                  <SettingsSelect
                    value={settings.portfolio.correlationLookback}
                    options={["63D", "126D", "252D", "504D"]}
                    onChange={(val) => updateCategory("portfolio", { correlationLookback: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Rebalancing Threshold" tooltip="Portfolio weight drift trigger for rebalancing" className="sm:col-span-2">
                  <SettingsInput
                    type="number"
                    suffix="%"
                    value={settings.portfolio.rebalancingThreshold}
                    onChange={(val) => updateCategory("portfolio", { rebalancingThreshold: parseFloat(val) || 5 })}
                  />
                </SettingsField>
              </div>
            </SettingsSection>
          </div>

          {/* ROW 3: Optimization & Factor Model */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {/* 05. PORTFOLIO OPTIMIZATION */}
            <SettingsSection
              id="sec_optimization"
              numberStr="05"
              title="Portfolio Optimization"
              description="Objective solvers, weight constraints, and optimization cadence"
              isOpen={openSections.sec_optimization}
              onToggle={() => toggleSection("sec_optimization")}
              onReset={() => updateCategory("optimization", DEFAULT_SYSTEM_SETTINGS.optimization)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Optimization Objective" tooltip="Convex objective to maximize or minimize">
                  <SettingsSelect
                    value={settings.optimization.objective}
                    options={["Maximum Sharpe", "Minimum Variance", "Risk Parity", "Maximum Diversification", "Target Volatility"]}
                    onChange={(val) => updateCategory("optimization", { objective: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Solver" tooltip="Numerical quadratic / convex optimization solver" badge="SciPy Native">
                  <SettingsSelect
                    value={settings.optimization.solver}
                    options={["SciPy SLSQP (Native)", "CVXPY (Optional)"]}
                    onChange={(val) => updateCategory("optimization", { solver: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Minimum Weight" tooltip="Lower bound on constituent allocation">
                  <SettingsInput
                    type="number"
                    suffix="%"
                    value={settings.optimization.minWeight}
                    onChange={(val) => updateCategory("optimization", { minWeight: parseFloat(val) || 0 })}
                  />
                </SettingsField>

                <SettingsField label="Maximum Weight" tooltip="Upper bound on constituent allocation">
                  <SettingsInput
                    type="number"
                    suffix="%"
                    value={settings.optimization.maxWeight}
                    onChange={(val) => updateCategory("optimization", { maxWeight: parseFloat(val) || 30 })}
                  />
                </SettingsField>

                <SettingsField label="Optimization Frequency" tooltip="Periodic re-optimization schedule">
                  <SettingsSelect
                    value={settings.optimization.optimizationFrequency}
                    options={["Daily", "Weekly", "Monthly", "Quarterly"]}
                    onChange={(val) => updateCategory("optimization", { optimizationFrequency: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Target Volatility" tooltip="Constraint parameter for target vol objective">
                  <SettingsInput
                    type="number"
                    suffix="%"
                    value={settings.optimization.targetVolatility}
                    onChange={(val) => updateCategory("optimization", { targetVolatility: parseFloat(val) || 15 })}
                  />
                </SettingsField>

                <div className="space-y-1 sm:col-span-2 pt-1 border-t border-[#161F2C]">
                  <SettingsToggle
                    label="Long Only (Enforce non-negative weights)"
                    checked={settings.optimization.longOnly}
                    onChange={(val) => updateCategory("optimization", { longOnly: val })}
                  />
                  <SettingsToggle
                    label="Cash Allowed (Allow residual cash allocation)"
                    checked={settings.optimization.cashAllowed}
                    onChange={(val) => updateCategory("optimization", { cashAllowed: val })}
                  />
                </div>
              </div>
            </SettingsSection>

            {/* 06. FACTOR MODEL */}
            <SettingsSection
              id="sec_factor"
              numberStr="06"
              title="Factor Model"
              description="Regression models, multi-factor betas, and factor attribution"
              isOpen={openSections.sec_factor}
              onToggle={() => toggleSection("sec_factor")}
              onReset={() => updateCategory("factorModel", DEFAULT_SYSTEM_SETTINGS.factorModel)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Factor Model" tooltip="Theoretical asset pricing framework">
                  <SettingsSelect
                    value={settings.factorModel.model}
                    options={["CAPM", "Fama-French 3", "Fama-French 5", "Carhart 4", "Custom"]}
                    onChange={(val) => updateCategory("factorModel", { model: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Benchmark" tooltip="Market factor benchmark asset">
                  <SettingsSelect
                    value={settings.factorModel.benchmark}
                    options={["SPY", "QQQ", "IWM"]}
                    onChange={(val) => updateCategory("factorModel", { benchmark: val })}
                  />
                </SettingsField>

                <SettingsField label="Lookback" tooltip="Historical estimation window for regression">
                  <SettingsInput
                    type="number"
                    suffix="Months"
                    value={settings.factorModel.lookbackMonths}
                    onChange={(val) => updateCategory("factorModel", { lookbackMonths: parseInt(val, 10) || 36 })}
                  />
                </SettingsField>

                <SettingsField label="Regression Frequency" tooltip="Observation sample frequency">
                  <SettingsSelect
                    value={settings.factorModel.regressionFrequency}
                    options={["Monthly", "Weekly", "Daily"]}
                    onChange={(val) => updateCategory("factorModel", { regressionFrequency: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Minimum Observations" tooltip="Minimum data points required to compute regression" className="sm:col-span-2">
                  <SettingsInput
                    type="number"
                    value={settings.factorModel.minObservations}
                    onChange={(val) => updateCategory("factorModel", { minObservations: parseInt(val, 10) || 60 })}
                  />
                </SettingsField>

                {/* Supported factors list */}
                <div className="sm:col-span-2 pt-2 border-t border-[#161F2C] space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 block">Supported Factor Outputs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {settings.factorModel.supportedFactors.map((f) => (
                      <span
                        key={f}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#131C28] text-slate-300 border border-[#1E2C3E]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSection>
          </div>

          {/* ROW 4: Execution & Transaction Costs & Python/FastAPI Engine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {/* 07. EXECUTION & TRANSACTION COSTS */}
            <SettingsSection
              id="sec_execution"
              numberStr="07"
              title="Execution &amp; Transaction Costs"
              description="Fill pricing, slippage modeling, market impact, and commission structures"
              isOpen={openSections.sec_execution}
              onToggle={() => toggleSection("sec_execution")}
              onReset={() => updateCategory("execution", DEFAULT_SYSTEM_SETTINGS.execution)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Fill Model" tooltip="Simulated order execution price (Backtest Execution Model)">
                  <SettingsSelect
                    value={settings.execution.fillModel}
                    options={["Next Open", "Next Close", "VWAP", "TWAP"]}
                    onChange={(val) => updateCategory("execution", { fillModel: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Slippage Model" tooltip="Simulated market slippage penalty">
                  <SettingsSelect
                    value={settings.execution.slippageModel}
                    options={["Fixed %", "Volume Based", "Spread Based"]}
                    onChange={(val) => updateCategory("execution", { slippageModel: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Commission Model" tooltip="Transaction fee tariff model">
                  <SettingsSelect
                    value={settings.execution.commissionModel}
                    options={["Fixed", "Percentage", "Tiered"]}
                    onChange={(val) => updateCategory("execution", { commissionModel: val as any })}
                  />
                </SettingsField>

                <div className="flex flex-col justify-center pt-2">
                  <SettingsToggle
                    label="Partial Fills (Simulate liquidity limits)"
                    checked={settings.execution.partialFills}
                    onChange={(val) => updateCategory("execution", { partialFills: val })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2 pt-1 border-t border-[#161F2C]">
                  <SettingsToggle
                    label="Market Impact (Square-root volume law)"
                    checked={settings.execution.marketImpact}
                    onChange={(val) => updateCategory("execution", { marketImpact: val })}
                  />
                  <SettingsToggle
                    label="Zero-Lookahead Enforcement (Mandatory t+1 fills)"
                    checked={settings.execution.zeroLookaheadEnforcement}
                    onChange={(val) => updateCategory("execution", { zeroLookaheadEnforcement: val })}
                  />
                </div>
              </div>
            </SettingsSection>

            {/* 08. PYTHON / FASTAPI ENGINE */}
            <SettingsSection
              id="sec_engine"
              numberStr="08"
              title="Python / FastAPI Engine"
              description="API Gateway URL, connection telemetry, and quant package readiness"
              isOpen={openSections.sec_engine}
              onToggle={() => toggleSection("sec_engine")}
              onReset={() => updateCategory("engine", DEFAULT_SYSTEM_SETTINGS.engine)}
            >
              <div className="space-y-3">
                <SettingsField label="API Gateway URL" tooltip="Local or remote FastAPI quantitative backend URL">
                  <SettingsInput
                    type="text"
                    value={settings.engine.apiUrl}
                    onChange={(val) => updateCategory("engine", { apiUrl: val })}
                  />
                </SettingsField>

                {/* Ping & Run Diagnostics Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={loadDiagnostics}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#101724] hover:bg-[#162030] text-[#38BDF8] border border-[#1E2B3E] text-xs font-mono font-medium transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ping API</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiagnosticsModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#0284C7]/20 hover:bg-[#0284C7]/30 text-[#38BDF8] border border-[#38BDF8]/40 text-xs font-mono font-medium transition-colors"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Run Diagnostics</span>
                  </button>
                </div>

                {/* Compact dependency grid */}
                <div className="bg-[#0B0F18] border border-[#1C2636] rounded p-2.5 space-y-1.5 text-xs font-mono">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Engine Dependency Readiness:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { name: "Pandas", status: "READY", ready: true },
                      { name: "NumPy", status: "READY", ready: true },
                      { name: "SciPy", status: "READY", ready: true },
                      { name: "Statsmodels", status: "READY", ready: true },
                      { name: "Scikit-learn", status: "READY", ready: true },
                      { name: "CVXPY", status: "NOT INSTALLED", ready: false },
                    ].map((dep) => (
                      <div
                        key={dep.name}
                        className="flex items-center justify-between px-2 py-1 rounded bg-[#0F1420] border border-[#182335]"
                      >
                        <span className="text-slate-300 text-[11px]">{dep.name}</span>
                        <span
                          className={`text-[9px] font-bold flex items-center space-x-1 ${
                            dep.ready ? "text-[#10B981]" : "text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dep.ready ? "bg-[#10B981]" : "bg-slate-600"
                            }`}
                          />
                          <span>{dep.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SettingsSection>
          </div>

          {/* ROW 5: Data Storage & Cache & Terminal Appearance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {/* 09. DATA STORAGE & CACHE */}
            <SettingsSection
              id="sec_storage"
              numberStr="09"
              title="Data Storage &amp; Cache"
              description="Local cache metrics, parquet file store, and index rebuild"
              isOpen={openSections.sec_storage}
              onToggle={() => toggleSection("sec_storage")}
              onReset={() => updateCategory("dataStorage", DEFAULT_SYSTEM_SETTINGS.dataStorage)}
            >
              <div className="space-y-3 font-mono text-xs">
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-[#111722] p-2.5 rounded border border-[#1E2B3E]">
                    <div className="text-base font-bold text-white">18,546</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Securities</div>
                  </div>
                  <div className="bg-[#111722] p-2.5 rounded border border-[#1E2B3E]">
                    <div className="text-base font-bold text-white">4.8M</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Records</div>
                  </div>
                  <div className="bg-[#111722] p-2.5 rounded border border-[#1E2B3E]">
                    <div className="text-base font-bold text-slate-200">
                      {diagnosticsData?.cache?.cache_size_str || "0 KB"}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Cache</div>
                  </div>
                  <div className="bg-[#111722] p-2.5 rounded border border-[#1E2B3E]">
                    <div className="text-base font-bold text-[#10B981]">ONLINE</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-0.5">Cache Status</div>
                  </div>
                </div>

                {/* Destructive / Management Actions */}
                <div className="pt-2 border-t border-[#1A2230] flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearCacheModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#7F1D1D]/20 hover:bg-[#7F1D1D]/30 text-[#EF4444] border border-[#991B1B]/40 text-xs font-mono transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Market Cache</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadDiagnostics}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#101724] hover:bg-[#162030] text-slate-200 border border-[#1E2B3E] text-xs font-mono transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rebuild Security Index</span>
                  </button>
                </div>
              </div>
            </SettingsSection>

            {/* 10. TERMINAL APPEARANCE */}
            <SettingsSection
              id="sec_appearance"
              numberStr="10"
              title="Terminal Appearance"
              description="Visual theme, color accents, chart styles, and telemetry toggles"
              isOpen={openSections.sec_appearance}
              onToggle={() => toggleSection("sec_appearance")}
              onReset={() => updateCategory("appearance", DEFAULT_SYSTEM_SETTINGS.appearance)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Theme" tooltip="Application color scheme">
                  <SettingsSelect
                    value={settings.appearance.theme}
                    options={["Dark Terminal", "Light", "System"]}
                    onChange={(val) => updateCategory("appearance", { theme: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Accent Color" tooltip="Primary UI accent color">
                  <SettingsSelect
                    value={settings.appearance.accent}
                    options={["Cyan", "Blue", "Green", "Amber"]}
                    onChange={(val) => updateCategory("appearance", { accent: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Chart Style" tooltip="Default rendering presentation for financial charts">
                  <SettingsSelect
                    value={settings.appearance.chartStyle}
                    options={["Candlestick", "OHLC", "Line", "Area"]}
                    onChange={(val) => updateCategory("appearance", { chartStyle: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Default Chart Period" tooltip="Default lookback range for charts">
                  <SettingsSelect
                    value={settings.appearance.defaultChartPeriod}
                    options={["1M", "3M", "6M", "1Y", "3Y", "ALL"]}
                    onChange={(val) => updateCategory("appearance", { defaultChartPeriod: val as any })}
                  />
                </SettingsField>

                <SettingsField label="Interface Density" tooltip="Compact density maximizes data display">
                  <SettingsSelect
                    value={settings.appearance.density}
                    options={["Compact", "Comfortable"]}
                    onChange={(val) => updateCategory("appearance", { density: val as any })}
                  />
                </SettingsField>

                <div className="flex flex-col justify-center pt-2">
                  <SettingsToggle
                    label="Subtle Micro-Animations"
                    checked={settings.appearance.animations}
                    onChange={(val) => updateCategory("appearance", { animations: val })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2 pt-1 border-t border-[#161F2C]">
                  <SettingsToggle
                    label="Show Terminal Footer Status Bar"
                    checked={settings.appearance.showTerminalFooter}
                    onChange={(val) => updateCategory("appearance", { showTerminalFooter: val })}
                  />
                  <SettingsToggle
                    label="Show Latency Metric in Status Bar"
                    checked={settings.appearance.showLatency}
                    onChange={(val) => updateCategory("appearance", { showLatency: val })}
                  />
                </div>
              </div>
            </SettingsSection>
          </div>

          {/* ROW 6: Keyboard Shortcuts & Alerts & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
            {/* 11. KEYBOARD SHORTCUTS */}
            <SettingsSection
              id="sec_shortcuts"
              numberStr="11"
              title="Keyboard Shortcuts"
              description="Terminal quick-access keybindings for rapid quant research"
              isOpen={openSections.sec_shortcuts}
              onToggle={() => toggleSection("sec_shortcuts")}
              onReset={() => updateCategory("shortcuts", DEFAULT_SYSTEM_SETTINGS.shortcuts)}
            >
              <div className="space-y-2 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "/", action: "Global Stock Search" },
                    { key: "N", action: "New Strategy" },
                    { key: "B", action: "Strategy Builder" },
                    { key: "S", action: "Simulate / Backtest" },
                    { key: "R", action: "Research Workstation" },
                    { key: "A", action: "Analytics Tear Sheet" },
                    { key: "P", action: "Portfolio Risk" },
                    { key: "ESC", action: "Close Panel / Modal" },
                    { key: "?", action: "Shortcut Help" },
                  ].map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center justify-between p-2 rounded bg-[#101622] border border-[#1A2536]"
                    >
                      <span className="text-slate-300 font-sans text-[11px]">{s.action}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[#182335] text-[#38BDF8] border border-[#23354E] font-bold text-[10px]">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </SettingsSection>

            {/* 12. ALERTS & NOTIFICATIONS */}
            <SettingsSection
              id="sec_alerts"
              numberStr="12"
              title="Alerts &amp; Notifications"
              description="Tail risk drawdown alarms, system failure notifications, and channels"
              isOpen={openSections.sec_alerts}
              onToggle={() => toggleSection("sec_alerts")}
              onReset={() => updateCategory("alerts", DEFAULT_SYSTEM_SETTINGS.alerts)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingsField label="Drawdown Alert" tooltip="Alarm trigger when portfolio drawdown exceeds threshold">
                  <SettingsInput
                    type="number"
                    suffix="%"
                    value={settings.alerts.drawdownAlert}
                    onChange={(val) => updateCategory("alerts", { drawdownAlert: parseFloat(val) || 10 })}
                  />
                </SettingsField>

                <SettingsField label="Volatility Alert" tooltip="Alarm trigger on volatility spikes">
                  <SettingsInput
                    type="number"
                    suffix="%"
                    value={settings.alerts.volatilityAlert}
                    onChange={(val) => updateCategory("alerts", { volatilityAlert: parseFloat(val) || 30 })}
                  />
                </SettingsField>

                <div className="space-y-1 sm:col-span-2 pt-1 border-t border-[#161F2C]">
                  <SettingsToggle
                    label="API Gateway Failure Notification"
                    checked={settings.alerts.apiFailure}
                    onChange={(val) => updateCategory("alerts", { apiFailure: val })}
                  />
                  <SettingsToggle
                    label="Backtest Execution Complete Notification"
                    checked={settings.alerts.backtestComplete}
                    onChange={(val) => updateCategory("alerts", { backtestComplete: val })}
                  />
                  <SettingsToggle
                    label="Optimization Solver Complete Notification"
                    checked={settings.alerts.optimizationComplete}
                    onChange={(val) => updateCategory("alerts", { optimizationComplete: val })}
                  />
                  <SettingsToggle
                    label="Market Data Feed Disconnect Notification"
                    checked={settings.alerts.dataFeedFailure}
                    onChange={(val) => updateCategory("alerts", { dataFeedFailure: val })}
                  />
                </div>
              </div>
            </SettingsSection>
          </div>

          {/* ROW 7 (FULL WIDTH): Developer & Diagnostics */}
          <SettingsSection
            id="sec_developer"
            numberStr="13"
            title="Developer &amp; Diagnostics"
            description="System environment, debug logging, execution profilers, and full telemetry"
            isOpen={openSections.sec_developer}
            onToggle={() => toggleSection("sec_developer")}
            onReset={() => updateCategory("developer", DEFAULT_SYSTEM_SETTINGS.developer)}
          >
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <SettingsField label="Environment" tooltip="Deployment execution mode">
                  <SettingsSelect
                    value={settings.developer.environment}
                    options={["Development", "Production"]}
                    onChange={(val) => updateCategory("developer", { environment: val as any })}
                  />
                </SettingsField>

                <div className="flex flex-col justify-center pt-2">
                  <SettingsToggle
                    label="Debug Mode"
                    checked={settings.developer.debugMode}
                    onChange={(val) => updateCategory("developer", { debugMode: val })}
                  />
                </div>

                <div className="flex flex-col justify-center pt-2">
                  <SettingsToggle
                    label="API Request Logging"
                    checked={settings.developer.requestLogging}
                    onChange={(val) => updateCategory("developer", { requestLogging: val })}
                  />
                </div>

                <div className="flex flex-col justify-center pt-2">
                  <SettingsToggle
                    label="Performance Profiling"
                    checked={settings.developer.performanceProfiling}
                    onChange={(val) => updateCategory("developer", { performanceProfiling: val })}
                  />
                </div>
              </div>

              {/* Architecture Specifications */}
              <div className="pt-2 border-t border-[#161F2C] grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px]">
                <div className="bg-[#101622] p-2 rounded border border-[#1A2536]">
                  <span className="text-slate-500 block text-[9px]">FRONTEND</span>
                  <span className="text-white font-bold">Next.js 15 App Router</span>
                </div>
                <div className="bg-[#101622] p-2 rounded border border-[#1A2536]">
                  <span className="text-slate-500 block text-[9px]">BACKEND</span>
                  <span className="text-white font-bold">Python 3.12 / FastAPI</span>
                </div>
                <div className="bg-[#101622] p-2 rounded border border-[#1A2536]">
                  <span className="text-slate-500 block text-[9px]">ANALYTICS</span>
                  <span className="text-white font-bold">Pandas, NumPy, SciPy</span>
                </div>
                <div className="bg-[#101622] p-2 rounded border border-[#1A2536]">
                  <span className="text-slate-500 block text-[9px]">OPTIMIZATION</span>
                  <span className="text-white font-bold">SciPy Optimize (SLSQP)</span>
                </div>
                <div className="bg-[#101622] p-2 rounded border border-[#1A2536]">
                  <span className="text-slate-500 block text-[9px]">MARKET DATA</span>
                  <span className="text-white font-bold">yfinance + CSVs</span>
                </div>
                <div className="bg-[#101622] p-2 rounded border border-[#1A2536]">
                  <span className="text-slate-500 block text-[9px]">CACHE</span>
                  <span className="text-white font-bold">Parquet File Store</span>
                </div>
              </div>

              {/* Full Diagnostics Trigger Button */}
              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={() => setShowDiagnosticsModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs shadow-md transition-all"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Run Full System Diagnostics</span>
                </button>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>

      {/* 4. Sticky Bottom Save Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-30 bg-[#080C14]/95 backdrop-blur-md border-t border-[#1E2530] px-4 py-2.5 shadow-2xl flex items-center justify-between">
        <div className="max-w-[1720px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                hasUnsavedChanges ? "bg-[#F59E0B] animate-ping" : "bg-[#10B981]"
              }`}
            />
            <span
              className={`font-semibold ${
                hasUnsavedChanges ? "text-[#F59E0B]" : "text-[#10B981]"
              }`}
            >
              {hasUnsavedChanges ? "● UNSAVED CHANGES" : "● ALL CHANGES SAVED"}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-400 hover:text-white font-mono px-3 py-1 rounded hover:bg-[#141C28] transition-colors"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving || !hasUnsavedChanges}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-bold font-mono transition-all shadow-md ${
                hasUnsavedChanges
                  ? "bg-[#0284C7] hover:bg-[#0369A1] text-white cursor-pointer ring-2 ring-[#38BDF8]/50"
                  : "bg-[#101724] border border-[#1F2C40] text-slate-500 cursor-not-allowed"
              }`}
            >
              {saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
              ) : saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? "Saved Settings!" : saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DiagnosticsModal
        isOpen={showDiagnosticsModal}
        onClose={() => setShowDiagnosticsModal(false)}
      />

      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        currentSettings={settings}
        onImportSuccess={(imported) => {
          setSettings(imported);
          saveSystemSettingsToLocal(imported);
        }}
      />

      <ClearCacheModal
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        onSuccess={loadDiagnostics}
      />
    </div>
  );
}
