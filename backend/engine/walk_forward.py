import uuid
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from ..models.schemas import (
    WalkForwardRequest,
    WalkForwardResult,
    WalkForwardFold,
    EquityPoint,
    OptimizationRequest
)
from .optimization import run_parameter_optimization, _apply_param_to_strategy
from .backtester import BacktestEngine
from ..analytics.performance import calculate_performance_metrics

def run_walk_forward_validation(
    request: WalkForwardRequest,
    df_ohlcv: pd.DataFrame,
    df_benchmark: Optional[pd.Series] = None
) -> WalkForwardResult:
    """
    Executes an institutional Walk-Forward Optimization (WFO) analysis.
    Rolls train/test windows forward, locks parameters out-of-sample,
    and stitches the true out-of-sample equity curve.
    """
    n_bars = len(df_ohlcv)
    train_bars = request.train_window_bars
    test_bars = request.test_window_bars

    if n_bars < (train_bars + test_bars):
        raise ValueError(f"Insufficient bars ({n_bars}) for train ({train_bars}) + test ({test_bars}) windows")

    folds: List[WalkForwardFold] = []
    stitched_points: List[EquityPoint] = []
    oos_trades = []

    current_capital = float(request.strategy.execution.initial_capital)
    fold_idx = 1
    start_idx = 0

    all_best_params: List[Dict[str, float]] = []

    while (start_idx + train_bars + test_bars) <= n_bars:
        train_slice = df_ohlcv.iloc[start_idx : start_idx + train_bars]
        test_slice = df_ohlcv.iloc[start_idx + train_bars : start_idx + train_bars + test_bars]

        train_start = str(train_slice.index[0].strftime("%Y-%m-%d"))
        train_end = str(train_slice.index[-1].strftime("%Y-%m-%d"))
        test_start = str(test_slice.index[0].strftime("%Y-%m-%d"))
        test_end = str(test_slice.index[-1].strftime("%Y-%m-%d"))

        # 1. In-sample optimization
        opt_req = OptimizationRequest(
            strategy=request.strategy,
            start_date=train_start,
            end_date=train_end,
            parameters=request.parameters,
            method="grid",
            max_iterations=20,
            metric_target=request.metric_target
        )
        opt_res = run_parameter_optimization(opt_req, train_slice, df_benchmark)

        best_p = opt_res.best_params
        all_best_params.append(best_p)
        is_sharpe = opt_res.best_metrics.get("sharpe_ratio", 0.0)
        is_cagr = opt_res.best_metrics.get("cagr", 0.0)

        # 2. Out-of-sample test with locked parameters
        locked_strat = request.strategy.model_copy(deep=True)
        for p_spec in request.parameters:
            if p_spec.name in best_p:
                locked_strat = _apply_param_to_strategy(locked_strat, p_spec, best_p[p_spec.name])
        locked_strat.execution.initial_capital = current_capital

        oos_engine = BacktestEngine(locked_strat)
        oos_out = oos_engine.run(test_slice, df_benchmark)
        oos_perf, _ = calculate_performance_metrics(oos_out["equity_curve"], oos_out["trades"])

        folds.append(WalkForwardFold(
            fold=fold_idx,
            train_start=train_start,
            train_end=train_end,
            test_start=test_start,
            test_end=test_end,
            best_params=best_p,
            in_sample_sharpe=is_sharpe,
            in_sample_cagr=is_cagr,
            out_of_sample_sharpe=oos_perf.sharpe_ratio,
            out_of_sample_cagr=oos_perf.cagr,
            out_of_sample_drawdown=oos_perf.max_drawdown
        ))

        # Append to stitched out-of-sample equity curve
        for pt in oos_out["equity_curve"]:
            stitched_points.append(pt)
        oos_trades.extend(oos_out["trades"])

        if oos_out["equity_curve"]:
            current_capital = oos_out["equity_curve"][-1].portfolio_value

        fold_idx += 1
        start_idx += test_bars

    if not stitched_points:
        raise ValueError("Walk forward failed to generate folds")

    stitched_perf, _ = calculate_performance_metrics(stitched_points, oos_trades)

    # Compute degradation (average IS Sharpe vs average OOS Sharpe)
    avg_is_sharpe = float(np.mean([f.in_sample_sharpe for f in folds])) if folds else 1.0
    avg_oos_sharpe = float(np.mean([f.out_of_sample_sharpe for f in folds])) if folds else 0.0
    degradation = float(((avg_is_sharpe - avg_oos_sharpe) / max(abs(avg_is_sharpe), 0.01)) * 100.0)

    # Parameter stability score (0 to 100, 100 = perfectly stable identical params)
    stability_score = 85.0
    if len(all_best_params) > 1:
        # Check variance of normalized values
        variances = []
        for p_spec in request.parameters:
            vals = [p[p_spec.name] for p in all_best_params if p_spec.name in p]
            rng = max(p_spec.max_val - p_spec.min_val, 1.0)
            std_norm = np.std(vals) / rng if len(vals) > 1 else 0.0
            variances.append(std_norm)
        mean_var = float(np.mean(variances)) if variances else 0.0
        stability_score = max(0.0, min(100.0, (1.0 - mean_var * 2) * 100.0))

    return WalkForwardResult(
        id=str(uuid.uuid4())[:8],
        strategy_id=request.strategy.id,
        folds=folds,
        stitched_equity_curve=stitched_points,
        stitched_metrics=stitched_perf,
        degradation_pct=round(degradation, 1),
        parameter_stability_score=round(stability_score, 1)
    )
