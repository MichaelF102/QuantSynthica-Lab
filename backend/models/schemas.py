from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum

class RuleOperator(str, Enum):
    GT = ">"
    LT = "<"
    GTE = ">="
    LTE = "<="
    EQ = "=="
    NEQ = "!="
    CROSS_ABOVE = "CROSS_ABOVE"
    CROSS_BELOW = "CROSS_BELOW"

class IndicatorConfig(BaseModel):
    id: str
    name: str # e.g. "SMA", "EMA", "RSI", "MACD", "BB_UPPER", "BB_LOWER", "ATR", "ADX", "STOCH_K", "STOCH_D", "VWAP", "DONCHIAN_HIGH", "DONCHIAN_LOW", "KELTNER_UPPER", "KELTNER_LOWER"
    params: Dict[str, Any] = Field(default_factory=dict)

class ConditionRule(BaseModel):
    id: str
    indicator_a: str # indicator id, price field like "close", "open", "high", "low", or "volume"
    operator: RuleOperator
    indicator_b: Optional[str] = None # indicator id or price field
    threshold: Optional[float] = None # static numerical value if indicator_b is None
    logical_operator: Optional[str] = "AND" # "AND" or "OR" connecting to the next rule

class RiskConfig(BaseModel):
    stop_loss_pct: Optional[float] = 2.0
    take_profit_pct: Optional[float] = 6.0
    trailing_stop_pct: Optional[float] = None
    position_size_pct: float = 10.0 # % of equity per position
    max_positions: int = 5
    allow_short: bool = False
    target_volatility: Optional[float] = None

class ExecutionConfig(BaseModel):
    commission_pct: float = 0.05 # 0.05%
    slippage_pct: float = 0.05 # 0.05%
    spread_pct: float = 0.02 # 0.02%
    allow_fractional: bool = True
    initial_capital: float = 100000.0

class StrategyConfig(BaseModel):
    id: str
    name: str
    description: str = ""
    asset: str = "AAPL"
    universe: List[str] = Field(default_factory=lambda: ["AAPL"])
    timeframe: str = "1D"
    strategy_type: Optional[str] = "quantitative"
    tags: List[str] = Field(default_factory=list)
    indicators: List[IndicatorConfig] = Field(default_factory=list)
    entry_rules: List[ConditionRule] = Field(default_factory=list)
    exit_rules: List[ConditionRule] = Field(default_factory=list)
    risk: RiskConfig = Field(default_factory=RiskConfig)
    execution: ExecutionConfig = Field(default_factory=ExecutionConfig)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class MarketDataRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    timeframe: str = "1D"
    benchmark: Optional[str] = "SPY"
    indicators: Optional[List[IndicatorConfig]] = None

class TradeRecord(BaseModel):
    id: str
    ticker: str
    direction: str # "LONG" or "SHORT"
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    quantity: float
    gross_pnl: float
    fees: float
    net_pnl: float
    return_pct: float
    holding_period_bars: int
    exit_reason: str # "SIGNAL", "STOP_LOSS", "TAKE_PROFIT", "TRAILING_STOP", "END_OF_DATA"
    mae: float # Maximum Adverse Excursion %
    mfe: float # Maximum Favorable Excursion %

class PerformanceMetrics(BaseModel):
    total_return: float
    cagr: float
    annualized_return: float
    annualized_volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    max_drawdown: float
    max_drawdown_duration: int # bars
    win_rate: float
    loss_rate: float
    profit_factor: float
    expectancy: float
    num_trades: int
    winning_trades: int
    losing_trades: int
    avg_trade_return: float
    avg_win: float
    avg_loss: float
    avg_holding_period: float
    turnover: float
    total_fees: float
    gross_pnl: float
    net_pnl: float
    best_trade: float
    worst_trade: float
    alpha: float
    beta: float
    information_ratio: float
    tracking_error: float

class RiskMetrics(BaseModel):
    var_95: float
    var_99: float
    cvar_95: float # Expected Shortfall 95%
    cvar_99: float # Expected Shortfall 99%
    downside_deviation: float
    rolling_volatility_30d: Optional[List[Dict[str, Any]]] = None
    rolling_sharpe_60d: Optional[List[Dict[str, Any]]] = None
    return_distribution: Optional[List[Dict[str, Any]]] = None
    regimes: Optional[Dict[str, Any]] = None

class EquityPoint(BaseModel):
    date: str
    portfolio_value: float
    cash: float
    drawdown: float
    benchmark_value: float
    returns: float
    benchmark_returns: float

class BacktestRequest(BaseModel):
    strategy: StrategyConfig
    start_date: str
    end_date: str
    benchmark: str = "SPY"

class BacktestStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class BacktestResult(BaseModel):
    id: str
    strategy_id: str
    strategy_name: str
    ticker: str
    benchmark: str
    start_date: str
    end_date: str
    status: BacktestStatus = BacktestStatus.COMPLETED
    error: Optional[str] = None
    metrics: Optional[PerformanceMetrics] = None
    risk: Optional[RiskMetrics] = None
    equity_curve: List[EquityPoint] = Field(default_factory=list)
    trades: List[TradeRecord] = Field(default_factory=list)
    monthly_returns: List[Dict[str, Any]] = Field(default_factory=list)
    logs: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None

class OptimizationParamRange(BaseModel):
    name: str # e.g. "fast_period" or "stop_loss_pct"
    target: str # "indicator" or "risk" or "execution"
    id: Optional[str] = None # indicator id if target is "indicator"
    min_val: float
    max_val: float
    step: float

class OptimizationRequest(BaseModel):
    strategy: StrategyConfig
    start_date: str
    end_date: str
    benchmark: str = "SPY"
    parameters: List[OptimizationParamRange]
    method: str = "grid" # "grid" or "random"
    max_iterations: int = 50
    metric_target: str = "sharpe_ratio" # "sharpe_ratio", "total_return", "calmar_ratio", "win_rate"

class OptimizationIteration(BaseModel):
    iteration: int
    params: Dict[str, float]
    sharpe_ratio: float
    cagr: float
    max_drawdown: float
    total_return: float
    win_rate: float
    num_trades: int

class OptimizationResult(BaseModel):
    id: str
    strategy_id: str
    strategy_name: str
    best_params: Dict[str, float]
    best_metrics: Dict[str, float]
    total_evaluations: int
    heatmap_data: Optional[Dict[str, Any]] = None
    iterations: List[OptimizationIteration]
    overfitting_warning: bool
    overfitting_notes: str

class WalkForwardRequest(BaseModel):
    strategy: StrategyConfig
    start_date: str
    end_date: str
    benchmark: str = "SPY"
    train_window_bars: int = 252 # 1 year daily
    test_window_bars: int = 63   # ~1 quarter daily
    parameters: List[OptimizationParamRange]
    metric_target: str = "sharpe_ratio"

class WalkForwardFold(BaseModel):
    fold: int
    train_start: str
    train_end: str
    test_start: str
    test_end: str
    best_params: Dict[str, float]
    in_sample_sharpe: float
    in_sample_cagr: float
    out_of_sample_sharpe: float
    out_of_sample_cagr: float
    out_of_sample_drawdown: float

class WalkForwardResult(BaseModel):
    id: str
    strategy_id: str
    folds: List[WalkForwardFold]
    stitched_equity_curve: List[EquityPoint]
    stitched_metrics: PerformanceMetrics
    degradation_pct: float # Sharpe drop from IS to OOS
    parameter_stability_score: float

class PairsTradingRequest(BaseModel):
    ticker_a: str = "KO"
    ticker_b: str = "PEP"
    start_date: str = "2021-01-01"
    end_date: str = "2024-01-01"
    lookback_window: int = 60
    entry_z_score: float = 2.0
    exit_z_score: float = 0.5
    stop_z_score: float = 3.5
    initial_capital: float = 100000.0
    commission_pct: float = 0.05
    slippage_pct: float = 0.05

class PairsTradingResult(BaseModel):
    ticker_a: str
    ticker_b: str
    hedge_ratio: float
    r_squared: float
    adf_statistic: float
    p_value: float
    is_cointegrated: bool
    spread_series: List[Dict[str, Any]] # date, spread, z_score, upper_band, lower_band
    trades: List[TradeRecord]
    metrics: PerformanceMetrics
    equity_curve: List[EquityPoint]
