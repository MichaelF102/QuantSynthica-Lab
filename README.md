# AlgoLab — Algorithmic Trading Strategy Research Platform

![Terminal Status](https://img.shields.io/badge/Status-Production%20Ready-00F0FF?style=flat-square)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20App%20Router-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-009688?style=flat-square&logo=fastapi)
![Quant](https://img.shields.io/badge/Engine-Zero--Lookahead%20Event--Driven-00E676?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen?style=flat-square)

**AlgoLab** is an institutional-grade quantitative research and systematic trading strategy platform designed for quantitative researchers, financial engineers, and algorithmic traders. It bridges the gap between raw statistical research and realistic trade execution, providing an end-to-end environment to construct, backtest, stress-test, optimize, and validate quantitative systems.

---

## 🏛️ System Philosophy

```
DATA ➔ RESEARCH ➔ STRATEGY ➔ BACKTEST ➔ RISK ➔ OPTIMIZATION ➔ VALIDATION
```

Most commercial dashboards suffer from look-ahead bias, simplistic trade assumptions, or lack of out-of-sample rigor. AlgoLab adheres strictly to institutional standards:
1. **Zero Look-Ahead Bias**: Signals generated at bar $t$ close are executed strictly at bar $t+1$ open.
2. **Realistic Execution Friction**: Transaction cost models incorporating exchange commissions, linear slippage penalties, half-spread costs, and trade-size market impact.
3. **Statistical Walk-Forward Validation**: Multi-window rolling train/test validation to prevent data-snooping and overfitted parameters.
4. **Tail Risk & Regime Profiling**: Historical & Parametric Value at Risk (VaR 95%, 99%), Expected Shortfall (CVaR), Maximum Adverse Excursion (MAE), and Macro Regime attribution.

---

## ⚡ Tech Stack

### Frontend (Quantitative Research Terminal)
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS (Bespoke Bloomberg/FinTech Dark Terminal Theme)
- **Icons**: Lucide Icons
- **Visualizations**: Recharts with customized dark financial palettes and crosshair overlays
- **Design Language**: Dense quantitative layout, monospace data tables (`SF Mono`, `Consolas`), restrained green/red market indicators, electric cyan accents.

### Backend (Quantitative Engine)
- **Framework**: Python 3.12 / FastAPI
- **Math & Computing**: NumPy 2.5, Pandas 3.0, SciPy 1.18, statsmodels 0.15, scikit-learn 1.9
- **Market Data**: `yfinance` with resilient disk caching (`.parquet`) and a fallback high-fidelity geometric Brownian motion generator.
- **Testing**: `pytest` test suite verifying quant correctness, mathematical bounds, and execution timing.

---

## 🖥️ Application Architecture & Navigation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ALGOLAB COMMAND CENTER                           │
│  [Research Markets]    [Build Strategy]    [Run Backtest]    [Pairs Lab]   │
├─────────────────┬─────────────────┬───────────────────┬─────────────────────┤
│   Research      │   Strategies    │     Backtests     │     Analytics       │
│  - OHLCV Bars   │  - 12 Templates │  - Equity Curves  │  - Multi-Strategy   │
│  - 18 Indicators│  - Visual Rules │  - Drawdown (DD)  │  - Cross Comparison │
│  - Rolling Vol  │  - Risk Limits  │  - Monthly Matrix │  - Regime Breakdown │
│  - Beta/Corr    │  - Sizing & Fee │  - Trade Log MAE  │  - Attribution      │
├─────────────────┴─────────────────┴───────────────────┴─────────────────────┤
│   Risk & Regimes                  Optimization & WFO   │   Pairs Trading     │
│  - VaR 95% / 99%                  - 2D Heatmap Grid    │  - OLS Hedge Ratio  │
│  - Expected Shortfall (CVaR)      - Overfitting Alerts │  - ADF Coint Test   │
│  - Return Histogram + Fit         - Walk-Forward Folds │  - Z-Score Bands    │
│  - Portfolio Construction         - Stitched OOS Curve │  - Mean Reversion   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+ or v22+
- **Python**: 3.11+ or 3.12+

### 2. Backend Setup
```bash
# In project root:
python3 -m venv .venv
source .venv/bin/activate

# Install Python requirements:
pip install -r backend/requirements.txt

# Start FastAPI quant engine:
uvicorn backend.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
# In project root:
npm install

# Start Next.js development terminal:
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Verification & Testing

To run the full suite of quantitative correctness and API integration tests:

```bash
PYTHONPATH=. .venv/bin/pytest -v backend/tests/
```

### Critical Tests Covered:
- `test_zero_lookahead_indicator_computation`: Confirms modifying future price bars never alters historical indicator values at bar $t$.
- `test_zero_lookahead_execution_timing`: Confirms orders triggered by bar $t$ close signals are strictly filled at bar $t+1$ or later.
- `test_indicators_basic`: Validates mathematical boundaries of SMA, EMA, RSI (0..100), Bollinger Bands ($Upper \ge Lower$), ATR ($>0$).
- `test_backtester_execution_and_costs`: Validates order execution, fee deductions ($Net = Gross - Fees$), and stop triggers.
- `test_performance_and_risk_metrics_formulas`: Verifies Sharpe, Sortino, Calmar, Win Rate, Profit Factor, VaR, and CVaR calculations.
- `test_api_health`, `test_api_market_data`, `test_api_strategies_crud`, `test_api_backtest_run`, `test_api_pairs_trading`: Validates full REST endpoints.

---

## 🐳 Docker Deployment

To build and run the complete multi-container setup with Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 📈 Quantitative Methodology

### 1. Signal Engine & Execution
- **Indicators at bar $t$**: Evaluated strictly on OHLCV data available up to $t$.
- **Signal generated at bar $t$**: Stored as `signal_entry` or `signal_exit`.
- **Fill Price at bar $t+1$**: Fills at bar $t+1$ Open (or bar $t+1$ execution price adjusted for slippage and spread):
  $$\text{FillPrice}_{\text{Buy}} = P_{\text{open}} \times \left(1 + \text{Slippage} + \frac{\text{Spread}}{2} + \text{Impact}\right)$$
  $$\text{FillPrice}_{\text{Sell}} = P_{\text{open}} \times \left(1 - \text{Slippage} - \frac{\text{Spread}}{2} - \text{Impact}\right)$$

### 2. Tail Risk (VaR & Expected Shortfall)
- **Historical Value at Risk ($VaR_\alpha$)**: The $(1-\alpha)$ quantile of daily percentage returns:
  $$VaR_\alpha = -Q_{1-\alpha}(R)$$
- **Expected Shortfall ($CVaR_\alpha$)**: The expected loss conditional on the loss exceeding $VaR_\alpha$:
  $$CVaR_\alpha = -\mathbb{E}[R \mid R \le -VaR_\alpha]$$

### 3. Walk-Forward Optimization (WFO)
1. **Train Window**: Train strategy over $N_{\text{train}}$ bars (e.g. 252 bars).
2. **Optimize Parameters**: Run grid search to find parameter vector maximizing in-sample objective (e.g., Sharpe).
3. **Lock Parameters**: Fix optimal parameter combination without peeking.
4. **Out-of-Sample Test**: Simulate execution over $N_{\text{test}}$ unseen bars (e.g. 63 bars).
5. **Roll Window**: Shift train & test windows forward by $N_{\text{test}}$ and repeat.
6. **Stitch Curves**: Concatenate consecutive out-of-sample equity slices into a single unified OOS equity curve.
7. **Compute Degradation**:
  $$\text{Degradation} = \frac{\overline{\text{Sharpe}}_{\text{IS}} - \overline{\text{Sharpe}}_{\text{OOS}}}{\overline{\text{Sharpe}}_{\text{IS}}} \times 100\%$$

### 4. Pairs Trading (Statistical Arbitrage)
1. Fit OLS regression: $P_{A, t} = \beta P_{B, t} + \alpha + \epsilon_t$.
2. Run Augmented Dickey-Fuller (ADF) cointegration test on residuals $\epsilon_t$.
3. Compute dynamic spread and rolling $Z$-score:
  $$Z_t = \frac{\text{Spread}_t - \mu_{\text{lookback}}}{\sigma_{\text{lookback}}}$$
4. Enter short spread when $Z_t \ge +2.0\sigma$; enter long spread when $Z_t \le -2.0\sigma$. Exit when $|Z_t| \le 0.5\sigma$.

---

## 📄 Export Capabilities
- **Trade Log CSV**: Comprehensive trade executions with timestamp, side, quantity, gross P&L, fees, net P&L, return %, holding bars, MAE %, and MFE %.
- **Equity Curve CSV**: Daily timestamped portfolio values, cash balance, and underwater drawdown %.
- **Research Tearsheet**: Institutional markdown and plain text summary containing executive returns, attribution against benchmark, trade statistics, risk measures, and modeling assumptions.

---

## 🔒 License & Disclaimer
AlgoLab is released for quantitative research and educational strategy development. Algorithmic trading involves substantial risk of capital loss. Past backtested performance is no guarantee of future trading results.
