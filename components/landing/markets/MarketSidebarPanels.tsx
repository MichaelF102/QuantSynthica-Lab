"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Activity, TrendingUp, Layers } from "lucide-react";
import { MarketCategoryId } from "./MarketCategoryTabs";
import {
  NormalizedMarketAsset,
  formatCurrencyValue,
  generateSparklineSvg,
  formatLargeVolume,
} from "@/lib/market/yahooFinance";
import liveSnapshot from "@/data/market_universe_live.json";

interface MarketSidebarPanelsProps {
  activeCategory: MarketCategoryId;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  // Options specific context
  underlyingAsset?: NormalizedMarketAsset | null;
  selectedExpiration?: string;
  availableExpirations?: string[];
  onSelectExpiration?: (exp: string) => void;
}

interface SidebarItemData {
  symbol: string;
  name: string;
  displayName?: string;
  currency: string;
  flag: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  sparklineSvg: string;
  subLabel?: string;
}

export const MarketSidebarPanels: React.FC<MarketSidebarPanelsProps> = ({
  activeCategory,
  selectedSymbol,
  onSelectSymbol,
  underlyingAsset,
  selectedExpiration,
  availableExpirations = [],
  onSelectExpiration,
}) => {
  const snapshotAssets = (liveSnapshot as any)?.assets || {};
  const snapshotMacro = (liveSnapshot as any)?.macro || { rates: [], currencies: [], commodities: [] };

  // Helper to extract or fallback item data
  const getItemData = (sym: string, customName?: string, customSub?: string): SidebarItemData => {
    const asset = snapshotAssets[sym];
    if (asset) {
      return {
        symbol: asset.symbol,
        name: customName || asset.name,
        displayName: customName || asset.displayName || asset.symbol,
        currency: asset.currency || "$",
        flag: asset.flag || "🌐",
        price: asset.price || 0,
        change: asset.change || 0,
        changePercent: asset.changePercent || 0,
        isPositive: asset.isPositive ?? (asset.change >= 0),
        sparklineSvg: asset.sparklineSvg || generateSparklineSvg(asset.sparkline || []),
        subLabel: customSub || asset.exchange || asset.classification,
      };
    }

    // Check in macro items
    const allMacro = [
      ...(snapshotMacro.rates || []),
      ...(snapshotMacro.commodities || []),
      ...(snapshotMacro.currencies || []),
    ];
    const mItem = allMacro.find((m: any) => m.symbol === sym);
    if (mItem) {
      return {
        symbol: mItem.symbol,
        name: customName || mItem.name,
        displayName: customName || mItem.label || mItem.symbol,
        currency: mItem.unit === "%" ? "%" : "$",
        flag: mItem.flag || "🌐",
        price: mItem.price || 0,
        change: mItem.change || 0,
        changePercent: mItem.changePercent || 0,
        isPositive: mItem.isPositive,
        sparklineSvg: mItem.sparklineSvg,
        subLabel: customSub || mItem.unit,
      };
    }

    // Clean fallback
    return {
      symbol: sym,
      name: customName || sym,
      displayName: customName || sym,
      currency: sym.endsWith(".NS") || sym.startsWith("^NSE") || sym.startsWith("^BSE") ? "₹" : (sym.startsWith("^") && sym.endsWith("X") ? "%" : "$"),
      flag: sym.endsWith(".NS") || sym.startsWith("^NSE") || sym.startsWith("^BSE") ? "🇮🇳" : "🇺🇸",
      price: 0,
      change: 0,
      changePercent: 0,
      isPositive: true,
      sparklineSvg: "M 0 11 L 54 11",
      subLabel: customSub || sym,
    };
  };

  // Determine panel 1 & panel 2 configurations per category
  const config = useMemo(() => {
    switch (activeCategory) {
      case "us_equities":
        return {
          panel1: {
            title: "US BENCHMARKS",
            badge: "CORE INDICES",
            items: [
              getItemData("^GSPC", "S&P 500", "US Large Cap"),
              getItemData("^IXIC", "Nasdaq Composite", "Tech Heavy"),
              getItemData("^DJI", "Dow Jones", "30 Industrials"),
              getItemData("^RUT", "Russell 2000", "Small Cap"),
            ],
          },
          panel2: {
            title: "US WATCHLIST",
            badge: "MEGA CAP LEADERS",
            items: [
              getItemData("AAPL", "Apple Inc.", "Consumer Tech"),
              getItemData("MSFT", "Microsoft Corp.", "Enterprise Cloud"),
              getItemData("NVDA", "NVIDIA Corp.", "Accelerated AI"),
              getItemData("AMZN", "Amazon.com Inc.", "E-Commerce / AWS"),
              getItemData("GOOGL", "Alphabet Inc.", "Digital Ad / AI"),
            ],
          },
        };

      case "indian_equities":
        return {
          panel1: {
            title: "INDIAN BENCHMARKS",
            badge: "DALAL STREET",
            items: [
              getItemData("^NSEI", "NIFTY 50", "NSE Benchmark"),
              getItemData("^BSESN", "SENSEX", "BSE Benchmark"),
              getItemData("^NSEBANK", "BANK NIFTY", "Banking Sector"),
            ],
          },
          panel2: {
            title: "INDIAN WATCHLIST",
            badge: "NIFTY LEADERS",
            items: [
              getItemData("RELIANCE.NS", "Reliance Industries", "Energy / Retail"),
              getItemData("TCS.NS", "Tata Consultancy", "IT Services"),
              getItemData("INFY.NS", "Infosys Ltd.", "IT Services"),
              getItemData("HDFCBANK.NS", "HDFC Bank", "Private Banking"),
              getItemData("ICICIBANK.NS", "ICICI Bank", "Private Banking"),
            ],
          },
        };

      case "etfs":
        return {
          panel1: {
            title: "BENCHMARK ETFs",
            badge: "CORE ASSETS",
            items: [
              getItemData("SPY", "SPDR S&P 500", "Broad US Large Cap"),
              getItemData("QQQ", "Invesco QQQ", "Nasdaq 100 Tech"),
              getItemData("IWM", "iShares Russell 2000", "US Small Cap"),
              getItemData("DIA", "SPDR Dow Jones", "30 Mega Caps"),
            ],
          },
          panel2: {
            title: "ETF WATCHLIST",
            badge: "SECTOR & COMMODITY",
            items: [
              getItemData("XLK", "Tech Select SPDR", "Software & Semis"),
              getItemData("XLF", "Financial Select SPDR", "Banks & Insurance"),
              getItemData("XLE", "Energy Select SPDR", "Oil & Gas Majors"),
              getItemData("GLD", "SPDR Gold Shares", "Physical Gold"),
              getItemData("TLT", "iShares 20+ Year Treasury", "Long Duration"),
            ],
          },
        };

      case "indices":
        return {
          panel1: {
            title: "US INDICES",
            badge: "WALL STREET",
            items: [
              getItemData("^GSPC", "S&P 500", "Standard & Poor's"),
              getItemData("^IXIC", "Nasdaq Composite", "Tech / Growth"),
              getItemData("^DJI", "Dow Jones 30", "Industrial Average"),
              getItemData("^RUT", "Russell 2000", "FTSE Russell"),
            ],
          },
          panel2: {
            title: "INDIA INDICES",
            badge: "NSE & BSE",
            items: [
              getItemData("^NSEI", "NIFTY 50", "50 Heavyweights"),
              getItemData("^BSESN", "BSE SENSEX", "30 Bluechips"),
              getItemData("^NSEBANK", "BANK NIFTY", "Banking Index"),
            ],
          },
        };

      case "economic_data":
        return {
          panel1: {
            title: "RATES & YIELDS",
            badge: "US TREASURY",
            items: [
              getItemData("^TNX", "10-Year Treasury Yield", "Benchmark Yield"),
              getItemData("^FVX", "5-Year Treasury Yield", "Medium Term"),
              getItemData("^TYX", "30-Year Treasury Yield", "Long Bond"),
              getItemData("^IRX", "13-Week Treasury Bill", "Short Term"),
            ],
          },
          panel2: {
            title: "CROSS-ASSET",
            badge: "COMMODITIES & FX",
            items: [
              getItemData("GC=F", "Gold Futures", "Precious Metals"),
              getItemData("CL=F", "Crude Oil (WTI)", "Energy Benchmark"),
              getItemData("DX-Y.NYB", "US Dollar Index", "USD Basket"),
              getItemData("^GSPC", "S&P 500", "Equities Risk"),
            ],
          },
        };

      case "options":
      default:
        return null;
    }
  }, [activeCategory, snapshotAssets, snapshotMacro]);

  // Special Panel for Options Tab (Underlying & Expirations)
  if (activeCategory === "options") {
    const optUnderlying = underlyingAsset || snapshotAssets["SPY"] || {
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      price: 570.0,
      change: 1.5,
      changePercent: 0.26,
      currency: "$",
      volatility: 14.8,
      fiftyTwoWeekLow: 410.0,
      fiftyTwoWeekHigh: 575.0,
      isPositive: true,
      volume: 48000000,
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {/* Panel 1: UNDERLYING */}
        <div className="rounded-xl border border-border/70 dark:border-border/40 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                UNDERLYING
              </h3>
              <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-mono text-primary font-semibold uppercase">
                SPOT
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-foreground">
              {optUnderlying.symbol}
            </span>
          </div>

          <div className="mt-3 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground text-[11px] font-sans">Spot Price</span>
              <span className="font-bold text-sm text-foreground tabular-nums">
                {formatCurrencyValue(optUnderlying.price, optUnderlying.currency || "$")}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-[11px] font-sans">Net Daily Change</span>
              <span
                className={`font-semibold tabular-nums ${
                  optUnderlying.isPositive ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {optUnderlying.isPositive ? "+" : ""}{optUnderlying.change.toFixed(2)} ({optUnderlying.isPositive ? "+" : ""}{optUnderlying.changePercent.toFixed(2)}%)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-[11px] font-sans">52W Range</span>
              <span className="text-foreground tabular-nums">
                {optUnderlying.fiftyTwoWeekLow != null && optUnderlying.fiftyTwoWeekHigh != null
                  ? `${formatCurrencyValue(optUnderlying.fiftyTwoWeekLow, "$")} — ${formatCurrencyValue(optUnderlying.fiftyTwoWeekHigh, "$")}`
                  : "Data unavailable"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-[11px] font-sans">Realized Volatility</span>
              <span className="text-foreground font-semibold tabular-nums">
                {optUnderlying.volatility != null ? `${optUnderlying.volatility.toFixed(1)}%` : "16.2%"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-[11px] font-sans">Volume</span>
              <span className="text-foreground tabular-nums">
                {formatLargeVolume(optUnderlying.volume)}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: EXPIRATIONS */}
        <div className="rounded-xl border border-border/70 dark:border-border/40 bg-card p-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                EXPIRATIONS
              </h3>
              <span className="rounded bg-muted/60 px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground font-semibold">
                {availableExpirations.length} SERIES
              </span>
            </div>
          </div>

          <div className="mt-2.5 max-h-[190px] overflow-y-auto space-y-1 pr-1 font-mono text-xs">
            {availableExpirations.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No expirations available
              </div>
            ) : (
              availableExpirations.map((exp) => {
                const isSelected = selectedExpiration === exp;
                return (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => onSelectExpiration && onSelectExpiration(exp)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <span>{exp}</span>
                    <span className="text-[10px] opacity-75 font-sans">
                      {isSelected ? "ACTIVE" : "SELECT"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
      {/* Panel 1 */}
      <div className="rounded-xl border border-border/70 dark:border-border/40 bg-card p-3.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              {config.panel1.title}
            </h3>
            <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-mono text-primary font-semibold uppercase">
              {config.panel1.badge}
            </span>
          </div>
        </div>

        <div className="mt-2 divide-y divide-border/40">
          {config.panel1.items.map((item) => {
            const isSelected = selectedSymbol.toUpperCase() === item.symbol.toUpperCase();
            return (
              <div
                key={item.symbol}
                onClick={() => onSelectSymbol(item.symbol)}
                className={`group flex cursor-pointer items-center justify-between py-2 px-2 rounded transition-all duration-150 ${
                  isSelected
                    ? "bg-primary/10 border-l-2 border-primary font-medium"
                    : "hover:bg-muted/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs select-none">{item.flag}</span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {item.displayName || item.name}
                    </span>
                  </div>
                  {item.subLabel && (
                    <div className="text-[10px] text-muted-foreground ml-4 truncate max-w-[130px]">
                      {item.subLabel}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-right">
                  <div>
                    <div className="text-xs font-semibold text-foreground tabular-nums">
                      {item.price > 0 ? formatCurrencyValue(item.price, item.currency) : "—"}
                    </div>
                    <div
                      className={`text-[10px] font-medium tabular-nums ${
                        item.isPositive ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {item.isPositive ? "+" : ""}{item.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  <div className="w-12 h-5 hidden sm:block opacity-75 group-hover:opacity-100">
                    <svg viewBox="0 0 54 22" className="w-full h-full overflow-visible">
                      <path
                        d={item.sparklineSvg}
                        fill="none"
                        stroke={item.isPositive ? "#10B981" : "#EF4444"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel 2 */}
      <div className="rounded-xl border border-border/70 dark:border-border/40 bg-card p-3.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              {config.panel2.title}
            </h3>
            <span className="rounded bg-muted/60 px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground font-semibold uppercase">
              {config.panel2.badge}
            </span>
          </div>
        </div>

        <div className="mt-2 divide-y divide-border/40">
          {config.panel2.items.map((item) => {
            const isSelected = selectedSymbol.toUpperCase() === item.symbol.toUpperCase();
            return (
              <div
                key={item.symbol}
                onClick={() => onSelectSymbol(item.symbol)}
                className={`group flex cursor-pointer items-center justify-between py-2 px-2 rounded transition-all duration-150 ${
                  isSelected
                    ? "bg-primary/10 border-l-2 border-primary font-medium"
                    : "hover:bg-muted/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs select-none">{item.flag}</span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {item.displayName || item.name}
                    </span>
                  </div>
                  {item.subLabel && (
                    <div className="text-[10px] text-muted-foreground ml-4 truncate max-w-[130px]">
                      {item.subLabel}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-right">
                  <div>
                    <div className="text-xs font-semibold text-foreground tabular-nums">
                      {item.price > 0 ? formatCurrencyValue(item.price, item.currency) : "—"}
                    </div>
                    <div
                      className={`text-[10px] font-medium tabular-nums ${
                        item.isPositive ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {item.isPositive ? "+" : ""}{item.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  <div className="w-12 h-5 hidden sm:block opacity-75 group-hover:opacity-100">
                    <svg viewBox="0 0 54 22" className="w-full h-full overflow-visible">
                      <path
                        d={item.sparklineSvg}
                        fill="none"
                        stroke={item.isPositive ? "#10B981" : "#EF4444"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
