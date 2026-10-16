import os
import json
import logging
import tempfile
import threading
from typing import Any, Dict, List, Optional
from ..models.schemas import StrategyConfig, BacktestResult
from ..strategies.templates import get_template_strategies

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STRATEGIES_FILE = os.path.join(DATA_DIR, "strategies.json")
BACKTESTS_FILE = os.path.join(DATA_DIR, "backtests.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

logger = logging.getLogger("quantsynthica.storage")


def _atomic_write_json(path: str, payload) -> None:
    """Write via temp file + rename so a crash never leaves a truncated JSON file."""
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(payload, f, indent=2)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


class StorageRepository:
    def __init__(self):
        self._lock = threading.Lock()
        self._strategies: Dict[str, StrategyConfig] = {}
        self._backtests: Dict[str, BacktestResult] = {}
        self._settings: Dict[str, Any] = {}
        self._load_strategies()
        self._load_backtests()
        self._load_settings()

    def _load_strategies(self):
        with self._lock:
            # Seed with templates
            for t in get_template_strategies():
                self._strategies[t.id] = t

            if os.path.exists(STRATEGIES_FILE):
                try:
                    with open(STRATEGIES_FILE, "r") as f:
                        data = json.load(f)
                        for item in data:
                            cfg = StrategyConfig.model_validate(item)
                            self._strategies[cfg.id] = cfg
                except Exception:
                    logger.exception("Could not load %s; keeping templates only", STRATEGIES_FILE)

    def _save_strategies(self):
        # Persist custom strategies (and updated templates)
        _atomic_write_json(STRATEGIES_FILE, [s.model_dump() for s in self._strategies.values()])

    def _load_backtests(self):
        if os.path.exists(BACKTESTS_FILE):
            try:
                with open(BACKTESTS_FILE, "r") as f:
                    data = json.load(f)
                    for item in data:
                        res = BacktestResult.model_validate(item)
                        self._backtests[res.id] = res
            except Exception:
                logger.exception("Could not load %s", BACKTESTS_FILE)

    def _save_backtests(self):
        # Keep (and persist) only the most recent 100 backtests so memory and disk stay bounded.
        while len(self._backtests) > 100:
            del self._backtests[next(iter(self._backtests))]
        _atomic_write_json(BACKTESTS_FILE, [b.model_dump(mode="json") for b in self._backtests.values()])

    def _load_settings(self):
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, "r") as f:
                    self._settings = json.load(f)
            except Exception:
                logger.exception("Could not load %s", SETTINGS_FILE)
                self._settings = {}

    def _save_settings(self):
        _atomic_write_json(SETTINGS_FILE, self._settings)

    def list_strategies(self) -> List[StrategyConfig]:
        with self._lock:
            return list(self._strategies.values())

    def get_strategy(self, strategy_id: str) -> Optional[StrategyConfig]:
        with self._lock:
            return self._strategies.get(strategy_id)

    def save_strategy(self, strategy: StrategyConfig) -> StrategyConfig:
        with self._lock:
            self._strategies[strategy.id] = strategy
            self._save_strategies()
            return strategy

    def delete_strategy(self, strategy_id: str) -> bool:
        with self._lock:
            if strategy_id in self._strategies:
                del self._strategies[strategy_id]
                self._save_strategies()
                return True
            return False

    def list_backtests(self) -> List[BacktestResult]:
        with self._lock:
            return list(self._backtests.values())

    def get_backtest(self, backtest_id: str) -> Optional[BacktestResult]:
        with self._lock:
            return self._backtests.get(backtest_id)

    def save_backtest(self, backtest: BacktestResult) -> BacktestResult:
        with self._lock:
            self._backtests[backtest.id] = backtest
            self._save_backtests()
            return backtest

    def delete_backtest(self, backtest_id: str) -> bool:
        with self._lock:
            if backtest_id in self._backtests:
                del self._backtests[backtest_id]
                self._save_backtests()
                return True
            return False

    def get_settings(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._settings)

    def save_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            self._settings = dict(settings)
            self._save_settings()
            return dict(self._settings)

storage = StorageRepository()
