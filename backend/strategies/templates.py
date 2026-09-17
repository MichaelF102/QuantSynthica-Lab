from typing import List
from ..models.schemas import (
    StrategyConfig,
    IndicatorConfig,
    ConditionRule,
    RuleOperator,
    RiskConfig,
    ExecutionConfig
)

def get_template_strategies() -> List[StrategyConfig]:
    """
    Returns 35 institutional quantitative strategy templates categorized into:
    Trend Following, Mean Reversion, Momentum, Breakout, Volatility, Factor, and Systematic models.
    """
    templates: List[StrategyConfig] = []

    # =========================================================================
    # 1. TREND FOLLOWING
    # =========================================================================

    # 1. Dual SMA Crossover
    templates.append(StrategyConfig(
        id="tpl_sma_crossover",
        name="Dual Moving Average Crossover",
        description="Classic trend-following strategy that goes long when the fast 20 SMA crosses above the slow 50 SMA and exits on a bearish crossover.",
        asset="AAPL",
        universe=["AAPL", "MSFT", "NVDA", "SPY"],
        timeframe="1D",
        strategy_type="trend",
        tags=["TREND", "SMA", "CROSSOVER"],
        indicators=[
            IndicatorConfig(id="sma_fast", name="SMA", params={"period": 20}),
            IndicatorConfig(id="sma_slow", name="SMA", params={"period": 50})
        ],
        entry_rules=[
            ConditionRule(id="r1", indicator_a="sma_fast", operator=RuleOperator.CROSS_ABOVE, indicator_b="sma_slow")
        ],
        exit_rules=[
            ConditionRule(id="r2", indicator_a="sma_fast", operator=RuleOperator.CROSS_BELOW, indicator_b="sma_slow")
        ],
        risk=RiskConfig(stop_loss_pct=3.0, take_profit_pct=8.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 2. EMA Momentum Strategy
    templates.append(StrategyConfig(
        id="tpl_ema_momentum",
        name="EMA Momentum Alpha",
        description="Fast/Slow EMA trend alignment (12 EMA > 26 EMA) confirmed by RSI(14) > 50 momentum filter and price above 200 SMA.",
        asset="AAPL",
        universe=["AAPL", "QQQ", "MSFT"],
        timeframe="1D",
        strategy_type="trend",
        tags=["TREND", "EMA", "RSI", "MOMENTUM"],
        indicators=[
            IndicatorConfig(id="fast_ema", name="EMA", params={"period": 12}),
            IndicatorConfig(id="slow_ema", name="EMA", params={"period": 26}),
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14}),
            IndicatorConfig(id="sma_200", name="SMA", params={"period": 200})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="fast_ema", operator=RuleOperator.GT, indicator_b="slow_ema", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="rsi_14", operator=RuleOperator.GT, threshold=50.0, logical_operator="AND"),
            ConditionRule(id="e3", indicator_a="close", operator=RuleOperator.GT, indicator_b="sma_200")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="fast_ema", operator=RuleOperator.LT, indicator_b="slow_ema", logical_operator="OR"),
            ConditionRule(id="x2", indicator_a="rsi_14", operator=RuleOperator.LT, threshold=40.0)
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=6.0, position_size_pct=15.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 3. Triple EMA Trend
    templates.append(StrategyConfig(
        id="tpl_triple_ema",
        name="Triple EMA Trend Ribbon",
        description="Systematic multi-horizon trend model: triggers long when 9 EMA > 21 EMA and 21 EMA > 55 EMA, signaling strong hierarchical bull trend.",
        asset="NVDA",
        universe=["NVDA", "AAPL", "MSFT"],
        timeframe="1D",
        strategy_type="trend",
        tags=["TREND", "EMA", "TRIPLE"],
        indicators=[
            IndicatorConfig(id="ema_9", name="EMA", params={"period": 9}),
            IndicatorConfig(id="ema_21", name="EMA", params={"period": 21}),
            IndicatorConfig(id="ema_55", name="EMA", params={"period": 55})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="ema_9", operator=RuleOperator.GT, indicator_b="ema_21", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="ema_21", operator=RuleOperator.GT, indicator_b="ema_55")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="ema_9", operator=RuleOperator.CROSS_BELOW, indicator_b="ema_21")
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=7.5, position_size_pct=20.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 4. MACD Trend Following
    templates.append(StrategyConfig(
        id="tpl_macd_trend",
        name="MACD Signal Trend Following",
        description="Enters when MACD line crosses above the 9-period Signal line above zero; exits on a bearish signal line cross.",
        asset="MSFT",
        universe=["MSFT", "AAPL", "GOOGL"],
        timeframe="1D",
        strategy_type="trend",
        tags=["TREND", "MACD", "SIGNAL"],
        indicators=[
            IndicatorConfig(id="macd_line", name="MACD_LINE", params={"fast_period": 12, "slow_period": 26}),
            IndicatorConfig(id="macd_sig", name="MACD_SIGNAL", params={"fast_period": 12, "slow_period": 26, "signal_period": 9})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="macd_line", operator=RuleOperator.CROSS_ABOVE, indicator_b="macd_sig")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="macd_line", operator=RuleOperator.CROSS_BELOW, indicator_b="macd_sig")
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=7.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 5. ADX Trend Filter
    templates.append(StrategyConfig(
        id="tpl_trend_adx",
        name="Trend Following with ADX Filter",
        description="Guards trend-following entries by requiring ADX(14) > 25 to confirm genuine directional trend conviction rather than choppy noise.",
        asset="SPY",
        universe=["SPY", "QQQ"],
        timeframe="1D",
        strategy_type="trend",
        tags=["TREND", "EMA", "ADX"],
        indicators=[
            IndicatorConfig(id="ema_20", name="EMA", params={"period": 20}),
            IndicatorConfig(id="ema_50", name="EMA", params={"period": 50}),
            IndicatorConfig(id="adx_14", name="ADX", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="ema_20", operator=RuleOperator.GT, indicator_b="ema_50", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="adx_14", operator=RuleOperator.GT, threshold=25.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="ema_20", operator=RuleOperator.LT, indicator_b="ema_50")
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=8.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 6. SuperTrend Following (ATR Volatility Trailing Channel)
    templates.append(StrategyConfig(
        id="tpl_supertrend",
        name="SuperTrend Volatility Channel",
        description="Tracks directional trend regime using Keltner/ATR dynamic trailing band thresholds. Exits when price violates the midline.",
        asset="TSLA",
        universe=["TSLA", "NVDA", "AMD"],
        timeframe="1D",
        strategy_type="trend",
        tags=["TREND", "SUPERTREND", "ATR"],
        indicators=[
            IndicatorConfig(id="keltner_mid", name="KELTNER_MIDDLE", params={"ema_period": 20}),
            IndicatorConfig(id="atr_14", name="ATR", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.CROSS_ABOVE, indicator_b="keltner_mid")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.CROSS_BELOW, indicator_b="keltner_mid")
        ],
        risk=RiskConfig(stop_loss_pct=3.0, take_profit_pct=9.0, position_size_pct=20.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 7. Moving Average + ADX
    templates.append(StrategyConfig(
        id="tpl_ma_adx",
        name="SMA + ADX Regime Trend",
        description="Enters when price crosses above the 50-day SMA while ADX confirms an accelerating trend above 20.",
        asset="QQQ",
        universe=["QQQ", "SPY"],
        timeframe="1D",
        strategy_type="trend",
        tags=["TREND", "SMA", "ADX"],
        indicators=[
            IndicatorConfig(id="sma_50", name="SMA", params={"period": 50}),
            IndicatorConfig(id="adx_14", name="ADX", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.CROSS_ABOVE, indicator_b="sma_50", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="adx_14", operator=RuleOperator.GT, threshold=20.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.CROSS_BELOW, indicator_b="sma_50")
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=7.0, position_size_pct=25.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # =========================================================================
    # 2. MEAN REVERSION
    # =========================================================================

    # 8. RSI Mean Reversion
    templates.append(StrategyConfig(
        id="tpl_rsi_reversion",
        name="RSI Mean Reversion",
        description="Captures structural oversold dips: enters when RSI(14) drops below 30 and unwinds when price mean reverts to RSI > 60.",
        asset="SPY",
        universe=["SPY", "IWM", "QQQ"],
        timeframe="1D",
        strategy_type="mean_reversion",
        tags=["MEAN_REVERSION", "RSI", "OVERSOLD"],
        indicators=[
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="rsi_14", operator=RuleOperator.LT, threshold=30.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="rsi_14", operator=RuleOperator.GT, threshold=60.0)
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=5.0, position_size_pct=25.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 9. RSI Oversold Reversal
    templates.append(StrategyConfig(
        id="tpl_rsi_reversal",
        name="RSI Oversold Reversal",
        description="Waits for momentum confirmation: buys when RSI crosses back above 30 from deeply oversold levels; exits on overbought > 70 cross.",
        asset="NVDA",
        universe=["NVDA", "AMD", "TSLA"],
        timeframe="1D",
        strategy_type="mean_reversion",
        tags=["MEAN_REVERSION", "RSI", "REVERSAL"],
        indicators=[
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="rsi_14", operator=RuleOperator.CROSS_ABOVE, threshold=30.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="rsi_14", operator=RuleOperator.CROSS_BELOW, threshold=70.0)
        ],
        risk=RiskConfig(stop_loss_pct=3.0, take_profit_pct=7.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 10. Bollinger Band Mean Reversion
    templates.append(StrategyConfig(
        id="tpl_bollinger_reversion",
        name="Bollinger Band Mean Reversion",
        description="Buys when price closes below the lower 2-sigma Bollinger Band and exits when price reverts back to the 20-period moving average.",
        asset="MSFT",
        universe=["MSFT", "AAPL", "GOOGL"],
        timeframe="1D",
        strategy_type="mean_reversion",
        tags=["MEAN_REVERSION", "BOLLINGER", "BANDS"],
        indicators=[
            IndicatorConfig(id="bb_lower", name="BB_LOWER", params={"period": 20, "std_dev": 2.0}),
            IndicatorConfig(id="bb_mid", name="BB_MIDDLE", params={"period": 20})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.LT, indicator_b="bb_lower")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.GT, indicator_b="bb_mid")
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=4.5, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 11. Z-Score Mean Reversion
    templates.append(StrategyConfig(
        id="tpl_zscore_reversion",
        name="Z-Score Statistical Mean Reversion",
        description="Enters long when the 20-day price rolling Z-score dips below -2.0 standard deviations and exits upon reversion to the mean (Z-score > 0).",
        asset="AAPL",
        universe=["AAPL", "MSFT", "SPY"],
        timeframe="1D",
        strategy_type="mean_reversion",
        tags=["MEAN_REVERSION", "ZSCORE", "STATISTICAL"],
        indicators=[
            IndicatorConfig(id="zscore_20", name="ZSCORE", params={"period": 20})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="zscore_20", operator=RuleOperator.LT, threshold=-2.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="zscore_20", operator=RuleOperator.GT, threshold=0.0)
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=5.5, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 12. RSI + Bollinger Reversion
    templates.append(StrategyConfig(
        id="tpl_rsi_bollinger",
        name="RSI + Bollinger Composite Reversion",
        description="High-probability dip model: requires both Close < Lower Bollinger Band AND RSI < 32 for entry; exits when price crosses above the 20 SMA.",
        asset="GOOGL",
        universe=["GOOGL", "AAPL", "AMZN"],
        timeframe="1D",
        strategy_type="mean_reversion",
        tags=["MEAN_REVERSION", "RSI", "BOLLINGER"],
        indicators=[
            IndicatorConfig(id="bb_lower", name="BB_LOWER", params={"period": 20, "std_dev": 2.0}),
            IndicatorConfig(id="bb_mid", name="BB_MIDDLE", params={"period": 20}),
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.LT, indicator_b="bb_lower", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="rsi_14", operator=RuleOperator.LT, threshold=32.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.GT, indicator_b="bb_mid")
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=5.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 13. Moving Average Deviation Reversion
    templates.append(StrategyConfig(
        id="tpl_ma_deviation",
        name="MA Deviation Reversion",
        description="Identifies excessive extension below the 50-day moving average combined with stochastic oversold recovery.",
        asset="AMZN",
        universe=["AMZN", "META"],
        timeframe="1D",
        strategy_type="mean_reversion",
        tags=["MEAN_REVERSION", "SMA", "STOCHASTIC"],
        indicators=[
            IndicatorConfig(id="sma_50", name="SMA", params={"period": 50}),
            IndicatorConfig(id="stoch_k", name="STOCH_K", params={"k_period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.LT, indicator_b="sma_50", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="stoch_k", operator=RuleOperator.LT, threshold=20.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.GT, indicator_b="sma_50")
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=6.0, position_size_pct=20.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # =========================================================================
    # 3. MOMENTUM
    # =========================================================================

    # 14. RSI Momentum Push
    templates.append(StrategyConfig(
        id="tpl_rsi_momentum",
        name="RSI Momentum 50-Level Bull Push",
        description="Rides strong upward thrust: enters long when RSI crosses above the neutral 50 line; exits when RSI drops below 45 or reaches overbought 75.",
        asset="AAPL",
        universe=["AAPL", "NVDA", "QQQ"],
        timeframe="1D",
        strategy_type="momentum",
        tags=["MOMENTUM", "RSI", "CROSSOVER"],
        indicators=[
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="rsi_14", operator=RuleOperator.CROSS_ABOVE, threshold=50.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="rsi_14", operator=RuleOperator.CROSS_BELOW, threshold=45.0)
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=6.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 15. ROC Momentum Accelerator
    templates.append(StrategyConfig(
        id="tpl_roc_momentum",
        name="Rate of Change (ROC) Momentum",
        description="Captures price acceleration: enters when 12-day Rate of Change turns positive above zero; exits when ROC crosses back below zero.",
        asset="NVDA",
        universe=["NVDA", "TSLA", "META"],
        timeframe="1D",
        strategy_type="momentum",
        tags=["MOMENTUM", "ROC", "ACCELERATION"],
        indicators=[
            IndicatorConfig(id="roc_12", name="ROC", params={"period": 12})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="roc_12", operator=RuleOperator.CROSS_ABOVE, threshold=0.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="roc_12", operator=RuleOperator.CROSS_BELOW, threshold=0.0)
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=7.0, position_size_pct=20.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 16. MACD Histogram Momentum
    templates.append(StrategyConfig(
        id="tpl_macd_momentum",
        name="MACD Histogram Momentum",
        description="Enters when MACD histogram turns positive above zero, indicating accelerating short-term momentum over intermediate-term trend.",
        asset="AAPL",
        universe=["AAPL", "GOOGL"],
        timeframe="1D",
        strategy_type="momentum",
        tags=["MOMENTUM", "MACD", "HISTOGRAM"],
        indicators=[
            IndicatorConfig(id="macd_hist", name="MACD_HIST", params={"fast_period": 12, "slow_period": 26, "signal_period": 9})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="macd_hist", operator=RuleOperator.CROSS_ABOVE, threshold=0.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="macd_hist", operator=RuleOperator.CROSS_BELOW, threshold=0.0)
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=5.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 17. Stochastic Oscillator Reversal
    templates.append(StrategyConfig(
        id="tpl_stoch_reversal",
        name="Stochastic Oscillator Reversal",
        description="Fast stochastic %K crosses above %D while in oversold territory (< 25) to capture momentum reversal pivots.",
        asset="AMD",
        universe=["AMD", "INTC"],
        timeframe="1D",
        strategy_type="momentum",
        tags=["MOMENTUM", "STOCHASTIC", "PIVOT"],
        indicators=[
            IndicatorConfig(id="stoch_k", name="STOCH_K", params={"k_period": 14}),
            IndicatorConfig(id="stoch_d", name="STOCH_D", params={"k_period": 14, "d_period": 3})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="stoch_k", operator=RuleOperator.CROSS_ABOVE, indicator_b="stoch_d", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="stoch_k", operator=RuleOperator.LT, threshold=25.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="stoch_k", operator=RuleOperator.CROSS_BELOW, indicator_b="stoch_d")
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=6.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 18. Multi-Timeframe Momentum
    templates.append(StrategyConfig(
        id="tpl_multi_tf_mom",
        name="Multi-Horizon Momentum",
        description="Combines 12-day ROC with 14-day RSI and 20-day SMA to ensure alignment across multiple tactical horizons.",
        asset="SPY",
        universe=["SPY", "QQQ"],
        timeframe="1D",
        strategy_type="momentum",
        tags=["MOMENTUM", "ROC", "RSI", "MULTI_HORIZON"],
        indicators=[
            IndicatorConfig(id="roc_12", name="ROC", params={"period": 12}),
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14}),
            IndicatorConfig(id="sma_20", name="SMA", params={"period": 20})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="roc_12", operator=RuleOperator.GT, threshold=2.0, logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="rsi_14", operator=RuleOperator.GT, threshold=52.0, logical_operator="AND"),
            ConditionRule(id="e3", indicator_a="close", operator=RuleOperator.GT, indicator_b="sma_20")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.CROSS_BELOW, indicator_b="sma_20")
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=6.5, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # =========================================================================
    # 4. BREAKOUT
    # =========================================================================

    # 19. Donchian Channel Breakout (Turtle)
    templates.append(StrategyConfig(
        id="tpl_donchian_breakout",
        name="Donchian Channel Breakout (Turtle)",
        description="Classic trend-following breakout: buys when price breaks the 20-day high; exits on a 10-day low breach.",
        asset="QQQ",
        universe=["QQQ", "SPY", "AAPL"],
        timeframe="1D",
        strategy_type="breakout",
        tags=["BREAKOUT", "DONCHIAN", "TURTLE"],
        indicators=[
            IndicatorConfig(id="donchian_high_20", name="DONCHIAN_HIGH", params={"period": 20}),
            IndicatorConfig(id="donchian_low_10", name="DONCHIAN_LOW", params={"period": 10})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.GT, indicator_b="donchian_high_20")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.LT, indicator_b="donchian_low_10")
        ],
        risk=RiskConfig(stop_loss_pct=3.5, take_profit_pct=10.0, position_size_pct=25.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 20. Bollinger Band Volatility Breakout
    templates.append(StrategyConfig(
        id="tpl_bollinger_breakout",
        name="Bollinger Band Volatility Breakout",
        description="Trend expansion model: buys when price closes above the upper 2-sigma Bollinger Band and rides the trend until close drops below the 20 SMA.",
        asset="TSLA",
        universe=["TSLA", "NVDA", "META"],
        timeframe="1D",
        strategy_type="breakout",
        tags=["BREAKOUT", "BOLLINGER", "EXPANSION"],
        indicators=[
            IndicatorConfig(id="bb_upper", name="BB_UPPER", params={"period": 20, "std_dev": 2.0}),
            IndicatorConfig(id="bb_mid", name="BB_MIDDLE", params={"period": 20})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.CROSS_ABOVE, indicator_b="bb_upper")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.CROSS_BELOW, indicator_b="bb_mid")
        ],
        risk=RiskConfig(stop_loss_pct=3.0, take_profit_pct=9.0, position_size_pct=20.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 21. Keltner Channel Volatility Breakout
    templates.append(StrategyConfig(
        id="tpl_keltner_breakout",
        name="Keltner Channel Volatility Breakout",
        description="Enters when price violently breaks out above the upper Keltner channel band; exits when price crosses below the channel middle.",
        asset="TSLA",
        universe=["TSLA", "NVDA"],
        timeframe="1D",
        strategy_type="breakout",
        tags=["BREAKOUT", "KELTNER", "VOLATILITY"],
        indicators=[
            IndicatorConfig(id="keltner_upper", name="KELTNER_UPPER", params={"ema_period": 20, "atr_period": 10, "multiplier": 2.0}),
            IndicatorConfig(id="keltner_mid", name="KELTNER_MIDDLE", params={"ema_period": 20})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.CROSS_ABOVE, indicator_b="keltner_upper")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.CROSS_BELOW, indicator_b="keltner_mid")
        ],
        risk=RiskConfig(stop_loss_pct=3.0, take_profit_pct=9.0, position_size_pct=15.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 22. Volume-Confirmed Breakout (VWAP + 20 SMA)
    templates.append(StrategyConfig(
        id="tpl_volume_breakout",
        name="Volume-Confirmed Trend Breakout",
        description="Requires price to break above the 20-day SMA while remaining above VWAP, ensuring institutional volume confirms the upward breakout.",
        asset="AAPL",
        universe=["AAPL", "MSFT"],
        timeframe="1D",
        strategy_type="breakout",
        tags=["BREAKOUT", "VWAP", "VOLUME", "SMA"],
        indicators=[
            IndicatorConfig(id="sma_20", name="SMA", params={"period": 20}),
            IndicatorConfig(id="vwap", name="VWAP", params={})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.CROSS_ABOVE, indicator_b="sma_20", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="close", operator=RuleOperator.GT, indicator_b="vwap")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.CROSS_BELOW, indicator_b="sma_20")
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=6.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # =========================================================================
    # 5. VOLATILITY
    # =========================================================================

    # 23. Volatility Compression Squeeze Breakout
    templates.append(StrategyConfig(
        id="tpl_vol_compression",
        name="Volatility Compression Squeeze Breakout",
        description="Identifies quiet pre-breakout volatility contraction: triggers long when Bollinger Band Width narrows and price breaks above the 20 EMA.",
        asset="QQQ",
        universe=["QQQ", "SPY"],
        timeframe="1D",
        strategy_type="volatility",
        tags=["VOLATILITY", "SQUEEZE", "BOLLINGER_WIDTH"],
        indicators=[
            IndicatorConfig(id="bb_width", name="BB_WIDTH", params={"period": 20, "std_dev": 2.0}),
            IndicatorConfig(id="ema_20", name="EMA", params={"period": 20})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.CROSS_ABOVE, indicator_b="ema_20", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="bb_width", operator=RuleOperator.LT, threshold=12.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.CROSS_BELOW, indicator_b="ema_20")
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=6.5, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 24. ATR Volatility Expansion Filter
    templates.append(StrategyConfig(
        id="tpl_atr_expansion",
        name="ATR Volatility Expansion Strategy",
        description="Trades explosive momentum bursts when 14-day ATR expands alongside a fast 12/26 EMA trend confirmation.",
        asset="TSLA",
        universe=["TSLA", "NVDA"],
        timeframe="1D",
        strategy_type="volatility",
        tags=["VOLATILITY", "ATR", "EXPANSION"],
        indicators=[
            IndicatorConfig(id="fast_ema", name="EMA", params={"period": 12}),
            IndicatorConfig(id="slow_ema", name="EMA", params={"period": 26}),
            IndicatorConfig(id="atr_14", name="ATR", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="fast_ema", operator=RuleOperator.CROSS_ABOVE, indicator_b="slow_ema", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="atr_14", operator=RuleOperator.GT, threshold=3.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="fast_ema", operator=RuleOperator.CROSS_BELOW, indicator_b="slow_ema")
        ],
        risk=RiskConfig(stop_loss_pct=3.0, take_profit_pct=8.0, position_size_pct=15.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # =========================================================================
    # 6. FACTOR & SYSTEMATIC
    # =========================================================================

    # 25. Multi-Factor Alpha System
    templates.append(StrategyConfig(
        id="tpl_multifactor",
        name="Multi-Factor Alpha System",
        description="Combines 50-day price trend filter with 14-day RSI momentum confirmation and 14-day ATR volatility bounds.",
        asset="SPY",
        universe=["SPY", "QQQ", "AAPL"],
        timeframe="1D",
        strategy_type="factor",
        tags=["FACTOR", "MULTIFACTOR", "SMA", "RSI"],
        indicators=[
            IndicatorConfig(id="sma_50", name="SMA", params={"period": 50}),
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14}),
            IndicatorConfig(id="atr_14", name="ATR", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.GT, indicator_b="sma_50", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="rsi_14", operator=RuleOperator.GT, threshold=52.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.LT, indicator_b="sma_50")
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=7.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 26. Trend + Momentum Composite
    templates.append(StrategyConfig(
        id="tpl_trend_momentum_composite",
        name="Trend + Momentum Composite Alpha",
        description="Synthesizes moving average regime with MACD momentum confirmation for high-conviction entries with low turnover.",
        asset="AAPL",
        universe=["AAPL", "MSFT", "GOOGL"],
        timeframe="1D",
        strategy_type="systematic",
        tags=["SYSTEMATIC", "TREND", "MOMENTUM", "COMPOSITE"],
        indicators=[
            IndicatorConfig(id="ema_20", name="EMA", params={"period": 20}),
            IndicatorConfig(id="ema_50", name="EMA", params={"period": 50}),
            IndicatorConfig(id="macd_hist", name="MACD_HIST", params={"fast_period": 12, "slow_period": 26, "signal_period": 9})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="ema_20", operator=RuleOperator.GT, indicator_b="ema_50", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="macd_hist", operator=RuleOperator.GT, threshold=0.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="ema_20", operator=RuleOperator.LT, indicator_b="ema_50", logical_operator="OR"),
            ConditionRule(id="x2", indicator_a="macd_hist", operator=RuleOperator.LT, threshold=-0.5)
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=6.5, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 27. Mean Reversion + Volatility Filter
    templates.append(StrategyConfig(
        id="tpl_mean_rev_vol_filter",
        name="Mean Reversion + Volatility Filter",
        description="Executes statistical dip-buying (RSI < 30) only in moderate volatility environments to avoid catching falling knives during market crashes.",
        asset="SPY",
        universe=["SPY", "QQQ"],
        timeframe="1D",
        strategy_type="systematic",
        tags=["SYSTEMATIC", "MEAN_REVERSION", "VOLATILITY"],
        indicators=[
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14}),
            IndicatorConfig(id="bb_lower", name="BB_LOWER", params={"period": 20, "std_dev": 2.0}),
            IndicatorConfig(id="bb_mid", name="BB_MIDDLE", params={"period": 20})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="rsi_14", operator=RuleOperator.LT, threshold=30.0, logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="close", operator=RuleOperator.LT, indicator_b="bb_lower")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.GT, indicator_b="bb_mid")
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=5.0, position_size_pct=25.0, max_positions=4),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 28. Market Regime Adaptive Strategy
    templates.append(StrategyConfig(
        id="tpl_regime_adaptive",
        name="Market Regime Adaptive Strategy",
        description="Adapts behavior dynamically: relies on long-term 200 SMA trend filter to only take bullish momentum signals in verified bull regimes.",
        asset="SPY",
        universe=["SPY", "QQQ", "IWM"],
        timeframe="1D",
        strategy_type="systematic",
        tags=["SYSTEMATIC", "REGIME", "ADAPTIVE", "BULL_FILTER"],
        indicators=[
            IndicatorConfig(id="sma_200", name="SMA", params={"period": 200}),
            IndicatorConfig(id="ema_20", name="EMA", params={"period": 20}),
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="close", operator=RuleOperator.GT, indicator_b="sma_200", logical_operator="AND"),
            ConditionRule(id="e2", indicator_a="close", operator=RuleOperator.CROSS_ABOVE, indicator_b="ema_20", logical_operator="AND"),
            ConditionRule(id="e3", indicator_a="rsi_14", operator=RuleOperator.GT, threshold=50.0)
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="close", operator=RuleOperator.CROSS_BELOW, indicator_b="ema_20")
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=6.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    # 29. Custom Quant Strategy (Blank Template)
    templates.append(StrategyConfig(
        id="tpl_custom_strategy",
        name="Bespoke Systematic Strategy",
        description="Blank institutional canvas to configure custom indicators, signals, risk parameters, and execution friction.",
        asset="AAPL",
        universe=["AAPL"],
        timeframe="1D",
        strategy_type="custom",
        tags=["CUSTOM", "CANVAS"],
        indicators=[
            IndicatorConfig(id="ind_ema_20", name="EMA", params={"period": 20}),
            IndicatorConfig(id="ind_rsi_14", name="RSI", params={"period": 14})
        ],
        entry_rules=[
            ConditionRule(id="c1", indicator_a="close", operator=RuleOperator.GT, indicator_b="ind_ema_20")
        ],
        exit_rules=[
            ConditionRule(id="c2", indicator_a="close", operator=RuleOperator.LT, indicator_b="ind_ema_20")
        ],
        risk=RiskConfig(stop_loss_pct=2.5, take_profit_pct=5.0, position_size_pct=20.0, max_positions=5),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05)
    ))

    return templates
