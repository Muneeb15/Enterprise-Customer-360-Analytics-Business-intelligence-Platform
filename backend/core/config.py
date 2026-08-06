from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/core/config.py  →  __file__ is backend/core/config.py
# parent   = backend/core/
# parent.parent = backend/
_BACKEND_DIR = Path(__file__).parent.parent   # …/backend/
_ENV_FILE = _BACKEND_DIR / ".env"             # …/backend/.env


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: Literal["development", "production"] = "development"
    secret_key: str = "insecure-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Clerk
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    # Database — default to SQLite so dev works with zero setup
    database_url: str = "sqlite+aiosqlite:///./nexus_dev.db"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Storage
    storage_path: str = "./storage/reports"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def storage_dir(self) -> Path:
        p = Path(self.storage_path)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def is_dev(self) -> bool:
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
