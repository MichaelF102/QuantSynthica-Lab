import os
import logging
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

logger = logging.getLogger("quantsynthica.universe")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
US_CSV = os.path.join(DATA_DIR, "US_Stocks_Data.csv")
INDIA_CSV = os.path.join(DATA_DIR, "India_Stocks_Data.csv")

class StocksUniverseManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StocksUniverseManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.stocks: List[Dict[str, Any]] = []
        self.symbol_map: Dict[str, Dict[str, Any]] = {}
        self.load_stocks_data()
        self._initialized = True

    def _clean_val(self, val):
        if pd.isna(val) or val == "" or val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return str(val)

    def load_stocks_data(self):
        items = []

        # 1. Load US Stocks
        if os.path.exists(US_CSV):
            try:
                df_us = pd.read_csv(US_CSV)
                for _, row in df_us.iterrows():
                    sym = str(row.get("Symbol", "")).strip().upper()
                    if not sym or sym == "NAN":
                        continue
                    # Normalise symbol for Yahoo Finance (e.g. BRK.B -> BRK-B)
                    yf_sym = sym.replace(".", "-")

                    entry = {
                        "symbol": sym,
                        "yf_symbol": yf_sym,
                        "name": str(row.get("Description", sym)),
                        "market": "US",
                        "exchange": str(row.get("Exchange", "US")),
                        "price": self._clean_val(row.get("Price")),
                        "currency": str(row.get("Price - Currency", "USD")),
                        "change_1d": self._clean_val(row.get("Price change %, 1 day")),
                        "volume_1d": self._clean_val(row.get("Volume, 1 day")),
                        "market_cap": self._clean_val(row.get("Market capitalization")),
                        "pe_ratio": self._clean_val(row.get("Price to earnings ratio")),
                        "eps_ttm": self._clean_val(row.get("Earnings per share diluted, Trailing 12 months")),
                        "dividend_yield": self._clean_val(row.get("Dividend yield %, Trailing 12 months")),
                        "sector": str(row.get("Sector", "General")),
                    }
                    items.append(entry)
            except Exception as e:
                logger.error(f"Error loading US stocks CSV: {e}")

        # 2. Load India Stocks
        if os.path.exists(INDIA_CSV):
            try:
                df_in = pd.read_csv(INDIA_CSV)
                for _, row in df_in.iterrows():
                    sym = str(row.get("Symbol", "")).strip().upper()
                    if not sym or sym == "NAN":
                        continue
                    exch = str(row.get("Exchange", "NSE")).strip().upper()
                    # Yahoo Finance suffix for India
                    yf_sym = f"{sym}.NS" if exch == "NSE" else f"{sym}.BO"

                    entry = {
                        "symbol": sym,
                        "yf_symbol": yf_sym,
                        "name": str(row.get("Description", sym)),
                        "market": "India",
                        "exchange": exch,
                        "isin": str(row.get("ISIN", "")),
                        "price": self._clean_val(row.get("Price")),
                        "currency": str(row.get("Price - Currency", "INR")),
                        "change_1d": self._clean_val(row.get("Price change %, 1 day")),
                        "volume_1d": self._clean_val(row.get("Volume, 1 day")),
                        "market_cap": self._clean_val(row.get("Market capitalization")),
                        "pe_ratio": self._clean_val(row.get("Price to earnings ratio")),
                        "eps_ttm": self._clean_val(row.get("Earnings per share diluted, Trailing 12 months")),
                        "dividend_yield": self._clean_val(row.get("Dividend yield %, Trailing 12 months")),
                        "sector": str(row.get("Sector", "General")),
                    }
                    items.append(entry)
            except Exception as e:
                logger.error(f"Error loading India stocks CSV: {e}")

        # Sort by Market Cap descending
        def get_mcap(x):
            mc = x.get("market_cap")
            return float(mc) if mc is not None and not np.isnan(mc) else 0.0

        items.sort(key=get_mcap, reverse=True)
        self.stocks = items

        # Build lookup maps
        self.symbol_map = {}
        for s in items:
            # Map by bare symbol
            if s["symbol"] not in self.symbol_map:
                self.symbol_map[s["symbol"]] = s
            # Map by yf_symbol
            if s["yf_symbol"] not in self.symbol_map:
                self.symbol_map[s["yf_symbol"]] = s

        logger.info(f"Loaded {len(self.stocks)} stocks from US and India datasets into StocksUniverseManager.")

    def search(
        self,
        query: Optional[str] = None,
        market: Optional[str] = None,
        sector: Optional[str] = None,
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        results = []
        q = (query or "").strip().lower()

        for s in self.stocks:
            if market and market.lower() != "all" and s["market"].lower() != market.lower():
                continue
            if sector and sector.lower() != "all" and s["sector"].lower() != sector.lower():
                continue

            if q:
                if (
                    q in s["symbol"].lower() or
                    q in s["yf_symbol"].lower() or
                    q in s["name"].lower()
                ):
                    results.append(s)
            else:
                results.append(s)

            if len(results) >= limit:
                break

        return results

    def get_stock(self, symbol: str) -> Optional[Dict[str, Any]]:
        sym = symbol.strip().upper()
        if sym in self.symbol_map:
            return self.symbol_map[sym]
        # Try stripping suffix (e.g. .NS or .BO)
        bare = sym.split(".")[0]
        if bare in self.symbol_map:
            return self.symbol_map[bare]
        return None

    def get_sectors(self, market: Optional[str] = None) -> List[str]:
        sectors = set()
        for s in self.stocks:
            if market and market.lower() != "all" and s["market"].lower() != market.lower():
                continue
            sec = s.get("sector")
            if sec and sec != "General" and sec != "nan":
                sectors.add(sec)
        return sorted(list(sectors))

universe_manager = StocksUniverseManager()
