import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException
from ..models.schemas import StrategyConfig
from .storage import storage

router = APIRouter(prefix="/strategies", tags=["Strategies"])

@router.get("", response_model=List[StrategyConfig])
def list_strategies():
    return storage.list_strategies()

@router.get("/{strategy_id}", response_model=StrategyConfig)
def get_strategy(strategy_id: str):
    strat = storage.get_strategy(strategy_id)
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strat

@router.post("", response_model=StrategyConfig)
def create_strategy(strategy: StrategyConfig):
    if not strategy.id:
        strategy.id = f"strat_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    strategy.created_at = now
    strategy.updated_at = now
    return storage.save_strategy(strategy)

@router.put("/{strategy_id}", response_model=StrategyConfig)
def update_strategy(strategy_id: str, strategy: StrategyConfig):
    existing = storage.get_strategy(strategy_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Strategy not found")
    strategy.id = strategy_id
    strategy.created_at = existing.created_at
    strategy.updated_at = datetime.utcnow().isoformat()
    return storage.save_strategy(strategy)

@router.delete("/{strategy_id}")
def delete_strategy(strategy_id: str):
    success = storage.delete_strategy(strategy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return {"status": "deleted", "id": strategy_id}
