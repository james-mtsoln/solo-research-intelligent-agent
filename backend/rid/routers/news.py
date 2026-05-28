"""News article router."""

from __future__ import annotations

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from rid.auth import get_current_active_user, get_current_user, require_editor
from rid.database import get_db
from rid.models import NewsArticle, User

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class NewsArticleResponse(BaseModel):
    id: int
    weekly_plan_id: int
    title: str
    url: str
    source: str
    summary: str
    content: str
    published_at: Optional[str] = None
    sentiment: str
    relevance_score: float
    fetched_at: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[NewsArticleResponse])
async def list_news(
    weekly_plan_id: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List news articles with filters."""
    query = select(NewsArticle)

    if weekly_plan_id:
        query = query.where(NewsArticle.weekly_plan_id == weekly_plan_id)
    if source:
        query = query.where(NewsArticle.source.ilike(f"%{source}%"))
    if sentiment:
        query = query.where(NewsArticle.sentiment == sentiment)
    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.where(NewsArticle.fetched_at >= dt_from)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid date_from: {date_from!r}")
    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.where(NewsArticle.fetched_at <= dt_to)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid date_to: {date_to!r}")

    query = query.order_by(desc(NewsArticle.fetched_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [r.to_dict() for r in rows]


@router.get("/{article_id}", response_model=NewsArticleResponse)
async def get_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single article."""
    article = await db.get(NewsArticle, article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article.to_dict()


@router.delete("/{article_id}", dependencies=[require_editor])
async def delete_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an article."""
    article = await db.get(NewsArticle, article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    await db.delete(article)
    await db.commit()
    return {"detail": "Article deleted", "id": article_id}


@router.get("/stats/overview")
async def news_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return aggregate news statistics."""
    result = await db.execute(select(func.count()).select_from(NewsArticle))
    total = result.scalar()

    result = await db.execute(
        select(NewsArticle.source, func.count())
        .group_by(NewsArticle.source)
        .order_by(desc(func.count()))
    )
    by_source = [{"source": s, "count": c} for s, c in result.all()]

    result = await db.execute(
        select(NewsArticle.sentiment, func.count())
        .group_by(NewsArticle.sentiment)
    )
    by_sentiment = [{"sentiment": s, "count": c} for s, c in result.all()]

    return {
        "total_articles": total,
        "by_source": by_source,
        "by_sentiment": by_sentiment,
    }
