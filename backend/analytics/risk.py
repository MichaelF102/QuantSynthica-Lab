import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Any, Tuple
from ..models.schemas import RiskMetrics, EquityPoint

def calculate_risk_analytics(
    equity_curve: List[EquityPoint],
    risk_free_rate: float = 0.02
) -> RiskMetrics:
    """
    Computes institutional risk metrics: VaR (95, 99), CVaR (Expected Shortfall),
    downside deviation, rolling volatility, rolling Sharpe, return distribution,
    and market regime classification breakdown.
    """
    df_eq = pd.DataFrame([e.model_dump() for e in equity_curve])
    df_eq["date"] = pd.to_datetime(df_eq["date"])
    df_eq = df_eq.set_index("date")

    returns = df_eq["returns"].fillna(0.0)

    # 1. Historical VaR and CVaR (Expected Shortfall)
    # VaR is expressed as positive percentage loss
    var_95 = float(-np.percentile(returns, 5) * 100.0)
    var_99 = float(-np.percentile(returns, 1) * 100.0)

    tail_95 = returns[returns <= np.percentile(returns, 5)]
    cvar_95 = float(-tail_95.mean() * 100.0) if len(tail_95) > 0 else var_95

    tail_99 = returns[returns <= np.percentile(returns, 1)]
    cvar_99 = float(-tail_99.mean() * 100.0) if len(tail_99) > 0 else var_99

    # Downside deviation
    neg_rets = returns[returns < 0.0]
    downside_dev = float(neg_rets.std() * np.sqrt(252.0) * 100.0) if len(neg_rets) > 1 else 0.0

    # 2. Rolling 30-day Volatility
    rolling_vol_30 = (returns.rolling(window=30, min_periods=10).std() * np.sqrt(252.0) * 100.0).dropna()
    rolling_vol_list = [
        {"date": d.strftime("%Y-%m-%d"), "volatility": round(float(v), 2)}
        for d, v in rolling_vol_30.items()
    ]

    # 3. Rolling 60-day Sharpe
    rf_daily = risk_free_rate / 252.0
    rolling_mean = returns.rolling(window=60, min_periods=20).mean()
    rolling_std = returns.rolling(window=60, min_periods=20).std()
    rolling_sharpe = ((rolling_mean - rf_daily) / rolling_std.replace(0, np.nan) * np.sqrt(252.0)).dropna()
    rolling_sharpe_list = [
        {"date": d.strftime("%Y-%m-%d"), "sharpe": round(float(s), 2)}
        for d, s in rolling_sharpe.items()
    ]

    # 4. Return Distribution Histogram
    hist_counts, bin_edges = np.histogram(returns * 100.0, bins=25)
    mu, sigma = float(np.mean(returns * 100.0)), float(np.std(returns * 100.0))
    dist_list = []
    for i in range(len(hist_counts)):
        mid_bin = (bin_edges[i] + bin_edges[i+1]) / 2.0
        # Normal PDF fit for overlay
        norm_density = stats.norm.pdf(mid_bin, mu, sigma) if sigma > 0 else 0.0
        dist_list.append({
            "return_pct": round(float(mid_bin), 2),
            "frequency": int(hist_counts[i]),
            "normal_fit": round(float(norm_density * len(returns) * (bin_edges[1] - bin_edges[0])), 2)
        })

    # 5. Market Regime Detection & Performance Breakdown
    # Regimes classified by 50-day benchmark return trend and volatility:
    # - Bull: Bench 50d return > +5%
    # - Bear: Bench 50d return < -5%
    # - Sideways: Bench 50d return between -5% and +5%
    # - High Volatility: Top 30% rolling volatility days
    # - Low Volatility: Bottom 30% rolling volatility days
    bench_returns = df_eq["benchmark_returns"].fillna(0.0)
    bench_cum50 = bench_returns.rolling(window=50, min_periods=10).sum() * 100.0
    vol50 = returns.rolling(window=50, min_periods=10).std() * np.sqrt(252.0) * 100.0
    vol_p70 = vol50.quantile(0.70) if len(vol50) > 10 else 25.0
    vol_p30 = vol50.quantile(0.30) if len(vol50) > 10 else 12.0

    regimes_def = {
        "Bull Market": bench_cum50 > 5.0,
        "Bear Market": bench_cum50 < -5.0,
        "Sideways Market": (bench_cum50 >= -5.0) & (bench_cum50 <= 5.0),
        "High Volatility": vol50 >= vol_p70,
        "Low Volatility": vol50 <= vol_p30
    }

    regime_breakdown = {}
    for r_name, mask in regimes_def.items():
        sub_rets = returns[mask.fillna(False)]
        n_days = len(sub_rets)
        if n_days > 5:
            r_cagr = float(sub_rets.mean() * 252.0 * 100.0)
            r_vol = float(sub_rets.std() * np.sqrt(252.0) * 100.0)
            r_sharpe = float(((sub_rets.mean() * 252.0) - risk_free_rate) / (sub_rets.std() * np.sqrt(252.0))) if sub_rets.std() > 0 else 0.0
            r_win_rate = float((sub_rets > 0).mean() * 100.0)
        else:
            r_cagr, r_vol, r_sharpe, r_win_rate = 0.0, 0.0, 0.0, 0.0

        regime_breakdown[r_name] = {
            "days": n_days,
            "annualized_return": round(r_cagr, 2),
            "annualized_volatility": round(r_vol, 2),
            "sharpe_ratio": round(r_sharpe, 2),
            "win_rate": round(r_win_rate, 2)
        }

    return RiskMetrics(
        var_95=round(max(var_95, 0.0), 2),
        var_99=round(max(var_99, 0.0), 2),
        cvar_95=round(max(cvar_95, 0.0), 2),
        cvar_99=round(max(cvar_99, 0.0), 2),
        downside_deviation=round(downside_dev, 2),
        rolling_volatility_30d=rolling_vol_list,
        rolling_sharpe_60d=rolling_sharpe_list,
        return_distribution=dist_list,
        regimes=regime_breakdown
    )
