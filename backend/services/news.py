from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Protocol

import httpx

from backend.core.settings import settings
from backend.models.schemas import NewsArticle


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SentimentAnalyzer:
    """
    Lightweight sentiment scoring.

    - If vaderSentiment is installed, we use it.
    - Otherwise, we fall back to a tiny finance-oriented wordlist.
    """

    def __init__(self) -> None:
        self._vader = None
        try:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer  # type: ignore

            self._vader = SentimentIntensityAnalyzer()
        except Exception:
            self._vader = None

        self._pos = {"beats", "upgrade", "surge", "record", "profit", "growth", "bull"}
        self._neg = {"miss", "downgrade", "plunge", "loss", "layoff", "fraud", "bear"}

    def score(self, text: str) -> float:
        if self._vader is not None:
            out = self._vader.polarity_scores(text)
            return float(out.get("compound", 0.0))

        t = text.lower()
        pos = sum(1 for w in self._pos if w in t)
        neg = sum(1 for w in self._neg if w in t)
        if pos + neg == 0:
            return 0.0
        return float((pos - neg) / (pos + neg))


class NewsProvider(Protocol):
    def get_company_news(self, ticker: str, limit: int = 20) -> list[NewsArticle]:
        ...


@dataclass(frozen=True)
class FinnhubNewsProvider:
    api_key: str

    def get_company_news(self, ticker: str, limit: int = 20) -> list[NewsArticle]:
        # Finnhub requires from/to YYYY-MM-DD.
        to_dt = _now().date()
        from_dt = (to_dt - timedelta(days=7))
        url = "https://finnhub.io/api/v1/company-news"
        params = {"symbol": ticker, "from": str(from_dt), "to": str(to_dt), "token": self.api_key}

        with httpx.Client(timeout=10.0) as client:
            r = client.get(url, params=params)
            r.raise_for_status()
            items = r.json()

        out: list[NewsArticle] = []
        for it in (items or [])[:limit]:
            published_at = None
            try:
                published_at = datetime.fromtimestamp(int(it.get("datetime", 0)), tz=timezone.utc)
            except Exception:
                published_at = None

            out.append(
                NewsArticle(
                    id=str(it.get("id") or uuid.uuid4().hex),
                    ticker=ticker,
                    headline=str(it.get("headline") or ""),
                    source=it.get("source"),
                    url=it.get("url"),
                    published_at=published_at,
                    summary=it.get("summary"),
                    sentiment=0.0,  # filled later
                )
            )
        return out


class MockNewsProvider:
    def get_company_news(self, ticker: str, limit: int = 20) -> list[NewsArticle]:
        samples = [
            (f"{ticker} reports strong quarterly earnings beat", 0.45),
            (f"Analysts raise {ticker} price target amid growth outlook", 0.25),
            (f"{ticker} faces regulatory scrutiny; shares wobble", -0.2),
            (f"Mixed signals for {ticker} as macro headwinds persist", 0.0),
        ]
        out: list[NewsArticle] = []
        for headline, s in samples[:limit]:
            out.append(
                NewsArticle(
                    id=uuid.uuid4().hex,
                    ticker=ticker,
                    headline=headline,
                    source="mock",
                    url=None,
                    published_at=_now(),
                    summary=None,
                    sentiment=float(s),
                )
            )
        return out


class NewsService:
    def __init__(self) -> None:
        self._analyzer = SentimentAnalyzer()
        self._provider: NewsProvider = (
            FinnhubNewsProvider(settings.finnhub_api_key)
            if settings.finnhub_api_key
            else MockNewsProvider()
        )
        self._cache: dict[tuple[str, int], tuple[float, list[NewsArticle]]] = {}
        self._ttl_s = 60.0

    def get_news(self, ticker: str, limit: int = 20) -> list[NewsArticle]:
        key = (ticker, limit)
        now = time.time()
        if key in self._cache:
            ts, articles = self._cache[key]
            if now - ts < self._ttl_s:
                return articles

        articles = self._provider.get_company_news(ticker=ticker, limit=limit)
        for a in articles:
            # If provider already has sentiment (mock), keep it.
            if a.sentiment == 0.0:
                a.sentiment = self._analyzer.score(a.headline + " " + (a.summary or ""))

        self._cache[key] = (now, articles)
        return articles

    def get_ticker_sentiment(self, ticker: str) -> float:
        articles = self.get_news(ticker, limit=10)
        if not articles:
            return 0.0
        return float(sum(a.sentiment for a in articles) / len(articles))


news_service = NewsService()
