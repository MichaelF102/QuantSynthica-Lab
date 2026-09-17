import pytest
import numpy as np
import pandas as pd
from backend.models.schemas import IndicatorConfig
from backend.engine.signals import compute_indicators
from backend.engine.data import generate_synthetic_ohlcv

def test_indicators_basic():
    df = generate_synthetic_ohlcv("TEST", "2023-01-01", "2023-06-01", seed=100)
    configs = [
        IndicatorConfig(id="sma_20", name="SMA", params={"period": 20}),
        IndicatorConfig(id="ema_20", name="EMA", params={"period": 20}),
        IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14}),
        IndicatorConfig(id="macd", name="MACD", params={}),
        IndicatorConfig(id="macd_sig", name="MACD_SIGNAL", params={}),
        IndicatorConfig(id="macd_hist", name="MACD_HIST", params={}),
        IndicatorConfig(id="bb_up", name="BB_UPPER", params={"period": 20, "std_dev": 2.0}),
        IndicatorConfig(id="bb_low", name="BB_LOWER", params={"period": 20, "std_dev": 2.0}),
        IndicatorConfig(id="atr_14", name="ATR", params={"period": 14}),
        IndicatorConfig(id="adx_14", name="ADX", params={"period": 14}),
        IndicatorConfig(id="stoch_k", name="STOCH_K", params={"k_period": 14}),
        IndicatorConfig(id="vwap", name="VWAP", params={}),
        IndicatorConfig(id="donchian_high", name="DONCHIAN_HIGH", params={"period": 20}),
        IndicatorConfig(id="keltner_upper", name="KELTNER_UPPER", params={"ema_period": 20, "atr_period": 10, "multiplier": 2.0})
    ]

    out = compute_indicators(df, configs)

    for cfg in configs:
        assert cfg.id in out.columns
        assert not out[cfg.id].isna().all(), f"All values are NaN for {cfg.name}"

    # RSI bounds: between 0 and 100
    assert out["rsi_14"].min() >= 0.0
    assert out["rsi_14"].max() <= 100.0

    # Bollinger Bands relationship: Upper >= Lower
    assert (out["bb_up"] >= out["bb_low"]).all()

    # ATR strictly positive
    assert (out["atr_14"] >= 0.0).all()
