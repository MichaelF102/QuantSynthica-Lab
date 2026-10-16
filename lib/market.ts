import { BENCHMARKS } from "@/lib/constants";
import { isIndianIndex } from "@/lib/indices";

// Known NSE/BSE names that are commonly typed without an exchange suffix.
export const INDIA_STOCKS = new Set([
  "GENUSPOWER", "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "TATAMOTORS", "SBIN",
  "BHARTIARTL", "ITC", "WIPRO", "KAYNES", "CIANAGRO", "LT", "AXISBANK", "KOTAKBANK",
  "HINDUNILVR", "MARUTI", "SUNPHARMA", "ADANIENT", "BAJFINANCE", "ASIANPAINT",
]);

export type MarketRegion = "India" | "US";

const REGISTRY_KEY = "algolab_india_tickers";
let learned: Set<string> | null = null;

/** Indian tickers learned from search results (the static list above only covers a few names). */
function learnedIndia(): Set<string> {
  if (learned) return learned;
  learned = new Set();
  if (typeof window !== "undefined") {
    try { (JSON.parse(localStorage.getItem(REGISTRY_KEY) || "[]") as string[]).forEach((t) => learned!.add(t)); } catch { /* storage unavailable */ }
  }
  return learned;
}

/** Remember which market a ticker belongs to, as reported by the security search. */
export function registerTicker(ticker: string, region: MarketRegion): void {
  const t = ticker.trim().toUpperCase();
  const set = learnedIndia();
  if (region === "India") set.add(t); else set.delete(t);
  try { localStorage.setItem(REGISTRY_KEY, JSON.stringify([...set].slice(-500))); } catch { /* storage unavailable */ }
}

export function isIndianTicker(ticker: string | null | undefined): boolean {
  const t = (ticker || "").trim().toUpperCase();
  return t.endsWith(".NS") || t.endsWith(".BO") || INDIA_STOCKS.has(t) || learnedIndia().has(t);
}

export const marketOfTicker = (ticker: string | null | undefined): MarketRegion =>
  isIndianTicker(ticker) ? "India" : "US";

export const marketOfBenchmark = (symbol: string): MarketRegion =>
  (BENCHMARKS.find((b) => b.symbol === symbol)?.region ?? (isIndianIndex(symbol) ? "India" : "US")) === "India" ? "India" : "US";

/** Default benchmark for a market: NIFTY 50 for India, S&P 500 ETF for US. */
export const defaultBenchmarkFor = (region: MarketRegion): string => (region === "India" ? "^NSEI" : "SPY");

/**
 * Keeps a benchmark in the same market as the traded asset. A same-market
 * benchmark (e.g. ^BSESN for an Indian stock) is respected; a cross-market one
 * (QQQ for GENUSPOWER) is replaced by the market default.
 */
export function alignBenchmark(ticker: string | null | undefined, benchmark: string | null | undefined): string {
  const region = marketOfTicker(ticker);
  return benchmark && marketOfBenchmark(benchmark) === region ? benchmark : defaultBenchmarkFor(region);
}
