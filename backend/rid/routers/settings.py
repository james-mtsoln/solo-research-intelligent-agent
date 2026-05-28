"""App settings router."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.auth import get_current_active_user, get_current_user, require_admin
from rid.database import get_db
from rid.models import Setting, User

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SettingCreate(BaseModel):
    key: str
    value: str = ""
    category: str = "general"


class SettingUpdate(BaseModel):
    value: str
    category: Optional[str] = None


class SettingResponse(BaseModel):
    id: int
    key: str
    value: str
    category: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[SettingResponse])
async def list_settings(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all settings, optionally filtered by category."""
    query = select(Setting)
    if category:
        query = query.where(Setting.category == category)
    result = await db.execute(query)
    rows = result.scalars().all()
    data = [r.to_dict() for r in rows]
    # Hide sensitive settings from non-admin users
    if current_user.role != "admin":
        sensitive_keys = {"openai_key", "kimi_key", "gemini_key", "newsapi_key", "secret_key"}
        for item in data:
            if item.get("key") in sensitive_keys:
                item["value"] = "***REDACTED***"
    return data


@router.get("/{key}", response_model=SettingResponse)
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific setting by key."""
    result = await db.execute(select(Setting).where(Setting.key == key))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setting not found")
    data = row.to_dict()
    # Hide sensitive settings from non-admin users
    if current_user.role != "admin":
        sensitive_keys = {"openai_key", "kimi_key", "gemini_key", "newsapi_key", "secret_key"}
        if data.get("key") in sensitive_keys:
            data["value"] = "***REDACTED***"
    return data


@router.put("/{key}", response_model=SettingResponse, dependencies=[require_admin])
async def update_setting(
    key: str,
    data: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a setting value."""
    result = await db.execute(select(Setting).where(Setting.key == key))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found",
        )
    row.value = data.value
    if data.category is not None:
        row.category = data.category
    await db.commit()
    await db.refresh(row)
    return row.to_dict()


@router.post("", response_model=SettingResponse, status_code=201, dependencies=[require_admin])
async def create_setting(
    data: SettingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new setting."""
    existing = await db.execute(select(Setting).where(Setting.key == data.key))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Setting '{data.key}' already exists")
    setting = Setting(key=data.key, value=data.value, category=data.category)
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    return setting.to_dict()


@router.delete("/{key}", dependencies=[require_admin])
async def delete_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a setting."""
    result = await db.execute(select(Setting).where(Setting.key == key))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setting not found")
    await db.delete(row)
    await db.commit()
    return {"detail": "Setting deleted", "key": key}
