import pytest
import numpy as np
import pandas as pd
from backend.models.schemas import (
    StrategyConfig,
    IndicatorConfig,
    ConditionRule,
    RuleOperator,
    RiskConfig,
    ExecutionConfig
)
from backend.engine.signals import compute_indicators, generate_signals
from backend.engine.backtester import BacktestEngine
from backend.engine.data import generate_synthetic_ohlcv

def test_zero_lookahead_indicator_computation():
    """
    CRITICAL QUANT TEST:
    Modifying future price points (bars t+1, t+2, ...) MUST NOT alter indicator values at bar t.
    """
    df = generate_synthetic_ohlcv("TEST", "2023-01-01", "2023-06-01", seed=42)
    ind_configs = [
        IndicatorConfig(id="sma_20", name="SMA", params={"period": 20}),
        IndicatorConfig(id="ema_20", name="EMA", params={"period": 20}),
        IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14}),
        IndicatorConfig(id="macd", name="MACD", params={}),
        IndicatorConfig(id="bb_upper", name="BB_UPPER", params={"period": 20, "std_dev": 2.0}),
        IndicatorConfig(id="atr_14", name="ATR", params={"period": 14})
    ]

    res_orig = compute_indicators(df, ind_configs)
    split_bar = 50

    # Capture indicators up to split_bar
    snapshot_before = {cfg.id: res_orig[cfg.id].iloc[:split_bar].copy() for cfg in ind_configs}

    # Now drastically shock future prices after split_bar
    df_shocked = df.copy()
    df_shocked.iloc[split_bar:, df_shocked.columns.get_loc("close")] *= 5.0
    df_shocked.iloc[split_bar:, df_shocked.columns.get_loc("high")] *= 5.0
    df_shocked.iloc[split_bar:, df_shocked.columns.get_loc("low")] *= 5.0

    res_shocked = compute_indicators(df_shocked, ind_configs)

    # Values prior to split_bar must remain IDENTICAL
    for cfg in ind_configs:
        orig_vals = snapshot_before[cfg.id].values
        shocked_vals = res_shocked[cfg.id].iloc[:split_bar].values
        np.testing.assert_allclose(
            orig_vals,
            shocked_vals,
            rtol=1e-5,
            err_msg=f"Lookahead bias detected in {cfg.name}! Indicator changed when future prices changed."
        )

def test_zero_lookahead_execution_timing():
    """
    CRITICAL QUANT TEST:
    A signal triggered at bar t MUST NOT be filled at bar t open or before bar t close.
    Execution must occur strictly at bar t+1.
    """
    df = generate_synthetic_ohlcv("TEST", "2023-01-01", "2023-04-01", seed=10)

    strat = StrategyConfig(
        id="test_timing",
        name="Timing Test Strategy",
        asset="TEST",
        timeframe="1D",
        indicators=[
            IndicatorConfig(id="sma_fast", name="SMA", params={"period": 5}),
            IndicatorConfig(id="sma_slow", name="SMA", params={"period": 20})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="sma_fast", operator=RuleOperator.CROSS_ABOVE, indicator_b="sma_slow")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="sma_fast", operator=RuleOperator.CROSS_BELOW, indicator_b="sma_slow")
        ],
        risk=RiskConfig(stop_loss_pct=None, take_profit_pct=None, position_size_pct=50.0),
        execution=ExecutionConfig(commission_pct=0.0, slippage_pct=0.0)
    )

    df_ind = compute_indicators(df, strat.indicators)
    df_sig = generate_signals(df_ind, strat.entry_rules, strat.exit_rules)

    engine = BacktestEngine(strat)
    out = engine.run(df)

    entry_signal_indices = [i for i in range(len(df_sig)) if df_sig["signal_entry"].iloc[i]]
    if entry_signal_indices:
        first_sig_idx = entry_signal_indices[0]
        first_sig_date = df_sig.index[first_sig_idx].strftime("%Y-%m-%d")

        # The first trade entry date must be STRICTLY AFTER the signal bar
        if out["trades"]:
            first_trade = out["trades"][0]
            first_trade_dt = pd.to_datetime(first_trade.entry_date)
            sig_dt = pd.to_datetime(first_sig_date)
            assert first_trade_dt > sig_dt, (
                f"Look-ahead execution detected: trade filled on {first_trade.entry_date} "
                f"which is not after signal date {first_sig_date}"
            )
