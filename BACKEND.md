# Research Intelligence Dashboard (RID) — Backend Developer Guide

> **Version:** 1.0.0  
> **Framework:** FastAPI with async SQLAlchemy (aiosqlite)  
> **Database:** SQLite with async I/O  
> **Entry Point:** `python run.py` -> uvicorn on localhost:8000  
> **License:** Open Source (MIT)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Database](#5-database)
6. [Authentication & RBAC](#6-authentication--rbac)
7. [LLM Providers](#7-llm-providers)
8. [News Aggregation](#8-news-aggregation)
9. [AI Analysis Engine](#9-ai-analysis-engine)
10. [Business Plan Generation](#10-business-plan-generation)
11. [Plugin System](#11-plugin-system)
12. [Research Pipeline](#12-research-pipeline)
13. [Development](#13-development)
14. [Deployment](#14-deployment)

---

## 1. Overview

The Research Intelligence Dashboard (RID) backend is a FastAPI-powered engine that aggregates news from multiple sources, runs AI-powered analysis, and generates strategic business plans. It supports multiple LLM providers (local and cloud), role-based access control, and a plugin system for extensibility.

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Source News Aggregation** | RSS, NewsAPI.org, and web scraping (DuckDuckGo) |
| **AI Analysis Suite** | Summary, trend, competitor, and risk analysers |
| **Business Plan Generator** | Structured plans with milestones, strategies, and KPIs |
| **Multi-LLM Support** | Ollama (local), OpenAI, Moonshot Kimi, Google Gemini |
| **RBAC** | Role-based access control (admin/editor/viewer) |
| **Invitation System** | Secure email-based user onboarding |
| **Plugin Architecture** | Auto-discovered OSS add-ons |
| **Async Throughout** | Full async I/O from HTTP to database |

### Technology Stack

| Component | Technology |
|-----------|------------|
| Web Framework | FastAPI |
| Async Runtime | Uvicorn + asyncio |
| ORM | SQLAlchemy 2.0 (async) |
| Database | SQLite via aiosqlite |
| Auth | JWT (python-jose) + bcrypt |
| Config | Pydantic Settings |
| HTTP Client | httpx (async) |
| News Parsing | feedparser + BeautifulSoup |
| Password Hashing | passlib (bcrypt) |

### Project Structure

```
backend/
|-- run.py                          # Entry point
|-- requirements.txt                # Dependencies
|-- README.md                       # Existing backend README
|-- SPEC.md                         # Full specification
|-- rid/
|   |-- __init__.py
|   |-- config.py                   # Pydantic settings (env vars)
|   |-- database.py                 # Async SQLAlchemy engine + session
|   |-- models.py                   # All SQLAlchemy models
|   |-- main.py                     # FastAPI app + router registration
|   |-- auth.py                     # Password hashing, JWT, RBAC deps
|   |-- agents/
|   |   |-- __init__.py             # get_llm_provider() factory
|   |   |-- base.py                 # Abstract interfaces
|   |   |-- llm.py                  # Ollama, OpenAI, Kimi, Gemini providers
|   |   |-- news_engine.py          # RSS, NewsAPI, WebScraper sources
|   |   |-- analysis_engine.py      # 4 AI analysers
|   |   |-- plan_generator.py       # Business plan generation
|   |   |-- orchestrator.py         # ResearchPipeline (fetch->analyse->plan)
|   |-- plugins/
|   |   |-- __init__.py             # PluginLoader (auto-discovery)
|   |   |-- rss_advanced.py         # Advanced RSS plugin
|   |   |-- sentiment_plugin.py     # Enhanced sentiment plugin
|   |-- routers/
|   |   |-- __init__.py             # Router exports
|   |   |-- auth.py                 # POST /register, /login, /logout, GET /me, PUT /me
|   |   |-- invitations.py          # Invitation CRUD + accept/resend
|   |   |-- users.py                # User management (admin)
|   |   |-- weekly_plans.py         # WeeklyPlan CRUD
|   |   |-- news.py                 # News feed with filters
|   |   |-- analysis.py             # AI analysis endpoints
|   |   |-- plans.py                # Business plans + milestones
|   |   |-- agents.py               # Plugin/agent management
|   |   |-- pipeline.py             # Pipeline execution
|   |   |-- settings.py             # App settings CRUD
```

---

## 2. Prerequisites

| Requirement | Minimum Version | Notes |
|-------------|-----------------|-------|
| Python | 3.11+ | Required for modern async syntax |
| pip | 23.0+ | Package manager |
| Ollama | Latest | Local LLM server (optional if using cloud LLM) |
| Virtualenv | 20.0+ | Recommended for isolation |

### System Dependencies

Some Python packages require system-level build tools:

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y build-essential libffi-dev

# macOS (with Homebrew)
xcode-select --install

# Fedora / RHEL
sudo dnf install gcc libffi-devel
```

---

## 3. Installation

### Step 1: Clone and Navigate

```bash
cd backend/
```

### Step 2: Create Virtual Environment

```bash
python3 -m venv .venv

# Activate (Linux/macOS)
source .venv/bin/activate

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Key dependencies installed:**

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | >=0.110.0 | Web framework |
| uvicorn | >=0.27.0 | ASGI server |
| sqlalchemy[asyncio] | >=2.0.0 | Async ORM |
| aiosqlite | >=0.19.0 | Async SQLite driver |
| pydantic | >=2.0.0 | Data validation |
| pydantic-settings | >=2.0.0 | Configuration management |
| httpx | >=0.26.0 | Async HTTP client |
| feedparser | >=6.0.0 | RSS feed parsing |
| beautifulsoup4 | >=4.12.0 | HTML parsing (web scraper) |
| python-jose[cryptography] | >=3.3.0 | JWT token handling |
| passlib[bcrypt] | >=1.7.4 | Password hashing |

### Step 4: (Optional) Install Ollama for Local LLM

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Pull the default model
ollama pull llama3.2

# Start the Ollama server
ollama serve
```

Verify Ollama is running:

```bash
curl http://localhost:11434/api/tags
```

### Step 5: Start the Backend

```bash
python run.py
```

The server will start on `http://localhost:8000` by default.  
API documentation is available at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/api/health`

### First-Time Startup

On first run, the backend will:

1. Create the SQLite database file (`rid.db` by default)
2. Create all tables (if they don't exist)
3. Seed a default admin user (configurable via env vars)
4. Seed default application settings

**Default admin credentials:**

| Field | Default | Env Var Override |
|-------|---------|-----------------|
| Email | `admin@local` | `RID_ADMIN_EMAIL` |
| Password | `admin` | `RID_ADMIN_PASSWORD` |

> **WARNING:** Change the default admin password immediately in production.

---

## 4. Configuration

Configuration is managed by Pydantic Settings in `rid/config.py`. All environment variables use the `RID_` prefix.

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `RID_DB_PATH` | `./rid.db` | SQLite database file path |
| `RID_OLLAMA_URL` | `http://localhost:11434` | Ollama API endpoint |
| `RID_OLLAMA_MODEL` | `llama3.2` | Default Ollama model name |
| `RID_OPENAI_KEY` | *(none)* | OpenAI API key |
| `RID_OPENAI_URL` | `https://api.openai.com/v1` | OpenAI-compatible base URL |
| `RID_KIMI_KEY` | *(none)* | Moonshot Kimi API key |
| `RID_KIMI_URL` | `https://api.moonshot.cn/v1` | Kimi base URL |
| `RID_KIMI_MODEL` | `kimi-k1` | Default Kimi model |
| `RID_GEMINI_KEY` | *(none)* | Google Gemini API key |
| `RID_GEMINI_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` | Gemini base URL |
| `RID_GEMINI_MODEL` | `gemini-1.5-pro` | Default Gemini model |
| `RID_NEWSAPI_KEY` | *(none)* | NewsAPI.org API key |
| `RID_SECRET_KEY` | *(auto-generated)* | JWT signing secret (auto-generated if empty) |
| `RID_ADMIN_EMAIL` | `admin@local` | Default admin user email |
| `RID_ADMIN_PASSWORD` | `admin` | Default admin user password |
| `RID_PORT` | `8000` | Server port |
| `RID_HOST` | `0.0.0.0` | Server bind host |
| `RID_LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `RID_RELOAD` | `False` | Auto-reload on code changes (dev only) |
| `RID_FETCH_LIMIT` | `50` | Max articles to fetch per pipeline run |

### Configuration via .env File

Create a `.env` file in the `backend/` directory:

```bash
# .env
RID_DB_PATH=./data/rid.db
RID_OLLAMA_URL=http://localhost:11434
RID_OLLAMA_MODEL=llama3.2
RID_SECRET_KEY=your-super-secret-jwt-key-change-this
RID_ADMIN_EMAIL=admin@yourcompany.com
RID_ADMIN_PASSWORD=SecureP@ssw0rd!
RID_PORT=8000
RID_LOG_LEVEL=INFO

# Optional external LLM keys
RID_OPENAI_KEY=sk-...
RID_KIMI_KEY=sk-...
RID_GEMINI_KEY=...
RID_NEWSAPI_KEY=...
```

### Programmatic Access

```python
from rid.config import settings

# Access any setting
print(settings.database_url)      # sqlite+aiosqlite:///.../rid.db
print(settings.jwt_secret)        # Auto-generated or from env
print(settings.ollama_url)        # http://localhost:11434
```

### Derived Properties

| Property | Type | Description |
|----------|------|-------------|
| `settings.database_url` | `str` | Full async SQLite URL for SQLAlchemy |
| `settings.jwt_secret` | `str` | Stable JWT secret (auto-generated if not set) |

The JWT secret is generated once per process and stored in the `_RID_JWT_SECRET` environment variable for process lifetime persistence. For production, always set `RID_SECRET_KEY` explicitly.

---

## 5. Database

### Engine and Session

`rid/database.py` manages the async SQLAlchemy engine, session factory, and database lifecycle.

```python
from rid.database import get_db, init_db, close_db, AsyncSessionLocal, db_session

# In FastAPI endpoints — use the dependency
@app.get("/items")
async def list_items(db: AsyncSession = Depends(get_db)):
    ...

# Outside FastAPI — use context manager
async with db_session() as db:
    result = await db.execute(select(User))
    users = result.scalars().all()
```

### Session Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `echo` | `False` | SQL logging (set True for debugging) |
| `expire_on_commit` | `False` | Prevent expired objects after commit |
| `autoflush` | `False` | Manual flush control |

### Models

All models defined in `rid/models.py` using SQLAlchemy 2.0 declarative syntax with `Mapped` types.

#### User

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int]              # Primary key
    email: Mapped[str]           # Unique, indexed
    name: Mapped[str]
    password_hash: Mapped[str]   # bcrypt hash (nullable for SSO)
    role: Mapped[str]            # "admin" | "editor" | "viewer"
    is_active: Mapped[bool]      # Soft-delete flag
    created_at: Mapped[datetime]
    last_login: Mapped[datetime] # Nullable
```

#### Invitation

```python
class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[int]
    email: Mapped[str]
    role: Mapped[str]            # Role to assign on acceptance
    token: Mapped[str]           # Unique, indexed — URL-safe token
    created_by: Mapped[int]      # FK -> users.id
    expires_at: Mapped[datetime] # 7 days from creation
    used_at: Mapped[datetime]    # Null until accepted
    created_at: Mapped[datetime]
```

#### WeeklyPlan

```python
class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id: Mapped[int]
    name: Mapped[str]
    description: Mapped[str]     # Optional
    keywords: Mapped[str]        # Comma-separated
    user_id: Mapped[int]         # FK -> users.id (nullable)
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
    is_active: Mapped[bool]      # Soft-delete flag

    # Relationships
    news_articles: List[NewsArticle]  # Cascade delete
    analyses: List[Analysis]          # Cascade delete
    business_plans: List[BusinessPlan] # Cascade delete
```

#### NewsArticle

```python
class NewsArticle(Base):
    __tablename__ = "news_articles"

    id: Mapped[int]
    weekly_plan_id: Mapped[int]  # FK -> weekly_plans.id (CASCADE)
    title: Mapped[str]
    url: Mapped[str]             # Indexed
    source: Mapped[str]
    summary: Mapped[str]
    content: Mapped[str]
    published_at: Mapped[datetime]
    sentiment: Mapped[str]       # "positive" | "neutral" | "negative"
    relevance_score: Mapped[float] # 0.0 - 1.0
    fetched_at: Mapped[datetime]
```

#### Analysis

```python
class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int]
    weekly_plan_id: Mapped[int]  # FK -> weekly_plans.id (CASCADE)
    analysis_type: Mapped[str]   # "summary" | "trend" | "competitor" | "risk"
    content: Mapped[str]         # Main analysis text
    key_insights: Mapped[str]    # JSON array string
    trends: Mapped[str]          # JSON array string
    risks: Mapped[str]           # JSON array string
    opportunities: Mapped[str]   # JSON array string
    created_at: Mapped[datetime]
```

#### BusinessPlan

```python
class BusinessPlan(Base):
    __tablename__ = "business_plans"

    id: Mapped[int]
    weekly_plan_id: Mapped[int]  # FK -> weekly_plans.id (CASCADE)
    title: Mapped[str]
    overview: Mapped[str]
    timeframe_months: Mapped[int]
    milestones_json: Mapped[str] # JSON array string
    strategies_json: Mapped[str] # JSON array string
    created_at: Mapped[datetime]

    # Relationships
    milestones: List[Milestone]  # Cascade delete
```

#### Milestone

```python
class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[int]
    plan_id: Mapped[int]         # FK -> business_plans.id (CASCADE)
    title: Mapped[str]
    description: Mapped[str]
    target_date: Mapped[date]
    status: Mapped[str]          # "pending" | "in_progress" | "completed"
    priority: Mapped[str]        # "low" | "medium" | "high"
```

#### AgentPlugin

```python
class AgentPlugin(Base):
    __tablename__ = "agent_plugins"

    id: Mapped[int]
    name: Mapped[str]            # Unique
    description: Mapped[str]
    module_path: Mapped[str]
    config_schema: Mapped[str]   # JSON schema string
    is_enabled: Mapped[bool]
    installed_at: Mapped[datetime]
```

#### Setting

```python
class Setting(Base):
    __tablename__ = "settings"

    id: Mapped[int]
    key: Mapped[str]             # Unique
    value: Mapped[str]
    category: Mapped[str]        # "general" | "llm" | "pipeline" | "news" | ...
```

### Database Initialization

On startup (`rid/main.py` -> `on_startup()`):

```python
@app.on_event("startup")
async def on_startup():
    await init_db()              # CREATE TABLE IF NOT EXISTS all models
    await init_default_admin()   # Create admin user if no users exist
    await _seed_defaults()       # Insert default settings if empty
```

### Default Seeded Settings

| Key | Value | Category |
|-----|-------|----------|
| `llm_provider` | `ollama` | llm |
| `fetch_interval_hours` | `24` | pipeline |
| `default_timeframe_months` | `12` | planning |
| `auto_run_pipeline` | `false` | pipeline |
| `news_sources` | `["rss","newsapi","scraper"]` | news |

---

## 6. Authentication & RBAC

The auth system in `rid/auth.py` provides password hashing, JWT token management, and role-based access control.

### Password Hashing

Uses `passlib` with bcrypt:

```python
from rid.auth import hash_password, verify_password

hashed = hash_password("my_secure_password")
is_valid = verify_password("my_secure_password", hashed)  # True
```

### JWT Tokens

Uses `python-jose` with HS256 algorithm. Tokens expire after 7 days.

```python
from rid.auth import create_access_token, decode_token

# Create token
token = create_access_token({"sub": user.email})

# Decode token
payload = decode_token(token)  # {"sub": "user@example.com", "exp": 1234567890}
```

### OAuth2 Scheme

The auth system uses FastAPI's `OAuth2PasswordBearer` with token URL at `/api/auth/login`.

Clients must include the token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Current User Dependencies

| Dependency | Description | Returns |
|------------|-------------|---------|
| `get_current_user()` | Decode JWT, lookup user | `User` or `None` |
| `get_current_active_user()` | Same + requires active user | `User` (401 if missing) |

### Role-Based Access Control

Three roles with hierarchical permissions:

| Role | Description | Can Access |
|------|-------------|------------|
| `admin` | Full system access | Everything (user mgmt, settings, plugins) |
| `editor` | Can create and modify | Weekly plans, news, analysis, plans, pipeline |
| `viewer` | Read-only | View all data, cannot modify |

**Role hierarchy:** `admin` > `editor` > `viewer`

An `admin` user passes all role checks automatically.

### Dependency Shorthands

```python
from rid.auth import require_admin, require_editor, require_role

# Require specific role
@router.post("/items", dependencies=[require_editor])

# Require admin
@router.delete("/users/{id}", dependencies=[require_admin])

# Custom minimum role
@router.get("/reports", dependencies=[require_role("viewer")])
```

### Authentication Flow

```
1. User -> POST /api/auth/register (email, name, password)
2. Server -> Creates user, returns JWT token
3. Client -> Stores token, sends with every request
4. Server -> Validates token via get_current_active_user()
5. Server -> Checks role via require_role() dependencies
```

### Invitation Flow

```
1. Admin -> POST /api/invitations (email, role)
2. Server -> Creates invitation with secure token (7-day expiry)
3. Server -> Returns accept_url (frontend handles /invite/{token})
4. Invitee -> Visits /invite/{token} in browser
5. Invitee -> POST /api/invitations/{token}/accept (name, password)
6. Server -> Creates user with invitation role, marks invitation used
7. Server -> Returns JWT token for immediate login
```

---

## 7. LLM Providers

All LLM providers implement the `LLMProvider` abstract interface defined in `rid/agents/base.py`.

### Interface

```python
class LLMProvider(abc.ABC):
    @abc.abstractmethod
    async def complete(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> str:
        """Non-streaming completion."""

    @abc.abstractmethod
    async def complete_json(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> dict:
        """Return parsed JSON response."""

    @abc.abstractmethod
    async def stream(self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.7) -> AsyncIterator[str]:
        """Stream response chunks."""
```

### Provider Factory

```python
from rid.agents import get_llm_provider

llm = get_llm_provider("ollama")    # OllamaProvider()
llm = get_llm_provider("openai")    # OpenAIProvider()
llm = get_llm_provider("kimi")      # KimiProvider()
llm = get_llm_provider("gemini")    # GeminiProvider()
```

### 7.1 OllamaProvider (Local, Default)

**File:** `rid/agents/llm.py`

| Parameter | Default | Description |
|-----------|---------|-------------|
| `base_url` | `RID_OLLAMA_URL` | Ollama server endpoint |
| `model` | `RID_OLLAMA_MODEL` | Model name (e.g., `llama3.2`) |

**Endpoint:** `POST /api/chat`

```python
from rid.agents.llm import OllamaProvider

llm = OllamaProvider()
response = await llm.complete("Explain quantum computing")
json_data = await llm.complete_json("List 3 colors as JSON")

# Streaming
async for chunk in llm.stream("Tell me a story"):
    print(chunk, end="")

# Health check
health = await llm.health()  # {"reachable": True, "model": "llama3.2", ...}

# Cleanup
await llm.close()
```

**Setup:**

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Start server
ollama serve
```

### 7.2 OpenAIProvider (Cloud)

**File:** `rid/agents/llm.py`

| Parameter | Default | Description |
|-----------|---------|-------------|
| `api_key` | `RID_OPENAI_KEY` | OpenAI API key |
| `base_url` | `RID_OPENAI_URL` | OpenAI-compatible endpoint |
| `model` | `gpt-4o-mini` | Model identifier |

**Endpoint:** `POST /chat/completions`

```python
from rid.agents.llm import OpenAIProvider

llm = OpenAIProvider()  # Requires RID_OPENAI_KEY env var
response = await llm.complete("What is machine learning?")
```

**Compatible with:** OpenAI, vLLM, and any OpenAI-compatible API.

### 7.3 KimiProvider (Moonshot AI)

**File:** `rid/agents/llm.py`

| Parameter | Default | Description |
|-----------|---------|-------------|
| `api_key` | `RID_KIMI_KEY` | Moonshot API key |
| `base_url` | `RID_KIMI_URL` | Kimi endpoint |
| `model` | `RID_KIMI_MODEL` | Default: `kimi-k1` |

**Available models:** `kimi-k1`, `kimi-k2`, `kimi-k1.5`

```python
from rid.agents.llm import KimiProvider

llm = KimiProvider()  # Requires RID_KIMI_KEY env var
```

### 7.4 GeminiProvider (Google)

**File:** `rid/agents/llm.py`

| Parameter | Default | Description |
|-----------|---------|-------------|
| `api_key` | `RID_GEMINI_KEY` | Google API key |
| `base_url` | `RID_GEMINI_URL` | Gemini OpenAI-compatible endpoint |
| `model` | `RID_GEMINI_MODEL` | Default: `gemini-1.5-pro` |

**Available models:** `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash`

```python
from rid.agents.llm import GeminiProvider

llm = GeminiProvider()  # Requires RID_GEMINI_KEY env var
```

### Provider Comparison

| Feature | Ollama | OpenAI | Kimi | Gemini |
|---------|--------|--------|------|--------|
| Cost | Free (local) | Paid | Paid | Paid |
| Internet Required | No | Yes | Yes | Yes |
| Privacy | 100% local | Cloud | Cloud | Cloud |
| Speed | Hardware-dependent | Fast | Fast | Fast |
| Best For | Development, privacy | Production | Chinese language | Multimodal |
| JSON Output | Supported | Supported | Supported | Supported |
| Streaming | Supported | Supported | Supported | Supported |

### Switching Providers

Change the active provider via the settings API:

```bash
curl -X PUT http://localhost:8000/api/settings/llm_provider \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"value": "openai", "category": "llm"}'
```

---

## 8. News Aggregation

The news engine in `rid/agents/news_engine.py` fetches articles from multiple sources concurrently, deduplicates them, and scores relevance.

### Architecture

```
NewsAggregator
  |-- RSSSource          (feedparser — Google News, BBC, etc.)
  |-- NewsAPISource      (NewsAPI.org — requires API key)
  |-- WebScraperSource   (DuckDuckGo HTML — no API key needed)
```

### NewsAggregator

```python
from rid.agents.news_engine import NewsAggregator

aggregator = NewsAggregator()
articles = await aggregator.fetch_for_topic(
    topic_name="Artificial Intelligence",
    keywords="machine learning, neural networks, deep learning",
    limit=50,
)
# Returns List[NewsItem]

await aggregator.close()
```

### NewsItem Data Transfer Object

```python
@dataclass
class NewsItem:
    title: str
    url: str
    source: str = "unknown"
    summary: str = ""
    content: str = ""
    published_at: Optional[datetime] = None
    sentiment: str = "neutral"
    relevance_score: float = 0.5
```

### RSSSource

| Parameter | Default |
|-----------|---------|
| `feed_urls` | `["https://news.google.com/rss", "https://feeds.bbci.co.uk/news/technology/rss.xml"]` |

- Fetches feeds concurrently with semaphore (max 5 parallel)
- Keyword filtering on titles
- Date parsing from RSS `published_parsed`

### NewsAPISource

Requires `RID_NEWSAPI_KEY` environment variable. Returns empty list if not configured.

| Parameter | Default |
|-----------|---------|
| `api_key` | `RID_NEWSAPI_KEY` |

- Converts comma-separated keywords to `OR` query syntax
- Sorts by relevancy
- Language: English

### WebScraperSource

No API key required. Uses DuckDuckGo lite HTML search.

- Sets realistic User-Agent header
- Parses HTML results with BeautifulSoup
- Extracts title, URL, and snippet

### Deduplication

The `NewsAggregator` deduplicates articles by computing the MD5 hash of each URL:

```python
url_hash = hashlib.md5(item.url.encode()).hexdigest()
if url_hash not in seen:
    seen.add(url_hash)
    unique_items.append(item)
```

### Relevance Scoring

A simple heuristic scores each article based on keyword presence in the title:

```python
score = 0.5  # Base score
for kw in keywords.split(","):
    if kw.strip().lower() in title_lower:
        score += 0.1  # +0.1 per keyword match
relevance_score = min(score, 1.0)
```

Articles are sorted by relevance score (highest first).

---

## 9. AI Analysis Engine

The analysis engine in `rid/agents/analysis_engine.py` provides four specialized analysers that run concurrently over a batch of news articles.

### AnalysisRunner

```python
from rid.agents.analysis_engine import AnalysisRunner
from rid.agents.llm import OllamaProvider

llm = OllamaProvider()
runner = AnalysisRunner(llm)

# Run all analysers
results = await runner.run_all(topic_name="AI", articles=news_items)

# Run a single analyser
result = await runner.run_one("risk", topic_name="AI", articles=news_items)
```

### Four Analysers

#### 1. NewsSummarizer (`analysis_type: "summary"`)

Produces a concise summary of all articles with key insights.

**Output fields:** `content`, `key_insights`

**Example prompt output:**
```json
{
  "content": "The AI industry saw significant developments this week...",
  "key_insights": ["Major breakthrough in LLM efficiency", "New regulations proposed in EU"]
}
```

#### 2. TrendAnalyzer (`analysis_type: "trend"`)

Extracts trends, patterns, and sentiment direction.

**Output fields:** `content`, `trends`, `key_insights`, `opportunities`

**Example prompt output:**
```json
{
  "content": "The trend toward smaller, more efficient models is accelerating...",
  "trends": [ "Edge AI deployment increasing", "Open-source model proliferation" ],
  "key_insights": [ "Cost reduction of 40% reported" ],
  "opportunities": [ "Mobile AI applications", "IoT integration" ]
}
```

#### 3. CompetitorAnalyzer (`analysis_type: "competitor"`)

Identifies competitor activities, product launches, partnerships, and strategic moves.

**Output fields:** `content`, `key_insights`, `risks`, `opportunities`

#### 4. RiskAnalyzer (`analysis_type: "risk"`)

Identifies risks, threats, regulatory changes, and market disruptions.

**Output fields:** `content`, `risks`, `key_insights`

### AnalysisResult DTO

```python
@dataclass
class AnalysisResult:
    analysis_type: str      # "summary" | "trend" | "competitor" | "risk"
    content: str            # Main analysis text
    key_insights: List[str]
    trends: List[str]
    risks: List[str]
    opportunities: List[str]
```

### Database Persistence

```python
# Convert to DB format
db_dict = result.to_db_dict(weekly_plan_id=1)
# {
#     "weekly_plan_id": 1,
#     "analysis_type": "summary",
#     "content": "...",
#     "key_insights": "[\"insight1\", \"insight2\"]",
#     ...
# }
```

Note: Array fields are JSON-serialized strings in the database.

---

## 10. Business Plan Generation

The plan generator in `rid/agents/plan_generator.py` creates structured business plans with milestones, strategies, and KPIs.

### PlanGenerator

```python
from rid.agents.plan_generator import PlanGenerator
from rid.agents.llm import OllamaProvider
from rid.database import AsyncSessionLocal

llm = OllamaProvider()
generator = PlanGenerator(llm)

# Generate a plan
plan = await generator.generate(
    topic_name="Artificial Intelligence",
    topic_description="AI-powered business intelligence tools",
    articles=news_items,
    existing_analyses=analysis_results,
    timeframe_months=12,
)

# Persist to database
async with AsyncSessionLocal() as db:
    plan_id = await generator.persist_plan(plan, topic_id=1, db_session=db)
```

### BusinessPlanResult DTO

```python
@dataclass
class BusinessPlanResult:
    title: str
    overview: str
    timeframe_months: int
    milestones: List[PlanMilestone]
    strategies: List[str]
    kpis: List[str]
    risks_mitigations: List[Dict[str, str]]

@dataclass
class PlanMilestone:
    title: str
    description: str
    month: int          # 1-12 (or up to timeframe_months)
    status: str         # "pending"
    priority: str       # "low" | "medium" | "high"
```

### Output Structure

The LLM is prompted to produce JSON with this exact structure:

```json
{
  "title": "AI Strategic Business Plan",
  "overview": "Executive summary paragraph...",
  "timeframe_months": 12,
  "milestones": [
    {
      "title": "Market Research Complete",
      "description": "Comprehensive competitor and market analysis",
      "month": 1,
      "priority": "high"
    }
  ],
  "strategies": ["Focus on niche verticals", "Build partnerships"],
  "kpis": ["5 enterprise clients", "$1M ARR"],
  "risks_mitigations": [
    {"risk": "Market saturation", "mitigation": "Differentiate through vertical focus"}
  ]
}
```

### Milestone Persistence

When persisted via `persist_plan()`:

1. A `BusinessPlan` record is created with JSON-serialized milestones
2. Individual `Milestone` records are created for each milestone
3. Target dates are calculated: `base_date + 30 * (month - 1)` days
4. Both `milestones_json` (string) and individual `Milestone` rows exist

### Fallback Plan

If the LLM returns invalid JSON, a fallback plan is automatically generated with one milestone per month and generic strategies/KPIs.

---

## 11. Plugin System

The plugin system in `rid/plugins/__init__.py` provides auto-discovery and lifecycle management for OSS add-ons.

### BasePlugin Interface

```python
from rid.agents.base import BasePlugin

class MyPlugin(BasePlugin):
    name = "my_plugin"
    description = "Does something useful"
    version = "1.0.0"

    async def activate(self):
        """Called when the plugin is enabled."""
        pass

    async def deactivate(self):
        """Called when the plugin is disabled."""
        pass
```

### PluginLoader

```python
from rid.plugins import PluginLoader

loader = PluginLoader()

# Discover plugins
discovered = loader.discover()  # ["rss_advanced", "sentiment_plugin"]

# Activate a plugin
await loader.activate("sentiment_plugin")

# Check active plugins
active = loader.list_active()  # ["sentiment_plugin"]

# Get plugin info
info = loader.get_plugin_info("sentiment_plugin")

# Deactivate
await loader.deactivate("sentiment_plugin")
```

### Auto-Discovery

Plugins are auto-discovered from `rid/plugins/*.py`. Any class that:

1. Subclasses `BasePlugin`
2. Is not `BasePlugin` itself
3. Has a `name` attribute != `"abstract_plugin"`

...will be registered.

### Built-in Plugins

#### rss_advanced.py — AdvancedRSSPlugin

An enhanced RSS source with configurable keyword matching thresholds and additional feeds (including Reuters).

| Config Key | Type | Description |
|------------|------|-------------|
| `feed_urls` | `List[str]` | Additional RSS feed URLs |
| `min_keyword_matches` | `int` | Minimum keyword matches required |
| `categories` | `List[str]` | Article categories to filter |

#### sentiment_plugin.py — SentimentPlugin

A fast lexicon-based sentiment scorer that works without external API calls.

```python
from rid.plugins.sentiment_plugin import SentimentPlugin, SentimentScorer

plugin = SentimentPlugin()
await plugin.activate()

# Score text
label = plugin.score("Company reports record profits!")  # "positive"

# Score with confidence
scores = plugin.scorer.score_with_confidence("Mixed quarterly results")
# {"positive": 0.15, "neutral": 0.70, "negative": 0.15}

# Batch score
from rid.agents.base import NewsItem
distribution = plugin.scorer.batch_score(articles)
# {"positive": 12, "neutral": 30, "negative": 8}
```

### Writing a Custom Plugin

1. Create a file in `rid/plugins/my_plugin.py`:

```python
from rid.agents.base import BasePlugin

class MyPlugin(BasePlugin):
    name = "my_custom_plugin"
    description = "Custom analysis plugin"
    version = "1.0.0"

    async def activate(self):
        # Initialization logic
        pass

    async def deactivate(self):
        # Cleanup logic
        pass
```

2. Restart the backend — the plugin will be auto-discovered.
3. Register via the API if needed (see Agents router in API reference).

---

## 12. Research Pipeline

The pipeline orchestrator in `rid/agents/orchestrator.py` coordinates the three-step research workflow.

### Pipeline Steps

```python
from rid.agents.orchestrator import PipelineStep

PipelineStep.FETCH_NEWS     # "fetch_news"
PipelineStep.RUN_ANALYSIS   # "run_analysis"
PipelineStep.GENERATE_PLAN  # "generate_plan"
```

### ResearchPipeline

```python
from rid.agents.orchestrator import ResearchPipeline

pipeline = ResearchPipeline()

# Run full pipeline
result = await pipeline.run_full(topic_id=1)
# {
#     "articles_fetched": 42,
#     "analyses_run": 4,
#     "business_plan_id": 7,
# }

# Run single step
result = await pipeline.run_step(topic_id=1, step=PipelineStep.FETCH_NEWS)

# Check status
status = pipeline.get_status(topic_id=1)
# {
#     "weekly_plan_id": 1,
#     "running": False,
#     "current_step": None,
#     "last_run": "2024-01-15T10:30:00+00:00",
#     "errors": [],
#     "result_summary": {...}
# }
```

### Step 1: Fetch News

```
1. Load WeeklyPlan from database
2. Call NewsAggregator.fetch_for_topic()
3. Deduplicate against existing articles in DB
4. Insert new articles into news_articles table
5. Return count of new articles
```

### Step 2: Run Analysis

```
1. Load all articles for the topic
2. Run all 4 analysers concurrently via AnalysisRunner
3. Persist each AnalysisResult to the analyses table
4. Return count of analyses completed
```

### Step 3: Generate Plan

```
1. Load articles and existing analyses
2. Call PlanGenerator.generate()
3. Persist BusinessPlan + Milestone records
4. Return the new business_plan_id
```

### Error Handling

- Pipeline errors are caught and stored in `status.errors`
- The pipeline continues to the next step even if one fails
- All errors are logged with full stack traces

### Pipeline API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/pipeline/run` | Run full pipeline or single step |
| GET | `/api/pipeline/status/{id}` | Get pipeline status |
| GET | `/api/pipeline/steps` | List available steps |

---

## 13. Development

### Running in Development Mode

```bash
# Enable auto-reload
RID_RELOAD=true python run.py

# Or with uvicorn directly
uvicorn rid.main:app --reload --port 8000 --log-level debug
```

### Debugging

```python
# Enable SQL echo
# In rid/database.py, set echo=True:
_engine = create_async_engine(settings.database_url, echo=True)
```

### Logging

Logs use Python's standard `logging` module with structured format:

```
2024-01-15 10:30:00 | INFO     | rid.main | RID backend starting up
2024-01-15 10:30:01 | INFO     | rid.database | Created default admin user: admin@local
2024-01-15 10:30:01 | INFO     | rid.main | Seeded 5 default settings
```

### Common Operations

```python
# Manual database operations
import asyncio
from rid.database import init_db, close_db, AsyncSessionLocal
from rid.models import User, WeeklyPlan
from sqlalchemy import select

async def check_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"{u.id}: {u.email} ({u.role})")

asyncio.run(check_users())
```

### Health Check

```bash
curl http://localhost:8000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "ollama": {
    "reachable": true,
    "model": "llama3.2",
    "model_available": true,
    "available_models": ["llama3.2", "mistral"]
  }
}
```

---

## 14. Deployment

### Production Configuration

```bash
# Required env vars for production
export RID_SECRET_KEY="$(openssl rand -hex 32)"   # Strong JWT secret
export RID_ADMIN_EMAIL="admin@company.com"
export RID_ADMIN_PASSWORD="$(openssl rand -base64 24)"  # Strong password
export RID_LOG_LEVEL="WARNING"
export RID_RELOAD="false"
export RID_HOST="0.0.0.0"
export RID_PORT="8000"
```

### Using Gunicorn with Uvicorn Workers

```bash
pip install gunicorn
gunicorn rid.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### Security Hardening Checklist

- [ ] Change `RID_SECRET_KEY` to a cryptographically random value
- [ ] Change `RID_ADMIN_PASSWORD` from default
- [ ] Set `RID_RELOAD=false`
- [ ] Set `RID_LOG_LEVEL=WARNING` (or `ERROR`)
- [ ] Run behind a reverse proxy (nginx, Caddy, traefik)
- [ ] Enable HTTPS/TLS termination at the proxy
- [ ] Restrict CORS origins in `rid/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Production domain only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
```

- [ ] Use a dedicated database directory with proper permissions
- [ ] Enable file system backups for the SQLite database
- [ ] Set up log rotation

### Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name rid.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Deployment

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV RID_HOST=0.0.0.0
ENV RID_PORT=8000
ENV RID_LOG_LEVEL=WARNING
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["python", "run.py"]
```

```bash
docker build -t rid-backend .
docker run -d \
  -p 8000:8000 \
  -e RID_SECRET_KEY="$(openssl rand -hex 32)" \
  -e RID_ADMIN_PASSWORD="secure-password" \
  -v rid-data:/app/data \
  rid-backend
```

### systemd Service

```ini
# /etc/systemd/system/rid.service
[Unit]
Description=Research Intelligence Dashboard Backend
After=network.target

[Service]
Type=simple
User=rid
WorkingDirectory=/opt/rid/backend
Environment=RID_SECRET_KEY=your-secret-key
Environment=RID_ADMIN_PASSWORD=secure-password
Environment=RID_LOG_LEVEL=WARNING
ExecStart=/opt/rid/backend/.venv/bin/python run.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable rid
sudo systemctl start rid
sudo systemctl status rid
```

---

## Appendix: Quick Reference

### Environment Variables Template

```bash
# --- Database ---
RID_DB_PATH=./rid.db

# --- LLM (local) ---
RID_OLLAMA_URL=http://localhost:11434
RID_OLLAMA_MODEL=llama3.2

# --- LLM (cloud — optional) ---
RID_OPENAI_KEY=
RID_OPENAI_URL=https://api.openai.com/v1
RID_KIMI_KEY=
RID_KIMI_URL=https://api.moonshot.cn/v1
RID_KIMI_MODEL=kimi-k1
RID_GEMINI_KEY=
RID_GEMINI_URL=https://generativelanguage.googleapis.com/v1beta/openai
RID_GEMINI_MODEL=gemini-1.5-pro

# --- News ---
RID_NEWSAPI_KEY=

# --- Auth ---
RID_SECRET_KEY=                         # Auto-generated if empty
RID_ADMIN_EMAIL=admin@local
RID_ADMIN_PASSWORD=admin

# --- Server ---
RID_PORT=8000
RID_HOST=0.0.0.0
RID_LOG_LEVEL=INFO
RID_RELOAD=false
```

### API Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` |
| Production | `https://yourdomain.com` |

### Default Ports

| Service | Port |
|---------|------|
| RID Backend | 8000 |
| Ollama | 11434 |
| React Frontend (dev) | 3000 |
