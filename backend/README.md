# Research Intelligence Dashboard (RID) — Backend

A standalone FastAPI backend for AI-driven research intelligence.
Runs fully offline with local LLMs via Ollama.

## Quick Start

### Prerequisites

- **Python 3.10+**
- **Ollama** (for local LLM inference) — install from https://ollama.com
- At least **4 GB RAM** free

### 1. Clone & Install

```bash
cd /mnt/agents/output/backend
pip install -r requirements.txt
```

### 2. Pull an Ollama Model

```bash
ollama pull llama3.2
```

Verify Ollama is running:

```bash
curl http://localhost:11434/api/tags
```

### 3. Run the Backend

```bash
python run.py
```

The API will be available at **http://localhost:8000**

- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4. Environment Variables

Create a `.env` file or export variables:

```bash
# Database
RID_DB_PATH=./rid.db

# Ollama (local LLM)
RID_OLLAMA_URL=http://localhost:11434
RID_OLLAMA_MODEL=llama3.2

# Optional: NewsAPI.org key for better news coverage
RID_NEWSAPI_KEY=your_key_here

# Optional: OpenAI-compatible API (if not using Ollama)
RID_OPENAI_KEY=sk-...
RID_OPENAI_URL=https://api.openai.com/v1

# Server
RID_PORT=8000
RID_LOG_LEVEL=INFO
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check + Ollama status |
| `/api/topics` | CRUD | Research topics |
| `/api/news` | GET | News articles (filtered) |
| `/api/analysis` | GET/POST | AI analysis results |
| `/api/plans` | CRUD | Business plans + milestones |
| `/api/agents` | CRUD | Plugin registry |
| `/api/pipeline/run` | POST | Run research pipeline |
| `/api/settings` | CRUD | App configuration |

## Research Pipeline

The pipeline runs in 3 steps:

1. **Fetch News** — Aggregates from RSS, NewsAPI, and web scraping
2. **Run Analysis** — AI-powered trend, competitor, risk, and summary analysis
3. **Generate Plan** — Creates a structured business plan with milestones

Run the full pipeline for a topic:

```bash
curl -X POST http://localhost:8000/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"topic_id": 1}'
```

Run a single step:

```bash
curl -X POST http://localhost:8000/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"topic_id": 1, "step": "fetch_news"}'
```

## Project Structure

```
rid/
  __init__.py
  config.py          # Pydantic settings
  database.py        # SQLAlchemy async setup
  models.py          # Database models
  main.py            # FastAPI app + routers
  routers/           # API route handlers
  agents/            # Core engine modules
    base.py          # Abstract interfaces
    llm.py           # Ollama + OpenAI providers
    news_engine.py   # News aggregation
    analysis_engine.py  # AI analysers
    plan_generator.py   # Business plan generation
    orchestrator.py  # Pipeline orchestration
  plugins/           # Plugin system
```

## Architecture

- **FastAPI** with async SQLAlchemy (aiosqlite) for non-blocking I/O
- **httpx.AsyncClient** for all HTTP requests
- **Ollama** as the default LLM provider (works fully offline)
- Optional **OpenAI-compatible** API for cloud LLMs
- Plugin-based extensibility with auto-discovery
