# Research Intelligence Dashboard (RID) — Backend Specification

## Overview

The RID backend is a standalone FastAPI application that serves as the engine for a research intelligence system. It aggregates news, performs AI-driven analysis, generates business plans, and provides a plugin-based extensibility mechanism. Designed to run fully offline with local LLMs via Ollama.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Frontend                             │
│              (Separate project, talks to RID API)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                    FastAPI Application                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │   Routers    │ │   Pipeline   │ │      Plugin System       │ │
│  │  /api/...    │ │  Orchestrator│ │   BasePlugin interface   │ │
│  └──────┬───────┘ └──────┬───────┘ └────────────┬─────────────┘ │
│         │                │                      │               │
│  ┌──────▼───────┐ ┌──────▼───────┐ ┌──────────▼──────────┐    │
│  │  CRUD Layer  │ │  News Engine │ │  Analysis Engine    │    │
│  │  (SQLAlchemy)│ │  (Async)     │ │  (LLM Providers)    │    │
│  └──────┬───────┘ └──────┬───────┘ └──────────┬──────────┘    │
│         │                │                      │               │
│  ┌──────▼────────────────▼──────────────────────▼──────────┐    │
│  │               Data Layer (SQLite + async)              │    │
│  │  Topic │ NewsArticle │ Analysis │ BusinessPlan │ Agent  │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Topics (`/api/topics`)
- `GET /api/topics` — List all topics (with pagination)
- `POST /api/topics` — Create new topic
- `GET /api/topics/{id}` — Get topic details
- `PUT /api/topics/{id}` — Update topic
- `DELETE /api/topics/{id}` — Delete topic (soft delete via is_active)

### News (`/api/news`)
- `GET /api/news` — List news articles (filter: topic_id, source, date range, sentiment)
- `GET /api/news/{id}` — Get single article
- `DELETE /api/news/{id}` — Remove article

### Analysis (`/api/analysis`)
- `GET /api/analysis` — List analyses (filter: topic_id, analysis_type)
- `POST /api/analysis` — Run analysis for topic
- `GET /api/analysis/{id}` — Get analysis details

### Plans (`/api/plans`)
- `GET /api/plans` — List business plans (filter: topic_id)
- `POST /api/plans` — Generate business plan for topic
- `GET /api/plans/{id}` — Get plan with milestones
- `PUT /api/plans/{id}` — Update plan
- `DELETE /api/plans/{id}` — Delete plan
- `GET /api/plans/{id}/milestones` — List plan milestones
- `PATCH /api/plans/milestones/{milestone_id}` — Update milestone status

### Agents (`/api/agents`)
- `GET /api/agents` — List installed plugins
- `POST /api/agents` — Install/register plugin
- `PATCH /api/agents/{id}` — Enable/disable plugin
- `DELETE /api/agents/{id}` — Uninstall plugin

### Pipeline (`/api/pipeline`)
- `POST /api/pipeline/run` — Run full pipeline for topic
- `POST /api/pipeline/step/{step}` — Run specific step
- `GET /api/pipeline/status` — Get pipeline status

### Settings (`/api/settings`)
- `GET /api/settings` — List all settings
- `GET /api/settings/{key}` — Get specific setting
- `PUT /api/settings/{key}` — Update setting

### Health (`/api/health`)
- `GET /api/health` — Health check + Ollama status

---

## Database Schema

### Topic
| Column      | Type     | Description                          |
|-------------|----------|--------------------------------------|
| id          | Integer  | Primary key                          |
| name        | String   | Topic name                           |
| description | Text     | Topic description                    |
| keywords    | String   | Comma-separated keywords             |
| created_at  | DateTime | Creation timestamp                   |
| updated_at  | DateTime | Last update timestamp                |
| is_active   | Boolean  | Soft delete flag                     |

### NewsArticle
| Column         | Type     | Description                          |
|----------------|----------|--------------------------------------|
| id             | Integer  | Primary key                          |
| topic_id       | Integer  | Foreign key to Topic                 |
| title          | String   | Article title                        |
| url            | String   | Source URL                           |
| source         | String   | Source name (RSS, NewsAPI, scraper)  |
| summary        | Text     | Article summary                      |
| content        | Text     | Full content (truncated)             |
| published_at   | DateTime | Original publish date                |
| sentiment      | String   | positive/neutral/negative            |
| relevance_score| Float    | 0.0-1.0 relevance                    |
| fetched_at     | DateTime | When fetched by RID                  |

### Analysis
| Column       | Type     | Description                          |
|--------------|----------|--------------------------------------|
| id           | Integer  | Primary key                          |
| topic_id     | Integer  | Foreign key to Topic                 |
| analysis_type| String   | trend/risk/competitor/summary        |
| content      | Text     | Full analysis text                   |
| key_insights | Text     | JSON array of key insights           |
| trends       | Text     | JSON array of trends                 |
| risks        | Text     | JSON array of risks                  |
| opportunities| Text     | JSON array of opportunities          |
| created_at   | DateTime | Analysis timestamp                   |

### BusinessPlan
| Column          | Type     | Description                          |
|-----------------|----------|--------------------------------------|
| id              | Integer  | Primary key                          |
| topic_id        | Integer  | Foreign key to Topic                 |
| title           | String   | Plan title                           |
| overview        | Text     | Executive summary                    |
| timeframe_months| Integer  | Plan duration (6-12)                 |
| milestones_json | Text     | JSON array of milestones             |
| strategies_json | Text     | JSON array of strategies             |
| created_at      | DateTime | Creation timestamp                   |

### Milestone
| Column      | Type     | Description                          |
|-------------|----------|--------------------------------------|
| id          | Integer  | Primary key                          |
| plan_id     | Integer  | Foreign key to BusinessPlan          |
| title       | String   | Milestone title                      |
| description | Text     | Milestone description                |
| target_date | Date     | Target completion date               |
| status      | String   | pending/in_progress/completed        |
| priority    | String   | low/medium/high                      |

### AgentPlugin
| Column       | Type     | Description                          |
|--------------|----------|--------------------------------------|
| id           | Integer  | Primary key                          |
| name         | String   | Plugin name                          |
| description  | Text     | Plugin description                   |
| module_path  | String   | Python module path                   |
| config_schema| Text     | JSON config schema                   |
| is_enabled   | Boolean  | Whether plugin is active             |
| installed_at | DateTime | Installation timestamp               |

### Setting
| Column   | Type   | Description                          |
|----------|--------|--------------------------------------|
| id       | Integer| Primary key                          |
| key      | String | Setting key (unique)                 |
| value    | Text   | Setting value                        |
| category | String | Setting category                     |

---

## Technical Decisions

1. **Async SQLAlchemy** — Non-blocking DB operations with aiosqlite
2. **httpx.AsyncClient** — All HTTP requests are async
3. **Parallel news fetching** — asyncio.gather for multiple sources
4. **Streaming LLM** — Support streaming where possible
5. **Offline-first** — Works fully with Ollama locally
6. **Structured JSON output** — All LLM responses are structured JSON
7. **Plugin architecture** — BasePlugin interface for extensibility

---

## File Structure

```
/mnt/agents/output/backend/
├── SPEC.md                          # This specification
├── requirements.txt                 # Dependencies
├── run.py                           # Entry point
├── README.md                        # Setup instructions
├── rid/
│   ├── __init__.py
│   ├── config.py                    # Pydantic settings
│   ├── database.py                  # SQLAlchemy async engine/session
│   ├── models.py                    # All SQLAlchemy models
│   ├── main.py                      # FastAPI app + router registration
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── topics.py                # Topic CRUD
│   │   ├── news.py                  # News feed endpoints
│   │   ├── analysis.py              # Analysis endpoints
│   │   ├── plans.py                 # Business plan endpoints
│   │   ├── agents.py                # Plugin/agent management
│   │   ├── pipeline.py              # Pipeline execution
│   │   └── settings.py              # App settings
│   └── agents/
│       ├── __init__.py
│       ├── base.py                  # Abstract base classes
│       ├── llm.py                   # LLM providers
│       ├── news_engine.py           # News aggregation
│       ├── analysis_engine.py       # AI analysis
│       ├── plan_generator.py        # Business plan generation
│       └── orchestrator.py          # Pipeline orchestration
```

---

## Environment Variables

| Variable          | Default                  | Description                  |
|-------------------|--------------------------|------------------------------|
| RID_DB_PATH       | ./rid.db                 | SQLite database file path    |
| RID_OLLAMA_URL    | http://localhost:11434   | Ollama API base URL          |
| RID_OLLAMA_MODEL  | llama3.2                 | Default Ollama model         |
| RID_NEWSAPI_KEY   | (none)                   | NewsAPI.org API key          |
| RID_OPENAI_KEY    | (none)                   | OpenAI API key (optional)    |
| RID_OPENAI_URL    | https://api.openai.com   | OpenAI-compatible base URL   |
| RID_LOG_LEVEL     | INFO                     | Logging level                |
| RID_FETCH_LIMIT   | 50                       | Max articles per fetch       |
| RID_PORT          | 8000                     | Server port                  |
