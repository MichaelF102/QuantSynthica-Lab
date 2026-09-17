import os
import json
import threading
from typing import Dict, List, Optional
from ..models.schemas import StrategyConfig, BacktestResult
from ..strategies.templates import get_template_strategies

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STRATEGIES_FILE = os.path.join(DATA_DIR, "strategies.json")
BACKTESTS_FILE = os.path.join(DATA_DIR, "backtests.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

class StorageRepository:
    def __init__(self):
        self._lock = threading.Lock()
        self._strategies: Dict[str, StrategyConfig] = {}
        self._backtests: Dict[str, BacktestResult] = {}
        self._settings: Dict[str, any] = {}
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
                    pass

    def _save_strategies(self):
        # Persist custom strategies (and updated templates)
        with open(STRATEGIES_FILE, "w") as f:
            json.dump([s.model_dump() for s in self._strategies.values()], f, indent=2)

    def _load_backtests(self):
        if os.path.exists(BACKTESTS_FILE):
            try:
                with open(BACKTESTS_FILE, "r") as f:
                    data = json.load(f)
                    for item in data:
                        res = BacktestResult.model_validate(item)
                        self._backtests[res.id] = res
            except Exception:
                pass

    def _save_backtests(self):
        with open(BACKTESTS_FILE, "w") as f:
            # Save recent 100 backtests
            recent = list(self._backtests.values())[-100:]
            json.dump([b.model_dump() for b in recent], f, indent=2)

    def _load_settings(self):
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, "r") as f:
                    self._settings = json.load(f)
            except Exception:
                self._settings = {}

    def _save_settings(self):
        with open(SETTINGS_FILE, "w") as f:
            json.dump(self._settings, f, indent=2)

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

    def get_settings(self) -> Dict[str, any]:
        with self._lock:
            return dict(self._settings)

    def save_settings(self, settings: Dict[str, any]) -> Dict[str, any]:
        with self._lock:
            self._settings = dict(settings)
            self._save_settings()
            return dict(self._settings)

storage = StorageRepository()
