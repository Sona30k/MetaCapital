from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any


def _parse_origins(value: str | None) -> list[str]:
    """
    Supports:
      - "*" (default in dev)
      - CSV: "http://localhost:5173,https://example.com"
      - JSON list: ["http://localhost:5173", "https://example.com"]
    """
    if not value:
        return ["*"]

    value = value.strip()
    if value == "*":
        return ["*"]

    if value.startswith("["):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list) and all(isinstance(x, str) for x in parsed):
                return parsed
        except Exception:
            pass

    return [x.strip() for x in value.split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    env: str = os.getenv("ENV", "dev")
    allowed_origins: list[str] = None  # type: ignore[assignment]

    # LLM (optional)
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_base_url: str | None = os.getenv("OPENAI_BASE_URL")  # e.g. "https://api.openai.com/v1"
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Market + news providers (optional)
    finnhub_api_key: str | None = os.getenv("FINNHUB_API_KEY")
    newsapi_key: str | None = os.getenv("NEWSAPI_KEY")
    alphavantage_api_key: str | None = os.getenv("ALPHAVANTAGE_API_KEY")

    # Auth (optional)
    jwt_secret: str = os.getenv("JWT_SECRET", "CHANGE_ME_IN_PROD")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_minutes: int = int(os.getenv("ACCESS_TOKEN_MINUTES", "1440"))

    # Runtime
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "allowed_origins",
            _parse_origins(os.getenv("ALLOWED_ORIGINS")),
        )

    def as_redacted_dict(self) -> dict[str, Any]:
        def redact(v: str | None) -> str | None:
            if not v:
                return None
            return v[:3] + "…" + v[-2:]

        return {
            "env": self.env,
            "allowed_origins": self.allowed_origins,
            "openai_api_key": redact(self.openai_api_key),
            "openai_base_url": self.openai_base_url,
            "openai_model": self.openai_model,
            "finnhub_api_key": redact(self.finnhub_api_key),
            "newsapi_key": redact(self.newsapi_key),
            "alphavantage_api_key": redact(self.alphavantage_api_key),
            "log_level": self.log_level,
        }


settings = Settings()

