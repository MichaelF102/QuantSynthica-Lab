"""
QuantSynthica Lab — Market Data Service Layer
Fetches and normalizes real market data via yfinance for:
- US Equities
- Indian Equities (NSE/BSE)
- ETFs
- Global Indices
- Options Chains
- Macro & Cross-Asset (Treasury Yields, Currencies, Commodities)
Includes local disk & memory caching to prevent rate-limiting.
"""

import os
import json
import time
import math
import hashlib
import logging
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
import yfinance as yf

logger = logging.getLogger("quantsynthica.market_service")

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# In-memory short-lived cache (quotes: 60s, history: 600s, options: 900s)
_MEM_CACHE: Dict[str, Dict[str, Any]] = {}

ETF_METADATA = {
    "SPY": {"classification": "Broad Market ETF", "category": "US Large Cap"},
    "QQQ": {"classification": "Technology ETF", "category": "Nasdaq 100"},
    "IWM": {"classification": "Small Cap ETF", "category": "Russell 2000"},
    "VOO": {"classification": "S&P 500 Index ETF", "category": "US Large Cap Blend"},
    "VTI": {"classification": "Total Stock Market ETF", "category": "All Cap Equities"},
    "GLD": {"classification": "Commodity ETF", "category": "Physical Gold Trust"},
    "TLT": {"classification": "Bond ETF", "category": "20+ Year Treasury"},
}

INDEX_METADATA = {
    "^GSPC": {"name": "S&P 500", "market": "US Equities", "flag": "🇺🇸"},
    "^IXIC": {"name": "Nasdaq Composite", "market": "US Tech", "flag": "🇺🇸"},
    "^DJI": {"name": "Dow Jones", "market": "US Industrial", "flag": "🇺🇸"},
    "^NSEI": {"name": "NIFTY 50", "market": "India NSE", "flag": "🇮🇳"},
    "^BSESN": {"name": "Sensex", "market": "India BSE", "flag": "🇮🇳"},
    "^NSEBANK": {"name": "NIFTY Bank", "market": "India Banking", "flag": "🇮🇳"},
}

MACRO_METADATA = {
    "^TNX": {"name": "US 10-Year Treasury Yield", "category": "rate", "label": "10-Year Yield", "unit": "%"},
    "^FVX": {"name": "US 5-Year Treasury Yield", "category": "rate", "label": "5-Year Yield", "unit": "%"},
    "^IRX": {"name": "US 13-Week Treasury Bill", "category": "rate", "label": "13-Week T-Bill", "unit": "%"},
    "EURUSD=X": {"name": "EUR / USD", "category": "currency", "label": "Exchange Rate", "unit": "USD"},
    "USDINR=X": {"name": "USD / INR", "category": "currency", "label": "Exchange Rate", "unit": "INR"},
    "GC=F": {"name": "Gold Futures", "category": "commodity", "label": "Gold Futures", "unit": "$/oz"},
    "CL=F": {"name": "WTI Crude Oil Futures", "category": "commodity", "label": "WTI Crude Oil", "unit": "$/bbl"},
    "SI=F": {"name": "Silver Futures", "category": "commodity", "label": "Silver Futures", "unit": "$/oz"},
}

def _get_cache(key: str, ttl_seconds: int) -> Optional[Any]:
    now = time.time()
    if key in _MEM_CACHE:
        entry = _MEM_CACHE[key]
        if now - entry["timestamp"] < ttl_seconds:
            return entry["data"]
    
    file_path = os.path.join(CACHE_DIR, f"{hashlib.md5(key.encode()).hexdigest()}.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                saved = json.load(f)
            if now - saved.get("_cached_at", 0) < ttl_seconds:
                _MEM_CACHE[key] = {"data": saved["data"], "timestamp": saved["_cached_at"]}
                return saved["data"]
        except Exception:
            pass
    return None

def _set_cache(key: str, data: Any):
    now = time.time()
    _MEM_CACHE[key] = {"data": data, "timestamp": now}
    file_path = os.path.join(CACHE_DIR, f"{hashlib.md5(key.encode()).hexdigest()}.json")
    try:
        with open(file_path, "w") as f:
            json.dump({"data": data, "_cached_at": now}, f)
    except Exception as e:
        logger.debug(f"Cache write error: {e}")

def _generate_sparkline_svg(closes: List[float], width: int = 54, height: int = 22) -> str:
    if not closes or len(closes) < 2:
        return "M 0 11 L 54 11"
    min_c = min(closes)
    max_c = max(closes)
    span = max_c - min_c
    if span <= 0:
        span = 1.0

    pad_y = 3
    eff_h = height - pad_y * 2
    n = len(closes)
    pts = []
    for i, c in enumerate(closes):
        x = round((i / (n - 1)) * width, 1)
        y = round(pad_y + (1.0 - (c - min_c) / span) * eff_h, 1)
        pts.append(f"{x} {y}")

    return "M " + " L ".join(pts)

def get_asset_details(symbol: str, timeframe: str = "6M") -> Dict[str, Any]:
    """
    Fetches full normalized asset quote and historical OHLCV series.
    """
    sym = symbol.strip().upper()
    cache_key = f"asset_{sym}_{timeframe}"
    cached = _get_cache(cache_key, ttl_seconds=120)
    if cached:
        return cached

    # Map timeframe to yfinance period & interval
    tf_map = {
        "1D": ("5d", "15m"),
        "1W": ("1mo", "1d"),
        "1M": ("3mo", "1d"),
        "3M": ("6mo", "1d"),
        "6M": ("1y", "1d"),
        "1Y": ("2y", "1d"),
        "5Y": ("5y", "1wk"),
        "MAX": ("max", "1mo"),
        "ALL": ("max", "1mo"),
    }
    period, interval = tf_map.get(timeframe.upper(), ("1y", "1d"))

    ticker = yf.Ticker(sym)
    
    # Fetch history
    try:
        hist = ticker.history(period=period, interval=interval, auto_adjust=True)
    except Exception as e:
        logger.error(f"Failed to fetch history for {sym}: {e}")
        hist = pd.DataFrame()

    # Determine asset type and defaults
    is_indian = sym.endswith(".NS") or sym.endswith(".BO") or sym in ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "ITC", "LT"]
    is_index = sym.startswith("^")
    is_etf = sym in ETF_METADATA
    is_macro = sym in MACRO_METADATA

    if is_index:
        asset_type = "index"
    elif is_etf:
        asset_type = "etf"
    elif is_macro:
        asset_type = "macro"
    else:
        asset_type = "equity"

    # Fetch info/fast_info
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    # Current price, prev close, change
    last_price = 0.0
    prev_close = 0.0
    
    if not hist.empty:
        last_price = float(hist["Close"].iloc[-1])
        if len(hist) > 1:
            prev_close = float(hist["Close"].iloc[-2])
        else:
            prev_close = last_price
    elif "regularMarketPrice" in info and info["regularMarketPrice"]:
        last_price = float(info["regularMarketPrice"])
        prev_close = float(info.get("previousClose") or last_price)

    change = last_price - prev_close
    change_pct = (change / prev_close * 100.0) if prev_close > 0 else 0.0

    # Currency
    if is_indian:
        currency = "₹"
        flag = "🇮🇳"
        exchange = "NSE"
    elif sym.startswith("^"):
        currency = "" if "Yield" not in MACRO_METADATA.get(sym, {}).get("name", "") else "%"
        flag = "🇺🇸" if "^NSE" not in sym and "^BSE" not in sym else "🇮🇳"
        exchange = "INDEX"
    elif is_macro and MACRO_METADATA.get(sym, {}).get("unit") == "%":
        currency = "%"
        flag = "🇺🇸"
        exchange = "FRED/CBOE"
    else:
        currency = "$"
        flag = "🇺🇸"
        exchange = info.get("exchange") or "NASDAQ"

    name = info.get("shortName") or info.get("longName") or sym
    if is_index and sym in INDEX_METADATA:
        name = INDEX_METADATA[sym]["name"]
        exchange = INDEX_METADATA[sym]["market"]
    elif is_macro and sym in MACRO_METADATA:
        name = MACRO_METADATA[sym]["name"]

    # Compute Bars & EMA 20, EMA 50
    bars = []
    closes_list = []
    if not hist.empty:
        close_s = hist["Close"].ffill()
        ema20_s = close_s.ewm(span=20, adjust=False).mean() if len(close_s) >= 10 else close_s
        ema50_s = close_s.ewm(span=50, adjust=False).mean() if len(close_s) >= 20 else close_s

        for idx, row in hist.iterrows():
            d_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)[:10]
            c_val = round(float(row["Close"]), 2)
            closes_list.append(c_val)
            bars.append({
                "date": d_str,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": c_val,
                "volume": int(row.get("Volume", 0)) if not pd.isna(row.get("Volume", 0)) else 0,
                "ema_20": round(float(ema20_s.loc[idx]), 2) if not pd.isna(ema20_s.loc[idx]) else None,
                "ema_50": round(float(ema50_s.loc[idx]), 2) if not pd.isna(ema50_s.loc[idx]) else None,
            })

    # Sparkline: last 30 closes
    spark_closes = closes_list[-30:] if len(closes_list) >= 30 else closes_list
    spark_svg = _generate_sparkline_svg(spark_closes)

    # 52w high / low
    w52_high = float(info.get("fiftyTwoWeekHigh") or (max(closes_list) if closes_list else last_price))
    w52_low = float(info.get("fiftyTwoWeekLow") or (min(closes_list) if closes_list else last_price))

    # Day Open / High / Low / Volume from latest bar or info
    latest_bar = bars[-1] if bars else {"open": last_price, "high": last_price, "low": last_price, "volume": 0}
    day_open = float(info.get("open") or latest_bar["open"])
    day_high = float(info.get("dayHigh") or latest_bar["high"])
    day_low = float(info.get("dayLow") or latest_bar["low"])
    volume = int(info.get("volume") or info.get("regularMarketVolume") or latest_bar["volume"])

    # Market Cap & Beta (only where applicable)
    market_cap = info.get("marketCap")
    beta = info.get("beta")
    if is_index or is_macro or asset_type == "index":
        market_cap = None
        beta = None

    # Last observed timestamp / date
    last_date = latest_bar.get("date") or time.strftime("%Y-%m-%d")

    data = {
        "symbol": sym,
        "name": name,
        "exchange": exchange,
        "assetType": asset_type,
        "currency": currency,
        "flag": flag,
        "price": round(last_price, 2),
        "previousClose": round(prev_close, 2),
        "change": round(change, 2),
        "changePercent": round(change_pct, 2),
        "isPositive": change >= 0,
        "open": round(day_open, 2),
        "high": round(day_high, 2),
        "low": round(day_low, 2),
        "volume": volume,
        "marketCap": market_cap,
        "fiftyTwoWeekHigh": round(w52_high, 2),
        "fiftyTwoWeekLow": round(w52_low, 2),
        "beta": round(float(beta), 2) if beta is not None else None,
        "classification": ETF_METADATA.get(sym, {}).get("classification"),
        "macroCategory": MACRO_METADATA.get(sym, {}).get("category"),
        "lastObservationDate": last_date,
        "sparkline": spark_closes,
        "sparklineSvg": spark_svg,
        "bars": bars,
    }

    _set_cache(cache_key, data)
    return data

def get_option_chain_data(symbol: str, expiration: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches genuine option chain for an underlying using yfinance.
    """
    sym = symbol.strip().upper()
    cache_key = f"options_{sym}_{expiration or 'first'}"
    cached = _get_cache(cache_key, ttl_seconds=300)
    if cached:
        return cached

    ticker = yf.Ticker(sym)
    try:
        available_expirations = list(ticker.options)
    except Exception as e:
        logger.warning(f"No options found for {sym}: {e}")
        available_expirations = []

    if not available_expirations:
        return {
            "symbol": sym,
            "available": False,
            "reason": "Options data unavailable for this instrument through Yahoo Finance.",
            "expirations": [],
            "calls": [],
            "puts": [],
        }

    selected_exp = expiration if expiration in available_expirations else available_expirations[0]

    try:
        chain = ticker.option_chain(selected_exp)
        # Fetch current underlying price
        hist = ticker.history(period="1d")
        underlying_price = float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
    except Exception as e:
        logger.error(f"Failed to fetch option chain for {sym} at {selected_exp}: {e}")
        return {
            "symbol": sym,
            "available": False,
            "reason": f"Failed to retrieve options: {str(e)}",
            "expirations": available_expirations,
            "calls": [],
            "puts": [],
        }

    def format_df(df):
        records = []
        if df is None or df.empty:
            return records
        for _, row in df.iterrows():
            strike = float(row.get("strike", 0))
            last_p = float(row.get("lastPrice", 0)) if not pd.isna(row.get("lastPrice")) else 0.0
            bid = float(row.get("bid", 0)) if not pd.isna(row.get("bid")) else 0.0
            ask = float(row.get("ask", 0)) if not pd.isna(row.get("ask")) else 0.0
            vol = int(row.get("volume", 0)) if not pd.isna(row.get("volume")) else 0
            oi = int(row.get("openInterest", 0)) if not pd.isna(row.get("openInterest")) else 0
            iv = float(row.get("impliedVolatility", 0)) if not pd.isna(row.get("impliedVolatility")) else 0.0
            itm = bool(row.get("inTheMoney", False))
            
            records.append({
                "strike": strike,
                "lastPrice": round(last_p, 2),
                "bid": round(bid, 2),
                "ask": round(ask, 2),
                "volume": vol,
                "openInterest": oi,
                "impliedVolatility": round(iv * 100.0, 2), # percentage
                "inTheMoney": itm,
            })
        return records

    calls = format_df(chain.calls)
    puts = format_df(chain.puts)

    data = {
        "symbol": sym,
        "available": True,
        "underlyingPrice": round(underlying_price, 2),
        "selectedExpiration": selected_exp,
        "expirations": available_expirations,
        "calls": calls,
        "puts": puts,
    }

    _set_cache(cache_key, data)
    return data

def get_benchmarks_data() -> List[Dict[str, Any]]:
    """
    Fetches Market Benchmarks: S&P 500, Nasdaq, Dow Jones, NIFTY 50, Sensex.
    """
    cache_key = "benchmarks_list"
    cached = _get_cache(cache_key, ttl_seconds=60)
    if cached:
        return cached

    benchmarks_keys = ["^GSPC", "^IXIC", "^DJI", "^NSEI", "^BSESN"]
    results = []

    try:
        df = yf.download(benchmarks_keys, period="5d", interval="1d", group_by="ticker", auto_adjust=True, progress=False)
        for sym in benchmarks_keys:
            meta = INDEX_METADATA.get(sym, {"name": sym, "market": "Index", "flag": "🌐"})
            try:
                sub = df[sym].dropna(subset=["Close"]) if sym in df else pd.DataFrame()
                if not sub.empty:
                    last_c = float(sub["Close"].iloc[-1])
                    prev_c = float(sub["Close"].iloc[-2]) if len(sub) > 1 else last_c
                    chg = last_c - prev_c
                    chg_pct = (chg / prev_c * 100.0) if prev_c > 0 else 0.0
                    closes = [round(float(c), 2) for c in sub["Close"].tolist()]
                    spark_svg = _generate_sparkline_svg(closes)
                    is_ind = "^NSE" in sym or "^BSE" in sym
                    curr = "₹" if is_ind else ""
                    results.append({
                        "symbol": sym,
                        "name": meta["name"],
                        "market": meta["market"],
                        "flag": meta["flag"],
                        "currency": curr,
                        "price": round(last_c, 2),
                        "change": round(chg, 2),
                        "changePercent": round(chg_pct, 2),
                        "isPositive": chg >= 0,
                        "sparkline": closes,
                        "sparklineSvg": spark_svg,
                    })
            except Exception as e:
                logger.debug(f"Failed benchmark parse for {sym}: {e}")
    except Exception as ex:
        logger.error(f"Batch benchmarks download failed: {ex}")

    if results:
        _set_cache(cache_key, results)
    return results

def get_watchlist_data() -> List[Dict[str, Any]]:
    """
    Fetches Watchlist:
    US: NVDA, AAPL, MSFT, AMZN, TSLA
    India: RELIANCE.NS, TCS.NS, INFY.NS
    """
    cache_key = "watchlist_list"
    cached = _get_cache(cache_key, ttl_seconds=60)
    if cached:
        return cached

    us_syms = ["NVDA", "AAPL", "MSFT", "AMZN", "TSLA"]
    in_syms = ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
    all_syms = us_syms + in_syms
    results = []

    try:
        df = yf.download(all_syms, period="5d", interval="1d", group_by="ticker", auto_adjust=True, progress=False)
        for sym in all_syms:
            is_ind = sym.endswith(".NS")
            display_sym = sym.replace(".NS", "") if is_ind else sym
            flag = "🇮🇳" if is_ind else "🇺🇸"
            curr = "₹" if is_ind else "$"
            try:
                sub = df[sym].dropna(subset=["Close"]) if sym in df else pd.DataFrame()
                if not sub.empty:
                    last_c = float(sub["Close"].iloc[-1])
                    prev_c = float(sub["Close"].iloc[-2]) if len(sub) > 1 else last_c
                    chg = last_c - prev_c
                    chg_pct = (chg / prev_c * 100.0) if prev_c > 0 else 0.0
                    closes = [round(float(c), 2) for c in sub["Close"].tolist()]
                    spark_svg = _generate_sparkline_svg(closes)
                    results.append({
                        "symbol": sym,
                        "displaySymbol": display_sym,
                        "flag": flag,
                        "currency": curr,
                        "price": round(last_c, 2),
                        "change": round(chg, 2),
                        "changePercent": round(chg_pct, 2),
                        "isPositive": chg >= 0,
                        "sparkline": closes,
                        "sparklineSvg": spark_svg,
                    })
            except Exception as e:
                logger.debug(f"Failed watchlist parse for {sym}: {e}")
    except Exception as ex:
        logger.error(f"Watchlist download failed: {ex}")

    if results:
        _set_cache(cache_key, results)
    return results

def get_macro_cross_asset_data() -> Dict[str, List[Dict[str, Any]]]:
    """
    Fetches Macro & Cross-Asset Instruments:
    Rates: ^TNX, ^FVX, ^IRX
    Currencies: EURUSD=X, USDINR=X
    Commodities: GC=F, CL=F, SI=F
    """
    cache_key = "macro_cross_asset"
    cached = _get_cache(cache_key, ttl_seconds=120)
    if cached:
        return cached

    macro_keys = list(MACRO_METADATA.keys())
    categories: Dict[str, List[Dict[str, Any]]] = {
        "rates": [],
        "currencies": [],
        "commodities": []
    }

    try:
        df = yf.download(macro_keys, period="5d", interval="1d", group_by="ticker", auto_adjust=True, progress=False)
        for sym in macro_keys:
            meta = MACRO_METADATA[sym]
            cat = meta["category"]
            plural_cat = "rates" if cat == "rate" else ("currencies" if cat == "currency" else "commodities")
            try:
                sub = df[sym].dropna(subset=["Close"]) if sym in df else pd.DataFrame()
                if not sub.empty:
                    last_c = float(sub["Close"].iloc[-1])
                    prev_c = float(sub["Close"].iloc[-2]) if len(sub) > 1 else last_c
                    chg = last_c - prev_c
                    chg_pct = (chg / prev_c * 100.0) if prev_c > 0 else 0.0
                    closes = [round(float(c), 2) for c in sub["Close"].tolist()]
                    spark_svg = _generate_sparkline_svg(closes)
                    categories[plural_cat].append({
                        "symbol": sym,
                        "name": meta["name"],
                        "label": meta["label"],
                        "unit": meta["unit"],
                        "price": round(last_c, 2),
                        "change": round(chg, 2),
                        "changePercent": round(chg_pct, 2),
                        "isPositive": chg >= 0,
                        "sparkline": closes,
                        "sparklineSvg": spark_svg,
                    })
            except Exception as e:
                logger.debug(f"Failed macro parse for {sym}: {e}")
    except Exception as ex:
        logger.error(f"Macro download failed: {ex}")

    _set_cache(cache_key, categories)
    return categories
