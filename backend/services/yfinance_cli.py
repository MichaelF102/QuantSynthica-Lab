#!/usr/bin/env python3
"""
CLI bridge for Next.js to fetch normalized Yahoo Finance data through yfinance.
Outputs JSON to stdout.
Usage:
  python yfinance_cli.py asset SPY 6M
  python yfinance_cli.py options SPY 2026-09-30
  python yfinance_cli.py benchmarks
  python yfinance_cli.py watchlist
  python yfinance_cli.py macro
"""

import sys
import json
from pathlib import Path

# Add backend directory to sys.path
_service_dir = Path(__file__).resolve().parent
_root_dir = _service_dir.parent.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))

from backend.services.market_data import (
    get_asset_details,
    get_option_chain_data,
    get_benchmarks_data,
    get_watchlist_data,
    get_macro_cross_asset_data,
)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1].lower()

    try:
        if cmd == "asset":
            symbol = sys.argv[2] if len(sys.argv) > 2 else "SPY"
            timeframe = sys.argv[3] if len(sys.argv) > 3 else "6M"
            result = get_asset_details(symbol, timeframe)
            print(json.dumps(result))
        elif cmd == "options":
            symbol = sys.argv[2] if len(sys.argv) > 2 else "SPY"
            expiration = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != "null" else None
            result = get_option_chain_data(symbol, expiration)
            print(json.dumps(result))
        elif cmd == "benchmarks":
            result = get_benchmarks_data()
            print(json.dumps(result))
        elif cmd == "watchlist":
            result = get_watchlist_data()
            print(json.dumps(result))
        elif cmd == "macro":
            result = get_macro_cross_asset_data()
            print(json.dumps(result))
        else:
            print(json.dumps({"error": f"Unknown command: {cmd}"}))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
