from __future__ import annotations

from fastapi import Header


def get_session_id(x_session_id: str | None = Header(default=None)) -> str:
    # For an MVP we identify the "paper trading" account by a session header.
    # Frontend can generate a stable UUID and store it in localStorage.
    return x_session_id or "local"

