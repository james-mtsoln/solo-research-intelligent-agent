"""RID Configuration — Pydantic Settings with environment variable support."""

from __future__ import annotations

import os
import secrets
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All variables are prefixed with ``RID_`` and can be set via
    ``.env`` file or shell environment.
    """

    model_config = SettingsConfigDict(
        env_prefix="RID_",
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database ---
    db_path: str = str(Path(__file__).resolve().parent.parent / "rid.db")

    # --- Ollama (local LLM) ---
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # --- Optional external LLM ---
    openai_key: Optional[str] = None
    openai_url: str = "https://api.openai.com/v1"

    # --- Kimi (Moonshot) ---
    kimi_key: str = ""
    kimi_url: str = "https://api.moonshot.cn/v1"
    kimi_model: str = "kimi-k1"

    # --- Gemini (Google) ---
    gemini_key: str = ""
    gemini_url: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    gemini_model: str = "gemini-1.5-pro"

    # --- News sources ---
    newsapi_key: Optional[str] = None
    fetch_limit: int = 50

    # --- App behaviour ---
    log_level: str = "INFO"
    port: int = 8000
    host: str = "0.0.0.0"
    reload: bool = False

    # --- Auth / RBAC ---
    secret_key: str = ""  # JWT secret -- REQUIRED in production
    admin_email: str = "admin@local"  # Default admin credentials
    admin_password: str = ""  # Default admin password -- auto-generated if empty

    # --- Derived properties ---
    @property
    def database_url(self) -> str:
        """Return an async SQLite URL for SQLAlchemy."""
        # Ensure directory exists
        path = Path(self.db_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite+aiosqlite:///{self.db_path}"

    @property
    def jwt_secret(self) -> str:
        """Return a stable JWT secret key.

        If ``secret_key`` is not configured, generates a random one
        and stores it in the process environment so it persists
        for the process lifetime.  A warning is logged so operators
        know the secret is ephemeral.
        """
        if self.secret_key:
            return self.secret_key
        env_key = os.environ.get("_RID_JWT_SECRET")
        if env_key:
            return env_key
        import logging
        logger = logging.getLogger("rid.config")
        logger.warning(
            "RID_SECRET_KEY is not set. A random per-process JWT secret "
            "has been generated. All tokens will be invalidated on restart. "
            "Set RID_SECRET_KEY in production for persistent authentication."
        )
        generated = secrets.token_hex(32)
        os.environ["_RID_JWT_SECRET"] = generated
        return generated


# Global settings singleton — imported by other modules.
settings = Settings()
