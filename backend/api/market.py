import json
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from ..engine.data import MarketDataEngine
from ..engine.signals import compute_indicators
from ..engine.stocks_universe import universe_manager
from ..engine.fundamentals import fundamental_engine
from ..models.schemas import IndicatorConfig

router = APIRouter(prefix="/market", tags=["Market Data"])
data_engine = MarketDataEngine()

@router.get("/search")
def search_tickers(
    query: Optional[str] = Query(None, description="Search ticker symbol or company name"),
    market: Optional[str] = Query(None, description="Filter by market: 'US', 'India', or 'ALL'"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    limit: int = Query(30, description="Max results to return")
):
    """
    Searches across 18,500+ stocks in US_Stocks_Data.csv and India_Stocks_Data.csv.
    """
    results = universe_manager.search(query=query, market=market, sector=sector, limit=limit)
    if not results and query:
        # Custom user-entered symbol fallback
        q = query.strip().upper()
        results = [{
            "symbol": q,
            "yf_symbol": q,
            "name": f"Custom Security ({q})",
            "market": "Custom",
            "exchange": "Custom",
            "price": None,
            "currency": "USD",
            "change_1d": None,
            "market_cap": None,
            "sector": "Custom",
        }]
    return results

@router.get("/stock/{symbol}")
def get_stock_profile(symbol: str):
    """
    Returns fundamental profile from CSV data for a given stock symbol.
    """
    stock = universe_manager.get_stock(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found in database")
    return stock

@router.get("/fundamentals/{symbol}")
def get_stock_fundamentals(
    symbol: str,
    market: Optional[str] = Query(None, description="Market hint: 'India' or 'US'")
):
    """
    Returns comprehensive institutional fundamentals combining TradingView Screener,
    Yahoo Finance, and QuantSynthica universe metadata.
    """
    try:
        data = fundamental_engine.get_fundamentals(symbol=symbol, market_hint=market)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch fundamentals: {str(e)}")

@router.get("/sectors")
def get_sectors(market: Optional[str] = Query(None, description="Filter by market: 'US', 'India', or 'ALL'")):
    """
    Returns list of sectors available across the loaded stocks datasets.
    """
    return universe_manager.get_sectors(market=market)

@router.get("/data")
def get_market_data(
    ticker: str = Query(..., description="Asset ticker symbol"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    timeframe: str = Query("1D", description="Timeframe"),
    benchmark: str = Query("SPY", description="Benchmark symbol"),
    indicators: Optional[str] = Query(None, description="JSON string of IndicatorConfig list")
):
    now = datetime.now()
    if not end_date:
        end_date = now.strftime("%Y-%m-%d")
    if not start_date:
        start_date = (now - timedelta(days=365)).strftime("%Y-%m-%d")
    try:
        df, is_synthetic = data_engine.fetch_ohlcv(ticker, start_date, end_date, interval="1d")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch market data: {str(e)}")

    stock_profile = universe_manager.get_stock(ticker)

    # Parse and compute indicators if supplied
    ind_configs: List[IndicatorConfig] = []
    if indicators:
        try:
            raw_inds = json.loads(indicators)
            ind_configs = [IndicatorConfig.model_validate(x) for x in raw_inds]
        except Exception:
            pass

    # Add default basic indicators if none provided
    if not ind_configs:
        ind_configs = [
            IndicatorConfig(id="sma_20", name="SMA", params={"period": 20}),
            IndicatorConfig(id="sma_50", name="SMA", params={"period": 50}),
            IndicatorConfig(id="ema_20", name="EMA", params={"period": 20}),
            IndicatorConfig(id="rsi_14", name="RSI", params={"period": 14}),
            IndicatorConfig(id="bb_upper", name="BB_UPPER", params={"period": 20, "std_dev": 2.0}),
            IndicatorConfig(id="bb_lower", name="BB_LOWER", params={"period": 20, "std_dev": 2.0}),
            IndicatorConfig(id="atr_14", name="ATR", params={"period": 14}),
            IndicatorConfig(id="vwap", name="VWAP", params={})
        ]

    df_calc = compute_indicators(df, ind_configs)

    # Benchmark comparison
    try:
        bench_df, _ = data_engine.fetch_ohlcv(benchmark, start_date, end_date)
        bench_ret = bench_df["close"].pct_change().reindex(df_calc.index).fillna(0.0)
    except Exception:
        bench_ret = df_calc["close"].pct_change().fillna(0.0)

    asset_ret = df_calc["close"].pct_change().fillna(0.0)

    # Rolling Volatility & Underwater Drawdown
    cum_max = df_calc["close"].cummax()
    drawdown = ((df_calc["close"] - cum_max) / cum_max) * 100.0
    rolling_vol = (asset_ret.rolling(window=20, min_periods=5).std() * np.sqrt(252.0) * 100.0).fillna(0.0)

    # Beta & Correlation
    cov = np.cov(asset_ret, bench_ret)
    beta = float(cov[0, 1] / cov[1, 1]) if cov[1, 1] > 1e-6 else 1.0
    corr = float(asset_ret.corr(bench_ret)) if not np.isnan(asset_ret.corr(bench_ret)) else 0.0

    # Build response series
    bars = []
    for dt, row in df_calc.iterrows():
        dt_str = str(dt.strftime("%Y-%m-%d"))
        bar_dict = {
            "date": dt_str,
            "open": round(float(row["open"]), 2),
            "high": round(float(row["high"]), 2),
            "low": round(float(row["low"]), 2),
            "close": round(float(row["close"]), 2),
            "volume": int(row["volume"]),
            "return": round(float(asset_ret.loc[dt]), 4),
            "drawdown": round(float(drawdown.loc[dt]), 2),
            "volatility": round(float(rolling_vol.loc[dt]), 2)
        }
        for cfg in ind_configs:
            if cfg.id in row:
                bar_dict[cfg.id] = round(float(row[cfg.id]), 2) if not np.isnan(row[cfg.id]) else None
        bars.append(bar_dict)

    # Calculate multi-window performance statistics
    def calc_window_perf(window_bars: int):
        if len(df_calc) < 2:
            base_p = float(df_calc["close"].iloc[-1]) if len(df_calc) > 0 else 100.0
            return {"asset": 0.0, "benchmark": 0.0, "alpha": 0.0, "high": base_p, "low": base_p, "win_rate": 50.0}
        w = min(len(df_calc), max(1, window_bars))
        sub_df = df_calc.iloc[-w:]
        sub_bench = bench_ret.iloc[-w:]
        start_price = float(df_calc["close"].iloc[-w-1]) if len(df_calc) > w else float(sub_df["open"].iloc[0])
        end_price = float(sub_df["close"].iloc[-1])
        asset_gain = round(((end_price - start_price) / start_price) * 100.0, 2) if start_price > 0 else 0.0

        bench_gain = round(float((np.prod(1.0 + sub_bench) - 1.0) * 100.0), 2)
        alpha_val = round(asset_gain - bench_gain, 2)

        sub_high = round(float(sub_df["high"].max()), 2)
        sub_low = round(float(sub_df["low"].min()), 2)
        ups = int((sub_df["close"].pct_change() >= 0).sum())
        win_rate = round((ups / max(1, len(sub_df))) * 100.0, 1)
        return {
            "asset": asset_gain,
            "benchmark": bench_gain,
            "alpha": alpha_val,
            "high": sub_high,
            "low": sub_low,
            "win_rate": win_rate
        }

    cur_year = now.year
    try:
        ytd_bars = df_calc[df_calc.index.year == cur_year]
        ytd_len = len(ytd_bars) if len(ytd_bars) > 0 else 180
    except Exception:
        ytd_len = 180

    perf_summary = {
        "1D": calc_window_perf(1),
        "1W": calc_window_perf(5),
        "1M": calc_window_perf(21),
        "3M": calc_window_perf(63),
        "6M": calc_window_perf(126),
        "YTD": calc_window_perf(ytd_len),
        "1Y": calc_window_perf(252),
        "5Y": calc_window_perf(len(df_calc)),
    }

    w52_bars = df_calc.iloc[-min(len(df_calc), 252):]
    high_52w = round(float(w52_bars["high"].max()), 2) if len(w52_bars) > 0 else 0.0
    low_52w = round(float(w52_bars["low"].min()), 2) if len(w52_bars) > 0 else 0.0
    vol_30d = int(df_calc["volume"].iloc[-min(len(df_calc), 30):].mean()) if len(df_calc) > 0 else 0

    summary = {
        "ticker": ticker.upper(),
        "start_date": start_date,
        "end_date": end_date,
        "is_synthetic": is_synthetic,
        "total_bars": len(bars),
        "last_price": bars[-1]["close"] if bars else 0.0,
        "total_return": round(float((bars[-1]["close"] - bars[0]["open"]) / bars[0]["open"] * 100.0), 2) if bars else 0.0,
        "annualized_volatility": round(float(asset_ret.std() * np.sqrt(252.0) * 100.0), 2),
        "max_drawdown": round(float(abs(drawdown.min())), 2),
        "beta": round(beta, 2),
        "correlation": round(corr, 2),
        "benchmark": benchmark.upper(),
        "profile": stock_profile,
        "perf_summary": perf_summary,
        "high_52w": high_52w,
        "low_52w": low_52w,
        "avg_volume_30d": vol_30d
    }

    return {
        "summary": summary,
        "bars": bars
    }
