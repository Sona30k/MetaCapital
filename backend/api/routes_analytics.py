from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import AnalyticsResponse, TimeRange
from backend.services.analytics import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsResponse)
def overview(
    tickers: list[str] = Query(default=["AAPL", "MSFT", "GOOGL", "TSLA"]),
    benchmark: str = Query(default="SPY"),
    time_range: TimeRange = Query(default="1Y", alias="range"),
):
    try:
        return analytics_service.overview(tickers=tickers, benchmark=benchmark, time_range=time_range)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
