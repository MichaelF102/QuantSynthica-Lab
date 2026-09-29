#!/usr/bin/env python3
"""
Generates an authentic real-time market universe snapshot via yfinance.
Saves to data/market_universe_live.json
"""

import os
import sys
import json
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.services.market_data import (
    get_asset_details,
    get_option_chain_data,
    get_benchmarks_data,
    get_watchlist_data,
    get_macro_cross_asset_data,
)

def main():
    print("=== Generating Authentic Yahoo Finance Market Snapshot ===")
    
    # 1. Benchmarks
    print("Fetching Benchmarks...")
    benchmarks = get_benchmarks_data()

    # 2. Watchlist
    print("Fetching Watchlist...")
    watchlist = get_watchlist_data()

    # 3. Macro & Cross-Asset
    print("Fetching Macro Instruments...")
    macro = get_macro_cross_asset_data()

    # 4. Core Featured Assets
    core_symbols = [
        # US Equities
        "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "JPM",
        # Indian Equities
        "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "ITC.NS", "LT.NS",
        # ETFs
        "SPY", "QQQ", "IWM", "VOO", "VTI", "GLD", "TLT",
        # Indices
        "^GSPC", "^IXIC", "^DJI", "^NSEI", "^BSESN", "^NSEBANK",
        # Macro
        "^TNX", "^FVX", "^IRX", "EURUSD=X", "USDINR=X", "GC=F", "CL=F", "SI=F"
    ]

    assets = {}
    for sym in core_symbols:
        try:
            print(f"Fetching {sym}...")
            assets[sym] = get_asset_details(sym, "6M")
        except Exception as e:
            print(f"Failed to fetch {sym}: {e}")

    # 5. Options Chains
    print("Fetching SPY & AAPL options chains...")
    options = {
        "SPY": get_option_chain_data("SPY"),
        "AAPL": get_option_chain_data("AAPL"),
        "QQQ": get_option_chain_data("QQQ"),
        "NVDA": get_option_chain_data("NVDA"),
        "RELIANCE.NS": get_option_chain_data("RELIANCE.NS"),
    }

    snapshot = {
        "_generated_at": time_now(),
        "benchmarks": benchmarks,
        "watchlist": watchlist,
        "macro": macro,
        "assets": assets,
        "options": options,
    }

    out_path = os.path.join(str(root_dir), "data", "market_universe_live.json")
    with open(out_path, "w") as f:
        json.dump(snapshot, f, indent=2)

    print(f"=== Successfully saved snapshot with {len(assets)} assets to {out_path} ===")

def time_now():
    import datetime
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

if __name__ == "__main__":
    main()
