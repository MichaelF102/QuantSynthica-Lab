import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["engine"] == "ready"

def test_api_market_data():
    response = client.get("/market/data?ticker=AAPL&start_date=2023-01-01&end_date=2023-04-01")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "bars" in data
    assert len(data["bars"]) > 10

def test_api_strategies_crud():
    # List
    response = client.get("/strategies")
    assert response.status_code == 200
    strats = response.json()
    assert len(strats) >= 10 # Default templates

    # Get one
    first_id = strats[0]["id"]
    res_one = client.get(f"/strategies/{first_id}")
    assert res_one.status_code == 200
    assert res_one.json()["id"] == first_id

def test_api_backtest_run():
    # Fetch template
    res_list = client.get("/strategies")
    template = res_list.json()[0]

    payload = {
        "strategy": template,
        "start_date": "2023-01-01",
        "end_date": "2023-06-01",
        "benchmark": "SPY"
    }
    response = client.post("/backtests", json=payload)
    assert response.status_code == 200
    bt = response.json()
    assert bt["status"] == "COMPLETED"
    assert "metrics" in bt
    assert "equity_curve" in bt
    assert len(bt["equity_curve"]) > 20

def test_api_pairs_trading():
    payload = {
        "ticker_a": "KO",
        "ticker_b": "PEP",
        "start_date": "2023-01-01",
        "end_date": "2023-06-01",
        "lookback_window": 30,
        "entry_z_score": 1.5,
        "exit_z_score": 0.5,
        "stop_z_score": 3.0
    }
    response = client.post("/pairs", json=payload)
    assert response.status_code == 200
    pairs_res = response.json()
    assert "hedge_ratio" in pairs_res
    assert "spread_series" in pairs_res
    assert len(pairs_res["equity_curve"]) > 10


def test_api_market_data_unavailable_is_503_not_synthetic(monkeypatch):
    """With synthetic fallback off and the provider failing, the API must not invent prices."""
    import backend.engine.data as data_mod

    monkeypatch.delenv("ALLOW_SYNTHETIC_DATA", raising=False)
    monkeypatch.setattr(data_mod.yf, "Ticker", lambda *_a, **_k: (_ for _ in ()).throw(RuntimeError("offline")))
    response = client.get("/market/data?ticker=ZZZNOCACHE&start_date=2019-01-01&end_date=2019-03-01")
    assert response.status_code == 503
    assert "unavailable" in response.json()["detail"].lower()


def test_api_failed_sync_backtest_not_persisted(monkeypatch):
    import backend.engine.data as data_mod
    from backend.api.storage import storage

    template = client.get("/strategies").json()[0]
    template["asset"] = "ZZZNOCACHE2"
    monkeypatch.delenv("ALLOW_SYNTHETIC_DATA", raising=False)
    monkeypatch.setattr(data_mod.yf, "Ticker", lambda *_a, **_k: (_ for _ in ()).throw(RuntimeError("offline")))
    before = len(storage.list_backtests())
    response = client.post(
        "/backtests",
        json={"strategy": template, "start_date": "2019-01-01", "end_date": "2019-06-01", "benchmark": "ZZZNOCACHE3"},
    )
    assert response.status_code == 503
    assert len(storage.list_backtests()) == before


def test_api_report_export_handles_missing_risk():
    template = client.get("/strategies").json()[0]
    bt = client.post(
        "/backtests",
        json={"strategy": template, "start_date": "2023-01-01", "end_date": "2023-06-01", "benchmark": "SPY"},
    ).json()
    from backend.api.storage import storage

    stored = storage.get_backtest(bt["id"])
    stored.risk = None
    response = client.get(f"/backtests/{bt['id']}/export/report")
    assert response.status_code == 200
    assert "—" in response.text


def test_fetch_ohlcv_tries_sibling_exchange_listing(monkeypatch):
    """Universe maps some names to an exchange with no history (HDFCBANK.BO); .NS must be tried next."""
    import pandas as pd
    import backend.engine.data as data_mod
    from backend.engine.data import MarketDataEngine

    seen = []
    idx = pd.bdate_range("2023-01-02", periods=40)
    frame = pd.DataFrame({"Open": 1.0, "High": 2.0, "Low": 0.5, "Close": 1.5, "Volume": 10}, index=idx)

    class FakeTicker:
        def __init__(self, sym):
            self.sym = sym

        def history(self, **_kw):
            seen.append(self.sym)
            return frame if self.sym.endswith(".NS") else pd.DataFrame()

    monkeypatch.setattr(data_mod.yf, "Ticker", FakeTicker)
    monkeypatch.setattr(data_mod.universe_manager, "get_stock", lambda _t: {"yf_symbol": "ZZTEST.BO"})
    df, synthetic = MarketDataEngine(use_cache=False).fetch_ohlcv("ZZTEST", "2023-01-02", "2023-02-27")
    assert seen[:2] == ["ZZTEST.BO", "ZZTEST.NS"]
    assert not synthetic and len(df) >= 5


def test_dividend_yield_normalisation():
    from backend.engine.fundamentals import normalize_dividend_yield as n

    assert n(0.49, 0.0) == 0.49  # percent convention (current yfinance), Indian stock with no trailing yield
    assert abs(n(0.32, 0.0030615814) - 0.32) < 1e-9  # percent convention confirmed by the trailing fraction
    assert abs(n(0.0032, 0.0030615814) - 0.32) < 1e-9  # legacy fraction convention is converted to percent
    assert n(None, 0.01) is None


def test_research_feed_unknown_kind_and_unavailable(monkeypatch):
    assert client.get("/market/research/AAPL/nonsense").status_code == 404
    import backend.services.research_data as rd

    class Empty:
        analyst_price_targets = None
        recommendations_summary = None
        info = {}

    monkeypatch.setattr(rd.yf, "Ticker", lambda *_a, **_k: Empty())
    rd._CACHE.clear()
    body = client.get("/market/research/ZZTESTX/analyst").json()
    assert body["available"] is False and body["reason"]


def test_research_news_normalises_both_provider_shapes(monkeypatch):
    import backend.services.research_data as rd

    new_shape = {"content": {"title": "New shape", "pubDate": "2026-01-02T00:00:00Z", "provider": {"displayName": "Wire"}, "canonicalUrl": {"url": "https://x/1"}, "summary": "s"}}
    old_shape = {"title": "Old shape", "publisher": "Desk", "link": "https://x/2", "providerPublishTime": 1700000000}
    a, b = rd._norm_news(new_shape), rd._norm_news(old_shape)
    assert (a["title"], a["publisher"], a["link"]) == ("New shape", "Wire", "https://x/1")
    assert (b["title"], b["publisher"], b["link"]) == ("Old shape", "Desk", "https://x/2") and b["published"].startswith("2023-")
    assert rd._norm_news({"content": {}}) is None


def test_research_peers_uses_universe_only():
    body = client.get("/market/research/RELIANCE/peers").json()
    assert body["available"] and 0 < len(body["peers"]) <= 8
    assert all(p["symbol"] != "RELIANCE" for p in body["peers"])
    caps = [p["market_cap"] for p in body["peers"]]
    assert caps == sorted(caps, reverse=True)


def test_research_peers_have_no_duplicate_symbols():
    for sym in ("RELIANCE", "TCS", "AAPL"):
        body = client.get(f"/market/research/{sym}/peers").json()
        if body.get("available"):
            symbols = [p["symbol"] for p in body["peers"]]
            assert len(symbols) == len(set(symbols)), f"duplicate peers for {sym}: {symbols}"


def test_indices_endpoint_lists_csv_universe():
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.engine.indices_universe import indices_universe

    indices_universe.probing = True  # keep the background network probe out of the test
    client = TestClient(app)
    body = client.get("/market/indices").json()
    syms = {i["symbol"] for i in body["indices"]}
    assert {"^NSEI", "^NSEBANK", "^CNXIT", "^BSESN"} <= syms
    assert len(syms) >= 150 and len(syms) == len(body["indices"])  # de-duplicated
    nifty = next(i for i in body["indices"] if i["symbol"] == "^NSEI")
    assert nifty["name"] == "Nifty 50" and nifty["exchange"] == "NSE" and nifty["category"]

    sect = client.get("/market/indices", params={"category": "Sectoral", "exchange": "NSE"}).json()["indices"]
    assert sect and all(i["category"] == "Sectoral" and i["exchange"] == "NSE" for i in sect)
    found = client.get("/market/indices", params={"query": "bank"}).json()["indices"]
    assert found and all("bank" in (i["name"] + i["symbol"] + i["sector"]).lower() for i in found)


def test_indices_availability_flag():
    from backend.engine.indices_universe import IndicesUniverse, MIN_BARS
    u = IndicesUniverse()
    u.bars = {"^NSEI": 120, "BSE-IT.BO": 1}
    assert u.available("^NSEI") is True and u.available("BSE-IT.BO") is False and u.available("^CNXIT") is None
    u.probing = True
    only = {i["symbol"] for i in u.list(available_only=True)}
    assert "^NSEI" in only and "BSE-IT.BO" not in only and "^CNXIT" in only  # unknown stays selectable
    assert u.list()[-1]["available"] is False  # unusable sort last


def test_backtest_rejects_benchmark_without_price_data():
    from fastapi.testclient import TestClient
    from backend.main import app
    from backend.engine.indices_universe import indices_universe

    indices_universe.bars["BSE-IT.BO"] = 1
    indices_universe.probing = True
    client = TestClient(app)
    strat = client.get("/strategies").json()[0]
    r = client.post("/backtests", json={"strategy": strat, "start_date": "2024-01-01", "end_date": "2024-06-01", "benchmark": "BSE-IT.BO"})
    assert r.status_code == 422
    detail = r.json()["detail"]
    assert "no price history" in detail and "BSE-IT.BO" in detail
