"""Pipeline Orchestrator.

A simple node-based pipeline inspired by agent patterns:
1. Fetch news for a topic
2. Run AI analysis on fetched news
3. Generate / update business plan

Steps can be run individually or as a full pipeline.
"""

from __future__ import annotations

import asyncio
import enum
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine, Dict, List, Optional

from rid.agents.analysis_engine import AnalysisRunner
from rid.agents.base import AnalysisResult, BusinessPlanResult, LLMProvider, NewsItem
from rid.agents.llm import OllamaProvider
from rid.agents.news_engine import NewsAggregator
from rid.agents.plan_generator import PlanGenerator
from rid.config import settings
from rid.database import AsyncSessionLocal
from rid.models import Analysis as AnalysisModel
from rid.models import BusinessPlan, Milestone, NewsArticle, WeeklyPlan

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pipeline state / status
# ---------------------------------------------------------------------------

class PipelineStep(enum.Enum):
    FETCH_NEWS = "fetch_news"
    RUN_ANALYSIS = "run_analysis"
    GENERATE_PLAN = "generate_plan"


@dataclass
class PipelineStatus:
    """Current status of a pipeline run."""

    weekly_plan_id: int
    running: bool = False
    current_step: Optional[str] = None
    last_run: Optional[str] = None
    errors: List[str] = field(default_factory=list)
    result_summary: Dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

class ResearchPipeline:
    """Node-based research pipeline that runs fetch -> analyse -> plan."""

    def __init__(
        self,
        llm: Optional[LLMProvider] = None,
        aggregator: Optional[NewsAggregator] = None,
    ) -> None:
        self.llm = llm or OllamaProvider()
        self.aggregator = aggregator or NewsAggregator()
        self.plan_generator = PlanGenerator(self.llm)
        self.analysis_runner = AnalysisRunner(self.llm)
        self._statuses: Dict[int, PipelineStatus] = {}

    # ----- public API -----

    async def run_full(self, topic_id: int) -> Dict[str, Any]:
        """Run the complete pipeline for a weekly plan."""
        status = PipelineStatus(weekly_plan_id=topic_id)
        self._statuses[topic_id] = status
        status.running = True
        status.last_run = datetime.now(timezone.utc).isoformat()
        status.errors.clear()

        logger.info("Pipeline START for weekly_plan_id=%d", topic_id)

        try:
            # Upfront validation
            async with AsyncSessionLocal() as session:
                topic = await session.get(WeeklyPlan, topic_id)
                if not topic or not topic.is_active:
                    raise ValueError(f"WeeklyPlan {topic_id} not found or inactive.")

            # Step 1 — Fetch
            articles = await self._step_fetch(status)
            if not articles:
                status.errors.append("No articles fetched.")

            # Step 2 — Analyse
            analyses = await self._step_analyse(status, articles)

            # Step 3 — Plan
            plan_id = await self._step_plan(status, articles, analyses)

            status.result_summary = {
                "articles_fetched": len(articles),
                "analyses_run": len(analyses),
                "business_plan_id": plan_id,
            }
            logger.info("Pipeline COMPLETE for weekly_plan_id=%d", topic_id)

        except Exception as exc:
            logger.error("Pipeline FAILED for weekly_plan_id=%d: %s", topic_id, exc, exc_info=True)
            status.errors.append(str(exc))
            status.result_summary = {"error": str(exc)}

        finally:
            status.running = False
            status.current_step = None

        return status.result_summary

    async def run_step(self, topic_id: int, step: PipelineStep) -> Dict[str, Any]:
        """Run a single pipeline step."""
        status = PipelineStatus(weekly_plan_id=topic_id)
        self._statuses[topic_id] = status
        status.running = True
        status.last_run = datetime.now(timezone.utc).isoformat()

        async with AsyncSessionLocal() as session:
            topic = await session.get(WeeklyPlan, topic_id)
            if not topic or not topic.is_active:
                raise ValueError(f"WeeklyPlan {topic_id} not found or inactive.")

            if step == PipelineStep.FETCH_NEWS:
                articles = await self._step_fetch(status)
                return {"articles_fetched": len(articles)}

            elif step == PipelineStep.RUN_ANALYSIS:
                # Load existing articles
                articles = await self._load_articles(session, topic_id)
                analyses = await self._step_analyse(status, articles)
                return {"analyses_run": len(analyses)}

            elif step == PipelineStep.GENERATE_PLAN:
                articles = await self._load_articles(session, topic_id)
                analyses_data = await self._load_analyses(session, topic_id)
                plan_id = await self._step_plan(status, articles, analyses_data)
                return {"business_plan_id": plan_id}

            else:
                raise ValueError(f"Unknown step: {step}")

    def get_status(self, topic_id: int) -> Optional[Dict[str, Any]]:
        """Get the status of the most recent pipeline run for a weekly plan."""
        s = self._statuses.get(topic_id)
        if not s:
            return None
        return {
            "weekly_plan_id": s.weekly_plan_id,
            "running": s.running,
            "current_step": s.current_step,
            "last_run": s.last_run,
            "errors": s.errors,
            "result_summary": s.result_summary,
        }

    # ----- individual steps -----

    async def _step_fetch(self, status: PipelineStatus) -> List[NewsItem]:
        """Fetch news for the topic and persist to DB."""
        status.current_step = PipelineStep.FETCH_NEWS.value
        logger.info("Step: %s for weekly_plan_id=%d", status.current_step, status.weekly_plan_id)

        async with AsyncSessionLocal() as session:
            topic = await session.get(WeeklyPlan, status.weekly_plan_id)
            if not topic or not topic.is_active:
                raise ValueError(f"WeeklyPlan {status.weekly_plan_id} not found or inactive.")

            articles = await self.aggregator.fetch_for_topic(
                topic.name,
                topic.keywords or "",
                limit=settings.fetch_limit,
            )

            if not articles:
                logger.warning("No articles fetched for topic '%s'", topic.name)
                return []

            # Deduplicate against DB
            existing_urls = set()
            from sqlalchemy import select as _select
            result = await session.execute(
                _select(NewsArticle.url).where(NewsArticle.weekly_plan_id == status.weekly_plan_id)
            )
            for row in result:
                existing_urls.add(row[0])

            new_articles = [a for a in articles if a.url not in existing_urls]
            logger.info("Inserting %d new articles (skipped %d duplicates)",
                       len(new_articles), len(articles) - len(new_articles))

            for art in new_articles:
                db_art = NewsArticle(**art.to_db_dict(status.weekly_plan_id))
                session.add(db_art)

            await session.commit()
            return new_articles

    async def _step_analyse(
        self, status: PipelineStatus, articles: List[NewsItem]
    ) -> List[AnalysisResult]:
        """Run all analysers on the articles and persist results."""
        status.current_step = PipelineStep.RUN_ANALYSIS.value
        logger.info("Step: %s for weekly_plan_id=%d", status.current_step, status.weekly_plan_id)

        async with AsyncSessionLocal() as session:
            topic = await session.get(WeeklyPlan, status.weekly_plan_id)
            if not topic or not topic.is_active:
                raise ValueError(f"WeeklyPlan {status.weekly_plan_id} not found or inactive.")

            if not articles:
                logger.warning("No articles to analyse for topic '%s'", topic.name)
                return []

            results = await self.analysis_runner.run_all(topic.name, articles)

            for res in results:
                db_analysis = AnalysisModel(**res.to_db_dict(status.weekly_plan_id))
                session.add(db_analysis)

            await session.commit()
            logger.info("Persisted %d analysis results", len(results))
            return results

    async def _step_plan(
        self,
        status: PipelineStatus,
        articles: List[NewsItem],
        existing_analyses: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[int]:
        """Generate a business plan and persist to DB."""
        status.current_step = PipelineStep.GENERATE_PLAN.value
        logger.info("Step: %s for weekly_plan_id=%d", status.current_step, status.weekly_plan_id)

        async with AsyncSessionLocal() as session:
            topic = await session.get(WeeklyPlan, status.weekly_plan_id)
            if not topic or not topic.is_active:
                raise ValueError(f"WeeklyPlan {status.weekly_plan_id} not found or inactive.")

            plan = await self.plan_generator.generate(
                topic_name=topic.name,
                topic_description=topic.description or "",
                articles=articles,
                existing_analyses=existing_analyses,
                timeframe_months=12,
            )

            plan_id = await self.plan_generator.persist_plan(plan, status.weekly_plan_id, session)
            logger.info("Generated business plan id=%d", plan_id)
            return plan_id

    # ----- DB helpers -----

    @staticmethod
    async def _load_articles(session: Any, topic_id: int) -> List[NewsItem]:
        from sqlalchemy import select
        from rid.models import NewsArticle

        result = await session.execute(
            select(NewsArticle).where(NewsArticle.weekly_plan_id == topic_id)
        )
        rows = result.scalars().all()
        return [
            NewsItem(
                title=r.title,
                url=r.url,
                source=r.source,
                summary=r.summary or "",
                content=r.content or "",
                published_at=r.published_at,
                sentiment=r.sentiment,
                relevance_score=r.relevance_score,
            )
            for r in rows
        ]

    @staticmethod
    async def _load_analyses(session: Any, topic_id: int) -> List[Dict[str, Any]]:
        from sqlalchemy import select
        from rid.models import Analysis

        result = await session.execute(
            select(Analysis).where(Analysis.weekly_plan_id == topic_id)
        )
        rows = result.scalars().all()
        return [r.to_dict() for r in rows]
