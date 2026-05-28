"""RID Authentication — password hashing, JWT tokens, and FastAPI dependencies."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.config import settings
from rid.database import get_db
from rid.models import User

logger = logging.getLogger("rid.auth")

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT token management
# ---------------------------------------------------------------------------

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token.

    Args:
        data: Dictionary of claims to encode (e.g. ``{"sub": user.email}``).
        expires_delta: Optional custom expiration delta. Defaults to 7 days.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token.

    Args:
        token: JWT string from the Authorization header.

    Returns:
        Decoded payload dictionary, or ``None`` if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# OAuth2 scheme — token URL points to the login endpoint
# ---------------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False,
)


# ---------------------------------------------------------------------------
# Current-user dependencies
# ---------------------------------------------------------------------------

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Resolve the current user from the JWT token in the request.

    Returns ``None`` when no token is provided (for optional auth).
    Raises ``401`` when a token is present but invalid.
    """
    if token is None:
        return None

    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email: Optional[str] = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


async def get_current_active_user(
    user: Optional[User] = Depends(get_current_user),
) -> User:
    """Dependency that requires an authenticated, active user.

    Raises ``401`` if no valid user is present in the request.
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ---------------------------------------------------------------------------
# Role-based access control
# ---------------------------------------------------------------------------

def require_role(role: str):
    """Create a dependency that requires the current user to have *at least*
    the given role (``admin`` always passes).

    Usage::

        @router.post("/plans", dependencies=[require_role("editor")])
        async def create_plan(...):
            ...

    Args:
        role: Minimum required role (``"editor"`` or ``"viewer"``).

    Returns:
        A ``Depends`` callable suitable for FastAPI ``dependencies=[...]``.

    Raises:
        ValueError: If ``role`` is not a known role.
    """
    known_roles = {"admin", "editor", "viewer"}
    if role not in known_roles:
        raise ValueError(f"Unknown role: {role!r}. Must be one of {known_roles}")

    def _checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in ("admin", role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return Depends(_checker)


# Convenience shortcuts
require_admin = require_role("admin")
require_editor = require_role("editor")
