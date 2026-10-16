import io
import logging
import csv
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from ..models.schemas import (
    BacktestRequest,
    BacktestResult,
    BacktestStatus
)
from ..engine.data import MarketDataEngine, MarketDataUnavailable
from ..engine.backtester import BacktestEngine
from ..engine.stocks_universe import universe_manager
from ..engine.indices_universe import indices_universe
from ..analytics.performance import calculate_performance_metrics
from ..analytics.risk import calculate_risk_analytics
from .storage import storage

logger = logging.getLogger("quantsynthica.backtests")
UNAVAILABLE_PREFIX = "Market data unavailable"

router = APIRouter(prefix="/backtests", tags=["Backtests"])
data_engine = MarketDataEngine()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def execute_backtest_task(bt_id: str, request: BacktestRequest):
    try:
        target_ticker = request.strategy.asset.strip().upper()
        # Auto-align benchmark for Indian equities
        stock_info = universe_manager.get_stock(target_ticker)
        is_india = (
            target_ticker.endswith(".NS") or
            target_ticker.endswith(".BO") or
            (stock_info and stock_info.get("market") == "India")
        )
        if is_india and request.benchmark in ["SPY", "^GSPC"]:
            request.benchmark = "^NSEI"

        df, df_synthetic = data_engine.fetch_ohlcv(target_ticker, request.start_date, request.end_date)
        bench_ret = data_engine.fetch_benchmark(request.benchmark, request.start_date, request.end_date)
        is_synthetic = bool(df_synthetic or bench_ret.attrs.get("is_synthetic"))

        engine = BacktestEngine(request.strategy)
        sim_out = engine.run(df, bench_ret)

        perf, monthly_table = calculate_performance_metrics(
            sim_out["equity_curve"],
            sim_out["trades"]
        )

        risk = calculate_risk_analytics(sim_out["equity_curve"])

        res = BacktestResult(
            id=bt_id,
            strategy_id=request.strategy.id,
            strategy_name=request.strategy.name,
            ticker=request.strategy.asset,
            benchmark=request.benchmark,
            start_date=request.start_date,
            end_date=request.end_date,
            status=BacktestStatus.COMPLETED,
            metrics=perf,
            risk=risk,
            equity_curve=sim_out["equity_curve"],
            trades=sim_out["trades"],
            monthly_returns=monthly_table,
            logs=sim_out["logs"],
            created_at=_now(),
            is_synthetic=is_synthetic,
        )
        storage.save_backtest(res)
    except Exception as ex:
        logger.exception("Backtest %s failed", bt_id)
        failed_res = BacktestResult(
            id=bt_id,
            strategy_id=request.strategy.id,
            strategy_name=request.strategy.name,
            ticker=request.strategy.asset,
            benchmark=request.benchmark,
            start_date=request.start_date,
            end_date=request.end_date,
            status=BacktestStatus.FAILED,
            error=f"{UNAVAILABLE_PREFIX}: {ex}" if isinstance(ex, MarketDataUnavailable) else str(ex),
            created_at=_now()
        )
        storage.save_backtest(failed_res)

@router.post("", response_model=BacktestResult)
def run_backtest(request: BacktestRequest, background_tasks: BackgroundTasks, async_mode: bool = False):
    bt_id = f"bt_{uuid.uuid4().hex[:8]}"

    if indices_universe.available(request.benchmark) is False:
        idx = indices_universe.by_symbol.get(request.benchmark)
        raise HTTPException(
            status_code=422,
            detail=f"The data provider has no price history for the benchmark {idx['name'] if idx else request.benchmark} "
                   f"({request.benchmark}). Choose another benchmark, e.g. Nifty 50 (^NSEI).",
        )

    if async_mode:
        # Create queued record
        queued_res = BacktestResult(
            id=bt_id,
            strategy_id=request.strategy.id,
            strategy_name=request.strategy.name,
            ticker=request.strategy.asset,
            benchmark=request.benchmark,
            start_date=request.start_date,
            end_date=request.end_date,
            status=BacktestStatus.RUNNING,
            created_at=_now()
        )
        storage.save_backtest(queued_res)
        background_tasks.add_task(execute_backtest_task, bt_id, request)
        return queued_res
    else:
        # Synchronous execution for immediate research UI feedback
        execute_backtest_task(bt_id, request)
        result = storage.get_backtest(bt_id)
        if not result or result.status == BacktestStatus.FAILED:
            err_msg = result.error if result else "Unknown backtest failure"
            # A failed synchronous run is reported to the caller, not kept in the registry.
            storage.delete_backtest(bt_id)
            if err_msg.startswith(UNAVAILABLE_PREFIX):
                raise HTTPException(status_code=503, detail=err_msg)
            raise HTTPException(status_code=400, detail=f"Backtest failed: {err_msg}")
        return result

@router.get("", response_model=List[BacktestResult])
def list_backtests():
    return storage.list_backtests()

@router.get("/{backtest_id}", response_model=BacktestResult)
def get_backtest(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return res

@router.delete("/{backtest_id}")
def delete_backtest(backtest_id: str):
    deleted = storage.delete_backtest(backtest_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {"status": "success", "id": backtest_id}

@router.get("/{backtest_id}/status")
def get_backtest_status(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return {"id": res.id, "status": res.status, "error": res.error}

@router.get("/{backtest_id}/results", response_model=BacktestResult)
def get_backtest_results(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return res

@router.get("/{backtest_id}/export/trades")
def export_trades_csv(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res or not res.trades:
        raise HTTPException(status_code=404, detail="No trades available to export")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Trade ID", "Ticker", "Direction", "Entry Date", "Exit Date",
        "Entry Price", "Exit Price", "Quantity", "Gross PnL", "Fees",
        "Net PnL", "Return %", "Holding Bars", "Exit Reason", "MAE %", "MFE %"
    ])
    for t in res.trades:
        writer.writerow([
            t.id, t.ticker, t.direction, t.entry_date, t.exit_date,
            t.entry_price, t.exit_price, t.quantity, t.gross_pnl, t.fees,
            t.net_pnl, t.return_pct, t.holding_period_bars, t.exit_reason, t.mae, t.mfe
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=trades_{backtest_id}.csv"}
    )

@router.get("/{backtest_id}/export/equity")
def export_equity_csv(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res or not res.equity_curve:
        raise HTTPException(status_code=404, detail="No equity data available to export")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Portfolio Value", "Cash", "Drawdown %", "Benchmark Value", "Daily Return"])
    for pt in res.equity_curve:
        writer.writerow([pt.date, pt.portfolio_value, pt.cash, pt.drawdown, pt.benchmark_value, pt.returns])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=equity_{backtest_id}.csv"}
    )

@router.get("/{backtest_id}/export/monthly")
def export_monthly_csv(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res or not res.monthly_returns:
        raise HTTPException(status_code=404, detail="No monthly returns data available to export")

    output = io.StringIO()
    writer = csv.writer(output)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    writer.writerow(["Year"] + months + ["YTD"])
    for row in res.monthly_returns:
        r_dict = row if isinstance(row, dict) else row.model_dump()
        r_year = r_dict.get("year", "")
        r_ytd = r_dict.get("YTD", "")
        m_vals = [r_dict.get(m, "") for m in months]
        writer.writerow([r_year] + m_vals + [r_ytd])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=monthly_{backtest_id}.csv"}
    )

@router.get("/{backtest_id}/export/report")
def export_research_report(backtest_id: str):
    res = storage.get_backtest(backtest_id)
    if not res or not res.metrics:
        raise HTTPException(status_code=404, detail="Backtest metrics not found")

    m = res.metrics
    r = res.risk

    def f(v, spec=".2f"):
        return format(v, spec) if isinstance(v, (int, float)) else "—"

    def pct(v, spec=".2f"):
        return f"{format(v, spec)}%" if isinstance(v, (int, float)) else "—"

    def loss(v):
        return pct(-abs(v)) if isinstance(v, (int, float)) else "—"

    report = f"""============================================================
ALGO LAB QUANTITATIVE RESEARCH TEARSHEET
============================================================
Strategy Name:       {res.strategy_name}
Target Security:     {res.ticker}
Benchmark:           {res.benchmark}
Backtest Period:     {res.start_date} to {res.end_date}
Generated At:        {res.created_at}
Data Source:         {"SYNTHETIC (not real market data)" if res.is_synthetic else "Market data"}

1. EXECUTIVE PERFORMANCE SUMMARY
------------------------------------------------------------
Total Return:        {pct(m.total_return, "+.2f")}
CAGR:                {pct(m.cagr, "+.2f")}
Annualized Return:   {pct(m.annualized_return, "+.2f")}
Annualized Vol:      {pct(m.annualized_volatility)}
Sharpe Ratio:        {f(m.sharpe_ratio, ".2f")}
Sortino Ratio:       {f(m.sortino_ratio, ".2f")}
Calmar Ratio:        {f(m.calmar_ratio, ".2f")}
Max Drawdown:        {loss(m.max_drawdown)}
Max DD Duration:     {m.max_drawdown_duration} bars

2. BENCHMARK ATTRIBUTION
------------------------------------------------------------
Alpha (Jensen's):    {pct(m.alpha, "+.2f")}
Beta:                {f(m.beta, ".2f")}
Information Ratio:   {f(m.information_ratio, ".2f")}
Tracking Error:      {pct(m.tracking_error)}

3. TRADE EXECUTION & FRICTION
------------------------------------------------------------
Total Trades:        {m.num_trades}
Win Rate:            {pct(m.win_rate, ".1f")} ({m.winning_trades} wins / {m.losing_trades} losses)
Profit Factor:       {f(m.profit_factor, ".2f")}
Expectancy:          {pct(m.expectancy, "+.2f")}
Average Trade:       {pct(m.avg_trade_return, "+.2f")}
Average Holding:     {f(m.avg_holding_period, ".1f")} bars
Gross P&L:           {f(m.gross_pnl, ",.2f")}
Transaction Fees:    {f(m.total_fees, ",.2f")}
Net P&L:             {f(m.net_pnl, ",.2f")}

4. TAIL RISK & REGIMES
------------------------------------------------------------
Historical VaR 95%:  {loss(r.var_95 if r else None)} daily
Historical VaR 99%:  {loss(r.var_99 if r else None)} daily
Expected Shortfall:  {loss(r.cvar_95 if r else None)} (CVaR 95%)
Downside Deviation:  {pct(r.downside_deviation if r else None)}
============================================================
ASSUMPTIONS & METHODOLOGY:
- Chronological execution: signal generated at bar t close, filled at bar t+1.
- Intra-bar high/low triggers applied for stop loss and take profit.
- Incorporates slippage, exchange commission, and bid-ask spread penalty.
============================================================
"""
    return Response(
        content=report,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=report_{backtest_id}.txt"}
    )
