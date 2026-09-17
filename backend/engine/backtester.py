import uuid
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from ..models.schemas import (
    StrategyConfig,
    TradeRecord,
    EquityPoint,
    BacktestResult,
    BacktestStatus
)
from .signals import compute_indicators, generate_signals
from .costs import TransactionCostModel

class BacktestEngine:
    def __init__(self, strategy: StrategyConfig):
        self.strategy = strategy
        self.risk = strategy.risk
        self.execution = strategy.execution
        self.cost_model = TransactionCostModel(self.execution)

    def run(self, df_ohlcv: pd.DataFrame, df_benchmark: Optional[pd.Series] = None) -> Dict[str, Any]:
        """
        Executes an event-driven backtest simulation across the given OHLCV dataset.
        Zero look-ahead bias:
        Signals evaluated on bar t are executed at bar t+1 open (or bar t+1 execution price).
        Intra-bar stop-loss / take-profit evaluated on bar t high/low.
        """
        if df_ohlcv.empty or len(df_ohlcv) < 5:
            raise ValueError("Insufficient historical data for backtesting")

        # 1. Compute indicators and generate entry/exit signals
        df_ind = compute_indicators(df_ohlcv, self.strategy.indicators)
        df_sig = generate_signals(df_ind, self.strategy.entry_rules, self.strategy.exit_rules)

        initial_capital = float(self.execution.initial_capital)
        cash = initial_capital
        portfolio_value = initial_capital
        peak_value = initial_capital

        trades: List[TradeRecord] = []
        equity_curve: List[EquityPoint] = []
        logs: List[str] = []

        # Position tracking
        # Each position: dict(id, direction, qty, entry_price, entry_date, entry_idx, stop_price, tp_price, trail_stop_pct, highest_price, lowest_price, total_fees)
        open_positions: List[Dict[str, Any]] = []

        # Prepare benchmark aligned
        if df_benchmark is not None and not df_benchmark.empty:
            bench_ret = df_benchmark.reindex(df_sig.index).fillna(0.0)
        else:
            bench_ret = df_sig["close"].pct_change().fillna(0.0)

        cum_bench = (1.0 + bench_ret).cumprod()
        bench_start = cum_bench.iloc[0] if len(cum_bench) > 0 and cum_bench.iloc[0] != 0 else 1.0
        bench_normalized = (cum_bench / bench_start) * initial_capital

        n = len(df_sig)
        dates = df_sig.index
        opens = df_sig["open"].values
        highs = df_sig["high"].values
        lows = df_sig["low"].values
        closes = df_sig["close"].values
        volumes = df_sig["volume"].values
        entry_signals = df_sig["signal_entry"].values
        exit_signals = df_sig["signal_exit"].values

        prev_portfolio_value = initial_capital

        for i in range(n):
            dt = str(dates[i].strftime("%Y-%m-%d"))
            bar_open = float(opens[i])
            bar_high = float(highs[i])
            bar_low = float(lows[i])
            bar_close = float(closes[i])
            bar_vol = float(volumes[i])

            # Pending signal from bar i-1 executed at bar i open
            sig_entry_prev = entry_signals[i - 1] if i > 0 else False
            sig_exit_prev = exit_signals[i - 1] if i > 0 else False

            # -------------------------------------------------------------
            # STEP A: Check Intra-Bar Risk Limits & Exit Signals on Open Positions
            # -------------------------------------------------------------
            surviving_positions = []
            for pos in open_positions:
                closed = False
                exit_price = 0.0
                exit_reason = ""

                # Update MFE / MAE tracking
                if pos["direction"] == "LONG":
                    if bar_high > pos["highest_price"]:
                        pos["highest_price"] = bar_high
                    if bar_low < pos["lowest_price"]:
                        pos["lowest_price"] = bar_low

                    # 1. Check Exit Signal (triggered at previous bar close, executed at open)
                    if sig_exit_prev:
                        exit_price = bar_open
                        exit_reason = "SIGNAL"
                        closed = True
                    # 2. Check Stop Loss
                    elif pos["stop_price"] is not None and bar_low <= pos["stop_price"]:
                        # Fill at gap-down open or stop price
                        exit_price = min(bar_open, pos["stop_price"])
                        exit_reason = "STOP_LOSS"
                        closed = True
                    # 3. Check Take Profit
                    elif pos["tp_price"] is not None and bar_high >= pos["tp_price"]:
                        exit_price = max(bar_open, pos["tp_price"])
                        exit_reason = "TAKE_PROFIT"
                        closed = True
                    # 4. Check Trailing Stop
                    elif pos["trail_stop_pct"] is not None:
                        new_stop = pos["highest_price"] * (1.0 - pos["trail_stop_pct"] / 100.0)
                        if new_stop > pos["stop_price"]:
                            pos["stop_price"] = new_stop
                        if bar_low <= pos["stop_price"]:
                            exit_price = min(bar_open, pos["stop_price"])
                            exit_reason = "TRAILING_STOP"
                            closed = True

                elif pos["direction"] == "SHORT":
                    if bar_low < pos["lowest_price"]:
                        pos["lowest_price"] = bar_low
                    if bar_high > pos["highest_price"]:
                        pos["highest_price"] = bar_high

                    if sig_exit_prev:
                        exit_price = bar_open
                        exit_reason = "SIGNAL"
                        closed = True
                    elif pos["stop_price"] is not None and bar_high >= pos["stop_price"]:
                        exit_price = max(bar_open, pos["stop_price"])
                        exit_reason = "STOP_LOSS"
                        closed = True
                    elif pos["tp_price"] is not None and bar_low <= pos["tp_price"]:
                        exit_price = min(bar_open, pos["tp_price"])
                        exit_reason = "TAKE_PROFIT"
                        closed = True

                # End of backtest bar close
                if not closed and i == n - 1:
                    exit_price = bar_close
                    exit_reason = "END_OF_DATA"
                    closed = True

                if closed:
                    is_buy_exit = (pos["direction"] == "SHORT")
                    fill_p, exit_fees = self.cost_model.apply_execution_costs(
                        exit_price, pos["qty"], is_buy=is_buy_exit, volume=bar_vol
                    )
                    total_fees = pos["entry_fees"] + exit_fees

                    if pos["direction"] == "LONG":
                        gross_pnl = (fill_p - pos["entry_price"]) * pos["qty"]
                        cash += (fill_p * pos["qty"]) - exit_fees
                    else: # SHORT
                        gross_pnl = (pos["entry_price"] - fill_p) * pos["qty"]
                        cash += gross_pnl - exit_fees

                    rounded_gross = round(gross_pnl, 2)
                    rounded_fees = round(total_fees, 2)
                    rounded_net = round(rounded_gross - rounded_fees, 2)
                    notional_invested = pos["entry_price"] * pos["qty"]
                    ret_pct = (rounded_net / notional_invested * 100.0) if notional_invested > 0 else 0.0

                    # Calculate MAE and MFE in %
                    if pos["direction"] == "LONG":
                        mae = ((pos["lowest_price"] - pos["entry_price"]) / pos["entry_price"]) * 100.0
                        mfe = ((pos["highest_price"] - pos["entry_price"]) / pos["entry_price"]) * 100.0
                    else:
                        mae = ((pos["entry_price"] - pos["highest_price"]) / pos["entry_price"]) * 100.0
                        mfe = ((pos["entry_price"] - pos["lowest_price"]) / pos["entry_price"]) * 100.0

                    holding_bars = i - pos["entry_idx"]

                    trades.append(TradeRecord(
                        id=pos["id"],
                        ticker=self.strategy.asset,
                        direction=pos["direction"],
                        entry_date=pos["entry_date"],
                        exit_date=dt,
                        entry_price=round(pos["entry_price"], 2),
                        exit_price=round(fill_p, 2),
                        quantity=round(pos["qty"], 4) if self.execution.allow_fractional else int(pos["qty"]),
                        gross_pnl=rounded_gross,
                        fees=rounded_fees,
                        net_pnl=rounded_net,
                        return_pct=round(ret_pct, 2),
                        holding_period_bars=max(1, holding_bars),
                        exit_reason=exit_reason,
                        mae=round(mae, 2),
                        mfe=round(mfe, 2)
                    ))
                else:
                    surviving_positions.append(pos)

            open_positions = surviving_positions

            # -------------------------------------------------------------
            # STEP B: Check New Position Entries from Previous Signal
            # -------------------------------------------------------------
            can_open = len(open_positions) < self.risk.max_positions
            if sig_entry_prev and can_open and i < n - 1:
                direction = "LONG"
                # Size calculation: position_size_pct of current total equity
                equity_est = cash + sum(
                    (p["qty"] * bar_open if p["direction"] == "LONG" else (p["qty"] * (2 * p["entry_price"] - bar_open)))
                    for p in open_positions
                )
                target_alloc = (self.risk.position_size_pct / 100.0) * equity_est
                alloc = min(target_alloc, cash * 0.98) # Leave 2% buffer for slippage & commission

                if alloc >= 100.0:
                    fill_p, entry_fees = self.cost_model.apply_execution_costs(
                        bar_open, 1.0, is_buy=True, volume=bar_vol
                    )
                    qty = (alloc - entry_fees) / fill_p
                    if not self.execution.allow_fractional:
                        qty = float(int(qty))

                    if qty > 0:
                        total_cost = (fill_p * qty) + entry_fees
                        if cash >= total_cost:
                            cash -= total_cost

                            # Compute stop-loss and take-profit prices
                            stop_price = None
                            if self.risk.stop_loss_pct is not None:
                                stop_price = fill_p * (1.0 - self.risk.stop_loss_pct / 100.0)

                            tp_price = None
                            if self.risk.take_profit_pct is not None:
                                tp_price = fill_p * (1.0 + self.risk.take_profit_pct / 100.0)

                            open_positions.append({
                                "id": str(uuid.uuid4())[:8],
                                "direction": direction,
                                "qty": qty,
                                "entry_price": fill_p,
                                "entry_date": dt,
                                "entry_idx": i,
                                "entry_fees": entry_fees,
                                "stop_price": stop_price,
                                "tp_price": tp_price,
                                "trail_stop_pct": self.risk.trailing_stop_pct,
                                "highest_price": bar_high,
                                "lowest_price": bar_low
                            })

            # -------------------------------------------------------------
            # STEP C: Calculate End-of-Day Portfolio Value & Drawdown
            # -------------------------------------------------------------
            open_equity = 0.0
            for pos in open_positions:
                if pos["direction"] == "LONG":
                    open_equity += pos["qty"] * bar_close
                else:
                    open_equity += pos["qty"] * (2 * pos["entry_price"] - bar_close)

            portfolio_value = cash + open_equity
            if portfolio_value > peak_value:
                peak_value = portfolio_value

            drawdown = ((portfolio_value - peak_value) / peak_value) if peak_value > 0 else 0.0
            daily_ret = ((portfolio_value - prev_portfolio_value) / prev_portfolio_value) if prev_portfolio_value > 0 else 0.0
            prev_portfolio_value = portfolio_value

            bench_val = float(bench_normalized.iloc[i]) if i < len(bench_normalized) else initial_capital
            bench_ret_val = float(bench_ret.iloc[i]) if i < len(bench_ret) else 0.0

            equity_curve.append(EquityPoint(
                date=dt,
                portfolio_value=round(portfolio_value, 2),
                cash=round(cash, 2),
                drawdown=round(drawdown * 100.0, 2),
                benchmark_value=round(bench_val, 2),
                returns=round(daily_ret, 6),
                benchmark_returns=round(bench_ret_val, 6)
            ))

        return {
            "trades": trades,
            "equity_curve": equity_curve,
            "logs": logs,
            "df_indicators": df_sig
        }
