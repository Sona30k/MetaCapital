from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from backend.ai.log_store import log_store
from backend.models.schemas import AgentOpinion, ReasoningStep, TradeAction
from backend.ml_model import data_store, models
from backend.services.news import news_service


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class AgentContext:
    session_id: str
    ticker: str
    question: str


class BaseAgent:
    name: str

    def run(self, ctx: AgentContext) -> AgentOpinion:
        raise NotImplementedError

    def _log(self, session_id: str, title: str, data: dict) -> None:
        log_store.append(
            session_id,
            ReasoningStep(ts=_now(), agent=self.name, title=title, data=data),
        )


class MLAgent(BaseAgent):
    name = "ml"

    def run(self, ctx: AgentContext) -> AgentOpinion:
        df = data_store.get(ctx.ticker)
        model = models.get(ctx.ticker)

        if df is None or model is None or df.empty:
            self._log(ctx.session_id, "Model unavailable", {"reason": "no data/model"})
            return AgentOpinion(
                agent=self.name,
                action="HOLD",
                confidence=0.3,
                rationale="Model data not available; defaulting to HOLD.",
            )

        latest = df.iloc[-1]
        features = pd.DataFrame(
            [
                {
                    "Close": float(latest["Close"]),
                    "MA_5": float(latest["MA_5"]),
                    "MA_10": float(latest["MA_10"]),
                    "Return": float(latest["Return"]),
                    "Volatility": float(latest["Volatility"]),
                }
            ]
        )

        # XGBoost supports predict_proba; fall back safely.
        proba_up = None
        try:
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(features)[0]
                proba_up = float(proba[1])
        except Exception:
            proba_up = None

        pred = int(model.predict(features)[0])
        action: TradeAction = "BUY" if pred == 1 else "SELL"
        confidence = float(proba_up if action == "BUY" else (1 - proba_up)) if proba_up is not None else 0.6
        confidence = float(np.clip(confidence, 0.05, 0.95))

        self._log(
            ctx.session_id,
            "ML features",
            {"features": features.iloc[0].to_dict(), "pred": pred, "proba_up": proba_up},
        )

        return AgentOpinion(
            agent=self.name,
            action=action,
            confidence=confidence,
            rationale=(
                f"Technical-indicator model predicts {'up' if action == 'BUY' else 'down'} move "
                f"(confidence {confidence:.2f})."
            ),
        )


class RandomAgent(BaseAgent):
    name = "random"

    def run(self, ctx: AgentContext) -> AgentOpinion:
        action: TradeAction = random.choice(["BUY", "SELL", "HOLD"])
        self._log(ctx.session_id, "Random baseline", {"action": action})
        return AgentOpinion(
            agent=self.name,
            action=action,
            confidence=0.33,
            rationale="Random baseline action (for comparison).",
        )


class NewsSentimentAgent(BaseAgent):
    name = "news_sentiment"

    def run(self, ctx: AgentContext) -> AgentOpinion:
        sentiment = news_service.get_ticker_sentiment(ctx.ticker)
        if sentiment > 0.15:
            action: TradeAction = "BUY"
        elif sentiment < -0.15:
            action = "SELL"
        else:
            action = "HOLD"

        confidence = float(np.clip(abs(sentiment), 0.15, 0.85))
        self._log(ctx.session_id, "News sentiment", {"sentiment": sentiment, "action": action})
        return AgentOpinion(
            agent=self.name,
            action=action,
            confidence=confidence,
            rationale=f"Recent news sentiment score is {sentiment:.2f} → {action}.",
        )


class RiskAgent(BaseAgent):
    name = "risk"

    def run(self, ctx: AgentContext) -> AgentOpinion:
        df = data_store.get(ctx.ticker)
        if df is None or df.empty:
            vol = None
        else:
            vol = float(df["Volatility"].iloc[-1])

        # Simple guardrail: high volatility -> HOLD / reduce confidence.
        if vol is None:
            action: TradeAction = "HOLD"
            confidence = 0.4
        elif vol > 0.05:
            action = "HOLD"
            confidence = 0.75
        else:
            action = "HOLD"
            confidence = 0.55

        self._log(ctx.session_id, "Risk check", {"volatility": vol, "action": action})
        return AgentOpinion(
            agent=self.name,
            action=action,
            confidence=confidence,
            rationale=(
                "Risk overlay recommends HOLD; treat as a position-sizing constraint "
                f"(volatility={vol if vol is not None else 'n/a'})."
            ),
        )


class ModeratorAgent(BaseAgent):
    name = "moderator"

    def decide(self, ctx: AgentContext, opinions: list[AgentOpinion]) -> tuple[TradeAction, float]:
        votes = {"BUY": 0.0, "SELL": 0.0, "HOLD": 0.0}
        for op in opinions:
            votes[op.action] += float(op.confidence)

        final_action: TradeAction = max(votes, key=votes.get)  # type: ignore[assignment]
        total = sum(votes.values()) or 1.0
        confidence = float(np.clip(votes[final_action] / total, 0.05, 0.95))

        self._log(ctx.session_id, "Vote aggregation", {"votes": votes, "final_action": final_action})
        return final_action, confidence


AGENTS: dict[str, BaseAgent] = {
    "ml": MLAgent(),
    "random": RandomAgent(),
    "news_sentiment": NewsSentimentAgent(),
    "risk": RiskAgent(),
    "moderator": ModeratorAgent(),
}
