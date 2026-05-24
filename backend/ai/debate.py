from __future__ import annotations

import uuid

from backend.ai.agents import AGENTS, AgentContext, ModeratorAgent
from backend.ai.log_store import log_store
from backend.models.schemas import DebateRequest, DebateResponse


def run_debate(req: DebateRequest) -> DebateResponse:
    session_id = uuid.uuid4().hex
    ticker = req.ticker.upper().strip()

    ctx = AgentContext(session_id=session_id, ticker=ticker, question=req.question)

    selected = req.agents or ["ml", "news_sentiment", "risk", "random"]
    opinions = []
    for name in selected:
        agent = AGENTS.get(name)
        if agent is None or name == "moderator":
            continue
        opinions.append(agent.run(ctx))

    moderator = AGENTS["moderator"]
    assert isinstance(moderator, ModeratorAgent)
    final_action, confidence = moderator.decide(ctx, opinions)

    return DebateResponse(
        session_id=session_id,
        ticker=ticker,
        question=req.question,
        opinions=opinions,
        final_action=final_action,
        confidence=confidence,
        reasoning=log_store.list(session_id),
    )
