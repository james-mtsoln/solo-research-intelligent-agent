"""Invitation router — create, list, accept, resend, delete invitations."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.auth import create_access_token, get_current_active_user, hash_password, require_admin
from rid.config import settings
from rid.database import get_db
from rid.models import Invitation, User

logger = logging.getLogger("rid.invitations_router")

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateInvitationRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="viewer", pattern="^(admin|editor|viewer)$")


class AcceptInvitationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6)


class InvitationResponse(BaseModel):
    id: int
    email: str
    role: str
    token: str
    expires_at: Optional[str] = None
    created_at: Optional[str] = None
    accept_url: str


class InvitationListItem(BaseModel):
    id: int
    email: str
    role: str
    status: str
    created_at: str
    expires_at: str
    used_at: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_token() -> str:
    """Generate a secure random token for invitations."""
    return secrets.token_urlsafe(32)


def _accept_url(token: str) -> str:
    """Build the invitation accept URL.

    The frontend should handle ``/invite/{token}`` and call
    ``POST /api/invitations/{token}/accept``.
    """
    # Use a placeholder — the frontend knows its own URL
    return f"/invite/{token}"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=InvitationResponse, status_code=201, dependencies=[require_admin])
async def create_invitation(
    data: CreateInvitationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new invitation for a user to join.

    Generates a unique token valid for 7 days. Only admins can create
    invitations.
    """
    # Check if email is already registered
    existing_user = await db.execute(select(User).where(User.email == data.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    # Check for pending invitation to same email
    existing_invite = await db.execute(
        select(Invitation)
        .where(Invitation.email == data.email)
        .where(Invitation.used_at.is_(None))
        .where(Invitation.expires_at > datetime.now(timezone.utc))
    )
    if existing_invite.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending invitation already exists for this email",
        )

    token = _generate_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invitation = Invitation(
        email=data.email,
        role=data.role,
        token=token,
        created_by=current_user.id,
        expires_at=expires_at,
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    logger.info(
        "Invitation created by %s for %s with role=%s",
        current_user.email,
        data.email,
        data.role,
    )

    return {
        "id": invitation.id,
        "email": invitation.email,
        "role": invitation.role,
        "token": invitation.token,
        "expires_at": invitation.expires_at.isoformat(),
        "created_at": invitation.created_at.isoformat(),
        "accept_url": _accept_url(invitation.token),
    }


@router.get("", response_model=List[InvitationListItem], dependencies=[require_admin])
async def list_invitations(db: AsyncSession = Depends(get_db)):
    """List all invitations (pending and used)."""
    result = await db.execute(
        select(Invitation).order_by(desc(Invitation.created_at))
    )
    rows = result.scalars().all()

    now = datetime.now(timezone.utc)
    items = []
    for inv in rows:
        if inv.used_at:
            status_str = "used"
        elif inv.expires_at < now:
            status_str = "expired"
        else:
            status_str = "pending"
        items.append({
            "id": inv.id,
            "email": inv.email,
            "role": inv.role,
            "status": status_str,
            "created_at": inv.created_at.isoformat() if inv.created_at else "",
            "expires_at": inv.expires_at.isoformat() if inv.expires_at else "",
            "used_at": inv.used_at.isoformat() if inv.used_at else None,
        })
    return items


@router.delete("/{invitation_id}", dependencies=[require_admin])
async def delete_invitation(invitation_id: int, db: AsyncSession = Depends(get_db)):
    """Cancel and delete an invitation."""
    invitation = await db.get(Invitation, invitation_id)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    await db.delete(invitation)
    await db.commit()
    logger.info("Invitation %d deleted", invitation_id)
    return {"success": True, "detail": "Invitation deleted"}


@router.post("/{token}/accept", response_model=dict)
async def accept_invitation(
    token: str,
    data: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Accept an invitation and create a user account.

    This endpoint is **public** — no authentication required.
    The invitation token itself serves as the authorization.
    """
    result = await db.execute(
        select(Invitation).where(Invitation.token == token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    if invitation.used_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been used",
        )

    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired",
        )

    # Check if email already registered (e.g. via another method)
    existing = await db.execute(select(User).where(User.email == invitation.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    # Create user
    user = User(
        email=invitation.email,
        name=data.name,
        password_hash=hash_password(data.password),
        role=invitation.role,
        is_active=True,
    )
    db.add(user)

    # Mark invitation as used
    invitation.used_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(user)

    # Generate token for immediate login
    access_token = create_access_token({"sub": user.email})

    logger.info(
        "Invitation accepted: %s created user %s (id=%d) with role=%s",
        token[:8] + "...",
        user.email,
        user.id,
        user.role,
    )

    return {
        "token": access_token,
        "user": user.to_dict(),
    }


@router.post("/{token}/resend", dependencies=[require_admin])
async def resend_invitation(token: str, db: AsyncSession = Depends(get_db)):
    """Resend an invitation by generating a new token.

    Returns the new token and accept URL. Actual email sending is the
    responsibility of the caller.
    """
    result = await db.execute(
        select(Invitation).where(Invitation.token == token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )

    if invitation.used_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has already been used",
        )

    # Generate new token and extend expiry
    new_token = _generate_token()
    invitation.token = new_token
    invitation.expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    await db.commit()
    await db.refresh(invitation)

    logger.info("Invitation %d resent with new token", invitation.id)

    return {
        "id": invitation.id,
        "email": invitation.email,
        "token": invitation.token,
        "expires_at": invitation.expires_at.isoformat(),
        "accept_url": _accept_url(invitation.token),
    }
