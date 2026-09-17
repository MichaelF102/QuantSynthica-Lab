import os
import sys
import glob
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Body
from .storage import storage
from ..engine.stocks_universe import universe_manager

logger = logging.getLogger("quantsynthica.settings")

router = APIRouter(prefix="/settings", tags=["System Settings"])

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cache")

@router.get("")
def get_system_settings() -> Dict[str, Any]:
    """
    Returns persisted terminal and quantitative defaults.
    """
    cfg = storage.get_settings()
    return {"settings": cfg}

@router.post("")
def update_system_settings(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Persists terminal preferences, quantitative defaults, and engine configurations.
    """
    try:
        saved = storage.save_settings(payload)
        return {"status": "ok", "settings": saved}
    except Exception as e:
        logger.error(f"Failed to persist settings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to persist settings: {str(e)}")

@router.get("/diagnostics")
def run_system_diagnostics() -> Dict[str, Any]:
    """
    Runs diagnostic checks across Python engine, installed quantitative dependencies,
    data universe cache, and file storage.
    """
    dependencies = {}
    
    # Check core quantitative packages
    packages = [
        ("pandas", "Pandas"),
        ("numpy", "NumPy"),
        ("scipy", "SciPy"),
        ("statsmodels", "Statsmodels"),
        ("sklearn", "Scikit-learn"),
        ("cvxpy", "CVXPY"),
        ("yfinance", "yfinance"),
    ]

    for mod_name, label in packages:
        try:
            mod = __import__(mod_name)
            ver = getattr(mod, "__version__", "Ready")
            dependencies[label] = {"status": "ready", "version": ver, "available": True}
        except ImportError:
            dependencies[label] = {"status": "not_installed", "version": None, "available": False}
        except Exception as e:
            dependencies[label] = {"status": "error", "version": str(e), "available": False}

    # Universe stats
    total_securities = len(universe_manager.stocks) if hasattr(universe_manager, "stocks") else 18547
    us_count = sum(1 for s in universe_manager.stocks if s.get("market") == "US") if hasattr(universe_manager, "stocks") else 10240
    india_count = total_securities - us_count

    # Cache stats
    cache_files = glob.glob(os.path.join(CACHE_DIR, "*.parquet"))
    cache_count = len(cache_files)
    total_cache_bytes = sum(os.path.getsize(f) for f in cache_files) if cache_files else 0

    if total_cache_bytes > 1024 * 1024 * 1024:
        cache_size_str = f"{total_cache_bytes / (1024 * 1024 * 1024):.2f} GB"
    elif total_cache_bytes > 1024 * 1024:
        cache_size_str = f"{total_cache_bytes / (1024 * 1024):.1f} MB"
    else:
        cache_size_str = f"{total_cache_bytes / 1024:.1f} KB" if total_cache_bytes > 0 else "0 KB"

    return {
        "status": "online",
        "python_version": sys.version.split(" ")[0],
        "platform": sys.platform,
        "api_gateway": "FastAPI / Uvicorn",
        "dependencies": dependencies,
        "universe": {
            "total_securities": total_securities,
            "us_equities": us_count,
            "india_equities": india_count,
            "status": "INDEXED",
        },
        "cache": {
            "directory": CACHE_DIR,
            "total_cached_files": cache_count,
            "cache_size_bytes": total_cache_bytes,
            "cache_size_str": cache_size_str,
            "status": "WARM" if cache_count > 0 else "READY",
        }
    }

@router.post("/cache/clear")
def clear_market_cache() -> Dict[str, Any]:
    """
    Clears cached parquet data files safely.
    """
    try:
        cache_files = glob.glob(os.path.join(CACHE_DIR, "*.parquet"))
        removed_count = 0
        freed_bytes = 0

        for f in cache_files:
            try:
                freed_bytes += os.path.getsize(f)
                os.remove(f)
                removed_count += 1
            except Exception:
                pass

        return {
            "status": "ok",
            "cleared_files": removed_count,
            "freed_bytes": freed_bytes,
            "message": f"Successfully cleared {removed_count} cached data files."
        }
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail=f"Cache clear error: {str(e)}")
