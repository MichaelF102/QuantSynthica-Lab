import time
import logging
from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
import yfinance as yf

try:
    from tradingview_screener import Query, col
    TV_AVAILABLE = True
except ImportError:
    TV_AVAILABLE = False

from .stocks_universe import universe_manager

logger = logging.getLogger("quantsynthica.fundamentals")

class FundamentalEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FundamentalEngine, cls).__new__(cls)
            cls._instance.cache = {}
            cls._instance.cache_ttl = 600  # 10 minutes cache
        return cls._instance

    def _format_currency_value(self, val: Optional[float], currency: str = "INR") -> str:
        if val is None or pd.isna(val) or val == 0:
            return "N/A"
        try:
            v = float(val)
            if currency == "INR":
                cr = v / 10000000.0  # 1 Crore = 10 Million
                if abs(cr) >= 100000:
                    return f"₹{cr/100000:.2f} Lakh Cr"
                elif abs(cr) >= 1:
                    return f"₹{cr:.2f} Cr"
                elif abs(v) >= 100000:
                    return f"₹{v/100000:.2f} Lakh"
                return f"₹{v:.2f}"
            else:
                if abs(v) >= 1e12:
                    return f"${v/1e12:.2f}T"
                elif abs(v) >= 1e9:
                    return f"${v/1e9:.2f}B"
                elif abs(v) >= 1e6:
                    return f"${v/1e6:.2f}M"
                return f"${v:.2f}"
        except Exception:
            return "N/A"

    def _safe_float(self, val: Any, default: Optional[float] = None) -> Optional[float]:
        if val is None or pd.isna(val) or val == "":
            return default
        try:
            f = float(val)
            if np.isnan(f) or np.isinf(f):
                return default
            return round(f, 4)
        except (ValueError, TypeError):
            return default

    def get_fundamentals(self, symbol: str, market_hint: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves deep institutional fundamentals for a given stock symbol.
        Integrates TradingView Screener, Yahoo Finance, and QuantSynthica universe metadata.
        """
        sym = symbol.strip().upper()
        now = time.time()

        # Check Cache
        if sym in self.cache:
            entry, timestamp = self.cache[sym]
            if now - timestamp < self.cache_ttl:
                return entry

        clean_sym = sym.replace(".NS", "").replace(".BO", "")
        universe_stock = universe_manager.get_stock(sym) or universe_manager.get_stock(clean_sym) or {}

        # Determine Market
        is_india = False
        if market_hint and market_hint.lower() == "india":
            is_india = True
        elif sym.endswith((".NS", ".BO")):
            is_india = True
        elif universe_stock.get("market") == "India":
            is_india = True
        elif universe_stock.get("currency") == "INR":
            is_india = True

        currency = "INR" if is_india else "USD"
        currency_sym = "₹" if is_india else "$"
        data_sources = ["QuantSynthica Universe"]

        # 1. TradingView Screener Live Data
        tv_data = {}
        if TV_AVAILABLE:
            try:
                tv_market = "india" if is_india else "america"
                q = Query().set_markets(tv_market).select(
                    "name", "description", "sector", "industry", "close", "change", "volume",
                    "market_cap_basic", "price_earnings_ttm", "earnings_per_share_basic_ttm",
                    "operating_margin_ttm", "net_margin_ttm", "gross_margin_ttm",
                    "total_revenue_ttm", "net_income_ttm", "ebitda_ttm",
                    "price_52_week_high", "price_52_week_low", "beta_1_year", "exchange"
                ).where(col("name") == clean_sym)

                cnt, df = q.get_scanner_data()
                if not df.empty:
                    tv_data = df.iloc[0].to_dict()
                    data_sources.append("TradingView Screener")
            except Exception as e:
                logger.warning(f"TradingView Screener lookup failed for {sym}: {e}")

        # 2. Yahoo Finance Supplemental Fundamental Engine
        yf_info = {}
        annual_history = []
        try:
            # Build proper Yahoo Finance ticker
            if is_india:
                exch = tv_data.get("exchange", universe_stock.get("exchange", "BSE")).upper()
                if sym.endswith((".NS", ".BO")):
                    yf_sym = sym
                elif "BSE" in exch:
                    yf_sym = f"{clean_sym}.BO"
                else:
                    yf_sym = f"{clean_sym}.NS"
            else:
                yf_sym = clean_sym

            t = yf.Ticker(yf_sym)
            info = t.info or {}
            if is_india and (not info or len(info) < 5) and yf_sym.endswith(".NS"):
                t = yf.Ticker(f"{clean_sym}.BO")
                info = t.info or {}

            if info and len(info) > 5:
                yf_info = info
                data_sources.append("Yahoo Finance")

            # Extract annual financials history (up to 4 years)
            try:
                fin = t.financials
                if fin is not None and not fin.empty:
                    cols = list(fin.columns)[:4]
                    for col_date in reversed(cols):
                        try:
                            year_str = str(col_date.year) if hasattr(col_date, "year") else str(col_date)[:4]
                            rev = self._safe_float(fin.loc["Total Revenue", col_date]) if "Total Revenue" in fin.index else None
                            gp = self._safe_float(fin.loc["Gross Profit", col_date]) if "Gross Profit" in fin.index else None
                            ni = self._safe_float(fin.loc["Net Income", col_date]) if "Net Income" in fin.index else None
                            ebit = self._safe_float(fin.loc["Operating Income", col_date]) if "Operating Income" in fin.index else None
                            if rev is not None:
                                annual_history.append({
                                    "year": year_str,
                                    "revenue": rev,
                                    "gross_profit": gp,
                                    "operating_income": ebit,
                                    "net_income": ni,
                                })
                        except Exception:
                            continue
            except Exception as e:
                logger.debug(f"Failed to parse annual history for {sym}: {e}")

        except Exception as e:
            logger.warning(f"Yahoo Finance lookup failed for {sym}: {e}")

        # 3. Consolidate Metrics (Priority: TV -> YF -> Local Universe CSV)
        name = tv_data.get("description") or yf_info.get("longName") or universe_stock.get("name") or clean_sym
        sector = tv_data.get("sector") or yf_info.get("sector") or universe_stock.get("sector") or "General"
        industry = tv_data.get("industry") or yf_info.get("industry") or "Diversified"
        exchange = tv_data.get("exchange") or universe_stock.get("exchange") or ("NSE/BSE" if is_india else "NASDAQ/NYSE")

        price = self._safe_float(tv_data.get("close") or yf_info.get("currentPrice") or universe_stock.get("price"))
        change_1d = self._safe_float(tv_data.get("change") or universe_stock.get("change_1d"))
        volume = self._safe_float(tv_data.get("volume") or yf_info.get("volume") or universe_stock.get("volume_1d"))

        market_cap = self._safe_float(tv_data.get("market_cap_basic") or yf_info.get("marketCap") or universe_stock.get("market_cap"))
        pe_ratio = self._safe_float(tv_data.get("price_earnings_ttm") or yf_info.get("trailingPE") or universe_stock.get("pe_ratio"))
        eps_ttm = self._safe_float(tv_data.get("earnings_per_share_basic_ttm") or yf_info.get("trailingEps") or universe_stock.get("eps_ttm"))

        dividend_yield = self._safe_float(
            yf_info.get("dividendYield", 0) * 100 if yf_info.get("dividendYield") else None or
            universe_stock.get("dividend_yield")
        )

        high_52w = self._safe_float(tv_data.get("price_52_week_high") or yf_info.get("fiftyTwoWeekHigh") or (price * 1.35 if price else None))
        low_52w = self._safe_float(tv_data.get("price_52_week_low") or yf_info.get("fiftyTwoWeekLow") or (price * 0.75 if price else None))
        beta = self._safe_float(tv_data.get("beta_1_year") or yf_info.get("beta") or 1.0)

        # Valuation Multiples
        forward_pe = self._safe_float(yf_info.get("forwardPE"))
        price_to_book = self._safe_float(yf_info.get("priceToBook"))
        price_to_sales = self._safe_float(yf_info.get("priceToSalesTrailing12Months"))
        ev_ebitda = self._safe_float(yf_info.get("enterpriseToEbitda"))
        ev_revenue = self._safe_float(yf_info.get("enterpriseToRevenue"))
        peg_ratio = self._safe_float(yf_info.get("pegRatio"))
        enterprise_value = self._safe_float(yf_info.get("enterpriseValue"))

        # Margins & Profitability
        gross_margin = self._safe_float(tv_data.get("gross_margin_ttm") or (yf_info.get("grossMargins", 0) * 100 if yf_info.get("grossMargins") else None))
        operating_margin = self._safe_float(tv_data.get("operating_margin_ttm") or (yf_info.get("operatingMargins", 0) * 100 if yf_info.get("operatingMargins") else None))
        net_margin = self._safe_float(tv_data.get("net_margin_ttm") or (yf_info.get("profitMargins", 0) * 100 if yf_info.get("profitMargins") else None))
        roe = self._safe_float(yf_info.get("returnOnEquity", 0) * 100 if yf_info.get("returnOnEquity") else None)
        roa = self._safe_float(yf_info.get("returnOnAssets", 0) * 100 if yf_info.get("returnOnAssets") else None)

        # Financial Highlights TTM
        revenue_ttm = self._safe_float(tv_data.get("total_revenue_ttm") or yf_info.get("totalRevenue"))
        net_income_ttm = self._safe_float(tv_data.get("net_income_ttm") or yf_info.get("netIncomeToCommon"))
        ebitda_ttm = self._safe_float(tv_data.get("ebitda_ttm") or yf_info.get("ebitda"))
        fcf_ttm = self._safe_float(yf_info.get("freeCashflow"))
        operating_cf = self._safe_float(yf_info.get("operatingCashflow"))

        # Balance Sheet & Solvency
        total_debt = self._safe_float(yf_info.get("totalDebt"))
        total_cash = self._safe_float(yf_info.get("totalCash"))
        debt_to_equity = self._safe_float(yf_info.get("debtToEquity"))
        current_ratio = self._safe_float(yf_info.get("currentRatio"))
        quick_ratio = self._safe_float(yf_info.get("quickRatio"))
        book_value = self._safe_float(yf_info.get("bookValue"))

        # Calculate Piotroski F-Score (0 to 9)
        piotroski = 0
        if net_income_ttm and net_income_ttm > 0:
            piotroski += 1
        if roa and roa > 0:
            piotroski += 1
        if operating_cf and operating_cf > 0:
            piotroski += 1
        if operating_cf and net_income_ttm and operating_cf > net_income_ttm:
            piotroski += 1
        if debt_to_equity and debt_to_equity < 100:
            piotroski += 1
        if current_ratio and current_ratio > 1.2:
            piotroski += 1
        if gross_margin and gross_margin > 20:
            piotroski += 1
        if operating_margin and operating_margin > 10:
            piotroski += 1
        if revenue_ttm and revenue_ttm > 0:
            piotroski += 1

        if piotroski >= 8:
            piotroski_rating = "Exceptional Financial Strength"
        elif piotroski >= 6:
            piotroski_rating = "Strong Institutional Grade"
        elif piotroski >= 4:
            piotroski_rating = "Moderate Solvency"
        else:
            piotroski_rating = "Speculative / Leverage Watch"

        # Calculate Altman Z-Score estimate
        altman_z = None
        altman_rating = "N/A"
        if market_cap and total_debt is not None:
            try:
                wc = (current_ratio - 1) * (total_debt * 0.5) if current_ratio else (total_cash or 0)
                assets_proxy = (market_cap + (total_debt or 0)) * 0.75
                re = (net_income_ttm or 0) * 0.6
                ebit = (ebitda_ttm or 0) * 0.85
                mcap = market_cap
                tl = total_debt or 1

                x1 = wc / assets_proxy if assets_proxy else 0.1
                x2 = re / assets_proxy if assets_proxy else 0.1
                x3 = ebit / assets_proxy if assets_proxy else 0.15
                x4 = mcap / tl if tl else 2.0
                x5 = (revenue_ttm or mcap) / assets_proxy if assets_proxy else 1.0

                z = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 0.999 * x5
                altman_z = round(float(z), 2)
                if altman_z >= 2.99:
                    altman_rating = "Safe Zone (Low Bankruptcy Risk)"
                elif altman_z >= 1.81:
                    altman_rating = "Grey Zone (Average Solvency)"
                else:
                    altman_rating = "Distress Zone (High Credit Risk)"
            except Exception:
                pass

        # 52W Positioning
        pct_from_52w_low = None
        pct_to_52w_high = None
        if price and low_52w and high_52w and high_52w > low_52w:
            pct_from_52w_low = round(((price - low_52w) / low_52w) * 100, 2)
            pct_to_52w_high = round(((price - high_52w) / high_52w) * 100, 2)

        summary = yf_info.get("longBusinessSummary") or universe_stock.get("description") or (
            f"{name} ({sym}) is a publicly traded enterprise operating within the {sector} sector ({industry}). "
            f"Headquartered in {market_hint or 'India'}, the company maintains listed equity securities on {exchange}."
        )

        result = {
            "symbol": sym,
            "clean_symbol": clean_sym,
            "name": name,
            "exchange": exchange,
            "sector": sector,
            "industry": industry,
            "market": "India" if is_india else "US",
            "currency": currency,
            "currency_symbol": currency_sym,
            "isin": universe_stock.get("isin") or yf_info.get("isin") or "N/A",
            "summary": summary,
            "data_sources": data_sources,

            # Price & Market Context
            "price": price,
            "change_1d": change_1d,
            "volume": volume,
            "beta": beta,
            "high_52w": high_52w,
            "low_52w": low_52w,
            "pct_from_52w_low": pct_from_52w_low,
            "pct_to_52w_high": pct_to_52w_high,

            # Valuation
            "market_cap": market_cap,
            "market_cap_formatted": self._format_currency_value(market_cap, currency),
            "enterprise_value": enterprise_value,
            "enterprise_value_formatted": self._format_currency_value(enterprise_value, currency),
            "pe_ratio": pe_ratio,
            "forward_pe": forward_pe,
            "peg_ratio": peg_ratio,
            "price_to_book": price_to_book,
            "price_to_sales": price_to_sales,
            "ev_ebitda": ev_ebitda,
            "ev_revenue": ev_revenue,
            "eps_ttm": eps_ttm,
            "book_value": book_value,

            # Profitability & Margins
            "gross_margin": gross_margin,
            "operating_margin": operating_margin,
            "net_margin": net_margin,
            "roe": roe,
            "roa": roa,

            # Financials TTM
            "revenue_ttm": revenue_ttm,
            "revenue_formatted": self._format_currency_value(revenue_ttm, currency),
            "net_income_ttm": net_income_ttm,
            "net_income_formatted": self._format_currency_value(net_income_ttm, currency),
            "ebitda_ttm": ebitda_ttm,
            "ebitda_formatted": self._format_currency_value(ebitda_ttm, currency),
            "free_cash_flow": fcf_ttm,
            "free_cash_flow_formatted": self._format_currency_value(fcf_ttm, currency),
            "operating_cash_flow": operating_cf,
            "operating_cash_flow_formatted": self._format_currency_value(operating_cf, currency),

            # Balance Sheet
            "total_debt": total_debt,
            "total_debt_formatted": self._format_currency_value(total_debt, currency),
            "total_cash": total_cash,
            "total_cash_formatted": self._format_currency_value(total_cash, currency),
            "debt_to_equity": debt_to_equity,
            "current_ratio": current_ratio,
            "quick_ratio": quick_ratio,

            # Dividend
            "dividend_yield": dividend_yield,
            "payout_ratio": self._safe_float(yf_info.get("payoutRatio", 0) * 100 if yf_info.get("payoutRatio") else None),

            # Quantitative Health Scores
            "piotroski_score": piotroski,
            "piotroski_rating": piotroski_rating,
            "altman_z_score": altman_z,
            "altman_rating": altman_rating,

            # Multi-Year Trend
            "annual_history": annual_history,
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        }

        # Cache result
        self.cache[sym] = (result, now)
        return result

fundamental_engine = FundamentalEngine()
