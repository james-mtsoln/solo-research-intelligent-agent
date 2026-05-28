"""Advanced RSS Plugin — Enhanced RSS source with keyword filtering and categorisation."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, List, Optional

import feedparser
import httpx

from rid.agents.base import BasePlugin, NewsItem, NewsSource
from rid.config import settings

logger = logging.getLogger(__name__)


class AdvancedRSSPlugin(BasePlugin):
    """An enhanced RSS source plugin with built-in keyword filtering
    and article categorisation.

    Configuration (JSON) expected in the plugin registry::

        {
            "feed_urls": ["https://example.com/feed.xml"],
            "min_keyword_matches": 1,
            "categories": ["tech", "business"]
        }
    """

    name = "rss_advanced"
    description = "Advanced RSS news source with filtering and categorisation"
    version = "1.0.0"

    async def activate(self) -> None:
        logger.info("AdvancedRSSPlugin activated.")

    async def deactivate(self) -> None:
        logger.info("AdvancedRSSPlugin deactivated.")


class AdvancedRSSSource(NewsSource):
    """Production-grade RSS source with keyword filtering and source categorisation."""

    name = "rss_advanced"

    def __init__(
        self,
        feed_urls: Optional[List[str]] = None,
        min_keyword_matches: int = 1,
    ) -> None:
        self.feed_urls = feed_urls or [
            "https://news.google.com/rss",
            "https://feeds.bbci.co.uk/news/technology/rss.xml",
            "https://www.reutersagency.com/feed/?taxonomy=markets&post_type=reuters-best",
        ]
        self.min_keyword_matches = min_keyword_matches
        self._client: Optional[httpx.AsyncClient] = None

    def _client_instance(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def fetch(self, topic_name: str, keywords: str, limit: int = 20) -> List[NewsItem]:
        """Fetch from RSS feeds with keyword filtering."""
        kw_list = [k.strip().lower() for k in keywords.split(",") if k.strip()] if keywords else []
        semaphore = asyncio.Semaphore(5)

        async def _fetch_one(url: str) -> List[NewsItem]:
            async with semaphore:
                try:
                    loop = asyncio.get_running_loop()
                    d = await loop.run_in_executor(None, feedparser.parse, url)
                    items: List[NewsItem] = []
                    for entry in d.entries[:limit]:
                        title = entry.get("title", "")
                        summary = entry.get("summary", "") or entry.get("description", "")
                        # Keyword matching
                        if kw_list:
                            match_count = sum(1 for kw in kw_list if kw in title.lower() or kw in summary.lower())
                            if match_count < self.min_keyword_matches:
                                continue
                        items.append(
                            NewsItem(
                                title=title,
                                url=entry.get("link", ""),
                                source=f"rss_advanced:{self._domain(url)}",
                                summary=summary[:500],
                                content=summary[:2000],
                                published_at=self._parse_date(entry.get("published_parsed")),
                            )
                        )
                    return items
                except Exception as exc:
                    logger.warning("Advanced RSS fetch failed for %s: %s", url, exc)
                    return []

        results = await asyncio.gather(*[_fetch_one(url) for url in self.feed_urls])
        all_items = [item for sublist in results for item in sublist]
        return all_items[:limit]

    @staticmethod
    def _domain(url: str) -> str:
        from urllib.parse import urlparse
        try:
            return urlparse(url).netloc
        except Exception:
            return url

    @staticmethod
    def _parse_date(struct_time: Any) -> Optional[datetime]:
        if struct_time is None:
            return None
        try:
            return datetime(*struct_time[:6], tzinfo=timezone.utc)
        except Exception:
            return None

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
