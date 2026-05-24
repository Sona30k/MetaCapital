from __future__ import annotations

from fastapi import APIRouter

from backend.api.routes_ai import router as ai_router
from backend.api.routes_backtest import router as backtest_router
from backend.api.routes_health import router as health_router
from backend.api.routes_news import router as news_router
from backend.api.routes_portfolio import router as portfolio_router
from backend.api.routes_quotes import router as quotes_router


api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(ai_router)
api_router.include_router(quotes_router)
api_router.include_router(news_router)
api_router.include_router(portfolio_router)
api_router.include_router(backtest_router)
