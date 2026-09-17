import pytest
import pandas as pd
from backend.models.schemas import (
    StrategyConfig,
    IndicatorConfig,
    ConditionRule,
    RuleOperator,
    RiskConfig,
    ExecutionConfig
)
from backend.engine.backtester import BacktestEngine
from backend.engine.data import generate_synthetic_ohlcv

def test_backtester_execution_and_costs():
    df = generate_synthetic_ohlcv("AAPL", "2023-01-01", "2023-08-01", seed=7)
    strat = StrategyConfig(
        id="test_bt",
        name="Test BT Strategy",
        asset="AAPL",
        timeframe="1D",
        indicators=[
            IndicatorConfig(id="sma_10", name="SMA", params={"period": 10}),
            IndicatorConfig(id="sma_30", name="SMA", params={"period": 30})
        ],
        entry_rules=[
            ConditionRule(id="e1", indicator_a="sma_10", operator=RuleOperator.GT, indicator_b="sma_30")
        ],
        exit_rules=[
            ConditionRule(id="x1", indicator_a="sma_10", operator=RuleOperator.LT, indicator_b="sma_30")
        ],
        risk=RiskConfig(stop_loss_pct=2.0, take_profit_pct=5.0, position_size_pct=20.0),
        execution=ExecutionConfig(commission_pct=0.05, slippage_pct=0.05, initial_capital=100000.0)
    )

    engine = BacktestEngine(strat)
    out = engine.run(df)

    assert "equity_curve" in out
    assert "trades" in out
    assert len(out["equity_curve"]) == len(df)

    # Validate trades have fees and net_pnl = gross_pnl - fees
    for t in out["trades"]:
        assert t.fees > 0
        assert round(t.net_pnl, 2) == round(t.gross_pnl - t.fees, 2)
        assert t.exit_reason in ("SIGNAL", "STOP_LOSS", "TAKE_PROFIT", "TRAILING_STOP", "END_OF_DATA")
