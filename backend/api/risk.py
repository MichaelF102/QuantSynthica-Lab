from fastapi import APIRouter, HTTPException
from .storage import storage

router = APIRouter(prefix="/risk", tags=["Risk Management"])

@router.get("/{backtest_id}")
def get_risk_metrics(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res:
        raise HTTPException(status_code=404, detail="Backtest not found")
    if not res.risk:
        raise HTTPException(status_code=400, detail="Risk metrics not calculated for this backtest")
    return {
        "id": res.id,
        "strategy_name": res.strategy_name,
        "ticker": res.ticker,
        "risk": res.risk
    }
