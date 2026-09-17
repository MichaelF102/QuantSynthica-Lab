import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from ..models.schemas import PerformanceMetrics, EquityPoint, TradeRecord

def calculate_performance_metrics(
    equity_curve: List[EquityPoint],
    trades: List[TradeRecord],
    risk_free_rate: float = 0.02
) -> Tuple[PerformanceMetrics, List[Dict[str, Any]]]:
    """
    Computes institutional performance metrics and monthly return attribution table.
    """
    if not equity_curve:
        raise ValueError("Equity curve is empty")

    df_eq = pd.DataFrame([e.model_dump() for e in equity_curve])
    df_eq["date"] = pd.to_datetime(df_eq["date"])
    df_eq = df_eq.set_index("date")

    initial_val = df_eq["portfolio_value"].iloc[0]
    final_val = df_eq["portfolio_value"].iloc[-1]
    n_bars = len(df_eq)
    n_years = max(n_bars / 252.0, 0.05)

    # Returns
    daily_returns = df_eq["returns"].fillna(0.0)
    bench_returns = df_eq["benchmark_returns"].fillna(0.0)

    total_return = ((final_val - initial_val) / initial_val) * 100.0
    cagr = (((final_val / initial_val) ** (1.0 / n_years)) - 1.0) * 100.0 if final_val > 0 else -100.0
    ann_return = daily_returns.mean() * 252.0 * 100.0

    # Volatility & Ratios
    daily_vol = daily_returns.std()
    ann_vol = (daily_vol * np.sqrt(252.0) * 100.0) if daily_vol > 0 else 0.0

    excess_ret = (daily_returns.mean() * 252.0) - risk_free_rate
    sharpe = (excess_ret / (daily_vol * np.sqrt(252.0))) if daily_vol > 1e-6 else 0.0

    neg_returns = daily_returns[daily_returns < 0.0]
    downside_vol = (neg_returns.std() * np.sqrt(252.0)) if len(neg_returns) > 1 else 1e-6
    sortino = (excess_ret / downside_vol) if downside_vol > 1e-6 else 0.0

    # Max Drawdown & Duration
    cum_max = df_eq["portfolio_value"].cummax()
    dd_series = (df_eq["portfolio_value"] - cum_max) / cum_max
    max_dd = abs(float(dd_series.min())) * 100.0

    # Max Drawdown Duration
    max_dd_duration = 0
    curr_dd_duration = 0
    for dd in dd_series:
        if dd < 0:
            curr_dd_duration += 1
            if curr_dd_duration > max_dd_duration:
                max_dd_duration = curr_dd_duration
        else:
            curr_dd_duration = 0

    calmar = (cagr / max_dd) if max_dd > 0.001 else 0.0

    # Trade statistics
    n_trades = len(trades)
    winning_trades = [t for t in trades if t.net_pnl > 0]
    losing_trades = [t for t in trades if t.net_pnl <= 0]
    n_win = len(winning_trades)
    n_loss = len(losing_trades)

    win_rate = (n_win / n_trades * 100.0) if n_trades > 0 else 0.0
    loss_rate = (n_loss / n_trades * 100.0) if n_trades > 0 else 0.0

    gross_gains = sum(t.gross_pnl for t in winning_trades)
    gross_losses = abs(sum(t.gross_pnl for t in losing_trades))
    profit_factor = (gross_gains / gross_losses) if gross_losses > 0 else (99.0 if gross_gains > 0 else 0.0)

    avg_win = (np.mean([t.return_pct for t in winning_trades])) if n_win > 0 else 0.0
    avg_loss = (np.mean([abs(t.return_pct) for t in losing_trades])) if n_loss > 0 else 0.0
    expectancy = ((win_rate / 100.0) * avg_win) - ((loss_rate / 100.0) * avg_loss)

    avg_trade_return = np.mean([t.return_pct for t in trades]) if n_trades > 0 else 0.0
    avg_holding_period = np.mean([t.holding_period_bars for t in trades]) if n_trades > 0 else 0.0

    total_fees = sum(t.fees for t in trades)
    gross_pnl = sum(t.gross_pnl for t in trades)
    net_pnl = sum(t.net_pnl for t in trades)

    best_trade = max([t.return_pct for t in trades]) if n_trades > 0 else 0.0
    worst_trade = min([t.return_pct for t in trades]) if n_trades > 0 else 0.0

    # Turnover: notional traded / avg equity
    total_traded_notional = sum((t.entry_price + t.exit_price) * t.quantity for t in trades)
    avg_equity = df_eq["portfolio_value"].mean()
    turnover = (total_traded_notional / (avg_equity * n_years)) if avg_equity > 0 else 0.0

    # Benchmark analytics (Alpha, Beta, Tracking Error, Information Ratio)
    covariance_matrix = np.cov(daily_returns, bench_returns)
    var_bench = covariance_matrix[1, 1]
    cov_strat_bench = covariance_matrix[0, 1]
    beta = (cov_strat_bench / var_bench) if var_bench > 1e-6 else 1.0

    ann_bench_ret = bench_returns.mean() * 252.0 * 100.0
    alpha = ann_return - (risk_free_rate * 100.0 + beta * (ann_bench_ret - risk_free_rate * 100.0))

    active_returns = daily_returns - bench_returns
    tracking_error = (active_returns.std() * np.sqrt(252.0) * 100.0) if len(active_returns) > 1 else 0.0
    info_ratio = ((active_returns.mean() * np.sqrt(252.0)) / active_returns.std()) if active_returns.std() > 1e-6 else 0.0

    metrics = PerformanceMetrics(
        total_return=round(float(total_return), 2),
        cagr=round(float(cagr), 2),
        annualized_return=round(float(ann_return), 2),
        annualized_volatility=round(float(ann_vol), 2),
        sharpe_ratio=round(float(sharpe), 2),
        sortino_ratio=round(float(sortino), 2),
        calmar_ratio=round(float(calmar), 2),
        max_drawdown=round(float(max_dd), 2),
        max_drawdown_duration=int(max_dd_duration),
        win_rate=round(float(win_rate), 2),
        loss_rate=round(float(loss_rate), 2),
        profit_factor=round(float(profit_factor), 2),
        expectancy=round(float(expectancy), 2),
        num_trades=int(n_trades),
        winning_trades=int(n_win),
        losing_trades=int(n_loss),
        avg_trade_return=round(float(avg_trade_return), 2),
        avg_win=round(float(avg_win), 2),
        avg_loss=round(float(avg_loss), 2),
        avg_holding_period=round(float(avg_holding_period), 1),
        turnover=round(float(turnover), 2),
        total_fees=round(float(total_fees), 2),
        gross_pnl=round(float(gross_pnl), 2),
        net_pnl=round(float(net_pnl), 2),
        best_trade=round(float(best_trade), 2),
        worst_trade=round(float(worst_trade), 2),
        alpha=round(float(alpha), 2),
        beta=round(float(beta), 2),
        information_ratio=round(float(info_ratio), 2),
        tracking_error=round(float(tracking_error), 2)
    )

    # Monthly return matrix
    try:
        monthly_series = df_eq["portfolio_value"].resample("ME").last()
    except ValueError:
        monthly_series = df_eq["portfolio_value"].resample("M").last()
    monthly_ret = monthly_series.pct_change().fillna(
        (monthly_series.iloc[0] - initial_val) / initial_val if len(monthly_series) > 0 else 0.0
    ) * 100.0

    monthly_records: Dict[int, Dict[str, Any]] = {}
    for dt_idx, val in monthly_ret.items():
        year = dt_idx.year
        month = dt_idx.strftime("%b")
        if year not in monthly_records:
            monthly_records[year] = {"year": year, "YTD": 0.0}
        monthly_records[year][month] = round(float(val), 2)

    # Compute yearly YTD
    for year, row in monthly_records.items():
        months = [v for k, v in row.items() if k not in ("year", "YTD")]
        compound = 1.0
        for m in months:
            compound *= (1.0 + m / 100.0)
        row["YTD"] = round((compound - 1.0) * 100.0, 2)

    monthly_table = sorted(list(monthly_records.values()), key=lambda x: x["year"], reverse=True)

    return metrics, monthly_table
