"""RID agent system — news, analysis, planning, and orchestration."""

from rid.agents.llm import (
    GeminiProvider,
    KimiProvider,
    OllamaProvider,
    OpenAIProvider,
)

__all__ = [
    "get_llm_provider",
    "OllamaProvider",
    "OpenAIProvider",
    "KimiProvider",
    "GeminiProvider",
]


def get_llm_provider(provider_name: str) -> OllamaProvider | OpenAIProvider | KimiProvider | GeminiProvider:
    """Factory function that returns an LLM provider by name.

    Args:
        provider_name: One of "ollama", "openai", "kimi", "gemini".

    Returns:
        An instance of the requested LLM provider.

    Raises:
        ValueError: If the provider name is not recognised.
    """
    name = provider_name.lower().strip()
    if name == "ollama":
        return OllamaProvider()
    if name == "openai":
        return OpenAIProvider()
    if name == "kimi":
        return KimiProvider()
    if name == "gemini":
        return GeminiProvider()
    raise ValueError(
        f"Unknown LLM provider: {provider_name!r}. "
        f"Available: ollama, openai, kimi, gemini"
    )
