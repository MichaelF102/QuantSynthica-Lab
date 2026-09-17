import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from ..models.schemas import IndicatorConfig, ConditionRule, RuleOperator

def compute_indicators(df: pd.DataFrame, indicator_configs: List[IndicatorConfig]) -> pd.DataFrame:
    """
    Computes all requested technical indicators on the given OHLCV DataFrame.
    Ensures all computations are strictly backward-looking (no forward window peeking).
    Returns DataFrame with appended indicator columns.
    """
    res = df.copy()
    c = res["close"]
    h = res["high"]
    l = res["low"]
    o = res["open"]
    v = res["volume"]

    for cfg in indicator_configs:
        iid = cfg.id
        name = cfg.name.upper()
        p = cfg.params

        if name == "SMA":
            period = int(p.get("period", 20))
            res[iid] = c.rolling(window=period, min_periods=1).mean()

        elif name == "EMA":
            period = int(p.get("period", 20))
            res[iid] = c.ewm(span=period, adjust=False).mean()

        elif name == "RSI":
            period = int(p.get("period", 14))
            delta = c.diff()
            gain = (delta.where(delta > 0, 0.0)).ewm(alpha=1/period, adjust=False).mean()
            loss = (-delta.where(delta < 0, 0.0)).ewm(alpha=1/period, adjust=False).mean()
            rs = gain / (loss.replace(0, np.nan))
            rsi = 100 - (100 / (1 + rs))
            res[iid] = rsi.fillna(50.0)

        elif name in ("MACD", "MACD_LINE"):
            fast = int(p.get("fast_period", 12))
            slow = int(p.get("slow_period", 26))
            res[iid] = c.ewm(span=fast, adjust=False).mean() - c.ewm(span=slow, adjust=False).mean()

        elif name == "MACD_SIGNAL":
            fast = int(p.get("fast_period", 12))
            slow = int(p.get("slow_period", 26))
            sig = int(p.get("signal_period", 9))
            macd_line = c.ewm(span=fast, adjust=False).mean() - c.ewm(span=slow, adjust=False).mean()
            res[iid] = macd_line.ewm(span=sig, adjust=False).mean()

        elif name == "MACD_HIST":
            fast = int(p.get("fast_period", 12))
            slow = int(p.get("slow_period", 26))
            sig = int(p.get("signal_period", 9))
            macd_line = c.ewm(span=fast, adjust=False).mean() - c.ewm(span=slow, adjust=False).mean()
            sig_line = macd_line.ewm(span=sig, adjust=False).mean()
            res[iid] = macd_line - sig_line

        elif name in ("BB_UPPER", "BOLLINGER_UPPER"):
            period = int(p.get("period", 20))
            std_dev = float(p.get("std_dev", 2.0))
            sma = c.rolling(window=period, min_periods=1).mean()
            std = c.rolling(window=period, min_periods=1).std().fillna(0.0)
            res[iid] = sma + (std * std_dev)

        elif name in ("BB_LOWER", "BOLLINGER_LOWER"):
            period = int(p.get("period", 20))
            std_dev = float(p.get("std_dev", 2.0))
            sma = c.rolling(window=period, min_periods=1).mean()
            std = c.rolling(window=period, min_periods=1).std().fillna(0.0)
            res[iid] = sma - (std * std_dev)

        elif name in ("BB_MIDDLE", "BOLLINGER_MIDDLE"):
            period = int(p.get("period", 20))
            res[iid] = c.rolling(window=period, min_periods=1).mean()

        elif name == "ATR":
            period = int(p.get("period", 14))
            tr1 = h - l
            tr2 = (h - c.shift(1)).abs()
            tr3 = (l - c.shift(1)).abs()
            tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
            res[iid] = tr.ewm(alpha=1/period, adjust=False).mean()

        elif name == "ADX":
            period = int(p.get("period", 14))
            up_move = h - h.shift(1)
            down_move = l.shift(1) - l
            plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
            minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
            tr1 = h - l
            tr2 = (h - c.shift(1)).abs()
            tr3 = (l - c.shift(1)).abs()
            tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
            atr = tr.ewm(alpha=1/period, adjust=False).mean().replace(0, 1e-6)
            plus_di = 100 * pd.Series(plus_dm, index=df.index).ewm(alpha=1/period, adjust=False).mean() / atr
            minus_di = 100 * pd.Series(minus_dm, index=df.index).ewm(alpha=1/period, adjust=False).mean() / atr
            dx = 100 * (plus_di - minus_di).abs() / ((plus_di + minus_di).replace(0, 1e-6))
            res[iid] = dx.ewm(alpha=1/period, adjust=False).mean().fillna(20.0)

        elif name in ("STOCH_K", "STOCHASTIC_K"):
            k_period = int(p.get("k_period", 14))
            lowest_low = l.rolling(window=k_period, min_periods=1).min()
            highest_high = h.rolling(window=k_period, min_periods=1).max()
            denom = (highest_high - lowest_low).replace(0, 1e-6)
            res[iid] = 100 * ((c - lowest_low) / denom)

        elif name in ("STOCH_D", "STOCHASTIC_D"):
            k_period = int(p.get("k_period", 14))
            d_period = int(p.get("d_period", 3))
            lowest_low = l.rolling(window=k_period, min_periods=1).min()
            highest_high = h.rolling(window=k_period, min_periods=1).max()
            denom = (highest_high - lowest_low).replace(0, 1e-6)
            stoch_k = 100 * ((c - lowest_low) / denom)
            res[iid] = stoch_k.rolling(window=d_period, min_periods=1).mean()

        elif name == "VWAP":
            cum_vol = v.cumsum().replace(0, 1)
            cum_pv = (((h + l + c) / 3) * v).cumsum()
            res[iid] = cum_pv / cum_vol

        elif name in ("DONCHIAN_HIGH", "DONCHIAN_UPPER"):
            period = int(p.get("period", 20))
            # shifted by 1 to not include current bar high in breakout comparison
            res[iid] = h.shift(1).rolling(window=period, min_periods=1).max()

        elif name in ("DONCHIAN_LOW", "DONCHIAN_LOWER"):
            period = int(p.get("period", 20))
            res[iid] = l.shift(1).rolling(window=period, min_periods=1).min()

        elif name in ("KELTNER_UPPER", "KELTNER_LOWER", "KELTNER_MIDDLE"):
            ema_p = int(p.get("ema_period", 20))
            atr_p = int(p.get("atr_period", 10))
            multiplier = float(p.get("multiplier", 2.0))
            mid = c.ewm(span=ema_p, adjust=False).mean()
            tr = pd.concat([h - l, (h - c.shift(1)).abs(), (l - c.shift(1)).abs()], axis=1).max(axis=1)
            atr = tr.ewm(alpha=1/atr_p, adjust=False).mean()
            if name == "KELTNER_UPPER":
                res[iid] = mid + (atr * multiplier)
            elif name == "KELTNER_LOWER":
                res[iid] = mid - (atr * multiplier)
            else:
                res[iid] = mid

        elif name in ("ROC", "RATE_OF_CHANGE"):
            period = int(p.get("period", 12))
            shifted = c.shift(period).replace(0, 1e-6)
            res[iid] = (((c - shifted) / shifted) * 100.0).fillna(0.0)

        elif name in ("WILLR", "WILLIAMS_R"):
            period = int(p.get("period", 14))
            highest = h.rolling(window=period, min_periods=1).max()
            lowest = l.rolling(window=period, min_periods=1).min()
            denom = (highest - lowest).replace(0, 1e-6)
            res[iid] = (((highest - c) / denom) * -100.0).fillna(-50.0)

        elif name in ("BB_WIDTH", "BOLLINGER_WIDTH"):
            period = int(p.get("period", 20))
            std_dev = float(p.get("std_dev", 2.0))
            sma = c.rolling(window=period, min_periods=1).mean()
            std = c.rolling(window=period, min_periods=1).std().fillna(0.0)
            upper = sma + (std * std_dev)
            lower = sma - (std * std_dev)
            res[iid] = (((upper - lower) / sma.replace(0, 1e-6)) * 100.0).fillna(0.0)

        elif name in ("ZSCORE", "Z_SCORE"):
            period = int(p.get("period", 20))
            sma = c.rolling(window=period, min_periods=1).mean()
            std = c.rolling(window=period, min_periods=1).std().replace(0, 1e-6)
            res[iid] = ((c - sma) / std).fillna(0.0)

        elif name == "WMA":
            period = int(p.get("period", 20))
            weights = np.arange(1, period + 1)
            sum_weights = weights.sum()
            res[iid] = c.rolling(window=period, min_periods=period).apply(
                lambda s: np.dot(s, weights) / sum_weights, raw=True
            ).bfill()

        elif name == "OBV":
            direction = np.sign(c.diff()).fillna(0.0)
            res[iid] = (direction * v).cumsum()

        else:
            # Default fallback: SMA 20
            res[iid] = c.rolling(window=20, min_periods=1).mean()

    return res

def evaluate_condition(
    series_a: pd.Series,
    operator: RuleOperator,
    series_b: Optional[pd.Series] = None,
    threshold: Optional[float] = None
) -> pd.Series:
    """
    Evaluates a single rule condition across time series.
    Returns boolean Series.
    """
    if series_b is not None:
        target = series_b
    elif threshold is not None:
        target = threshold
    else:
        raise ValueError("Must provide either series_b or threshold")

    if operator == RuleOperator.GT or operator == ">":
        return series_a > target
    elif operator == RuleOperator.LT or operator == "<":
        return series_a < target
    elif operator == RuleOperator.GTE or operator == ">=":
        return series_a >= target
    elif operator == RuleOperator.LTE or operator == "<=":
        return series_a <= target
    elif operator == RuleOperator.EQ or operator == "==":
        return series_a == target
    elif operator == RuleOperator.NEQ or operator == "!=":
        return series_a != target
    elif operator == RuleOperator.CROSS_ABOVE:
        prev_a = series_a.shift(1)
        prev_b = target.shift(1) if isinstance(target, pd.Series) else target
        return (prev_a <= prev_b) & (series_a > target)
    elif operator == RuleOperator.CROSS_BELOW:
        prev_a = series_a.shift(1)
        prev_b = target.shift(1) if isinstance(target, pd.Series) else target
        return (prev_a >= prev_b) & (series_a < target)
    else:
        return series_a > target

def generate_signals(
    df: pd.DataFrame,
    entry_rules: List[ConditionRule],
    exit_rules: List[ConditionRule]
) -> pd.DataFrame:
    """
    Generates entry and exit boolean signals for each bar t.
    Returns DataFrame with 'signal_entry' and 'signal_exit' columns.
    CRITICAL: These signals are computed at bar t close.
    Any backtest execution MUST fill them at t+1 open or next bar.
    """
    n = len(df)
    entry_signals = pd.Series(False, index=df.index)
    exit_signals = pd.Series(False, index=df.index)

    # Evaluate Entry Rules
    if entry_rules:
        curr_mask = None
        for rule in entry_rules:
            col_a = rule.indicator_a
            ser_a = df[col_a] if col_a in df.columns else df["close"]
            ser_b = df[rule.indicator_b] if (rule.indicator_b and rule.indicator_b in df.columns) else None
            cond = evaluate_condition(ser_a, rule.operator, ser_b, rule.threshold)

            if curr_mask is None:
                curr_mask = cond
            else:
                if (rule.logical_operator or "AND").upper() == "OR":
                    curr_mask = curr_mask | cond
                else:
                    curr_mask = curr_mask & cond
        if curr_mask is not None:
            entry_signals = curr_mask.fillna(False)

    # Evaluate Exit Rules
    if exit_rules:
        curr_mask = None
        for rule in exit_rules:
            col_a = rule.indicator_a
            ser_a = df[col_a] if col_a in df.columns else df["close"]
            ser_b = df[rule.indicator_b] if (rule.indicator_b and rule.indicator_b in df.columns) else None
            cond = evaluate_condition(ser_a, rule.operator, ser_b, rule.threshold)

            if curr_mask is None:
                curr_mask = cond
            else:
                if (rule.logical_operator or "OR").upper() == "OR":
                    curr_mask = curr_mask | cond
                else:
                    curr_mask = curr_mask & cond
        if curr_mask is not None:
            exit_signals = curr_mask.fillna(False)

    out = df.copy()
    out["signal_entry"] = entry_signals
    out["signal_exit"] = exit_signals
    return out
