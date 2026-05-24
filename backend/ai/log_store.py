from __future__ import annotations

from collections import defaultdict
from typing import DefaultDict

from backend.models.schemas import ReasoningStep


class InMemoryLogStore:
    """
    Production note:
      For a real deployment, replace with Redis/Postgres. We keep a small
      in-memory store here to keep the repo self-contained.
    """

    def __init__(self) -> None:
        self._steps: DefaultDict[str, list[ReasoningStep]] = defaultdict(list)

    def append(self, session_id: str, step: ReasoningStep) -> None:
        self._steps[session_id].append(step)

    def list(self, session_id: str) -> list[ReasoningStep]:
        return list(self._steps.get(session_id, []))

    def clear(self, session_id: str) -> None:
        self._steps.pop(session_id, None)


log_store = InMemoryLogStore()
