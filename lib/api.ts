import {
  StrategyConfig,
  BacktestResult,
  MarketDataResponse,
  OptimizationRequest,
  OptimizationResult,
  WalkForwardRequest,
  WalkForwardResult,
  PairsTradingRequest,
  PairsTradingResult,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errDetail = res.statusText;
      try {
        const errJson = await res.json();
        errDetail = errJson.detail || errJson.error || JSON.stringify(errJson);
      } catch (_) {}
      throw new Error(`API Error (${res.status}): ${errDetail}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.error(`Fetch failed for ${url}:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => request<{ status: string; engine: string; version: string }>("/health"),

  searchTickers: (params?: {
    query?: string;
    market?: string;
    sector?: string;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.query) q.append("query", params.query);
    if (params?.market && params.market !== "ALL") q.append("market", params.market);
    if (params?.sector && params.sector !== "ALL") q.append("sector", params.sector);
    if (params?.limit) q.append("limit", params.limit.toString());
    return request<import("@/types").StockProfile[]>(`/market/search?${q.toString()}`);
  },

  getStockProfile: (symbol: string) =>
    request<import("@/types").StockProfile>(`/market/stock/${encodeURIComponent(symbol)}`),

  getSectors: (market?: string) =>
    request<string[]>(`/market/sectors${market ? `?market=${encodeURIComponent(market)}` : ""}`),

  getMarketData: (params: {
    ticker: string;
    start_date: string;
    end_date: string;
    timeframe?: string;
    benchmark?: string;
    indicators?: any[];
  }) => {
    const q = new URLSearchParams({
      ticker: params.ticker,
      start_date: params.start_date,
      end_date: params.end_date,
      timeframe: params.timeframe || "1D",
      benchmark: params.benchmark || "SPY",
    });
    if (params.indicators && params.indicators.length > 0) {
      q.append("indicators", JSON.stringify(params.indicators));
    }
    return request<MarketDataResponse>(`/market/data?${q.toString()}`);
  },

  getStrategies: () => request<StrategyConfig[]>("/strategies"),

  getStrategy: (id: string) => request<StrategyConfig>(`/strategies/${id}`),

  saveStrategy: (strat: StrategyConfig) =>
    request<StrategyConfig>("/strategies", {
      method: "POST",
      body: JSON.stringify(strat),
    }),

  updateStrategy: (id: string, strat: StrategyConfig) =>
    request<StrategyConfig>(`/strategies/${id}`, {
      method: "PUT",
      body: JSON.stringify(strat),
    }),

  deleteStrategy: (id: string) =>
    request<{ status: string; id: string }>(`/strategies/${id}`, {
      method: "DELETE",
    }),

  runBacktest: (
    strategy: StrategyConfig,
    startDate: string,
    endDate: string,
    benchmark = "SPY"
  ) =>
    request<BacktestResult>("/backtests", {
      method: "POST",
      body: JSON.stringify({
        strategy,
        start_date: startDate,
        end_date: endDate,
        benchmark,
      }),
    }),

  getBacktests: () => request<BacktestResult[]>("/backtests"),

  getBacktest: (id: string) => request<BacktestResult>(`/backtests/${id}`),

  runOptimization: (req: OptimizationRequest) =>
    request<OptimizationResult>("/optimization", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  runWalkForward: (req: WalkForwardRequest) =>
    request<WalkForwardResult>("/walk-forward", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  runPairsTrading: (req: PairsTradingRequest) =>
    request<PairsTradingResult>("/pairs", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  compareStrategies: (backtestIds: string[]) =>
    request<{ strategies: any[] }>("/analytics/compare", {
      method: "POST",
      body: JSON.stringify({ backtest_ids: backtestIds }),
    }),

  deleteBacktest: (id: string) =>
    request<{ status: string; id: string }>(`/backtests/${id}`, {
      method: "DELETE",
    }),

  getExportTradesUrl: (id: string) => `${API_BASE}/backtests/${id}/export/trades`,
  getExportEquityUrl: (id: string) => `${API_BASE}/backtests/${id}/export/equity`,
  getExportMonthlyUrl: (id: string) => `${API_BASE}/backtests/${id}/export/monthly`,
  getExportReportUrl: (id: string) => `${API_BASE}/backtests/${id}/export/report`,

  getSettings: () => request<{ settings: any }>("/settings"),

  updateSettings: (settings: any) =>
    request<{ status: string; settings: any }>("/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    }),

  getSystemDiagnostics: () =>
    request<{
      status: string;
      python_version: string;
      platform: string;
      api_gateway: string;
      dependencies: Record<string, { status: string; version: string | null; available: boolean }>;
      universe: { total_securities: number; us_equities: number; india_equities: number; status: string };
      cache: { directory: string; total_cached_files: number; cache_size_bytes: number; cache_size_str: string; status: string };
    }>("/settings/diagnostics"),

  clearMarketCache: () =>
    request<{ status: string; cleared_files: number; freed_bytes: number; message: string }>("/settings/cache/clear", {
      method: "POST",
    }),
};
