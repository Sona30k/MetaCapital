from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ApiError(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


# -----------------------------
# AI debate + explainability
# -----------------------------

AgentName = Literal["ml", "random", "news_sentiment", "risk", "moderator"]
TradeAction = Literal["BUY", "SELL", "HOLD"]


class DebateRequest(BaseModel):
    ticker: str = Field(..., examples=["AAPL"])
    question: str = Field(
        ...,
        examples=["Should we buy AAPL for a 2-week horizon?"],
        description="Natural-language user prompt for the debate.",
    )
    agents: list[AgentName] | None = Field(
        default=None,
        description="Optional subset of agents to run. Defaults to all.",
    )


class ReasoningStep(BaseModel):
    ts: datetime
    agent: str
    title: str
    data: dict[str, Any] = Field(default_factory=dict)


class AgentOpinion(BaseModel):
    agent: str
    action: TradeAction
    confidence: float = Field(ge=0, le=1)
    rationale: str


class DebateResponse(BaseModel):
    session_id: str
    ticker: str
    question: str
    opinions: list[AgentOpinion]
    final_action: TradeAction
    confidence: float = Field(ge=0, le=1)
    reasoning: list[ReasoningStep]


class LogsResponse(BaseModel):
    session_id: str
    reasoning: list[ReasoningStep]


# -----------------------------
# Quotes (REST) + WebSocket payload
# -----------------------------

class Quote(BaseModel):
    ticker: str
    price: float
    ts: datetime


class QuotesResponse(BaseModel):
    quotes: list[Quote]


# -----------------------------
# News + sentiment
# -----------------------------

class NewsArticle(BaseModel):
    id: str
    ticker: str | None = None
    headline: str
    source: str | None = None
    url: str | None = None
    published_at: datetime | None = None
    summary: str | None = None
    sentiment: float = Field(
        ge=-1, le=1, description="Sentiment score in [-1, 1] (negative..positive)."
    )


class NewsResponse(BaseModel):
    articles: list[NewsArticle]


# -----------------------------
# Portfolio simulation
# -----------------------------

OrderSide = Literal["BUY", "SELL"]


class PlaceOrderRequest(BaseModel):
    ticker: str
    side: OrderSide
    qty: float = Field(gt=0)


class Position(BaseModel):
    ticker: str
    qty: float
    avg_price: float
    market_price: float
    pnl: float


class PortfolioAccount(BaseModel):
    cash: float
    equity: float
    pnl: float


class PortfolioSnapshot(BaseModel):
    account: PortfolioAccount
    positions: list[Position]


# -----------------------------
# Backtesting
# -----------------------------

StrategyName = Literal["buy_hold", "ma_crossover", "rsi_mean_reversion", "vol_breakout"]


class BacktestRequest(BaseModel):
    ticker: str
    strategy: StrategyName
    start: str | None = Field(default=None, description="YYYY-MM-DD (optional)")
    end: str | None = Field(default=None, description="YYYY-MM-DD (optional)")
    initial_cash: float = Field(default=10_000, gt=0)
    params: dict[str, Any] = Field(default_factory=dict)


class BacktestMetrics(BaseModel):
    cagr: float
    sharpe: float
    sortino: float
    max_drawdown: float
    win_rate: float
    total_return: float
    trades: int


class EquityPoint(BaseModel):
    ts: datetime
    equity: float


class BacktestResult(BaseModel):
    ticker: str
    strategy: StrategyName
    metrics: BacktestMetrics
    equity_curve: list[EquityPoint]


class CompareRequest(BaseModel):
    ticker: str
    strategies: list[StrategyName]
    start: str | None = None
    end: str | None = None
    initial_cash: float = Field(default=10_000, gt=0)
    params_by_strategy: dict[str, dict[str, Any]] = Field(default_factory=dict)


class CompareResponse(BaseModel):
    results: list[BacktestResult]

