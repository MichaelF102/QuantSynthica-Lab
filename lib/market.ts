import { BENCHMARKS } from "@/lib/constants";

// Known NSE/BSE names that are commonly typed without an exchange suffix.
export const INDIA_STOCKS = new Set([
  "GENUSPOWER", "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "TATAMOTORS", "SBIN",
  "BHARTIARTL", "ITC", "WIPRO", "KAYNES", "CIANAGRO", "LT", "AXISBANK", "KOTAKBANK",
  "HINDUNILVR", "MARUTI", "SUNPHARMA", "ADANIENT", "BAJFINANCE", "ASIANPAINT",
]);

export type MarketRegion = "India" | "US";

export function isIndianTicker(ticker: string | null | undefined): boolean {
  const t = (ticker || "").trim().toUpperCase();
  return t.endsWith(".NS") || t.endsWith(".BO") || INDIA_STOCKS.has(t);
}

export const marketOfTicker = (ticker: string | null | undefined): MarketRegion =>
  isIndianTicker(ticker) ? "India" : "US";

export const marketOfBenchmark = (symbol: string): MarketRegion =>
  BENCHMARKS.find((b) => b.symbol === symbol)?.region === "India" ? "India" : "US";

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
