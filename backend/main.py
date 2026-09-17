import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
