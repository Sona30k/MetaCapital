from __future__ import annotations

import random
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol

import yfinance as yf

from backend.models.schemas import Quote


def _now() -> datetime:
    return datetime.now(timezone.utc)


class QuoteProvider(Protocol):
    def get_latest_price(self, ticker: str) -> float | None:
        ...


class YFinanceQuoteProvider:
    """
    yfinance isn't true streaming, but it's a reliable fallback in a self-contained repo.
    We combine it with a small random-walk "micro-tick" generator for WebSocket updates.
    """

    def get_latest_price(self, ticker: str) -> float | None:
        try:
            df = yf.download(ticker, period="1d", interval="1m", progress=False)
            if df is None or df.empty:
                return None
            # yfinance sometimes returns MultiIndex
            if hasattr(df.columns, "get_level_values"):
                df.columns = df.columns.get_level_values(0)
            if "Close" not in df:
                return None
            v = df["Close"].dropna().iloc[-1]
            return float(v)
        except Exception:
            return None


@dataclass
class _TickerState:
    last_price: float
    last_real_fetch_s: float


class MarketDataService:
    def __init__(self, provider: QuoteProvider | None = None) -> None:
        self._provider = provider or YFinanceQuoteProvider()
        self._state: dict[str, _TickerState] = {}

        # Avoid hammering providers; fetch real data at most once per minute per ticker.
        self._real_fetch_interval_s = 60.0

    def get_quote(self, ticker: str) -> Quote:
        t = ticker.upper().strip()
        now_s = time.time()

        st = self._state.get(t)
        if st is None:
            price = self._provider.get_latest_price(t) or 100.0 + random.random() * 50
            st = _TickerState(last_price=float(price), last_real_fetch_s=now_s)
            self._state[t] = st
            return Quote(ticker=t, price=st.last_price, ts=_now())

        # Periodically refresh from the provider; otherwise, generate a micro-tick.
        if now_s - st.last_real_fetch_s >= self._real_fetch_interval_s:
            real = self._provider.get_latest_price(t)
            if real is not None:
                st.last_price = float(real)
                st.last_real_fetch_s = now_s
                return Quote(ticker=t, price=st.last_price, ts=_now())

        # Micro-tick: tiny random walk to feel "live".
        drift = random.gauss(mu=0.0, sigma=0.0015)
        st.last_price = max(0.01, float(st.last_price * (1.0 + drift)))
        return Quote(ticker=t, price=st.last_price, ts=_now())

    def get_quotes(self, tickers: list[str]) -> list[Quote]:
        return [self.get_quote(t) for t in tickers]


market_data = MarketDataService()
