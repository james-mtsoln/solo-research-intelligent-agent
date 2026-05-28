"""LLM Providers — Ollama (local, default) and OpenAI-compatible (optional).

All providers implement the :class:`rid.agents.base.LLMProvider` interface and
use ``httpx.AsyncClient`` for non-blocking HTTP I/O.
"""

from __future__ import annotations

import json
import logging
from typing import AsyncIterator, Optional

import httpx

from rid.agents.base import LLMProvider
from rid.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Ollama Provider (local, offline-first)
# ---------------------------------------------------------------------------

class OllamaProvider(LLMProvider):
    """Talk to a local Ollama instance.

    Ollama must be running locally (default: http://localhost:11434).
    Pull a model first, e.g. ``ollama pull llama3.2``.
    """

    def __init__(self, base_url: str = settings.ollama_url, model: str = settings.ollama_model) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._client: Optional[httpx.AsyncClient] = None

    # ----- internal helpers -----

    def _client_instance(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=300.0)
        return self._client

    def _chat_payload(self, prompt: str, system: Optional[str], temperature: float, stream: bool = False) -> dict:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            "options": {"temperature": temperature},
        }

    # ----- public API -----

    async def complete(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> str:
        """Non-streaming completion via ``/api/chat``."""
        payload = self._chat_payload(prompt, system, temperature, stream=False)
        try:
            resp = await self._client_instance().post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "").strip()
        except httpx.HTTPError as exc:
            logger.error("Ollama HTTP error: %s", exc)
            return f"[ERROR: Ollama request failed — {exc}]"
        except Exception as exc:
            logger.error("Ollama unexpected error: %s", exc)
            return f"[ERROR: {exc}]"

    async def complete_json(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> dict:
        """Ask the model to return *only* valid JSON and parse it."""
        json_system = (system or "") + "\nRespond ONLY with valid JSON. No markdown, no prose."
        text = await self.complete(prompt, system=json_system, temperature=temperature)
        # Strip markdown fences if present
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.warning("Ollama returned non-JSON: %s… — %s", cleaned[:120], exc)
            return {"raw_response": cleaned, "parse_error": str(exc)}

    async def stream(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> AsyncIterator[str]:
        """Stream response chunks from Ollama."""
        payload = self._chat_payload(prompt, system, temperature, stream=True)
        try:
            async with self._client_instance().stream("POST", f"{self.base_url}/api/chat", json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if chunk.get("done"):
                        break
        except httpx.HTTPError as exc:
            logger.error("Ollama stream error: %s", exc)
            yield f"[ERROR: Ollama stream failed — {exc}]"

    async def health(self) -> dict:
        """Check whether Ollama is reachable and the model is loaded."""
        try:
            resp = await self._client_instance().get(f"{self.base_url}/api/tags")
            resp.raise_for_status()
            models = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            return {
                "reachable": True,
                "model": self.model,
                "model_available": self.model in model_names,
                "available_models": model_names,
            }
        except Exception as exc:
            return {"reachable": False, "error": str(exc), "model": self.model}

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# ---------------------------------------------------------------------------
# OpenAI-compatible Provider (optional external LLM)
# ---------------------------------------------------------------------------

class OpenAIProvider(LLMProvider):
    """Talk to any OpenAI-compatible API endpoint (OpenAI, vLLM, etc.)."""

    def __init__(
        self,
        api_key: Optional[str] = settings.openai_key,
        base_url: str = settings.openai_url,
        model: str = "gpt-4o-mini",
    ) -> None:
        if not api_key:
            raise ValueError("OpenAI API key is required. Set RID_OPENAI_KEY env var.")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._client: Optional[httpx.AsyncClient] = None

    def _client_instance(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=300.0,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    def _chat_payload(self, prompt: str, system: Optional[str], temperature: float, stream: bool = False) -> dict:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        }

    async def complete(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> str:
        """Non-streaming completion."""
        payload = self._chat_payload(prompt, system, temperature, stream=False)
        try:
            resp = await self._client_instance().post(f"{self.base_url}/chat/completions", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except httpx.HTTPError as exc:
            logger.error("OpenAI HTTP error: %s", exc)
            return f"[ERROR: OpenAI request failed — {exc}]"
        except Exception as exc:
            logger.error("OpenAI unexpected error: %s", exc)
            return f"[ERROR: {exc}]"

    async def complete_json(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> dict:
        """Request JSON output."""
        json_system = (system or "") + "\nRespond ONLY with valid JSON. No markdown, no prose."
        text = await self.complete(prompt, system=json_system, temperature=temperature)
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.warning("OpenAI returned non-JSON: %s… — %s", cleaned[:120], exc)
            return {"raw_response": cleaned, "parse_error": str(exc)}

    async def stream(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> AsyncIterator[str]:
        """Stream response chunks."""
        payload = self._chat_payload(prompt, system, temperature, stream=True)
        try:
            async with self._client_instance().stream(
                "POST", f"{self.base_url}/chat/completions", json=payload
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.strip() or line.strip() == "data: [DONE]":
                        continue
                    if line.startswith("data: "):
                        line = line[6:]
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if content:
                        yield content
        except httpx.HTTPError as exc:
            logger.error("OpenAI stream error: %s", exc)
            yield f"[ERROR: OpenAI stream failed — {exc}]"

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# ---------------------------------------------------------------------------
# Kimi Provider (Moonshot AI — OpenAI-compatible)
# ---------------------------------------------------------------------------

class KimiProvider(LLMProvider):
    """Talk to the Moonshot Kimi API (OpenAI-compatible endpoint)."""

    AVAILABLE_MODELS = ["kimi-k1", "kimi-k2", "kimi-k1.5"]

    def __init__(
        self,
        api_key: Optional[str] = settings.kimi_key,
        base_url: str = settings.kimi_url,
        model: str = settings.kimi_model,
    ) -> None:
        if not api_key:
            raise ValueError("Kimi API key is required. Set RID_KIMI_KEY env var.")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._client: Optional[httpx.AsyncClient] = None

    def _client_instance(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=300.0,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    def _chat_payload(self, prompt: str, system: Optional[str], temperature: float, stream: bool = False) -> dict:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        }

    async def complete(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> str:
        """Non-streaming completion."""
        payload = self._chat_payload(prompt, system, temperature, stream=False)
        try:
            resp = await self._client_instance().post(f"{self.base_url}/chat/completions", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except httpx.HTTPError as exc:
            logger.error("Kimi HTTP error: %s", exc)
            return f"[ERROR: Kimi request failed — {exc}]"
        except Exception as exc:
            logger.error("Kimi unexpected error: %s", exc)
            return f"[ERROR: {exc}]"

    async def complete_json(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> dict:
        """Request JSON output."""
        json_system = (system or "") + "\nRespond ONLY with valid JSON. No markdown, no prose."
        text = await self.complete(prompt, system=json_system, temperature=temperature)
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.warning("Kimi returned non-JSON: %s… — %s", cleaned[:120], exc)
            return {"raw_response": cleaned, "parse_error": str(exc)}

    async def stream(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> AsyncIterator[str]:
        """Stream response chunks."""
        payload = self._chat_payload(prompt, system, temperature, stream=True)
        try:
            async with self._client_instance().stream(
                "POST", f"{self.base_url}/chat/completions", json=payload
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.strip() or line.strip() == "data: [DONE]":
                        continue
                    if line.startswith("data: "):
                        line = line[6:]
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if content:
                        yield content
        except httpx.HTTPError as exc:
            logger.error("Kimi stream error: %s", exc)
            yield f"[ERROR: Kimi stream failed — {exc}]"

    async def health(self) -> dict:
        """Check whether the Kimi API is reachable."""
        try:
            resp = await self._client_instance().get(f"{self.base_url}/models")
            resp.raise_for_status()
            models = resp.json().get("data", [])
            model_names = [m.get("id", "") for m in models]
            return {
                "reachable": True,
                "model": self.model,
                "model_available": self.model in model_names,
                "available_models": model_names,
            }
        except Exception as exc:
            return {"reachable": False, "error": str(exc), "model": self.model}

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# ---------------------------------------------------------------------------
# Gemini Provider (Google — OpenAI-compatible endpoint)
# ---------------------------------------------------------------------------

class GeminiProvider(LLMProvider):
    """Talk to the Google Gemini API (OpenAI-compatible endpoint)."""

    AVAILABLE_MODELS = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"]

    def __init__(
        self,
        api_key: Optional[str] = settings.gemini_key,
        base_url: str = settings.gemini_url,
        model: str = settings.gemini_model,
    ) -> None:
        if not api_key:
            raise ValueError("Gemini API key is required. Set RID_GEMINI_KEY env var.")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._client: Optional[httpx.AsyncClient] = None

    def _client_instance(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=300.0,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    def _chat_payload(self, prompt: str, system: Optional[str], temperature: float, stream: bool = False) -> dict:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        }

    async def complete(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> str:
        """Non-streaming completion."""
        payload = self._chat_payload(prompt, system, temperature, stream=False)
        try:
            resp = await self._client_instance().post(f"{self.base_url}/chat/completions", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except httpx.HTTPError as exc:
            logger.error("Gemini HTTP error: %s", exc)
            return f"[ERROR: Gemini request failed — {exc}]"
        except Exception as exc:
            logger.error("Gemini unexpected error: %s", exc)
            return f"[ERROR: {exc}]"

    async def complete_json(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> dict:
        """Request JSON output."""
        json_system = (system or "") + "\nRespond ONLY with valid JSON. No markdown, no prose."
        text = await self.complete(prompt, system=json_system, temperature=temperature)
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.warning("Gemini returned non-JSON: %s… — %s", cleaned[:120], exc)
            return {"raw_response": cleaned, "parse_error": str(exc)}

    async def stream(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> AsyncIterator[str]:
        """Stream response chunks."""
        payload = self._chat_payload(prompt, system, temperature, stream=True)
        try:
            async with self._client_instance().stream(
                "POST", f"{self.base_url}/chat/completions", json=payload
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.strip() or line.strip() == "data: [DONE]":
                        continue
                    if line.startswith("data: "):
                        line = line[6:]
                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if content:
                        yield content
        except httpx.HTTPError as exc:
            logger.error("Gemini stream error: %s", exc)
            yield f"[ERROR: Gemini stream failed — {exc}]"

    async def health(self) -> dict:
        """Check whether the Gemini API is reachable."""
        try:
            resp = await self._client_instance().get(f"{self.base_url}/models")
            resp.raise_for_status()
            models = resp.json().get("data", [])
            model_names = [m.get("id", "") for m in models]
            return {
                "reachable": True,
                "model": self.model,
                "model_available": self.model in model_names,
                "available_models": model_names,
            }
        except Exception as exc:
            return {"reachable": False, "error": str(exc), "model": self.model}

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
