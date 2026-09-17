from typing import Tuple
from ..models.schemas import ExecutionConfig

class TransactionCostModel:
    def __init__(self, config: ExecutionConfig):
        self.config = config
        # Convert percent from UI (e.g. 0.05%) to fraction (0.0005)
        self.commission_frac = config.commission_pct / 100.0
        self.slippage_frac = config.slippage_pct / 100.0
        self.spread_frac = config.spread_pct / 100.0

    def apply_execution_costs(
        self,
        nominal_price: float,
        quantity: float,
        is_buy: bool,
        volume: float = 1_000_000.0
    ) -> Tuple[float, float]:
        """
        Calculates the effective execution fill price (incorporating slippage & half-spread)
        and the fee/commission charged.
        Returns: (fill_price, total_fees)
        """
        # Market impact scaling based on traded volume fraction (sqrt law)
        volume_impact = 0.0
        if volume > 0 and (quantity * nominal_price) > 0:
            trade_pct = min((quantity * nominal_price) / (volume * nominal_price), 0.10)
            volume_impact = 0.1 * (trade_pct ** 0.5)

        total_penalty = self.slippage_frac + 0.5 * self.spread_frac + volume_impact

        if is_buy:
            fill_price = nominal_price * (1.0 + total_penalty)
        else:
            fill_price = nominal_price * (1.0 - total_penalty)

        notional = fill_price * quantity
        fees = notional * self.commission_frac

        return fill_price, fees
