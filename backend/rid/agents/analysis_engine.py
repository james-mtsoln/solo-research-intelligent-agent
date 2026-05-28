"""AI Analysis Engine.

Four analysers that take a batch of :class:`NewsItem` objects and produce
structured :class:`AnalysisResult` via an :class:`LLMProvider`.
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional
import asyncio

from rid.agents.base import AnalysisResult, Analyzer, LLMProvider, NewsItem

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Prompt helpers
# ---------------------------------------------------------------------------

_SYSTEM_ANALYST = (
    "You are an expert research analyst. You analyse news articles and produce "
    "structured, evidence-based insights. Always respond with valid JSON only."
)


def _articles_to_text(articles: List[NewsItem]) -> str:
    lines = []
    for i, art in enumerate(articles, 1):
        lines.append(f"{i}. {art.title} ({art.source})")
        if art.summary:
            lines.append(f"   Summary: {art.summary[:200]}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 1. News Summariser
# ---------------------------------------------------------------------------

class NewsSummarizer(Analyzer):
    """Produce a concise summary of a batch of news articles."""

    analysis_type = "summary"

    async def analyze(self, topic_name: str, articles: List[NewsItem]) -> AnalysisResult:
        if not articles:
            return AnalysisResult(
                analysis_type=self.analysis_type,
                content="No articles available to summarise.",
            )

        prompt = (
            f"Topic: {topic_name}\n\n"
            f"Articles:\n{_articles_to_text(articles)}\n\n"
            "Provide a concise summary of these news articles. "
            "Highlight the most important developments and themes.\n\n"
            "Respond in JSON format:\n"
            '{"content": "overall summary paragraph", "key_insights": ["insight1", "insight2"]}'
        )
        data = await self.llm.complete_json(prompt, system=_SYSTEM_ANALYST, temperature=0.5)
        return AnalysisResult(
            analysis_type=self.analysis_type,
            content=data.get("content", ""),
            key_insights=data.get("key_insights", []),
        )


# ---------------------------------------------------------------------------
# 2. Trend Analyser
# ---------------------------------------------------------------------------

class TrendAnalyzer(Analyzer):
    """Extract trends, patterns, and sentiment direction."""

    analysis_type = "trend"

    async def analyze(self, topic_name: str, articles: List[NewsItem]) -> AnalysisResult:
        if not articles:
            return AnalysisResult(analysis_type=self.analysis_type, content="No articles for trend analysis.")

        prompt = (
            f"Topic: {topic_name}\n\n"
            f"Articles:\n{_articles_to_text(articles)}\n\n"
            "Analyse the trends, patterns, and overall sentiment direction in these articles.\n\n"
            "Respond in JSON format:\n"
            '{"content": "trend analysis paragraph", "trends": ["trend1", "trend2"], '
            '"key_insights": ["insight1"], "opportunities": ["opportunity1"]}'
        )
        data = await self.llm.complete_json(prompt, system=_SYSTEM_ANALYST, temperature=0.6)
        return AnalysisResult(
            analysis_type=self.analysis_type,
            content=data.get("content", ""),
            trends=data.get("trends", []),
            key_insights=data.get("key_insights", []),
            opportunities=data.get("opportunities", []),
        )


# ---------------------------------------------------------------------------
# 3. Competitor Analyser
# ---------------------------------------------------------------------------

class CompetitorAnalyzer(Analyzer):
    """Identify competitor activities and strategic moves."""

    analysis_type = "competitor"

    async def analyze(self, topic_name: str, articles: List[NewsItem]) -> AnalysisResult:
        if not articles:
            return AnalysisResult(analysis_type=self.analysis_type, content="No articles for competitor analysis.")

        prompt = (
            f"Topic: {topic_name}\n\n"
            f"Articles:\n{_articles_to_text(articles)}\n\n"
            "Identify key competitors, their activities, product launches, partnerships, "
            "and strategic moves mentioned in these articles.\n\n"
            "Respond in JSON format:\n"
            '{"content": "competitor analysis paragraph", "key_insights": ["insight1"], '
            '"risks": ["risk1"], "opportunities": ["opportunity1"]}'
        )
        data = await self.llm.complete_json(prompt, system=_SYSTEM_ANALYST, temperature=0.6)
        return AnalysisResult(
            analysis_type=self.analysis_type,
            content=data.get("content", ""),
            key_insights=data.get("key_insights", []),
            risks=data.get("risks", []),
            opportunities=data.get("opportunities", []),
        )


# ---------------------------------------------------------------------------
# 4. Risk Analyser
# ---------------------------------------------------------------------------

class RiskAnalyzer(Analyzer):
    """Identify risks, threats, and potential disruptions."""

    analysis_type = "risk"

    async def analyze(self, topic_name: str, articles: List[NewsItem]) -> AnalysisResult:
        if not articles:
            return AnalysisResult(analysis_type=self.analysis_type, content="No articles for risk analysis.")

        prompt = (
            f"Topic: {topic_name}\n\n"
            f"Articles:\n{_articles_to_text(articles)}\n\n"
            "Identify risks, threats, regulatory changes, market disruptions, and "
            "potential challenges mentioned or implied in these articles.\n\n"
            "Respond in JSON format:\n"
            '{"content": "risk analysis paragraph", "risks": ["risk1", "risk2"], '
            '"key_insights": ["insight1"]}'
        )
        data = await self.llm.complete_json(prompt, system=_SYSTEM_ANALYST, temperature=0.6)
        return AnalysisResult(
            analysis_type=self.analysis_type,
            content=data.get("content", ""),
            risks=data.get("risks", []),
            key_insights=data.get("key_insights", []),
        )


# ---------------------------------------------------------------------------
# Analysis Runner (runs all analysers)
# ---------------------------------------------------------------------------

class AnalysisRunner:
    """Run all analysers against a topic's news articles."""

    ANALYZER_CLASSES = [NewsSummarizer, TrendAnalyzer, CompetitorAnalyzer, RiskAnalyzer]

    def __init__(self, llm: LLMProvider) -> None:
        self.llm = llm

    async def run_all(self, topic_name: str, articles: List[NewsItem]) -> List[AnalysisResult]:
        """Run every analyser concurrently and return results.

        Raises:
            RuntimeError: If one or more analysers fail.
        """
        instances = [cls(self.llm) for cls in self.ANALYZER_CLASSES]
        results = await asyncio.gather(
            *[an.analyze(topic_name, articles) for an in instances],
            return_exceptions=True,
        )
        output: List[AnalysisResult] = []
        errors: List[Exception] = []
        for res in results:
            if isinstance(res, Exception):
                logger.error("Analysis failed: %s", res)
                errors.append(res)
                continue
            output.append(res)
        if errors:
            raise RuntimeError(
                f"{len(errors)} of {len(results)} analyses failed: "
                + "; ".join(str(e) for e in errors)
            )
        return output

    async def run_one(self, analysis_type: str, topic_name: str, articles: List[NewsItem]) -> Optional[AnalysisResult]:
        """Run a single analyser by type name."""
        for cls in self.ANALYZER_CLASSES:
            if cls.analysis_type == analysis_type:
                return await cls(self.llm).analyze(topic_name, articles)
        logger.warning("Unknown analysis type: %s", analysis_type)
        return None


