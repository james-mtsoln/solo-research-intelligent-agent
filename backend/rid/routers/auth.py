"""Authentication router — register, login, me."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.auth import (
    create_access_token,
    get_current_active_user,
    hash_password,
    verify_password,
)
from rid.database import get_db
from rid.models import User

logger = logging.getLogger("rid.auth_router")

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool


class ProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """Register a new user account.

    Creates a user with the ``"viewer"`` role and returns a JWT access token.
    """
    # Check for existing email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        role="viewer",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.email})
    logger.info("New user registered: %s (id=%d)", user.email, user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """Authenticate with email and password.

    Returns a JWT access token valid for 7 days.
    """
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user is None or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Update last_login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    token = create_access_token({"sub": user.email})
    logger.info("User logged in: %s (id=%d)", user.email, user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)) -> dict:
    """Logout the current user.

    This is a no-op on the server side — clients should delete the token.
    """
    logger.info("User logged out: %s (id=%d)", current_user.email, current_user.id)
    return {"detail": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)) -> dict:
    """Get the current authenticated user's profile."""
    return current_user.to_dict()


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update the current user's profile (name only)."""
    current_user.name = data.name
    await db.commit()
    await db.refresh(current_user)
    return current_user.to_dict()
