"""Business Plan router."""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.auth import get_current_active_user, get_current_user, require_editor
from rid.database import get_db
from rid.models import BusinessPlan, Milestone, User
from sqlalchemy.orm import selectinload

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PlanCreate(BaseModel):
    weekly_plan_id: int
    title: str = Field(..., min_length=1)
    overview: str = ""
    timeframe_months: int = Field(12, ge=6, le=24)
    milestones_json: str = "[]"
    strategies_json: str = "[]"


class PlanUpdate(BaseModel):
    title: Optional[str] = None
    overview: Optional[str] = None
    timeframe_months: Optional[int] = None
    milestones_json: Optional[str] = None
    strategies_json: Optional[str] = None


class MilestoneUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    target_date: Optional[str] = None


class PlanResponse(BaseModel):
    id: int
    weekly_plan_id: int
    title: str
    overview: str
    timeframe_months: int
    milestones_json: str
    strategies_json: str
    created_at: Optional[str] = None
    milestones: list = Field(default_factory=list)

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[PlanResponse])
async def list_plans(
    weekly_plan_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List business plans."""
    query = select(BusinessPlan)
    if weekly_plan_id:
        query = query.where(BusinessPlan.weekly_plan_id == weekly_plan_id)
    query = query.order_by(desc(BusinessPlan.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [r.to_dict() for r in rows]


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a business plan with its milestones."""
    result = await db.execute(
        select(BusinessPlan).where(BusinessPlan.id == plan_id).options(selectinload(BusinessPlan.milestones))
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business plan not found")
    data = plan.to_dict()
    data["milestones"] = [m.to_dict() for m in plan.milestones]
    return data


@router.post("", response_model=PlanResponse, status_code=201, dependencies=[require_editor])
async def create_plan(
    data: PlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually create a business plan."""
    plan = BusinessPlan(
        weekly_plan_id=data.weekly_plan_id,
        title=data.title,
        overview=data.overview,
        timeframe_months=data.timeframe_months,
        milestones_json=data.milestones_json,
        strategies_json=data.strategies_json,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()


@router.put("/{plan_id}", response_model=PlanResponse, dependencies=[require_editor])
async def update_plan(
    plan_id: int,
    data: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a business plan."""
    plan = await db.get(BusinessPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business plan not found")
    if data.title is not None:
        plan.title = data.title
    if data.overview is not None:
        plan.overview = data.overview
    if data.timeframe_months is not None:
        plan.timeframe_months = data.timeframe_months
    if data.milestones_json is not None:
        plan.milestones_json = data.milestones_json
    if data.strategies_json is not None:
        plan.strategies_json = data.strategies_json
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()


@router.delete("/{plan_id}", dependencies=[require_editor])
async def delete_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a business plan."""
    plan = await db.get(BusinessPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business plan not found")
    await db.delete(plan)
    await db.commit()
    return {"detail": "Business plan deleted", "id": plan_id}


# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------

@router.get("/{plan_id}/milestones")
async def list_milestones(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List milestones for a plan."""
    result = await db.execute(
        select(Milestone).where(Milestone.plan_id == plan_id).order_by(Milestone.target_date)
    )
    rows = result.scalars().all()
    return [r.to_dict() for r in rows]


@router.patch("/milestones/{milestone_id}", dependencies=[require_editor])
async def update_milestone(
    milestone_id: int,
    data: MilestoneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a milestone (status, priority, target_date)."""
    ms = await db.get(Milestone, milestone_id)
    if not ms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    if data.status is not None:
        ms.status = data.status
    if data.priority is not None:
        ms.priority = data.priority
    if data.target_date is not None:
        try:
            ms.target_date = date.fromisoformat(data.target_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid target_date: {data.target_date!r}. Use ISO format (YYYY-MM-DD).",
            )
    await db.commit()
    await db.refresh(ms)
    return ms.to_dict()
