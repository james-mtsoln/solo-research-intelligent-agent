"""Abstract base classes for the RID agent system.

Defines the common interfaces that all plugins, LLM providers, news sources,
and analysers must implement.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, AsyncIterator, Dict, List, Optional


# ---------------------------------------------------------------------------
# News data transfer objects
# ---------------------------------------------------------------------------

@dataclass
class NewsItem:
    """A normalised news item produced by any :class:`NewsSource`."""

    title: str
    url: str
    source: str = "unknown"
    summary: str = ""
    content: str = ""
    published_at: Optional[datetime] = None
    sentiment: str = "neutral"
    relevance_score: float = 0.5

    def to_db_dict(self, weekly_plan_id: int) -> Dict[str, Any]:
        """Convert to a dict matching :class:`rid.models.NewsArticle`."""
        return {
            "weekly_plan_id": weekly_plan_id,
            "title": self.title,
            "url": self.url,
            "source": self.source,
            "summary": self.summary,
            "content": self.content[:4000] if self.content else "",
            "published_at": self.published_at,
            "sentiment": self.sentiment,
            "relevance_score": self.relevance_score,
        }


# ---------------------------------------------------------------------------
# Analysis result DTO
# ---------------------------------------------------------------------------

@dataclass
class AnalysisResult:
    """Structured output from an :class:`Analyzer`."""

    analysis_type: str
    content: str = ""
    key_insights: List[str] = field(default_factory=list)
    trends: List[str] = field(default_factory=list)
    risks: List[str] = field(default_factory=list)
    opportunities: List[str] = field(default_factory=list)

    def to_db_dict(self, weekly_plan_id: int) -> Dict[str, Any]:
        """Serialise to a dict matching :class:`rid.models.Analysis`."""
        import json

        return {
            "weekly_plan_id": weekly_plan_id,
            "analysis_type": self.analysis_type,
            "content": self.content,
            "key_insights": json.dumps(self.key_insights),
            "trends": json.dumps(self.trends),
            "risks": json.dumps(self.risks),
            "opportunities": json.dumps(self.opportunities),
        }


# ---------------------------------------------------------------------------
# Business Plan DTO
# ---------------------------------------------------------------------------

@dataclass
class PlanMilestone:
    """A single milestone inside a generated business plan."""

    title: str
    description: str = ""
    month: int = 1
    status: str = "pending"
    priority: str = "medium"


@dataclass
class BusinessPlanResult:
    """Structured output from :class:`PlanGenerator`."""

    title: str
    overview: str = ""
    timeframe_months: int = 12
    milestones: List[PlanMilestone] = field(default_factory=list)
    strategies: List[str] = field(default_factory=list)
    kpis: List[str] = field(default_factory=list)
    risks_mitigations: List[Dict[str, str]] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Abstract interfaces
# ---------------------------------------------------------------------------

class NewsSource(abc.ABC):
    """Abstract base for all news-fetching backends."""

    name: str = "abstract"

    @abc.abstractmethod
    async def fetch(self, topic_name: str, keywords: str, limit: int = 20) -> List[NewsItem]:
        """Fetch news items for the given topic.

        Args:
            topic_name: Human-readable topic name.
            keywords: Comma-separated keywords.
            limit: Maximum items to return.

        Returns:
            A list of normalised :class:`NewsItem` objects.
        """
        ...


class LLMProvider(abc.ABC):
    """Abstract base for LLM backends (Ollama, OpenAI, etc.)."""

    @abc.abstractmethod
    async def complete(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> str:
        """Send a *complete* (non-streaming) request and return the text."""
        ...

    @abc.abstractmethod
    async def complete_json(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> dict:
        """Send a request and return the response parsed as JSON."""
        ...

    @abc.abstractmethod
    async def stream(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> AsyncIterator[str]:
        """Yield response text chunks as they arrive."""
        ...


class Analyzer(abc.ABC):
    """Abstract base for AI analysers."""

    analysis_type: str = "abstract"

    def __init__(self, llm: LLMProvider) -> None:
        self.llm = llm

    @abc.abstractmethod
    async def analyze(self, topic_name: str, articles: List[NewsItem]) -> AnalysisResult:
        """Run the analysis over a batch of articles."""
        ...


class BasePlugin(abc.ABC):
    """Interface for OSS add-ons discovered by the plugin loader."""

    name: str = "abstract_plugin"
    description: str = ""
    version: str = "0.1.0"

    @abc.abstractmethod
    async def activate(self) -> None:
        """Called when the plugin is enabled."""
        ...

    @abc.abstractmethod
    async def deactivate(self) -> None:
        """Called when the plugin is disabled or uninstalled."""
        ...
