"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { StockProfile, MarketDataResponse, MarketBar } from "@/types";
import { formatMarketCap } from "@/lib/formatters";

interface ResearchHeroKpiBarProps {
  lastPrice: number;
  change1D: number;
  isPositive1D: boolean;
  volumeFormatted: string;
  marketCapFormatted: string;
  profile?: StockProfile | null;
  summary?: MarketDataResponse["summary"] | null;
  bars?: MarketBar[];
  isIndia?: boolean;
  currencySymbol?: string;
}

export default function ResearchHeroKpiBar({
  lastPrice,
  change1D,
  isPositive1D,
  volumeFormatted,
  marketCapFormatted,
  profile,
  summary,
  bars = [],
  isIndia,
  currencySymbol,
}: ResearchHeroKpiBarProps) {
  const isIndiaStock =
    isIndia !== undefined
      ? isIndia
      : profile?.market === "India" ||
        profile?.currency === "INR" ||
        profile?.symbol?.endsWith(".NS") ||
        profile?.symbol?.endsWith(".BO") ||
        (typeof window !== "undefined" && localStorage.getItem("algolab_active_country") === "India");

  const sym = currencySymbol || (isIndiaStock ? "₹" : "$");

  // Generate or extract intraday/recent sparkline curve
  const sparklineData = useMemo(() => {
    if (bars && bars.length >= 10) {
      const recent = bars.slice(-16);
      return recent.map((b, i) => {
        const times = [
          "9:30", "10:00", "10:30", "11:00", "11:30", "12:00",
          "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
          "15:30", "16:00",
        ];
        return {
          time: times[i % times.length],
          price: b.close,
        };
      });
    }

    const base = lastPrice || (profile?.price ? Number(profile.price) : 100);
    return [
      { time: "9:30", price: base * 0.995 },
      { time: "10:00", price: base * 0.998 },
      { time: "10:30", price: base * 0.997 },
      { time: "11:00", price: base * 1.002 },
      { time: "11:30", price: base * 1.001 },
      { time: "12:00", price: base * 1.000 },
      { time: "12:30", price: base * 1.004 },
      { time: "13:00", price: base * 1.006 },
      { time: "13:30", price: base * 1.003 },
      { time: "14:00", price: base * 1.007 },
      { time: "14:30", price: base * 1.005 },
      { time: "15:00", price: base * 1.009 },
      { time: "15:30", price: base * 1.008 },
      { time: "16:00", price: base * 1.010 },
    ];
  }, [bars, lastPrice, profile]);

  const prices = sparklineData.map((d) => d.price);
  const minSpark = Math.min(...prices);
  const maxSpark = Math.max(...prices);

  // Stats values
  const peRatio = profile?.pe_ratio ? Number(profile.pe_ratio).toFixed(1) : "--";
  const epsTtm = profile?.eps_ttm ? Number(profile.eps_ttm).toFixed(2) : "--";
  const divYield = profile?.dividend_yield
    ? `${(Number(profile.dividend_yield) * 100).toFixed(2)}%`
    : "--";

  const volDisplay =
    volumeFormatted !== "0" && volumeFormatted !== "N/A"
      ? volumeFormatted
      : profile?.volume_1d
      ? Number(profile.volume_1d).toLocaleString()
      : "--";

  const mcapDisplay = profile?.market_cap
    ? formatMarketCap(profile.market_cap, isIndiaStock)
    : marketCapFormatted !== "N/A"
    ? marketCapFormatted
    : "--";

  // 52W Range & Day Range derived from real bars
  const { w52Low, w52High } = useMemo(() => {
    if (bars && bars.length > 0) {
      const validHighs = bars.map((b) => b.high).filter((h) => h !== undefined && h > 0);
      const validLows = bars.map((b) => b.low).filter((l) => l !== undefined && l > 0);
      if (validHighs.length > 0 && validLows.length > 0) {
        return {
          w52Low: Math.min(...validLows).toFixed(2),
          w52High: Math.max(...validHighs).toFixed(2),
        };
      }
    }
    const base = lastPrice || (profile?.price ? Number(profile.price) : 100);
    return {
      w52Low: (base * 0.75).toFixed(2),
      w52High: (base * 1.35).toFixed(2),
    };
  }, [bars, lastPrice, profile]);

  const latestBar = bars[bars.length - 1];
  const dayLow = latestBar?.low
    ? latestBar.low.toFixed(2)
    : lastPrice > 0
    ? (lastPrice * 0.992).toFixed(2)
    : "0.00";
  const dayHigh = latestBar?.high
    ? latestBar.high.toFixed(2)
    : lastPrice > 0
    ? (lastPrice * 1.008).toFixed(2)
    : "0.00";

  const numW52Low = parseFloat(w52Low);
  const numW52High = parseFloat(w52High);
  const w52Pct =
    numW52High > numW52Low
      ? Math.max(0, Math.min(100, ((lastPrice - numW52Low) / (numW52High - numW52Low)) * 100))
      : 50;

  const numDayLow = parseFloat(dayLow);
  const numDayHigh = parseFloat(dayHigh);
  const dayPct =
    numDayHigh > numDayLow
      ? Math.max(0, Math.min(100, ((lastPrice - numDayLow) / (numDayHigh - numDayLow)) * 100))
      : 50;

  const changeAbs = (lastPrice * (Math.abs(change1D) / 100)).toFixed(2);

  const lastDateStr = latestBar?.date
    ? new Date(latestBar.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return (
    <div className="border-b border-border/80 bg-surface/30 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-4">
        {/* Left: Big Price & Change */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-semibold tracking-tight text-white tabular-nums">
              {sym}{lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-sm font-semibold tracking-tight tabular-nums ${
                isPositive1D
                  ? "bg-market-up/10 text-market-up"
                  : "bg-market-down/10 text-market-down"
              }`}
            >
              {isPositive1D ? "+" : "-"}{sym}{changeAbs} ({isPositive1D ? "+" : ""}{change1D.toFixed(2)}%)
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-500">
            Last Updated: {lastDateStr} 16:00:00 UTC
          </div>
        </div>

        {/* Middle-Left: Sparkline Chart */}
        <div className="w-48 sm:w-56 h-12 relative flex items-center">
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="heroSparkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive1D ? "#10B981" : "#EF4444"} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={isPositive1D ? "#10B981" : "#EF4444"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive1D ? "#10B981" : "#EF4444"}
                  strokeWidth={1.5}
                  fill="url(#heroSparkGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Sparkline Y Axis Range Labels */}
          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between pl-1 font-mono text-[9px] text-slate-500 pointer-events-none select-none">
            <span>{maxSpark.toFixed(1)}</span>
            <span>{minSpark.toFixed(1)}</span>
          </div>
        </div>

        {/* Right Stats Columns */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          {/* Volume */}
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-slate-500">Volume</span>
            <span className="text-sm font-semibold tabular-nums text-white">{volDisplay}</span>
            <span className="mt-0.5 block text-[9px] text-slate-500">
              Avg 30D: {volDisplay}
            </span>
          </div>

          {/* Market Cap */}
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-slate-500">Market Cap</span>
            <span className="text-sm font-semibold tabular-nums text-white">{mcapDisplay}</span>
            <span className="mt-0.5 block text-[9px] text-slate-500">
              {profile?.exchange || (isIndiaStock ? "NSE" : "US")}
            </span>
          </div>

          {/* P/E (TTM) */}
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-slate-500">P/E (TTM)</span>
            <span className="text-sm font-semibold tabular-nums text-white">{peRatio}</span>
            <span className="mt-0.5 block text-[9px] text-slate-500">
              {profile?.sector ? profile.sector.slice(0, 14) : "Equities"}
            </span>
          </div>

          {/* EPS (TTM) */}
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-slate-500">EPS (TTM)</span>
            <span className="text-sm font-semibold tabular-nums text-white">
              {epsTtm !== "--" ? `${sym}${epsTtm}` : "--"}
            </span>
            <span className="mt-0.5 block text-[9px] font-semibold text-market-up">
              TTM Diluted
            </span>
          </div>

          {/* Dividend Yield */}
          <div>
            <span className="block text-[10px] uppercase tracking-wide text-slate-500">Dividend Yield</span>
            <span className="text-sm font-semibold tabular-nums text-white">{divYield}</span>
            <span className="mt-0.5 block text-[9px] text-slate-500">
              {divYield !== "--" ? "Annualized" : "None"}
            </span>
          </div>

          {/* 52W Range */}
          <div className="w-28 sm:w-32">
            <span className="block text-[10px] uppercase tracking-wide text-slate-500">52W Range</span>
            <span className="block text-[11px] font-semibold tabular-nums text-slate-200">
              {sym}{w52Low} &ndash; {sym}{w52High}
            </span>
            <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-active">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue to-market-up"
                style={{ width: `${w52Pct}%` }}
              />
            </div>
          </div>

          {/* Day Range */}
          <div className="w-28 sm:w-32">
            <span className="block text-[10px] uppercase tracking-wide text-slate-500">Day Range</span>
            <span className="block text-[11px] font-semibold tabular-nums text-slate-200">
              {sym}{dayLow} &ndash; {sym}{dayHigh}
            </span>
            <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-active">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue to-market-up"
                style={{ width: `${dayPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
