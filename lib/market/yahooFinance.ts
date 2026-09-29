/**
 * QuantSynthica Lab — Market Data Client Interface
 * Connects to the local/remote backend / Next.js market API routes.
 * Caches responses in memory to prevent repeated requests on tab toggles.
 */

export interface MarketBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema_20?: number | null;
  ema_50?: number | null;
}

export interface NormalizedMarketAsset {
  symbol: string;
  name: string;
  exchange: string;
  assetType: "equity" | "etf" | "index" | "option" | "macro";
  currency: string;
  flag: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  marketCap?: number | null;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  beta?: number | null;
  classification?: string;
  macroCategory?: "rate" | "currency" | "commodity";
  lastObservationDate?: string;
  sparkline: number[];
  sparklineSvg: string;
  bars: MarketBar[];
}

export interface OptionContract {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
}

export interface OptionChainData {
  symbol: string;
  available: boolean;
  reason?: string;
  underlyingPrice?: number;
  selectedExpiration?: string;
  expirations: string[];
  calls: OptionContract[];
  puts: OptionContract[];
}

export interface BenchmarkItem {
  symbol: string;
  name: string;
  market: string;
  flag: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  sparkline: number[];
  sparklineSvg: string;
}

export interface WatchlistItem {
  symbol: string;
  displaySymbol: string;
  flag: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  sparkline: number[];
  sparklineSvg: string;
}

export interface MacroInstrument {
  symbol: string;
  name: string;
  label: string;
  unit: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  sparkline: number[];
  sparklineSvg: string;
}

export interface MacroCategories {
  rates: MacroInstrument[];
  currencies: MacroInstrument[];
  commodities: MacroInstrument[];
}

// In-browser cache to prevent redundant fetches
const clientCache = new Map<string, { data: any; expiry: number }>();

function getFromClientCache<T>(key: string): T | null {
  const item = clientCache.get(key);
  if (item && Date.now() < item.expiry) {
    return item.data as T;
  }
  return null;
}

function setToClientCache(key: string, data: any, ttlSeconds = 60) {
  clientCache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

export async function fetchMarketAsset(symbol: string, timeframe = "6M"): Promise<NormalizedMarketAsset> {
  const key = `asset_${symbol.toUpperCase()}_${timeframe}`;
  const cached = getFromClientCache<NormalizedMarketAsset>(key);
  if (cached) return cached;

  const res = await fetch(`/api/market/asset?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch asset ${symbol} (status ${res.status})`);
  }
  const data = await res.json();
  setToClientCache(key, data, 90);
  return data;
}

export async function fetchOptionChain(symbol: string, expiration?: string): Promise<OptionChainData> {
  const key = `options_${symbol.toUpperCase()}_${expiration || "first"}`;
  const cached = getFromClientCache<OptionChainData>(key);
  if (cached) return cached;

  const expParam = expiration ? `&expiration=${encodeURIComponent(expiration)}` : "";
  const res = await fetch(`/api/market/options?symbol=${encodeURIComponent(symbol)}${expParam}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch options for ${symbol} (status ${res.status})`);
  }
  const data = await res.json();
  setToClientCache(key, data, 180);
  return data;
}

export async function fetchMarketBenchmarks(): Promise<BenchmarkItem[]> {
  const key = "benchmarks";
  const cached = getFromClientCache<BenchmarkItem[]>(key);
  if (cached) return cached;

  const res = await fetch("/api/market/benchmarks");
  if (!res.ok) {
    throw new Error(`Failed to fetch benchmarks (status ${res.status})`);
  }
  const data = await res.json();
  setToClientCache(key, data, 60);
  return data;
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const key = "watchlist";
  const cached = getFromClientCache<WatchlistItem[]>(key);
  if (cached) return cached;

  const res = await fetch("/api/market/watchlist");
  if (!res.ok) {
    throw new Error(`Failed to fetch watchlist (status ${res.status})`);
  }
  const data = await res.json();
  setToClientCache(key, data, 60);
  return data;
}

export async function fetchMacroUniverse(): Promise<MacroCategories> {
  const key = "macro_universe";
  const cached = getFromClientCache<MacroCategories>(key);
  if (cached) return cached;

  const res = await fetch("/api/market/macro");
  if (!res.ok) {
    throw new Error(`Failed to fetch macro instruments (status ${res.status})`);
  }
  const data = await res.json();
  setToClientCache(key, data, 120);
  return data;
}

/**
 * Currency & Number Formatting Helpers
 */
export function formatCurrencyValue(val: number, currency: string = "$"): string {
  if (currency === "%") {
    return `${val.toFixed(2)}%`;
  }
  
  if (currency === "₹") {
    // Standard Indian number grouping
    const formatted = val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `₹${formatted}`;
  }

  const formatted = val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
}

export function formatLargeVolume(vol?: number): string {
  if (!vol || vol <= 0) return "—";
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toLocaleString();
}

export function formatMarketCap(cap?: number | null, currency: string = "$"): string {
  if (!cap || cap <= 0) return "—";
  if (currency === "₹") {
    // Format in Crores (1 Cr = 10,000,000)
    const cr = cap / 10_000_000;
    if (cr >= 100_000) return `₹${(cr / 100_000).toFixed(2)} Lakh Cr`;
    return `₹${cr.toFixed(0)} Cr`;
  }
  if (cap >= 1_000_000_000_000) return `$${(cap / 1_000_000_000_000).toFixed(2)}T`;
  if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(2)}B`;
  if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(1)}M`;
  return `$${cap.toLocaleString()}`;
}

/**
 * Generates an SVG path from closing prices array
 */
export function generateSparklineSvg(closes: number[], width = 54, height = 22): string {
  if (!closes || closes.length < 2) return "M 0 11 L 54 11";
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const pad = 3;
  const effH = height - pad * 2;
  const n = closes.length;

  const pts = closes.map((c, i) => {
    const x = ((i / (n - 1)) * width).toFixed(1);
    const y = (pad + (1 - (c - min) / span) * effH).toFixed(1);
    return `${x} ${y}`;
  });

  return `M ${pts.join(" L ")}`;
}
