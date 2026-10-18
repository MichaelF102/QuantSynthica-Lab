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

# Bump whenever a change alters simulation results for the same inputs (fills, sizing, stops, costs, signals).
#  1: original engine   2: direction, ATR stops, trailing-stop fix, vol targeting, fee on real quantity
#  3: one position at a time by default (stacking is opt-in)
ENGINE_VERSION = "3"


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

        # ---- risk configuration -------------------------------------------------
        risk = self.risk
        mode = (risk.direction or "long").lower()
        if mode == "long" and risk.allow_short:
            mode = "both"  # strategies saved before `direction` existed
        if mode not in ("long", "short", "both"):
            mode = "long"

        # Wilder ATR and 20-bar realised volatility, both read at the signal bar (i-1): no look-ahead.
        prev_close = df_sig["close"].shift(1)
        true_range = pd.concat([
            df_sig["high"] - df_sig["low"],
            (df_sig["high"] - prev_close).abs(),
            (df_sig["low"] - prev_close).abs(),
        ], axis=1).max(axis=1)
        atr_arr = true_range.ewm(alpha=1.0 / max(1, int(risk.atr_period)), adjust=False, min_periods=int(risk.atr_period)).mean().values
        realised_vol = (df_sig["close"].pct_change().rolling(20).std() * np.sqrt(252)).values

        def sig_atr(i: int) -> Optional[float]:
            v = atr_arr[i - 1] if i > 0 else np.nan
            return float(v) if np.isfinite(v) and v > 0 else None

        def size_fraction(i: int) -> float:
            """Share of equity to deploy: position_size_pct, scaled down when realised vol exceeds the target."""
            frac = risk.position_size_pct / 100.0
            if risk.target_volatility:
                rv = realised_vol[i - 1] if i > 0 else np.nan
                if not (np.isfinite(rv) and rv > 0):
                    return 0.0  # no volatility estimate yet (first 20 bars): do not size blindly
                frac *= min(1.0, (risk.target_volatility / 100.0) / rv)
            return frac

        def mark(pos: Dict[str, Any], px: float) -> float:
            """Open-position value contribution to equity (shorts: collateral-free, P&L only)."""
            if pos["direction"] == "LONG":
                return pos["qty"] * px
            return pos["qty"] * (pos["entry_price"] - px)

        for i in range(n):
            dt = str(dates[i].strftime("%Y-%m-%d"))
            bar_open = float(opens[i])
            bar_high = float(highs[i])
            bar_low = float(lows[i])
            bar_close = float(closes[i])
            bar_vol = float(volumes[i])

            # Pending signals from bar i-1 are executed at bar i open
            sig_entry_prev = bool(entry_signals[i - 1]) if i > 0 else False
            sig_exit_prev = bool(exit_signals[i - 1]) if i > 0 else False

            # -------------------------------------------------------------
            # STEP A: close positions (signal, stop, target, trailing stop)
            # -------------------------------------------------------------
            surviving_positions = []
            for pos in open_positions:
                closed = False
                exit_price = 0.0
                exit_reason = ""
                is_long = pos["direction"] == "LONG"

                if bar_high > pos["highest_price"]:
                    pos["highest_price"] = bar_high
                if bar_low < pos["lowest_price"]:
                    pos["lowest_price"] = bar_low

                # The signal that closes this side: "both" mode closes longs on exit signals and shorts on entry signals.
                close_signal = sig_exit_prev if (mode != "both" or is_long) else sig_entry_prev

                # Effective stop = tighter of the fixed stop and the trailing stop (trail reference excludes this bar)
                stop_level = pos["stop_price"]
                stop_reason = "STOP_LOSS"
                if pos["trail_stop_pct"]:
                    trail_level = pos["trail_ref"] * (1.0 - pos["trail_stop_pct"] / 100.0) if is_long else pos["trail_ref"] * (1.0 + pos["trail_stop_pct"] / 100.0)
                    if stop_level is None or (is_long and trail_level > stop_level) or (not is_long and trail_level < stop_level):
                        stop_level, stop_reason = trail_level, "TRAILING_STOP"

                if close_signal:
                    exit_price, exit_reason, closed = bar_open, "SIGNAL", True
                elif is_long:
                    if stop_level is not None and bar_low <= stop_level:
                        exit_price, exit_reason, closed = min(bar_open, stop_level), stop_reason, True  # gap-down fills at the open
                    elif pos["tp_price"] is not None and bar_high >= pos["tp_price"]:
                        exit_price, exit_reason, closed = max(bar_open, pos["tp_price"]), "TAKE_PROFIT", True
                else:
                    if stop_level is not None and bar_high >= stop_level:
                        exit_price, exit_reason, closed = max(bar_open, stop_level), stop_reason, True  # gap-up fills at the open
                    elif pos["tp_price"] is not None and bar_low <= pos["tp_price"]:
                        exit_price, exit_reason, closed = min(bar_open, pos["tp_price"]), "TAKE_PROFIT", True

                if not closed and i == n - 1:
                    exit_price, exit_reason, closed = bar_close, "END_OF_DATA", True

                if closed:
                    fill_p, exit_fees = self.cost_model.apply_execution_costs(
                        exit_price, pos["qty"], is_buy=(not is_long), volume=bar_vol
                    )
                    total_fees = pos["entry_fees"] + exit_fees

                    if is_long:
                        gross_pnl = (fill_p - pos["entry_price"]) * pos["qty"]
                        cash += (fill_p * pos["qty"]) - exit_fees
                    else:
                        gross_pnl = (pos["entry_price"] - fill_p) * pos["qty"]
                        cash += gross_pnl - exit_fees

                    rounded_gross = round(gross_pnl, 2)
                    rounded_fees = round(total_fees, 2)
                    rounded_net = round(rounded_gross - rounded_fees, 2)
                    notional_invested = pos["entry_price"] * pos["qty"]
                    ret_pct = (rounded_net / notional_invested * 100.0) if notional_invested > 0 else 0.0

                    if is_long:
                        mae = ((pos["lowest_price"] - pos["entry_price"]) / pos["entry_price"]) * 100.0
                        mfe = ((pos["highest_price"] - pos["entry_price"]) / pos["entry_price"]) * 100.0
                    else:
                        mae = ((pos["entry_price"] - pos["highest_price"]) / pos["entry_price"]) * 100.0
                        mfe = ((pos["entry_price"] - pos["lowest_price"]) / pos["entry_price"]) * 100.0

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
                        holding_period_bars=max(1, i - pos["entry_idx"]),
                        exit_reason=exit_reason,
                        mae=round(mae, 2),
                        mfe=round(mfe, 2)
                    ))
                else:
                    # trail reference moves with the best price seen so far, used from the next bar on
                    pos["trail_ref"] = max(pos["trail_ref"], bar_high) if is_long else min(pos["trail_ref"], bar_low)
                    surviving_positions.append(pos)

            open_positions = surviving_positions

            # -------------------------------------------------------------
            # STEP B: open new positions from the previous bar's signal
            # -------------------------------------------------------------
            open_side = None
            if mode == "long" and sig_entry_prev:
                open_side = "LONG"
            elif mode == "short" and sig_entry_prev:
                open_side = "SHORT"
            elif mode == "both":
                open_side = "LONG" if sig_entry_prev else ("SHORT" if sig_exit_prev else None)

            needs_atr = bool(risk.stop_atr_mult or risk.take_profit_atr_mult)
            if open_side and needs_atr and sig_atr(i) is None:
                open_side = None  # ATR stop requested but ATR is not defined yet: skip rather than trade unprotected

            slots = risk.max_positions if risk.allow_stacking else 1
            if open_side and len(open_positions) < slots and i < n - 1:
                is_long = open_side == "LONG"
                equity_est = cash + sum(mark(p, bar_open) for p in open_positions)
                alloc = min(size_fraction(i) * equity_est, cash * 0.98)  # leave 2% for costs; shorts need the same cash as collateral

                if alloc >= 100.0:
                    fill_p, est_fees = self.cost_model.apply_execution_costs(bar_open, alloc / bar_open, is_buy=is_long, volume=bar_vol)
                    qty = (alloc - est_fees) / fill_p
                    if not self.execution.allow_fractional:
                        qty = float(int(qty))

                    if qty > 0:
                        fill_p, entry_fees = self.cost_model.apply_execution_costs(bar_open, qty, is_buy=is_long, volume=bar_vol)
                        total_cost = (fill_p * qty + entry_fees) if is_long else entry_fees
                        if cash >= total_cost:
                            cash -= total_cost

                            atr = sig_atr(i)
                            sign = 1.0 if is_long else -1.0
                            stop_price = None
                            if risk.stop_atr_mult and atr:
                                stop_price = fill_p - sign * risk.stop_atr_mult * atr
                            elif risk.stop_loss_pct is not None:
                                stop_price = fill_p * (1.0 - sign * risk.stop_loss_pct / 100.0)
                            tp_price = None
                            if risk.take_profit_atr_mult and atr:
                                tp_price = fill_p + sign * risk.take_profit_atr_mult * atr
                            elif risk.take_profit_pct is not None:
                                tp_price = fill_p * (1.0 + sign * risk.take_profit_pct / 100.0)

                            open_positions.append({
                                "id": str(uuid.uuid4())[:8],
                                "direction": open_side,
                                "qty": qty,
                                "entry_price": fill_p,
                                "entry_date": dt,
                                "entry_idx": i,
                                "entry_fees": entry_fees,
                                "stop_price": stop_price,
                                "tp_price": tp_price,
                                "trail_stop_pct": risk.trailing_stop_pct,
                                "trail_ref": bar_high if is_long else bar_low,
                                "highest_price": bar_high,
                                "lowest_price": bar_low
                            })

            # -------------------------------------------------------------
            # STEP C: end-of-day portfolio value and drawdown
            # -------------------------------------------------------------
            portfolio_value = cash + sum(mark(p, bar_close) for p in open_positions)
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
