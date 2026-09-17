import os
import hashlib
import json
import logging
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any

logger = logging.getLogger("quantsynthica.data")

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

def _get_cache_path(ticker: str, start: str, end: str, interval: str) -> str:
    key = f"{ticker.upper()}_{start}_{end}_{interval}"
    digest = hashlib.md5(key.encode()).hexdigest()
    return os.path.join(CACHE_DIR, f"{ticker.upper()}_{digest}.parquet")

def generate_synthetic_ohlcv(
    ticker: str,
    start_date: str,
    end_date: str,
    seed: Optional[int] = None,
    base_price: float = 150.0,
    annual_vol: float = 0.22,
    annual_drift: float = 0.10
) -> pd.DataFrame:
    """
    Generates realistic geometric Brownian motion OHLCV data for testing,
    ensuring zero downtime or API dependency when network fails or yfinance throttles.
    """
    if seed is None:
        seed = int(hashlib.md5(ticker.encode()).hexdigest()[:8], 16) % 100000
    np.random.seed(seed)

    dt_start = pd.to_datetime(start_date)
    dt_end = pd.to_datetime(end_date)
    if dt_end <= dt_start:
        dt_end = dt_start + pd.Timedelta(days=365)

    dates = pd.bdate_range(start=dt_start, end=dt_end)
    n = len(dates)
    if n < 5:
        dates = pd.bdate_range(start=dt_start, periods=252)
        n = len(dates)

    dt = 1.0 / 252.0
    daily_drift = (annual_drift - 0.5 * annual_vol ** 2) * dt
    daily_vol = annual_vol * np.sqrt(dt)

    shocks = np.random.normal(daily_drift, daily_vol, n)
    log_prices = np.log(base_price) + np.cumsum(shocks)
    close_prices = np.exp(log_prices)

    intraday_vol = daily_vol * 0.7
    highs = close_prices * (1 + np.abs(np.random.normal(0, intraday_vol, n)))
    lows = close_prices * (1 - np.abs(np.random.normal(0, intraday_vol, n)))
    opens = lows + np.random.uniform(0.1, 0.9, n) * (highs - lows)
    # Ensure consistency
    highs = np.maximum(highs, np.maximum(opens, close_prices))
    lows = np.minimum(lows, np.minimum(opens, close_prices))

    base_vol = 1_500_000
    volumes = np.random.lognormal(np.log(base_vol), 0.5, n).astype(int)

    df = pd.DataFrame({
        "open": np.round(opens, 2),
        "high": np.round(highs, 2),
        "low": np.round(lows, 2),
        "close": np.round(close_prices, 2),
        "volume": volumes
    }, index=dates)
    df.index.name = "date"
    return df

from .stocks_universe import universe_manager

class MarketDataEngine:
    def __init__(self, use_cache: bool = True):
        self.use_cache = use_cache

    def fetch_ohlcv(
        self,
        ticker: str,
        start_date: str,
        end_date: str,
        interval: str = "1d"
    ) -> Tuple[pd.DataFrame, bool]:
        """
        Fetches OHLCV data. Returns (DataFrame, is_synthetic_flag).
        Always returns a clean DataFrame with columns [open, high, low, close, volume]
        indexed by datetime.
        """
        ticker = ticker.strip().upper()
        
        # Look up stock in universe database
        stock_info = universe_manager.get_stock(ticker)
        yf_sym = stock_info["yf_symbol"] if stock_info else ticker

        cache_path = _get_cache_path(ticker, start_date, end_date, interval)

        # 1. Check local parquet cache
        if self.use_cache and os.path.exists(cache_path):
            try:
                df = pd.read_parquet(cache_path)
                if not df.empty and len(df) > 5:
                    return df, False
            except Exception as e:
                logger.warning(f"Cache read failed for {ticker}: {e}")

        # 2. Fetch from yfinance using resolved symbol
        for candidate_sym in [yf_sym, ticker]:
            try:
                s_dt = (pd.to_datetime(start_date) - pd.Timedelta(days=5)).strftime("%Y-%m-%d")
                e_dt = (pd.to_datetime(end_date) + pd.Timedelta(days=2)).strftime("%Y-%m-%d")

                yf_ticker = yf.Ticker(candidate_sym)
                df = yf_ticker.history(start=s_dt, end=e_dt, interval=interval, auto_adjust=True)

                if df is not None and not df.empty and len(df) > 5:
                    df.columns = [c.lower() for c in df.columns]
                    req = ["open", "high", "low", "close", "volume"]
                    if all(c in df.columns for c in req):
                        df = df[req].copy()
                        df.index = pd.to_datetime(df.index).tz_localize(None)
                        df.index.name = "date"
                        df = df.sort_index()

                        mask = (df.index >= pd.to_datetime(start_date)) & (df.index <= pd.to_datetime(end_date))
                        filtered_df = df.loc[mask]
                        if len(filtered_df) >= 5:
                            df = filtered_df

                        df = df.ffill().bfill().dropna()

                        if self.use_cache and len(df) > 5:
                            try:
                                df.to_parquet(cache_path)
                            except Exception as ce:
                                logger.debug(f"Failed to cache {ticker}: {ce}")

                        return df, False
            except Exception as ex:
                logger.debug(f"yfinance attempt failed for {candidate_sym}: {ex}")

        # 3. Fallback to synthetic market data generator with realistic base price from CSV
        base_price = float(stock_info["price"]) if (stock_info and stock_info.get("price")) else 150.0
        df_syn = generate_synthetic_ohlcv(ticker, start_date, end_date, base_price=base_price)
        return df_syn, True

    def fetch_benchmark(
        self,
        benchmark: str = "SPY",
        start_date: str = "2020-01-01",
        end_date: str = "2024-01-01"
    ) -> pd.Series:
        """
        Returns benchmark daily returns Series aligned by date.
        """
        df, _ = self.fetch_ohlcv(benchmark, start_date, end_date)
        returns = df["close"].pct_change().fillna(0.0)
        returns.name = "benchmark_return"
        return returns
