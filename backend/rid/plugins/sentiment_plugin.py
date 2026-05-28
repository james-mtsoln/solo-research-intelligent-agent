"""Enhanced Sentiment Analysis Plugin.

Provides a sentiment scorer that uses a simple lexicon-based approach
and can be swapped in as a post-processing step for news articles.
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List

from rid.agents.base import BasePlugin, NewsItem

logger = logging.getLogger(__name__)

# Simple lexicon for fast local sentiment scoring
_POSITIVE = {
    "good", "great", "excellent", "amazing", "outstanding", "strong", "growth",
    "profit", "gain", "rise", "boost", "surge", "soar", "rally", "breakthrough",
    "innovation", "success", "win", "positive", "optimistic", "bullish", "record",
    "expand", "launch", "partner", "deal", "agreement", "milestone", "promising",
    "leading", "top", "best", "advance", "progress", "recover", "upgrade",
}

_NEGATIVE = {
    "bad", "terrible", "poor", "weak", "loss", "decline", "fall", "drop", "crash",
    "risk", "threat", "crisis", "downgrade", "cut", "layoff", "fraud", "scandal",
    "fail", "failure", "bankrupt", "debt", "inflation", "recession", "bearish",
    "concern", "warn", "warning", "plunge", "tumble", "slide", "struggle",
    "delay", "cancel", "suspend", "investigate", "penalty", "fine", "lawsuit",
}


class SentimentPlugin(BasePlugin):
    """Enhanced sentiment analysis plugin for news articles.

    Uses a local lexicon for fast sentiment scoring without requiring
    an external API call.
    """

    name = "sentiment_plugin"
    description = "Fast lexicon-based sentiment analysis for news articles"
    version = "1.0.0"

    def __init__(self) -> None:
        self.scorer = SentimentScorer()

    async def activate(self) -> None:
        logger.info("SentimentPlugin activated with %d positive / %d negative words.",
                     len(_POSITIVE), len(_NEGATIVE))

    async def deactivate(self) -> None:
        logger.info("SentimentPlugin deactivated.")

    def score(self, text: str) -> str:
        """Score a piece of text and return 'positive', 'neutral', or 'negative'."""
        return self.scorer.score(text)

    def score_article(self, article: NewsItem) -> str:
        """Score a news article's title + summary."""
        text = f"{article.title} {article.summary}"
        return self.scorer.score(text)


class SentimentScorer:
    """Standalone sentiment scorer using a lexicon-based approach."""

    def score(self, text: str) -> str:
        """Return sentiment label for the given text."""
        if not text:
            return "neutral"

        words = set(re.findall(r"\b\w+\b", text.lower()))
        pos_count = sum(1 for w in words if w in _POSITIVE)
        neg_count = sum(1 for w in words if w in _NEGATIVE)
        total = pos_count + neg_count

        if total == 0:
            return "neutral"

        ratio = (pos_count - neg_count) / total
        if ratio > 0.1:
            return "positive"
        elif ratio < -0.1:
            return "negative"
        return "neutral"

    def score_with_confidence(self, text: str) -> Dict[str, float]:
        """Return sentiment with confidence scores."""
        if not text:
            return {"positive": 0.33, "neutral": 0.34, "negative": 0.33}

        words = set(re.findall(r"\b\w+\b", text.lower()))
        pos_count = sum(1 for w in words if w in _POSITIVE)
        neg_count = sum(1 for w in words if w in _NEGATIVE)
        neutral_count = max(len(words) - pos_count - neg_count, 0)
        total = max(pos_count + neg_count + neutral_count, 1)

        return {
            "positive": round(pos_count / total, 3),
            "neutral": round(neutral_count / total, 3),
            "negative": round(neg_count / total, 3),
        }

    def batch_score(self, articles: List[NewsItem]) -> Dict[str, int]:
        """Score a batch of articles and return sentiment distribution."""
        counts: Dict[str, int] = {"positive": 0, "neutral": 0, "negative": 0}
        for art in articles:
            text = f"{art.title} {art.summary}"
            counts[self.score(text)] += 1
        return counts
