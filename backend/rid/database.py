"""RID Database — Async SQLAlchemy engine, session factory, and init helper."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from rid.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine + Session
# ---------------------------------------------------------------------------

_engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()


# ---------------------------------------------------------------------------
# Session dependency for FastAPI
# ---------------------------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async DB session; auto-close on exit."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Context-manager version of :func:`get_db` for non-FastAPI usage."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ---------------------------------------------------------------------------
# Init / teardown
# ---------------------------------------------------------------------------

async def init_db() -> None:
    """Create all tables if they do not already exist."""
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def init_default_admin() -> None:
    """Create the default admin user if no users exist."""
    from rid.auth import hash_password
    from rid.models import User

    async with AsyncSessionLocal() as session:
        from sqlalchemy import select, func
        result = await session.execute(select(func.count()).select_from(User))
        count = result.scalar()
        if count == 0:
            # Generate a random admin password if none is configured
            raw_password = settings.admin_password
            if not raw_password:
                import secrets
                raw_password = secrets.token_urlsafe(16)
                logger.warning(
                    "RID_ADMIN_PASSWORD is not set. A random password has been generated "
                    "for the default admin account (%s). Password: %s",
                    settings.admin_email,
                    raw_password,
                )
            admin = User(
                email=settings.admin_email,
                name="Administrator",
                password_hash=hash_password(raw_password),
                role="admin",
                is_active=True,
            )
            session.add(admin)
            await session.commit()
            logger.info(
                "Created default admin user: %s (role=%s)",
                settings.admin_email,
                admin.role,
            )


async def close_db() -> None:
    """Dispose the async engine."""
    await _engine.dispose()
