"""RID FastAPI Application — entry point for the Research Intelligence Dashboard backend."""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from rid.config import settings
from rid.database import close_db, init_db, init_default_admin
from rid.routers import (
    agents,
    analysis,
    auth,
    invitations,
    news,
    pipeline,
    plans,
    settings_router,
    users,
    weekly_plans,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("rid.main")

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("RID backend starting up …")
    await init_db()
    await init_default_admin()
    await _seed_defaults()
    logger.info("RID backend ready on http://%s:%d", settings.host, settings.port)
    yield
    logger.info("RID backend shutting down …")
    await close_db()


app = FastAPI(
    title="Research Intelligence Dashboard",
    description="Backend engine for the Research Intelligence Dashboard (RID).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow the React frontend to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth, prefix="/api/auth", tags=["Auth"])
app.include_router(invitations, prefix="/api/invitations", tags=["Invitations"])
app.include_router(users, prefix="/api/users", tags=["Users"])
app.include_router(weekly_plans, prefix="/api/weekly-plans", tags=["Weekly Plans"])
app.include_router(news, prefix="/api/news", tags=["News"])
app.include_router(analysis, prefix="/api/analysis", tags=["Analysis"])
app.include_router(plans, prefix="/api/plans", tags=["Business Plans"])
app.include_router(agents, prefix="/api/agents", tags=["Agents & Plugins"])
app.include_router(pipeline, prefix="/api/pipeline", tags=["Pipeline"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])


# ---------------------------------------------------------------------------
# Seed defaults
# ---------------------------------------------------------------------------

async def _seed_defaults() -> None:
    """Insert default settings if the table is empty."""
    from rid.database import AsyncSessionLocal
    from rid.models import Setting
    from sqlalchemy import select, func

    defaults = [
        Setting(key="llm_provider", value="ollama", category="llm"),
        Setting(key="fetch_interval_hours", value="24", category="pipeline"),
        Setting(key="default_timeframe_months", value="12", category="planning"),
        Setting(key="auto_run_pipeline", value="false", category="pipeline"),
        Setting(key="news_sources", value='["rss","newsapi","scraper"]', category="news"),
    ]

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(func.count()).select_from(Setting))
        count = result.scalar()
        if count == 0:
            for s in defaults:
                session.add(s)
            await session.commit()
            logger.info("Seeded %d default settings.", len(defaults))


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Return health status including Ollama connectivity."""
    from rid.agents.llm import OllamaProvider

    ollama = OllamaProvider()
    try:
        ollama_status = await ollama.health()
    finally:
        try:
            await ollama.close()
        except Exception as exc:
            logger.warning("Error closing Ollama health client: %s", exc)

    return {
        "status": "ok",
        "version": "1.0.0",
        "ollama": ollama_status,
    }
