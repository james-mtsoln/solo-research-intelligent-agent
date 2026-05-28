"""WeeklyPlan CRUD router."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.auth import get_current_active_user, get_current_user, require_editor
from rid.database import get_db
from rid.models import User, WeeklyPlan

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class WeeklyPlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    keywords: str = ""


class WeeklyPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None
    is_active: Optional[bool] = None


class WeeklyPlanResponse(WeeklyPlanCreate):
    id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[WeeklyPlanResponse])
async def list_weekly_plans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all weekly plans with pagination."""
    query = select(WeeklyPlan)
    if active_only:
        query = query.where(WeeklyPlan.is_active == True)
    # Non-admins only see their own plans
    if current_user.role != "admin":
        query = query.where(WeeklyPlan.user_id == current_user.id)
    query = query.offset(skip).limit(limit).order_by(WeeklyPlan.created_at.desc())
    result = await db.execute(query)
    rows = result.scalars().all()
    return [r.to_dict() for r in rows]


@router.post(
    "",
    response_model=WeeklyPlanResponse,
    status_code=201,
    dependencies=[require_editor],
)
async def create_weekly_plan(
    data: WeeklyPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new weekly plan."""
    plan = WeeklyPlan(
        name=data.name,
        description=data.description,
        keywords=data.keywords,
        user_id=current_user.id,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()


@router.get("/{plan_id}", response_model=WeeklyPlanResponse)
async def get_weekly_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single weekly plan by ID."""
    plan = await db.get(WeeklyPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly plan not found")
    return plan.to_dict()


@router.put(
    "/{plan_id}",
    response_model=WeeklyPlanResponse,
    dependencies=[require_editor],
)
async def update_weekly_plan(
    plan_id: int,
    data: WeeklyPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a weekly plan."""
    plan = await db.get(WeeklyPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly plan not found")
    if data.name is not None:
        plan.name = data.name
    if data.description is not None:
        plan.description = data.description
    if data.keywords is not None:
        plan.keywords = data.keywords
    if data.is_active is not None:
        plan.is_active = data.is_active
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()


@router.delete("/{plan_id}", dependencies=[require_editor])
async def delete_weekly_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a weekly plan (set is_active=False)."""
    plan = await db.get(WeeklyPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly plan not found")
    plan.is_active = False
    await db.commit()
    return {"detail": "Weekly plan deactivated", "id": plan_id}
