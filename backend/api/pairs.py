from fastapi import APIRouter, HTTPException
from ..models.schemas import PairsTradingRequest, PairsTradingResult
from ..engine.data import MarketDataEngine
from ..engine.pairs import run_pairs_trading_simulation

router = APIRouter(prefix="/pairs", tags=["Pairs Trading"])
data_engine = MarketDataEngine()

@router.post("", response_model=PairsTradingResult)
def run_pairs_analysis(request: PairsTradingRequest):
    try:
        df_a, _ = data_engine.fetch_ohlcv(request.ticker_a, request.start_date, request.end_date)
        df_b, _ = data_engine.fetch_ohlcv(request.ticker_b, request.start_date, request.end_date)
        res = run_pairs_trading_simulation(request, df_a, df_b)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Pairs analysis failed: {str(e)}")
