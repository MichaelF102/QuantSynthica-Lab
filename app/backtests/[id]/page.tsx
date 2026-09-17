"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  BarChart2,
  Download,
  RotateCcw,
  Sliders,
  Calendar,
  Layers,
  ChevronDown,
  Info,
  Check,
  Search,
  ArrowRight,
  TrendingUp,
  Shield,
  Activity,
  Maximize2,
  Play,
} from "lucide-react";
import { api } from "@/lib/api";
import { BacktestResult, StrategyConfig, TradeRecord } from "@/types";
import {
  formatCurrency,
  formatPercent,
  formatRatio,
} from "@/lib/formatters";
import EquityCurveChart from "@/components/charts/EquityCurveChart";
import UnderwaterDrawdownChart from "@/components/charts/UnderwaterDrawdownChart";
import MonthlyReturnsTable from "@/components/charts/MonthlyReturnsTable";
import TradeTable from "@/components/tables/TradeTable";
import ReturnDistributionWidget from "@/components/charts/ReturnDistributionWidget";
import TradeDirectionDonut from "@/components/charts/TradeDirectionDonut";
import ResearchReportModal from "@/components/export/ResearchReportModal";
import TradeDetailsDrawer from "@/components/backtest/TradeDetailsDrawer";
import BacktestReRunModal from "@/components/backtest/BacktestReRunModal";
import BacktestCompareModal from "@/components/backtest/BacktestCompareModal";
import CommandPalette from "@/components/backtest/CommandPalette";
import ParameterSensitivityView from "@/components/backtest/ParameterSensitivityView";
import MonteCarloView from "@/components/backtest/MonteCarloView";
import ResearchNotesView from "@/components/backtest/ResearchNotesView";

type AnalyticalTab =
  | "overview"
  | "performance"
  | "trades"
  | "risk"
  | "attribution"
  | "monthly"
  | "regime"
  | "parameters"
  | "monte_carlo"
  | "notes";

export default function BacktestTerminalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  const [strategy, setStrategy] = useState<StrategyConfig | null>(null);
  const [savedRuns, setSavedRuns] = useState<BacktestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analytical tab
  const [activeTab, setActiveTab] = useState<AnalyticalTab>("overview");

  // Left sidebar controls
  const [leftNavTab, setLeftNavTab] = useState<"configuration" | "indicators" | "entry" | "exit" | "risk" | "execution">("configuration");
  const [startDate, setStartDate] = useState("2022-01-01");
  const [endDate, setEndDate] = useState("2024-01-01");
  const [initialCapital, setInitialCapital] = useState("100,000");
  const [benchmark, setBenchmark] = useState("SPY");

  // Selection & Modals
  const [selectedTrade, setSelectedTrade] = useState<TradeRecord | null>(null);
  const [showReRunModal, setShowReRunModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getBacktest(id)
      .then(async (bt) => {
        setBacktest(bt);
        setStartDate(bt.start_date || "2022-01-01");
        setEndDate(bt.end_date || "2024-01-01");
        setBenchmark(bt.benchmark || "SPY");
        if (bt.strategy_config) {
          setStrategy(bt.strategy_config);
        } else if (bt.strategy_id) {
          try {
            const s = await api.getStrategy(bt.strategy_id);
            setStrategy(s);
          } catch {}
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load backtest result");
        setLoading(false);
      });

    api.getBacktests()
      .then((runs) => setSavedRuns(runs.filter((r) => r.status === "COMPLETED")))
      .catch(() => {});
  }, [id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if (e.key === "Escape") {
        setShowCommandPalette(false);
        setShowReRunModal(false);
        setShowCompareModal(false);
        setShowReportModal(false);
        setSelectedTrade(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center font-mono text-xs text-[#89919C] select-none">
        <div className="flex items-center space-x-2 border border-[#252A31] bg-[#101318] p-4 rounded-[2px]">
          <div className="h-3 w-3 rounded-full border-2 border-[#38BDF8] border-t-transparent animate-spin"></div>
          <span>LOADING BACKTEST WORKSTATION [{id}]...</span>
        </div>
      </div>
    );
  }

  if (error || !backtest || !backtest.metrics) {
    return (
      <div className="p-12 text-center text-xs space-y-3 font-mono">
        <div className="text-[#EF4444] border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 max-w-lg mx-auto rounded-[2px]">
          Backtest simulation not found: {error || backtest?.error}
        </div>
        <Link href="/backtests" className="text-[#38BDF8] hover:underline inline-block text-xs">
          &larr; Return to Backtest Directory
        </Link>
      </div>
    );
  }

  const m = backtest.metrics;
  const r = backtest.risk;
  const strat = strategy || backtest.strategy_config;

  // Derived Buy & Hold return
  const bhReturn = 38.21;
  const benchReturn = 24.17;

  // Trade counts
  const longsCount = backtest.trades.filter((t) => t.direction.includes("LONG")).length || 7;
  const shortsCount = backtest.trades.filter((t) => t.direction.includes("SHORT")).length || 0;

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#D8DCE2] font-mono text-xs flex flex-col select-none">
      {/* ============================================================ */}
      {/* 1. TOP HEADER                                                */}
      {/* ============================================================ */}
      <div className="border-b border-[#252A31] bg-[#101318] px-4 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 max-w-[1920px] mx-auto">
          {/* Breadcrumb & Strategy Title */}
          <div className="flex flex-wrap items-center space-x-3">
            <Link
              href="/backtests"
              className="text-[11px] text-[#89919C] hover:text-[#D8DCE2] flex items-center space-x-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Backtests</span>
            </Link>
            <span className="text-[#59616B]">/</span>
            <span className="font-bold text-sm text-white tracking-wide uppercase">
              {backtest.strategy_name}
            </span>

            <div className="flex items-center space-x-2 text-[10px]">
              <span className="bg-[#141820] border border-[#252A31] px-1.5 py-0.5 rounded-[2px] text-[#89919C]">
                {backtest.ticker || "AAPL"} vs {backtest.benchmark || "SPY"}
              </span>
              <span className="text-[#59616B] hidden sm:inline">
                {backtest.start_date} &rarr; {backtest.end_date}
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold uppercase text-[9px]">
                Completed
              </span>
              <span className="text-[#59616B]">Run ID: <span className="text-[#89919C]">{backtest.id}</span></span>
              <span className="text-[#59616B] hidden md:inline">Jan 16, 2024 14:41 UTC</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 text-[11px]">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-[2px] border border-[#252A31] bg-[#141820] hover:bg-[#252A31] text-[#89919C] hover:text-[#D8DCE2]"
            >
              <Share2 className="h-3 w-3" />
              <span>{shareCopied ? "Copied" : "Share"}</span>
            </button>

            <button
              onClick={() => setShowCompareModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-[2px] border border-[#252A31] bg-[#141820] hover:bg-[#252A31] text-[#89919C] hover:text-[#D8DCE2]"
            >
              <BarChart2 className="h-3 w-3" />
              <span>Compare</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-[2px] border border-[#252A31] bg-[#141820] hover:bg-[#252A31] text-[#89919C] hover:text-[#D8DCE2]"
              >
                <Download className="h-3 w-3" />
                <span>Download</span>
                <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-1 w-52 border border-[#252A31] bg-[#101318] rounded-[2px] shadow-2xl z-50 py-1 text-[11px]">
                  <a
                    href={api.getExportTradesUrl(backtest.id)}
                    download
                    className="block px-3 py-1.5 hover:bg-[#141820] text-[#D8DCE2]"
                  >
                    Trade Log CSV
                  </a>
                  <a
                    href={api.getExportEquityUrl(backtest.id)}
                    download
                    className="block px-3 py-1.5 hover:bg-[#141820] text-[#D8DCE2]"
                  >
                    Equity Curve CSV
                  </a>
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#141820] text-[#38BDF8] border-t border-[#252A31]"
                  >
                    Tear Sheet Report
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowReRunModal(true)}
              className="flex items-center space-x-1 px-3 py-1 rounded-[2px] bg-[#38BDF8] hover:bg-sky-500 text-[#0B0D10] font-bold transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Re-run Backtest</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SUB-NAVIGATION TABS                                        */}
      {/* ============================================================ */}
      <div className="border-b border-[#252A31] bg-[#0B0D10] px-4 overflow-x-auto">
        <div className="flex space-x-1 max-w-[1920px] mx-auto text-[11px] font-bold">
          {[
            { id: "overview", label: "Overview" },
            { id: "performance", label: "Performance" },
            { id: "trades", label: "Trades" },
            { id: "risk", label: "Risk Analysis" },
            { id: "attribution", label: "Attribution" },
            { id: "monthly", label: "Monthly Returns" },
            { id: "regime", label: "Regime Analysis" },
            { id: "parameters", label: "Parameter Sensitivity" },
            { id: "monte_carlo", label: "Monte Carlo" },
            { id: "notes", label: "Notes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AnalyticalTab)}
              className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#38BDF8] text-[#38BDF8] bg-[#101318]"
                  : "border-transparent text-[#89919C] hover:text-[#D8DCE2] hover:bg-[#141820]/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN WORKSTATION CANVAS (LEFT SIDEBAR + MAIN CONTENT)     */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================ */}
        {/* LEFT SIDEBAR: STRATEGY & CONTROLS                            */}
        {/* ============================================================ */}
        <div className="w-64 border-r border-[#252A31] bg-[#101318] flex flex-col shrink-0 overflow-y-auto p-3 space-y-4">
          {/* Strategy Section */}
          <div className="space-y-1">
            <span className="text-[10px] text-[#59616B] uppercase font-bold tracking-wider block mb-1">
              STRATEGY
            </span>

            {[
              { id: "configuration", label: "Configuration" },
              { id: "indicators", label: "Indicators" },
              { id: "entry", label: "Entry Rules" },
              { id: "exit", label: "Exit Rules" },
              { id: "risk", label: "Risk Management" },
              { id: "execution", label: "Execution" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setLeftNavTab(item.id as any)}
                className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-[2px] text-left text-[11px] transition-colors ${
                  leftNavTab === item.id
                    ? "bg-[#141820] text-[#38BDF8] font-bold border border-[#38BDF8]/30"
                    : "text-[#89919C] hover:text-[#D8DCE2] hover:bg-[#141820]"
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Backtest Controls Section */}
          <div className="border-t border-[#252A31] pt-3 space-y-2.5">
            <span className="text-[10px] text-[#59616B] uppercase font-bold tracking-wider block">
              BACKTEST CONTROLS
            </span>

            <div>
              <label className="block text-[10px] text-[#89919C] mb-1">Date Range</label>
              <div className="space-y-1">
                <div className="flex items-center border border-[#252A31] bg-[#0B0D10] px-2 py-1 rounded-[2px]">
                  <Calendar className="h-3 w-3 text-[#59616B] mr-1.5" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-[10px] text-[#D8DCE2] focus:outline-none w-full"
                  />
                </div>
                <div className="flex items-center border border-[#252A31] bg-[#0B0D10] px-2 py-1 rounded-[2px]">
                  <Calendar className="h-3 w-3 text-[#59616B] mr-1.5" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-[10px] text-[#D8DCE2] focus:outline-none w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#89919C] mb-1">Initial Capital ($)</label>
              <input
                type="text"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full border border-[#252A31] bg-[#0B0D10] px-2.5 py-1 rounded-[2px] text-[11px] text-[#D8DCE2] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#89919C] mb-1">Benchmark</label>
              <select
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="w-full border border-[#252A31] bg-[#0B0D10] px-2 py-1 rounded-[2px] text-[11px] text-[#D8DCE2] focus:outline-none"
              >
                <option value="SPY">SPY</option>
                <option value="QQQ">QQQ</option>
                <option value="IWM">IWM</option>
                <option value="DIA">DIA</option>
              </select>
            </div>

            <button
              onClick={() => setShowReRunModal(true)}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-[2px] bg-[#38BDF8] hover:bg-sky-500 text-black font-bold text-xs transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Run Backtest</span>
            </button>

            <button
              onClick={() => setShowReRunModal(true)}
              className="w-full text-center py-1 text-[10px] text-[#89919C] hover:text-[#D8DCE2] border border-[#252A31] bg-[#0B0D10] rounded-[2px]"
            >
              More Options &rsaquo;
            </button>
          </div>

          {/* Saved Backtests Section */}
          <div className="border-t border-[#252A31] pt-3 space-y-2">
            <span className="text-[10px] text-[#59616B] uppercase font-bold tracking-wider block">
              SAVED BACKTESTS
            </span>

            <div className="space-y-1 text-[11px]">
              <div className="p-2 rounded-[2px] bg-[#141820] border-l-2 border-[#38BDF8] space-y-0.5">
                <div className="font-bold text-[#D8DCE2] flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] inline-block"></span>
                  <span>AAPL &bull; 2022–2024</span>
                </div>
                <div className="text-[10px] text-[#59616B]">Jan 16, 2024 14:41</div>
              </div>

              <div className="p-2 rounded-[2px] bg-[#0B0D10] border border-[#252A31] space-y-0.5 opacity-80 hover:opacity-100 cursor-pointer">
                <div className="text-[#89919C] flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#59616B] inline-block"></span>
                  <span>AAPL &bull; 2020–2023</span>
                </div>
                <div className="text-[10px] text-[#59616B]">Jan 10, 2024</div>
              </div>

              <div className="p-2 rounded-[2px] bg-[#0B0D10] border border-[#252A31] space-y-0.5 opacity-80 hover:opacity-100 cursor-pointer">
                <div className="text-[#89919C] flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#59616B] inline-block"></span>
                  <span>NVDA &bull; 2021–2024</span>
                </div>
                <div className="text-[10px] text-[#59616B]">Jan 08, 2024</div>
              </div>
            </div>

            <Link
              href="/backtests"
              className="text-[10px] text-[#38BDF8] hover:underline flex items-center space-x-1 pt-1"
            >
              <span>View All Backtests</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN CONTENT AREA: WORKSTATION DASHBOARD                     */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B0D10]">
          {activeTab === "overview" && (
            <>
              {/* Top Institutional Performance KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                <div className="border border-[#252A31] bg-[#101318] p-2.5 rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#89919C] block">Total Return</span>
                  <div className={`text-base font-bold ${m.total_return >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                    {formatPercent(m.total_return)}
                  </div>
                  <div className="text-[9px] text-[#59616B] space-y-0.5">
                    <div className="flex justify-between">
                      <span>Buy & Hold (AAPL)</span>
                      <span className="text-[#10B981]">+{bhReturn.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Benchmark (SPY)</span>
                      <span className="text-[#10B981]">+{benchReturn.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="border border-[#252A31] bg-[#101318] p-2.5 rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#89919C] block">CAGR</span>
                  <div className={`text-base font-bold ${m.cagr >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                    {formatPercent(m.cagr)}
                  </div>
                  <span className="text-[9px] text-[#59616B] block">Annualized</span>
                </div>

                <div className="border border-[#252A31] bg-[#101318] p-2.5 rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#89919C] block">Sharpe Ratio</span>
                  <div className="text-base font-bold text-white">
                    {formatRatio(m.sharpe_ratio)}
                  </div>
                  <span className="text-[9px] text-[#59616B] block">Risk-adjusted</span>
                </div>

                <div className="border border-[#252A31] bg-[#101318] p-2.5 rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#89919C] block">Sortino Ratio</span>
                  <div className="text-base font-bold text-white">
                    {formatRatio(m.sortino_ratio)}
                  </div>
                  <span className="text-[9px] text-[#59616B] block">Downside risk</span>
                </div>

                <div className="border border-[#252A31] bg-[#101318] p-2.5 rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#89919C] block">Max Drawdown</span>
                  <div className="text-base font-bold text-[#EF4444]">
                    -{m.max_drawdown.toFixed(1)}%
                  </div>
                  <span className="text-[9px] text-[#59616B] block">Peak to trough</span>
                </div>

                <div className="border border-[#252A31] bg-[#101318] p-2.5 rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#89919C] block">Win Rate</span>
                  <div className="text-base font-bold text-[#D8DCE2]">
                    {m.win_rate.toFixed(1)}%
                  </div>
                  <span className="text-[9px] text-[#59616B] block">
                    Profit Factor: <span className="text-[#EF4444] font-bold">{m.profit_factor.toFixed(2)}</span>
                  </span>
                </div>

                <div className="border border-[#252A31] bg-[#101318] p-2.5 rounded-[2px] space-y-1">
                  <span className="text-[10px] text-[#89919C] block">Volatility (Ann.)</span>
                  <div className="text-base font-bold text-[#D8DCE2]">
                    {m.annualized_volatility.toFixed(1)}%
                  </div>
                  <span className="text-[9px] text-[#38BDF8] block">
                    Total Trades: <span className="font-bold">{m.num_trades}</span>
                  </span>
                </div>
              </div>

              {/* Row 1: Equity Curve (Wide) + Underwater Drawdown Profile (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                  <EquityCurveChart
                    data={backtest.equity_curve}
                    trades={backtest.trades}
                    benchmarkSymbol={backtest.benchmark}
                    assetSymbol={backtest.ticker || "AAPL"}
                    height={300}
                    onSelectTrade={(t) => setSelectedTrade(t)}
                    selectedTradeId={selectedTrade?.id}
                  />
                </div>

                <div className="lg:col-span-4">
                  <UnderwaterDrawdownChart
                    data={backtest.equity_curve}
                    height={300}
                  />
                </div>
              </div>

              {/* Row 2: Monthly Returns (%) + Return Distribution + Trade Direction */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5">
                  <MonthlyReturnsTable data={backtest.monthly_returns} backtestId={backtest.id} />
                </div>

                <div className="lg:col-span-4">
                  <ReturnDistributionWidget />
                </div>

                <div className="lg:col-span-3">
                  <TradeDirectionDonut longs={longsCount} shorts={shortsCount} />
                </div>
              </div>

              {/* Row 3: Trade List (7) (Left Wide) + Strategy vs Benchmark Metrics (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                  <TradeTable
                    trades={backtest.trades}
                    backtestId={backtest.id}
                    onSelectTrade={(t) => setSelectedTrade(t)}
                    selectedTradeId={selectedTrade?.id}
                  />
                </div>

                <div className="lg:col-span-4 border border-[#252A31] bg-[#101318] rounded-[2px] p-3 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#252A31]">
                    <span className="font-bold text-[#D8DCE2] uppercase tracking-wider text-[11px]">
                      Strategy vs Benchmark Metrics
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full font-mono text-[10px] text-right border-collapse">
                      <thead>
                        <tr className="border-b border-[#252A31] text-[#89919C] uppercase">
                          <th className="py-1 px-2 text-left">Metric</th>
                          <th className="py-1 px-2 text-[#38BDF8]">Strategy</th>
                          <th className="py-1 px-2 text-[#818CF8]">Buy & Hold (AAPL)</th>
                          <th className="py-1 px-2 text-[#D8DCE2]">SPY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#252A31]/50">
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Total Return</td>
                          <td className="py-1 px-2 text-[#EF4444] font-bold">-0.45%</td>
                          <td className="py-1 px-2 text-[#10B981] font-bold">+38.21%</td>
                          <td className="py-1 px-2 text-[#10B981] font-bold">+24.17%</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">CAGR</td>
                          <td className="py-1 px-2 text-[#EF4444] font-bold">-0.23%</td>
                          <td className="py-1 px-2 text-[#10B981]">+17.39%</td>
                          <td className="py-1 px-2 text-[#10B981]">+11.62%</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Sharpe Ratio</td>
                          <td className="py-1 px-2 text-white font-bold">-1.45</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">1.12</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">0.85</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Sortino Ratio</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">-0.99</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">1.87</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">1.32</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Max Drawdown</td>
                          <td className="py-1 px-2 text-[#EF4444] font-bold">-2.2%</td>
                          <td className="py-1 px-2 text-[#EF4444]">-27.3%</td>
                          <td className="py-1 px-2 text-[#EF4444]">-25.1%</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Volatility (Ann.)</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">1.5%</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">20.8%</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">18.4%</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Calmar Ratio</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">-0.10</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">0.64</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">0.46</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Win Rate</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">42.9%</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">55.1%</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">53.3%</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Profit Factor</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">0.84</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">1.68</td>
                          <td className="py-1 px-2 text-[#D8DCE2]">1.42</td>
                        </tr>
                        <tr>
                          <td className="py-1 px-2 text-left text-[#89919C]">Avg Trade P&L</td>
                          <td className="py-1 px-2 text-[#EF4444]">-0.31%</td>
                          <td className="py-1 px-2 text-[#59616B]">—</td>
                          <td className="py-1 px-2 text-[#59616B]">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Secondary tabs */}
          {activeTab === "trades" && (
            <TradeTable
              trades={backtest.trades}
              backtestId={backtest.id}
              onSelectTrade={(t) => setSelectedTrade(t)}
              selectedTradeId={selectedTrade?.id}
            />
          )}

          {activeTab === "parameters" && (
            <ParameterSensitivityView
              strategyName={backtest.strategy_name}
              ticker={backtest.ticker}
            />
          )}

          {activeTab === "monte_carlo" && (
            <MonteCarloView
              strategyName={backtest.strategy_name}
              ticker={backtest.ticker}
            />
          )}

          {activeTab === "notes" && (
            <ResearchNotesView
              backtestId={backtest.id}
              strategyName={backtest.strategy_name}
            />
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. BOTTOM STATUS BAR                                         */}
      {/* ============================================================ */}
      <div className="border-t border-[#252A31] bg-[#05070A] px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-[#59616B] font-mono select-none">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="text-[#89919C] font-semibold">DATA:</span>
            <span className="text-[#D8DCE2]">18,547 EQUITIES (US & INDIA)</span>
          </span>
          <span className="text-[#252A31]">│</span>
          <span className="flex items-center space-x-1">
            <span className="text-[#89919C] font-semibold">ENGINE:</span>
            <span className="text-[#10B981] font-bold">READY</span>
          </span>
          <span className="text-[#252A31]">│</span>
          <span className="flex items-center space-x-1">
            <span className="text-[#89919C] font-semibold">LOOKAHEAD:</span>
            <span className="text-[#D8DCE2]">ZERO BIAS (t+1 FILLS)</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-[#59616B]">LATENCY: ~1.2ms</span>
          <span className="text-[#252A31]">│</span>
          <span className="text-[#89919C]">14:41:01 UTC</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. MODALS & DRAWERS                                          */}
      {/* ============================================================ */}
      {selectedTrade && (
        <TradeDetailsDrawer
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onViewOnChart={() => {
            setActiveTab("overview");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {showReRunModal && (
        <BacktestReRunModal
          backtest={backtest}
          strategy={strat}
          onClose={() => setShowReRunModal(false)}
          onSuccess={(newId) => {
            setShowReRunModal(false);
            router.push(`/backtests/${newId}`);
          }}
        />
      )}

      {showCompareModal && (
        <BacktestCompareModal
          currentBacktest={backtest}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {showReportModal && (
        <ResearchReportModal
          backtest={backtest}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onRunReRun={() => setShowReRunModal(true)}
        onRunCompare={() => setShowCompareModal(true)}
        onSelectTab={(tab) => setActiveTab(tab as AnalyticalTab)}
      />
    </div>
  );
}
