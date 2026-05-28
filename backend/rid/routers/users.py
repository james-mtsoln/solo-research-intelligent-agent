"""User management router — list, change role, deactivate. Admin only."""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.auth import get_current_active_user, require_admin
from rid.database import get_db
from rid.models import User

logger = logging.getLogger("rid.users_router")

router = APIRouter(dependencies=[require_admin])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|editor|viewer)$")


class UserListItem(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: str


class UserDetailResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: str
    last_login: str | None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[UserListItem])
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all users. Admin only."""
    result = await db.execute(select(User))
    rows = result.scalars().all()
    return [r.to_dict() for r in rows]


@router.put("/{user_id}/role", response_model=UserDetailResponse)
async def update_user_role(
    user_id: int,
    data: RoleUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Change a user's role. Admin only.

    Admins cannot change their own role to prevent lockout.
    """
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent self-role-change to avoid admin lockout
    if target.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )

    target.role = data.role
    await db.commit()
    await db.refresh(target)

    logger.info(
        "User %d role changed to '%s' by admin %s",
        user_id,
        data.role,
        current_user.email,
    )

    return target.to_dict()


@router.delete("/{user_id}")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user account (soft-delete). Admin only.

    Admins cannot deactivate themselves.
    """
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    target.is_active = False
    await db.commit()

    logger.info(
        "User %d (%s) deactivated by admin %s",
        user_id,
        target.email,
        current_user.email,
    )

    return {"success": True, "detail": "User deactivated", "id": user_id}
