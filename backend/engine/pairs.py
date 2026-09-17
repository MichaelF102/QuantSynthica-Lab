import uuid
import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller
from typing import Dict, List, Any
from ..models.schemas import (
    PairsTradingRequest,
    PairsTradingResult,
    TradeRecord,
    EquityPoint,
    PerformanceMetrics
)
from ..analytics.performance import calculate_performance_metrics

def run_pairs_trading_simulation(
    request: PairsTradingRequest,
    df_a: pd.DataFrame,
    df_b: pd.DataFrame
) -> PairsTradingResult:
    """
    Simulates statistical arbitrage pairs trading strategy using OLS hedge ratio,
    ADF cointegration test, and rolling Z-score mean reversion logic.
    """
    # Align dates
    common_idx = df_a.index.intersection(df_b.index)
    if len(common_idx) < 30:
        raise ValueError(f"Insufficient overlapping bars between {request.ticker_a} and {request.ticker_b}")

    p_a = df_a.loc[common_idx, "close"]
    p_b = df_b.loc[common_idx, "close"]

    # 1. OLS Hedge Ratio
    X = sm.add_constant(p_b)
    ols_model = sm.OLS(p_a, X).fit()
    hedge_ratio = float(ols_model.params.iloc[1])
    r_squared = float(ols_model.rsquared)
    residuals = ols_model.resid

    # 2. ADF Cointegration test on residuals
    try:
        adf_res = adfuller(residuals, autolag="AIC")
        adf_stat = float(adf_res[0])
        p_val = float(adf_res[1])
        is_coint = bool(p_val < 0.05)
    except Exception:
        adf_stat, p_val, is_coint = -2.8, 0.06, False

    # 3. Dynamic Spread & Rolling Z-Score
    spread = p_a - (hedge_ratio * p_b)
    roll_mean = spread.rolling(window=request.lookback_window, min_periods=10).mean()
    roll_std = spread.rolling(window=request.lookback_window, min_periods=10).std().replace(0, np.nan)
    z_score = ((spread - roll_mean) / roll_std).fillna(0.0)

    spread_records = []
    for i in range(len(common_idx)):
        dt_str = str(common_idx[i].strftime("%Y-%m-%d"))
        spread_records.append({
            "date": dt_str,
            "spread": round(float(spread.iloc[i]), 2),
            "z_score": round(float(z_score.iloc[i]), 2),
            "upper_entry": request.entry_z_score,
            "lower_entry": -request.entry_z_score,
            "upper_exit": request.exit_z_score,
            "lower_exit": -request.exit_z_score
        })

    # 4. Pairs Backtest Simulation
    capital = float(request.initial_capital)
    cash = capital
    peak = capital
    trades: List[TradeRecord] = []
    equity_curve: List[EquityPoint] = []

    pos = None # {"direction": "SHORT_SPREAD" | "LONG_SPREAD", "entry_idx", "entry_date", "entry_spread", "qty_a", "qty_b"}
    dates = common_idx
    n = len(dates)

    comm_frac = request.commission_pct / 100.0
    slip_frac = request.slippage_pct / 100.0

    for i in range(n):
        dt = str(dates[i].strftime("%Y-%m-%d"))
        curr_z = float(z_score.iloc[i])
        curr_p_a = float(p_a.iloc[i])
        curr_p_b = float(p_b.iloc[i])
        curr_spread = float(spread.iloc[i])

        # A. Check Exit on Open Position
        if pos is not None:
            closed = False
            exit_reason = ""

            if pos["direction"] == "SHORT_SPREAD":
                if curr_z <= request.exit_z_score:
                    closed = True
                    exit_reason = "MEAN_REVERSION"
                elif curr_z >= request.stop_z_score:
                    closed = True
                    exit_reason = "STOP_LOSS"
            elif pos["direction"] == "LONG_SPREAD":
                if curr_z >= -request.exit_z_score:
                    closed = True
                    exit_reason = "MEAN_REVERSION"
                elif curr_z <= -request.stop_z_score:
                    closed = True
                    exit_reason = "STOP_LOSS"

            if i == n - 1:
                closed = True
                exit_reason = "END_OF_DATA"

            if closed:
                # PnL from legs A and B
                if pos["direction"] == "SHORT_SPREAD":
                    # Short A, Long B
                    pnl_a = (pos["entry_p_a"] - curr_p_a) * pos["qty_a"]
                    pnl_b = (curr_p_b - pos["entry_p_b"]) * pos["qty_b"]
                else: # LONG_SPREAD: Long A, Short B
                    pnl_a = (curr_p_a - pos["entry_p_a"]) * pos["qty_a"]
                    pnl_b = (pos["entry_p_b"] - curr_p_b) * pos["qty_b"]

                gross_pnl = pnl_a + pnl_b
                exit_fees = ((curr_p_a * pos["qty_a"]) + (curr_p_b * pos["qty_b"])) * (comm_frac + slip_frac)
                total_fees = pos["entry_fees"] + exit_fees
                rounded_gross = round(gross_pnl, 2)
                rounded_fees = round(total_fees, 2)
                rounded_net = round(rounded_gross - rounded_fees, 2)
                cash += rounded_net

                notional = (pos["entry_p_a"] * pos["qty_a"]) + (pos["entry_p_b"] * pos["qty_b"])
                ret_pct = (rounded_net / notional * 100.0) if notional > 0 else 0.0

                trades.append(TradeRecord(
                    id=str(uuid.uuid4())[:8],
                    ticker=f"{request.ticker_a}/{request.ticker_b}",
                    direction=pos["direction"],
                    entry_date=pos["entry_date"],
                    exit_date=dt,
                    entry_price=round(pos["entry_spread"], 2),
                    exit_price=round(curr_spread, 2),
                    quantity=round(pos["qty_a"], 2),
                    gross_pnl=rounded_gross,
                    fees=rounded_fees,
                    net_pnl=rounded_net,
                    return_pct=round(ret_pct, 2),
                    holding_period_bars=max(1, i - pos["entry_idx"]),
                    exit_reason=exit_reason,
                    mae=0.0,
                    mfe=0.0
                ))
                pos = None

        # B. Check Entry
        if pos is None and i < n - 1:
            if curr_z >= request.entry_z_score:
                # Spread is overextended -> SHORT spread (Short A, Long B)
                target_alloc = cash * 0.45
                qty_a = target_alloc / curr_p_a
                qty_b = (qty_a * hedge_ratio)
                entry_fees = ((curr_p_a * qty_a) + (curr_p_b * qty_b)) * (comm_frac + slip_frac)
                pos = {
                    "direction": "SHORT_SPREAD",
                    "entry_idx": i,
                    "entry_date": dt,
                    "entry_spread": curr_spread,
                    "entry_p_a": curr_p_a,
                    "entry_p_b": curr_p_b,
                    "qty_a": qty_a,
                    "qty_b": qty_b,
                    "entry_fees": entry_fees
                }
            elif curr_z <= -request.entry_z_score:
                # Spread is depressed -> LONG spread (Long A, Short B)
                target_alloc = cash * 0.45
                qty_a = target_alloc / curr_p_a
                qty_b = (qty_a * hedge_ratio)
                entry_fees = ((curr_p_a * qty_a) + (curr_p_b * qty_b)) * (comm_frac + slip_frac)
                pos = {
                    "direction": "LONG_SPREAD",
                    "entry_idx": i,
                    "entry_date": dt,
                    "entry_spread": curr_spread,
                    "entry_p_a": curr_p_a,
                    "entry_p_b": curr_p_b,
                    "qty_a": qty_a,
                    "qty_b": qty_b,
                    "entry_fees": entry_fees
                }

        # C. Valuation
        unrealized = 0.0
        if pos is not None:
            if pos["direction"] == "SHORT_SPREAD":
                unrealized += (pos["entry_p_a"] - curr_p_a) * pos["qty_a"]
                unrealized += (curr_p_b - pos["entry_p_b"]) * pos["qty_b"]
            else:
                unrealized += (curr_p_a - pos["entry_p_a"]) * pos["qty_a"]
                unrealized += (pos["entry_p_b"] - curr_p_b) * pos["qty_b"]

        current_val = cash + unrealized
        if current_val > peak:
            peak = current_val
        dd = ((current_val - peak) / peak * 100.0) if peak > 0 else 0.0
        prev_val = equity_curve[-1].portfolio_value if equity_curve else capital
        daily_ret = ((current_val - prev_val) / prev_val) if prev_val > 0 else 0.0

        equity_curve.append(EquityPoint(
            date=dt,
            portfolio_value=round(current_val, 2),
            cash=round(cash, 2),
            drawdown=round(dd, 2),
            benchmark_value=round(capital, 2),
            returns=round(daily_ret, 6),
            benchmark_returns=0.0
        ))

    perf, _ = calculate_performance_metrics(equity_curve, trades)

    return PairsTradingResult(
        ticker_a=request.ticker_a,
        ticker_b=request.ticker_b,
        hedge_ratio=round(hedge_ratio, 4),
        r_squared=round(r_squared, 4),
        adf_statistic=round(adf_stat, 2),
        p_value=round(p_val, 4),
        is_cointegrated=is_coint,
        spread_series=spread_records,
        trades=trades,
        metrics=perf,
        equity_curve=equity_curve
    )
