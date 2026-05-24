from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.api.deps import get_session_id
from backend.models.schemas import PlaceOrderRequest, PortfolioSnapshot
from backend.services.portfolio import portfolio_store

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/snapshot", response_model=PortfolioSnapshot)
def snapshot(session_id: str = Depends(get_session_id)):
    return portfolio_store.snapshot(session_id)


@router.post("/orders", response_model=PortfolioSnapshot)
def place_order(req: PlaceOrderRequest, session_id: str = Depends(get_session_id)):
    try:
        return portfolio_store.place_order(session_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset", response_model=PortfolioSnapshot)
def reset(session_id: str = Depends(get_session_id)):
    portfolio_store.reset(session_id)
    return portfolio_store.snapshot(session_id)
