"""Indian index universe (data/indian_indices.csv) used for benchmarking.

The CSV lists 160+ NSE/BSE indices, but the market-data provider only has price history for some of them.
`availability` is probed in the background (and cached for a week) so the UI can tell a usable benchmark from
one that would fail, instead of letting a backtest die on it.
"""
import csv
import json
import logging
import os
import threading
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger("quantsynthica.indices")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
INDICES_CSV = os.path.join(ROOT, "data", "indian_indices.csv")
CACHE_FILE = os.path.join(ROOT, "backend", "data", "cache", "index_availability.json")
CACHE_TTL = 7 * 24 * 3600
MIN_BARS = 60

# Not in the CSV, but the standard BSE benchmark and known to have a full history.
EXTRAS = [{
    "exchange": "BSE", "symbol": "^BSESN", "name": "BSE SENSEX", "index_category": "Broad Market",
    "sector": "Diversified / Broad Market", "industry": "Broad Market", "market_cap_segment": "Large Cap",
    "style": "Core", "index_family": "BSE Broad Market",
}]


class IndicesUniverse:
    def __init__(self, csv_path: str = INDICES_CSV, cache_file: str = CACHE_FILE):
        self.csv_path, self.cache_file = csv_path, cache_file
        self.indices: List[Dict[str, Any]] = []
        self.by_symbol: Dict[str, Dict[str, Any]] = {}
        self.bars: Dict[str, int] = {}
        self.checked_at: float = 0.0
        self.probing = False
        self._lock = threading.Lock()
        self._load_csv()
        self._load_cache()

    def _load_csv(self) -> None:
        rows: List[Dict[str, Any]] = []
        try:
            with open(self.csv_path, newline="", encoding="utf-8") as f:
                rows = list(csv.DictReader(f))
        except FileNotFoundError:
            logger.warning("Index universe not found at %s", self.csv_path)
        seen = set()
        for r in rows + EXTRAS:
            sym = (r.get("symbol") or "").strip()
            if not sym or sym in seen:
                continue
            seen.add(sym)
            item = {
                "symbol": sym,
                "name": (r.get("name") or sym).strip(),
                "exchange": (r.get("exchange") or "").strip(),
                "category": (r.get("index_category") or "").strip(),
                "sector": (r.get("sector") or "").strip(),
                "industry": (r.get("industry") or "").strip(),
                "segment": (r.get("market_cap_segment") or "").strip(),
                "style": (r.get("style") or "").strip(),
                "family": (r.get("index_family") or "").strip(),
            }
            self.indices.append(item)
            self.by_symbol[sym] = item

    def _load_cache(self) -> None:
        try:
            with open(self.cache_file) as f:
                data = json.load(f)
            self.bars = {k: int(v) for k, v in data.get("bars", {}).items()}
            self.checked_at = float(data.get("checked_at", 0))
        except Exception:
            self.bars, self.checked_at = {}, 0.0

    def _save_cache(self) -> None:
        try:
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
            tmp = self.cache_file + ".tmp"
            with open(tmp, "w") as f:
                json.dump({"checked_at": self.checked_at, "bars": self.bars}, f)
            os.replace(tmp, self.cache_file)
        except Exception as e:  # cache is an optimisation only
            logger.warning("Could not write index availability cache: %s", e)

    def stale(self) -> bool:
        return not self.bars or (time.time() - self.checked_at) > CACHE_TTL

    def probe(self) -> None:
        """Count recent daily bars for every index. Slow (tens of seconds), so run it in a thread."""
        import yfinance as yf

        symbols = [i["symbol"] for i in self.indices]
        bars: Dict[str, int] = {}
        for k in range(0, len(symbols), 40):
            chunk = symbols[k:k + 40]
            try:
                df = yf.download(chunk, period="6mo", interval="1d", progress=False, group_by="ticker", threads=True)
            except Exception as e:
                logger.warning("Index probe chunk failed: %s", e)
                continue
            for s in chunk:
                try:
                    col = df[s]["Close"] if len(chunk) > 1 else df["Close"]
                    bars[s] = int(col.dropna().shape[0])
                except Exception:
                    bars[s] = 0
        if bars:
            with self._lock:
                self.bars, self.checked_at = bars, time.time()
            self._save_cache()

    def ensure_probe(self) -> None:
        with self._lock:
            if self.probing or not self.stale():
                return
            self.probing = True

        def run() -> None:
            try:
                self.probe()
            finally:
                self.probing = False

        threading.Thread(target=run, daemon=True, name="index-probe").start()

    def available(self, symbol: str) -> Optional[bool]:
        """True/False once probed; None while the probe has not finished (treated as usable by the UI)."""
        if symbol not in self.bars:
            return None
        return self.bars[symbol] >= MIN_BARS

    def list(self, exchange: Optional[str] = None, category: Optional[str] = None, query: Optional[str] = None,
             available_only: bool = False) -> List[Dict[str, Any]]:
        self.ensure_probe()
        q = (query or "").strip().lower()
        out = []
        for i in self.indices:
            if exchange and exchange.upper() != "ALL" and i["exchange"].upper() != exchange.upper():
                continue
            if category and category.upper() != "ALL" and i["category"].lower() != category.lower():
                continue
            if q and q not in i["name"].lower() and q not in i["symbol"].lower() and q not in i["sector"].lower():
                continue
            av = self.available(i["symbol"])
            if available_only and av is False:
                continue
            out.append({**i, "available": av})
        # usable first, then the well-known benchmarks, then by name
        out.sort(key=lambda x: (x["available"] is False, x["category"] != "Broad Market", x["name"]))
        return out


indices_universe = IndicesUniverse()
