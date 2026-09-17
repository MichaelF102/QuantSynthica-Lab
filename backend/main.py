import sys
import logging
from pathlib import Path

# Add both repository root and backend directory to sys.path for cloud deployment compatibility
_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.api import (
        market_router,
        strategies_router,
        backtests_router,
        analytics_router,
        risk_router,
        optimization_router,
        pairs_router,
        settings_router
    )
except ImportError:
    from .api import (
        market_router,
        strategies_router,
        backtests_router,
        analytics_router,
        risk_router,
        optimization_router,
        pairs_router,
        settings_router
    )

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="QuantSynthica Lab Quant Engine API",
    description="Institutional-grade Quantitative Trading Strategy Research Engine",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(market_router)
app.include_router(strategies_router)
app.include_router(backtests_router)
app.include_router(analytics_router)
app.include_router(risk_router)
app.include_router(optimization_router)
app.include_router(pairs_router)
app.include_router(settings_router)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "QuantSynthica Lab Quantitative Engine",
        "version": "1.0.0",
        "engine": "ready",
        "timestamp": "2026-09-16T11:20:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
