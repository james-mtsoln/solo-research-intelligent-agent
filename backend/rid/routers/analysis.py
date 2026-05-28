"""Analysis router."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.agents.analysis_engine import AnalysisRunner
from rid.agents.base import NewsItem
from rid.agents.llm import OllamaProvider
from rid.auth import get_current_active_user, get_current_user, require_editor
from rid.database import get_db
from rid.models import Analysis, NewsArticle, User

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AnalysisResponse(BaseModel):
    id: int
    weekly_plan_id: int
    analysis_type: str
    content: str
    key_insights: str
    trends: str
    risks: str
    opportunities: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisRunRequest(BaseModel):
    weekly_plan_id: int
    analysis_type: Optional[str] = None  # null = all


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[AnalysisResponse])
async def list_analysis(
    weekly_plan_id: Optional[int] = Query(None),
    analysis_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List analyses with optional filters."""
    query = select(Analysis)
    if weekly_plan_id:
        query = query.where(Analysis.weekly_plan_id == weekly_plan_id)
    if analysis_type:
        query = query.where(Analysis.analysis_type == analysis_type)
    query = query.order_by(desc(Analysis.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [r.to_dict() for r in rows]


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single analysis."""
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis.to_dict()


@router.post("/run", dependencies=[require_editor])
async def run_analysis(
    data: AnalysisRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run analysis for a weekly plan on-demand."""
    if not data.weekly_plan_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="weekly_plan_id is required")

    # Get weekly plan
    from rid.models import WeeklyPlan
    plan = await db.get(WeeklyPlan, data.weekly_plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly plan not found")

    # Get articles
    result = await db.execute(
        select(NewsArticle)
        .where(NewsArticle.weekly_plan_id == data.weekly_plan_id)
        .order_by(desc(NewsArticle.fetched_at))
        .limit(50)
    )
    article_rows = result.scalars().all()
    if not article_rows:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No articles available for analysis")

    articles = [
        NewsItem(
            title=a.title,
            url=a.url,
            source=a.source,
            summary=a.summary or "",
            content=a.content or "",
            published_at=a.published_at,
            sentiment=a.sentiment,
            relevance_score=a.relevance_score,
        )
        for a in article_rows
    ]

    llm = OllamaProvider()
    try:
        runner = AnalysisRunner(llm)

        if data.analysis_type:
            res = await runner.run_one(data.analysis_type, plan.name, articles)
            if res is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown analysis type: {data.analysis_type!r}. "
                           f"Valid types: trend, risk, competitor, summary",
                )
            results = [res]
        else:
            results = await runner.run_all(plan.name, articles)

        # Persist
        for r in results:
            db_analysis = Analysis(**r.to_db_dict(data.weekly_plan_id))
            db.add(db_analysis)
        await db.commit()
    finally:
        await llm.close()

    return {
        "weekly_plan_id": data.weekly_plan_id,
        "analyses_run": len(results),
        "analysis_types": [r.analysis_type for r in results],
    }


@router.delete("/{analysis_id}", dependencies=[require_editor])
async def delete_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an analysis."""
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    await db.delete(analysis)
    await db.commit()
    return {"detail": "Analysis deleted", "id": analysis_id}
