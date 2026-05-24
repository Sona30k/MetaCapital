from __future__ import annotations

import asyncio

from fastapi import APIRouter, Query, WebSocket

from backend.models.schemas import QuotesResponse
from backend.services.market_data import market_data

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("", response_model=QuotesResponse)
def get_quotes(tickers: list[str] = Query(default=["AAPL", "TSLA", "MSFT"])):
    quotes = market_data.get_quotes(tickers)
    return QuotesResponse(quotes=quotes)


@router.websocket("/ws")
async def quotes_ws(websocket: WebSocket):
    await websocket.accept()
    tickers_param = websocket.query_params.get("tickers", "AAPL,TSLA,MSFT")
    tickers = [t.strip().upper() for t in tickers_param.split(",") if t.strip()]

    # Push updates every second (micro-ticks), while only calling providers periodically.
    while True:
        try:
            quotes = market_data.get_quotes(tickers)
            await websocket.send_json({"quotes": [q.model_dump(mode="json") for q in quotes]})
            await asyncio.sleep(1.0)
        except Exception:
            break
