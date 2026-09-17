from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from .storage import storage
from ..models.schemas import BacktestResult

router = APIRouter(prefix="/analytics", tags=["Analytics"])

class StrategyCompareRequest(BaseModel):
    backtest_ids: List[str]

@router.get("/{backtest_id}")
def get_analytics(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {
        "id": res.id,
        "strategy_name": res.strategy_name,
        "metrics": res.metrics,
        "monthly_returns": res.monthly_returns
    }

@router.post("/compare")
def compare_strategies(request: StrategyCompareRequest):
    results = []
    for b_id in request.backtest_ids:
        bt = storage.get_backtest(b_id)
        if bt and bt.metrics:
            results.append({
                "id": bt.id,
                "strategy_id": bt.strategy_id,
                "strategy_name": bt.strategy_name,
                "ticker": bt.ticker,
                "metrics": bt.metrics,
                "equity_curve": [
                    {"date": pt.date, "portfolio_value": pt.portfolio_value, "returns": pt.returns}
                    for pt in bt.equity_curve
                ]
            })
    return {"strategies": results}
