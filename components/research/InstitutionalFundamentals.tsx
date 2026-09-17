"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Globe,
  Database,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Scale,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Award,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { StockFundamentals } from "@/types";

interface InstitutionalFundamentalsProps {
  fundamentals: StockFundamentals | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function InstitutionalFundamentals({
  fundamentals,
  loading = false,
  onRefresh,
}: InstitutionalFundamentalsProps) {
  const [showFullSummary, setShowFullSummary] = useState(false);

  if (loading && !fundamentals) {
    return (
      <div className="border border-[#252A31] bg-[#0B0D10] p-12 text-center text-xs font-mono text-[#89919C] space-y-3">
        <RefreshCw className="h-6 w-6 text-[#38BDF8] animate-spin mx-auto" />
        <p className="tracking-wider uppercase text-white font-bold">
          Aggregating Institutional Fundamentals...
        </p>
        <p className="text-[11px] text-[#59616B]">
          Querying TradingView Screener, Yahoo Finance & QuantSynthica Universe
        </p>
      </div>
    );
  }

  if (!fundamentals) {
    return (
      <div className="border border-[#252A31] bg-[#0B0D10] p-8 text-center text-xs font-mono text-[#89919C]">
        No fundamental profile data available for this security.
      </div>
    );
  }

  const f = fundamentals;
  const currSym = f.currency_symbol || (f.market === "India" ? "₹" : "$");

  // Calculate 52W position percentage
  const low52 = f.low_52w || 0;
  const high52 = f.high_52w || 0;
  const curPrice = f.price || 0;
  let pos52 = 50;
  if (high52 > low52 && curPrice >= low52) {
    pos52 = Math.min(100, Math.max(0, ((curPrice - low52) / (high52 - low52)) * 100));
  }

  // Piotroski color
  const pScore = f.piotroski_score ?? 6;
  const pColor =
    pScore >= 7
      ? "text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10"
      : pScore >= 4
      ? "text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10"
      : "text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10";

  // Altman Z Color
  const zScore = f.altman_z_score ?? 2.5;
  const zColor =
    zScore >= 2.99
      ? "text-[#10B981]"
      : zScore >= 1.81
      ? "text-[#F59E0B]"
      : "text-[#EF4444]";

  return (
    <div className="space-y-4 font-mono select-none text-xs">
      {/* 1. Header Banner & Data Sources */}
      <div className="border border-[#252A31] bg-[#0E1117] rounded-[2px] p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-white tracking-wide uppercase">
              INSTITUTIONAL QUANTITATIVE FUNDAMENTALS & MULTI-TIER VALUATION
            </span>
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#252A31] text-[#38BDF8] text-[10px] font-bold">
              {f.clean_symbol}
            </span>
          </div>
          <p className="text-[11px] text-[#59616B] mt-0.5">
            Synchronized valuation multiples, financial statements TTM, capital allocation & solvency analysis
          </p>
        </div>

        {/* Data Sources Badges */}
        <div className="flex items-center flex-wrap gap-2 text-[10px]">
          {f.data_sources.map((src) => (
            <span
              key={src}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[2px] bg-[#141820] border border-[#252A31] text-[#89919C]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>{src}</span>
            </span>
          ))}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-2 py-0.5 rounded-[2px] bg-[#1C212B] hover:bg-[#252A31] text-[#D8DCE2] border border-[#252A31] transition-colors flex items-center space-x-1 cursor-pointer"
              title="Refresh fundamentals telemetry"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-[#38BDF8]" : ""}`} />
              <span>SYNC</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive Overview & Business Model */}
      <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#252A31] pb-2">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-[#38BDF8]" />
            <span className="font-bold text-xs text-white uppercase tracking-wider">
              {f.name} ({f.clean_symbol})
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] font-bold">
              {f.exchange} &bull; {f.market}
            </span>
          </div>

          <div className="text-[11px] text-[#89919C]">
            ISIN: <span className="text-white font-mono">{f.isin || "N/A"}</span>
          </div>
        </div>

        {/* Long Business Description */}
        <div className="text-xs text-[#89919C] leading-relaxed font-sans">
          <p className={showFullSummary ? "" : "line-clamp-2"}>
            {f.summary}
          </p>
          {f.summary && f.summary.length > 180 && (
            <button
              onClick={() => setShowFullSummary(!showFullSummary)}
              className="text-[#38BDF8] hover:underline text-[11px] font-mono mt-1 flex items-center space-x-0.5 cursor-pointer"
            >
              <span>{showFullSummary ? "COLLAPSE OVERVIEW" : "READ FULL BUSINESS OVERVIEW"}</span>
              {showFullSummary ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Quick Tag Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1 border-t border-[#252A31]/60 text-[11px]">
          <div>
            <span className="text-[#59616B] block text-[10px] uppercase">Sector</span>
            <span className="text-[#D8DCE2] font-medium truncate block">{f.sector}</span>
          </div>
          <div>
            <span className="text-[#59616B] block text-[10px] uppercase">Industry</span>
            <span className="text-[#D8DCE2] font-medium truncate block">{f.industry}</span>
          </div>
          <div>
            <span className="text-[#59616B] block text-[10px] uppercase">Reported Currency</span>
            <span className="text-[#D8DCE2] font-medium">{f.currency} ({currSym})</span>
          </div>
          <div>
            <span className="text-[#59616B] block text-[10px] uppercase">1Y Market Beta</span>
            <span className="text-[#D8DCE2] font-bold">{f.beta ? f.beta.toFixed(2) : "1.00"}</span>
          </div>
          <div>
            <span className="text-[#59616B] block text-[10px] uppercase">Current Price</span>
            <span className="text-white font-bold">{currSym}{f.price ? f.price.toFixed(2) : "—"}</span>
          </div>
          <div>
            <span className="text-[#59616B] block text-[10px] uppercase">1D Price Movement</span>
            <span className={`font-bold ${(f.change_1d || 0) >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {(f.change_1d || 0) >= 0 ? "+" : ""}{f.change_1d ? f.change_1d.toFixed(2) : "0.00"}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. 52-Week Range & Price Momentum Bar */}
      <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[11px] uppercase tracking-wider text-[#89919C]">
            52-Week Trading Range & Cycle Position
          </span>
          <div className="space-x-3 text-[11px]">
            <span className="text-[#89919C]">
              From 52W Low:{" "}
              <span className="text-[#10B981] font-bold">
                {f.pct_from_52w_low !== null && f.pct_from_52w_low !== undefined ? `+${f.pct_from_52w_low}%` : "—"}
              </span>
            </span>
            <span className="text-[#89919C]">
              To 52W High:{" "}
              <span className="text-[#EF4444] font-bold">
                {f.pct_to_52w_high !== null && f.pct_to_52w_high !== undefined ? `${f.pct_to_52w_high}%` : "—"}
              </span>
            </span>
          </div>
        </div>

        {/* Visual Slider Bar */}
        <div className="relative pt-1 pb-1">
          <div className="w-full bg-[#1A2230] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#10B981] h-full"
              style={{ width: "100%" }}
            />
          </div>
          {/* Current position marker */}
          <div
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${pos52}%` }}
          >
            <div className="w-2.5 h-4 bg-white border border-black rounded-[1px] shadow-md" />
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-[#59616B] font-mono">
          <span>52W Low: <strong className="text-slate-300">{currSym}{f.low_52w?.toFixed(2) || "—"}</strong></span>
          <span className="text-[#38BDF8] font-bold">Current: {currSym}{f.price?.toFixed(2) || "—"}</span>
          <span>52W High: <strong className="text-slate-300">{currSym}{f.high_52w?.toFixed(2) || "—"}</strong></span>
        </div>
      </div>

      {/* 4. Valuation Multiples Grid */}
      <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#252A31] pb-2">
          <div className="flex items-center space-x-1.5">
            <Scale className="h-4 w-4 text-[#F59E0B]" />
            <span className="font-bold text-xs text-white uppercase tracking-wider">
              Core Valuation Multiples
            </span>
          </div>
          <span className="text-[10px] text-[#59616B]">TTM & FORWARD PROJECTIONS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Market Capitalization</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{f.market_cap_formatted}</span>
            <span className="text-[10px] text-[#89919C]">Total Equity Value</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Enterprise Value (EV)</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{f.enterprise_value_formatted}</span>
            <span className="text-[10px] text-[#89919C]">Mcap + Net Debt</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Price to Earnings (P/E TTM)</span>
            <span className="text-sm font-bold text-[#38BDF8] mt-0.5 block">
              {f.pe_ratio ? f.pe_ratio.toFixed(2) : "N/A"}
            </span>
            <span className="text-[10px] text-[#89919C]">
              {f.forward_pe ? `Fwd P/E: ${f.forward_pe.toFixed(2)}` : "Trailing Twelve Months"}
            </span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Price to Book (P/B)</span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              {f.price_to_book ? f.price_to_book.toFixed(2) : "N/A"}
            </span>
            <span className="text-[10px] text-[#89919C]">
              {f.book_value ? `Book: ${currSym}${f.book_value}` : "Net Asset Ratio"}
            </span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Price to Sales (P/S)</span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              {f.price_to_sales ? f.price_to_sales.toFixed(2) : "N/A"}
            </span>
            <span className="text-[10px] text-[#89919C]">Revenue Multiple</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">EV / EBITDA</span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              {f.ev_ebitda ? f.ev_ebitda.toFixed(2) : "N/A"}
            </span>
            <span className="text-[10px] text-[#89919C]">Cash Flow Multiple</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">PEG Ratio</span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              {f.peg_ratio ? f.peg_ratio.toFixed(2) : "N/A"}
            </span>
            <span className="text-[10px] text-[#89919C]">Growth Adjusted P/E</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Dividend Yield</span>
            <span className="text-sm font-bold text-[#10B981] mt-0.5 block">
              {f.dividend_yield !== null && f.dividend_yield !== undefined ? `${f.dividend_yield.toFixed(2)}%` : "0.00%"}
            </span>
            <span className="text-[10px] text-[#89919C]">
              {f.payout_ratio ? `Payout: ${f.payout_ratio.toFixed(1)}%` : "Annualized Payout"}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Two Columns: Profitability & Margins (Left) vs Solvency & Balance Sheet (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Profitability & Margins */}
        <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#252A31] pb-2">
            <div className="flex items-center space-x-1.5">
              <TrendingUp className="h-4 w-4 text-[#10B981]" />
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                Profitability & Margin Efficiency
              </span>
            </div>
            <span className="text-[10px] text-[#59616B]">TTM OPERATIONAL CONVERSION</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Gross Margin */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#89919C]">Gross Margin</span>
                <span className="text-white font-bold">
                  {f.gross_margin !== null && f.gross_margin !== undefined ? `${f.gross_margin.toFixed(2)}%` : "N/A"}
                </span>
              </div>
              <div className="w-full bg-[#1A2230] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#38BDF8] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, f.gross_margin || 0))}%` }}
                />
              </div>
            </div>

            {/* Operating Margin */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#89919C]">Operating Margin (EBIT Margin)</span>
                <span className="text-white font-bold">
                  {f.operating_margin !== null && f.operating_margin !== undefined ? `${f.operating_margin.toFixed(2)}%` : "N/A"}
                </span>
              </div>
              <div className="w-full bg-[#1A2230] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, f.operating_margin || 0))}%` }}
                />
              </div>
            </div>

            {/* Net Margin */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#89919C]">Net Profit Margin</span>
                <span className="text-white font-bold">
                  {f.net_margin !== null && f.net_margin !== undefined ? `${f.net_margin.toFixed(2)}%` : "N/A"}
                </span>
              </div>
              <div className="w-full bg-[#1A2230] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#F59E0B] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, f.net_margin || 0))}%` }}
                />
              </div>
            </div>

            {/* ROE & ROA Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#252A31]/50">
              <div className="bg-[#10141C] border border-[#252A31] p-2 rounded-[2px]">
                <span className="text-[10px] text-[#59616B] uppercase block">Return on Equity (ROE)</span>
                <span className="text-xs font-bold text-white">
                  {f.roe !== null && f.roe !== undefined ? `${f.roe.toFixed(2)}%` : "N/A"}
                </span>
              </div>
              <div className="bg-[#10141C] border border-[#252A31] p-2 rounded-[2px]">
                <span className="text-[10px] text-[#59616B] uppercase block">Return on Assets (ROA)</span>
                <span className="text-xs font-bold text-white">
                  {f.roa !== null && f.roa !== undefined ? `${f.roa.toFixed(2)}%` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Balance Sheet & Quantitative Health */}
        <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#252A31] pb-2">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-[#38BDF8]" />
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                Balance Sheet Health & Solvency
              </span>
            </div>
            <span className="text-[10px] text-[#59616B]">LIQUIDITY & RISK SCORES</span>
          </div>

          {/* Piotroski F-Score & Altman Z-Score Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Piotroski Card */}
            <div className={`border rounded-[2px] p-2.5 ${pColor}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider">Piotroski F-Score</span>
                <Award className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold mt-1">
                {pScore} <span className="text-xs font-normal">/ 9</span>
              </div>
              <span className="text-[10px] font-sans block mt-0.5 leading-tight opacity-90">
                {f.piotroski_rating}
              </span>
            </div>

            {/* Altman Z-Score Card */}
            <div className="border border-[#252A31] bg-[#10141C] rounded-[2px] p-2.5">
              <div className="flex items-center justify-between text-[#89919C]">
                <span className="text-[10px] uppercase font-bold tracking-wider">Altman Z-Score</span>
                <Activity className="h-3.5 w-3.5" />
              </div>
              <div className={`text-xl font-bold mt-1 ${zColor}`}>
                {f.altman_z_score ? f.altman_z_score.toFixed(2) : "N/A"}
              </div>
              <span className="text-[10px] text-[#59616B] font-sans block mt-0.5 leading-tight">
                {f.altman_rating}
              </span>
            </div>
          </div>

          {/* Solvency Table */}
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between py-1 border-b border-[#252A31]/50">
              <span className="text-[#89919C]">Total Debt</span>
              <span className="text-white font-bold">{f.total_debt_formatted}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#252A31]/50">
              <span className="text-[#89919C]">Total Cash & Equivalents</span>
              <span className="text-[#10B981] font-bold">{f.total_cash_formatted}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#252A31]/50">
              <span className="text-[#89919C]">Debt to Equity Ratio</span>
              <span className="text-[#D8DCE2] font-semibold">
                {f.debt_to_equity ? `${f.debt_to_equity.toFixed(2)}%` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#252A31]/50">
              <span className="text-[#89919C]">Current Ratio</span>
              <span className="text-[#D8DCE2] font-semibold">
                {f.current_ratio ? `${f.current_ratio.toFixed(2)}x` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#89919C]">Quick Ratio</span>
              <span className="text-[#D8DCE2] font-semibold">
                {f.quick_ratio ? `${f.quick_ratio.toFixed(2)}x` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Financial Highlights TTM (Income Statement & Cash Flow) */}
      <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#252A31] pb-2">
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="h-4 w-4 text-[#38BDF8]" />
            <span className="font-bold text-xs text-white uppercase tracking-wider">
              Financial Performance & Cash Generation (TTM)
            </span>
          </div>
          <span className="text-[10px] text-[#59616B]">INCOME STATEMENT & CASH FLOW AUDIT</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Total Revenue</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{f.revenue_formatted}</span>
            <span className="text-[9px] text-[#89919C]">Top-line Gross</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Gross Profit</span>
            <span className="text-xs font-bold text-white mt-0.5 block">
              {f.gross_margin && f.revenue_ttm
                ? `${currSym}${((f.revenue_ttm * (f.gross_margin / 100)) / (f.market === "India" ? 10000000 : 1e9)).toFixed(2)} ${f.market === "India" ? "Cr" : "B"}`
                : "—"}
            </span>
            <span className="text-[9px] text-[#89919C]">Revenue - COGS</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">EBITDA</span>
            <span className="text-xs font-bold text-[#38BDF8] mt-0.5 block">{f.ebitda_formatted}</span>
            <span className="text-[9px] text-[#89919C]">Operating Core</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Net Income</span>
            <span className="text-xs font-bold text-[#10B981] mt-0.5 block">{f.net_income_formatted}</span>
            <span className="text-[9px] text-[#89919C]">Bottom-line Profit</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Diluted EPS (TTM)</span>
            <span className="text-xs font-bold text-white mt-0.5 block">
              {f.eps_ttm ? `${currSym}${f.eps_ttm.toFixed(2)}` : "—"}
            </span>
            <span className="text-[9px] text-[#89919C]">Earnings / Share</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Operating Cash Flow</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{f.operating_cash_flow_formatted}</span>
            <span className="text-[9px] text-[#89919C]">Cash Generated</span>
          </div>

          <div className="bg-[#10141C] border border-[#252A31] p-2.5 rounded-[2px]">
            <span className="text-[10px] text-[#59616B] uppercase block">Free Cash Flow (FCF)</span>
            <span className="text-xs font-bold text-[#10B981] mt-0.5 block">{f.free_cash_flow_formatted}</span>
            <span className="text-[9px] text-[#89919C]">OCF - CapEx</span>
          </div>
        </div>
      </div>

      {/* 7. Multi-Year Historical Financial Performance */}
      {f.annual_history && f.annual_history.length > 0 && (
        <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#252A31] pb-2">
            <div className="flex items-center space-x-1.5">
              <BarChart3 className="h-4 w-4 text-[#10B981]" />
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                Multi-Year Annual Financial Performance Trend
              </span>
            </div>
            <span className="text-[10px] text-[#59616B]">HISTORICAL AUDITED PERIODS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#252A31] bg-[#0E1117] text-[10px] text-[#89919C] font-bold uppercase">
                  <th className="py-2 px-3">FISCAL YEAR</th>
                  <th className="py-2 px-3 text-right">TOTAL REVENUE</th>
                  <th className="py-2 px-3 text-right">GROSS PROFIT</th>
                  <th className="py-2 px-3 text-right">OPERATING INCOME</th>
                  <th className="py-2 px-3 text-right">NET INCOME</th>
                  <th className="py-2 px-3 text-right">PROFIT MARGIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A31]/50 font-mono">
                {f.annual_history.map((row) => {
                  const rev = row.revenue || 0;
                  const ni = row.net_income || 0;
                  const margin = rev > 0 ? ((ni / rev) * 100).toFixed(1) : "—";
                  const scale = f.market === "India" ? 10000000 : 1e9;
                  const unit = f.market === "India" ? "Cr" : "B";

                  return (
                    <tr key={row.year} className="hover:bg-[#141820] transition-colors">
                      <td className="py-2 px-3 font-bold text-white">FY {row.year}</td>
                      <td className="py-2 px-3 text-right text-[#D8DCE2]">
                        {row.revenue ? `${currSym}${(row.revenue / scale).toFixed(2)} ${unit}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-[#D8DCE2]">
                        {row.gross_profit ? `${currSym}${(row.gross_profit / scale).toFixed(2)} ${unit}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-[#38BDF8]">
                        {row.operating_income ? `${currSym}${(row.operating_income / scale).toFixed(2)} ${unit}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[#10B981]">
                        {row.net_income ? `${currSym}${(row.net_income / scale).toFixed(2)} ${unit}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-[#F59E0B]">
                        {margin !== "—" ? `${margin}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
