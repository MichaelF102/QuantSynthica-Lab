"""
QuantSynthica Lab — Institutional Market Data Service Layer
Fetches, normalizes, and enriches real market data via yfinance for:
- US Equities (Technicals + Fundamentals + Valuation)
- Indian Equities (NSE/BSE, INR units, Fundamental ratios)
- ETFs (AUM, Expense ratio, Top holdings, Sector exposure)
- Global Indices (Level, ATR, RSI, Normalized Relative Performance)
- Options Chains (Calls, Puts, Black-Scholes Greeks, IV Smile, Max Pain, PCR)
- Macro & Economic Data (US Treasury Yield Curve, Commodities, FX, Cross-Asset)
Includes caching and fast disk persistence to prevent rate-limiting.
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
from scipy.stats import norm

logger = logging.getLogger("quantsynthica.market_service")

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# In-memory short-lived cache (quotes: 60s, history: 600s, options: 900s)
_MEM_CACHE: Dict[str, Dict[str, Any]] = {}

ETF_METADATA = {
    "SPY": {
        "classification": "Broad Market ETF",
        "category": "US Large Cap Blend",
        "holdings": [{"name": "Apple Inc.", "ticker": "AAPL", "weight": "7.1%"}, {"name": "Microsoft Corp.", "ticker": "MSFT", "weight": "6.8%"}, {"name": "NVIDIA Corp.", "ticker": "NVDA", "weight": "6.2%"}, {"name": "Amazon.com Inc.", "ticker": "AMZN", "weight": "3.8%"}, {"name": "Meta Platforms", "ticker": "META", "weight": "2.5%"}],
        "sectors": [{"sector": "Information Technology", "weight": "31.2%"}, {"sector": "Financials", "weight": "13.4%"}, {"sector": "Health Care", "weight": "11.8%"}, {"sector": "Consumer Discretionary", "weight": "10.2%"}, {"sector": "Communication Services", "weight": "9.1%"}]
    },
    "QQQ": {
        "classification": "Technology ETF",
        "category": "Nasdaq 100 Large Cap Growth",
        "holdings": [{"name": "Apple Inc.", "ticker": "AAPL", "weight": "8.8%"}, {"name": "Microsoft Corp.", "ticker": "MSFT", "weight": "8.3%"}, {"name": "NVIDIA Corp.", "ticker": "NVDA", "weight": "7.9%"}, {"name": "Amazon.com Inc.", "ticker": "AMZN", "weight": "5.1%"}, {"name": "Broadcom Inc.", "ticker": "AVGO", "weight": "4.6%"}],
        "sectors": [{"sector": "Technology", "weight": "51.4%"}, {"sector": "Communication", "weight": "15.2%"}, {"sector": "Consumer Discretionary", "weight": "13.6%"}, {"sector": "Healthcare", "weight": "6.2%"}]
    },
    "IWM": {"classification": "Small Cap ETF", "category": "Russell 2000 Small Blend"},
    "DIA": {"classification": "Mega Cap Value ETF", "category": "Dow Jones 30 Industrial"},
    "VOO": {"classification": "S&P 500 Index ETF", "category": "US Large Cap Blend"},
    "VTI": {"classification": "Total Stock Market ETF", "category": "All Cap US Equities"},
    "XLK": {"classification": "Technology Sector SPDR", "category": "Tech Sector"},
    "XLF": {"classification": "Financial Select Sector", "category": "Financial Sector"},
    "XLE": {"classification": "Energy Select Sector", "category": "Energy Sector"},
    "GLD": {"classification": "Physical Gold Trust", "category": "Precious Metals"},
    "TLT": {"classification": "20+ Year Treasury Bond", "category": "Long-Term US Sovereign Debt"},
}

INDEX_METADATA = {
    "^GSPC": {"name": "S&P 500", "displayName": "S&P 500", "market": "US Equities", "flag": "🇺🇸"},
    "^IXIC": {"name": "Nasdaq Composite", "displayName": "NASDAQ", "market": "US Tech", "flag": "🇺🇸"},
    "^DJI": {"name": "Dow Jones Industrial", "displayName": "DOW JONES", "market": "US Industrial", "flag": "🇺🇸"},
    "^RUT": {"name": "Russell 2000 Index", "displayName": "RUSSELL 2000", "market": "US Small Cap", "flag": "🇺🇸"},
    "^NSEI": {"name": "NIFTY 50", "displayName": "NIFTY 50", "market": "India NSE", "flag": "🇮🇳"},
    "^BSESN": {"name": "SENSEX", "displayName": "SENSEX", "market": "India BSE", "flag": "🇮🇳"},
    "^NSEBANK": {"name": "NIFTY Bank", "displayName": "BANK NIFTY", "market": "India Banking", "flag": "🇮🇳"},
}

MACRO_METADATA = {
    "^IRX": {"name": "13-Week Treasury Bill", "displayName": "3M Treasury", "category": "rate", "label": "13-Week Yield", "unit": "%"},
    "^FVX": {"name": "5-Year Treasury Yield", "displayName": "5Y Treasury", "category": "rate", "label": "5-Year Yield", "unit": "%"},
    "^TNX": {"name": "10-Year Treasury Yield", "displayName": "10Y Treasury", "category": "rate", "label": "10-Year Yield", "unit": "%"},
    "^TYX": {"name": "30-Year Treasury Yield", "displayName": "30Y Treasury", "category": "rate", "label": "30-Year Yield", "unit": "%"},
    "GC=F": {"name": "Gold Futures", "displayName": "Gold", "category": "commodity", "label": "Gold Futures", "unit": "$/oz"},
    "CL=F": {"name": "WTI Crude Oil Futures", "displayName": "Crude Oil", "category": "commodity", "label": "WTI Crude Oil", "unit": "$/bbl"},
    "SI=F": {"name": "Silver Futures", "displayName": "Silver", "category": "commodity", "label": "Silver Futures", "unit": "$/oz"},
    "NG=F": {"name": "Natural Gas Futures", "displayName": "Natural Gas", "category": "commodity", "label": "Natural Gas", "unit": "$/MMBtu"},
    "DX-Y.NYB": {"name": "US Dollar Index", "displayName": "Dollar Index", "category": "currency", "label": "Dollar Index", "unit": "USD"},
    "EURUSD=X": {"name": "Euro / US Dollar", "displayName": "EUR / USD", "category": "currency", "label": "Exchange Rate", "unit": "USD"},
    "JPY=X": {"name": "US Dollar / Japanese Yen", "displayName": "USD / JPY", "category": "currency", "label": "Exchange Rate", "unit": "JPY"},
    "GBPUSD=X": {"name": "British Pound / US Dollar", "displayName": "GBP / USD", "category": "currency", "label": "Exchange Rate", "unit": "USD"},
    "INR=X": {"name": "US Dollar / Indian Rupee", "displayName": "USD / INR", "category": "currency", "label": "Exchange Rate", "unit": "INR"},
    "USDINR=X": {"name": "US Dollar / Indian Rupee", "displayName": "USD / INR", "category": "currency", "label": "Exchange Rate", "unit": "INR"},
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

def compute_bs_greeks(S: float, K: float, T: float, r: float, sigma: float, is_call: bool = True) -> Dict[str, float]:
    """
    Standard Black-Scholes Greeks: Delta, Gamma, Theta, Vega
    """
    if T <= 0 or sigma <= 0 or S <= 0 or K <= 0:
        return {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0}
    try:
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        d2 = d1 - sigma * math.sqrt(T)
        if is_call:
            delta = float(norm.cdf(d1))
            theta = float((-S * norm.pdf(d1) * sigma / (2 * math.sqrt(T)) - r * K * math.exp(-r * T) * norm.cdf(d2)) / 365)
        else:
            delta = float(norm.cdf(d1) - 1.0)
            theta = float((-S * norm.pdf(d1) * sigma / (2 * math.sqrt(T)) + r * K * math.exp(-r * T) * norm.cdf(-d2)) / 365)
        gamma = float(norm.pdf(d1) / (S * sigma * math.sqrt(T)))
        vega = float((S * norm.pdf(d1) * math.sqrt(T)) / 100)
        return {
            "delta": round(delta, 3),
            "gamma": round(gamma, 4),
            "theta": round(theta, 3),
            "vega": round(vega, 3)
        }
    except Exception:
        return {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0}

def get_asset_details(symbol: str, timeframe: str = "6M") -> Dict[str, Any]:
    """
    Fetches normalized market asset quote, full OHLCV series, technicals, fundamentals, and valuation.
    """
    sym = symbol.strip().upper()
    cache_key = f"asset_v2_{sym}_{timeframe}"
    cached = _get_cache(cache_key, ttl_seconds=90)
    if cached:
        return cached

    # Map timeframe
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

    try:
        info = ticker.info or {}
    except Exception:
        info = {}

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

    # Compute Bars, Moving Averages, RSI(14), ATR(14)
    bars = []
    closes_list = []
    current_rsi = 50.0
    current_atr = 0.0
    current_vol = 18.0

    if not hist.empty:
        close_s = hist["Close"].ffill()
        high_s = hist["High"].ffill()
        low_s = hist["Low"].ffill()

        ema20_s = close_s.ewm(span=20, adjust=False).mean() if len(close_s) >= 5 else close_s
        ema50_s = close_s.ewm(span=50, adjust=False).mean() if len(close_s) >= 10 else close_s
        ema200_s = close_s.ewm(span=200, adjust=False).mean() if len(close_s) >= 20 else close_s

        # RSI calculation
        delta = close_s.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14, min_periods=5).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14, min_periods=5).mean()
        rs = gain / (loss.replace(0, np.nan))
        rsi_s = 100 - (100 / (1 + rs)).fillna(50)

        # ATR calculation
        tr1 = high_s - low_s
        tr2 = (high_s - close_s.shift()).abs()
        tr3 = (low_s - close_s.shift()).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr_s = tr.rolling(window=14, min_periods=5).mean().fillna(0)

        # Volatility calculation (annualized 20-day standard deviation)
        returns_s = close_s.pct_change()
        vol_s = (returns_s.rolling(window=20, min_periods=5).std() * math.sqrt(252) * 100).fillna(18.0)

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
                "ema_200": round(float(ema200_s.loc[idx]), 2) if not pd.isna(ema200_s.loc[idx]) else None,
                "rsi_14": round(float(rsi_s.loc[idx]), 1) if not pd.isna(rsi_s.loc[idx]) else None,
                "atr_14": round(float(atr_s.loc[idx]), 2) if not pd.isna(atr_s.loc[idx]) else None,
            })

        if not rsi_s.empty:
            current_rsi = round(float(rsi_s.iloc[-1]), 1) if not pd.isna(rsi_s.iloc[-1]) else 50.0
        if not atr_s.empty:
            current_atr = round(float(atr_s.iloc[-1]), 2) if not pd.isna(atr_s.iloc[-1]) else 0.0
        if not vol_s.empty:
            current_vol = round(float(vol_s.iloc[-1]), 1) if not pd.isna(vol_s.iloc[-1]) else 18.0

    spark_closes = closes_list[-30:] if len(closes_list) >= 30 else closes_list
    spark_svg = _generate_sparkline_svg(spark_closes)

    w52_high = float(info.get("fiftyTwoWeekHigh") or (max(closes_list) if closes_list else last_price))
    w52_low = float(info.get("fiftyTwoWeekLow") or (min(closes_list) if closes_list else last_price))

    latest_bar = bars[-1] if bars else {"open": last_price, "high": last_price, "low": last_price, "volume": 0}
    day_open = float(info.get("open") or latest_bar["open"])
    day_high = float(info.get("dayHigh") or latest_bar["high"])
    day_low = float(info.get("dayLow") or latest_bar["low"])
    volume = int(info.get("volume") or info.get("regularMarketVolume") or latest_bar["volume"])

    # Fundamentals for Equities
    fundamentals = None
    if asset_type == "equity":
        rev = info.get("totalRevenue")
        ni = info.get("netIncomeToCommon")
        eps = info.get("trailingEps")
        pe = info.get("trailingPE")
        pb = info.get("priceToBook")
        roe = info.get("returnOnEquity")
        div_y = info.get("dividendYield")

        fundamentals = {
            "revenue": rev,
            "netIncome": ni,
            "eps": round(float(eps), 2) if eps is not None else None,
            "pe": round(float(pe), 2) if pe is not None else None,
            "pb": round(float(pb), 2) if pb is not None else None,
            "roe": round(float(roe) * 100, 2) if roe is not None else None,
            "dividendYield": round(float(div_y) * 100, 2) if div_y is not None else None,
        }

    # Valuation Metrics
    valuation = None
    if asset_type == "equity":
        mcap = info.get("marketCap")
        ev = info.get("enterpriseValue")
        fwd_pe = info.get("forwardPE")
        ps = info.get("priceToSalesTrailing12Months")

        valuation = {
            "marketCap": mcap,
            "enterpriseValue": ev,
            "forwardPE": round(float(fwd_pe), 2) if fwd_pe is not None else None,
            "priceToSales": round(float(ps), 2) if ps is not None else None,
        }

    # ETF-specific metadata
    etf_info = None
    if asset_type == "etf":
        etf_meta = ETF_METADATA.get(sym, {})
        aum = info.get("totalAssets")
        exp_ratio = info.get("netExpenseRatio")
        div_yield = info.get("dividendYield") or info.get("yield")
        cat = info.get("category") or etf_meta.get("category")

        etf_info = {
            "aum": aum,
            "expenseRatio": round(float(exp_ratio) * 100, 3) if exp_ratio is not None else (0.09 if sym == "SPY" else (0.20 if sym == "QQQ" else None)),
            "dividendYield": round(float(div_yield) * 100, 2) if div_yield is not None else None,
            "assetClass": "Equities" if sym not in ["GLD", "TLT"] else ("Precious Metals" if sym == "GLD" else "Fixed Income"),
            "fundCategory": cat or etf_meta.get("classification"),
            "topHoldings": etf_meta.get("holdings", []),
            "sectorWeights": etf_meta.get("sectors", []),
        }

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
        "marketCap": info.get("marketCap") if asset_type == "equity" else None,
        "fiftyTwoWeekHigh": round(w52_high, 2),
        "fiftyTwoWeekLow": round(w52_low, 2),
        "beta": round(float(info.get("beta")), 2) if info.get("beta") is not None and asset_type == "equity" else None,
        "rsi": current_rsi,
        "atr": current_atr,
        "volatility": current_vol,
        "classification": ETF_METADATA.get(sym, {}).get("classification"),
        "macroCategory": MACRO_METADATA.get(sym, {}).get("category"),
        "lastObservationDate": (bars[-1]["date"] if bars else time.strftime("%Y-%m-%d")),
        "sparkline": spark_closes,
        "sparklineSvg": spark_svg,
        "bars": bars,
        "fundamentals": fundamentals,
        "valuation": valuation,
        "etf": etf_info,
    }

    _set_cache(cache_key, data)
    return data

def get_option_chain_data(symbol: str, expiration: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches real option chain with Black-Scholes Greeks, Max Pain, and Put/Call Ratio.
    """
    sym = symbol.strip().upper()
    cache_key = f"options_v2_{sym}_{expiration or 'first'}"
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
            "reason": "Option-chain data is not available for this underlying.",
            "expirations": [],
            "calls": [],
            "puts": [],
        }

    selected_exp = expiration if expiration in available_expirations else available_expirations[0]

    try:
        chain = ticker.option_chain(selected_exp)
        hist = ticker.history(period="1d")
        underlying_price = float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
    except Exception as e:
        logger.error(f"Failed to fetch option chain for {sym} at {selected_exp}: {e}")
        return {
            "symbol": sym,
            "available": False,
            "reason": "Option-chain data is not available for this underlying.",
            "expirations": available_expirations,
            "calls": [],
            "puts": [],
        }

    # Time to expiration in years
    try:
        exp_dt = pd.to_datetime(selected_exp)
        now_dt = pd.to_datetime("today")
        days_to_exp = max(1, (exp_dt - now_dt).days)
        T = days_to_exp / 365.0
    except Exception:
        T = 30.0 / 365.0

    r = 0.05 # 5% benchmark risk-free rate

    def format_df(df, is_call=True):
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

            # Compute Greeks
            greeks = compute_bs_greeks(underlying_price, strike, T, r, max(0.01, iv), is_call=is_call)

            records.append({
                "strike": strike,
                "lastPrice": round(last_p, 2),
                "bid": round(bid, 2),
                "ask": round(ask, 2),
                "volume": vol,
                "openInterest": oi,
                "impliedVolatility": round(iv * 100.0, 2),
                "inTheMoney": itm,
                "delta": greeks["delta"],
                "gamma": greeks["gamma"],
                "theta": greeks["theta"],
                "vega": greeks["vega"],
            })
        return records

    calls = format_df(chain.calls, is_call=True)
    puts = format_df(chain.puts, is_call=False)

    # Calculate Max Pain & Put/Call Ratio
    total_call_vol = sum(c["volume"] for c in calls)
    total_put_vol = sum(p["volume"] for p in puts)
    total_call_oi = sum(c["openInterest"] for c in calls)
    total_put_oi = sum(p["openInterest"] for p in puts)

    pcr_vol = round(total_put_vol / total_call_vol, 2) if total_call_vol > 0 else 1.0
    pcr_oi = round(total_put_oi / total_call_oi, 2) if total_call_oi > 0 else 1.0

    # Max Pain Strike
    strikes = sorted(list(set([c["strike"] for c in calls] + [p["strike"] for p in puts])))
    min_loss = float("inf")
    max_pain_strike = underlying_price

    for test_s in strikes:
        loss = 0.0
        for c in calls:
            if test_s > c["strike"]:
                loss += (test_s - c["strike"]) * c["openInterest"]
        for p in puts:
            if test_s < p["strike"]:
                loss += (p["strike"] - test_s) * p["openInterest"]
        if loss < min_loss:
            min_loss = loss
            max_pain_strike = test_s

    data = {
        "symbol": sym,
        "available": True,
        "underlyingPrice": round(underlying_price, 2),
        "selectedExpiration": selected_exp,
        "daysToExpiration": days_to_exp,
        "expirations": available_expirations,
        "calls": calls,
        "puts": puts,
        "maxPain": round(max_pain_strike, 2),
        "putCallRatioVol": pcr_vol,
        "putCallRatioOI": pcr_oi,
    }

    _set_cache(cache_key, data)
    return data

def get_benchmarks_data() -> List[Dict[str, Any]]:
    """
    Fetches Market Benchmarks: S&P 500, Nasdaq, Dow Jones, NIFTY 50, Sensex.
    """
    cache_key = "benchmarks_list_v2"
    cached = _get_cache(cache_key, ttl_seconds=60)
    if cached:
        return cached

    benchmarks_keys = ["^GSPC", "^IXIC", "^DJI", "^NSEI", "^BSESN", "^RUT", "^NSEBANK"]
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
                        "displayName": meta.get("displayName", meta["name"]),
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
    Fetches Watchlist stocks (US + India).
    """
    cache_key = "watchlist_list_v2"
    cached = _get_cache(cache_key, ttl_seconds=60)
    if cached:
        return cached

    us_syms = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"]
    in_syms = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"]
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
    Fetches Macro & Cross-Asset Instruments: Rates, Currencies, Commodities.
    """
    cache_key = "macro_cross_asset_v2"
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
                        "displayName": meta.get("displayName", meta["name"]),
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
