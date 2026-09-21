import { StrategyConfig } from "@/types";

export const BENCHMARKS = [
  { symbol: "SPY", name: "S&P 500 ETF Trust", region: "US" },
  { symbol: "QQQ", name: "Invesco Nasdaq 100", region: "US" },
  { symbol: "IWM", name: "Russell 2000 Small Cap", region: "US" },
  { symbol: "^NSEI", name: "NIFTY 50 Index", region: "India" },
  { symbol: "^BSESN", name: "BSE SENSEX", region: "India" },
  { symbol: "NIFTYBEES.NS", name: "Nippon Nifty BeES ETF", region: "India" },
];

export const DESK_INDICES = [
  { symbol: "SPY", name: "S&P 500", market: "US", price: 588.45, change: 0.42 },
  { symbol: "QQQ", name: "Nasdaq 100", market: "US", price: 509.12, change: 0.85 },
  { symbol: "^NSEI", name: "Nifty 50", market: "India", price: 25142.8, change: 0.18 },
  { symbol: "^BSESN", name: "Sensex", market: "India", price: 82110.4, change: -0.22 },
] as const;

export const DESK_NAMES = [
  { symbol: "NVDA", name: "NVIDIA", market: "US", price: 138.25, change: 2.15 },
  { symbol: "AAPL", name: "Apple", market: "US", price: 232.1, change: -0.34 },
  { symbol: "MSFT", name: "Microsoft", market: "US", price: 428.15, change: -0.24 },
  { symbol: "RELIANCE", name: "Reliance Industries", market: "India", price: 1290.9, change: -2.13 },
  { symbol: "TCS", name: "TCS", market: "India", price: 3840.0, change: 0.65 },
  { symbol: "INFY", name: "Infosys", market: "India", price: 1872.4, change: 0.28 },
] as const;

export const AVAILABLE_INDICATORS = [
  { id: "SMA", name: "Simple Moving Average (SMA)", category: "Trend", defaultParams: { period: 20 } },
  { id: "EMA", name: "Exponential Moving Average (EMA)", category: "Trend", defaultParams: { period: 20 } },
  { id: "RSI", name: "Relative Strength Index (RSI)", category: "Momentum", defaultParams: { period: 14 } },
  { id: "MACD", name: "MACD Line", category: "Momentum", defaultParams: { fast_period: 12, slow_period: 26 } },
  { id: "MACD_SIGNAL", name: "MACD Signal Line", category: "Momentum", defaultParams: { fast_period: 12, slow_period: 26, signal_period: 9 } },
  { id: "MACD_HIST", name: "MACD Histogram", category: "Momentum", defaultParams: { fast_period: 12, slow_period: 26, signal_period: 9 } },
  { id: "BB_UPPER", name: "Bollinger Upper Band", category: "Volatility", defaultParams: { period: 20, std_dev: 2.0 } },
  { id: "BB_LOWER", name: "Bollinger Lower Band", category: "Volatility", defaultParams: { period: 20, std_dev: 2.0 } },
  { id: "BB_MIDDLE", name: "Bollinger Middle (SMA)", category: "Volatility", defaultParams: { period: 20 } },
  { id: "ATR", name: "Average True Range (ATR)", category: "Volatility", defaultParams: { period: 14 } },
  { id: "ADX", name: "Average Directional Index (ADX)", category: "Trend Strength", defaultParams: { period: 14 } },
  { id: "STOCH_K", name: "Stochastic Oscillator %K", category: "Momentum", defaultParams: { k_period: 14 } },
  { id: "STOCH_D", name: "Stochastic Oscillator %D", category: "Momentum", defaultParams: { k_period: 14, d_period: 3 } },
  { id: "VWAP", name: "Volume Weighted Average Price (VWAP)", category: "Volume", defaultParams: {} },
  { id: "DONCHIAN_HIGH", name: "Donchian Upper Channel", category: "Breakout", defaultParams: { period: 20 } },
  { id: "DONCHIAN_LOW", name: "Donchian Lower Channel", category: "Breakout", defaultParams: { period: 10 } },
  { id: "KELTNER_UPPER", name: "Keltner Channel Upper", category: "Volatility", defaultParams: { ema_period: 20, atr_period: 10, multiplier: 2.0 } },
  { id: "KELTNER_LOWER", name: "Keltner Channel Lower", category: "Volatility", defaultParams: { ema_period: 20, atr_period: 10, multiplier: 2.0 } },
  { id: "ROC", name: "Rate of Change (ROC)", category: "Momentum", defaultParams: { period: 12 } },
  { id: "WILLR", name: "Williams %R", category: "Momentum", defaultParams: { period: 14 } },
  { id: "BB_WIDTH", name: "Bollinger Band Width", category: "Volatility", defaultParams: { period: 20, std_dev: 2.0 } },
  { id: "ZSCORE", name: "Rolling Price Z-Score", category: "Mean Reversion", defaultParams: { period: 20 } },
  { id: "WMA", name: "Weighted Moving Average (WMA)", category: "Trend", defaultParams: { period: 20 } },
  { id: "OBV", name: "On-Balance Volume (OBV)", category: "Volume", defaultParams: {} },
];

export const DEFAULT_STRATEGY: StrategyConfig = {
  id: "strat_default_ema",
  name: "EMA Momentum Alpha",
  description: "Institutional trend following with 12/26 EMA crossover, RSI momentum filter and strict stop-loss rules.",
  asset: "AAPL",
  universe: ["AAPL", "MSFT", "NVDA", "QQQ"],
  timeframe: "1D",
  indicators: [
    { id: "fast_ema", name: "EMA", params: { period: 12 } },
    { id: "slow_ema", name: "EMA", params: { period: 26 } },
    { id: "rsi_14", name: "RSI", params: { period: 14 } },
  ],
  entry_rules: [
    { id: "r1", indicator_a: "fast_ema", operator: ">", indicator_b: "slow_ema", logical_operator: "AND" },
    { id: "r2", indicator_a: "rsi_14", operator: ">", threshold: 50, logical_operator: "AND" },
  ],
  exit_rules: [
    { id: "x1", indicator_a: "fast_ema", operator: "<", indicator_b: "slow_ema", logical_operator: "OR" },
    { id: "x2", indicator_a: "rsi_14", operator: "<", threshold: 40 },
  ],
  risk: {
    stop_loss_pct: 2.0,
    take_profit_pct: 6.0,
    trailing_stop_pct: null,
    position_size_pct: 15.0,
    max_positions: 5,
    allow_short: false,
  },
  execution: {
    commission_pct: 0.05,
    slippage_pct: 0.05,
    spread_pct: 0.02,
    allow_fractional: true,
    initial_capital: 100000.0,
  },
};
