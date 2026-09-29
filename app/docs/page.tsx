import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, ShieldCheck, Database, TrendingUp, Cpu, Sliders, ExternalLink } from "lucide-react";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Platform Documentation — QuantSynthicaLab",
  description: "Comprehensive documentation covering data ingestion, 0-lookahead backtesting, risk models, and portfolio optimization engines.",
  openGraph: {
    title: "Platform Documentation — QuantSynthicaLab",
    description: "System architecture, data pipeline, backtest mechanics, and risk methodology of QuantSynthicaLab.",
    images: [{ url: "/branding/quantsynthicalab-logo.png", width: 1024, height: 682, alt: "QuantSynthicaLab Documentation" }],
  },
};

export default function DocsPage() {
  const SECTIONS = [
    {
      id: "data-pipeline",
      title: "1. Dual-Market Data Ingestion Engine",
      icon: Database,
      content:
        "QuantSynthicaLab streams high-fidelity adjusted price action for both US equities (NYSE, NASDAQ) and Indian blue-chips (NSE, BSE). The system accounts for stock splits, dividend distributions, and multi-currency denominations (USD vs INR) with automated temporal normalization.",
      tags: ["Adjusted OHLCV", "NSE / BSE Indices", "S&P 500", "Zero Missing Bars"],
    },
    {
      id: "backtesting-engine",
      title: "2. Zero-Lookahead Backtest Mechanics",
      icon: Layers,
      content:
        "Every algorithmic backtest strictly computes signals on candle close (t) and executes orders at the subsequent bar's open price (t+1). Simulations model realistic execution friction including configurable basis-point commissions, bid-ask spread slippage, and position sizing constraints.",
      tags: ["Next-Open Fills", "Slippage Friction", "0 Lookahead Bias", "Max Drawdown"],
    },
    {
      id: "factor-library",
      title: "3. Quantitative Factor & Technical Indicators",
      icon: TrendingUp,
      content:
        "The quantitative engine calculates multi-horizon moving averages (SMA, EMA), momentum oscillators (RSI, Stochastics, MACD), statistical volatility bands (Bollinger, ATR, Historical Volatility), and cross-sectional momentum ranking across user-selected universes.",
      tags: ["Momentum Factors", "Mean Reversion", "Z-Score Spreads", "Volatility Bands"],
    },
    {
      id: "risk-observatory",
      title: "4. Institutional Risk Analytics & Heavy Tails",
      icon: ShieldCheck,
      content:
        "Risk models assess parametric and non-parametric Value at Risk (VaR 95% & 99%), Conditional Value at Risk (CVaR / Expected Shortfall), multi-horizon drawdown depth, underwater recovery duration, and historical tail-loss distributions under market stress.",
      tags: ["Parametric VaR", "Expected Shortfall (CVaR)", "Underwater Plots", "Tail Shocks"],
    },
    {
      id: "portfolio-optimization",
      title: "5. Markowitz & Quadratic Covariance Optimization",
      icon: Sliders,
      content:
        "Portfolio construction algorithms synthesize asset returns and calculate full empirical covariance matrices. The optimizer computes the Markowitz efficient frontier, max Sharpe portfolio weights, and minimum volatility allocations under non-negative and sector budget constraints.",
      tags: ["Efficient Frontier", "Covariance Matrices", "Sharpe Maximization", "Budget Bounds"],
    },
    {
      id: "backend-api",
      title: "6. REST Quantitative Engine API",
      icon: Cpu,
      content:
        "The backend service provides high-throughput FastAPI endpoints for real-time market data retrieval, vectorized backtest execution, Monte Carlo iterations, and factor signal queries. Fully decoupled from the client for institutional scalability.",
      tags: ["FastAPI Service", "Vectorized NumPy / Pandas", "JSON Schemas", "Async Endpoints"],
    },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50/60 dark:bg-[#070D18] text-slate-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#1769FF] dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to QuantSynthicaLab</span>
          </Link>

          <Link
            href="/research"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769FF] dark:text-blue-400 hover:underline"
          >
            <span>Launch Research Terminal</span>
            <span>→</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="max-w-2xl mb-12">
          <span className="rounded-md bg-[#1769FF]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:bg-blue-500/10 dark:text-blue-400">
            SYSTEM ARCHITECTURE &amp; METHODOLOGY
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Platform Documentation
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Technical specifications, execution modeling assumptions, and mathematical formulations powering the QuantSynthicaLab research lab.
          </p>
        </div>

        {/* Documentation Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                id={sec.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-7 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-[#1769FF] dark:text-blue-400 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {sec.title}
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {sec.content}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                  {sec.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Reference Callout */}
        <div className="mt-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Looking for Strategy Exploration?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Jump straight into live charting, backtesting benchmarks, and cross-asset correlation models.
            </p>
          </div>
          <Link
            href="/research"
            className="rounded-lg bg-[#1769FF] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors shrink-0"
          >
            Open Research Workspace →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
