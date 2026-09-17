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
