import realDataJson from "@/data/real_market_universe.json";

export interface MarketBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema_20?: number | null;
  ema_50?: number | null;
  ema_200?: number | null;
  sma_20?: number | null;
  sma_50?: number | null;
  return?: number;
  drawdown?: number;
  volatility?: number;
}

export interface TickerUniverseItem {
  symbol: string;
  name: string;
  country: "US" | "India";
  flag: string;
  exchange: string;
  currency: string;
  sector: string;
  price: number;
  change: number;
  change_pct: number;
  is_positive: boolean;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  high_52w: number;
  low_52w: number;
  avg_volume_30d: number;
  beta: number;
  volatility: number;
  sparkline_d: string;
  bars: MarketBar[];
}

import liveSnapshot from "@/data/market_universe_live.json";

// Merge live snapshot assets into universe map for backward compatibility
const baseMap = (realDataJson || {}) as Record<string, TickerUniverseItem>;
const liveAssets = ((liveSnapshot as any)?.assets || {}) as Record<string, any>;

const mergedMap: Record<string, TickerUniverseItem> = { ...baseMap };

// Enhance with real live yfinance attributes where available
Object.entries(liveAssets).forEach(([sym, asset]) => {
  const existing = mergedMap[sym] || {};
  mergedMap[sym] = {
    ...existing,
    symbol: asset.symbol || sym,
    name: asset.name || existing.name || sym,
    country: asset.flag === "🇮🇳" ? "India" : "US",
    flag: asset.flag || (asset.currency === "₹" ? "🇮🇳" : "🇺🇸"),
    exchange: asset.exchange || existing.exchange || "NYSE",
    currency: asset.currency || "$",
    sector: asset.classification || existing.sector || "Equities",
    price: asset.price || existing.price || 0,
    change: asset.change || existing.change || 0,
    change_pct: asset.changePercent || existing.change_pct || 0,
    is_positive: asset.isPositive ?? (asset.change >= 0),
    open: asset.open || asset.price || 0,
    high: asset.high || asset.price || 0,
    low: asset.low || asset.price || 0,
    close: asset.price || 0,
    volume: asset.volume || 0,
    high_52w: asset.fiftyTwoWeekHigh || existing.high_52w || 0,
    low_52w: asset.fiftyTwoWeekLow || existing.low_52w || 0,
    avg_volume_30d: asset.volume || existing.avg_volume_30d || 0,
    beta: asset.beta || existing.beta || 1.0,
    volatility: existing.volatility || 18.0,
    sparkline_d: asset.sparklineSvg || existing.sparkline_d || "M 0 11 L 54 11",
    bars: asset.bars || existing.bars || [],
  };
});

export const REAL_UNIVERSE_MAP: Record<string, TickerUniverseItem> = mergedMap;


// Additional representative options & macro instruments
export const OPTIONS_UNIVERSE_ITEMS: Record<string, TickerUniverseItem> = {
  "SPY_CALL": {
    symbol: "SPY 765C",
    name: "S&P 500 $765 Call",
    country: "US",
    flag: "🇺🇸",
    exchange: "CBOE",
    currency: "$",
    sector: "Index Call Option",
    price: 14.20,
    change: 0.65,
    change_pct: 4.80,
    is_positive: true,
    open: 13.50,
    high: 15.10,
    low: 12.80,
    close: 14.20,
    volume: 84200,
    high_52w: 24.50,
    low_52w: 4.20,
    avg_volume_30d: 65000,
    beta: 2.85,
    volatility: 38.5,
    sparkline_d: "M0 16 Q 14 12, 28 8 T 54 2",
    bars: REAL_UNIVERSE_MAP["SPY"]?.bars?.slice(-60).map((b) => ({
      ...b,
      open: Math.max(2, +(b.open * 0.018).toFixed(2)),
      high: Math.max(2, +(b.high * 0.019).toFixed(2)),
      low: Math.max(1, +(b.low * 0.017).toFixed(2)),
      close: Math.max(2, +(b.close * 0.018).toFixed(2)),
      volume: Math.round(b.volume * 0.002),
      ema_20: b.ema_20 ? +(b.ema_20 * 0.018).toFixed(2) : null,
      ema_50: b.ema_50 ? +(b.ema_50 * 0.018).toFixed(2) : null,
    })) || [],
  },
  "NIFTY_CALL": {
    symbol: "NIFTY 22650 CE",
    name: "NIFTY 22,650 Call (Weekly Expiry)",
    country: "India",
    flag: "🇮🇳",
    exchange: "NSE F&O",
    currency: "₹",
    sector: "Index Derivatives",
    price: 128.50,
    change: 10.20,
    change_pct: 8.62,
    is_positive: true,
    open: 118.30,
    high: 135.00,
    low: 108.00,
    close: 128.50,
    volume: 1240000,
    high_52w: 380.00,
    low_52w: 18.00,
    avg_volume_30d: 950000,
    beta: 3.20,
    volatility: 42.0,
    sparkline_d: "M0 18 Q 15 14, 30 7 T 54 1",
    bars: REAL_UNIVERSE_MAP["^NSEI"]?.bars?.slice(-60).map((b) => ({
      ...b,
      open: Math.max(10, +(b.open * 0.0057).toFixed(2)),
      high: Math.max(10, +(b.high * 0.006).toFixed(2)),
      low: Math.max(5, +(b.low * 0.0054).toFixed(2)),
      close: Math.max(10, +(b.close * 0.0057).toFixed(2)),
      volume: Math.round(b.volume * 2.5),
      ema_20: b.ema_20 ? +(b.ema_20 * 0.0057).toFixed(2) : null,
      ema_50: b.ema_50 ? +(b.ema_50 * 0.0057).toFixed(2) : null,
    })) || [],
  },
};

export const MACRO_UNIVERSE_ITEMS: Record<string, TickerUniverseItem> = {
  "FEDFUNDS": {
    symbol: "FEDFUNDS",
    name: "Federal Funds Effective Rate",
    country: "US",
    flag: "🇺🇸",
    exchange: "FRED",
    currency: "%",
    sector: "Monetary Policy",
    price: 4.83,
    change: -0.50,
    change_pct: -9.38,
    is_positive: false,
    open: 5.33,
    high: 5.33,
    low: 4.83,
    close: 4.83,
    volume: 0,
    high_52w: 5.33,
    low_52w: 4.83,
    avg_volume_30d: 0,
    beta: 0.12,
    volatility: 4.2,
    sparkline_d: "M0 2 H 35 L 45 14 H 54",
    bars: [
      { date: "2023-12-01", open: 5.33, high: 5.33, low: 5.33, close: 5.33, volume: 1000, ema_20: 5.33 },
      { date: "2024-02-01", open: 5.33, high: 5.33, low: 5.33, close: 5.33, volume: 1000, ema_20: 5.33 },
      { date: "2024-04-01", open: 5.33, high: 5.33, low: 5.33, close: 5.33, volume: 1000, ema_20: 5.33 },
      { date: "2024-06-01", open: 5.33, high: 5.33, low: 5.33, close: 5.33, volume: 1000, ema_20: 5.33 },
      { date: "2024-08-01", open: 5.33, high: 5.33, low: 5.33, close: 5.33, volume: 1000, ema_20: 5.33 },
      { date: "2024-09-18", open: 5.33, high: 5.33, low: 4.83, close: 4.83, volume: 1000, ema_20: 5.08 },
      { date: "2024-09-27", open: 4.83, high: 4.83, low: 4.83, close: 4.83, volume: 1000, ema_20: 4.95 },
    ],
  },
  "INDIA_REPO": {
    symbol: "RBI REPO",
    name: "Reserve Bank of India Policy Repo Rate",
    country: "India",
    flag: "🇮🇳",
    exchange: "RBI",
    currency: "%",
    sector: "Monetary Policy",
    price: 6.50,
    change: 0.00,
    change_pct: 0.00,
    is_positive: true,
    open: 6.50,
    high: 6.50,
    low: 6.50,
    close: 6.50,
    volume: 0,
    high_52w: 6.50,
    low_52w: 6.50,
    avg_volume_30d: 0,
    beta: 0.08,
    volatility: 2.1,
    sparkline_d: "M0 10 H 54",
    bars: [
      { date: "2024-01-01", open: 6.50, high: 6.50, low: 6.50, close: 6.50, volume: 1000, ema_20: 6.50 },
      { date: "2024-04-01", open: 6.50, high: 6.50, low: 6.50, close: 6.50, volume: 1000, ema_20: 6.50 },
      { date: "2024-08-01", open: 6.50, high: 6.50, low: 6.50, close: 6.50, volume: 1000, ema_20: 6.50 },
      { date: "2024-09-27", open: 6.50, high: 6.50, low: 6.50, close: 6.50, volume: 1000, ema_20: 6.50 },
    ],
  },
};

export function getUniverseItem(symbol: string): TickerUniverseItem {
  const s = symbol.trim();
  if (REAL_UNIVERSE_MAP[s]) return REAL_UNIVERSE_MAP[s];
  if (OPTIONS_UNIVERSE_ITEMS[s]) return OPTIONS_UNIVERSE_ITEMS[s];
  if (MACRO_UNIVERSE_ITEMS[s]) return MACRO_UNIVERSE_ITEMS[s];

  // Try uppercase or stripping ^
  const up = s.toUpperCase();
  if (REAL_UNIVERSE_MAP[up]) return REAL_UNIVERSE_MAP[up];
  
  // Default fallback
  return REAL_UNIVERSE_MAP["SPY"];
}

export function formatPrice(val: number, currency = "$"): string {
  if (currency === "%") return `${val.toFixed(2)}%`;
  const formatted = val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
}

export function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}
