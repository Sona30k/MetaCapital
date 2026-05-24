from __future__ import annotations

from fastapi import APIRouter

from backend.core.settings import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"ok": True, "settings": settings.as_redacted_dict()}
