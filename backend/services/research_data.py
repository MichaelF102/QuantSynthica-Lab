"""
Research-page data: analyst estimates, news, ownership, filings, peers, corporate events.

Everything comes from the market-data provider or the local universe dataset. When a feed has nothing for a
symbol (common for non-US listings) the response says `available: false` with a reason; nothing is fabricated.
"""
import logging
import math
import re
import time
from datetime import date, datetime, timezone
from typing import Any, Callable, Dict, List, Optional

import pandas as pd
import yfinance as yf

from ..engine.stocks_universe import universe_manager

logger = logging.getLogger("quantsynthica.research")

_CACHE: Dict[str, Any] = {}
TTL_SECONDS = 600


def _cached(key: str, fn: Callable[[], Dict[str, Any]]) -> Dict[str, Any]:
    hit = _CACHE.get(key)
    if hit and time.time() - hit[0] < TTL_SECONDS:
        return hit[1]
    value = fn()
    # Only cache successful lookups so a transient provider failure is retried on the next request.
    if value.get("available"):
        _CACHE[key] = (time.time(), value)
    return value


def candidates(symbol: str) -> List[str]:
    """Provider symbols to try: the universe mapping, its sibling NSE/BSE listing, then the raw ticker."""
    sym = symbol.strip().upper()
    stock = universe_manager.get_stock(sym)
    yf_sym = stock["yf_symbol"] if stock else sym
    swapped = (yf_sym[:-3] + (".NS" if yf_sym.endswith(".BO") else ".BO")) if yf_sym.endswith((".NS", ".BO")) else None
    return list(dict.fromkeys(c for c in [yf_sym, swapped, sym] if c))


def clean(v: Any) -> Any:
    """JSON-safe scalar: NaN/inf -> None, timestamps -> ISO date strings, numpy -> python."""
    if v is None:
        return None
    if isinstance(v, (pd.Timestamp, datetime)):
        return v.date().isoformat() if not pd.isna(v) else None
    if isinstance(v, date):
        return v.isoformat()
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(v, "item"):
        v = v.item()
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v


def _frame_rows(df: Any, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    if df is None or not hasattr(df, "empty") or df.empty:
        return []
    d = df.reset_index() if df.index.name or not isinstance(df.index, pd.RangeIndex) else df
    rows = d.head(limit) if limit else d
    return [{str(k): clean(v) for k, v in r.items()} for r in rows.to_dict("records")]


def _first(symbol: str, fetch: Callable[[yf.Ticker], Optional[Dict[str, Any]]]) -> Optional[Dict[str, Any]]:
    for cand in candidates(symbol):
        try:
            out = fetch(yf.Ticker(cand))
            if out:
                return {**out, "provider_symbol": cand}
        except Exception as e:  # provider hiccup: try the next candidate
            logger.debug("research fetch failed for %s: %s", cand, e)
    return None


def _unavailable(symbol: str, reason: str) -> Dict[str, Any]:
    return {"symbol": symbol.upper(), "available": False, "reason": reason}


# ---------------------------------------------------------------- analyst
def analyst(symbol: str) -> Dict[str, Any]:
    def build() -> Dict[str, Any]:
        def fetch(t: yf.Ticker):
            pt = {k: clean(v) for k, v in (t.analyst_price_targets or {}).items()} if isinstance(t.analyst_price_targets, dict) else {}
            summ = _frame_rows(t.recommendations_summary)
            if not (pt.get("mean") or summ):
                return None
            info = {}
            try:
                info = t.info or {}
            except Exception:
                pass
            actions = []
            try:
                ud = t.upgrades_downgrades
                if ud is not None and not ud.empty:
                    for dt, r in ud.sort_index(ascending=False).head(15).iterrows():
                        actions.append({
                            "date": clean(dt), "firm": clean(r.get("Firm")), "to_grade": clean(r.get("ToGrade")), "from_grade": clean(r.get("FromGrade")),
                            "action": clean(r.get("Action")), "target_action": clean(r.get("priceTargetAction")), "target": clean(r.get("currentPriceTarget")),
                        })
            except Exception:
                pass
            return {
                "price_targets": pt,
                "recommendation": {"key": info.get("recommendationKey"), "mean": clean(info.get("recommendationMean")), "analysts": clean(info.get("numberOfAnalystOpinions"))},
                "trend": summ,
                "eps_estimates": _frame_rows(t.earnings_estimate),
                "revenue_estimates": _frame_rows(t.revenue_estimate),
                "actions": actions,
                "currency": info.get("financialCurrency") or info.get("currency"),
            }

        out = _first(symbol, fetch)
        return {"symbol": symbol.upper(), "available": True, **out} if out else _unavailable(symbol, "No analyst coverage is available for this security from our data provider.")

    return _cached(f"analyst:{symbol.upper()}", build)


# ---------------------------------------------------------------- news
def _norm_news(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    c = item.get("content") if isinstance(item.get("content"), dict) else item
    title = c.get("title")
    if not title:
        return None
    link = (c.get("canonicalUrl") or {}).get("url") if isinstance(c.get("canonicalUrl"), dict) else None
    link = link or (c.get("clickThroughUrl") or {}).get("url") if isinstance(c.get("clickThroughUrl"), dict) else link
    link = link or c.get("link")
    provider = c.get("provider", {}).get("displayName") if isinstance(c.get("provider"), dict) else c.get("publisher")
    published = c.get("pubDate") or c.get("displayTime")
    if not published and c.get("providerPublishTime"):
        published = datetime.fromtimestamp(int(c["providerPublishTime"]), tz=timezone.utc).isoformat()
    return {"title": title, "publisher": provider, "link": link, "published": published, "summary": c.get("summary") or c.get("description"), "related": item.get("relatedTickers") or c.get("relatedTickers") or []}


def news(symbol: str) -> Dict[str, Any]:
    def build() -> Dict[str, Any]:
        def fetch(t: yf.Ticker):
            items = [n for n in (_norm_news(i) for i in (t.news or [])) if n]
            return {"items": items[:25]} if items else None

        out = _first(symbol, fetch)
        if not out:
            # The per-ticker feed is often empty (notably for NSE/BSE); fall back to provider search by symbol, then company name.
            stock = universe_manager.get_stock(symbol)
            cands = candidates(symbol)
            keys = {c.upper().split(".")[0] for c in cands}
            generic = {"limited", "corporation", "company", "holdings", "ltd", "inc", "corp", "plc"}
            sig = [w for w in (stock["name"].split() if stock else []) if w.lower().strip(",.") not in generic]
            phrase = " ".join(sig[:2]).lower().strip(",.")  # e.g. "reliance industries": the full name, not a common word

            def relevant(n: Dict[str, Any]) -> bool:
                # Keyword search returns loosely related stories: keep a story only if it is tagged with this
                # security or its headline names the company / ticker.
                tagged = any(str(t).upper().split(".")[0] in keys for t in n.get("related", []))
                text = (n["title"] or "").lower()
                return tagged or (bool(phrase) and phrase in text) or any(re.search(rf"\b{re.escape(k)}\b", n["title"] or "") for k in keys if len(k) > 2)  # upper-case ticker as written

            for q in dict.fromkeys([*cands, *([stock["name"]] if stock else [])]):
                try:
                    items = [n for n in (_norm_news(i) for i in (yf.Search(q, news_count=15).news or [])) if n and relevant(n)]
                except Exception as e:
                    logger.debug("news search failed for %s: %s", q, e)
                    continue
                if items:
                    out = {"items": items[:25], "provider_symbol": q}
                    break
        return {"symbol": symbol.upper(), "available": True, **out} if out else _unavailable(symbol, "No news feed is available for this security from our data provider right now.")

    return _cached(f"news:{symbol.upper()}", build)


# ---------------------------------------------------------------- ownership
def ownership(symbol: str) -> Dict[str, Any]:
    def build() -> Dict[str, Any]:
        def fetch(t: yf.Ticker):
            major: Dict[str, Any] = {}
            mh = t.major_holders
            if mh is not None and not mh.empty:
                major = {str(k): clean(v) for k, v in mh["Value"].items()}
            inst = _frame_rows(t.institutional_holders, 10)
            insiders = _frame_rows(t.insider_roster_holders, 10)
            for r in insiders:
                r.pop("URL", None)
            if not (major or inst or insiders):
                return None
            return {"major": major, "institutions": inst, "insiders": insiders}

        out = _first(symbol, fetch)
        return {"symbol": symbol.upper(), "available": True, **out} if out else _unavailable(symbol, "No ownership data is available for this security from our data provider.")

    return _cached(f"own:{symbol.upper()}", build)


# ---------------------------------------------------------------- filings
def filings(symbol: str) -> Dict[str, Any]:
    def build() -> Dict[str, Any]:
        def fetch(t: yf.Ticker):
            raw = t.sec_filings
            items = []
            for f in raw if isinstance(raw, list) else []:
                items.append({"date": clean(f.get("date")), "type": f.get("type"), "title": f.get("title"), "url": f.get("edgarUrl")})
            return {"items": items[:40]} if items else None

        out = _first(symbol, fetch)
        return {"symbol": symbol.upper(), "available": True, **out} if out else _unavailable(symbol, "Regulatory filings are only available for US-listed companies in our data source.")

    return _cached(f"fil:{symbol.upper()}", build)


# ---------------------------------------------------------------- corporate events
def corporate(symbol: str) -> Dict[str, Any]:
    def build() -> Dict[str, Any]:
        def fetch(t: yf.Ticker):
            cal = {}
            try:
                cal = {str(k): ([clean(x) for x in v] if isinstance(v, list) else clean(v)) for k, v in (t.calendar or {}).items()}
            except Exception:
                pass
            divs = []
            try:
                s = t.dividends
                if s is not None and len(s):
                    divs = [{"date": clean(i), "amount": clean(v)} for i, v in list(s.items())[-8:]][::-1]
            except Exception:
                pass
            if not (cal or divs):
                return None
            return {"calendar": cal, "dividends": divs}

        out = _first(symbol, fetch)
        return {"symbol": symbol.upper(), "available": True, **out} if out else _unavailable(symbol, "No corporate-event data is available for this security.")

    return _cached(f"corp:{symbol.upper()}", build)


# ---------------------------------------------------------------- peers (local universe)
def peers(symbol: str, limit: int = 8) -> Dict[str, Any]:
    stock = universe_manager.get_stock(symbol)
    if not stock:
        return _unavailable(symbol, "Security not found in the universe dataset.")
    sector = stock.get("sector")
    if not sector or str(sector).lower() in {"general", "nan", "custom"}:
        return _unavailable(symbol, "No sector classification for this security, so peers cannot be determined.")
    same = [s for s in universe_manager.stocks if s["market"] == stock["market"] and s.get("sector") == sector and s["symbol"] != stock["symbol"] and s.get("market_cap")]
    same.sort(key=lambda s: s["market_cap"], reverse=True)
    # The universe lists dual-listed companies once per exchange; keep one row per symbol.
    seen: set = set()
    same = [s for s in same if not (s["symbol"] in seen or seen.add(s["symbol"]))]
    keep = ["symbol", "name", "price", "change_1d", "market_cap", "pe_ratio", "currency", "exchange"]
    return {
        "symbol": stock["symbol"], "available": bool(same), "sector": sector, "market": stock["market"],
        "peers": [{k: clean(s.get(k)) for k in keep} for s in same[:limit]],
        "note": "Peers are the largest companies by market cap in the same sector of the QuantSynthica universe; price, change and P/E are from the universe dataset snapshot.",
        **({} if same else {"reason": "No other companies with market-cap data in this sector."}),
    }
