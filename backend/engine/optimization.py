import copy
import uuid
import itertools
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from ..models.schemas import (
    OptimizationRequest,
    OptimizationResult,
    OptimizationIteration,
    OptimizationParamRange,
    StrategyConfig
)
from .backtester import BacktestEngine
from ..analytics.performance import calculate_performance_metrics

def _apply_param_to_strategy(strategy: StrategyConfig, param: OptimizationParamRange, val: float) -> StrategyConfig:
    s = strategy.model_copy(deep=True)
    if param.target == "indicator":
        for ind in s.indicators:
            if ind.id == param.id or ind.name.lower() == param.name.lower():
                # Cast to int if period
                if "period" in param.name.lower():
                    ind.params[param.name] = int(val)
                else:
                    ind.params[param.name] = float(val)
    elif param.target == "risk":
        if hasattr(s.risk, param.name):
            setattr(s.risk, param.name, float(val))
    elif param.target == "execution":
        if hasattr(s.execution, param.name):
            setattr(s.execution, param.name, float(val))
    return s

def run_parameter_optimization(
    request: OptimizationRequest,
    df_ohlcv: pd.DataFrame,
    df_benchmark: Optional[pd.Series] = None
) -> OptimizationResult:
    """
    Executes parameter grid or random search. Generates 2D parameter heatmaps
    and evaluates parameter robustness vs overfitting.
    """
    params = request.parameters
    if not params:
        raise ValueError("No optimization parameters supplied")

    # Generate parameter grids
    param_values = {}
    for p in params:
        steps = int(np.floor((p.max_val - p.min_val) / p.step)) + 1
        vals = [p.min_val + i * p.step for i in range(steps)]
        param_values[p.name] = vals

    all_keys = list(param_values.keys())
    all_combos = list(itertools.product(*[param_values[k] for k in all_keys]))

    if request.method == "random" and len(all_combos) > request.max_iterations:
        idx_sample = np.random.choice(len(all_combos), size=request.max_iterations, replace=False)
        selected_combos = [all_combos[i] for i in idx_sample]
    else:
        selected_combos = all_combos[:request.max_iterations]

    iterations: List[OptimizationIteration] = []
    best_target_val = -float("inf")
    best_params: Dict[str, float] = {}
    best_metrics: Dict[str, float] = {}

    for idx, combo in enumerate(selected_combos):
        combo_dict = {all_keys[i]: combo[i] for i in range(len(all_keys))}

        # Clone and mutate strategy
        strat_candidate = request.strategy.model_copy(deep=True)
        for p_spec in params:
            val = combo_dict[p_spec.name]
            strat_candidate = _apply_param_to_strategy(strat_candidate, p_spec, val)

        # Execute backtest
        engine = BacktestEngine(strat_candidate)
        bt_out = engine.run(df_ohlcv, df_benchmark)
        perf, _ = calculate_performance_metrics(bt_out["equity_curve"], bt_out["trades"])

        iter_rec = OptimizationIteration(
            iteration=idx + 1,
            params=combo_dict,
            sharpe_ratio=perf.sharpe_ratio,
            cagr=perf.cagr,
            max_drawdown=perf.max_drawdown,
            total_return=perf.total_return,
            win_rate=perf.win_rate,
            num_trades=perf.num_trades
        )
        iterations.append(iter_rec)

        curr_target = getattr(perf, request.metric_target, perf.sharpe_ratio)
        if curr_target > best_target_val:
            best_target_val = curr_target
            best_params = combo_dict
            best_metrics = {
                "sharpe_ratio": perf.sharpe_ratio,
                "cagr": perf.cagr,
                "max_drawdown": perf.max_drawdown,
                "total_return": perf.total_return,
                "win_rate": perf.win_rate,
                "profit_factor": perf.profit_factor,
                "num_trades": perf.num_trades
            }

    # Generate 2D Heatmap if at least 2 parameters
    heatmap_data = None
    if len(all_keys) >= 2:
        x_param = all_keys[0]
        y_param = all_keys[1]
        x_vals = sorted(list(set(param_values[x_param])))
        y_vals = sorted(list(set(param_values[y_param])))

        z_matrix = []
        for y in y_vals:
            row = []
            for x in x_vals:
                # Find matching iteration
                matching = [it for it in iterations if it.params.get(x_param) == x and it.params.get(y_param) == y]
                if matching:
                    row.append(round(matching[0].sharpe_ratio, 2))
                else:
                    row.append(None)
            z_matrix.append(row)

        heatmap_data = {
            "x_param": x_param,
            "y_param": y_param,
            "x_values": x_vals,
            "y_values": y_vals,
            "z_values": z_matrix
        }

    # Overfitting analysis: check parameter sensitivity / isolated peak
    sharpes = [it.sharpe_ratio for it in iterations]
    mean_sharpe = float(np.mean(sharpes)) if sharpes else 0.0
    std_sharpe = float(np.std(sharpes)) if sharpes else 0.0
    max_sharpe = max(sharpes) if sharpes else 0.0

    # If best Sharpe is more than 2.5 std devs above the mean with small trade count, warn about overfitting!
    overfitting_warning = False
    notes = "Parameter surface shows a stable plateau. Lower risk of data curve-fitting."
    if std_sharpe > 0 and (max_sharpe - mean_sharpe) > 2.2 * std_sharpe:
        overfitting_warning = True
        notes = "WARNING: Optimal parameter appears to be an isolated spike (outlier) rather than a robust plateau. High risk of curve-fitting."
    if best_metrics.get("num_trades", 0) < 15:
        overfitting_warning = True
        notes += " CAUTION: Trade count is low (< 15 trades), sample size may lack statistical power."

    return OptimizationResult(
        id=str(uuid.uuid4())[:8],
        strategy_id=request.strategy.id,
        strategy_name=request.strategy.name,
        best_params=best_params,
        best_metrics=best_metrics,
        total_evaluations=len(iterations),
        heatmap_data=heatmap_data,
        iterations=iterations,
        overfitting_warning=overfitting_warning,
        overfitting_notes=notes
    )
