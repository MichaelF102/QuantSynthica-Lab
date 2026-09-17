import pytest
import numpy as np
import pandas as pd
from backend.models.schemas import EquityPoint, TradeRecord
from backend.analytics.performance import calculate_performance_metrics
from backend.analytics.risk import calculate_risk_analytics

def test_performance_and_risk_metrics_formulas():
    # Build controlled equity curve: 100 days compounding +0.1% daily
    dates = pd.bdate_range("2023-01-01", periods=100)
    curve = []
    val = 100000.0
    for i, d in enumerate(dates):
        daily_ret = 0.001 if i % 2 == 0 else -0.0005
        val *= (1.0 + daily_ret)
        curve.append(EquityPoint(
            date=d.strftime("%Y-%m-%d"),
            portfolio_value=round(val, 2),
            cash=round(val * 0.5, 2),
            drawdown=0.5,
            benchmark_value=100000.0,
            returns=daily_ret,
            benchmark_returns=0.0002
        ))

    trades = [
        TradeRecord(
            id="t1", ticker="AAPL", direction="LONG",
            entry_date="2023-01-05", exit_date="2023-01-15",
            entry_price=150.0, exit_price=160.0, quantity=100,
            gross_pnl=1000.0, fees=20.0, net_pnl=980.0, return_pct=6.53,
            holding_period_bars=10, exit_reason="TAKE_PROFIT", mae=0.5, mfe=6.53
        ),
        TradeRecord(
            id="t2", ticker="AAPL", direction="LONG",
            entry_date="2023-02-01", exit_date="2023-02-05",
            entry_price=160.0, exit_price=155.0, quantity=100,
            gross_pnl=-500.0, fees=20.0, net_pnl=-520.0, return_pct=-3.25,
            holding_period_bars=4, exit_reason="STOP_LOSS", mae=-3.25, mfe=0.2
        )
    ]

    perf, monthly = calculate_performance_metrics(curve, trades)
    assert perf.num_trades == 2
    assert perf.winning_trades == 1
    assert perf.losing_trades == 1
    assert perf.win_rate == 50.0
    assert perf.profit_factor == round(1000.0 / 500.0, 2)

    risk = calculate_risk_analytics(curve)
    assert risk.var_95 >= 0.0
    assert risk.var_99 >= 0.0
    assert risk.cvar_95 >= risk.var_95
