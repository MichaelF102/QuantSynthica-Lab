export type RuleOperator =
  | ">"
  | "<"
  | ">="
  | "<="
  | "=="
  | "!="
  | "CROSS_ABOVE"
  | "CROSS_BELOW";

export interface IndicatorConfig {
  id: string;
  name: string;
  params: Record<string, any>;
}

export interface ConditionRule {
  id: string;
  indicator_a?: string;
  left_indicator?: string;
  operator: RuleOperator;
  indicator_b?: string | null;
  right_indicator?: string | null;
  threshold?: number | null;
  logical_operator?: "AND" | "OR";
}

export interface RiskConfig {
  stop_loss_pct?: number | null;
  take_profit_pct?: number | null;
  trailing_stop_pct?: number | null;
  position_size_pct: number;
  max_positions: number;
  allow_short: boolean;
  target_volatility?: number | null;
}

export interface ExecutionConfig {
  commission_pct: number;
  slippage_pct: number;
  spread_pct: number;
  allow_fractional: boolean;
  initial_capital: number;
}

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  asset: string;
  universe: string[];
  timeframe: string;
  strategy_type?: string;
  indicators: IndicatorConfig[];
  entry_rules: ConditionRule[];
  exit_rules: ConditionRule[];
  risk: RiskConfig;
  execution: ExecutionConfig;
  created_at?: string;
  updated_at?: string;
}

export interface TradeRecord {
  id: string;
  ticker: string;
  direction: "LONG" | "SHORT" | "SHORT_SPREAD" | "LONG_SPREAD";
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  gross_pnl: number;
  fees: number;
  net_pnl: number;
  return_pct: number;
  holding_period_bars: number;
  exit_reason: string;
  mae: number;
  mfe: number;
}

export interface PerformanceMetrics {
  total_return: number;
  cagr: number;
  annualized_return: number;
  annualized_volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  max_drawdown_duration: number;
  win_rate: number;
  loss_rate: number;
  profit_factor: number;
  expectancy: number;
  num_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_trade_return: number;
  avg_win: number;
  avg_loss: number;
  avg_holding_period: number;
  turnover: number;
  total_fees: number;
  gross_pnl: number;
  net_pnl: number;
  final_equity?: number;
  total_trades?: number;
  best_trade: number;
  worst_trade: number;
  alpha: number;
  beta: number;
  information_ratio: number;
  tracking_error: number;
}

export interface RiskMetrics {
  var_95: number;
  var_99: number;
  cvar_95: number;
  cvar_99: number;
  downside_deviation: number;
  rolling_volatility_30d?: { date: string; volatility: number }[];
  rolling_sharpe_60d?: { date: string; sharpe: number }[];
  return_distribution?: { return_pct: number; frequency: number; normal_fit: number }[];
  regimes?: Record<
    string,
    {
      days: number;
      annualized_return: number;
      annualized_volatility: number;
      sharpe_ratio: number;
      win_rate: number;
    }
  >;
}

export interface EquityPoint {
  date: string;
  portfolio_value: number;
  cash: number;
  drawdown: number;
  benchmark_value: number;
  returns: number;
  benchmark_returns: number;
}

export interface MonthlyReturnRecord {
  year: number;
  YTD: number;
  [month: string]: number;
}

export interface BacktestResult {
  id: string;
  strategy_id: string;
  strategy_name: string;
  ticker: string;
  asset?: string;
  benchmark: string;
  start_date: string;
  end_date: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  error?: string | null;
  metrics?: PerformanceMetrics;
  risk?: RiskMetrics;
  equity_curve: EquityPoint[];
  trades: TradeRecord[];
  monthly_returns: MonthlyReturnRecord[];
  strategy_config?: StrategyConfig;
  logs: string[];
  created_at?: string;
}

export interface MarketBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  return: number;
  drawdown: number;
  volatility: number;
  [indicatorKey: string]: any;
}

export interface StockProfile {
  symbol: string;
  yf_symbol: string;
  name: string;
  market: "US" | "India" | "Custom";
  exchange: string;
  isin?: string;
  price?: number | null;
  currency?: string;
  change_1d?: number | null;
  volume_1d?: number | null;
  market_cap?: number | null;
  pe_ratio?: number | null;
  eps_ttm?: number | null;
  dividend_yield?: number | null;
  sector?: string;
}

export interface MarketDataResponse {
  summary: {
    ticker: string;
    start_date: string;
    end_date: string;
    is_synthetic: boolean;
    total_bars: number;
    last_price: number;
    total_return: number;
    annualized_volatility: number;
    max_drawdown: number;
    beta: number;
    correlation: number;
    benchmark: string;
    profile?: StockProfile | null;
    high_52w?: number;
    low_52w?: number;
    avg_volume_30d?: number;
    perf_summary?: Record<
      string,
      {
        asset: number;
        benchmark: number;
        alpha: number;
        high: number;
        low: number;
        win_rate: number;
      }
    >;
  };
  bars: MarketBar[];
}

export interface OptimizationParamRange {
  name: string;
  target: "indicator" | "risk" | "execution";
  id?: string;
  min_val: number;
  max_val: number;
  step: number;
}

export interface OptimizationRequest {
  strategy: StrategyConfig;
  start_date: string;
  end_date: string;
  benchmark?: string;
  parameters: OptimizationParamRange[];
  method?: "grid" | "random";
  max_iterations?: number;
  metric_target?: string;
}

export interface OptimizationIteration {
  iteration: number;
  params: Record<string, number>;
  sharpe_ratio: number;
  cagr: number;
  max_drawdown: number;
  total_return: number;
  win_rate: number;
  num_trades: number;
}

export interface OptimizationResult {
  id: string;
  strategy_id: string;
  strategy_name: string;
  best_params: Record<string, number>;
  best_metrics: Record<string, number>;
  total_evaluations: number;
  heatmap_data?: {
    x_param: string;
    y_param: string;
    x_values: number[];
    y_values: number[];
    z_values: (number | null)[][];
  } | null;
  iterations: OptimizationIteration[];
  overfitting_warning: boolean;
  overfitting_notes: string;
}

export interface WalkForwardRequest {
  strategy: StrategyConfig;
  start_date: string;
  end_date: string;
  benchmark?: string;
  train_window_bars: number;
  test_window_bars: number;
  parameters: OptimizationParamRange[];
  metric_target?: string;
}

export interface WalkForwardFold {
  fold: number;
  train_start: string;
  train_end: string;
  test_start: string;
  test_end: string;
  best_params: Record<string, number>;
  in_sample_sharpe: number;
  in_sample_cagr: number;
  out_of_sample_sharpe: number;
  out_of_sample_cagr: number;
  out_of_sample_drawdown: number;
}

export interface WalkForwardResult {
  id: string;
  strategy_id: string;
  folds: WalkForwardFold[];
  stitched_equity_curve: EquityPoint[];
  stitched_metrics: PerformanceMetrics;
  degradation_pct: number;
  parameter_stability_score: number;
}

export interface PairsTradingRequest {
  ticker_a: string;
  ticker_b: string;
  start_date: string;
  end_date: string;
  lookback_window?: number;
  entry_z_score?: number;
  exit_z_score?: number;
  stop_z_score?: number;
  initial_capital?: number;
  commission_pct?: number;
  slippage_pct?: number;
}

export interface PairsTradingResult {
  ticker_a: string;
  ticker_b: string;
  hedge_ratio: number;
  r_squared: number;
  adf_statistic: number;
  p_value: number;
  is_cointegrated: boolean;
  spread_series: {
    date: string;
    spread: number;
    z_score: number;
    upper_entry: number;
    lower_entry: number;
    upper_exit: number;
    lower_exit: number;
  }[];
  trades: TradeRecord[];
  metrics: PerformanceMetrics;
  equity_curve: EquityPoint[];
}
