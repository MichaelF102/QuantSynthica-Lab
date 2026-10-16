import { Holding } from "@/lib/portfolio/engine";

export type Market = "India" | "US";
export interface RiskSource { key: string; label: string; market: Market; holdings: Holding[]; kind: "preset" | "portfolio" | "asset" | "custom" }

const eq = (tickers: string[]): Holding[] => tickers.map((ticker) => ({ ticker, weight: 100 / tickers.length }));

export const PRESETS: RiskSource[] = [
  { key: "preset:nifty50", label: "Nifty 50", market: "India", kind: "preset", holdings: [{ ticker: "NIFTYBEES.NS", weight: 100 }] },
  { key: "preset:in-tech", label: "India Tech", market: "India", kind: "preset", holdings: eq(["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"]) },
  { key: "preset:in-banks", label: "India Banks", market: "India", kind: "preset", holdings: eq(["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"]) },
  { key: "preset:market", label: "Market Portfolio", market: "US", kind: "preset", holdings: [{ ticker: "SPY", weight: 100 }] },
  { key: "preset:us-tech", label: "Tech Portfolio", market: "US", kind: "preset", holdings: eq(["AAPL", "MSFT", "NVDA", "GOOGL", "META"]) },
];

export const MARKET_DEFAULTS: Record<Market, { benchmark: string; benchmarkLabel: string; currency: "INR" | "USD"; value: number; presetKey: string }> = {
  India: { benchmark: "^NSEI", benchmarkLabel: "NIFTY 50", currency: "INR", value: 1000000, presetKey: "preset:in-banks" },
  US: { benchmark: "SPY", benchmarkLabel: "S&P 500 (SPY)", currency: "USD", value: 100000, presetKey: "preset:us-tech" },
};

export const BENCHMARK_OPTIONS: Record<Market, { symbol: string; label: string }[]> = {
  India: [{ symbol: "^NSEI", label: "NIFTY 50" }, { symbol: "^BSESN", label: "SENSEX" }, { symbol: "^NSEBANK", label: "NIFTY Bank" }, { symbol: "^CNXIT", label: "NIFTY IT" }],
  US: [{ symbol: "SPY", label: "S&P 500 (SPY)" }, { symbol: "QQQ", label: "Nasdaq 100 (QQQ)" }, { symbol: "IWM", label: "Russell 2000 (IWM)" }, { symbol: "DIA", label: "Dow 30 (DIA)" }],
};

export type Lookback = "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "Custom";
export const LOOKBACKS: Lookback[] = ["6M", "1Y", "2Y", "3Y", "5Y", "Custom"];
export const LOOKBACK_MONTHS: Record<Exclude<Lookback, "Custom">, number> = { "6M": 6, "1Y": 12, "2Y": 24, "3Y": 36, "5Y": 60 };

export const todayISO = () => new Date().toISOString().slice(0, 10);
export function startFromLookback(end: string, lb: Exclude<Lookback, "Custom">) {
  const d = new Date(end + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - LOOKBACK_MONTHS[lb]);
  return d.toISOString().slice(0, 10);
}

export const HORIZONS = [1, 5, 10, 20] as const;

export const CONFIDENCE_LABEL = (c: number) => `${(c * 100).toString().replace(/\.0$/, "")}%`;
