from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from backend.ai.agents import AGENTS
from backend.api.router import api_router
from backend.config import INITIAL_CAPITAL, POSITION_SIZE, TICKERS, TRANSACTION_COST
from backend.core.logging import configure_logging
from backend.core.settings import settings
from backend.ml_model import data_store, get_price_series, train_all_models
from backend.services.market_data import market_data


def _calculate_metrics(returns: list[float]) -> dict[str, float]:
    values = np.array(returns, dtype=float)
    if values.size == 0:
        return {"sharpe": 0.0, "max_drawdown": 0.0}

    sharpe = float(values.mean() / (values.std() + 1e-9))
    cumulative = values.cumsum()
    peak = np.maximum.accumulate(cumulative)
    drawdown = cumulative - peak
    return {"sharpe": sharpe, "max_drawdown": float(drawdown.min())}


def _allocate(scores: dict[str, float]) -> dict[str, float]:
    if not scores:
        return {}
    values = np.array(list(scores.values()), dtype=float)
    weights = np.exp(values - values.max())
    weights = weights / max(weights.sum(), 1e-9)
    return dict(zip(scores.keys(), (weights * INITIAL_CAPITAL).astype(float)))


def _legacy_signal(agent_name: str, ticker: str) -> str:
    if agent_name == "ml":
        agent = AGENTS["ml"]
    else:
        agent = AGENTS["random"]

    # The modern agents need richer context; legacy simulation keeps its historical
    # response shape and only maps the broad signal outcome.
    from backend.ai.agents import AgentContext

    opinion = agent.run(AgentContext(session_id="legacy-sim", ticker=ticker, question="Legacy simulation"))
    return opinion.action


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging(settings.log_level)
    try:
        train_all_models(TICKERS)
    except Exception:
        # Provider failures should not prevent the app from booting; API routes
        # have deterministic fallbacks where possible.
        pass
    yield


app = FastAPI(
    title="MetaCapital API",
    version="2.0.0",
    description="AI multi-agent financial analysis, simulation, sentiment, and backtesting platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/simulate", tags=["legacy"])
def simulate():
    portfolio: dict[str, dict] = {}

    for ticker in TICKERS:
        prices = get_price_series(ticker)
        results: dict[str, dict] = {}
        scores: dict[str, float] = {}

        for agent_name in ("ml", "random"):
            capital = float(INITIAL_CAPITAL)
            position = 0
            entry_price = 0.0
            returns: list[float] = []
            capital_history = [capital]

            for price in prices[1:]:
                signal = _legacy_signal(agent_name, ticker)
                price = float(price)

                if signal == "BUY" and position == 0:
                    position = 1
                    entry_price = price
                elif signal == "SELL" and position == 0:
                    position = -1
                    entry_price = price
                elif position != 0:
                    pnl = (price - entry_price) * position
                    pnl *= capital * POSITION_SIZE
                    pnl -= capital * TRANSACTION_COST
                    capital += pnl
                    returns.append(float(pnl))
                    position = 0

                capital_history.append(float(capital))

            metrics = _calculate_metrics(returns)
            results[agent_name] = {
                "final_capital": capital,
                "capital_history": capital_history,
                "metrics": metrics,
            }
            scores[agent_name] = metrics["sharpe"]

        portfolio[ticker] = {"results": results, "scores": scores, "allocation": _allocate(scores)}

    return portfolio


@app.get("/insights", tags=["legacy"])
def insights():
    out: dict[str, dict] = {}
    for ticker in TICKERS:
        latest = data_store.get(ticker)
        rsi = float(latest.iloc[-1].get("RSI", 0.0)) if latest is not None and not latest.empty else 0.0
        out[ticker] = {"RSI": rsi, "message": "AI signals active across ML, sentiment, and risk agents."}
    return out


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            # Backwards-compatible WS payload: { "AAPL": 123.4, ... }
            quotes = market_data.get_quotes(list(TICKERS))
            live_data = {q.ticker: q.price for q in quotes}
            await websocket.send_json(live_data)
            await asyncio.sleep(2)
        except Exception:
            break
