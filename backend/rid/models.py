"""RID SQLAlchemy models — User, Invitation, WeeklyPlan, NewsArticle, Analysis, BusinessPlan, Milestone, AgentPlugin, Setting."""

from __future__ import annotations

import datetime as _dt
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from rid.database import Base


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _now() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    """A user account for RBAC."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="viewer")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime, default=_now)
    last_login: Mapped[Optional[_dt.datetime]] = mapped_column(DateTime, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


# ---------------------------------------------------------------------------
# Invitation
# ---------------------------------------------------------------------------

class Invitation(Base):
    """An email invitation to join the platform."""

    __tablename__ = "invitations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="viewer")
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    expires_at: Mapped[_dt.datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[Optional[_dt.datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime, default=_now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "token": self.token,
            "created_by": self.created_by,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "used_at": self.used_at.isoformat() if self.used_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# WeeklyPlan (formerly Topic)
# ---------------------------------------------------------------------------

class WeeklyPlan(Base):
    """A weekly research plan / area of interest."""

    __tablename__ = "weekly_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, default="")
    keywords: Mapped[Optional[str]] = mapped_column(
        String(500), default=""
    )  # comma-separated
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[_dt.datetime] = mapped_column(
        DateTime, default=_now, onupdate=_now
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    owner: Mapped[Optional["User"]] = relationship("User", lazy="raise")
    news_articles: Mapped[List["NewsArticle"]] = relationship(
        "NewsArticle", back_populates="weekly_plan", cascade="all, delete-orphan"
    )
    analyses: Mapped[List["Analysis"]] = relationship(
        "Analysis", back_populates="weekly_plan", cascade="all, delete-orphan"
    )
    business_plans: Mapped[List["BusinessPlan"]] = relationship(
        "BusinessPlan", back_populates="weekly_plan", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "keywords": self.keywords or "",
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active,
        }


# Backward-compatibility alias
Topic = WeeklyPlan


# ---------------------------------------------------------------------------
# NewsArticle
# ---------------------------------------------------------------------------

class NewsArticle(Base):
    """An aggregated news article linked to a research topic."""

    __tablename__ = "news_articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    weekly_plan_id: Mapped[int] = mapped_column(
        ForeignKey("weekly_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(2000), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(100), default="unknown")
    summary: Mapped[Optional[str]] = mapped_column(Text, default="")
    content: Mapped[Optional[str]] = mapped_column(Text, default="")
    published_at: Mapped[Optional[_dt.datetime]] = mapped_column(DateTime)
    sentiment: Mapped[str] = mapped_column(String(20), default="neutral")
    relevance_score: Mapped[float] = mapped_column(Float, default=0.5)
    fetched_at: Mapped[_dt.datetime] = mapped_column(DateTime, default=_now)

    # Relationships
    weekly_plan: Mapped["WeeklyPlan"] = relationship("WeeklyPlan", back_populates="news_articles")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "weekly_plan_id": self.weekly_plan_id,
            "title": self.title,
            "url": self.url,
            "source": self.source,
            "summary": self.summary or "",
            "content": self.content or "",
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "sentiment": self.sentiment,
            "relevance_score": self.relevance_score,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
        }


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

class Analysis(Base):
    """AI-generated analysis results for a topic."""

    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    weekly_plan_id: Mapped[int] = mapped_column(
        ForeignKey("weekly_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    analysis_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # trend / risk / competitor / summary
    content: Mapped[str] = mapped_column(Text, default="")
    key_insights: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    trends: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    risks: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    opportunities: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime, default=_now)

    # Relationships
    weekly_plan: Mapped["WeeklyPlan"] = relationship("WeeklyPlan", back_populates="analyses")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "weekly_plan_id": self.weekly_plan_id,
            "analysis_type": self.analysis_type,
            "content": self.content,
            "key_insights": self.key_insights,
            "trends": self.trends,
            "risks": self.risks,
            "opportunities": self.opportunities,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# BusinessPlan
# ---------------------------------------------------------------------------

class BusinessPlan(Base):
    """A generated business plan linked to a topic."""

    __tablename__ = "business_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    weekly_plan_id: Mapped[int] = mapped_column(
        ForeignKey("weekly_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    overview: Mapped[Optional[str]] = mapped_column(Text, default="")
    timeframe_months: Mapped[int] = mapped_column(Integer, default=12)
    milestones_json: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    strategies_json: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    risks_mitigations_json: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    kpis_json: Mapped[Optional[str]] = mapped_column(Text, default="[]")
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime, default=_now)

    # Relationships
    weekly_plan: Mapped["WeeklyPlan"] = relationship("WeeklyPlan", back_populates="business_plans")
    milestones: Mapped[List["Milestone"]] = relationship(
        "Milestone", back_populates="plan", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "weekly_plan_id": self.weekly_plan_id,
            "title": self.title,
            "overview": self.overview or "",
            "timeframe_months": self.timeframe_months,
            "milestones_json": self.milestones_json,
            "strategies_json": self.strategies_json,
            "risks_mitigations_json": self.risks_mitigations_json,
            "kpis_json": self.kpis_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# Milestone
# ---------------------------------------------------------------------------

class Milestone(Base):
    """An individual milestone within a business plan."""

    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("business_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, default="")
    target_date: Mapped[Optional[_dt.date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(30), default="pending")
    priority: Mapped[str] = mapped_column(String(20), default="medium")

    # Relationships
    plan: Mapped["BusinessPlan"] = relationship("BusinessPlan", back_populates="milestones")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "title": self.title,
            "description": self.description or "",
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "status": self.status,
            "priority": self.priority,
        }


# ---------------------------------------------------------------------------
# AgentPlugin
# ---------------------------------------------------------------------------

class AgentPlugin(Base):
    """A registered OSS add-on / plugin."""

    __tablename__ = "agent_plugins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, default="")
    module_path: Mapped[str] = mapped_column(String(255), nullable=False)
    config_schema: Mapped[Optional[str]] = mapped_column(
        Text, default="{}"
    )  # JSON schema
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    installed_at: Mapped[_dt.datetime] = mapped_column(DateTime, default=_now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "module_path": self.module_path,
            "config_schema": self.config_schema,
            "is_enabled": self.is_enabled,
            "installed_at": self.installed_at.isoformat() if self.installed_at else None,
        }


# ---------------------------------------------------------------------------
# Setting
# ---------------------------------------------------------------------------

class Setting(Base):
    """Key-value application configuration."""

    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    value: Mapped[Optional[str]] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(50), default="general")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value or "",
            "category": self.category,
        }
