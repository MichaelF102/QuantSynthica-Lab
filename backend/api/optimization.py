from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    OptimizationRequest,
    OptimizationResult,
    WalkForwardRequest,
    WalkForwardResult
)
from ..engine.data import MarketDataEngine
from ..engine.optimization import run_parameter_optimization
from ..engine.walk_forward import run_walk_forward_validation

router = APIRouter(tags=["Optimization & Validation"])
data_engine = MarketDataEngine()

@router.post("/optimization", response_model=OptimizationResult)
def optimize_strategy(request: OptimizationRequest):
    try:
        df, _ = data_engine.fetch_ohlcv(request.strategy.asset, request.start_date, request.end_date)
        bench_ret = data_engine.fetch_benchmark(request.benchmark, request.start_date, request.end_date)
        res = run_parameter_optimization(request, df, bench_ret)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Optimization failed: {str(e)}")

@router.post("/walk-forward", response_model=WalkForwardResult)
def walk_forward_strategy(request: WalkForwardRequest):
    try:
        df, _ = data_engine.fetch_ohlcv(request.strategy.asset, request.start_date, request.end_date)
        bench_ret = data_engine.fetch_benchmark(request.benchmark, request.start_date, request.end_date)
        res = run_walk_forward_validation(request, df, bench_ret)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Walk-forward validation failed: {str(e)}")
