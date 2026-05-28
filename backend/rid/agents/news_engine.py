"""News Aggregation Engine.

Fetches news from multiple async sources (RSS, NewsAPI, web scraping),
deduplicates by URL, and returns normalised :class:`NewsItem` objects.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import feedparser
import httpx
from bs4 import BeautifulSoup

from rid.agents.base import NewsItem, NewsSource
from rid.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# RSS Source
# ---------------------------------------------------------------------------

class RSSSource(NewsSource):
    """Fetch news from RSS / Atom feeds using ``feedparser``."""

    name = "rss"

    def __init__(self, feed_urls: Optional[List[str]] = None) -> None:
        self.feed_urls = feed_urls or [
            "https://news.google.com/rss",
            "https://feeds.bbci.co.uk/news/technology/rss.xml",
        ]

    async def fetch(self, topic_name: str, keywords: str, limit: int = 20) -> List[NewsItem]:
        """Fetch from each RSS feed concurrently."""
        semaphore = asyncio.Semaphore(5)

        async def _fetch_one(url: str) -> List[NewsItem]:
            async with semaphore:
                try:
                    # feedparser is synchronous — run in thread pool
                    loop = asyncio.get_running_loop()
                    d = await loop.run_in_executor(None, feedparser.parse, url)
                    items: List[NewsItem] = []
                    for entry in d.entries[:limit]:
                        title = entry.get("title", "")
                        # Basic keyword filtering if keywords provided
                        text_to_check = f"{title} {entry.get('summary', '')}"
                        if keywords and not self._matches_keywords(text_to_check, keywords):
                            continue
                        items.append(
                            NewsItem(
                                title=title,
                                url=entry.get("link", ""),
                                source=f"rss:{self._domain(url)}",
                                summary=entry.get("summary", "")[:500],
                                content=entry.get("description", "")[:2000],
                                published_at=self._parse_date(entry.get("published_parsed")),
                            )
                        )
                    return items
                except Exception as exc:
                    logger.warning("RSS fetch failed for %s: %s", url, exc)
                    return []

        results = await asyncio.gather(*[_fetch_one(url) for url in self.feed_urls])
        all_items = [item for sublist in results for item in sublist]
        return all_items[:limit]

    # ----- helpers -----

    @staticmethod
    def _matches_keywords(text: str, keywords: str) -> bool:
        words = [w.strip().lower() for w in keywords.split(",") if w.strip()]
        text_lower = text.lower()
        return any(w in text_lower for w in words)

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


# ---------------------------------------------------------------------------
# NewsAPI Source
# ---------------------------------------------------------------------------

class NewsAPISource(NewsSource):
    """Fetch news from NewsAPI.org (requires API key)."""

    name = "newsapi"

    def __init__(self, api_key: Optional[str] = settings.newsapi_key) -> None:
        self.api_key = api_key
        self._client: Optional[httpx.AsyncClient] = None

    def _client_instance(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=60.0)
        return self._client

    async def fetch(self, topic_name: str, keywords: str, limit: int = 20) -> List[NewsItem]:
        if not self.api_key:
            logger.info("NewsAPI key not configured — skipping NewsAPISource.")
            return []

        query = topic_name if not keywords else f"{topic_name} {keywords.replace(',', ' OR ')}"
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query,
            "pageSize": min(limit, 100),
            "sortBy": "relevancy",
            "apiKey": self.api_key,
            "language": "en",
        }
        try:
            resp = await self._client_instance().get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            articles = data.get("articles", [])
            items: List[NewsItem] = []
            for art in articles:
                items.append(
                    NewsItem(
                        title=art.get("title", ""),
                        url=art.get("url", ""),
                        source=f"newsapi:{art.get('source', {}).get('name', 'newsapi')}",
                        summary=art.get("description", "")[:500],
                        content=art.get("content", "")[:2000],
                        published_at=self._parse_iso(art.get("publishedAt")),
                    )
                )
            return items
        except httpx.HTTPError as exc:
            logger.warning("NewsAPI request failed: %s", exc)
            return []
        except Exception as exc:
            logger.warning("NewsAPI unexpected error: %s", exc)
            return []

    @staticmethod
    def _parse_iso(iso_str: Optional[str]) -> Optional[datetime]:
        if not iso_str:
            return None
        try:
            return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        except Exception:
            return None

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# ---------------------------------------------------------------------------
# Web Scraper Source (fallback)
# ---------------------------------------------------------------------------

class WebScraperSource(NewsSource):
    """Basic web scraping fallback using DuckDuckGo HTML results."""

    name = "scraper"

    def __init__(self) -> None:
        self._client: Optional[httpx.AsyncClient] = None

    def _client_instance(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=60.0,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    )
                },
            )
        return self._client

    async def fetch(self, topic_name: str, keywords: str, limit: int = 20) -> List[NewsItem]:
        """Scrape DuckDuckGo lite HTML search results."""
        from urllib.parse import urlparse

        query = f"{topic_name} {keywords}".strip()
        try:
            resp = await self._client_instance().get(
                "https://lite.duckduckgo.com/lite/",
                params={"q": query, "kl": "us-en"},
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")
            items: List[NewsItem] = []
            rows = soup.find_all("tr")
            for row in rows:
                link_tag = row.find("a", class_="result__a")
                if not link_tag:
                    continue
                title = link_tag.get_text(strip=True)
                href = link_tag.get("href", "")
                if not href or href.startswith("/"):
                    continue
                # Validate URL scheme
                parsed = urlparse(href)
                if parsed.scheme not in ("http", "https"):
                    continue
                # Extract snippet
                snippet_tag = row.find("td", class_="result__snippet")
                snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""
                items.append(
                    NewsItem(
                        title=title,
                        url=href,
                        source="scraper:duckduckgo",
                        summary=snippet[:500],
                        content=snippet[:2000],
                        published_at=None,
                    )
                )
                if len(items) >= limit:
                    break
            return items
        except httpx.HTTPError as exc:
            logger.warning("Web scraper HTTP error: %s", exc)
            return []
        except Exception as exc:
            logger.warning("Web scraper unexpected error: %s", exc)
            return []

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# ---------------------------------------------------------------------------
# Aggregator (combines all sources)
# ---------------------------------------------------------------------------

class NewsAggregator:
    """Fetch from multiple :class:`NewsSource` instances concurrently,
    deduplicate by URL hash, and return merged results."""

    def __init__(self, sources: Optional[List[NewsSource]] = None) -> None:
        self.sources = sources or [RSSSource(), NewsAPISource(), WebScraperSource()]

    async def fetch_for_topic(
        self,
        topic_name: str,
        keywords: str,
        limit: int = 50,
    ) -> List[NewsItem]:
        """Fetch from all sources in parallel, deduplicate, sort by relevance."""
        logger.info("Fetching news for topic '%s' (keywords: %s)", topic_name, keywords)
        results = await asyncio.gather(
            *[src.fetch(topic_name, keywords, limit=limit) for src in self.sources]
        )

        # Deduplicate by URL
        seen: set = set()
        unique_items: List[NewsItem] = []
        for sublist in results:
            for item in sublist:
                if item.url not in seen:
                    seen.add(item.url)
                    unique_items.append(item)

        # Simple heuristic: keyword match in title = higher relevance
        for item in unique_items:
            score = 0.5
            if keywords:
                kw_list = [k.strip().lower() for k in keywords.split(",")]
                title_lower = item.title.lower()
                for kw in kw_list:
                    if kw in title_lower:
                        score += 0.1
            item.relevance_score = min(score, 1.0)

        unique_items.sort(key=lambda x: x.relevance_score, reverse=True)
        return unique_items[:limit]

    async def close(self) -> None:
        for src in self.sources:
            if hasattr(src, "close"):
                try:
                    await src.close()
                except Exception as exc:
                    logger.warning("Error closing %s: %s", src.name, exc)
