from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.ai.debate import run_debate
from backend.ai.log_store import log_store
from backend.models.schemas import DebateRequest, DebateResponse, LogsResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/debate", response_model=DebateResponse)
def debate(req: DebateRequest):
    try:
        return run_debate(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/logs/{session_id}", response_model=LogsResponse)
def logs(session_id: str):
    return LogsResponse(session_id=session_id, reasoning=log_store.list(session_id))
