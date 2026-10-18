import numpy as np
import pandas as pd
from backend.models.schemas import StrategyConfig, ConditionRule, RuleOperator, RiskConfig, ExecutionConfig
from backend.engine.backtester import BacktestEngine


def frame(closes, spread=1.0):
    idx = pd.date_range("2023-01-02", periods=len(closes), freq="B")
    c = np.array(closes, dtype=float)
    o = np.concatenate([[c[0]], c[:-1]])  # each bar opens at the prior close
    return pd.DataFrame({"open": o, "high": np.maximum(o, c) + spread, "low": np.minimum(o, c) - spread, "close": c, "volume": 1e9}, index=idx)


def strat(risk, entry_thr=0.0, exit_rule=None):
    return StrategyConfig(
        id="t", name="t", asset="X", indicators=[],
        entry_rules=[ConditionRule(id="e", indicator_a="close", operator=RuleOperator.GT, threshold=entry_thr)],
        exit_rules=[exit_rule] if exit_rule else [],
        risk=risk,
        execution=ExecutionConfig(commission_pct=0.0, slippage_pct=0.0, spread_pct=0.0, initial_capital=100000.0),
    )


def run(strategy, closes, spread=1.0):
    return BacktestEngine(strategy).run(frame(closes, spread))


def test_default_is_long_only_and_loses_on_a_falling_market():
    falling = list(np.linspace(100, 80, 40))
    out = run(strat(RiskConfig(stop_loss_pct=None, take_profit_pct=None, max_positions=1, position_size_pct=50)), falling)
    assert [t.direction for t in out["trades"]] == ["LONG"]
    assert out["trades"][0].net_pnl < 0


def test_short_side_profits_when_price_falls():
    falling = list(np.linspace(100, 80, 40))
    out = run(strat(RiskConfig(direction="short", stop_loss_pct=None, take_profit_pct=None, max_positions=1, position_size_pct=50)), falling)
    assert [t.direction for t in out["trades"]] == ["SHORT"]
    t = out["trades"][0]
    assert t.net_pnl > 0
    assert out["equity_curve"][-1].portfolio_value > 100000.0
    # equity must equal cash + realised P&L once flat, i.e. no phantom collateral
    assert abs(out["equity_curve"][-1].portfolio_value - (100000.0 + t.net_pnl)) < 1.0


def test_short_stop_loss_sits_above_entry():
    rising = list(np.linspace(100, 130, 40))
    out = run(strat(RiskConfig(direction="short", stop_loss_pct=5.0, take_profit_pct=None, max_positions=1, position_size_pct=50)), rising)
    t = out["trades"][0]
    assert t.direction == "SHORT" and t.exit_reason == "STOP_LOSS"
    assert t.exit_price > t.entry_price
    assert t.net_pnl < 0


def test_both_mode_flips_from_long_to_short():
    # starts below 110, rises through it, then falls back through it
    path = list(np.linspace(100, 125, 20)) + list(np.linspace(125, 95, 30))
    exit_rule = ConditionRule(id="x", indicator_a="close", operator=RuleOperator.LT, threshold=110.0)
    out = run(strat(RiskConfig(direction="both", stop_loss_pct=None, take_profit_pct=None, max_positions=1, position_size_pct=50), entry_thr=110.0, exit_rule=exit_rule), path)
    # below 110 the exit rule is true (short), above it the entry rule is true (long), then it flips back
    assert [t.direction for t in out["trades"]] == ["SHORT", "LONG", "SHORT"]


def test_legacy_allow_short_flag_still_means_both():
    path = list(np.linspace(100, 125, 20)) + list(np.linspace(125, 95, 30))
    exit_rule = ConditionRule(id="x", indicator_a="close", operator=RuleOperator.LT, threshold=110.0)
    out = run(strat(RiskConfig(allow_short=True, stop_loss_pct=None, take_profit_pct=None, max_positions=1, position_size_pct=50), entry_thr=110.0, exit_rule=exit_rule), path)
    assert {"LONG", "SHORT"} <= {t.direction for t in out["trades"]}


def test_trailing_stop_works_without_a_fixed_stop():
    path = list(np.linspace(100, 120, 20)) + list(np.linspace(120, 100, 20))
    out = run(strat(RiskConfig(stop_loss_pct=None, take_profit_pct=None, trailing_stop_pct=5.0, max_positions=1, position_size_pct=50)), path)
    t = out["trades"][0]
    assert t.exit_reason == "TRAILING_STOP"
    assert t.exit_price > 112.0  # ~5% below the ~121 peak, well before the slide to 100


def test_atr_stop_distance_scales_with_the_multiple():
    # flat, then a drop; bar range 2 around a quiet close so ATR is about 2
    path = [100.0] * 30 + list(np.linspace(100, 85, 10))
    dist = {}
    for mult in (1.0, 2.0):
        out = run(strat(RiskConfig(stop_loss_pct=None, take_profit_pct=None, stop_atr_mult=mult, atr_period=10, max_positions=1, position_size_pct=50)), path, spread=1.0)
        t = out["trades"][0]
        assert t.exit_reason == "STOP_LOSS"
        dist[mult] = t.entry_price - t.exit_price
    assert 1.5 < dist[1.0] < 3.0
    assert dist[2.0] > dist[1.0] * 1.6


def test_volatility_target_shrinks_position_in_choppy_markets():
    rng = np.random.default_rng(3)
    path = list(100 * np.cumprod(1 + rng.normal(0, 0.03, 120)))  # ~48% annualised vol
    base = RiskConfig(stop_loss_pct=None, take_profit_pct=None, max_positions=1, position_size_pct=90)
    plain = run(strat(base), path)["trades"][0].quantity
    targeted = run(strat(base.model_copy(update={"target_volatility": 10.0})), path)["trades"][0].quantity
    assert targeted < plain * 0.6


def test_strategy_versions_are_recorded_once_per_real_change(tmp_path, monkeypatch):
    from backend.api import storage as st
    monkeypatch.setattr(st, "STRATEGIES_FILE", str(tmp_path / "s.json"))
    monkeypatch.setattr(st, "VERSIONS_FILE", str(tmp_path / "v.json"))
    repo = st.StorageRepository()
    s = strat(RiskConfig())
    s.id = "strat_versions"
    s.updated_at = "2026-01-01T00:00:00"
    repo.save_strategy(s)
    s2 = s.model_copy(update={"updated_at": "2026-01-02T00:00:00"})
    repo.save_strategy(s2)  # same content: not a new version
    s3 = s.model_copy(deep=True)
    s3.name = "renamed"
    s3.updated_at = "2026-01-03T00:00:00"
    repo.save_strategy(s3)
    versions = repo.list_versions("strat_versions")
    assert [v["version"] for v in versions] == [2, 1]
    assert versions[0]["strategy"]["name"] == "renamed"
    repo.delete_strategy("strat_versions")
    assert repo.list_versions("strat_versions") == []
