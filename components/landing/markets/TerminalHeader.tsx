"use client";

import React from "react";
import { NormalizedMarketAsset, formatCurrencyValue, formatLargeVolume, formatMarketCap } from "@/lib/market/yahooFinance";

interface TerminalHeaderProps {
  asset: NormalizedMarketAsset;
  displayName?: string;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({ asset, displayName }) => {
  const isPos = asset.isPositive;
  const curr = asset.currency || "$";
  const nameToDisplay = displayName || asset.name;

  return (
    <div className="border-b border-border/70 dark:border-border/40 pb-4 pt-1">
      {/* Top line: Flag, Ticker, Exchange badge, Category */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base select-none">{asset.flag}</span>
          <span className="font-mono text-sm md:text-base font-bold tracking-wider text-foreground">
            {asset.symbol}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-mono uppercase tracking-wider border border-border/50">
            {asset.exchange || "US"}
          </span>
          {asset.classification && (
            <span className="hidden sm:inline-block text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono border border-primary/20">
              {asset.classification}
            </span>
          )}
        </div>

        {asset.lastObservationDate && (
          <div className="text-[11px] font-mono text-muted-foreground/70">
            AS OF: {asset.lastObservationDate}
          </div>
        )}
      </div>

      {/* Main row: Company Name + Price & Metrics Strip */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-foreground truncate max-w-md">
            {nameToDisplay}
          </h2>
        </div>

        {/* Spot Quote */}
        <div className="flex flex-wrap items-baseline gap-3 md:gap-5 font-mono">
          <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrencyValue(asset.price, curr)}
          </div>

          <div
            className={`flex items-center gap-1.5 text-xs md:text-sm font-semibold tabular-nums px-2 py-0.5 rounded border ${
              isPos
                ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                : "text-rose-500 bg-rose-500/10 border-rose-500/20"
            }`}
          >
            <span>{isPos ? "+" : ""}{asset.change.toFixed(2)}</span>
            <span>({isPos ? "+" : ""}{asset.changePercent.toFixed(2)}%)</span>
          </div>

          <div className="text-xs text-muted-foreground tabular-nums">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mr-1.5 font-sans">VOL</span>
            <span className="text-foreground font-medium">{formatLargeVolume(asset.volume)}</span>
          </div>
        </div>
      </div>

      {/* Compact Institutional Sub-bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mt-3 pt-3 border-t border-border/40 text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-sans">
            Market Cap
          </span>
          <span className="text-foreground font-medium tabular-nums">
            {asset.marketCap ? formatMarketCap(asset.marketCap, curr) : "—"}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-sans">
            52W Range
          </span>
          <span className="text-foreground font-medium tabular-nums">
            {asset.fiftyTwoWeekLow != null && asset.fiftyTwoWeekHigh != null
              ? `${formatCurrencyValue(asset.fiftyTwoWeekLow, curr)} — ${formatCurrencyValue(asset.fiftyTwoWeekHigh, curr)}`
              : "—"}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-sans">
            Volatility / Beta
          </span>
          <span className="text-foreground font-medium tabular-nums">
            {asset.volatility != null ? `${asset.volatility.toFixed(1)}%` : (asset.beta != null ? `β ${asset.beta.toFixed(2)}` : "—")}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-sans">
            Day Range
          </span>
          <span className="text-foreground font-medium tabular-nums">
            {asset.low != null && asset.high != null
              ? `${formatCurrencyValue(asset.low, curr)} — ${formatCurrencyValue(asset.high, curr)}`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};
