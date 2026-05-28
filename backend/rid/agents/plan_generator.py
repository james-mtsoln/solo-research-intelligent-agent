"""Business Plan Generator.

Generates structured 6-12 month business plans using an LLM and persists
the result to ``BusinessPlan`` + ``Milestone`` tables.
"""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from rid.agents.base import (
    BusinessPlanResult,
    LLMProvider,
    NewsItem,
    PlanMilestone,
)

logger = logging.getLogger(__name__)

_SYSTEM_PLANNER = (
    "You are an expert business strategist. Generate detailed, actionable "
    "business plans with realistic milestones and KPIs. Respond ONLY with valid JSON."
)


class PlanGenerator:
    """Generate a business plan for a research topic based on news + analysis."""

    def __init__(self, llm: LLMProvider) -> None:
        self.llm = llm

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate(
        self,
        topic_name: str,
        topic_description: str,
        articles: List[NewsItem],
        existing_analyses: Optional[List[Dict[str, Any]]] = None,
        timeframe_months: int = 12,
    ) -> BusinessPlanResult:
        """Generate a complete business plan.

        Args:
            topic_name: Name of the research topic.
            topic_description: Description of the topic.
            articles: Recent news articles about the topic.
            existing_analyses: Prior analysis results (if any).
            timeframe_months: Plan duration (6-12 months).

        Returns:
            A :class:`BusinessPlanResult` with milestones, strategies, and KPIs.
        """
        logger.info("Generating business plan for '%s' (%d months)", topic_name, timeframe_months)

        # Build context
        context = self._build_context(topic_name, topic_description, articles, existing_analyses)

        prompt = (
            f"{context}\n\n"
            f"Generate a {timeframe_months}-month strategic business plan for this topic.\n\n"
            "Respond in JSON format with this exact structure:\n"
            "{\n"
            '  "title": "Plan title",\n'
            '  "overview": "Executive summary paragraph",\n'
            '  "timeframe_months": ' + str(timeframe_months) + ',\n'
            '  "milestones": [\n'
            '    {"title": "Milestone title", "description": "Details", "month": 1, "priority": "high"}\n'
            '  ],\n'
            '  "strategies": ["strategy1", "strategy2"],\n'
            '  "kpis": ["KPI 1", "KPI 2"],\n'
            '  "risks_mitigations": [\n'
            '    {"risk": "Risk description", "mitigation": "How to mitigate"}\n'
            '  ]\n'
            "}\n\n"
            "Ensure milestones are spread across all months and cover research, "
            "development, go-to-market, and growth phases. Make strategies specific "
            "and actionable. KPIs must be measurable."
        )

        data = await self.llm.complete_json(prompt, system=_SYSTEM_PLANNER, temperature=0.7)

        if "parse_error" in data:
            logger.error("LLM returned invalid JSON for plan generation: %s", data.get("raw_response", "")[:200])
            return self._fallback_plan(topic_name, timeframe_months)

        return self._parse_plan(data, timeframe_months)

    # ------------------------------------------------------------------
    # Persistence helpers (called by routers)
    # ------------------------------------------------------------------

    async def persist_plan(
        self,
        plan: BusinessPlanResult,
        topic_id: int,
        db_session: Any,
    ) -> int:
        """Save a :class:`BusinessPlanResult` to the database.

        Returns the created ``BusinessPlan.id``.
        """
        from rid.models import BusinessPlan, Milestone

        # Create plan record
        bp = BusinessPlan(
            weekly_plan_id=topic_id,
            title=plan.title,
            overview=plan.overview,
            timeframe_months=plan.timeframe_months,
            milestones_json=json.dumps([self._milestone_to_dict(m) for m in plan.milestones]),
            strategies_json=json.dumps(plan.strategies),
            risks_mitigations_json=json.dumps(plan.risks_mitigations),
            kpis_json=json.dumps(plan.kpis),
        )
        db_session.add(bp)
        await db_session.flush()  # get bp.id

        # Create milestone records
        base_date = datetime.now().date().replace(day=1)
        for ms in plan.milestones:
            target = base_date + timedelta(days=30 * (ms.month - 1))
            milestone = Milestone(
                plan_id=bp.id,
                title=ms.title,
                description=ms.description,
                target_date=target,
                status=ms.status,
                priority=ms.priority,
            )
            db_session.add(milestone)

        await db_session.commit()
        logger.info("Persisted business plan id=%d with %d milestones", bp.id, len(plan.milestones))
        return bp.id

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_context(
        topic_name: str,
        topic_description: str,
        articles: List[NewsItem],
        existing_analyses: Optional[List[Dict[str, Any]]],
    ) -> str:
        lines = [
            f"Topic: {topic_name}",
            f"Description: {topic_description}",
            "",
            f"Recent News ({len(articles)} articles):",
        ]
        for i, art in enumerate(articles[:15], 1):
            lines.append(f"{i}. {art.title} — {art.summary[:150]}")

        if existing_analyses:
            lines.append("\nPrevious Analyses:")
            for a in existing_analyses:
                lines.append(f"- [{a.get('analysis_type', 'unknown')}] {a.get('content', '')[:200]}")

        return "\n".join(lines)

    @staticmethod
    def _parse_plan(data: dict, default_timeframe: int) -> BusinessPlanResult:
        """Parse LLM JSON into a :class:`BusinessPlanResult`."""
        milestones_raw = data.get("milestones", [])
        milestones: List[PlanMilestone] = []
        for m in milestones_raw:
            month = max(1, min(int(m.get("month", 1)), default_timeframe))
            milestones.append(
                PlanMilestone(
                    title=str(m.get("title", "Untitled")),
                    description=str(m.get("description", "")),
                    month=month,
                    status=str(m.get("status", "pending")),
                    priority=str(m.get("priority", "medium")),
                )
            )

        # Sort by month
        milestones.sort(key=lambda x: x.month)

        risks_raw = data.get("risks_mitigations", [])
        risks_mitigations: List[Dict[str, str]] = []
        for r in risks_raw:
            risks_mitigations.append(
                {
                    "risk": str(r.get("risk", "")),
                    "mitigation": str(r.get("mitigation", "")),
                }
            )

        return BusinessPlanResult(
            title=str(data.get("title", "Business Plan")),
            overview=str(data.get("overview", "")),
            timeframe_months=int(data.get("timeframe_months", default_timeframe)),
            milestones=milestones,
            strategies=[str(s) for s in data.get("strategies", [])],
            kpis=[str(k) for k in data.get("kpis", [])],
            risks_mitigations=risks_mitigations,
        )

    @staticmethod
    def _fallback_plan(topic_name: str, timeframe_months: int) -> BusinessPlanResult:
        """Return a minimal fallback plan when LLM output is broken."""
        milestones = [
            PlanMilestone(
                title=f"Month {m} milestone",
                description="Auto-generated fallback milestone.",
                month=m,
                priority="medium",
            )
            for m in range(1, timeframe_months + 1)
        ]
        return BusinessPlanResult(
            title=f"{topic_name} — Strategic Plan",
            overview=f"An auto-generated {timeframe_months}-month plan for {topic_name}.",
            timeframe_months=timeframe_months,
            milestones=milestones,
            strategies=["Research market dynamics", "Develop strategic initiatives", "Execute and iterate"],
            kpis=["Market share growth", "Revenue targets", "Customer satisfaction"],
            risks_mitigations=[{"risk": "Market uncertainty", "mitigation": "Continuous monitoring and agile adaptation"}],
        )

    @staticmethod
    def _milestone_to_dict(m: PlanMilestone) -> dict:
        return {
            "title": m.title,
            "description": m.description,
            "month": m.month,
            "status": m.status,
            "priority": m.priority,
        }
