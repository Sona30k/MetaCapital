from __future__ import annotations

from fastapi import APIRouter, Query

from backend.models.schemas import NewsResponse
from backend.services.news import news_service

router = APIRouter(prefix="/news", tags=["news"])


@router.get("", response_model=NewsResponse)
def get_news(ticker: str = Query(default="AAPL"), limit: int = Query(default=10, ge=1, le=50)):
    articles = news_service.get_news(ticker.upper().strip(), limit=limit)
    return NewsResponse(articles=articles)
